-- Fix handle_new_user trigger failures after remote schema sync (search_path + upsert)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant UUID;
  uname TEXT;
BEGIN
  SELECT id INTO default_tenant
  FROM public.tenants
  WHERE slug = COALESCE(current_setting('app.default_tenant_slug', true), 'solid-matbaa')
  LIMIT 1;

  IF default_tenant IS NULL THEN
    SELECT id INTO default_tenant FROM public.tenants ORDER BY created_at ASC LIMIT 1;
  END IF;

  uname := COALESCE(NEW.raw_user_meta_data->>'username', '');

  INSERT INTO public.profiles (
    id,
    tenant_id,
    email,
    full_name,
    locale,
    username,
    role,
    email_verified
  )
  VALUES (
    NEW.id,
    default_tenant,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar'),
    NULLIF(uname, ''),
    CASE WHEN uname = 'solid' THEN 'admin' ELSE 'customer' END,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    locale = EXCLUDED.locale,
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
