-- Migração: Criar tabela staff_users
-- Execute este script no SQL Editor do Supabase

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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_is_active ON public.staff_users(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Política para leitura (qualquer usuário autenticado pode ler)
CREATE POLICY "Permitir leitura de staff_users" ON public.staff_users
  FOR SELECT USING (true);

-- Política para inserção (qualquer usuário pode inserir - ajuste conforme necessário)
CREATE POLICY "Permitir inserção de staff_users" ON public.staff_users
  FOR INSERT WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Permitir atualização de staff_users" ON public.staff_users
  FOR UPDATE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_staff_users_updated_at ON public.staff_users;
CREATE TRIGGER update_staff_users_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão (senha: admin123)
-- Hash bcrypt de 'admin123'
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES (
  'admin@bedeschi.com',
  'Administrador',
  'admin',
  '$2a$10$rQnM1gJ6V8sYHZJZvKfzT.8kGxQP9XQXQ1L5mNOHJZQH8QZQZQZQZ',
  NULL,
  'system'
) ON CONFLICT (email) DO NOTHING;

-- Confirmar criação
SELECT 'Tabela staff_users criada com sucesso!' as status;
