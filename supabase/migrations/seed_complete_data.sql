-- Script para popular banco com dados de teste completos
-- Clientes, Agendamentos e Avaliações

-- Inserir clientes de teste
INSERT INTO public.customers (tenant, name, email, phone, cpf, birth_date, points, total_spent, loyalty_tier, created_at)
VALUES 
  ('bedeschi', 'Maria Silva', 'maria.silva@email.com', '(11) 98765-4321', '123.456.789-01', '1985-03-15', 150, 450.00, 'gold', NOW() - INTERVAL '6 months'),
  ('bedeschi', 'Ana Souza', 'ana.souza@email.com', '(11) 98765-4322', '234.567.890-12', '1990-07-22', 80, 240.00, 'silver', NOW() - INTERVAL '4 months'),
  ('bedeschi', 'Beatriz Costa', 'beatriz.costa@email.com', '(11) 98765-4323', '345.678.901-23', '1988-11-10', 200, 600.00, 'platinum', NOW() - INTERVAL '8 months'),
  ('bedeschi', 'Carla Mendes', 'carla.mendes@email.com', '(11) 98765-4324', '456.789.012-34', '1992-05-18', 50, 150.00, 'bronze', NOW() - INTERVAL '2 months'),
  ('bedeschi', 'Diana Oliveira', 'diana.oliveira@email.com', '(11) 98765-4325', '567.890.123-45', '1987-09-25', 120, 360.00, 'gold', NOW() - INTERVAL '5 months'),
  ('bedeschi', 'Elisa Rodrigues', 'elisa.rodrigues@email.com', '(11) 98765-4326', '678.901.234-56', '1995-01-30', 30, 90.00, 'bronze', NOW() - INTERVAL '1 month'),
  ('bedeschi', 'Fernanda Lima', 'fernanda.lima@email.com', '(11) 98765-4327', '789.012.345-67', '1991-12-08', 180, 540.00, 'platinum', NOW() - INTERVAL '7 months'),
  ('bedeschi', 'Gabriela Santos', 'gabriela.santos@email.com', '(11) 98765-4328', '890.123.456-78', '1989-04-14', 100, 300.00, 'silver', NOW() - INTERVAL '3 months')
ON CONFLICT (email) DO NOTHING;

-- Buscar IDs dos profissionais para criar agendamentos
DO $$
DECLARE
  v_admin_id UUID;
  v_amanda_id UUID;
  v_carla_id UUID;
  v_juliana_id UUID;
  v_patricia_id UUID;
  v_maria_id UUID;
  v_ana_id UUID;
  v_beatriz_id UUID;
  v_diana_id UUID;
BEGIN
  -- Buscar IDs dos profissionais
  SELECT id INTO v_amanda_id FROM staff_users WHERE email = 'dra.amanda@bedeschi.com';
  SELECT id INTO v_carla_id FROM staff_users WHERE email = 'carla.santos@bedeschi.com';
  SELECT id INTO v_juliana_id FROM staff_users WHERE email = 'juliana.lima@bedeschi.com';
  
  -- Buscar IDs dos clientes
  SELECT id INTO v_maria_id FROM customers WHERE email = 'maria.silva@email.com';
  SELECT id INTO v_ana_id FROM customers WHERE email = 'ana.souza@email.com';
  SELECT id INTO v_beatriz_id FROM customers WHERE email = 'beatriz.costa@email.com';
  SELECT id INTO v_diana_id FROM customers WHERE email = 'diana.oliveira@email.com';

  -- Inserir agendamentos passados (para gerar histórico)
  IF v_amanda_id IS NOT NULL AND v_maria_id IS NOT NULL THEN
    INSERT INTO appointments (tenant, customer_id, professional_id, service_name, service_price, appointment_date, status, notes, created_at)
    VALUES 
      ('bedeschi', v_maria_id, v_amanda_id, 'Peeling Químico', 450.00, NOW() - INTERVAL '2 months', 'completed', 'Ótimo resultado', NOW() - INTERVAL '2 months'),
      ('bedeschi', v_beatriz_id, v_amanda_id, 'Botox', 600.00, NOW() - INTERVAL '1 month', 'completed', 'Cliente muito satisfeita', NOW() - INTERVAL '1 month');
  END IF;

  IF v_carla_id IS NOT NULL AND v_ana_id IS NOT NULL THEN
    INSERT INTO appointments (tenant, customer_id, professional_id, service_name, service_price, appointment_date, status, notes, created_at)
    VALUES 
      ('bedeschi', v_ana_id, v_carla_id, 'Massagem Relaxante', 240.00, NOW() - INTERVAL '3 weeks', 'completed', 'Excelente atendimento', NOW() - INTERVAL '3 weeks'),
      ('bedeschi', v_diana_id, v_carla_id, 'Drenagem Linfática', 360.00, NOW() - INTERVAL '2 weeks', 'completed', 'Muito profissional', NOW() - INTERVAL '2 weeks');
  END IF;

  IF v_juliana_id IS NOT NULL AND v_maria_id IS NOT NULL THEN
    INSERT INTO appointments (tenant, customer_id, professional_id, service_name, service_price, appointment_date, status, notes, created_at)
    VALUES 
      ('bedeschi', v_maria_id, v_juliana_id, 'Depilação a Laser', 300.00, NOW() - INTERVAL '1 week', 'completed', 'Processo indolor', NOW() - INTERVAL '1 week');
  END IF;

  -- Inserir avaliações
  IF v_amanda_id IS NOT NULL THEN
    INSERT INTO reviews (tenant, customer_id, professional_id, rating, comment, created_at)
    VALUES 
      ('bedeschi', v_maria_id, v_amanda_id, 5, 'Dra. Amanda é excepcional! Muito cuidadosa e atenciosa.', NOW() - INTERVAL '1 month'),
      ('bedeschi', v_beatriz_id, v_amanda_id, 5, 'Resultado incrível! Super recomendo.', NOW() - INTERVAL '3 weeks');
  END IF;

  IF v_carla_id IS NOT NULL THEN
    INSERT INTO reviews (tenant, customer_id, professional_id, rating, comment, created_at)
    VALUES 
      ('bedeschi', v_ana_id, v_carla_id, 5, 'Massagem maravilhosa! Saí renovada.', NOW() - INTERVAL '2 weeks'),
      ('bedeschi', v_diana_id, v_carla_id, 4, 'Muito boa! Ambiente tranquilo e profissional competente.', NOW() - INTERVAL '1 week');
  END IF;

  IF v_juliana_id IS NOT NULL THEN
    INSERT INTO reviews (tenant, customer_id, professional_id, rating, comment, created_at)
    VALUES 
      ('bedeschi', v_maria_id, v_juliana_id, 5, 'Juliana é ótima! Depilação perfeita e sem dor.', NOW() - INTERVAL '5 days');
  END IF;

END $$;

-- Verificar dados inseridos
SELECT 'Clientes cadastrados:' as info, COUNT(*) as total FROM customers WHERE tenant = 'bedeschi';
SELECT 'Agendamentos criados:' as info, COUNT(*) as total FROM appointments WHERE tenant = 'bedeschi';
SELECT 'Avaliações registradas:' as info, COUNT(*) as total FROM reviews WHERE tenant = 'bedeschi';
