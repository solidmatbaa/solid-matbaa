-- Add username, email verification, and site content fields

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_verification_tokens(token);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_content JSONB DEFAULT '{
  "hero_title": {"en":"Elevate Your Brand","ar":"ارتقِ بعلامتك التجارية إلى مستوى أعلى","tr":"Markanızı Bir Üst Seviyeye Taşıyın"},
  "hero_subtitle": {"en":"Exclusive thank-you cards with luxury design. Explore our ready-made cards starting from 100 pieces, or upload your own design for custom printing services.","ar":"بطاقات شكر حصرية بتصميم فاخر. استكشف بطاقاتنا الجاهزة ابتداءً من 100 قطعة، أو ارفع تصميمك الخاص للحصول على خدمات طباعة مخصصة.","tr":"Lüks tasarımlı özel teşekkür kartları. 100 adetten başlayan hazır kartlarımızı keşfedin veya özel baskı için kendi tasarımınızı yükleyin."},
  "hero_button_designs": {"en":"Our Designs","ar":"تصاميمنا","tr":"Tasarımlarımız"},
  "hero_button_custom": {"en":"Custom Printing","ar":"طباعة مخصصة","tr":"Özel Baskı"},
  "instagram_url": "https://instagram.com/solidmatbaa",
  "facebook_url": "https://facebook.com/solidmatbaa"
}';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Update profile trigger to handle username and admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant UUID;
  uname TEXT;
BEGIN
  SELECT id INTO default_tenant FROM tenants WHERE slug = 'solid-matbaa' LIMIT 1;
  uname := COALESCE(NEW.raw_user_meta_data->>'username', '');
  INSERT INTO profiles (id, tenant_id, email, full_name, locale, username, role, email_verified)
  VALUES (
    NEW.id,
    default_tenant,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar'),
    NULLIF(uname, ''),
    CASE WHEN uname = 'solid' THEN 'admin' ELSE 'customer' END,
    COALESCE((NEW.email_confirmed_at IS NOT NULL), false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for email tokens (service role only via API)
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
