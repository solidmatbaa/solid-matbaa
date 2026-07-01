-- Solid Matbaa: Multi-tenant ready schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANTS (multi-tenant foundation)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'ar', 'tr')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name JSONB NOT NULL DEFAULT '{"en":"","ar":"","tr":""}',
  description JSONB NOT NULL DEFAULT '{"en":"","ar":"","tr":""}',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  sizes JSONB DEFAULT '[]',
  specs JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS (unique Order ID as primary key)
-- ============================================================
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped',
    'delivered', 'returned', 'refund_processed', 'cancelled'
  )),
  order_type TEXT NOT NULL DEFAULT 'standard' CHECK (order_type IN ('standard', 'custom')),
  is_archived BOOLEAN DEFAULT false,
  shipping_address JSONB,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_active ON orders(user_id, is_archived, status);
CREATE INDEX idx_orders_tenant_active ON orders(tenant_id, is_archived, status);
CREATE INDEX idx_orders_type ON orders(order_type, is_archived);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name JSONB,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  specs JSONB DEFAULT '{}',
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- RETURNS
-- ============================================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'delivered'
  )),
  is_archived BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_returns_active ON returns(tenant_id, is_archived, status);
CREATE INDEX idx_returns_order ON returns(order_id);

-- ============================================================
-- NOTIFICATIONS (in-site)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title JSONB NOT NULL DEFAULT '{"en":"","ar":"","tr":""}',
  message JSONB NOT NULL DEFAULT '{"en":"","ar":"","tr":""}',
  read BOOLEAN DEFAULT false,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ============================================================
-- SETTINGS (per tenant)
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hero_images JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',
  iban TEXT,
  contact_info JSONB DEFAULT '{"email":"","phone":"","address":{"en":"","ar":"","tr":""}}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ID SEQUENCE
-- ============================================================
CREATE SEQUENCE order_id_seq START 1000;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate unique order ID: SM-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
BEGIN
  seq_val := nextval('order_id_seq');
  RETURN 'SM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-archive delivered/returned orders
CREATE OR REPLACE FUNCTION archive_order_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('delivered', 'returned', 'refund_processed') THEN
    NEW.is_archived := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_order
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION archive_order_on_status_change();

-- Auto-archive delivered returns
CREATE OR REPLACE FUNCTION archive_return_on_delivered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' THEN
    NEW.is_archived := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_return
  BEFORE UPDATE ON returns
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION archive_return_on_delivered();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant UUID;
BEGIN
  SELECT id INTO default_tenant FROM tenants WHERE slug = 'solid-matbaa' LIMIT 1;
  INSERT INTO profiles (id, tenant_id, email, full_name, locale)
  VALUES (
    NEW.id,
    default_tenant,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own, admins read all in tenant
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = profiles.tenant_id)
);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- Products: public read active, admin full access
CREATE POLICY products_select ON products FOR SELECT USING (
  is_active = true OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY products_admin ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = products.tenant_id)
);

-- Orders: users see own, admins see tenant
CREATE POLICY orders_select ON orders FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = orders.tenant_id)
);
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_admin_update ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = orders.tenant_id)
);

-- Order items: via order ownership
CREATE POLICY order_items_select ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (
    o.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ))
);
CREATE POLICY order_items_insert ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

-- Returns
CREATE POLICY returns_select ON returns FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = returns.tenant_id)
);
CREATE POLICY returns_insert ON returns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY returns_admin ON returns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = returns.tenant_id)
);

-- Notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Settings: public read, admin write
CREATE POLICY settings_select ON settings FOR SELECT USING (true);
CREATE POLICY settings_admin ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.tenant_id = settings.tenant_id)
);

-- Tenants: public read
CREATE POLICY tenants_select ON tenants FOR SELECT USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO tenants (name, slug) VALUES ('Solid Matbaa', 'solid-matbaa');

INSERT INTO settings (tenant_id, hero_images, sizes, iban, contact_info)
SELECT id,
  '["/images/hero-1.jpg", "/images/hero-2.jpg"]',
  '["A4", "A5", "A3", "Custom"]',
  'TR00 0000 0000 0000 0000 0000 00',
  '{"email":"info@solidmatbaa.com","phone":"+90 XXX XXX XXXX","address":{"en":"Istanbul, Turkey","ar":"إسطنبول، تركيا","tr":"İstanbul, Türkiye"}}'
FROM tenants WHERE slug = 'solid-matbaa';

INSERT INTO products (tenant_id, name, description, price, image_url, sizes, specs)
SELECT t.id,
  '{"en":"Business Cards","ar":"بطاقات أعمال","tr":"Kartvizit"}',
  '{"en":"Premium quality business cards","ar":"بطاقات أعمال عالية الجودة","tr":"Premium kalite kartvizitler"}',
  49.99,
  '/images/product-cards.jpg',
  '["Standard", "Premium"]',
  '[{"key":"finish","label":{"en":"Finish","ar":"التشطيب","tr":"Kaplama"},"options":["Matte","Glossy"]}]'
FROM tenants t WHERE t.slug = 'solid-matbaa';

INSERT INTO products (tenant_id, name, description, price, image_url, sizes, specs)
SELECT t.id,
  '{"en":"Flyers & Brochures","ar":"منشورات وكتيبات","tr":"El İlanları ve Broşürler"}',
  '{"en":"Full-color printing for marketing materials","ar":"طباعة ملونة كاملة للمواد التسويقية","tr":"Pazarlama materyalleri için tam renkli baskı"}',
  89.99,
  '/images/product-flyers.jpg',
  '["A4", "A5", "A6"]',
  '[{"key":"paper","label":{"en":"Paper","ar":"الورق","tr":"Kağıt"},"options":["80gsm","120gsm","200gsm"]}]'
FROM tenants t WHERE t.slug = 'solid-matbaa';

INSERT INTO products (tenant_id, name, description, price, image_url, sizes, specs)
SELECT t.id,
  '{"en":"Custom Print Order","ar":"طلب طباعة مخصص","tr":"Özel Baskı Siparişi"}',
  '{"en":"Request a fully customized print job","ar":"اطلب عمل طباعة مخصص بالكامل","tr":"Tamamen özelleştirilmiş baskı işi talep edin"}',
  0,
  '/images/product-custom.jpg',
  '["Custom"]',
  '[]'
FROM tenants t WHERE t.slug = 'solid-matbaa';
