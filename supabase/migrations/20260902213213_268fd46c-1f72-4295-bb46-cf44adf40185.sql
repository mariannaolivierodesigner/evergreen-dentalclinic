ALTER TABLE public.blocked_slots
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recurrence_group_id uuid;

CREATE INDEX IF NOT EXISTS blocked_slots_recurrence_group_idx
  ON public.blocked_slots (recurrence_group_id);

CREATE OR REPLACE FUNCTION public.validate_blocked_slot_recurrence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recurrence NOT IN ('none','monthly','yearly') THEN
    RAISE EXCEPTION 'Ricorrenza non valida: %', NEW.recurrence;
  END IF;
  IF NEW.recurrence_count < 1 OR NEW.recurrence_count > 24 THEN
    RAISE EXCEPTION 'Numero di ripetizioni non valido';
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.validate_blocked_slot_recurrence() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS blocked_slots_recurrence_check ON public.blocked_slots;
CREATE TRIGGER blocked_slots_recurrence_check
  BEFORE INSERT OR UPDATE ON public.blocked_slots
  FOR EACH ROW EXECUTE FUNCTION public.validate_blocked_slot_recurrence();