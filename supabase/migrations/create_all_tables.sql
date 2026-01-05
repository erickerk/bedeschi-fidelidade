-- ========================================
-- CRIAR TODAS AS TABELAS NECESSÁRIAS
-- ========================================
-- Execute via SQL Editor do Supabase

-- ========================================
-- 1. TABELA DE CLIENTES
-- ========================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  pin TEXT NOT NULL,
  birth_date DATE,
  points_balance INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_pin ON public.customers(pin);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. TABELA DE ATENDIMENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  professional_id UUID REFERENCES public.staff_users(id) ON DELETE SET NULL,
  professional_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  has_review BOOLEAN DEFAULT FALSE,
  review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
  review_comment TEXT,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_has_review ON public.appointments(has_review);

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. TABELA DE AVALIAÇÕES
-- ========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON public.reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON public.reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Constraint única: um cliente só pode avaliar um atendimento uma vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_appointment 
  ON public.reviews(appointment_id, customer_id);

-- ========================================
-- 4. TABELA DE RECOMPENSAS
-- ========================================
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('FREE_SERVICE', 'DISCOUNT_FIXED', 'DISCOUNT_PERCENT', 'CREDIT')),
  value DECIMAL(10,2),
  service_name TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'expired')),
  expires_at DATE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rewards
CREATE INDEX IF NOT EXISTS idx_rewards_client ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_expires ON public.rewards(expires_at);

-- ========================================
-- 5. HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (ajustar em produção)
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
CREATE POLICY "Allow all operations on customers" 
  ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on appointments" ON public.appointments;
CREATE POLICY "Allow all operations on appointments" 
  ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on reviews" ON public.reviews;
CREATE POLICY "Allow all operations on reviews" 
  ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on rewards" ON public.rewards;
CREATE POLICY "Allow all operations on rewards" 
  ON public.rewards FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 6. INSERIR CLIENTES DE EXEMPLO
-- ========================================
INSERT INTO public.customers (name, phone, email, pin, points_balance, total_spent, total_appointments) VALUES
('Maria Silva Santos', '11987654321', 'maria.silva@email.com', '1234', 450, 1350.00, 5),
('Ana Paula Oliveira', '11976543210', 'ana.oliveira@email.com', '5678', 320, 960.00, 4),
('Juliana Costa Lima', '11965432109', 'juliana.lima@email.com', '9012', 580, 1740.00, 7),
('Carla Mendes Souza', '11954321098', 'carla.mendes@email.com', '3456', 210, 630.00, 3),
('Patricia Alves Rocha', '11943210987', 'patricia.alves@email.com', '7890', 890, 2670.00, 10)
ON CONFLICT (phone) DO NOTHING;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Execute no SQL Editor do Supabase
-- Todas as tabelas serão criadas com índices e RLS habilitado

SELECT 'Tabelas criadas com sucesso!' AS status;
