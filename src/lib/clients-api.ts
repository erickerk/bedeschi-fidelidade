/**
 * API para gerenciamento de clientes no Supabase
 * Projeto: Bedeschi Fidelidade/Estética
 */

import { supabase } from './supabase';

export interface FidelityClient {
  id: string;
  name: string;
  phone: string;
  pin: string;
  email?: string;
  birth_date?: string;
  points_balance: number;
  total_spent: number;
  total_appointments: number;
  last_visit?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  phone: string;
  pin: string;
  email?: string;
  birth_date?: string;
  points_balance?: number;
  total_spent?: number;
  total_appointments?: number;
}

export interface UpdateClientInput {
  name?: string;
  phone?: string;
  pin?: string;
  email?: string;
  birth_date?: string;
  points_balance?: number;
  total_spent?: number;
  total_appointments?: number;
  last_visit?: string;
  is_active?: boolean;
}

// Buscar todos os clientes
export async function getClients(): Promise<FidelityClient[]> {
  const { data, error } = await supabase
    .from('fidelity_clients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }

  return data || [];
}

// Buscar cliente por ID
export async function getClientById(id: string): Promise<FidelityClient | null> {
  const { data, error } = await supabase
    .from('fidelity_clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar cliente por ID:', error);
    return null;
  }

  return data;
}

// Buscar cliente por telefone
export async function getClientByPhone(phone: string): Promise<FidelityClient | null> {
  const cleanPhone = phone.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('fidelity_clients')
    .select('*')
    .eq('phone', cleanPhone)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar cliente por telefone:', error);
    }
    return null;
  }

  return data;
}

// Validar login do cliente (telefone + PIN)
export async function validateClientLogin(phone: string, pin: string): Promise<FidelityClient | null> {
  const cleanPhone = phone.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('fidelity_clients')
    .select('*')
    .eq('phone', cleanPhone)
    .eq('pin', pin)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erro ao validar login do cliente:', error);
    }
    return null;
  }

  return data;
}

// Criar cliente
export async function createClient(input: CreateClientInput): Promise<FidelityClient | null> {
  const cleanPhone = input.phone.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('fidelity_clients')
    .insert({
      ...input,
      phone: cleanPhone,
      points_balance: input.points_balance || 0,
      total_spent: input.total_spent || 0,
      total_appointments: input.total_appointments || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    return null;
  }

  return data;
}

// Atualizar cliente
export async function updateClient(id: string, input: UpdateClientInput): Promise<FidelityClient | null> {
  const updateData: UpdateClientInput = { ...input };
  
  if (updateData.phone) {
    updateData.phone = updateData.phone.replace(/\D/g, '');
  }

  const { data, error } = await supabase
    .from('fidelity_clients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar cliente:', error);
    return null;
  }

  return data;
}

// Atualizar pontos e estatísticas do cliente (após atendimento)
export async function updateClientStats(
  id: string,
  pointsToAdd: number,
  spentToAdd: number,
  lastVisit: string
): Promise<FidelityClient | null> {
  // Primeiro busca o cliente atual
  const client = await getClientById(id);
  if (!client) return null;

  return updateClient(id, {
    points_balance: client.points_balance + pointsToAdd,
    total_spent: client.total_spent + spentToAdd,
    total_appointments: client.total_appointments + 1,
    last_visit: lastVisit,
  });
}

// Desativar cliente
export async function deactivateClient(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('fidelity_clients')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Erro ao desativar cliente:', error);
    return false;
  }

  return true;
}

// Buscar clientes por termo (nome ou telefone)
export async function searchClients(query: string): Promise<FidelityClient[]> {
  const { data, error } = await supabase
    .from('fidelity_clients')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .eq('is_active', true)
    .order('name')
    .limit(20);

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }

  return data || [];
}
