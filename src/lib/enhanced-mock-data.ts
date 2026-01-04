/**
 * Dados mockados aprimorados e realistas para o Instituto Bedeschi
 * Gerados para preencher todos os gráficos e análises do dashboard
 */

import { Appointment, Client, Professional, Review } from "./mock-data";

// Gerar 90 dias de dados realistas de receita
export function generateDailyRevenue() {
  const data = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simular variação realista de receita (mais alta em finais de semana)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseRevenue = isWeekend ? 2500 : 1800;
    const variation = Math.random() * 800 - 400;
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.max(800, baseRevenue + variation),
      appointments: Math.floor(Math.random() * 8) + (isWeekend ? 12 : 8)
    });
  }
  
  return data;
}

// Gerar atendimentos realistas dos últimos 90 dias
export function generateRealisticAppointments(): Appointment[] {
  const appointments: Appointment[] = [];
  const today = new Date();
  
  const clients = [
    { id: "cli-1", name: "Fernanda Rodrigues" },
    { id: "cli-2", name: "Patricia Mendes" },
    { id: "cli-3", name: "Camila Almeida" },
    { id: "cli-4", name: "Beatriz Costa" },
    { id: "cli-5", name: "Larissa Souza" },
    { id: "cli-6", name: "Amanda Pereira" },
    { id: "cli-7", name: "Juliana Santos" },
    { id: "cli-8", name: "Mariana Lima" },
    { id: "cli-9", name: "Gabriela Oliveira" },
    { id: "cli-10", name: "Rafaela Costa" },
  ];
  
  const professionals = [
    { id: "prof-1", name: "Dra. Amanda Costa" },
    { id: "prof-2", name: "Carla Santos" },
    { id: "prof-3", name: "Juliana Lima" },
    { id: "prof-4", name: "Patricia Alves" },
    { id: "prof-6", name: "Fernanda Oliveira" },
  ];
  
  const services = [
    { name: "Massagem Relaxante 60min", price: 180, category: "Massagem" },
    { name: "Massagem Relaxante 90min", price: 250, category: "Massagem" },
    { name: "Massagem Modeladora", price: 200, category: "Massagem" },
    { name: "Limpeza de Pele Profunda", price: 150, category: "Limpeza de Pele" },
    { name: "Limpeza de Pele Express", price: 90, category: "Limpeza de Pele" },
    { name: "Depilação Perna Completa", price: 80, category: "Depilação" },
    { name: "Depilação Meia Perna", price: 50, category: "Depilação" },
    { name: "Depilação Axilas", price: 30, category: "Depilação" },
    { name: "Hidratação Facial", price: 120, category: "Tratamento Facial" },
    { name: "Peeling Químico", price: 180, category: "Tratamento Facial" },
    { name: "Drenagem Linfática", price: 160, category: "Tratamento Corporal" },
    { name: "Radiofrequência", price: 220, category: "Tratamento Corporal" },
    { name: "Manicure Tradicional", price: 35, category: "Manicure e Pedicure" },
    { name: "Pedicure Spa", price: 55, category: "Manicure e Pedicure" },
    { name: "Design de Sobrancelhas", price: 45, category: "Tratamento Facial" },
  ];
  
  let aptId = 1;
  
  // Gerar 8-15 atendimentos por dia nos últimos 90 dias
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Mais atendimentos em finais de semana
    const numAppointments = Math.floor(Math.random() * 7) + (isWeekend ? 12 : 8);
    
    for (let i = 0; i < numAppointments; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const prof = professionals[Math.floor(Math.random() * professionals.length)];
      
      // 1-3 serviços por atendimento
      const numServices = Math.floor(Math.random() * 3) + 1;
      const selectedServices = [];
      const usedIndices = new Set<number>();
      
      for (let s = 0; s < numServices; s++) {
        let idx = Math.floor(Math.random() * services.length);
        while (usedIndices.has(idx)) {
          idx = Math.floor(Math.random() * services.length);
        }
        usedIndices.add(idx);
        selectedServices.push({
          name: services[idx].name,
          price: services[idx].price
        });
      }
      
      const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
      const hasReview = Math.random() > 0.3; // 70% têm avaliação
      const dateStr = date.toISOString().split('T')[0];
      
      appointments.push({
        id: `apt-${aptId++}`,
        clientId: client.id,
        clientName: client.name,
        professionalId: prof.id,
        professionalName: prof.name,
        date: dateStr,
        time: `${9 + Math.floor(Math.random() * 9)}:${Math.random() > 0.5 ? "00" : "30"}`,
        services: selectedServices,
        total,
        pointsEarned: total,
        status: "completed",
        hasReview,
        review: hasReview ? {
          rating: Math.random() > 0.8 ? 5 : (Math.random() > 0.5 ? 4 : 3),
          comment: "",
          professionalRating: Math.random() > 0.8 ? 5 : (Math.random() > 0.5 ? 4 : 3)
        } : undefined,
      });
    }
  }
  
  return appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Gerar clientes realistas com dados completos
export function generateEnhancedClients(): Client[] {
  const names = [
    "Fernanda Rodrigues", "Patricia Mendes", "Camila Almeida", "Beatriz Costa",
    "Larissa Souza", "Amanda Pereira", "Juliana Santos", "Mariana Lima",
    "Gabriela Oliveira", "Rafaela Costa", "Carolina Silva", "Isabela Martins",
    "Letícia Ferreira", "Natália Rocha", "Vanessa Alves", "Priscila Dias",
    "Renata Cardoso", "Tatiana Barbosa", "Viviane Monteiro", "Daniela Ribeiro"
  ];
  
  return names.map((name, idx) => {
    const totalAppointments = Math.floor(Math.random() * 40) + 5;
    const avgSpending = 150 + Math.random() * 200;
    const totalSpent = totalAppointments * avgSpending;
    const pointsBalance = Math.floor(totalSpent * 0.3 + Math.random() * 500);
    
    const today = new Date();
    const lastVisitDays = Math.floor(Math.random() * 60);
    const lastVisit = new Date(today);
    lastVisit.setDate(lastVisit.getDate() - lastVisitDays);
    
    const createdMonths = Math.floor(Math.random() * 24) + 3;
    const createdAt = new Date(today);
    createdAt.setMonth(createdAt.getMonth() - createdMonths);
    
    return {
      id: `cli-${idx + 1}`,
      name,
      phone: `119${String(87654321 + idx).padStart(8, '0')}`,
      pin: String(1000 + idx * 111).slice(0, 4),
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      birthDate: `19${85 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      pointsBalance,
      totalSpent,
      totalAppointments,
      lastVisit: lastVisit.toISOString().split('T')[0],
      createdAt: createdAt.toISOString().split('T')[0],
    };
  });
}

// Gerar profissionais com especialidades
export function generateEnhancedProfessionals(): Professional[] {
  return [
    {
      id: "prof-1",
      name: "Dra. Amanda Costa",
      role: "medico",
      specialty: "Dermatologia Estética",
      email: "amanda.costa@bedeschi.com",
      phone: "11999001001",
      servicesIds: ["FC1", "FC2", "FC3", "FC4", "FC5"],
      rating: 4.9,
      totalAppointments: 245,
      isActive: true,
      createdAt: "2022-01-15",
    },
    {
      id: "prof-2",
      name: "Carla Santos",
      role: "profissional",
      specialty: "Massoterapia",
      email: "carla.santos@bedeschi.com",
      phone: "11999002002",
      servicesIds: ["MS1", "MS2", "MS3", "MS4"],
      rating: 4.8,
      totalAppointments: 312,
      isActive: true,
      createdAt: "2022-03-10",
    },
    {
      id: "prof-3",
      name: "Juliana Lima",
      role: "profissional",
      specialty: "Depilação",
      email: "juliana.lima@bedeschi.com",
      phone: "11999003003",
      servicesIds: ["DC1", "DC2", "DC3", "DC4", "DC5"],
      rating: 4.7,
      totalAppointments: 428,
      isActive: true,
      createdAt: "2022-06-20",
    },
    {
      id: "prof-4",
      name: "Patricia Alves",
      role: "profissional",
      specialty: "Tratamento Corporal",
      email: "patricia.alves@bedeschi.com",
      phone: "11999004004",
      servicesIds: ["EC1", "EC2", "EC49", "EC50"],
      rating: 4.6,
      totalAppointments: 287,
      isActive: true,
      createdAt: "2022-08-15",
    },
    {
      id: "prof-5",
      name: "Julia Atendente",
      role: "recepcionista",
      email: "julia.atendente@bedeschi.com",
      phone: "11999998888",
      servicesIds: [],
      rating: 5.0,
      totalAppointments: 0,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "prof-6",
      name: "Fernanda Oliveira",
      role: "profissional",
      specialty: "Manicure e Pedicure",
      email: "fernanda.oliveira@bedeschi.com",
      phone: "11999005005",
      servicesIds: ["MP1", "MP2", "MP3", "MP4"],
      rating: 4.8,
      totalAppointments: 521,
      isActive: true,
      createdAt: "2022-02-10",
    },
    {
      id: "prof-7",
      name: "Mariana Souza",
      role: "profissional",
      specialty: "Estética Facial",
      email: "mariana.souza@bedeschi.com",
      phone: "11999006006",
      servicesIds: ["FC1", "FC2", "LP1", "LP2"],
      rating: 4.7,
      totalAppointments: 198,
      isActive: true,
      createdAt: "2023-04-05",
    },
  ];
}

// Gerar avaliações realistas
export function generateEnhancedReviews(appointments: Appointment[]): Review[] {
  return appointments
    .filter(apt => apt.hasReview && apt.review)
    .map((apt, idx) => ({
      id: `rev-${idx + 1}`,
      clientId: apt.clientId,
      appointmentId: apt.id,
      rating: apt.review!.rating,
      comment: apt.review!.comment,
      createdAt: apt.date,
    }));
}
