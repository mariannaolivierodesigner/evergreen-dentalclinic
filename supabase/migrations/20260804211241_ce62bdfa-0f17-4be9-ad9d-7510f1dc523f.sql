DROP VIEW IF EXISTS public.busy_slots;
REVOKE SELECT ON public.appointments FROM anon;

CREATE OR REPLACE FUNCTION public.get_busy_slots(_doctor_id uuid, _from timestamptz, _to timestamptz)
RETURNS TABLE (doctor_id uuid, starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.doctor_id, a.starts_at, a.ends_at
  FROM public.appointments a
  WHERE a.status IN ('pending','confirmed')
    AND a.starts_at >= _from AND a.starts_at < _to
    AND (_doctor_id IS NULL OR a.doctor_id = _doctor_id)
  UNION ALL
  SELECT b.doctor_id, b.starts_at, b.ends_at
  FROM public.blocked_slots b
  WHERE b.starts_at >= _from AND b.starts_at < _to
    AND (_doctor_id IS NULL OR b.doctor_id = _doctor_id);
$$;

REVOKE ALL ON FUNCTION public.get_busy_slots(uuid, timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, timestamptz, timestamptz) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;