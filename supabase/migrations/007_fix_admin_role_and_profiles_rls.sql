-- Fix admin profile + profiles RLS (self-referential policy could block reads)

CREATE OR REPLACE FUNCTION public.auth_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  id = auth.uid() OR public.auth_user_is_admin()
);

UPDATE public.profiles
SET
  role = 'admin',
  username = COALESCE(NULLIF(username, ''), 'solid'),
  email = COALESCE(NULLIF(email, ''), 'solid.matbaa@gmail.com'),
  email_verified = true,
  updated_at = NOW()
WHERE email ILIKE 'solid.matbaa@gmail.com'
   OR username = 'solid';
