-- Script SQL para popular dados de exemplo
-- Execute via Supabase Studio > SQL Editor
-- OU via: psql -h ... -f supabase/seed-manual.sql

-- 1. SERVIÇOS (se ainda não existirem)
INSERT INTO fidelity_services (external_code, name, category_id, category_name, price, duration_minutes)
VALUES
  ('EST001', 'Limpeza de Pele Profunda', 'cat-estetica-facial', 'Estética Facial', 180.00, 60),
  ('EST002', 'Peeling Químico', 'cat-estetica-facial', 'Estética Facial', 320.00, 45),
  ('EST003', 'Microagulhamento', 'cat-estetica-facial', 'Estética Facial', 450.00, 90),
  ('EST004', 'Hidratação Facial', 'cat-estetica-facial', 'Estética Facial', 220.00, 60),
  ('EST005', 'Drenagem Linfática', 'cat-estetica-corporal', 'Estética Corporal', 150.00, 60),
  ('EST006', 'Massagem Modeladora', 'cat-estetica-corporal', 'Estética Corporal', 180.00, 60),
  ('EST007', 'Criolipólise', 'cat-estetica-corporal', 'Estética Corporal', 680.00, 90),
  ('MED001', 'Toxina Botulínica (Botox)', 'cat-procedimentos-medicos', 'Procedimentos Médicos', 1200.00, 30),
  ('MED002', 'Preenchimento Facial', 'cat-procedimentos-medicos', 'Procedimentos Médicos', 1500.00, 45),
  ('DEP001', 'Depilação a Laser - Axilas', 'cat-depilacao', 'Depilação', 120.00, 20),
  ('DEP002', 'Depilação a Laser - Pernas', 'cat-depilacao', 'Depilação', 280.00, 45)
ON CONFLICT (external_code) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  duration_minutes = EXCLUDED.duration_minutes;

-- 2. EQUIPE (Staff Users)
-- Nota: password_hash é um hash bcrypt de exemplo - em produção, use hash real
INSERT INTO staff_users (email, name, role, specialty, password_hash, is_active)
VALUES
  ('raul@bedeschi.com.br', 'Raul Bedeschi', 'admin', NULL, '$2a$10$ExampleHashHere', true),
  ('recepcao@bedeschi.com.br', 'Maria Silva', 'recepcao', NULL, '$2a$10$ExampleHashHere', true),
  ('dra.fernanda@bedeschi.com.br', 'Dra. Fernanda Costa', 'medico', 'Dermatologia Estética', '$2a$10$ExampleHashHere', true),
  ('juliana@bedeschi.com.br', 'Juliana Souza', 'profissional', 'Estética Facial e Corporal', '$2a$10$ExampleHashHere', true),
  ('patricia@bedeschi.com.br', 'Patrícia Oliveira', 'profissional', 'Massoterapia e Drenagem', '$2a$10$ExampleHashHere', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  specialty = EXCLUDED.specialty,
  is_active = EXCLUDED.is_active;

-- 3. CLIENTES DE EXEMPLO
INSERT INTO fidelity_clients (name, phone, pin, email, birth_date, points_balance, total_spent, total_appointments)
VALUES
  ('Erick Rodrigues', '11987654321', '1234', 'erick@email.com', '1990-05-15', 150, 0, 0),
  ('Ana Paula Santos', '11976543210', '5678', 'ana.paula@email.com', '1985-08-22', 200, 0, 0),
  ('Carla Mendes', '11965432109', '9012', 'carla.mendes@email.com', '1992-03-10', 180, 0, 0),
  ('Beatriz Lima', '11954321098', '3456', 'beatriz.lima@email.com', '1988-11-30', 120, 0, 0),
  ('Daniela Costa', '11943210987', '7890', 'daniela.costa@email.com', '1995-07-18', 250, 0, 0),
  ('Fernanda Oliveira', '11932109876', '2345', 'fernanda.o@email.com', '1987-12-05', 300, 0, 0),
  ('Gabriela Souza', '11921098765', '6789', 'gabi.souza@email.com', '1993-04-25', 170, 0, 0),
  ('Helena Martins', '11910987654', '0123', 'helena.m@email.com', '1991-09-14', 220, 0, 0),
  ('Isabela Rocha', '11909876543', '4567', 'isa.rocha@email.com', '1989-06-08', 190, 0, 0),
  ('Juliana Ferreira', '11998765432', '8901', 'ju.ferreira@email.com', '1994-02-20', 160, 0, 0)
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  birth_date = EXCLUDED.birth_date;

-- 4. REGRAS DE FIDELIDADE
INSERT INTO fidelity_rules (name, description, type, threshold_value, threshold_quantity, reward_type, reward_value, reward_service_name, validity_days, is_active)
VALUES
  ('Acumule R$ 1.000 e ganhe 20% OFF', 
   'A cada R$ 1.000 gastos, ganhe um desconto de 20% no próximo procedimento', 
   'COMBO_VALUE', 1000, NULL, 'DISCOUNT_PERCENT', 20, NULL, 90, true),
  
  ('10 Procedimentos = Limpeza de Pele Grátis', 
   'Complete 10 procedimentos e ganhe uma Limpeza de Pele gratuita', 
   'QUANTITY_ACCUMULATION', NULL, 10, 'FREE_SERVICE', NULL, 'Limpeza de Pele Profunda', 120, true),
  
  ('Converta 500 Pontos em R$ 50 OFF', 
   'Troque 500 pontos por R$ 50 de desconto', 
   'POINTS_CONVERSION', 500, NULL, 'DISCOUNT_PERCENT', 50, NULL, 60, true)
ON CONFLICT DO NOTHING;

-- 5. ATENDIMENTOS DE EXEMPLO (últimos 90 dias)
-- Pegando IDs reais dos clientes e profissionais
DO $$
DECLARE
  v_client_id uuid;
  v_prof_id uuid;
  v_apt_id uuid;
  v_date date;
  v_service_name text;
  v_service_price numeric;
  v_category text;
BEGIN
  -- Para cada cliente, criar alguns atendimentos
  FOR v_client_id IN (SELECT id FROM fidelity_clients LIMIT 10) LOOP
    FOR i IN 1..5 LOOP
      -- Data aleatória nos últimos 60 dias
      v_date := CURRENT_DATE - (random() * 60)::int;
      
      -- Pegar profissional aleatório
      SELECT id INTO v_prof_id FROM staff_users WHERE role IN ('profissional', 'medico') ORDER BY random() LIMIT 1;
      
      -- Criar atendimento
      v_apt_id := gen_random_uuid();
      
      -- Serviço aleatório
      SELECT name, price, category_name INTO v_service_name, v_service_price, v_category 
      FROM fidelity_services ORDER BY random() LIMIT 1;
      
      INSERT INTO fidelity_appointments (
        id, client_id, professional_id, professional_name, date, time, status, total, points_earned, has_review, review_rating, review_comment
      )
      SELECT 
        v_apt_id,
        v_client_id,
        v_prof_id,
        u.name,
        v_date,
        '14:00',
        'completed',
        v_service_price,
        FLOOR(v_service_price / 10),
        (random() > 0.3),
        CASE WHEN random() > 0.3 THEN (3 + FLOOR(random() * 3))::int ELSE NULL END,
        CASE WHEN random() > 0.3 THEN 'Ótimo atendimento!' ELSE NULL END
      FROM staff_users u WHERE u.id = v_prof_id;
      
      -- Adicionar serviço ao atendimento
      INSERT INTO fidelity_appointment_services (appointment_id, service_name, category_name, price)
      VALUES (v_apt_id, v_service_name, v_category, v_service_price);
      
    END LOOP;
  END LOOP;
  
  -- Atualizar totais dos clientes
  UPDATE fidelity_clients c
  SET 
    total_spent = COALESCE((SELECT SUM(total) FROM fidelity_appointments WHERE client_id = c.id), 0),
    total_appointments = COALESCE((SELECT COUNT(*) FROM fidelity_appointments WHERE client_id = c.id), 0),
    last_visit = (SELECT MAX(date) FROM fidelity_appointments WHERE client_id = c.id);
    
END $$;

-- 6. REVIEWS (baseadas nos atendimentos com has_review = true)
INSERT INTO fidelity_reviews (client_id, appointment_id, rating, comment)
SELECT 
  client_id,
  id,
  review_rating,
  review_comment
FROM fidelity_appointments
WHERE has_review = true AND review_rating IS NOT NULL
ON CONFLICT DO NOTHING;

-- Mensagem final
SELECT 'Dados de exemplo inseridos com sucesso!' as status;
SELECT COUNT(*) as total_services FROM fidelity_services;
SELECT COUNT(*) as total_staff FROM staff_users;
SELECT COUNT(*) as total_clients FROM fidelity_clients;
SELECT COUNT(*) as total_appointments FROM fidelity_appointments;
SELECT COUNT(*) as total_rules FROM fidelity_rules;
SELECT COUNT(*) as total_reviews FROM fidelity_reviews;
