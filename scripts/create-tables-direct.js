/**
 * Criar tabelas diretamente via PostgreSQL connection string
 * Usando a Database URL do Supabase
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Configure as variáveis no .env.local');
  process.exit(1);
}

// Extrair project ref da URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
console.log('📦 Project Ref:', projectRef);

async function executeSQLViaREST(sql) {
  // Usar a API REST do Supabase para executar SQL via pg_query
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({})
  });

  return response;
}

async function createTablesViaPooler() {
  // Tentar conectar via Supabase Pooler
  const poolerUrl = `postgresql://postgres.${projectRef}:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
  
  console.log('\n⚠️  Para criar as tabelas, você precisa:');
  console.log('');
  console.log('1. Acessar o Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('');
  console.log('2. Colar e executar o SQL abaixo:');
  console.log('');
  console.log('═'.repeat(60));
  
  const sql = `
-- TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.fidelity_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    pin VARCHAR(10) NOT NULL,
    email VARCHAR(255),
    birth_date DATE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_appointments INTEGER NOT NULL DEFAULT 0,
    last_visit DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA DE REGRAS
CREATE TABLE IF NOT EXISTS public.fidelity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    service_id VARCHAR(50),
    service_name VARCHAR(255),
    threshold_value DECIMAL(12, 2),
    threshold_quantity INTEGER,
    reward_type VARCHAR(50) NOT NULL,
    reward_value DECIMAL(12, 2),
    reward_service_id VARCHAR(50),
    reward_service_name VARCHAR(255),
    validity_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA DE RECOMPENSAS
CREATE TABLE IF NOT EXISTS public.fidelity_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.fidelity_rules(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(12, 2),
    service_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    expires_at DATE,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.fidelity_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    professional_id VARCHAR(50),
    professional_name VARCHAR(255),
    date DATE NOT NULL,
    time VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    has_review BOOLEAN NOT NULL DEFAULT false,
    review_rating INTEGER,
    review_comment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA DE SERVIÇOS DO ATENDIMENTO
CREATE TABLE IF NOT EXISTS public.fidelity_appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.fidelity_appointments(id) ON DELETE CASCADE,
    service_id VARCHAR(50),
    service_name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_fidelity_clients_phone ON public.fidelity_clients(phone);
CREATE INDEX IF NOT EXISTS idx_fidelity_rewards_client_id ON public.fidelity_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_appointments_client_id ON public.fidelity_appointments(client_id);

-- RLS
ALTER TABLE public.fidelity_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_appointment_services ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO PÚBLICO (para desenvolvimento)
CREATE POLICY "allow_all_clients" ON public.fidelity_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rules" ON public.fidelity_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rewards" ON public.fidelity_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_appointments" ON public.fidelity_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_apt_services" ON public.fidelity_appointment_services FOR ALL USING (true) WITH CHECK (true);

SELECT 'Tabelas criadas com sucesso!' as status;
`;

  console.log(sql);
  console.log('═'.repeat(60));
  console.log('');
  console.log('3. Após executar, rode: node scripts/execute-migration.js --seed');
}

createTablesViaPooler();
