/**
 * Script para aplicar correções do QA
 * - Criar tabela services
 * - Popular fidelity_appointments com dados de exemplo
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createServicesTable() {
  console.log("📦 1. Criando tabela services...");

  // Verificar se tabela existe
  const { data: existing, error: checkErr } = await supabase
    .from("services")
    .select("id")
    .limit(1);

  if (!checkErr) {
    console.log("   ✅ Tabela services já existe");
    return true;
  }

  // Tabela não existe, inserir dados mock via API
  console.log(
    "   ⚠️ Tabela não existe - execute a migration 008 no Supabase Dashboard",
  );
  console.log(
    "   📂 Arquivo: supabase/migrations/008_create_services_table.sql",
  );
  return false;
}

async function seedServices() {
  console.log("\n🔧 Inserindo serviços...");

  const services = [
    {
      name: "Massagem Relaxante 60min",
      category_name: "Massagens",
      price: 180.0,
      duration_minutes: 60,
    },
    {
      name: "Massagem Modeladora",
      category_name: "Massagens",
      price: 220.0,
      duration_minutes: 60,
    },
    {
      name: "Limpeza de Pele",
      category_name: "Facial",
      price: 150.0,
      duration_minutes: 45,
    },
    {
      name: "Peeling Facial",
      category_name: "Facial",
      price: 200.0,
      duration_minutes: 60,
    },
    {
      name: "Depilação Perna Completa",
      category_name: "Depilação",
      price: 120.0,
      duration_minutes: 45,
    },
    {
      name: "Depilação Virilha",
      category_name: "Depilação",
      price: 80.0,
      duration_minutes: 30,
    },
    {
      name: "Design de Sobrancelhas",
      category_name: "Sobrancelhas",
      price: 65.0,
      duration_minutes: 30,
    },
    {
      name: "Micropigmentação Sobrancelha",
      category_name: "Micropigmentação",
      price: 450.0,
      duration_minutes: 120,
    },
    {
      name: "Alongamento de Cílios",
      category_name: "Cílios",
      price: 280.0,
      duration_minutes: 90,
    },
    {
      name: "Manicure Completa",
      category_name: "Manicure",
      price: 45.0,
      duration_minutes: 45,
    },
    {
      name: "Pedicure Completa",
      category_name: "Pedicure",
      price: 55.0,
      duration_minutes: 60,
    },
    {
      name: "Hidratação Capilar",
      category_name: "Tratamentos",
      price: 120.0,
      duration_minutes: 60,
    },
  ];

  for (const service of services) {
    const { error } = await supabase.from("services").insert(service);
    if (error && error.code !== "23505") {
      console.log(`   ❌ ${service.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${service.name}`);
    }
  }
}

async function seedAppointments() {
  console.log("\n📅 2. Inserindo agendamentos de exemplo...");

  // Buscar clientes existentes
  const { data: clients } = await supabase
    .from("fidelity_clients")
    .select("id, name");

  if (!clients || clients.length === 0) {
    console.log("   ⚠️ Nenhum cliente encontrado");
    return;
  }

  const appointments = [
    {
      client_id: clients[0].id,
      client_name: clients[0].name,
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
      client_name: clients[0].name,
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
      client_name: clients.length > 1 ? clients[1].name : clients[0].name,
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
      console.log(`   ✅ ${apt.client_name} - ${apt.date}`);

      // Inserir serviços do atendimento
      await supabase.from("fidelity_appointment_services").insert([
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
    }
  }
}

async function verifyData() {
  console.log("\n🔍 3. Verificando dados...");

  const tables = [
    "fidelity_clients",
    "fidelity_rules",
    "fidelity_rewards",
    "fidelity_appointments",
    "services",
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("id");
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: ${data?.length || 0} registros`);
    }
  }
}

async function main() {
  console.log("🚀 Aplicando correções do QA...\n");
  console.log("═".repeat(50));

  const servicesExist = await createServicesTable();

  if (servicesExist) {
    // Tentar inserir serviços
    const { data: existingServices } = await supabase
      .from("services")
      .select("id");
    if (!existingServices || existingServices.length === 0) {
      await seedServices();
    } else {
      console.log(`   ℹ️ ${existingServices.length} serviços já cadastrados`);
    }
  }

  // Verificar se já existem appointments
  const { data: existingApts } = await supabase
    .from("fidelity_appointments")
    .select("id");
  if (!existingApts || existingApts.length === 0) {
    await seedAppointments();
  } else {
    console.log(`\n📅 ${existingApts.length} agendamentos já existem`);
  }

  await verifyData();

  console.log("\n" + "═".repeat(50));
  console.log("🎉 Correções aplicadas!");
}

main().catch(console.error);
