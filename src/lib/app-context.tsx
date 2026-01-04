"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  mockClients as initialClients,
  mockAppointments as initialAppointments,
  mockRewards as initialRewards,
  mockProfessionals as initialProfessionals,
  mockFidelityRules as initialRules,
  mockReviews as initialReviews,
  type Client,
  type Appointment,
  type Reward,
  type Professional,
  type FidelityRule,
  type Review,
} from "./mock-data";

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [rules, setRules] = useState<FidelityRule[]>(initialRules);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

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
  }, []);

  const addReward = useCallback((reward: Reward) => {
    setRewards((prev) => [...prev, reward]);
  }, []);

  // Atendimentos
  const getClientAppointments = useCallback((clientId: string) => {
    return appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments]);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
    
    // Atualiza pontos do cliente
    const client = clients.find((c) => c.id === appointment.clientId);
    if (client) {
      updateClient({
        ...client,
        pointsBalance: client.pointsBalance + appointment.pointsEarned,
        totalSpent: client.totalSpent + appointment.total,
        totalAppointments: client.totalAppointments + 1,
        lastVisit: appointment.date,
      });
    }
  }, [clients, updateClient]);

  const updateAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? appointment : a))
    );
  }, []);

  const getClientPendingReview = useCallback((clientId: string) => {
    return appointments.find(
      (a) => a.clientId === clientId && a.status === "completed" && !a.hasReview
    );
  }, [appointments]);

  // Avaliações
  const addReview = useCallback((review: Review) => {
    setReviews((prev) => [...prev, review]);
    
    // Marca atendimento como avaliado
    const apt = appointments.find((a) => a.id === review.appointmentId);
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
  }, [appointments, updateAppointment]);

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
  }, []);

  const updateRule = useCallback((rule: FidelityRule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }, []);

  // Refresh
  const refreshData = useCallback(() => {
    setClients([...initialClients]);
    setAppointments([...initialAppointments]);
    setRewards([...initialRewards]);
    setProfessionals([...initialProfessionals]);
    setRules([...initialRules]);
    setReviews([...initialReviews]);
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
