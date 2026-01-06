/**
 * Script de teste para staff_users
 * Verifica integração com Supabase
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function testStaffUsers() {
  console.log("🔍 Testando integração com staff_users...\n");

  // 1. Buscar todos os usuários
  console.log("1️⃣ Buscando usuários cadastrados...");
  const { data: users, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Erro ao buscar usuários:", error.message);
    return;
  }

  console.log(`✅ ${users.length} usuários encontrados:\n`);
  users.forEach((u) => {
    console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
  });

  // 2. Verificar contadores por role
  console.log("\n2️⃣ Contadores por função:");
  const total = users.length;
  const medicos = users.filter((u) => u.role === "medico").length;
  const profissionais = users.filter((u) => u.role === "profissional").length;
  const recepcao = users.filter(
    (u) => u.role === "recepcao" || u.role === "admin",
  ).length;

  console.log(`   Total: ${total}`);
  console.log(`   Médicos: ${medicos}`);
  console.log(`   Profissionais: ${profissionais}`);
  console.log(`   Recepção/Admin: ${recepcao}`);

  console.log("\n✅ Integração funcionando corretamente!");
}

testStaffUsers().catch(console.error);
