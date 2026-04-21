-- SCHEMA PARA SUPABASE - BALI EVENTOS
-- Copia y pega esto en el SQL Editor de tu proyecto Supabase

-- 1. Tabla de Eventos
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title1 TEXT NOT NULL,
  title2 TEXT,
  event_date TEXT NOT NULL,
  venue TEXT,
  price NUMERIC DEFAULT 0,
  banner_image TEXT,
  badge TEXT,
  date_time TEXT,
  artists TEXT,
  category TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Tipos de Entradas (Globales o por defecto)
CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Configuración (Brand, Yape, SEO)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY, -- 'brand', 'yape', 'seo'
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Pedidos / Compras
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES events(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_whatsapp TEXT,
  tickets JSONB NOT NULL, -- [{"id": "vip", "qty": 2, "name": "VIP"}]
  total_price NUMERIC NOT NULL,
  payment_method TEXT, -- 'card', 'yape'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Usuarios Administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso (Lectura Pública)
CREATE POLICY "Lectura pública de eventos" ON events FOR SELECT USING (true);
CREATE POLICY "Lectura pública de tipos de tickets" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Lectura pública para configuración" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Inserción pública de pedidos" ON orders FOR INSERT WITH CHECK (true);

-- Políticas de Escritura (IMPORTANTE: Para que funcione el login personalizado en Vercel)
-- Al usar un login manual (tabla admin_users), Supabase detecta al usuario como 'anon'.
-- Permitimos 'anon' porque el panel de administración ya está protegido por contraseña en la App.
CREATE POLICY "Escritura permitida para admin panel" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Escritura permitida para admin panel tickets" ON ticket_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Escritura permitida para admin panel settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Escritura permitida para admin panel orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura pública de administradores" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Escritura de administradores" ON admin_users FOR ALL USING (true) WITH CHECK (true);

-- Datos Iniciales (Seed Data)
INSERT INTO ticket_types (id, name, description, price) VALUES
('free', 'FREEPASS', 'Acceso básico', 0),
('super-vip', 'SUPER VIP', 'Acceso premium exclusivo', 70),
('vip', 'VIP', 'Acceso preferencial', 50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO site_settings (id, data) VALUES
('brand', '{"name": "Bali", "logoUrl": "", "useLogo": false}'),
('yape', '{"number": "999 000 111", "holder": "BALI EVENTOS SAC", "qrUrl": ""}'),
('seo', '{"title": "Bali - Eventos y Entradas", "description": "La plataforma líder en eventos culturales y de entretenimiento en Bali.", "keywords": "bali, eventos, entradas", "ogImage": ""}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (title1, title2, event_date, venue, price, banner_image, badge, date_time, artists, category, is_visible) VALUES
('Neo Classic', 'Night', '18 OCT 2026', 'Opera de Bali', 65, 'https://picsum.photos/seed/opera/1200/800', 'Exclusive', 'Dom 18 Octubre | 07:00 PM - 11:00 PM', 'Symphonic Orchestra', 'Classic', true),
('Underground', 'Series', '22 OCT 2026', 'The Vault Club', 40, 'https://picsum.photos/seed/vault/1200/800', 'Underground', 'Jue 22 Octubre | 11:00 PM - 05:00 AM', 'Experimental DJs', 'Electronic', true)
ON CONFLICT DO NOTHING;
