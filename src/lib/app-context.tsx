"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  mockClients as initialClients,
  mockAppointments as initialAppointments,
  mockRewards as initialRewards,
  mockProfessionals as initialProfessionals,
  mockFidelityRules as initialRules,
  mockReviews as initialReviews,
  importedServices,
  type Client,
  type Appointment,
  type Reward,
  type Professional,
  type FidelityRule,
  type Review,
} from "./mock-data";

// APIs do Supabase Bedeschi
import * as ClientsAPI from "./clients-api";
import * as AppointmentsAPI from "./appointments-api";
import * as RewardsAPI from "./rewards-api";
import * as RulesAPI from "./rules-api";
import * as ReviewsAPI from "./reviews-api";

const serviceNameToCategoryId: Record<string, string> = {};
const serviceNameToId: Record<string, string> = {};

for (const svc of importedServices) {
  if (!serviceNameToCategoryId[svc.name]) {
    serviceNameToCategoryId[svc.name] = svc.categoryId;
  }
  if (!serviceNameToId[svc.name]) {
    serviceNameToId[svc.name] = svc.id;
  }
}

function addDays(baseDateIso: string, days: number): string {
  const base = new Date(baseDateIso);
  if (Number.isNaN(base.getTime())) {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toISOString().slice(0, 10);
  }
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function evaluateFidelityRulesForAppointment(params: {
  appointment: Appointment;
  clientBefore: Client;
  clientAfter: Client;
  allAppointmentsBefore: Appointment[];
  rules: FidelityRule[];
  onReward: (reward: Reward) => void;
}) {
  const { appointment, clientBefore, clientAfter, allAppointmentsBefore, rules, onReward } = params;

  if (!rules.length) return;

  const clientId = clientBefore.id;
  const baseDateIso = appointment.date || new Date().toISOString().slice(0, 10);

  const completedBeforeForClient = allAppointmentsBefore.filter(
    (a) => a.clientId === clientId && a.status === "completed",
  );

  for (const rule of rules) {
    if (!rule.isActive) continue;

    if (rule.type === "COMBO_VALUE" && rule.thresholdValue) {
      const beforeTotal = clientBefore.totalSpent;
      const afterTotal = clientAfter.totalSpent;
      if (beforeTotal < rule.thresholdValue && afterTotal >= rule.thresholdValue) {
        const expiresAt = addDays(baseDateIso, rule.validityDays);
        const reward: Reward = {
          id: `rwd-${rule.id}-${clientId}-${Date.now()}`,
          clientId,
          title: rule.rewardServiceName || rule.name,
          description: rule.description,
          type: rule.rewardType,
          value: rule.rewardType === "CREDIT" || rule.rewardType === "DISCOUNT_FIXED" || rule.rewardType === "DISCOUNT_PERCENT" ? rule.rewardValue : undefined,
          serviceName: rule.rewardType === "FREE_SERVICE" ? rule.rewardServiceName : undefined,
          status: "available",
          expiresAt,
          createdAt: baseDateIso,
        };
        onReward(reward);
      }
      continue;
    }

    if (rule.type === "POINTS_CONVERSION" && rule.thresholdValue && rule.rewardValue) {
      const beforePoints = clientBefore.pointsBalance;
      const afterPoints = clientAfter.pointsBalance;
      if (beforePoints < rule.thresholdValue && afterPoints >= rule.thresholdValue) {
        const expiresAt = addDays(baseDateIso, rule.validityDays);
        const reward: Reward = {
          id: `rwd-${rule.id}-${clientId}-${Date.now()}`,
          clientId,
          title: `Crédito de R$ ${rule.rewardValue.toFixed(2)}`,
          description: rule.description,
          type: rule.rewardType,
          value: rule.rewardValue,
          serviceName: undefined,
          status: "available",
          expiresAt,
          createdAt: baseDateIso,
        };
        onReward(reward);
      }
      continue;
    }

    if (rule.type === "QUANTITY_ACCUMULATION" && rule.thresholdQuantity) {
      if (!rule.categoryId) continue;

      let matchesBefore = 0;
      for (const apt of completedBeforeForClient) {
        for (const s of apt.services) {
          const catId = serviceNameToCategoryId[s.name];
          if (catId && catId === rule.categoryId) {
            matchesBefore += 1;
          }
        }
      }

      let matchesInNew = 0;
      for (const s of appointment.services) {
        const catId = serviceNameToCategoryId[s.name];
        if (catId && catId === rule.categoryId) {
          matchesInNew += 1;
        }
      }

      if (matchesBefore < rule.thresholdQuantity && matchesBefore + matchesInNew >= rule.thresholdQuantity) {
        const expiresAt = addDays(baseDateIso, rule.validityDays);
        const reward: Reward = {
          id: `rwd-${rule.id}-${clientId}-${Date.now()}`,
          clientId,
          title: rule.rewardServiceName || rule.name,
          description: rule.description,
          type: rule.rewardType,
          value: rule.rewardValue,
          serviceName: rule.rewardServiceName,
          status: "available",
          expiresAt,
          createdAt: baseDateIso,
        };
        onReward(reward);
      }
      continue;
    }

    if (rule.type === "SERVICE_SPECIFIC" && rule.thresholdQuantity) {
      if (!rule.serviceId && !rule.serviceName) continue;

      const targetServiceId = rule.serviceId;
      const targetServiceName = rule.serviceName;

      const isMatch = (serviceName: string): boolean => {
        const id = serviceNameToId[serviceName];
        if (targetServiceId && id === targetServiceId) return true;
        if (targetServiceName && serviceName === targetServiceName) return true;
        return false;
      };

      let matchesBefore = 0;
      for (const apt of completedBeforeForClient) {
        for (const s of apt.services) {
          if (isMatch(s.name)) {
            matchesBefore += 1;
          }
        }
      }

      let matchesInNew = 0;
      for (const s of appointment.services) {
        if (isMatch(s.name)) {
          matchesInNew += 1;
        }
      }

      if (matchesBefore < rule.thresholdQuantity && matchesBefore + matchesInNew >= rule.thresholdQuantity) {
        const expiresAt = addDays(baseDateIso, rule.validityDays);
        const reward: Reward = {
          id: `rwd-${rule.id}-${clientId}-${Date.now()}`,
          clientId,
          title: rule.rewardServiceName || rule.name,
          description: rule.description,
          type: rule.rewardType,
          value: rule.rewardValue,
          serviceName: rule.rewardServiceName,
          status: "available",
          expiresAt,
          createdAt: baseDateIso,
        };
        onReward(reward);
      }
      continue;
    }
  }
}

interface AppContextType {
  // Dados
  clients: Client[];
  appointments: Appointment[];
  rewards: Reward[];
  professionals: Professional[];
  rules: FidelityRule[];
  reviews: Review[];

  // Ações de Clientes
  getClientById: (id: string) => Client | undefined;
  getClientByPhone: (phone: string) => Client | undefined;
  updateClient: (client: Client) => void;
  addClient: (client: Client) => void;

  // Ações de Recompensas
  getClientRewards: (clientId: string) => Reward[];
  redeemReward: (rewardId: string) => void;
  addReward: (reward: Reward) => void;

  // Ações de Atendimentos
  getClientAppointments: (clientId: string) => Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  getClientPendingReview: (clientId: string) => Appointment | undefined;

  // Ações de Avaliações
  addReview: (review: Review) => void;

  // Ações de Profissionais
  getProfessionals: () => Professional[];
  addProfessional: (professional: Professional) => void;
  updateProfessional: (professional: Professional) => void;
  removeProfessional: (id: string) => void;

  // Ações de Regras
  getRules: () => FidelityRule[];
  addRule: (rule: FidelityRule) => void;
  updateRule: (rule: FidelityRule) => void;
  toggleRule: (id: string) => void;

  // Refresh
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para converter dados do Supabase para o formato do App
function mapSupabaseClientToClient(sc: ClientsAPI.FidelityClient): Client {
  return {
    id: sc.id,
    name: sc.name,
    phone: sc.phone,
    pin: sc.pin,
    email: sc.email || "",
    birthDate: sc.birth_date || "",
    pointsBalance: sc.points_balance,
    totalSpent: sc.total_spent,
    totalAppointments: sc.total_appointments,
    lastVisit: sc.last_visit || "",
    createdAt: sc.created_at,
  };
}

function mapSupabaseRewardToReward(sr: RewardsAPI.FidelityReward): Reward {
  return {
    id: sr.id,
    clientId: sr.client_id,
    title: sr.title,
    description: sr.description || "",
    type: sr.type,
    value: sr.value,
    serviceName: sr.service_name,
    status: sr.status,
    expiresAt: sr.expires_at || "",
    createdAt: sr.created_at,
  };
}

function mapSupabaseAppointmentToAppointment(sa: AppointmentsAPI.FidelityAppointment): Appointment {
  return {
    id: sa.id,
    clientId: sa.client_id,
    clientName: sa.client_name || "",
    professionalId: sa.professional_id || "",
    professionalName: sa.professional_name || "",
    date: sa.date,
    time: sa.time || "",
    status: sa.status,
    services: (sa.services || []).map((s) => ({
      name: s.service_name,
      price: s.price,
    })),
    total: sa.total,
    pointsEarned: sa.points_earned,
    hasReview: sa.has_review,
    review: sa.review_rating
      ? { rating: sa.review_rating, comment: sa.review_comment || "" }
      : undefined,
  };
}

function mapSupabaseRuleToRule(sr: RulesAPI.FidelityRuleDB): FidelityRule {
  return {
    id: sr.id,
    name: sr.name,
    description: sr.description || "",
    type: sr.type,
    categoryId: sr.category_id,
    categoryName: sr.category_name,
    serviceId: sr.service_id,
    serviceName: sr.service_name,
    thresholdValue: sr.threshold_value,
    thresholdQuantity: sr.threshold_quantity,
    rewardType: sr.reward_type,
    rewardValue: sr.reward_value,
    rewardServiceId: sr.reward_service_id,
    rewardServiceName: sr.reward_service_name,
    validityDays: sr.validity_days,
    isActive: sr.is_active,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [rules, setRules] = useState<FidelityRule[]>(initialRules);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);

  // Carregar dados do Supabase na inicialização
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        console.log("[AppContext] Carregando dados do Supabase Bedeschi...");

        // Carregar clientes
        const supaClients = await ClientsAPI.getClients();
        if (supaClients.length > 0) {
          setClients(supaClients.map(mapSupabaseClientToClient));
          console.log(`[AppContext] ${supaClients.length} clientes carregados do Supabase`);
        } else {
          console.log("[AppContext] Nenhum cliente no Supabase, usando mocks");
        }

        // Carregar agendamentos
        const supaAppointments = await AppointmentsAPI.getAppointmentsWithServices();
        if (supaAppointments.length > 0) {
          setAppointments(supaAppointments.map(mapSupabaseAppointmentToAppointment));
          console.log(`[AppContext] ${supaAppointments.length} agendamentos carregados do Supabase`);
        } else {
          console.log("[AppContext] Nenhum agendamento no Supabase, usando mocks");
        }

        // Carregar recompensas
        const supaRewards = await RewardsAPI.getRewards();
        if (supaRewards.length > 0) {
          setRewards(supaRewards.map(mapSupabaseRewardToReward));
          console.log(`[AppContext] ${supaRewards.length} recompensas carregadas do Supabase`);
        } else {
          console.log("[AppContext] Nenhuma recompensa no Supabase, usando mocks");
        }

        // Carregar regras
        const supaRules = await RulesAPI.getRules();
        if (supaRules.length > 0) {
          setRules(supaRules.map(mapSupabaseRuleToRule));
          console.log(`[AppContext] ${supaRules.length} regras carregadas do Supabase`);
        } else {
          console.log("[AppContext] Nenhuma regra no Supabase, usando mocks");
        }

        // Carregar avaliações
        const supaReviews = await ReviewsAPI.getReviews();
        if (supaReviews.length > 0) {
          const mappedReviews = supaReviews.map((sr) => ({
            id: sr.id,
            clientId: sr.client_id,
            appointmentId: sr.appointment_id,
            rating: sr.rating,
            comment: sr.comment || "",
            createdAt: sr.created_at,
          }));
          setReviews(mappedReviews);
          console.log(`[AppContext] ${supaReviews.length} avaliações carregadas do Supabase`);
        } else {
          console.log("[AppContext] Nenhuma avaliação no Supabase, usando mocks");
        }

        setSupabaseLoaded(true);
        console.log("[AppContext] Dados carregados com sucesso do Supabase Bedeschi!");
      } catch (error) {
        console.error("[AppContext] Erro ao carregar do Supabase, usando mocks:", error);
        setSupabaseLoaded(true); // Marca como carregado mesmo com erro para não travar
      }
    }

    loadFromSupabase();
  }, []);

  // Clientes
  const getClientById = useCallback((id: string) => {
    return clients.find((c) => c.id === id);
  }, [clients]);

  const getClientByPhone = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return clients.find((c) => c.phone === cleanPhone);
  }, [clients]);

  const updateClient = useCallback((client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    
    // Persistir no Supabase
    ClientsAPI.updateClient(client.id, {
      name: client.name,
      phone: client.phone,
      pin: client.pin,
      email: client.email,
      birth_date: client.birthDate,
      points_balance: client.pointsBalance,
      total_spent: client.totalSpent,
      total_appointments: client.totalAppointments,
      last_visit: client.lastVisit,
    }).catch((err) => console.error("[AppContext] Erro ao atualizar cliente no Supabase:", err));
  }, []);

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [...prev, client]);
    
    // Persistir no Supabase
    ClientsAPI.createClient({
      name: client.name,
      phone: client.phone,
      pin: client.pin,
      email: client.email,
      birth_date: client.birthDate,
    }).then((created) => {
      if (created) {
        // Atualizar o ID local com o ID real do Supabase
        setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, id: created.id } : c));
        console.log(`[AppContext] Cliente ${client.name} criado no Supabase`);
      }
    }).catch((err) => console.error("[AppContext] Erro ao criar cliente no Supabase:", err));
  }, []);

  // Recompensas
  const getClientRewards = useCallback((clientId: string) => {
    return rewards.filter((r) => r.clientId === clientId && r.status === "available");
  }, [rewards]);

  const redeemReward = useCallback((rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId ? { ...r, status: "redeemed" as const } : r
      )
    );
    
    // Persistir no Supabase
    RewardsAPI.redeemReward(rewardId)
      .then((result) => {
        if (result) {
          console.log(`[AppContext] Recompensa ${rewardId} resgatada no Supabase`);
        }
      })
      .catch((err) => console.error("[AppContext] Erro ao resgatar recompensa no Supabase:", err));
  }, []);

  const addReward = useCallback((reward: Reward) => {
    setRewards((prev) => [...prev, reward]);
    
    // Persistir no Supabase
    RewardsAPI.createReward({
      client_id: reward.clientId,
      title: reward.title,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      service_name: reward.serviceName,
      expires_at: reward.expiresAt,
    }).catch((err) => console.error("[AppContext] Erro ao criar recompensa no Supabase:", err));
  }, []);

  // Atendimentos
  const getClientAppointments = useCallback((clientId: string) => {
    return appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments]);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev]);

    const client = clients.find((c) => c.id === appointment.clientId);
    if (!client) {
      return;
    }

    const clientBefore = client;
    const clientAfter: Client = {
      ...clientBefore,
      pointsBalance: clientBefore.pointsBalance + appointment.pointsEarned,
      totalSpent: clientBefore.totalSpent + appointment.total,
      totalAppointments: clientBefore.totalAppointments + 1,
      lastVisit: appointment.date,
    };

    // Persistir agendamento no Supabase
    AppointmentsAPI.createAppointment({
      client_id: appointment.clientId,
      client_name: appointment.clientName,
      professional_id: appointment.professionalId,
      professional_name: appointment.professionalName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      total: appointment.total,
      points_earned: appointment.pointsEarned,
      services: appointment.services.map((s) => ({
        service_name: s.name,
        price: s.price,
      })),
    }).catch((err) => console.error("[AppContext] Erro ao criar agendamento no Supabase:", err));

    evaluateFidelityRulesForAppointment({
      appointment,
      clientBefore,
      clientAfter,
      allAppointmentsBefore: appointments,
      rules,
      onReward: (reward) => {
        setRewards((prev) => [...prev, reward]);
        // Persistir recompensa gerada no Supabase
        RewardsAPI.createReward({
          client_id: reward.clientId,
          title: reward.title,
          description: reward.description,
          type: reward.type,
          value: reward.value,
          service_name: reward.serviceName,
          expires_at: reward.expiresAt,
        }).catch((err) => console.error("[AppContext] Erro ao criar recompensa no Supabase:", err));
      },
    });

    updateClient(clientAfter);
  }, [clients, appointments, rules, updateClient]);

  const updateAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? appointment : a))
    );
    
    // Persistir no Supabase
    AppointmentsAPI.updateAppointment(appointment.id, {
      status: appointment.status,
      has_review: appointment.hasReview,
      review_rating: appointment.review?.rating,
      review_comment: appointment.review?.comment,
    }).catch((err) => console.error("[AppContext] Erro ao atualizar agendamento no Supabase:", err));
  }, []);

  const getClientPendingReview = useCallback((clientId: string) => {
    return appointments.find(
      (a) => a.clientId === clientId && a.status === "completed" && !a.hasReview
    );
  }, [appointments]);

  // Avaliações
  const addReview = useCallback((review: Review) => {
    const existingForAppointment = reviews.find(
      (r) => r.appointmentId === review.appointmentId && r.clientId === review.clientId,
    );
    if (existingForAppointment) {
      return;
    }

    const apt = appointments.find((a) => a.id === review.appointmentId);
    if (apt?.hasReview) {
      return;
    }

    setReviews((prev) => [...prev, review]);
    
    // Persistir avaliação no Supabase com staff_id
    ReviewsAPI.createReview({
      client_id: review.clientId,
      appointment_id: review.appointmentId,
      staff_id: review.professionalId,
      rating: review.rating,
      comment: review.comment,
    }).catch((err) => console.error("[AppContext] Erro ao criar avaliação no Supabase:", err));
    
    // Marca atendimento como avaliado
    if (apt) {
      updateAppointment({
        ...apt,
        hasReview: true,
        review: {
          rating: review.rating,
          comment: review.comment,
        },
      });
    }
  }, [appointments, reviews, updateAppointment]);

  // Profissionais
  const getProfessionals = useCallback(() => {
    return professionals.filter((p) => p.isActive);
  }, [professionals]);

  const addProfessional = useCallback((professional: Professional) => {
    setProfessionals((prev) => [...prev, professional]);
  }, []);

  const updateProfessional = useCallback((professional: Professional) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === professional.id ? professional : p))
    );
  }, []);

  const removeProfessional = useCallback((id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Regras
  const getRules = useCallback(() => {
    return rules;
  }, [rules]);

  const addRule = useCallback((rule: FidelityRule) => {
    setRules((prev) => [...prev, rule]);
    
    // Persistir no Supabase
    RulesAPI.createRule({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      category_id: rule.categoryId,
      category_name: rule.categoryName,
      service_id: rule.serviceId,
      service_name: rule.serviceName,
      threshold_value: rule.thresholdValue,
      threshold_quantity: rule.thresholdQuantity,
      reward_type: rule.rewardType,
      reward_value: rule.rewardValue,
      reward_service_id: rule.rewardServiceId,
      reward_service_name: rule.rewardServiceName,
      validity_days: rule.validityDays,
    }).catch((err) => console.error("[AppContext] Erro ao criar regra no Supabase:", err));
  }, []);

  const updateRule = useCallback((rule: FidelityRule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    
    // Persistir no Supabase
    RulesAPI.updateRule(rule.id, {
      name: rule.name,
      description: rule.description,
      type: rule.type,
      category_id: rule.categoryId,
      category_name: rule.categoryName,
      service_id: rule.serviceId,
      service_name: rule.serviceName,
      threshold_value: rule.thresholdValue,
      threshold_quantity: rule.thresholdQuantity,
      reward_type: rule.rewardType,
      reward_value: rule.rewardValue,
      reward_service_id: rule.rewardServiceId,
      reward_service_name: rule.rewardServiceName,
      validity_days: rule.validityDays,
      is_active: rule.isActive,
    }).catch((err) => console.error("[AppContext] Erro ao atualizar regra no Supabase:", err));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    
    // Persistir no Supabase
    RulesAPI.toggleRule(id)
      .then((result) => {
        if (result) {
          console.log(`[AppContext] Regra ${id} alternada no Supabase`);
        }
      })
      .catch((err) => console.error("[AppContext] Erro ao alternar regra no Supabase:", err));
  }, []);

  // Refresh - Recarregar do Supabase
  const refreshData = useCallback(async () => {
    try {
      console.log("[AppContext] Recarregando dados do Supabase...");
      
      const [supaClients, supaAppointments, supaRewards, supaRules, supaReviews] = await Promise.all([
        ClientsAPI.getClients(),
        AppointmentsAPI.getAppointmentsWithServices(),
        RewardsAPI.getRewards(),
        RulesAPI.getRules(),
        ReviewsAPI.getReviews(),
      ]);

      if (supaClients.length > 0) {
        setClients(supaClients.map(mapSupabaseClientToClient));
      } else {
        setClients([...initialClients]);
      }

      if (supaAppointments.length > 0) {
        setAppointments(supaAppointments.map(mapSupabaseAppointmentToAppointment));
      } else {
        setAppointments([...initialAppointments]);
      }

      if (supaRewards.length > 0) {
        setRewards(supaRewards.map(mapSupabaseRewardToReward));
      } else {
        setRewards([...initialRewards]);
      }

      if (supaRules.length > 0) {
        setRules(supaRules.map(mapSupabaseRuleToRule));
      } else {
        setRules([...initialRules]);
      }

      // Profissionais em mock
      setProfessionals([...initialProfessionals]);
      
      // Reviews do Supabase
      if (supaReviews.length > 0) {
        const mappedReviews = supaReviews.map((sr) => ({
          id: sr.id,
          clientId: sr.client_id,
          appointmentId: sr.appointment_id,
          rating: sr.rating,
          comment: sr.comment || "",
          createdAt: sr.created_at,
        }));
        setReviews(mappedReviews);
        console.log(`[AppContext] ${supaReviews.length} avaliações carregadas do Supabase`);
      } else {
        setReviews([...initialReviews]);
      }
      
      console.log("[AppContext] Dados recarregados com sucesso!");
    } catch (error) {
      console.error("[AppContext] Erro ao recarregar, usando mocks:", error);
      setClients([...initialClients]);
      setAppointments([...initialAppointments]);
      setRewards([...initialRewards]);
      setProfessionals([...initialProfessionals]);
      setRules([...initialRules]);
      setReviews([...initialReviews]);
    }
  }, []);

  const value: AppContextType = {
    clients,
    appointments,
    rewards,
    professionals,
    rules,
    reviews,
    getClientById,
    getClientByPhone,
    updateClient,
    addClient,
    getClientRewards,
    redeemReward,
    addReward,
    getClientAppointments,
    addAppointment,
    updateAppointment,
    getClientPendingReview,
    addReview,
    getProfessionals,
    addProfessional,
    updateProfessional,
    removeProfessional,
    getRules,
    addRule,
    updateRule,
    toggleRule,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Hook específico para cliente
export function useClientData(clientId: string) {
  const { getClientById, getClientRewards, getClientAppointments, getClientPendingReview } = useApp();
  
  return {
    client: getClientById(clientId),
    rewards: getClientRewards(clientId),
    appointments: getClientAppointments(clientId),
    pendingReview: getClientPendingReview(clientId),
  };
}
