ALTER TABLE public.blocked_slots
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS blocked_slots_updated ON public.blocked_slots;
CREATE TRIGGER blocked_slots_updated
BEFORE UPDATE ON public.blocked_slots
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.blocked_slots_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_slot_id uuid NOT NULL,
  actor_user_id uuid,
  action text NOT NULL CHECK (action IN ('created','updated','deleted')),
  doctor_id uuid,
  old_starts_at timestamptz,
  old_ends_at timestamptz,
  old_reason text,
  new_starts_at timestamptz,
  new_ends_at timestamptz,
  new_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blocked_slots_audit_created_idx
  ON public.blocked_slots_audit_log (created_at DESC);

GRANT SELECT ON public.blocked_slots_audit_log TO authenticated;
GRANT ALL ON public.blocked_slots_audit_log TO service_role;

ALTER TABLE public.blocked_slots_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked audit admin read"
ON public.blocked_slots_audit_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.log_blocked_slot_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.blocked_slots_audit_log
      (blocked_slot_id, actor_user_id, action, doctor_id, new_starts_at, new_ends_at, new_reason)
    VALUES (NEW.id, auth.uid(), 'created', NEW.doctor_id, NEW.starts_at, NEW.ends_at, NEW.reason);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.blocked_slots_audit_log
      (blocked_slot_id, actor_user_id, action, doctor_id,
       old_starts_at, old_ends_at, old_reason, new_starts_at, new_ends_at, new_reason)
    VALUES (NEW.id, auth.uid(), 'updated', NEW.doctor_id,
       OLD.starts_at, OLD.ends_at, OLD.reason, NEW.starts_at, NEW.ends_at, NEW.reason);
    RETURN NEW;
  ELSE
    INSERT INTO public.blocked_slots_audit_log
      (blocked_slot_id, actor_user_id, action, doctor_id, old_starts_at, old_ends_at, old_reason)
    VALUES (OLD.id, auth.uid(), 'deleted', OLD.doctor_id, OLD.starts_at, OLD.ends_at, OLD.reason);
    RETURN OLD;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.log_blocked_slot_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS blocked_slots_audit_ins ON public.blocked_slots;
CREATE TRIGGER blocked_slots_audit_ins
AFTER INSERT ON public.blocked_slots
FOR EACH ROW EXECUTE FUNCTION public.log_blocked_slot_change();

DROP TRIGGER IF EXISTS blocked_slots_audit_upd ON public.blocked_slots;
CREATE TRIGGER blocked_slots_audit_upd
AFTER UPDATE ON public.blocked_slots
FOR EACH ROW EXECUTE FUNCTION public.log_blocked_slot_change();

DROP TRIGGER IF EXISTS blocked_slots_audit_del ON public.blocked_slots;
CREATE TRIGGER blocked_slots_audit_del
AFTER DELETE ON public.blocked_slots
FOR EACH ROW EXECUTE FUNCTION public.log_blocked_slot_change();