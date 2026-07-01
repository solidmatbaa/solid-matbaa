-- Admin user bootstrap (profile side)
-- Auth user solid.matbaa@gmail.com is created server-side via src/lib/admin-init.ts
-- on application startup or POST /api/admin/init (requires ADMIN_INIT_SECRET).

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Ensure role constraint supports admin (already in 001_initial_schema.sql)
COMMENT ON COLUMN profiles.role IS 'customer | admin — default admin: username solid, email solid.matbaa@gmail.com';
