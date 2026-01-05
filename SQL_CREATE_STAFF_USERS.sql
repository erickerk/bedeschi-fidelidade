-- ================================================================
-- CRIAR TABELA staff_users PARA USUÁRIOS PERSISTENTES
-- ================================================================
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/editor/sql
-- ================================================================

-- Criar tabela staff_users
CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'recepcao', 'profissional', 'medico')),
  password_hash TEXT NOT NULL,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON public.staff_users(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem ler staff_users ativos" ON public.staff_users;
DROP POLICY IF EXISTS "Permitir gerenciamento de staff_users" ON public.staff_users;

-- Política: Qualquer um pode ler (necessário para login)
CREATE POLICY "Todos podem ler staff_users ativos"
  ON public.staff_users
  FOR SELECT
  USING (is_active = true);

-- Política: Todos podem inserir/atualizar (necessário para cadastro)
CREATE POLICY "Permitir gerenciamento de staff_users"
  ON public.staff_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.staff_users IS 'Usuários da equipe (Admin, Recepção, Profissionais) - NUNCA DELETAR NO SEED';
COMMENT ON COLUMN public.staff_users.email IS 'Email único do usuário';
COMMENT ON COLUMN public.staff_users.role IS 'Papel: admin, recepcao, profissional, medico';
COMMENT ON COLUMN public.staff_users.password_hash IS 'Hash bcrypt da senha (bcrypt.hashSync(password, 10))';
COMMENT ON COLUMN public.staff_users.is_active IS 'Indica se o usuário está ativo no sistema';

-- Verificar criação
SELECT 'Tabela staff_users criada com sucesso!' AS status;
