/**
 * API de Usuários da Equipe - Persistência em Supabase
 * Usuários criados pelo Admin são salvos permanentemente
 */

import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "recepcao" | "profissional" | "medico";
  specialty?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface CreateStaffUserInput {
  email: string;
  password: string;
  name: string;
  role: "admin" | "recepcao" | "profissional" | "medico";
  specialty?: string;
  created_by?: string;
}

export interface UpdateStaffUserInput {
  name?: string;
  email?: string;
  password?: string;
  specialty?: string;
  is_active?: boolean;
}

// Criar novo usuário da equipe
export async function createStaffUser(
  input: CreateStaffUserInput,
): Promise<StaffUser> {
  // Hash da senha usando bcrypt
  const passwordHash = bcrypt.hashSync(input.password, 10);

  const { data, error } = await supabase
    .from("staff_users")
    .insert({
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      password_hash: passwordHash,
      specialty: input.specialty || null,
      is_active: true,
      created_by: input.created_by || "system",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar usuário da equipe:", error);
    throw new Error(`Erro ao criar usuário: ${error.message}`);
  }

  return data;
}

// Buscar todos os usuários da equipe
export async function getStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar usuários da equipe:", error);
    return [];
  }

  return data || [];
}

// Buscar usuário por email
export async function getStaffUserByEmail(
  email: string,
): Promise<StaffUser | null> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Não encontrado
    }
    console.error("Erro ao buscar usuário por email:", error);
    return null;
  }

  return data;
}

// Autenticar usuário (verificar email e senha)
export async function authenticateStaffUser(
  email: string,
  password: string,
): Promise<StaffUser | null> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  // Verificar senha com bcrypt
  const isPasswordValid = bcrypt.compareSync(password, data.password_hash);

  if (!isPasswordValid) {
    return null;
  }

  return data;
}

// Atualizar usuário
export async function updateStaffUser(
  id: string,
  input: UpdateStaffUserInput,
): Promise<StaffUser> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email.toLowerCase();
  if (input.specialty !== undefined) updateData.specialty = input.specialty;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  // Se houver nova senha, hash ela
  if (input.password) {
    updateData.password_hash = bcrypt.hashSync(input.password, 10);
  }

  const { data, error } = await supabase
    .from("staff_users")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }

  return data;
}

// Desativar usuário (soft delete)
export async function deactivateStaffUser(id: string): Promise<void> {
  const { error } = await supabase
    .from("staff_users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao desativar usuário:", error);
    throw new Error(`Erro ao desativar usuário: ${error.message}`);
  }
}

// Deletar permanentemente (usar com cuidado)
export async function deleteStaffUser(id: string): Promise<void> {
  const { error } = await supabase.from("staff_users").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar usuário:", error);
    throw new Error(`Erro ao deletar usuário: ${error.message}`);
  }
}
