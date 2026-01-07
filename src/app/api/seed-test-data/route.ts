/**
 * API Route para gerar dados de teste no Supabase
 * Apenas para ambiente de desenvolvimento/teste
 * Acesso: GET /api/seed-test-data
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
  { name: "Design de Sobrancelhas", price: 60, category: "Estética Facial" },
];

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split("T")[0];
}

function randomTime(): string {
  const hours = 9 + Math.floor(Math.random() * 9);
  const minutes = Math.random() > 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

function getRandomComment(rating: number): string {
  const comments: Record<number, string[]> = {
    5: [
      "Excelente atendimento! Muito profissional e atenciosa.",
      "Amei o resultado! Voltarei com certeza.",
      "Profissional incrível, super recomendo!",
      "Melhor clínica da região, sempre saio satisfeita.",
    ],
    4: [
      "Muito bom, gostei bastante do resultado.",
      "Ótimo atendimento, apenas um pouco de espera.",
      "Profissional competente, recomendo.",
    ],
    3: [
      "Atendimento ok, nada de especial.",
      "Resultado médio, esperava um pouco mais.",
    ],
    2: [
      "Não fiquei muito satisfeita com o resultado.",
      "Atendimento deixou a desejar.",
    ],
    1: [
      "Péssimo atendimento, não recomendo.",
    ],
  };
  const options = comments[rating] || comments[3];
  return options[Math.floor(Math.random() * options.length)];
}

export async function GET() {
  // ⚠️ ATENÇÃO: Esta rota está DESATIVADA em produção
  // Para adicionar dados de teste, use a interface de Admin ou cadastre manualmente
  return NextResponse.json({ 
    error: "Rota de seed desativada em produção. Use a interface administrativa para gerenciar dados.",
    message: "Para adicionar dados de teste: 1) Acesse o Admin Dashboard, 2) Use a tela de Recepção para cadastrar clientes, 3) Registre atendimentos normalmente"
  }, { status: 403 });

  /* CÓDIGO DESATIVADO - mantido apenas para referência
  try {
    console.log("🚀 Iniciando seed de dados de teste...");

    // REMOVIDO: Código que deletava todos os dados automaticamente
    // Isso causava perda de dados de clientes e atendimentos em produção
    // await supabase.from("fidelity_reviews").delete().gte("created_at", "1900-01-01");
    // await supabase.from("fidelity_appointment_services").delete().gte("created_at", "1900-01-01");
    // await supabase.from("fidelity_appointments").delete().gte("created_at", "1900-01-01");
    // await supabase.from("fidelity_rewards").delete().gte("created_at", "1900-01-01");
    // await supabase.from("fidelity_clients").delete().gte("created_at", "1900-01-01");

    // 2. Criar clientes (código desativado - rota retorna 403 antes de chegar aqui)
    console.log("👥 Criando clientes de teste...");
    const clientsToInsert = testClients.map((c) => ({
      name: c.name,
      phone: c.phone,
      pin: c.pin,
      email: c.email,
      points_balance: Math.floor(Math.random() * 500) + 100,
      total_spent: 0,
      total_appointments: 0,
    }));

    const { data: clients, error: clientError } = await supabase
      .from("fidelity_clients")
      .insert(clientsToInsert)
      .select();

    if (clientError || !clients || clients.length === 0) {
      return NextResponse.json({ error: "Erro ao criar clientes", details: clientError }, { status: 500 });
    }

    // 3. Criar atendimentos e avaliações
    console.log("📅 Criando atendimentos de teste...");
    const appointments: any[] = [];
    const appointmentServices: any[] = [];
    const reviews: any[] = [];

    for (const client of clients) {
      const numAppointments = 2 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < numAppointments; i++) {
        const professional = testProfessionals[Math.floor(Math.random() * testProfessionals.length)];
        const date = randomDate(90);
        const time = randomTime();
        
        const numServices = 1 + Math.floor(Math.random() * 2);
        const selectedServices: typeof services = [];
        for (let j = 0; j < numServices; j++) {
          const service = services[Math.floor(Math.random() * services.length)];
          if (!selectedServices.find(s => s.name === service.name)) {
            selectedServices.push(service);
          }
        }
        
        const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const pointsEarned = Math.floor(total / 10);
        
        // 70% dos atendimentos têm avaliação
        const hasReview = Math.random() > 0.3;
        // Rating com tendência para notas altas
        const rating = hasReview ? Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 3 + (Math.random() > 0.5 ? 1 : 0))) : null;
        
        const appointmentId = crypto.randomUUID();
        
        appointments.push({
          id: appointmentId,
          client_id: client.id,
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

        for (const service of selectedServices) {
          appointmentServices.push({
            appointment_id: appointmentId,
            service_name: service.name,
            category_name: service.category,
            price: service.price,
          });
        }

        if (hasReview && rating !== null) {
          reviews.push({
            client_id: client.id,
            appointment_id: appointmentId,
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
      return NextResponse.json({ error: "Erro ao criar atendimentos", details: aptError }, { status: 500 });
    }

    // Inserir serviços
    await supabase.from("fidelity_appointment_services").insert(appointmentServices);

    // Inserir reviews
    console.log("📝 Tentando inserir", reviews.length, "reviews");
    const { data: reviewData, error: reviewError } = await supabase
      .from("fidelity_reviews")
      .insert(reviews)
      .select();
    
    if (reviewError) {
      console.error("Erro ao inserir reviews:", reviewError);
    } else {
      console.log("✅ Reviews inseridas:", reviewData?.length);
    }

    // Atualizar totais dos clientes
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

    return NextResponse.json({
      success: true,
      message: "Dados de teste criados com sucesso!",
      stats: {
        clients: clients.length,
        appointments: aptData?.length || 0,
        reviews: reviewData?.length || 0,
        services: appointmentServices.length,
      }
    });

  } catch (error) {
    console.error("Erro no seed:", error);
    return NextResponse.json({ error: "Erro interno", details: error }, { status: 500 });
  }
  */
}
