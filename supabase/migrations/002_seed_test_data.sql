-- Migração: Dados de teste para staff_users
-- Execute APÓS a migração 001

-- Inserir profissionais de teste
-- Senhas são 'teste123' com hash bcrypt

-- Médico
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES (
  'dra.amanda@bedeschi.com',
  'Dra. Amanda Costa',
  'medico',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  'Dermatologia Estética',
  'admin@bedeschi.com'
) ON CONFLICT (email) DO NOTHING;

-- Profissionais
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES 
(
  'carla.santos@bedeschi.com',
  'Carla Santos',
  'profissional',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  'Massagem e Estética Corporal',
  'admin@bedeschi.com'
),
(
  'juliana.lima@bedeschi.com',
  'Juliana Lima',
  'profissional',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  'Depilação',
  'admin@bedeschi.com'
),
(
  'patricia.alves@bedeschi.com',
  'Patrícia Alves',
  'profissional',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  'Tratamento Corporal',
  'admin@bedeschi.com'
),
(
  'fernanda.oliveira@bedeschi.com',
  'Fernanda Oliveira',
  'profissional',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  'Manicure e Pedicure',
  'admin@bedeschi.com'
) ON CONFLICT (email) DO NOTHING;

-- Recepção
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES (
  'julia.atendente@bedeschi.com',
  'Julia Atendente',
  'recepcao',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq',
  NULL,
  'admin@bedeschi.com'
) ON CONFLICT (email) DO NOTHING;

-- Verificar inserções
SELECT id, email, name, role, specialty, is_active, created_at 
FROM public.staff_users 
ORDER BY created_at;
