CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'conflict',
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_patient_idx
  ON public.notifications (patient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications own read"
ON public.notifications FOR SELECT TO authenticated
USING (
  public.is_staff(auth.uid())
  OR patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "notifications staff insert"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "notifications own update"
ON public.notifications FOR UPDATE TO authenticated
USING (
  public.is_staff(auth.uid())
  OR patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
)
WITH CHECK (
  public.is_staff(auth.uid())
  OR patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
);