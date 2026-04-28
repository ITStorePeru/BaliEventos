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
  video_url TEXT,
  badge TEXT,
  date_time TEXT,
  artists TEXT,
  category TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que la columna video_url exista si la tabla fue creada previamente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='video_url') THEN
        ALTER TABLE events ADD COLUMN video_url TEXT;
    END IF;
END $$;

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

-- Limpiar políticas existentes para evitar errores 42710
DROP POLICY IF EXISTS "Lectura pública de eventos" ON events;
DROP POLICY IF EXISTS "Lectura pública de tipos de tickets" ON ticket_types;
DROP POLICY IF EXISTS "Lectura pública para configuración" ON site_settings;
DROP POLICY IF EXISTS "Inserción pública de pedidos" ON orders;
DROP POLICY IF EXISTS "Escritura permitida para admin panel" ON events;
DROP POLICY IF EXISTS "Escritura permitida para admin panel tickets" ON ticket_types;
DROP POLICY IF EXISTS "Escritura permitida para admin panel settings" ON site_settings;
DROP POLICY IF EXISTS "Escritura permitida para admin panel orders" ON orders;
DROP POLICY IF EXISTS "Lectura pública de administradores" ON admin_users;
DROP POLICY IF EXISTS "Escritura de administradores" ON admin_users;

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
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price;

INSERT INTO site_settings (id, data) VALUES
('brand', '{"name": "Bali", "logoUrl": "https://i.ibb.co/XZZMPkyL/logo.png", "useLogo": true}'),
('yape', '{"number": "999 000 111", "holder": "BALI EVENTOS SAC", "qrUrl": ""}'),
('seo', '{"title": "Bali - Eventos y Entradas", "description": "La plataforma líder en eventos culturales y de entretenimiento en Bali.", "keywords": "bali, eventos, entradas", "ogImage": ""}')
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

INSERT INTO events (id, title1, title2, event_date, venue, price, banner_image, video_url, badge, date_time, artists, category, is_visible) VALUES
(1, 'Neo Classic', 'Night', '18 OCT 2026', 'Opera de Bali', 65, 'https://picsum.photos/seed/opera/1200/800', 'https://itstore.pe/video/BALI_VIDEO.mp4', 'EXCLUSIVO', 'Dom 18 Octubre | 07:00 PM - 11:00 PM', 'Symphonic Orchestra', 'Classic', true),
(2, 'Underground', 'Series', '22 OCT 2026', 'The Vault Club', 40, 'https://picsum.photos/seed/vault/1200/800', '', 'UNDERGROUND', 'Jue 22 Octubre | 11:00 PM - 05:00 AM', 'Experimental DJs', 'Electronic', true),
(3, 'Jazz on', 'the Beach', '05 NOV 2026', 'Blue Lagoon', 55, 'https://picsum.photos/seed/jazz/1200/800', '', 'MUSICA EN VIVO', 'Jue 05 Noviembre | 06:00 PM - 10:00 PM', 'The Jazz Quartet', 'Jazz', true),
(4, 'Winter', 'Gala 2026', '12 NOV 2026', 'Palacio Real', 150, 'https://picsum.photos/seed/palace/1200/800', '', 'LUJO', 'Jue 12 Noviembre | 08:00 PM - 02:00 AM', 'Various Artists', 'Gala', true)
ON CONFLICT (id) DO UPDATE SET 
  title1 = EXCLUDED.title1,
  title2 = EXCLUDED.title2,
  event_date = EXCLUDED.event_date,
  venue = EXCLUDED.venue,
  price = EXCLUDED.price,
  banner_image = EXCLUDED.banner_image,
  video_url = EXCLUDED.video_url,
  badge = EXCLUDED.badge,
  date_time = EXCLUDED.date_time,
  artists = EXCLUDED.artists,
  category = EXCLUDED.category,
  is_visible = EXCLUDED.is_visible;

-- Sincronizar la secuencia de IDs
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));
