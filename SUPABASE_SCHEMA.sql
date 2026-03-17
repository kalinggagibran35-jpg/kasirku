-- ============================================
-- BAJU BODO POS SYSTEM - SCHEMA LENGKAP
-- Jalankan file INI SAJA di Supabase SQL Editor
-- (Tidak perlu jalankan LICENSE_SCHEMA.sql lagi)
-- ============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('admin', 'kasir')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Baju Bodo',
  description TEXT DEFAULT '',
  price_sell NUMERIC NOT NULL DEFAULT 0,
  price_rent NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  size TEXT DEFAULT 'M',
  color TEXT DEFAULT '',
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('sale', 'rental')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  cashier_id TEXT,
  cashier_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  rental_start TIMESTAMPTZ,
  rental_end TIMESTAMPTZ,
  rental_status TEXT CHECK (rental_status IN ('active', 'returned', 'overdue')),
  deposit NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_rental ON transactions(rental_status) WHERE type = 'rental';

-- 4. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT DEFAULT '',
  store_subtitle TEXT DEFAULT '',
  store_logo TEXT DEFAULT '',
  store_address TEXT DEFAULT '',
  store_phone TEXT DEFAULT '',
  store_email TEXT DEFAULT '',
  receipt_footer TEXT DEFAULT 'Terima kasih atas kunjungan Anda!'
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. LICENSES TABLE
-- Menggunakan TEXT id agar konsisten dengan kode TypeScript
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_email TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'professional' CHECK (tier IN ('starter', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  domain_bound TEXT DEFAULT '',
  device_fingerprint TEXT DEFAULT '',
  max_products INTEGER NOT NULL DEFAULT 500,
  max_users INTEGER NOT NULL DEFAULT 10,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT '',
  watermark_id TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(buyer_email);
CREATE INDEX IF NOT EXISTS idx_licenses_domain ON licenses(domain_bound);

-- 6. LICENSE LOGS TABLE
-- Menggunakan TEXT license_id agar konsisten dengan licenses.id TEXT
CREATE TABLE IF NOT EXISTS license_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id TEXT REFERENCES licenses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_license_logs_license ON license_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_license_logs_action ON license_logs(action);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (aplikasi mengelola auth sendiri)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_settings' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON store_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='licenses' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON licenses FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='license_logs' AND policyname='Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON license_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- FUNCTION: Auto-expire licenses
-- ============================================
CREATE OR REPLACE FUNCTION auto_expire_licenses()
RETURNS void AS $$
BEGIN
  UPDATE licenses
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SELESAI. Setup Wizard akan membuat akun
-- admin pertama saat aplikasi dibuka.
-- ============================================
