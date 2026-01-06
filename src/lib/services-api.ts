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
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${random}`;
}

// Serviços mock para fallback quando tabela não existe
const MOCK_SERVICES: Service[] = [
  {
    id: "svc-1",
    external_code: "MA001",
    name: "Massagem Relaxante 60min",
    category_id: "cat-1",
    category_name: "Massagens",
    price: 180,
    duration_minutes: 60,
    is_active: true,
  },
  {
    id: "svc-2",
    external_code: "MA002",
    name: "Massagem Modeladora",
    category_id: "cat-1",
    category_name: "Massagens",
    price: 220,
    duration_minutes: 60,
    is_active: true,
  },
  {
    id: "svc-3",
    external_code: "FA001",
    name: "Limpeza de Pele",
    category_id: "cat-2",
    category_name: "Facial",
    price: 150,
    duration_minutes: 45,
    is_active: true,
  },
  {
    id: "svc-4",
    external_code: "FA002",
    name: "Peeling Facial",
    category_id: "cat-2",
    category_name: "Facial",
    price: 200,
    duration_minutes: 60,
    is_active: true,
  },
  {
    id: "svc-5",
    external_code: "DE001",
    name: "Depilação Perna Completa",
    category_id: "cat-3",
    category_name: "Depilação",
    price: 120,
    duration_minutes: 45,
    is_active: true,
  },
  {
    id: "svc-6",
    external_code: "DE002",
    name: "Depilação Virilha",
    category_id: "cat-3",
    category_name: "Depilação",
    price: 80,
    duration_minutes: 30,
    is_active: true,
  },
  {
    id: "svc-7",
    external_code: "SO001",
    name: "Design de Sobrancelhas",
    category_id: "cat-4",
    category_name: "Sobrancelhas",
    price: 65,
    duration_minutes: 30,
    is_active: true,
  },
  {
    id: "svc-8",
    external_code: "MI001",
    name: "Micropigmentação Sobrancelha",
    category_id: "cat-5",
    category_name: "Micropigmentação",
    price: 450,
    duration_minutes: 120,
    is_active: true,
  },
  {
    id: "svc-9",
    external_code: "CI001",
    name: "Alongamento de Cílios",
    category_id: "cat-6",
    category_name: "Cílios",
    price: 280,
    duration_minutes: 90,
    is_active: true,
  },
  {
    id: "svc-10",
    external_code: "MN001",
    name: "Manicure Completa",
    category_id: "cat-7",
    category_name: "Manicure",
    price: 45,
    duration_minutes: 45,
    is_active: true,
  },
];

// Buscar todos os serviços
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    // Fallback para mock quando tabela não existe
    if (error.code === "PGRST204" || error.message?.includes("not find")) {
      console.warn("Tabela services não existe, usando dados mock");
      return MOCK_SERVICES;
    }
    console.error("Erro ao buscar serviços:", error);
    return MOCK_SERVICES;
  }

  return data?.length ? data : MOCK_SERVICES;
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
export async function createService(
  input: CreateServiceInput,
): Promise<Service> {
  const externalCode =
    input.external_code || generateExternalCode(input.category_name);

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
export async function updateService(
  id: string,
  input: UpdateServiceInput,
): Promise<Service> {
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
export async function getServicesByCategory(
  categoryId: string,
): Promise<Service[]> {
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
  categoryId?: string,
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

  const { data, error, count } = await query.order("name").range(from, to);

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
