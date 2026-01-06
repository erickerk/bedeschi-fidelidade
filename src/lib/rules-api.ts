/**
 * API para gerenciamento de regras de fidelidade no Supabase
 * Projeto: Bedeschi Fidelidade/Estética
 */

import { supabase } from "./supabase";

export interface FidelityRuleDB {
  id: string;
  name: string;
  description?: string;
  type:
    | "VALUE_ACCUMULATION"
    | "QUANTITY_ACCUMULATION"
    | "POINTS_CONVERSION"
    | "SERVICE_SPECIFIC"
    | "COMBO_VALUE";
  category_id?: string;
  category_name?: string;
  service_id?: string;
  service_name?: string;
  threshold_value?: number;
  threshold_quantity?: number;
  reward_type:
    | "FREE_SERVICE"
    | "DISCOUNT_PERCENT"
    | "DISCOUNT_FIXED"
    | "CREDIT";
  reward_value?: number;
  reward_service_id?: string;
  reward_service_name?: string;
  validity_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  type:
    | "VALUE_ACCUMULATION"
    | "QUANTITY_ACCUMULATION"
    | "POINTS_CONVERSION"
    | "SERVICE_SPECIFIC"
    | "COMBO_VALUE";
  category_id?: string;
  category_name?: string;
  service_id?: string;
  service_name?: string;
  threshold_value?: number;
  threshold_quantity?: number;
  reward_type:
    | "FREE_SERVICE"
    | "DISCOUNT_PERCENT"
    | "DISCOUNT_FIXED"
    | "CREDIT";
  reward_value?: number;
  reward_service_id?: string;
  reward_service_name?: string;
  validity_days?: number;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  type?:
    | "VALUE_ACCUMULATION"
    | "QUANTITY_ACCUMULATION"
    | "POINTS_CONVERSION"
    | "SERVICE_SPECIFIC"
    | "COMBO_VALUE";
  category_id?: string;
  category_name?: string;
  service_id?: string;
  service_name?: string;
  threshold_value?: number;
  threshold_quantity?: number;
  reward_type?:
    | "FREE_SERVICE"
    | "DISCOUNT_PERCENT"
    | "DISCOUNT_FIXED"
    | "CREDIT";
  reward_value?: number;
  reward_service_id?: string;
  reward_service_name?: string;
  validity_days?: number;
  is_active?: boolean;
}

// Buscar todas as regras
export async function getRules(): Promise<FidelityRuleDB[]> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao buscar regras:", error);
    return [];
  }

  return data || [];
}

// Buscar apenas regras ativas
export async function getActiveRules(): Promise<FidelityRuleDB[]> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar regras ativas:", error);
    return [];
  }

  return data || [];
}

// Buscar regra por ID
export async function getRuleById(id: string): Promise<FidelityRuleDB | null> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar regra:", error);
    return null;
  }

  return data;
}

// Criar regra
export async function createRule(
  input: CreateRuleInput,
): Promise<FidelityRuleDB | null> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .insert({
      ...input,
      validity_days: input.validity_days || 30,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar regra:", error);
    return null;
  }

  return data;
}

// Atualizar regra
export async function updateRule(
  id: string,
  input: UpdateRuleInput,
): Promise<FidelityRuleDB | null> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar regra:", error);
    return null;
  }

  return data;
}

// Ativar/desativar regra
export async function toggleRule(id: string): Promise<FidelityRuleDB | null> {
  // Primeiro busca o estado atual
  const rule = await getRuleById(id);
  if (!rule) return null;

  return updateRule(id, { is_active: !rule.is_active });
}

// Deletar regra
export async function deleteRule(id: string): Promise<boolean> {
  const { error } = await supabase.from("fidelity_rules").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar regra:", error);
    return false;
  }

  return true;
}

// Contar regras por status
export async function countRulesByStatus(): Promise<{
  active: number;
  inactive: number;
  total: number;
}> {
  const { data, error } = await supabase
    .from("fidelity_rules")
    .select("is_active");

  if (error) {
    console.error("Erro ao contar regras:", error);
    return { active: 0, inactive: 0, total: 0 };
  }

  const active = data?.filter((r) => r.is_active).length || 0;
  const inactive = data?.filter((r) => !r.is_active).length || 0;

  return { active, inactive, total: active + inactive };
}
