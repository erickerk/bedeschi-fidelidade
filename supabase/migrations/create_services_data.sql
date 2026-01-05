-- ========================================
-- CRIAR TABELA SERVICES E POPULAR DADOS
-- ========================================
-- Execute via SQL Editor do Supabase

-- Criar tabela de serviços (se não existir)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Política permissiva para leitura
DROP POLICY IF EXISTS "Allow public read services" ON public.services;
CREATE POLICY "Allow public read services" ON public.services
  FOR SELECT USING (true);

-- Política permissiva para escrita (dev)
DROP POLICY IF EXISTS "Allow all write services" ON public.services;
CREATE POLICY "Allow all write services" ON public.services
  FOR ALL USING (true) WITH CHECK (true);

-- Limpar dados existentes para evitar duplicatas
DELETE FROM public.services WHERE true;

-- ========================================
-- INSERIR SERVIÇOS POR CATEGORIA
-- ========================================

-- CATEGORIA: Massagens
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('MA001', 'Massagem Relaxante 60min', 'cat-massagem', 'Massagens', 180.00, 60),
('MA002', 'Massagem Relaxante 90min', 'cat-massagem', 'Massagens', 250.00, 90),
('MA003', 'Massagem Modeladora', 'cat-massagem', 'Massagens', 220.00, 60),
('MA004', 'Massagem Drenagem Linfática', 'cat-massagem', 'Massagens', 200.00, 60),
('MA005', 'Massagem com Pedras Quentes', 'cat-massagem', 'Massagens', 280.00, 75),
('MA006', 'Massagem Desportiva', 'cat-massagem', 'Massagens', 190.00, 60),
('MA007', 'Massagem Terapêutica', 'cat-massagem', 'Massagens', 210.00, 60);

-- CATEGORIA: Facial
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('FA001', 'Limpeza de Pele Completa', 'cat-facial', 'Facial', 150.00, 60),
('FA002', 'Limpeza de Pele Profunda', 'cat-facial', 'Facial', 180.00, 75),
('FA003', 'Peeling Facial', 'cat-facial', 'Facial', 200.00, 45),
('FA004', 'Peeling Químico', 'cat-facial', 'Facial', 350.00, 60),
('FA005', 'Hidratação Facial', 'cat-facial', 'Facial', 120.00, 45),
('FA006', 'Revitalização Facial', 'cat-facial', 'Facial', 280.00, 60),
('FA007', 'Microagulhamento Facial', 'cat-facial', 'Facial', 450.00, 60),
('FA008', 'Radiofrequência Facial', 'cat-facial', 'Facial', 320.00, 45),
('FA009', 'LED Facial', 'cat-facial', 'Facial', 180.00, 30),
('FA010', 'Botox (por região)', 'cat-facial', 'Facial', 800.00, 30);

-- CATEGORIA: Corporal
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('CO001', 'Criolipólise (por área)', 'cat-corporal', 'Corporal', 500.00, 60),
('CO002', 'Radiofrequência Corporal', 'cat-corporal', 'Corporal', 280.00, 45),
('CO003', 'Ultracavitação', 'cat-corporal', 'Corporal', 250.00, 45),
('CO004', 'Carboxiterapia (sessão)', 'cat-corporal', 'Corporal', 200.00, 30),
('CO005', 'Endermologia', 'cat-corporal', 'Corporal', 180.00, 45),
('CO006', 'Manta Térmica', 'cat-corporal', 'Corporal', 120.00, 40),
('CO007', 'Lipocavitação', 'cat-corporal', 'Corporal', 230.00, 45),
('CO008', 'Drenagem Linfática Corporal', 'cat-corporal', 'Corporal', 180.00, 60);

-- CATEGORIA: Depilação
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('DE001', 'Depilação Perna Completa', 'cat-depilacao', 'Depilação', 120.00, 45),
('DE002', 'Depilação Meia Perna', 'cat-depilacao', 'Depilação', 70.00, 25),
('DE003', 'Depilação Virilha Completa', 'cat-depilacao', 'Depilação', 80.00, 30),
('DE004', 'Depilação Virilha Cavada', 'cat-depilacao', 'Depilação', 60.00, 20),
('DE005', 'Depilação Axila', 'cat-depilacao', 'Depilação', 35.00, 15),
('DE006', 'Depilação Braço Completo', 'cat-depilacao', 'Depilação', 55.00, 25),
('DE007', 'Depilação Buço', 'cat-depilacao', 'Depilação', 25.00, 10),
('DE008', 'Depilação Sobrancelha', 'cat-depilacao', 'Depilação', 30.00, 15),
('DE009', 'Depilação Costas', 'cat-depilacao', 'Depilação', 90.00, 30),
('DE010', 'Depilação a Laser (sessão)', 'cat-depilacao', 'Depilação', 350.00, 45);

-- CATEGORIA: Sobrancelhas
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('SO001', 'Design de Sobrancelhas', 'cat-sobrancelha', 'Sobrancelhas', 65.00, 30),
('SO002', 'Design + Henna', 'cat-sobrancelha', 'Sobrancelhas', 90.00, 45),
('SO003', 'Micropigmentação Sobrancelha', 'cat-sobrancelha', 'Sobrancelhas', 450.00, 120),
('SO004', 'Retoque Micropigmentação', 'cat-sobrancelha', 'Sobrancelhas', 250.00, 90),
('SO005', 'Brow Lamination', 'cat-sobrancelha', 'Sobrancelhas', 120.00, 45);

-- CATEGORIA: Cílios
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('CI001', 'Alongamento de Cílios Clássico', 'cat-cilios', 'Cílios', 280.00, 90),
('CI002', 'Alongamento de Cílios Volume', 'cat-cilios', 'Cílios', 350.00, 120),
('CI003', 'Manutenção Cílios', 'cat-cilios', 'Cílios', 150.00, 60),
('CI004', 'Remoção de Cílios', 'cat-cilios', 'Cílios', 50.00, 30),
('CI005', 'Lifting de Cílios', 'cat-cilios', 'Cílios', 150.00, 60),
('CI006', 'Lifting + Tintura', 'cat-cilios', 'Cílios', 180.00, 75);

-- CATEGORIA: Manicure/Pedicure
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('MN001', 'Manicure Simples', 'cat-manicure', 'Manicure/Pedicure', 35.00, 30),
('MN002', 'Manicure com Esmaltação em Gel', 'cat-manicure', 'Manicure/Pedicure', 65.00, 45),
('MN003', 'Pedicure Simples', 'cat-manicure', 'Manicure/Pedicure', 45.00, 40),
('MN004', 'Pedicure com Esmaltação em Gel', 'cat-manicure', 'Manicure/Pedicure', 75.00, 50),
('MN005', 'Mani + Pedi Completa', 'cat-manicure', 'Manicure/Pedicure', 70.00, 60),
('MN006', 'Alongamento de Unhas (Gel)', 'cat-manicure', 'Manicure/Pedicure', 180.00, 90),
('MN007', 'Manutenção Alongamento', 'cat-manicure', 'Manicure/Pedicure', 90.00, 60),
('MN008', 'Nail Art (por unha)', 'cat-manicure', 'Manicure/Pedicure', 15.00, 10);

-- CATEGORIA: Cabelos
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('CB001', 'Corte Feminino', 'cat-cabelo', 'Cabelos', 80.00, 45),
('CB002', 'Corte Masculino', 'cat-cabelo', 'Cabelos', 50.00, 30),
('CB003', 'Escova Progressiva', 'cat-cabelo', 'Cabelos', 350.00, 180),
('CB004', 'Hidratação Capilar', 'cat-cabelo', 'Cabelos', 120.00, 60),
('CB005', 'Cauterização', 'cat-cabelo', 'Cabelos', 180.00, 90),
('CB006', 'Coloração', 'cat-cabelo', 'Cabelos', 200.00, 120),
('CB007', 'Mechas/Luzes', 'cat-cabelo', 'Cabelos', 350.00, 180),
('CB008', 'Escova Simples', 'cat-cabelo', 'Cabelos', 60.00, 45),
('CB009', 'Botox Capilar', 'cat-cabelo', 'Cabelos', 250.00, 120);

-- CATEGORIA: Estética Avançada
INSERT INTO public.services (external_code, name, category_id, category_name, price, duration_minutes) VALUES
('EA001', 'Preenchimento Labial', 'cat-estetica', 'Estética Avançada', 1200.00, 45),
('EA002', 'Bioestimulador Facial', 'cat-estetica', 'Estética Avançada', 1500.00, 60),
('EA003', 'Harmonização Facial', 'cat-estetica', 'Estética Avançada', 2500.00, 90),
('EA004', 'Fios de PDO', 'cat-estetica', 'Estética Avançada', 1800.00, 60),
('EA005', 'Skinbooster', 'cat-estetica', 'Estética Avançada', 900.00, 45),
('EA006', 'Enzimas (por área)', 'cat-estetica', 'Estética Avançada', 400.00, 30);

-- ========================================
-- VERIFICAR INSERÇÃO
-- ========================================
SELECT 
  category_name, 
  COUNT(*) as total_servicos,
  MIN(price) as preco_min,
  MAX(price) as preco_max
FROM public.services 
WHERE is_active = true
GROUP BY category_name
ORDER BY category_name;

-- Mostrar total
SELECT 'Total de serviços cadastrados: ' || COUNT(*)::text as status FROM public.services;
