/**
 * Script para gerar dados de teste no Supabase
 * Projeto: Bedeschi Fidelidade
 * 
 * Execute com: npx ts-node scripts/seed-test-data.ts
 * Ou via npm: npm run seed:test
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvqcualqeevdenghexjm.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dados de profissionais - IDs devem corresponder ao mock-data.ts
const testProfessionals = [
  { id: "prof-1", name: "Dra. Amanda Costa", role: "medico", specialty: "Dermatologia Estética" },
  { id: "prof-2", name: "Carla Santos", role: "profissional", specialty: "Massagem e Estética Corporal" },
  { id: "prof-3", name: "Juliana Lima", role: "profissional", specialty: "Depilação" },
  { id: "prof-4", name: "Patricia Alves", role: "profissional", specialty: "Tratamento Corporal" },
  { id: "prof-6", name: "Fernanda Oliveira", role: "profissional", specialty: "Manicure e Pedicure" },
];

// Dados de clientes para teste
const testClients = [
  { name: "Maria Silva", phone: "11999887766", pin: "1234", email: "maria@email.com" },
  { name: "Ana Paula Souza", phone: "11988776655", pin: "2345", email: "ana@email.com" },
  { name: "Fernanda Costa", phone: "11977665544", pin: "3456", email: "fernanda@email.com" },
  { name: "Juliana Oliveira", phone: "11966554433", pin: "4567", email: "juliana@email.com" },
  { name: "Camila Rodrigues", phone: "11955443322", pin: "5678", email: "camila@email.com" },
];

// Serviços disponíveis
const services = [
  { name: "Limpeza de Pele", price: 150, category: "Estética Facial" },
  { name: "Massagem Relaxante 60min", price: 180, category: "Massoterapia" },
  { name: "Manicure Completa", price: 45, category: "Unhas" },
  { name: "Pedicure Completa", price: 55, category: "Unhas" },
  { name: "Hidratação Facial", price: 120, category: "Estética Facial" },
  { name: "Drenagem Linfática", price: 200, category: "Massoterapia" },
  { name: "Peeling Químico", price: 280, category: "Dermatologia" },
  { name: "Botox", price: 800, category: "Harmonização" },
  { name: "Preenchimento Labial", price: 1200, category: "Harmonização" },
  { name: "Design de Sobrancelhas", price: 60, category: "Estética Facial" },
];

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split("T")[0];
}

function randomTime(): string {
  const hours = 9 + Math.floor(Math.random() * 9); // 9-17
  const minutes = Math.random() > 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

async function clearOldData() {
  console.log("🗑️  Limpando dados antigos...");
  
  // Limpar na ordem correta para respeitar foreign keys
  await supabase.from("fidelity_reviews").delete().neq("id", "");
  await supabase.from("fidelity_appointment_services").delete().neq("id", "");
  await supabase.from("fidelity_appointments").delete().neq("id", "");
  await supabase.from("fidelity_rewards").delete().neq("id", "");
  await supabase.from("fidelity_clients").delete().neq("id", "");
  
  console.log("✅ Dados antigos removidos");
}

async function seedClients() {
  console.log("👥 Criando clientes de teste...");
  
  const clientsToInsert = testClients.map((c, i) => ({
    name: c.name,
    phone: c.phone,
    pin: c.pin,
    email: c.email,
    points_balance: Math.floor(Math.random() * 500) + 100,
    total_spent: 0,
    total_appointments: 0,
  }));

  const { data, error } = await supabase
    .from("fidelity_clients")
    .insert(clientsToInsert)
    .select();

  if (error) {
    console.error("Erro ao criar clientes:", error);
    return [];
  }

  console.log(`✅ ${data.length} clientes criados`);
  return data;
}

async function seedAppointmentsAndReviews(clients: any[]) {
  console.log("📅 Criando atendimentos de teste...");
  
  const appointments = [];
  const appointmentServices = [];
  const reviews = [];

  for (const client of clients) {
    // Cada cliente tem entre 2-8 atendimentos
    const numAppointments = 2 + Math.floor(Math.random() * 7);
    
    for (let i = 0; i < numAppointments; i++) {
      const professional = testProfessionals[Math.floor(Math.random() * testProfessionals.length)];
      const date = randomDate(90);
      const time = randomTime();
      
      // Selecionar 1-3 serviços aleatórios
      const numServices = 1 + Math.floor(Math.random() * 3);
      const selectedServices: typeof services = [];
      for (let j = 0; j < numServices; j++) {
        const service = services[Math.floor(Math.random() * services.length)];
        if (!selectedServices.find(s => s.name === service.name)) {
          selectedServices.push(service);
        }
      }
      
      const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
      const pointsEarned = Math.floor(total / 10);
      
      // Determinar se tem avaliação (70% chance)
      const hasReview = Math.random() > 0.3;
      // Rating entre 1-5, tendência para notas altas
      const rating = hasReview ? Math.min(5, Math.max(1, Math.floor(Math.random() * 3) + 3 + (Math.random() > 0.7 ? 1 : 0))) : null;
      
      const appointmentId = `apt-${client.id}-${i}-${Date.now()}`;
      
      appointments.push({
        id: appointmentId,
        client_id: client.id,
        client_name: client.name,
        professional_id: professional.id,
        professional_name: professional.name,
        date,
        time,
        status: "completed",
        total,
        points_earned: pointsEarned,
        has_review: hasReview,
        review_rating: rating,
        review_comment: hasReview ? getRandomComment(rating!) : null,
      });

      // Serviços do atendimento
      for (const service of selectedServices) {
        appointmentServices.push({
          appointment_id: appointmentId,
          service_name: service.name,
          category_name: service.category,
          price: service.price,
        });
      }

      // Criar review separada se tiver avaliação
      if (hasReview && rating) {
        reviews.push({
          client_id: client.id,
          appointment_id: appointmentId,
          staff_id: professional.id,
          rating,
          comment: getRandomComment(rating),
        });
      }
    }
  }

  // Inserir atendimentos
  const { data: aptData, error: aptError } = await supabase
    .from("fidelity_appointments")
    .insert(appointments)
    .select();

  if (aptError) {
    console.error("Erro ao criar atendimentos:", aptError);
    return;
  }

  console.log(`✅ ${aptData.length} atendimentos criados`);

  // Inserir serviços dos atendimentos
  const { error: svcError } = await supabase
    .from("fidelity_appointment_services")
    .insert(appointmentServices);

  if (svcError) {
    console.error("Erro ao criar serviços:", svcError);
  } else {
    console.log(`✅ ${appointmentServices.length} serviços de atendimento criados`);
  }

  // Inserir reviews
  const { data: reviewData, error: reviewError } = await supabase
    .from("fidelity_reviews")
    .insert(reviews)
    .select();

  if (reviewError) {
    console.error("Erro ao criar avaliações:", reviewError);
  } else {
    console.log(`✅ ${reviewData?.length || 0} avaliações criadas`);
  }

  // Atualizar totais dos clientes
  await updateClientTotals(clients, appointments);
}

async function updateClientTotals(clients: any[], appointments: any[]) {
  console.log("📊 Atualizando totais dos clientes...");

  for (const client of clients) {
    const clientApts = appointments.filter(a => a.client_id === client.id);
    const totalSpent = clientApts.reduce((sum, a) => sum + a.total, 0);
    const totalAppointments = clientApts.length;
    const lastVisit = clientApts.length > 0 
      ? clientApts.sort((a, b) => b.date.localeCompare(a.date))[0].date 
      : null;

    await supabase
      .from("fidelity_clients")
      .update({
        total_spent: totalSpent,
        total_appointments: totalAppointments,
        last_visit: lastVisit,
      })
      .eq("id", client.id);
  }

  console.log("✅ Totais dos clientes atualizados");
}

function getRandomComment(rating: number): string {
  const comments: Record<number, string[]> = {
    5: [
      "Excelente atendimento! Muito profissional e atenciosa.",
      "Amei o resultado! Voltarei com certeza.",
      "Profissional incrível, super recomendo!",
      "Melhor clínica da região, sempre saio satisfeita.",
      "Atendimento impecável, ambiente agradável.",
    ],
    4: [
      "Muito bom, gostei bastante do resultado.",
      "Ótimo atendimento, apenas um pouco de espera.",
      "Profissional competente, recomendo.",
      "Bom serviço, voltarei novamente.",
    ],
    3: [
      "Atendimento ok, nada de especial.",
      "Resultado médio, esperava um pouco mais.",
      "Razoável, pode melhorar.",
    ],
    2: [
      "Não fiquei muito satisfeita com o resultado.",
      "Atendimento deixou a desejar.",
      "Esperava mais pelo preço cobrado.",
    ],
    1: [
      "Péssimo atendimento, não recomendo.",
      "Muito insatisfeita, não voltarei.",
    ],
  };

  const options = comments[rating] || comments[3];
  return options[Math.floor(Math.random() * options.length)];
}

async function main() {
  console.log("🚀 Iniciando seed de dados de teste...\n");
  console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL}\n`);

  try {
    // Limpar dados antigos
    await clearOldData();

    // Criar clientes
    const clients = await seedClients();
    if (clients.length === 0) {
      console.error("❌ Falha ao criar clientes. Abortando.");
      return;
    }

    // Criar atendimentos e avaliações
    await seedAppointmentsAndReviews(clients);

    console.log("\n✅ Seed concluído com sucesso!");
    console.log("📊 Resumo:");
    console.log(`   - ${clients.length} clientes`);
    console.log(`   - Atendimentos e avaliações criados`);
    console.log("\n💡 Os gráficos do dashboard agora terão dados para exibir.");

  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
  }
}

main();
