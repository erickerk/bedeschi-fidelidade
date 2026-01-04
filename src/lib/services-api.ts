/**
 * API de Serviços - Integração com Supabase
 * BUG-001 FIX: Persistência real de serviços no banco de dados
 */

import { supabase } from "./supabase";

export interface Service {
  id: string;
  external_code: string;
  name: string;
  category_id: string;
  category_name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceInput {
  name: string;
  price: number;
  duration_minutes: number;
  category_id: string;
  category_name: string;
  external_code?: string;
}

export interface UpdateServiceInput {
  name?: string;
  price?: number;
  duration_minutes?: number;
  category_id?: string;
  category_name?: string;
  is_active?: boolean;
}

// Gerar código externo único
function generateExternalCode(categoryName: string): string {
  const prefix = categoryName.substring(0, 2).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${random}`;
}

// Buscar todos os serviços
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar serviços:", error);
    throw error;
  }

  return data || [];
}

// Buscar serviço por ID
export async function getServiceById(id: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar serviço:", error);
    return null;
  }

  return data;
}

// Criar novo serviço
export async function createService(input: CreateServiceInput): Promise<Service> {
  const externalCode = input.external_code || generateExternalCode(input.category_name);

  const { data, error } = await supabase
    .from("services")
    .insert({
      external_code: externalCode,
      name: input.name,
      category_id: input.category_id,
      category_name: input.category_name,
      price: input.price,
      duration_minutes: input.duration_minutes,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar serviço:", error);
    throw error;
  }

  return data;
}

// Atualizar serviço
export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar serviço:", error);
    throw error;
  }

  return data;
}

// Excluir serviço (soft delete)
export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from("services")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir serviço:", error);
    throw error;
  }
}

// Buscar serviços por categoria
export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar serviços por categoria:", error);
    throw error;
  }

  return data || [];
}

// Buscar serviços com paginação
export async function getServicesPaginated(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  categoryId?: string
): Promise<{ data: Service[]; total: number; totalPages: number }> {
  let query = supabase
    .from("services")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (search) {
    query = query.or(`name.ilike.%${search}%,external_code.ilike.%${search}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("name")
    .range(from, to);

  if (error) {
    console.error("Erro ao buscar serviços paginados:", error);
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: data || [],
    total,
    totalPages,
  };
}
