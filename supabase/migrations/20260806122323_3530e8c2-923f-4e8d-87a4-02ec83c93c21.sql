CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

GRANT SELECT ON public.doctor_availability TO anon;
GRANT SELECT ON public.doctor_availability TO authenticated;
GRANT ALL ON public.doctor_availability TO service_role;

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability public read" ON public.doctor_availability
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "availability admin write" ON public.doctor_availability
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER doctor_availability_updated
  BEFORE UPDATE ON public.doctor_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX doctor_availability_doctor_idx ON public.doctor_availability (doctor_id, weekday);

INSERT INTO public.doctor_availability (doctor_id, weekday, start_time, end_time)
SELECT d.id, w.weekday, w.start_time, w.end_time
FROM public.doctors d
CROSS JOIN (VALUES
  (1, TIME '09:00', TIME '13:00'),
  (1, TIME '14:00', TIME '19:00'),
  (2, TIME '09:00', TIME '13:00'),
  (2, TIME '14:00', TIME '19:00'),
  (3, TIME '09:00', TIME '13:00'),
  (3, TIME '14:00', TIME '19:00'),
  (4, TIME '09:00', TIME '13:00'),
  (4, TIME '14:00', TIME '19:00'),
  (5, TIME '09:00', TIME '13:00'),
  (5, TIME '14:00', TIME '17:00'),
  (6, TIME '09:00', TIME '13:00')
) AS w(weekday, start_time, end_time);