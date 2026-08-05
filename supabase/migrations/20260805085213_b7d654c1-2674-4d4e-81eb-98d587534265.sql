DROP POLICY "services public read" ON public.services;

CREATE POLICY "services public read" ON public.services
  FOR SELECT TO anon, authenticated
  USING (published);

CREATE POLICY "services staff read" ON public.services
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));