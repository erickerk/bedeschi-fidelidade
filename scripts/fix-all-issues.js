/**
 * Script para corrigir TODOS os problemas do QA
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function checkTableStructure() {
  console.log("🔍 Verificando estrutura da tabela fidelity_appointments...\n");

  const { data, error } = await supabase
    .from("fidelity_appointments")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Erro:", error.message);
    return null;
  }

  // Se não há dados, tentar inserir um registro de teste para ver os campos aceitos
  console.log("Estrutura OK. Tentando inserir agendamentos...");
  return true;
}

async function seedAppointments() {
  console.log("\n📅 Inserindo agendamentos de exemplo...");

  // Buscar clientes
  const { data: clients } = await supabase
    .from("fidelity_clients")
    .select("id, name");
  if (!clients?.length) {
    console.log("   ⚠️ Nenhum cliente encontrado");
    return;
  }

  // Formato correto baseado na migration 006
  const appointments = [
    {
      client_id: clients[0].id,
      professional_id: "prof-1",
      professional_name: "Juliana Lima",
      date: "2026-01-02",
      time: "10:00",
      status: "completed",
      total: 380.0,
      points_earned: 380,
      has_review: true,
      review_rating: 5,
      review_comment: "Excelente atendimento!",
    },
    {
      client_id: clients[0].id,
      professional_id: "prof-2",
      professional_name: "Carla Santos",
      date: "2025-12-28",
      time: "14:30",
      status: "completed",
      total: 265.0,
      points_earned: 265,
      has_review: true,
      review_rating: 5,
      review_comment: "Muito bom!",
    },
    {
      client_id: clients.length > 1 ? clients[1].id : clients[0].id,
      professional_id: "prof-3",
      professional_name: "Patricia Alves",
      date: "2025-12-20",
      time: "09:00",
      status: "completed",
      total: 200.0,
      points_earned: 200,
      has_review: false,
    },
  ];

  for (const apt of appointments) {
    const { data, error } = await supabase
      .from("fidelity_appointments")
      .insert(apt)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ ${apt.date}: ${error.message}`);
    } else {
      console.log(`   ✅ Agendamento ${apt.date} inserido (ID: ${data.id})`);

      // Inserir serviços do atendimento
      const { error: svcErr } = await supabase
        .from("fidelity_appointment_services")
        .insert([
          {
            appointment_id: data.id,
            service_name: "Massagem Relaxante 60min",
            price: 180.0,
          },
          {
            appointment_id: data.id,
            service_name: "Limpeza de Pele",
            price: apt.total - 180.0,
          },
        ]);

      if (svcErr) {
        console.log(`      ⚠️ Serviços: ${svcErr.message}`);
      } else {
        console.log(`      ✅ Serviços vinculados`);
      }
    }
  }
}

async function createServicesViaRPC() {
  console.log("\n📦 Tentando criar tabela services via inserção...");

  // Primeiro verificar se existe
  const { error: checkErr } = await supabase
    .from("services")
    .select("id")
    .limit(1);

  if (checkErr && checkErr.code === "PGRST204") {
    console.log("   ⚠️ Tabela services não existe.");
    console.log("   📋 Execute manualmente no Supabase Dashboard:");
    console.log("   ─────────────────────────────────────────────");
    console.log(`
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_name VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_public" ON public.services FOR ALL USING (true) WITH CHECK (true);
`);
    return false;
  }

  if (!checkErr) {
    console.log("   ✅ Tabela services existe");

    // Inserir serviços se não existirem
    const { data: existing } = await supabase.from("services").select("id");
    if (!existing || existing.length === 0) {
      const services = [
        {
          name: "Massagem Relaxante 60min",
          category_name: "Massagens",
          price: 180.0,
        },
        { name: "Limpeza de Pele", category_name: "Facial", price: 150.0 },
        {
          name: "Depilação Perna Completa",
          category_name: "Depilação",
          price: 120.0,
        },
        {
          name: "Design de Sobrancelhas",
          category_name: "Sobrancelhas",
          price: 65.0,
        },
      ];

      const { error: insErr } = await supabase
        .from("services")
        .insert(services);
      if (insErr) {
        console.log(`   ❌ Erro ao inserir: ${insErr.message}`);
      } else {
        console.log(`   ✅ ${services.length} serviços inseridos`);
      }
    } else {
      console.log(`   ℹ️ ${existing.length} serviços já existem`);
    }
    return true;
  }

  console.log(`   ❌ Erro: ${checkErr.message}`);
  return false;
}

async function verifyAll() {
  console.log("\n" + "═".repeat(50));
  console.log("🔍 VERIFICAÇÃO FINAL\n");

  const checks = [
    { name: "fidelity_clients", table: "fidelity_clients" },
    { name: "fidelity_rules", table: "fidelity_rules" },
    { name: "fidelity_rewards", table: "fidelity_rewards" },
    { name: "fidelity_appointments", table: "fidelity_appointments" },
    {
      name: "fidelity_appointment_services",
      table: "fidelity_appointment_services",
    },
    { name: "services", table: "services" },
  ];

  let allOk = true;

  for (const check of checks) {
    const { data, error } = await supabase.from(check.table).select("id");
    if (error) {
      console.log(`   ❌ ${check.name}: ${error.message}`);
      allOk = false;
    } else {
      console.log(`   ✅ ${check.name}: ${data?.length || 0} registros`);
    }
  }

  return allOk;
}

async function main() {
  console.log("🚀 CORRIGINDO TODOS OS PROBLEMAS DO QA\n");
  console.log("═".repeat(50));

  await checkTableStructure();
  await seedAppointments();
  await createServicesViaRPC();
  await verifyAll();

  console.log("\n" + "═".repeat(50));
  console.log("✅ Script finalizado!");
}

main().catch(console.error);
