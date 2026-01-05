-- ========================================
-- SEED: Clientes e Avaliações de Exemplo
-- ========================================
-- Este script popula o banco com clientes e suas avaliações
-- Execute via SQL Editor do Supabase após rodar as migrations principais

-- IMPORTANTE: Este script usa dados MOCK para demonstração
-- Os dados reais virão do contexto da aplicação React

-- Criar tabela de clientes (se não existir)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  pin TEXT NOT NULL,
  points_balance INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de atendimentos (se não existir)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  staff_id UUID REFERENCES public.staff_users(id),
  staff_name TEXT NOT NULL,
  service_names TEXT[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'completed',
  has_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de avaliações (se não existir)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  appointment_id UUID REFERENCES public.appointments(id),
  staff_id UUID REFERENCES public.staff_users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INSERIR CLIENTES DE EXEMPLO
-- ========================================
INSERT INTO public.customers (name, phone, email, pin, points_balance, total_spent, total_appointments) VALUES
('Maria Silva Santos', '11987654321', 'maria.silva@email.com', '1234', 450, 1350.00, 5),
('Ana Paula Oliveira', '11976543210', 'ana.oliveira@email.com', '5678', 320, 960.00, 4),
('Juliana Costa Lima', '11965432109', 'juliana.lima@email.com', '9012', 580, 1740.00, 7),
('Carla Mendes Souza', '11954321098', 'carla.mendes@email.com', '3456', 210, 630.00, 3),
('Patricia Alves Rocha', '11943210987', 'patricia.alves@email.com', '7890', 890, 2670.00, 10),
('Fernanda Dias Castro', '11932109876', 'fernanda.dias@email.com', '2345', 150, 450.00, 2),
('Beatriz Santos Ferreira', '11921098765', 'beatriz.santos@email.com', '6789', 420, 1260.00, 6),
('Camila Rodrigues Martins', '11910987654', 'camila.rodrigues@email.com', '0123', 670, 2010.00, 8),
('Renata Pereira Souza', '11909876543', 'renata.pereira@email.com', '4567', 95, 285.00, 1),
('Luciana Gomes Silva', '11998765432', 'luciana.gomes@email.com', '8901', 530, 1590.00, 6)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- INSERIR ATENDIMENTOS E AVALIAÇÕES
-- ========================================
-- Buscar IDs de profissionais para vincular atendimentos
DO $$
DECLARE
  v_customer1_id UUID;
  v_customer2_id UUID;
  v_customer3_id UUID;
  v_customer4_id UUID;
  v_customer5_id UUID;
  v_staff1_id UUID;
  v_staff2_id UUID;
  v_staff3_id UUID;
  v_appointment1_id UUID;
  v_appointment2_id UUID;
  v_appointment3_id UUID;
  v_appointment4_id UUID;
  v_appointment5_id UUID;
BEGIN
  -- Buscar IDs dos clientes
  SELECT id INTO v_customer1_id FROM public.customers WHERE phone = '11987654321' LIMIT 1;
  SELECT id INTO v_customer2_id FROM public.customers WHERE phone = '11976543210' LIMIT 1;
  SELECT id INTO v_customer3_id FROM public.customers WHERE phone = '11965432109' LIMIT 1;
  SELECT id INTO v_customer4_id FROM public.customers WHERE phone = '11954321098' LIMIT 1;
  SELECT id INTO v_customer5_id FROM public.customers WHERE phone = '11943210987' LIMIT 1;

  -- Buscar IDs dos profissionais (médicos e profissionais)
  SELECT id INTO v_staff1_id FROM public.staff_users WHERE role = 'medico' LIMIT 1;
  SELECT id INTO v_staff2_id FROM public.staff_users WHERE role = 'profissional' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_staff3_id FROM public.staff_users WHERE role = 'profissional' ORDER BY created_at DESC LIMIT 1;

  -- Se não houver profissionais, usar o admin como fallback
  IF v_staff1_id IS NULL THEN
    SELECT id INTO v_staff1_id FROM public.staff_users WHERE role = 'admin' LIMIT 1;
  END IF;
  IF v_staff2_id IS NULL THEN
    SELECT id INTO v_staff2_id FROM public.staff_users WHERE role = 'admin' LIMIT 1;
  END IF;
  IF v_staff3_id IS NULL THEN
    SELECT id INTO v_staff3_id FROM public.staff_users WHERE role = 'admin' LIMIT 1;
  END IF;

  -- Inserir atendimentos
  INSERT INTO public.appointments (customer_id, staff_id, staff_name, service_names, total_amount, points_earned, appointment_date, appointment_time, status, has_review)
  VALUES
  (v_customer1_id, v_staff1_id, 'Dra. Amanda Costa', ARRAY['Harmonização Facial', 'Peeling Facial'], 650.00, 650, CURRENT_DATE - INTERVAL '5 days', '10:00', 'completed', true),
  (v_customer2_id, v_staff2_id, 'Carla Santos', ARRAY['Massagem Relaxante 60min'], 180.00, 180, CURRENT_DATE - INTERVAL '3 days', '14:30', 'completed', true),
  (v_customer3_id, v_staff3_id, 'Juliana Lima', ARRAY['Depilação Perna Completa', 'Design de Sobrancelhas'], 185.00, 185, CURRENT_DATE - INTERVAL '2 days', '16:00', 'completed', true),
  (v_customer4_id, v_staff1_id, 'Dra. Amanda Costa', ARRAY['Limpeza de Pele', 'Peeling Facial'], 350.00, 350, CURRENT_DATE - INTERVAL '1 day', '11:00', 'completed', true),
  (v_customer5_id, v_staff2_id, 'Carla Santos', ARRAY['Massagem Modeladora', 'Drenagem Linfática'], 420.00, 420, CURRENT_DATE, '09:00', 'completed', true)
  RETURNING id INTO v_appointment1_id;

  -- Buscar IDs dos atendimentos criados
  SELECT id INTO v_appointment1_id FROM public.appointments WHERE customer_id = v_customer1_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appointment2_id FROM public.appointments WHERE customer_id = v_customer2_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appointment3_id FROM public.appointments WHERE customer_id = v_customer3_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appointment4_id FROM public.appointments WHERE customer_id = v_customer4_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appointment5_id FROM public.appointments WHERE customer_id = v_customer5_id ORDER BY created_at DESC LIMIT 1;

  -- Inserir avaliações
  INSERT INTO public.reviews (customer_id, appointment_id, staff_id, rating, comment)
  VALUES
  (v_customer1_id, v_appointment1_id, v_staff1_id, 5, 'Excelente profissional! Resultado além das expectativas. Super recomendo!'),
  (v_customer2_id, v_appointment2_id, v_staff2_id, 5, 'Massagem maravilhosa! Saí renovada e muito relaxada.'),
  (v_customer3_id, v_appointment3_id, v_staff3_id, 4, 'Muito bom atendimento. Profissional atenciosa e cuidadosa.'),
  (v_customer4_id, v_appointment4_id, v_staff1_id, 5, 'Dra. Amanda é incrível! Pele ficou perfeita. Voltarei com certeza.'),
  (v_customer5_id, v_appointment5_id, v_staff2_id, 5, 'Maravilhoso! Melhor massagem que já fiz. Carla é excelente!')
  ON CONFLICT DO NOTHING;

END $$;

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_pin ON public.customers(pin);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON public.reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON public.reviews(appointment_id);

-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (ajustar conforme necessário)
CREATE POLICY "Allow public read access on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public read access on appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT USING (true);

-- Políticas de escrita (ajustar conforme necessário)
CREATE POLICY "Allow insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert on reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Os clientes e avaliações aparecerão no dashboard
