"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  type Client,
  type Appointment,
  type Reward,
  type Professional,
  type FidelityRule,
  type Review,
  type Service,
} from "./mock-data";

// APIs do Supabase Bedeschi
import * as ClientsAPI from "./clients-api";
import * as AppointmentsAPI from "./appointments-api";
import * as RewardsAPI from "./rewards-api";
import * as RulesAPI from "./rules-api";
import * as ReviewsAPI from "./reviews-api";
import * as ServicesAPI from "./services-api";
import { getStaffUsers } from "./staff-users-api";

// Helper para adicionar dias a uma data ISO
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

// Helper para avaliar regras de fidelidade
// Garante que cada cliente entre em cada regra apenas UMA VEZ por transação
function evaluateFidelityRulesForAppointment(params: {
  appointment: Appointment;
  clientBefore: Client;
  clientAfter: Client;
  allAppointmentsBefore: Appointment[];
  rules: FidelityRule[];
  services: Service[];
  onReward: (reward: Reward) => void;
}) {
  const {
    appointment,
    clientBefore,
    clientAfter,
    allAppointmentsBefore,
    rules,
    services,
    onReward,
  } = params;

  if (!rules.length) return;

  const serviceNameToCategoryId: Record<string, string> = {};
  const serviceNameToId: Record<string, string> = {};

  for (const svc of services) {
    if (!serviceNameToCategoryId[svc.name]) {
      serviceNameToCategoryId[svc.name] = svc.categoryId;
    }
    if (!serviceNameToId[svc.name]) {
      serviceNameToId[svc.name] = svc.id;
    }
  }

  const clientId = clientBefore.id;
  const baseDateIso = appointment.date || new Date().toISOString().slice(0, 10);

  const completedBeforeForClient = allAppointmentsBefore.filter(
    (a) => a.clientId === clientId && a.status === "completed",
  );

  // Rastrear quais regras já geraram recompensas nesta transação
  const rulesTriggeredInThisTransaction = new Set<string>();

  for (const rule of rules) {
    if (!rule.isActive) continue;
    
    // Evitar múltiplas entradas na mesma regra durante uma transação
    if (rulesTriggeredInThisTransaction.has(rule.id)) continue;

    // VALUE_ACCUMULATION e COMBO_VALUE funcionam de forma similar - baseado no valor total gasto
    if ((rule.type === "COMBO_VALUE" || rule.type === "VALUE_ACCUMULATION") && rule.thresholdValue) {
      const beforeTotal = clientBefore.totalSpent;
      const afterTotal = clientAfter.totalSpent;
      
      // Verifica se cruzou o limiar apenas uma vez nesta transação
      const beforeCycles = Math.floor(beforeTotal / rule.thresholdValue);
      const afterCycles = Math.floor(afterTotal / rule.thresholdValue);

      // Só gera recompensa se cruzou o limiar exatamente uma vez
      if (afterCycles > beforeCycles && afterCycles - beforeCycles === 1) {
        const expiresAt = addDays(baseDateIso, rule.validityDays);
        const reward: Reward = {
          id: `rwd-${rule.id}-${clientId}-${Date.now()}`,
          clientId,
          title: rule.rewardServiceName || rule.name,
          description: rule.description,
          type: rule.rewardType,
          value:
            rule.rewardType === "CREDIT" ||
            rule.rewardType === "DISCOUNT_FIXED" ||
            rule.rewardType === "DISCOUNT_PERCENT"
              ? rule.rewardValue
              : undefined,
          serviceName:
            rule.rewardType === "FREE_SERVICE"
              ? rule.rewardServiceName
              : undefined,
          status: "available",
          expiresAt,
          createdAt: baseDateIso,
        };
        onReward(reward);
        rulesTriggeredInThisTransaction.add(rule.id);
      }
      continue;
    }

    if (
      rule.type === "POINTS_CONVERSION" &&
      rule.thresholdValue &&
      rule.rewardValue
    ) {
      const beforePoints = clientBefore.pointsBalance;
      const afterPoints = clientAfter.pointsBalance;
      
      // Verifica se cruzou o limiar apenas uma vez nesta transação
      const beforeCycles = Math.floor(beforePoints / rule.thresholdValue);
      const afterCycles = Math.floor(afterPoints / rule.thresholdValue);

      if (afterCycles > beforeCycles && afterCycles - beforeCycles === 1) {
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
        rulesTriggeredInThisTransaction.add(rule.id);
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

      const totalMatchesAfter = matchesBefore + matchesInNew;
      const beforeCycles = Math.floor(matchesBefore / rule.thresholdQuantity);
      const afterCycles = Math.floor(totalMatchesAfter / rule.thresholdQuantity);

      if (afterCycles > beforeCycles && afterCycles - beforeCycles === 1) {
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
        rulesTriggeredInThisTransaction.add(rule.id);
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

      const totalMatchesAfter = matchesBefore + matchesInNew;
      const beforeCycles = Math.floor(matchesBefore / rule.thresholdQuantity);
      const afterCycles = Math.floor(totalMatchesAfter / rule.thresholdQuantity);

      if (afterCycles > beforeCycles && afterCycles - beforeCycles === 1) {
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
        rulesTriggeredInThisTransaction.add(rule.id);
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
  services: Service[];

  // Ações de Clientes
  getClientById: (id: string) => Client | undefined;
  getClientByPhone: (phone: string) => Client | undefined;
  updateClient: (client: Client) => void;
  addClient: (client: Client) => Promise<Client | null>;
  deleteClient: (clientId: string) => Promise<boolean>;

  // Ações de Recompensas
  getClientRewards: (clientId: string) => Reward[];
  redeemReward: (rewardId: string) => void;
  addReward: (reward: Reward) => void;

  // Ações de Atendimentos
  getClientAppointments: (clientId: string) => Appointment[];
  addAppointment: (appointment: Appointment) => Promise<void>;
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
  deleteRule: (id: string) => void;

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

function mapSupabaseAppointmentToAppointment(
  sa: AppointmentsAPI.FidelityAppointment,
): Appointment {
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

function mapSupabaseServiceToService(ss: ServicesAPI.Service): Service {
  return {
    id: ss.id,
    externalCode: ss.external_code,
    name: ss.name,
    categoryId: ss.category_id,
    categoryName: ss.category_name,
    price: ss.price,
    durationMinutes: ss.duration_minutes,
    isActive: ss.is_active,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rules, setRules] = useState<FidelityRule[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);

  // Carregar dados do Supabase na inicialização
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        console.log("[AppContext] Carregando dados do Supabase Bedeschi...");

        // Carregar clientes
        const supaClients = await ClientsAPI.getClients();
        setClients(supaClients.map(mapSupabaseClientToClient));
        console.log(
          `[AppContext] ${supaClients.length} clientes carregados do Supabase`,
        );

        // Carregar agendamentos
        const supaAppointments =
          await AppointmentsAPI.getAppointmentsWithServices();
        setAppointments(
          supaAppointments.map(mapSupabaseAppointmentToAppointment),
        );
        console.log(
          `[AppContext] ${supaAppointments.length} agendamentos carregados do Supabase`,
        );

        // Carregar recompensas
        const supaRewards = await RewardsAPI.getRewards();
        setRewards(supaRewards.map(mapSupabaseRewardToReward));
        console.log(
          `[AppContext] ${supaRewards.length} recompensas carregadas do Supabase`,
        );

        // Carregar regras
        const supaRules = await RulesAPI.getRules();
        setRules(supaRules.map(mapSupabaseRuleToRule));
        console.log(
          `[AppContext] ${supaRules.length} regras carregadas do Supabase`,
        );

        // Carregar avaliações
        const supaReviews = await ReviewsAPI.getReviews();
        const mappedReviews = supaReviews.map((sr) => ({
          id: sr.id,
          clientId: sr.client_id,
          appointmentId: sr.appointment_id,
          rating: sr.rating,
          comment: sr.comment || "",
          createdAt: sr.created_at,
          professionalId: sr.professional_id,
          professionalName: sr.professional_name || "N/A",
        }));
        setReviews(mappedReviews);
        console.log(
          `[AppContext] ${supaReviews.length} avaliações carregadas do Supabase`,
        );

        // Carregar profissionais (staff)
        const supaStaff = await getStaffUsers();
        const mappedProfessionals: Professional[] = supaStaff.map((staff) => ({
          id: staff.id,
          name: staff.name,
          role: staff.role === "admin" || staff.role === "recepcao" ? "profissional" : staff.role as "profissional" | "recepcionista" | "medico",
          specialty: staff.specialty || "",
          isActive: staff.is_active,
          servicesIds: [],
          rating: 5.0,
          totalAppointments: 0,
          createdAt: staff.created_at,
        }));
        setProfessionals(mappedProfessionals);
        console.log(
          `[AppContext] ${mappedProfessionals.length} profissionais carregados do Supabase`,
        );

        // Carregar serviços
        const supaServices = await ServicesAPI.getServices();
        const mappedServices: Service[] = supaServices.map((s) => ({
          id: s.id,
          externalCode: s.external_code,
          name: s.name,
          categoryId: s.category_id || "",
          categoryName: s.category_name || "",
          price: s.price,
          durationMinutes: s.duration_minutes || 60,
          isActive: s.is_active,
        }));
        setServices(mappedServices);
        console.log(
          `[AppContext] ${mappedServices.length} serviços carregados do Supabase`,
        );

        setSupabaseLoaded(true);
        console.log(
          "[AppContext] Dados carregados com sucesso do Supabase Bedeschi!",
        );
      } catch (error) {
        console.error(
          "[AppContext] Erro ao carregar do Supabase:",
          error,
        );
        setSupabaseLoaded(true); // Marca como carregado mesmo com erro para não travar
      }
    }

    loadFromSupabase();
  }, []);

  // Clientes
  const getClientById = useCallback(
    (id: string) => {
      return clients.find((c) => c.id === id);
    },
    [clients],
  );

  const getClientByPhone = useCallback(
    (phone: string) => {
      const cleanPhone = phone.replace(/\D/g, "");
      return clients.find((c) => c.phone === cleanPhone);
    },
    [clients],
  );

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
    }).catch((err) =>
      console.error("[AppContext] Erro ao atualizar cliente no Supabase:", err),
    );
  }, []);

  const addClient = useCallback(async (client: Client): Promise<Client | null> => {
    // Primeiro, criar no Supabase para garantir persistência
    try {
      const created = await ClientsAPI.createClient({
        name: client.name,
        phone: client.phone,
        pin: client.pin,
        email: client.email,
        birth_date: client.birthDate,
      });

      if (created) {
        // Usar o ID real do Supabase
        const clientWithRealId: Client = {
          ...client,
          id: created.id,
        };
        setClients((prev) => [...prev, clientWithRealId]);
        console.log(`[AppContext] ✅ Cliente ${client.name} criado no Supabase com ID: ${created.id}`);
        return clientWithRealId;
      } else {
        console.error("[AppContext] ❌ Falha ao criar cliente no Supabase");
        // Adicionar localmente mesmo assim para não perder dados
        setClients((prev) => [...prev, client]);
        return client;
      }
    } catch (err) {
      console.error("[AppContext] ❌ Erro ao criar cliente no Supabase:", err);
      // Adicionar localmente mesmo assim para não perder dados
      setClients((prev) => [...prev, client]);
      return client;
    }
  }, []);

  // Excluir cliente (apenas admin)
  const deleteClient = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      const success = await ClientsAPI.deleteClient(clientId);
      if (success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        console.log(`[AppContext] ✅ Cliente ${clientId} excluído do Supabase`);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[AppContext] ❌ Erro ao excluir cliente:", err);
      return false;
    }
  }, []);

  // Recompensas
  const getClientRewards = useCallback(
    (clientId: string) => {
      return rewards.filter(
        (r) => r.clientId === clientId && r.status === "available",
      );
    },
    [rewards],
  );

  const redeemReward = useCallback((rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId ? { ...r, status: "redeemed" as const } : r,
      ),
    );

    // Persistir no Supabase
    RewardsAPI.redeemReward(rewardId)
      .then((result) => {
        if (result) {
          console.log(
            `[AppContext] Recompensa ${rewardId} resgatada no Supabase`,
          );
        }
      })
      .catch((err) =>
        console.error(
          "[AppContext] Erro ao resgatar recompensa no Supabase:",
          err,
        ),
      );
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
    }).catch((err) =>
      console.error("[AppContext] Erro ao criar recompensa no Supabase:", err),
    );
  }, []);

  // Atendimentos
  const getClientAppointments = useCallback(
    (clientId: string) => {
      return appointments
        .filter((a) => a.clientId === clientId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    },
    [appointments],
  );

  const addAppointment = useCallback(
    async (appointment: Appointment) => {
      const client = clients.find((c) => c.id === appointment.clientId);
      if (!client) {
        console.error(`[AppContext] ❌ Cliente ${appointment.clientId} não encontrado`);
        return;
      }

      console.log(`[AppContext] 📝 Criando atendimento para cliente ${client.name} (ID: ${client.id})`);

      // Persistir agendamento no Supabase PRIMEIRO
      const createdAppointment = await AppointmentsAPI.createAppointment({
        client_id: client.id,
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
      }).catch((err) => {
        console.error("[AppContext] ❌ Erro ao criar agendamento no Supabase:", err);
        return null;
      });

      if (!createdAppointment) {
        alert("❌ Erro ao salvar atendimento. Verifique se o cliente está cadastrado no sistema.");
        return;
      }

      // Usar o ID real do Supabase
      const appointmentWithRealId = {
        ...appointment,
        id: createdAppointment.id,
      };

      setAppointments((prev) => [appointmentWithRealId, ...prev]);
      console.log(`[AppContext] ✅ Atendimento ${createdAppointment.id} criado no Supabase`);

      const clientBefore = client;
      const clientAfter: Client = {
        ...clientBefore,
        pointsBalance: clientBefore.pointsBalance + appointment.pointsEarned,
        totalSpent: clientBefore.totalSpent + appointment.total,
        totalAppointments: clientBefore.totalAppointments + 1,
        lastVisit: appointment.date,
      };

      // Atualizar estatísticas do cliente no Supabase
      await ClientsAPI.updateClientStats(
        client.id,
        appointment.pointsEarned,
        appointment.total,
        appointment.date
      ).then((updated) => {
        if (updated) {
          console.log(`[AppContext] ✅ Estatísticas do cliente ${client.name} atualizadas`);
          setClients((prev) => prev.map((c) => c.id === client.id ? clientAfter : c));
        } else {
          console.error(`[AppContext] ❌ Erro ao atualizar estatísticas do cliente`);
        }
      }).catch((err) => {
        console.error("[AppContext] ❌ Erro ao atualizar cliente:", err);
      });

      evaluateFidelityRulesForAppointment({
        appointment: appointmentWithRealId,
        clientBefore,
        clientAfter,
        allAppointmentsBefore: appointments,
        rules,
        services,
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
          }).then(() => {
            console.log(`[AppContext] ✅ Recompensa criada para ${client.name}`);
          }).catch((err) =>
            console.error(
              "[AppContext] ❌ Erro ao criar recompensa no Supabase:",
              err,
            ),
          );
        },
      });
    },
    [clients, appointments, rules, services],
  );

  const updateAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? appointment : a)),
    );

    // Persistir no Supabase
    AppointmentsAPI.updateAppointment(appointment.id, {
      status: appointment.status,
      has_review: appointment.hasReview,
      review_rating: appointment.review?.rating,
      review_comment: appointment.review?.comment,
    }).catch((err) =>
      console.error(
        "[AppContext] Erro ao atualizar agendamento no Supabase:",
        err,
      ),
    );
  }, []);

  const getClientPendingReview = useCallback(
    (clientId: string) => {
      return appointments.find(
        (a) =>
          a.clientId === clientId && a.status === "completed" && !a.hasReview,
      );
    },
    [appointments],
  );

  // Avaliações
  const addReview = useCallback(
    (review: Review) => {
      const existingForAppointment = reviews.find(
        (r) =>
          r.appointmentId === review.appointmentId &&
          r.clientId === review.clientId,
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
      }).catch((err) =>
        console.error("[AppContext] Erro ao criar avaliação no Supabase:", err),
      );

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
    },
    [appointments, reviews, updateAppointment],
  );

  // Profissionais
  const getProfessionals = useCallback(() => {
    return professionals.filter((p) => p.isActive);
  }, [professionals]);

  const addProfessional = useCallback((professional: Professional) => {
    setProfessionals((prev) => [...prev, professional]);
  }, []);

  const updateProfessional = useCallback((professional: Professional) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === professional.id ? professional : p)),
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
    }).catch((err) =>
      console.error("[AppContext] Erro ao criar regra no Supabase:", err),
    );
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
    }).catch((err) =>
      console.error("[AppContext] Erro ao atualizar regra no Supabase:", err),
    );
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    );

    // Persistir no Supabase
    RulesAPI.toggleRule(id)
      .then((result) => {
        if (result) {
          console.log(`[AppContext] Regra ${id} alternada no Supabase`);
        }
      })
      .catch((err) =>
        console.error(`[AppContext] Erro ao alternar regra no Supabase:`, err),
      );
  }, []);

  const deleteRule = useCallback((id: string) => {
    // Remover do estado local
    setRules((prev) => prev.filter((r) => r.id !== id));

    // Deletar no Supabase
    RulesAPI.deleteRule(id)
      .then((success) => {
        if (success) {
          console.log(`[AppContext] Regra ${id} excluída do Supabase`);
        }
      })
      .catch((err) =>
        console.error(`[AppContext] Erro ao excluir regra do Supabase:`, err),
      );
  }, []);

  // Refresh - Recarregar do Supabase
  const refreshData = useCallback(async () => {
    try {
      console.log("[AppContext] Recarregando dados do Supabase...");

      const [
        supaClients,
        supaAppointments,
        supaRewards,
        supaRules,
        supaReviews,
        supaServices,
      ] = await Promise.all([
        ClientsAPI.getClients(),
        AppointmentsAPI.getAppointmentsWithServices(),
        RewardsAPI.getRewards(),
        RulesAPI.getRules(),
        ReviewsAPI.getReviews(),
        ServicesAPI.getServices(),
      ]);

      // SEMPRE atualizar o estado com os dados do Supabase, mesmo que vazio
      // Isso garante sincronização total entre banco e aplicação
      setClients(supaClients.map(mapSupabaseClientToClient));
      setAppointments(
        supaAppointments.map(mapSupabaseAppointmentToAppointment),
      );
      setRewards(supaRewards.map(mapSupabaseRewardToReward));
      setRules(supaRules.map(mapSupabaseRuleToRule));
      setServices(supaServices.map(mapSupabaseServiceToService));

      // Profissionais do Supabase
      const supaStaff = await getStaffUsers();
      const mappedStaff: Professional[] = supaStaff
        .filter((u) => u.role === "profissional" || u.role === "medico")
        .map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role as "profissional" | "medico",
          specialty: u.specialty,
          email: u.email,
          servicesIds: [],
          rating: 5.0,
          totalAppointments: 0,
          isActive: u.is_active,
          createdAt: u.created_at,
        }));
      setProfessionals(mappedStaff);

      // Reviews do Supabase
      const mappedReviews = supaReviews.map((sr) => ({
        id: sr.id,
        clientId: sr.client_id,
        appointmentId: sr.appointment_id,
        rating: sr.rating,
        comment: sr.comment || "",
        createdAt: sr.created_at,
      }));
      setReviews(mappedReviews);

      console.log("[AppContext] Dados recarregados com sucesso!");
    } catch (error) {
      console.error("[AppContext] Erro ao recarregar:", error);
    }
  }, []);

  const value: AppContextType = {
    clients,
    appointments,
    rewards,
    professionals,
    rules,
    reviews,
    services,
    getClientById,
    getClientByPhone,
    updateClient,
    addClient,
    deleteClient,
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
    deleteRule,
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
  const {
    getClientById,
    getClientRewards,
    getClientAppointments,
    getClientPendingReview,
  } = useApp();

  return {
    client: getClientById(clientId),
    rewards: getClientRewards(clientId),
    appointments: getClientAppointments(clientId),
    pendingReview: getClientPendingReview(clientId),
  };
}
