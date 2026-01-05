require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createStaffUsersTable() {
  console.log('🔧 Criando tabela staff_users...\n');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Criar tabela staff_users
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

      -- Índices
      CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
      CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
      CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);

      -- RLS
      ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Admins podem gerenciar staff_users" ON staff_users;
      CREATE POLICY "Admins podem gerenciar staff_users"
        ON staff_users FOR ALL
        USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Todos podem ler staff_users ativos" ON staff_users;
      CREATE POLICY "Todos podem ler staff_users ativos"
        ON staff_users FOR SELECT
        USING (is_active = true);
    `
  });

  if (error) {
    console.error('❌ Erro ao criar tabela:', error);
    process.exit(1);
  }

  console.log('✅ Tabela staff_users criada com sucesso!\n');
}

createStaffUsersTable();
