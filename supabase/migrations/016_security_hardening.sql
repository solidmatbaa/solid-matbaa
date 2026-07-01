-- Pre-launch RLS hardening: role escalation, tenant checks, admin profile reads

-- Ensure helper exists (may have been dropped by remote schema sync)
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

-- Profiles: admins can read all profiles; users read own row
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.auth_user_is_admin()
);

-- Profiles: users cannot self-promote or change tenant
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND tenant_id IS NOT DISTINCT FROM (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Orders: tenant must match caller profile
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert ON public.orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Returns: must belong to caller and match order ownership
DROP POLICY IF EXISTS returns_insert ON public.returns;
CREATE POLICY returns_insert ON public.returns FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
        AND o.tenant_id = returns.tenant_id
    )
  );

-- Products / order_items admin reads scoped to tenant
DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select ON public.products FOR SELECT USING (
  is_active = true
  OR (
    public.auth_user_is_admin()
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR (
          public.auth_user_is_admin()
          AND o.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        )
      )
  )
);

-- Signup trigger: never assign admin by username (admin bootstrap is server-only)
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
    'customer',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    locale = EXCLUDED.locale,
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  RETURN NEW;
END;
$$;
