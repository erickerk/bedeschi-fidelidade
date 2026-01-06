/**
 * Executar migration diretamente via PostgreSQL
 * Usa pg (node-postgres) para conexão direta
 */

require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error("❌ Configure NEXT_PUBLIC_SUPABASE_URL no .env.local");
  process.exit(1);
}

// Extrair project ref da URL
const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

// Connection string do Supabase (usando transaction pooler)
// Formato: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || "YOUR_PASSWORD"}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;

console.log("📦 Project Ref:", projectRef);

const migrationSQL = `
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
`;

const rlsSQL = `
-- RLS (ignorar erros se já existir)
DO $$ 
BEGIN
  ALTER TABLE public.fidelity_clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.fidelity_rules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.fidelity_rewards ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.fidelity_appointments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.fidelity_appointment_services ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Políticas (drop se existir e recriar)
DROP POLICY IF EXISTS "allow_all_clients" ON public.fidelity_clients;
DROP POLICY IF EXISTS "allow_all_rules" ON public.fidelity_rules;
DROP POLICY IF EXISTS "allow_all_rewards" ON public.fidelity_rewards;
DROP POLICY IF EXISTS "allow_all_appointments" ON public.fidelity_appointments;
DROP POLICY IF EXISTS "allow_all_apt_services" ON public.fidelity_appointment_services;

CREATE POLICY "allow_all_clients" ON public.fidelity_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rules" ON public.fidelity_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rewards" ON public.fidelity_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_appointments" ON public.fidelity_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_apt_services" ON public.fidelity_appointment_services FOR ALL USING (true) WITH CHECK (true);
`;

async function runMigration() {
  if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_PASSWORD) {
    console.log(
      "\n⚠️  Para executar a migration via PostgreSQL direto, adicione ao .env.local:",
    );
    console.log("");
    console.log(
      "   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    );
    console.log("");
    console.log("   Ou: SUPABASE_DB_PASSWORD=sua_senha_do_banco");
    console.log("");
    console.log("Você pode encontrar a connection string em:");
    console.log(
      `   https://supabase.com/dashboard/project/${projectRef}/settings/database`,
    );
    console.log("");
    console.log("═".repeat(60));
    console.log("\nAlternativamente, execute o SQL manualmente:");
    console.log(
      `   https://supabase.com/dashboard/project/${projectRef}/sql/new`,
    );
    console.log(
      "\nCole o conteúdo de: supabase/migrations/006_create_fidelity_tables.sql",
    );
    console.log("═".repeat(60));
    return;
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔗 Conectando ao PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado!\n");

    console.log("📝 Executando migration...");
    await client.query(migrationSQL);
    console.log("✅ Tabelas criadas!\n");

    console.log("🔒 Configurando RLS...");
    await client.query(rlsSQL);
    console.log("✅ RLS configurado!\n");

    console.log("🎉 Migration concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
  }
}

runMigration();
