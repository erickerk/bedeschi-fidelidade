/**
 * Dados mock para desenvolvimento local
 * Substitui o banco de dados Supabase durante o desenvolvimento
 */

import { importedServices, importedCategories, searchServices as searchImportedServices } from "./services-data";

// Re-export serviços importados
export { importedServices, importedCategories };

// ==================== TIPOS ====================

export interface Client {
  id: string;
  name: string;
  phone: string;
  pin: string; // Código PIN de 4 dígitos para login
  email?: string;
  birthDate?: string;
  pointsBalance: number;
  totalSpent: number;
  totalAppointments: number;
  lastVisit?: string;
  createdAt: string;
}

// Profissionais da clínica
export interface Professional {
  id: string;
  name: string;
  role: "profissional" | "recepcionista" | "medico";
  specialty?: string;
  email?: string;
  phone?: string;
  photo?: string;
  servicesIds: string[]; // IDs dos serviços que atende
  rating: number;
  totalAppointments: number;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  externalCode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  servicesCount: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId?: string; // Profissional que atendeu
  professionalName?: string;
  date: string;
  time: string;
  services: { name: string; price: number }[];
  total: number;
  pointsEarned: number;
  status: "completed" | "pending" | "cancelled";
  hasReview: boolean;
  review?: {
    rating: number;
    comment?: string;
    professionalRating?: number;
  };
}

export interface Reward {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: "FREE_SERVICE" | "DISCOUNT_FIXED" | "DISCOUNT_PERCENT" | "CREDIT";
  value?: number;
  serviceName?: string;
  status: "available" | "redeemed" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface FidelityRule {
  id: string;
  name: string;
  description: string;
  type: "VALUE_ACCUMULATION" | "QUANTITY_ACCUMULATION" | "POINTS_CONVERSION" | "SERVICE_SPECIFIC" | "COMBO_VALUE";
  categoryId?: string;
  categoryName?: string;
  serviceId?: string; // Para regras de serviço específico
  serviceName?: string;
  thresholdValue?: number;
  thresholdQuantity?: number;
  rewardType: "FREE_SERVICE" | "DISCOUNT_FIXED" | "DISCOUNT_PERCENT" | "CREDIT";
  rewardServiceId?: string;
  rewardServiceName?: string;
  rewardValue?: number;
  validityDays: number;
  isActive: boolean;
}

// ==================== DADOS MOCK ====================

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Massagem", slug: "massagem", servicesCount: 15 },
  { id: "cat-2", name: "Limpeza de Pele", slug: "limpeza-pele", servicesCount: 8 },
  { id: "cat-3", name: "Depilação", slug: "depilacao", servicesCount: 25 },
  { id: "cat-4", name: "Tratamento Facial", slug: "tratamento-facial", servicesCount: 12 },
  { id: "cat-5", name: "Tratamento Corporal", slug: "tratamento-corporal", servicesCount: 18 },
  { id: "cat-6", name: "Manicure e Pedicure", slug: "manicure-pedicure", servicesCount: 10 },
];

export const mockServices: Service[] = [
  {
    id: "srv-1",
    externalCode: "001",
    name: "Massagem Relaxante 60min",
    categoryId: "cat-1",
    categoryName: "Massagem",
    price: 180.0,
    durationMinutes: 60,
    isActive: true,
  },
  {
    id: "srv-2",
    externalCode: "002",
    name: "Massagem Relaxante 90min",
    categoryId: "cat-1",
    categoryName: "Massagem",
    price: 250.0,
    durationMinutes: 90,
    isActive: true,
  },
  {
    id: "srv-3",
    externalCode: "003",
    name: "Massagem Modeladora",
    categoryId: "cat-1",
    categoryName: "Massagem",
    price: 200.0,
    durationMinutes: 60,
    isActive: true,
  },
  {
    id: "srv-4",
    externalCode: "010",
    name: "Limpeza de Pele Profunda",
    categoryId: "cat-2",
    categoryName: "Limpeza de Pele",
    price: 150.0,
    durationMinutes: 90,
    isActive: true,
  },
  {
    id: "srv-5",
    externalCode: "011",
    name: "Limpeza de Pele Express",
    categoryId: "cat-2",
    categoryName: "Limpeza de Pele",
    price: 90.0,
    durationMinutes: 45,
    isActive: true,
  },
  {
    id: "srv-6",
    externalCode: "020",
    name: "Depilação Perna Completa",
    categoryId: "cat-3",
    categoryName: "Depilação",
    price: 80.0,
    durationMinutes: 45,
    isActive: true,
  },
  {
    id: "srv-7",
    externalCode: "021",
    name: "Depilação Meia Perna",
    categoryId: "cat-3",
    categoryName: "Depilação",
    price: 50.0,
    durationMinutes: 30,
    isActive: true,
  },
  {
    id: "srv-8",
    externalCode: "030",
    name: "Hidratação Facial",
    categoryId: "cat-4",
    categoryName: "Tratamento Facial",
    price: 120.0,
    durationMinutes: 45,
    isActive: true,
  },
  {
    id: "srv-9",
    externalCode: "040",
    name: "Drenagem Linfática",
    categoryId: "cat-5",
    categoryName: "Tratamento Corporal",
    price: 160.0,
    durationMinutes: 60,
    isActive: true,
  },
  {
    id: "srv-10",
    externalCode: "050",
    name: "Manicure Tradicional",
    categoryId: "cat-6",
    categoryName: "Manicure e Pedicure",
    price: 35.0,
    durationMinutes: 30,
    isActive: true,
  },
];

export const mockClients: Client[] = [
  {
    id: "cli-1",
    name: "Maria Silva",
    phone: "11999999999",
    pin: "9999", // Últimos 4 dígitos do celular como PIN padrão
    email: "maria@email.com",
    birthDate: "1985-05-15",
    pointsBalance: 1250,
    totalSpent: 2850.0,
    totalAppointments: 15,
    lastVisit: "2025-12-28",
    createdAt: "2024-01-15",
  },
  {
    id: "cli-2",
    name: "Ana Santos",
    phone: "11988888888",
    pin: "8888",
    email: "ana@email.com",
    pointsBalance: 500,
    totalSpent: 980.0,
    totalAppointments: 6,
    lastVisit: "2025-12-20",
    createdAt: "2024-06-10",
  },
  {
    id: "cli-3",
    name: "Carla Oliveira",
    phone: "11977777777",
    pin: "7777",
    pointsBalance: 2100,
    totalSpent: 4200.0,
    totalAppointments: 25,
    lastVisit: "2026-01-02",
    createdAt: "2023-08-20",
  },
];

// Profissionais da clínica
export const mockProfessionals: Professional[] = [
  {
    id: "prof-1",
    name: "Dra. Amanda Costa",
    role: "medico",
    specialty: "Dermatologia Estética",
    email: "amanda@bedeschi.com",
    phone: "11999001001",
    servicesIds: ["EF1", "EF2", "EF3", "EF4", "EF30"],
    rating: 4.9,
    totalAppointments: 145,
    isActive: true,
    createdAt: "2023-01-15",
  },
  {
    id: "prof-2",
    name: "Carla Santos",
    role: "profissional",
    specialty: "Massagem e Estética Corporal",
    email: "carla@bedeschi.com",
    phone: "11999002002",
    servicesIds: ["EC1", "EC2", "EC3", "EC4", "EC36"],
    rating: 4.8,
    totalAppointments: 128,
    isActive: true,
    createdAt: "2023-03-10",
  },
  {
    id: "prof-3",
    name: "Juliana Lima",
    role: "profissional",
    specialty: "Depilação",
    email: "juliana@bedeschi.com",
    phone: "11999003003",
    servicesIds: ["DC1", "DC2", "DC3", "DC4", "DC5", "DC6", "DR1", "DR2"],
    rating: 4.7,
    totalAppointments: 98,
    isActive: true,
    createdAt: "2023-06-20",
  },
  {
    id: "prof-4",
    name: "Patricia Alves",
    role: "profissional",
    specialty: "Tratamento Corporal",
    email: "patricia@bedeschi.com",
    phone: "11999004004",
    servicesIds: ["EC1", "EC2", "EC49", "EC50", "EC60"],
    rating: 4.6,
    totalAppointments: 87,
    isActive: true,
    createdAt: "2023-08-15",
  },
  {
    id: "prof-5",
    name: "Julia Atendente",
    role: "recepcionista",
    email: "julia@bedeschi.com",
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
    email: "fernanda@bedeschi.com",
    phone: "11999005005",
    servicesIds: ["MP1", "MP2", "MP3", "MP4", "MP6"],
    rating: 4.8,
    totalAppointments: 156,
    isActive: true,
    createdAt: "2023-02-10",
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    clientId: "cli-1",
    clientName: "Maria Silva",
    professionalId: "prof-2",
    professionalName: "Carla Santos",
    date: "2025-12-28",
    time: "14:30",
    services: [{ name: "Massagem Relaxante 60min", price: 180.0 }],
    total: 180.0,
    pointsEarned: 180,
    status: "completed",
    hasReview: false,
  },
  {
    id: "apt-2",
    clientId: "cli-1",
    clientName: "Maria Silva",
    professionalId: "prof-1",
    professionalName: "Dra. Amanda Costa",
    date: "2025-12-15",
    time: "10:00",
    services: [
      { name: "Limpeza de Pele Profunda", price: 150.0 },
      { name: "Hidratação Facial", price: 120.0 },
    ],
    total: 270.0,
    pointsEarned: 270,
    status: "completed",
    hasReview: true,
    review: { rating: 5, comment: "Excelente atendimento!", professionalRating: 5 },
  },
  {
    id: "apt-3",
    clientId: "cli-3",
    clientName: "Carla Oliveira",
    professionalId: "prof-4",
    professionalName: "Patricia Alves",
    date: "2026-01-02",
    time: "16:00",
    services: [{ name: "Drenagem Linfática", price: 160.0 }],
    total: 160.0,
    pointsEarned: 160,
    status: "completed",
    hasReview: false,
  },
];

// Reviews (avaliações)
export interface Review {
  id: string;
  clientId: string;
  appointmentId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    clientId: "cli-1",
    appointmentId: "apt-2",
    rating: 5,
    comment: "Excelente atendimento!",
    createdAt: "2025-12-15",
  },
  {
    id: "rev-2",
    clientId: "cli-3",
    appointmentId: "apt-3",
    rating: 4,
    comment: "Muito bom, recomendo!",
    createdAt: "2026-01-02",
  },
  {
    id: "rev-3",
    clientId: "cli-2",
    appointmentId: "apt-4",
    rating: 5,
    comment: "",
    createdAt: "2025-12-20",
  },
];

export const mockRewards: Reward[] = [
  {
    id: "rwd-1",
    clientId: "cli-1",
    title: "1 Limpeza de Pele GRÁTIS",
    description: "Conquistado por acúmulo em Tratamento Facial",
    type: "FREE_SERVICE",
    serviceName: "Limpeza de Pele Profunda",
    status: "available",
    expiresAt: "2026-01-15",
    createdAt: "2025-11-15",
  },
  {
    id: "rwd-2",
    clientId: "cli-3",
    title: "R$ 50 de desconto",
    description: "Resgate de 500 pontos",
    type: "CREDIT",
    value: 50,
    status: "available",
    expiresAt: "2026-03-01",
    createdAt: "2026-01-02",
  },
];

export const mockFidelityRules: FidelityRule[] = [
  {
    id: "rule-1",
    name: "Combo Valor - Massagem Grátis",
    description: "Gastou R$ 1.000 em qualquer serviço = Massagem Relaxante grátis",
    type: "COMBO_VALUE",
    thresholdValue: 1000,
    rewardType: "FREE_SERVICE",
    rewardServiceId: "srv-1",
    rewardServiceName: "Massagem Relaxante 60min",
    validityDays: 60,
    isActive: true,
  },
  {
    id: "rule-2",
    name: "Depilação 10+1",
    description: "A cada 10 sessões de depilação, ganha 1 grátis",
    type: "QUANTITY_ACCUMULATION",
    categoryId: "cat-3",
    categoryName: "Depilação",
    thresholdQuantity: 10,
    rewardType: "FREE_SERVICE",
    rewardServiceName: "Depilação Perna Completa",
    validityDays: 90,
    isActive: true,
  },
  {
    id: "rule-3",
    name: "Pontos para Crédito",
    description: "500 pontos = R$ 50 de crédito",
    type: "POINTS_CONVERSION",
    thresholdValue: 500,
    rewardType: "CREDIT",
    rewardValue: 50,
    validityDays: 180,
    isActive: true,
  },
  {
    id: "rule-4",
    name: "Limpeza de Pele - Fidelidade",
    description: "A cada 5 limpezas de pele, ganha 1 hidratação facial",
    type: "SERVICE_SPECIFIC",
    serviceId: "srv-4",
    serviceName: "Limpeza de Pele Profunda",
    thresholdQuantity: 5,
    rewardType: "FREE_SERVICE",
    rewardServiceId: "srv-8",
    rewardServiceName: "Hidratação Facial",
    validityDays: 90,
    isActive: true,
  },
  {
    id: "rule-5",
    name: "Combo Premium - R$ 2.000",
    description: "Gastou R$ 2.000 = Drenagem Linfática grátis",
    type: "COMBO_VALUE",
    thresholdValue: 2000,
    rewardType: "FREE_SERVICE",
    rewardServiceId: "srv-9",
    rewardServiceName: "Drenagem Linfática",
    validityDays: 90,
    isActive: true,
  },
];

// ==================== PROGRESSO POR CATEGORIA ====================

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  threshold: number;
  progress: number;
  remaining: number;
}

export const mockCategoryProgress: Record<string, CategoryProgress[]> = {
  "cli-1": [
    {
      categoryId: "cat-1",
      categoryName: "Massagem",
      totalSpent: 850,
      threshold: 1000,
      progress: 85,
      remaining: 150,
    },
    {
      categoryId: "cat-4",
      categoryName: "Tratamento Facial",
      totalSpent: 420,
      threshold: 1000,
      progress: 42,
      remaining: 580,
    },
  ],
  "cli-3": [
    {
      categoryId: "cat-1",
      categoryName: "Massagem",
      totalSpent: 1200,
      threshold: 1000,
      progress: 100,
      remaining: 0,
    },
  ],
};

// ==================== FUNÇÕES AUXILIARES ====================

export function getClientByPhone(phone: string): Client | undefined {
  const cleanPhone = phone.replace(/\D/g, "");
  return mockClients.find((c) => c.phone === cleanPhone);
}

export function validateClientPin(phone: string, pin: string): Client | undefined {
  const client = getClientByPhone(phone);
  if (client && client.pin === pin) {
    return client;
  }
  return undefined;
}

export function generateDefaultPin(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.slice(-4); // Últimos 4 dígitos
}

// Funções para profissionais
export function getProfessionalById(id: string): Professional | undefined {
  return mockProfessionals.find((p) => p.id === id);
}

export function getProfessionalsByRole(role: Professional["role"]): Professional[] {
  return mockProfessionals.filter((p) => p.role === role && p.isActive);
}

export function getProfessionalsByService(serviceCode: string): Professional[] {
  return mockProfessionals.filter((p) => p.servicesIds.includes(serviceCode) && p.isActive);
}

export function getAllActiveProfessionals(): Professional[] {
  return mockProfessionals.filter((p) => p.isActive);
}

export function getClientById(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id);
}

export function getClientAppointments(clientId: string): Appointment[] {
  return mockAppointments.filter((a) => a.clientId === clientId);
}

export function getClientRewards(clientId: string): Reward[] {
  return mockRewards.filter((r) => r.clientId === clientId);
}

export function getClientPendingReview(clientId: string): Appointment | undefined {
  return mockAppointments.find(
    (a) => a.clientId === clientId && a.status === "completed" && !a.hasReview
  );
}

export function searchClients(query: string): Client[] {
  const q = query.toLowerCase();
  return mockClients.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
  );
}

export function searchServices(query: string): Service[] {
  // Usa serviços importados da planilha
  return searchImportedServices(query) as Service[];
}
