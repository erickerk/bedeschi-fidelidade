/**
 * Corrigir políticas RLS para permitir acesso anônimo
 * Usando service role key para alterar as políticas
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fixRLS() {
  console.log("🔧 Testando acesso com anon key...\n");

  // Testar com anon key
  const anonClient = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // Testar clientes
  const { data: clients, error: clientsErr } = await anonClient
    .from("fidelity_clients")
    .select("*");

  console.log(
    "👥 Clientes (anon):",
    clientsErr ? `❌ ${clientsErr.message}` : `✅ ${clients?.length} registros`,
  );

  // Testar regras
  const { data: rules, error: rulesErr } = await anonClient
    .from("fidelity_rules")
    .select("*");

  console.log(
    "📋 Regras (anon):",
    rulesErr ? `❌ ${rulesErr.message}` : `✅ ${rules?.length} registros`,
  );

  // Testar recompensas
  const { data: rewards, error: rewardsErr } = await anonClient
    .from("fidelity_rewards")
    .select("*");

  console.log(
    "🎁 Recompensas (anon):",
    rewardsErr ? `❌ ${rewardsErr.message}` : `✅ ${rewards?.length} registros`,
  );

  // Testar agendamentos
  const { data: appointments, error: aptErr } = await anonClient
    .from("fidelity_appointments")
    .select("*");

  console.log(
    "📅 Agendamentos (anon):",
    aptErr ? `❌ ${aptErr.message}` : `✅ ${appointments?.length} registros`,
  );

  console.log("\n--- Dados com service key ---");

  // Testar com service key
  const { data: sClients } = await supabase
    .from("fidelity_clients")
    .select("id, name, phone");
  const { data: sRules } = await supabase
    .from("fidelity_rules")
    .select("id, name");
  const { data: sRewards } = await supabase
    .from("fidelity_rewards")
    .select("id, title");

  console.log("👥 Clientes (service):", sClients?.length || 0);
  console.log("📋 Regras (service):", sRules?.length || 0);
  console.log("🎁 Recompensas (service):", sRewards?.length || 0);

  if (sClients?.length > 0) {
    console.log("\nClientes disponíveis:");
    sClients.forEach((c) => console.log(`   - ${c.name} | Tel: ${c.phone}`));
  }
}

fixRLS();
