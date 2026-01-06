/**
 * Script para executar migration SQL diretamente no Supabase
 * Usa o service role key para ter permissões completas
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
  );
  process.exit(1);
}

console.log("🔗 Conectando ao Supabase:", supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);
  const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    // Tenta via REST API direta se RPC não existir
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      console.log(`   ⚠️  RPC não disponível, tentando método alternativo...`);
      return false;
    }
  }

  console.log(`   ✅ ${description} - OK`);
  return true;
}

async function createTablesViaInsert() {
  console.log("\n🏗️  Criando tabelas de fidelidade...\n");

  // Testar se as tabelas já existem tentando fazer select
  const tables = [
    "fidelity_clients",
    "fidelity_rules",
    "fidelity_rewards",
    "fidelity_appointments",
  ];

  let allExist = true;
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && error.code === "42P01") {
      console.log(`   ❌ ${table} não existe`);
      allExist = false;
    } else if (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`);
      allExist = false;
    } else {
      console.log(`   ✅ ${table} existe`);
    }
  }

  return allExist;
}

async function seedClients() {
  console.log("\n👥 Inserindo clientes de exemplo...");

  const clients = [
    {
      name: "Maria Silva",
      phone: "11999887766",
      pin: "7766",
      email: "maria.silva@email.com",
      birth_date: "1985-03-15",
      points_balance: 1250,
      total_spent: 2850.0,
      total_appointments: 12,
      last_visit: "2026-01-02",
    },
    {
      name: "Ana Santos",
      phone: "11988776655",
      pin: "6655",
      email: "ana.santos@email.com",
      birth_date: "1990-07-22",
      points_balance: 580,
      total_spent: 1420.0,
      total_appointments: 6,
      last_visit: "2025-12-28",
    },
    {
      name: "Carla Oliveira",
      phone: "11977665544",
      pin: "5544",
      email: "carla.oliveira@email.com",
      birth_date: "1988-11-10",
      points_balance: 2100,
      total_spent: 4800.0,
      total_appointments: 20,
      last_visit: "2026-01-03",
    },
  ];

  for (const client of clients) {
    const { error } = await supabase
      .from("fidelity_clients")
      .upsert(client, { onConflict: "phone" });

    if (error) {
      console.error(`   ❌ ${client.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${client.name}`);
    }
  }
}

async function seedRules() {
  console.log("\n📋 Inserindo regras de fidelidade...");

  const rules = [
    {
      name: "Combo Valor - Massagem Grátis",
      description: "Gastou R$ 1.000 = Massagem Relaxante grátis",
      type: "COMBO_VALUE",
      threshold_value: 1000,
      reward_type: "FREE_SERVICE",
      reward_service_name: "Massagem Relaxante 60min",
      validity_days: 60,
      is_active: true,
    },
    {
      name: "Depilação 10+1",
      description: "A cada 10 sessões de depilação, ganha 1 grátis",
      type: "QUANTITY_ACCUMULATION",
      category_name: "Depilação",
      threshold_quantity: 10,
      reward_type: "FREE_SERVICE",
      reward_service_name: "Depilação Perna Completa",
      validity_days: 90,
      is_active: true,
    },
    {
      name: "Pontos para Crédito",
      description: "500 pontos = R$ 50 de crédito",
      type: "POINTS_CONVERSION",
      threshold_value: 500,
      reward_type: "CREDIT",
      reward_value: 50,
      validity_days: 180,
      is_active: true,
    },
  ];

  for (const rule of rules) {
    const { error } = await supabase.from("fidelity_rules").insert(rule);

    if (error) {
      if (error.code === "23505") {
        console.log(`   ⚠️  ${rule.name} já existe`);
      } else {
        console.error(`   ❌ ${rule.name}: ${error.message}`);
      }
    } else {
      console.log(`   ✅ ${rule.name}`);
    }
  }
}

async function testConnection() {
  console.log("\n🔍 Testando conexão e leitura de dados...");

  const { data: clients, error: clientsErr } = await supabase
    .from("fidelity_clients")
    .select("*");

  if (clientsErr) {
    console.log(`   ❌ Clientes: ${clientsErr.message}`);
    return false;
  }
  console.log(`   ✅ Clientes: ${clients?.length || 0} registros`);

  const { data: rules, error: rulesErr } = await supabase
    .from("fidelity_rules")
    .select("*");

  if (rulesErr) {
    console.log(`   ❌ Regras: ${rulesErr.message}`);
    return false;
  }
  console.log(`   ✅ Regras: ${rules?.length || 0} registros`);

  const { data: rewards, error: rewardsErr } = await supabase
    .from("fidelity_rewards")
    .select("*");

  if (rewardsErr) {
    console.log(`   ❌ Recompensas: ${rewardsErr.message}`);
    return false;
  }
  console.log(`   ✅ Recompensas: ${rewards?.length || 0} registros`);

  return true;
}

async function main() {
  console.log("🚀 Executando setup do Supabase Bedeschi para Fidelidade\n");
  console.log("═".repeat(60));

  const tablesExist = await createTablesViaInsert();

  if (!tablesExist) {
    console.log("\n" + "═".repeat(60));
    console.log("\n⚠️  TABELAS NÃO ENCONTRADAS!\n");
    console.log("Execute o SQL manualmente no Supabase Dashboard:");
    console.log(
      "1. Acesse: https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new",
    );
    console.log(
      "2. Cole o conteúdo de: supabase/migrations/006_create_fidelity_tables.sql",
    );
    console.log("3. Execute e rode este script novamente com --seed");
    console.log("═".repeat(60));
    return;
  }

  if (process.argv.includes("--seed")) {
    await seedClients();
    await seedRules();
  }

  await testConnection();

  console.log("\n" + "═".repeat(60));
  console.log("🎉 Setup concluído!");
  console.log("═".repeat(60));
}

main().catch(console.error);
