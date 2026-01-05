-- Criar tabela staff_users
CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'recepcao', 'profissional', 'medico')),
  password_hash TEXT NOT NULL,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_is_active ON public.staff_users(is_active);

-- RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura" ON public.staff_users FOR SELECT USING (true);
CREATE POLICY "Permitir inserção" ON public.staff_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização" ON public.staff_users FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_staff_users_updated_at ON public.staff_users;
CREATE TRIGGER update_staff_users_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Dados de teste
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES 
  ('admin@bedeschi.com', 'Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', NULL, 'system'),
  ('dra.amanda@bedeschi.com', 'Dra. Amanda Costa', 'medico', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Dermatologia Estética', 'admin'),
  ('carla.santos@bedeschi.com', 'Carla Santos', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Massagem e Estética', 'admin'),
  ('juliana.lima@bedeschi.com', 'Juliana Lima', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Depilação', 'admin'),
  ('patricia.alves@bedeschi.com', 'Patrícia Alves', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Tratamento Corporal', 'admin'),
  ('fernanda.oliveira@bedeschi.com', 'Fernanda Oliveira', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Manicure e Pedicure', 'admin'),
  ('julia.atendente@bedeschi.com', 'Julia Atendente', 'recepcao', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', NULL, 'admin')
ON CONFLICT (email) DO NOTHING;
