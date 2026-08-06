-- 1) blocked_slots: remove anonymous/public read access
DROP POLICY IF EXISTS "blocked public read" ON public.blocked_slots;

CREATE POLICY "blocked staff read"
ON public.blocked_slots
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

REVOKE SELECT ON public.blocked_slots FROM anon;

-- 2) Lock down internal SECURITY DEFINER trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
