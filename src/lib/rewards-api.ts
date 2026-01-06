/**
 * API para gerenciamento de recompensas no Supabase
 * Projeto: Bedeschi Fidelidade/Estética
 */

import { supabase } from "./supabase";

export interface FidelityReward {
  id: string;
  client_id: string;
  rule_id?: string;
  title: string;
  description?: string;
  type: "FREE_SERVICE" | "DISCOUNT_PERCENT" | "DISCOUNT_FIXED" | "CREDIT";
  value?: number;
  service_name?: string;
  status: "available" | "redeemed" | "expired";
  expires_at?: string;
  redeemed_at?: string;
  created_at: string;
}

export interface CreateRewardInput {
  client_id: string;
  rule_id?: string;
  title: string;
  description?: string;
  type: "FREE_SERVICE" | "DISCOUNT_PERCENT" | "DISCOUNT_FIXED" | "CREDIT";
  value?: number;
  service_name?: string;
  expires_at?: string;
}

// Buscar todas as recompensas
export async function getRewards(): Promise<FidelityReward[]> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar recompensas:", error);
    return [];
  }

  return data || [];
}

// Buscar recompensas por cliente
export async function getRewardsByClient(
  clientId: string,
): Promise<FidelityReward[]> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar recompensas do cliente:", error);
    return [];
  }

  return data || [];
}

// Buscar recompensas disponíveis por cliente
export async function getAvailableRewardsByClient(
  clientId: string,
): Promise<FidelityReward[]> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "available")
    .order("expires_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar recompensas disponíveis:", error);
    return [];
  }

  return data || [];
}

// Criar recompensa
export async function createReward(
  input: CreateRewardInput,
): Promise<FidelityReward | null> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .insert({
      ...input,
      status: "available",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar recompensa:", error);
    return null;
  }

  return data;
}

// Resgatar recompensa (marcar como usada)
export async function redeemReward(
  rewardId: string,
): Promise<FidelityReward | null> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", rewardId)
    .eq("status", "available") // Só pode resgatar se estiver disponível
    .select()
    .single();

  if (error) {
    console.error("Erro ao resgatar recompensa:", error);
    return null;
  }

  return data;
}

// Marcar recompensas expiradas
export async function expireOldRewards(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("fidelity_rewards")
    .update({ status: "expired" })
    .eq("status", "available")
    .lt("expires_at", today)
    .select();

  if (error) {
    console.error("Erro ao expirar recompensas:", error);
    return 0;
  }

  return data?.length || 0;
}

// Buscar recompensas resgatadas (para relatório)
export async function getRedeemedRewards(): Promise<FidelityReward[]> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .select("*")
    .eq("status", "redeemed")
    .order("redeemed_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar recompensas resgatadas:", error);
    return [];
  }

  return data || [];
}

// Contar recompensas por status
export async function countRewardsByStatus(): Promise<{
  available: number;
  redeemed: number;
  expired: number;
}> {
  const { data, error } = await supabase
    .from("fidelity_rewards")
    .select("status");

  if (error) {
    console.error("Erro ao contar recompensas:", error);
    return { available: 0, redeemed: 0, expired: 0 };
  }

  const counts = { available: 0, redeemed: 0, expired: 0 };
  data?.forEach((r) => {
    if (r.status in counts) {
      counts[r.status as keyof typeof counts]++;
    }
  });

  return counts;
}
