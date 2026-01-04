/**
 * API para gerenciamento de agendamentos/atendimentos no Supabase
 * Projeto: Bedeschi Fidelidade/Estética
 */

import { supabase } from './supabase';

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id?: string;
  service_name: string;
  category_id?: string;
  category_name?: string;
  price: number;
  created_at: string;
}

export interface FidelityAppointment {
  id: string;
  client_id: string;
  client_name?: string;
  professional_id?: string;
  professional_name?: string;
  date: string;
  time?: string;
  status: 'completed' | 'pending' | 'cancelled';
  total: number;
  points_earned: number;
  has_review: boolean;
  review_rating?: number;
  review_comment?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  services?: AppointmentService[];
}

export interface CreateAppointmentInput {
  client_id: string;
  client_name?: string;
  professional_id?: string;
  professional_name?: string;
  date: string;
  time?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  total: number;
  points_earned: number;
  notes?: string;
  services: Array<{
    service_id?: string;
    service_name: string;
    category_id?: string;
    category_name?: string;
    price: number;
  }>;
}

export interface UpdateAppointmentInput {
  professional_id?: string;
  professional_name?: string;
  date?: string;
  time?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  total?: number;
  points_earned?: number;
  has_review?: boolean;
  review_rating?: number;
  review_comment?: string;
  notes?: string;
}

// Buscar todos os agendamentos
export async function getAppointments(): Promise<FidelityAppointment[]> {
  const { data, error } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }

  return data || [];
}

// Buscar agendamentos com serviços
export async function getAppointmentsWithServices(): Promise<FidelityAppointment[]> {
  const { data: appointments, error: aptError } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .order('date', { ascending: false });

  if (aptError) {
    console.error('Erro ao buscar agendamentos:', aptError);
    return [];
  }

  if (!appointments || appointments.length === 0) return [];

  // Buscar serviços para cada agendamento
  const appointmentIds = appointments.map(a => a.id);
  const { data: services, error: svcError } = await supabase
    .from('fidelity_appointment_services')
    .select('*')
    .in('appointment_id', appointmentIds);

  if (svcError) {
    console.error('Erro ao buscar serviços dos agendamentos:', svcError);
    return appointments;
  }

  // Associar serviços aos agendamentos
  return appointments.map(apt => ({
    ...apt,
    services: services?.filter(s => s.appointment_id === apt.id) || [],
  }));
}

// Buscar agendamentos por cliente
export async function getAppointmentsByClient(clientId: string): Promise<FidelityAppointment[]> {
  const { data: appointments, error: aptError } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  if (aptError) {
    console.error('Erro ao buscar agendamentos do cliente:', aptError);
    return [];
  }

  if (!appointments || appointments.length === 0) return [];

  // Buscar serviços
  const appointmentIds = appointments.map(a => a.id);
  const { data: services } = await supabase
    .from('fidelity_appointment_services')
    .select('*')
    .in('appointment_id', appointmentIds);

  return appointments.map(apt => ({
    ...apt,
    services: services?.filter(s => s.appointment_id === apt.id) || [],
  }));
}

// Buscar agendamento por ID
export async function getAppointmentById(id: string): Promise<FidelityAppointment | null> {
  const { data, error } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar agendamento:', error);
    return null;
  }

  // Buscar serviços
  const { data: services } = await supabase
    .from('fidelity_appointment_services')
    .select('*')
    .eq('appointment_id', id);

  return {
    ...data,
    services: services || [],
  };
}

// Criar agendamento
export async function createAppointment(input: CreateAppointmentInput): Promise<FidelityAppointment | null> {
  const { services, ...appointmentData } = input;

  // Criar agendamento
  const { data: appointment, error: aptError } = await supabase
    .from('fidelity_appointments')
    .insert({
      ...appointmentData,
      status: appointmentData.status || 'completed',
      has_review: false,
    })
    .select()
    .single();

  if (aptError) {
    console.error('Erro ao criar agendamento:', aptError);
    return null;
  }

  // Criar serviços do agendamento
  if (services && services.length > 0) {
    const servicesData = services.map(s => ({
      appointment_id: appointment.id,
      ...s,
    }));

    const { error: svcError } = await supabase
      .from('fidelity_appointment_services')
      .insert(servicesData);

    if (svcError) {
      console.error('Erro ao criar serviços do agendamento:', svcError);
    }
  }

  return {
    ...appointment,
    services: services.map((s, i) => ({
      id: `temp-${i}`,
      appointment_id: appointment.id,
      ...s,
      created_at: new Date().toISOString(),
    })),
  };
}

// Atualizar agendamento
export async function updateAppointment(id: string, input: UpdateAppointmentInput): Promise<FidelityAppointment | null> {
  const { data, error } = await supabase
    .from('fidelity_appointments')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return null;
  }

  return data;
}

// Marcar agendamento como avaliado
export async function addReviewToAppointment(
  appointmentId: string,
  rating: number,
  comment?: string
): Promise<FidelityAppointment | null> {
  return updateAppointment(appointmentId, {
    has_review: true,
    review_rating: rating,
    review_comment: comment,
  });
}

// Buscar agendamento pendente de avaliação para um cliente
export async function getPendingReviewForClient(clientId: string): Promise<FidelityAppointment | null> {
  const { data, error } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .eq('has_review', false)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erro ao buscar avaliação pendente:', error);
    }
    return null;
  }

  return data;
}

// Buscar agendamentos por período
export async function getAppointmentsByPeriod(startDate: string, endDate: string): Promise<FidelityAppointment[]> {
  const { data, error } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar agendamentos por período:', error);
    return [];
  }

  return data || [];
}
