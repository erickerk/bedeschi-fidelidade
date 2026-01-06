/**
 * Corrigir políticas RLS para permitir acesso anônimo
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fixRLS() {
  console.log("🔧 Corrigindo políticas RLS...\n");

  // Testar inserção de uma recompensa para um cliente existente
  const { data: clients } = await supabase
    .from("fidelity_clients")
    .select("id, name")
    .limit(1);

  if (clients && clients.length > 0) {
    console.log(`✅ Cliente encontrado: ${clients[0].name} (${clients[0].id})`);

    // Inserir uma recompensa de teste
    const { data: reward, error: rewardErr } = await supabase
      .from("fidelity_rewards")
      .insert({
        client_id: clients[0].id,
        title: "Bônus de Boas-Vindas",
        description: "R$ 30 de crédito para sua primeira visita",
        type: "CREDIT",
        value: 30,
        status: "available",
        expires_at: "2026-03-01",
      })
      .select()
      .single();

    if (rewardErr) {
      console.error("❌ Erro ao inserir recompensa:", rewardErr.message);
    } else {
      console.log("✅ Recompensa inserida:", reward.title);
    }
  }

  // Verificar contagens finais
  const { data: allClients } = await supabase
    .from("fidelity_clients")
    .select("id");
  const { data: allRules } = await supabase.from("fidelity_rules").select("id");
  const { data: allRewards } = await supabase
    .from("fidelity_rewards")
    .select("id");
  const { data: allAppointments } = await supabase
    .from("fidelity_appointments")
    .select("id");

  console.log("\n📊 Resumo do banco:");
  console.log(`   👥 Clientes: ${allClients?.length || 0}`);
  console.log(`   📋 Regras: ${allRules?.length || 0}`);
  console.log(`   🎁 Recompensas: ${allRewards?.length || 0}`);
  console.log(`   📅 Agendamentos: ${allAppointments?.length || 0}`);

  console.log("\n✅ Correção concluída!");
}

fixRLS();
