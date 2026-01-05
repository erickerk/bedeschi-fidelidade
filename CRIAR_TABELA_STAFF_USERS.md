# 🔧 Criar Tabela staff_users no Supabase

## Problema Identificado

O erro "Could not find the table 'public.staff_users'" indica que a tabela não existe no banco de dados Supabase.

## Solução: Executar SQL no Supabase

### Passo 1: Acessar o SQL Editor

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard/project/lvqcualqeevdenghexjm)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **+ New Query**

### Passo 2: Executar o Script de Criação da Tabela

Copie e cole o código abaixo e clique em **Run**:

```sql
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_is_active ON public.staff_users(is_active);

-- Habilitar RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
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
```

### Passo 3: Inserir Dados de Teste

Após a tabela ser criada, execute este script para inserir profissionais de teste:

```sql
-- Dados de teste (senha: teste123)
INSERT INTO public.staff_users (email, name, role, password_hash, specialty, created_by)
VALUES 
  ('admin@bedeschi.com', 'Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', NULL, 'system'),
  ('dra.amanda@bedeschi.com', 'Dra. Amanda Costa', 'medico', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Dermatologia Estética', 'admin@bedeschi.com'),
  ('carla.santos@bedeschi.com', 'Carla Santos', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Massagem e Estética Corporal', 'admin@bedeschi.com'),
  ('juliana.lima@bedeschi.com', 'Juliana Lima', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Depilação', 'admin@bedeschi.com'),
  ('patricia.alves@bedeschi.com', 'Patrícia Alves', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Tratamento Corporal', 'admin@bedeschi.com'),
  ('fernanda.oliveira@bedeschi.com', 'Fernanda Oliveira', 'profissional', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', 'Manicure e Pedicure', 'admin@bedeschi.com'),
  ('julia.atendente@bedeschi.com', 'Julia Atendente', 'recepcao', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDq7rPqUz3DwJQjJHQI5B2UqZnKFGq', NULL, 'admin@bedeschi.com')
ON CONFLICT (email) DO NOTHING;

-- Verificar
SELECT * FROM public.staff_users;
```

### Passo 4: Testar na Aplicação

1. Acesse: [Admin Dashboard](http://localhost:3000/admin/dashboard)
2. Vá para aba **Equipe**
3. Os usuários cadastrados devem aparecer na lista
4. Tente adicionar um novo usuário

## Credenciais de Teste

| Email | Senha | Função |
|-------|-------|--------|
| `admin@bedeschi.com` | `teste123` | Admin |
| `dra.amanda@bedeschi.com` | `teste123` | Médico |
| `carla.santos@bedeschi.com` | `teste123` | Profissional |
| `julia.atendente@bedeschi.com` | `teste123` | Recepção |
