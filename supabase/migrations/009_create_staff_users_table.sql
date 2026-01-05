-- Tabela para armazenar usuários da equipe criados pelo Admin
-- Esta tabela NÃO deve ser limpa pelo script de seed

CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'recepcao', 'profissional', 'medico')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);

-- RLS (Row Level Security)
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem inserir, atualizar e deletar
CREATE POLICY "Admins podem gerenciar staff_users"
  ON staff_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política: Todos podem ler (necessário para login)
CREATE POLICY "Todos podem ler staff_users ativos"
  ON staff_users
  FOR SELECT
  USING (is_active = true);

-- Comentários
COMMENT ON TABLE staff_users IS 'Usuários da equipe (Admin, Recepção, Profissionais) - NÃO DELETAR NO SEED';
COMMENT ON COLUMN staff_users.email IS 'Email único do usuário';
COMMENT ON COLUMN staff_users.role IS 'Papel: admin, recepcao, profissional, medico';
COMMENT ON COLUMN staff_users.password_hash IS 'Hash bcrypt da senha';
COMMENT ON COLUMN staff_users.is_active IS 'Indica se o usuário está ativo no sistema';
