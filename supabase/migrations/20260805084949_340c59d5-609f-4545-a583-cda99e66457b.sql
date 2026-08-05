-- Audit table for role changes
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL CHECK (action IN ('granted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role audit admin read" ON public.role_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage roles
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

CREATE POLICY "user_roles admin read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND NOT (user_id = auth.uid() AND role = 'admin')
  );

-- Automatic audit trail
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (actor_user_id, target_user_id, role, action)
    VALUES (auth.uid(), NEW.user_id, NEW.role, 'granted');
    RETURN NEW;
  ELSE
    INSERT INTO public.role_audit_log (actor_user_id, target_user_id, role, action)
    VALUES (auth.uid(), OLD.user_id, OLD.role, 'revoked');
    RETURN OLD;
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_roles_audit_ins
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

CREATE TRIGGER user_roles_audit_del
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();