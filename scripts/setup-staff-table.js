require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setupStaffUsersTable() {
  console.log('🔧 Configurando tabela staff_users...\n');

  // Criar tabela via query SQL
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS staff_users (
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

    CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
    CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
    CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);
  `;

  try {
    // Tentar criar via query direta
    const { error: createError } = await supabase.from('staff_users').select('id').limit(1);
    
    if (createError && createError.code === '42P01') {
      // Tabela não existe, precisa criar manualmente
      console.log('⚠️  Tabela staff_users não existe. Por favor, execute o SQL manualmente:\n');
      console.log('1. Acesse: https://lvqcualqeevdenghexjm.supabase.co/project/lvqcualqeevdenghexjm/editor/sql');
      console.log('2. Execute o seguinte SQL:\n');
      console.log(createTableSQL);
      console.log('\n3. Execute este script novamente\n');
      process.exit(1);
    }

    console.log('✅ Tabela staff_users já existe!\n');
    
    // Verificar se já existem usuários
    const { data: users, error: selectError } = await supabase
      .from('staff_users')
      .select('*');

    if (selectError) {
      console.error('❌ Erro ao verificar usuários:', selectError);
      process.exit(1);
    }

    console.log(`📊 Usuários cadastrados: ${users?.length || 0}\n`);
    
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

setupStaffUsersTable();
