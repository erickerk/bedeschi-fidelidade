/**
 * Sistema de Validação e Bloqueio de Importação
 * Projeto: Bedeschi Fidelidade/Estética
 * 
 * Funcionalidades:
 * - Bloqueio de duplicados (mesmo telefone + data + procedimento)
 * - Criação automática de clientes inexistentes
 * - Criação automática de profissionais inexistentes
 * - Criação automática de serviços inexistentes
 * - Alertas detalhados de aceitação/rejeição
 * - Atualização de valores de pontos
 */

import { supabase } from "./supabase";
import type { Client, Appointment, Professional, Service } from "./mock-data";

export interface ImportRow {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  professionalName: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time?: string;
  notes?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  action: "create" | "skip" | "update" | "error";
  reason: string;
  row: ImportRow;
  existingRecord?: Appointment;
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  needsClientCreation: boolean;
  needsProfessionalCreation: boolean;
  needsServiceCreation: boolean;
}

export interface ImportBatchResult {
  total: number;
  created: number;
  skipped: number;
  updated: number;
  errors: number;
  clientsCreated: number;
  professionalsCreated: number;
  servicesCreated: number;
  details: ImportValidationResult[];
}

/**
 * Valida uma única linha de importação
 */
export function validateImportRow(
  row: ImportRow,
  existingClients: Client[],
  existingAppointments: Appointment[],
  existingProfessionals: Professional[],
  existingServices: Service[]
): ImportValidationResult {
  const result: ImportValidationResult = {
    isValid: false,
    action: "error",
    reason: "",
    row,
    needsClientCreation: false,
    needsProfessionalCreation: false,
    needsServiceCreation: false,
  };

  // Validar campos obrigatórios
  if (!row.clientName?.trim()) {
    result.reason = "Nome do cliente é obrigatório";
    return result;
  }

  if (!row.clientPhone?.trim()) {
    result.reason = "Telefone do cliente é obrigatório";
    return result;
  }

  if (!row.professionalName?.trim()) {
    result.reason = "Nome do profissional é obrigatório";
    return result;
  }

  if (!row.serviceName?.trim()) {
    result.reason = "Nome do serviço é obrigatório";
    return result;
  }

  if (!row.date?.trim()) {
    result.reason = "Data do atendimento é obrigatória";
    return result;
  }

  if (row.servicePrice <= 0) {
    result.reason = "Valor do serviço deve ser maior que zero";
    return result;
  }

  // Normalizar telefone para comparação
  const normalizedPhone = row.clientPhone.replace(/\D/g, "");

  // Verificar se cliente existe
  const existingClient = existingClients.find(
    (c) => c.phone.replace(/\D/g, "") === normalizedPhone
  );

  if (existingClient) {
    result.clientId = existingClient.id;
  } else {
    result.needsClientCreation = true;
  }

  // Verificar se profissional existe
  const existingProfessional = existingProfessionals.find(
    (p) => p.name.toLowerCase().trim() === row.professionalName.toLowerCase().trim()
  );

  if (existingProfessional) {
    result.professionalId = existingProfessional.id;
  } else {
    result.needsProfessionalCreation = true;
  }

  // Verificar se serviço existe
  const existingService = existingServices.find(
    (s) => s.name.toLowerCase().trim() === row.serviceName.toLowerCase().trim()
  );

  if (existingService) {
    result.serviceId = existingService.id;
  } else {
    result.needsServiceCreation = true;
  }

  // VERIFICAÇÃO DE DUPLICIDADE: mesmo telefone + data + procedimento
  const duplicateAppointment = existingAppointments.find((apt) => {
    // Verificar se é o mesmo cliente (por telefone)
    const aptClient = existingClients.find((c) => c.id === apt.clientId);
    if (!aptClient) return false;
    
    const aptPhone = aptClient.phone.replace(/\D/g, "");
    if (aptPhone !== normalizedPhone) return false;

    // Verificar se é a mesma data
    if (apt.date !== row.date) return false;

    // Verificar se tem o mesmo procedimento
    const hasMatchingService = apt.services.some(
      (s) => s.name.toLowerCase().trim() === row.serviceName.toLowerCase().trim()
    );

    return hasMatchingService;
  });

  if (duplicateAppointment) {
    result.action = "skip";
    result.reason = `DUPLICADO: Já existe atendimento para ${row.clientName} em ${row.date} com ${row.serviceName}`;
    result.existingRecord = duplicateAppointment;
    result.isValid = false;
    return result;
  }

  // Se chegou aqui, pode ser criado
  result.isValid = true;
  result.action = "create";
  result.reason = result.needsClientCreation || result.needsProfessionalCreation || result.needsServiceCreation
    ? `Será criado (novos registros: ${[
        result.needsClientCreation ? "cliente" : "",
        result.needsProfessionalCreation ? "profissional" : "",
        result.needsServiceCreation ? "serviço" : "",
      ].filter(Boolean).join(", ")})`
    : "Será criado normalmente";

  return result;
}

/**
 * Valida um lote inteiro de importação
 */
export function validateImportBatch(
  rows: ImportRow[],
  existingClients: Client[],
  existingAppointments: Appointment[],
  existingProfessionals: Professional[],
  existingServices: Service[]
): ImportBatchResult {
  const results: ImportValidationResult[] = [];
  
  // Manter track de clientes/profissionais/serviços que serão criados durante o batch
  const newClientsPhones = new Set<string>();
  const newProfessionalsNames = new Set<string>();
  const newServicesNames = new Set<string>();

  for (const row of rows) {
    const validation = validateImportRow(
      row,
      existingClients,
      existingAppointments,
      existingProfessionals,
      existingServices
    );

    // Verificar duplicidade dentro do próprio batch
    const normalizedPhone = row.clientPhone.replace(/\D/g, "");
    const batchKey = `${normalizedPhone}-${row.date}-${row.serviceName.toLowerCase().trim()}`;
    
    const existsInBatch = results.some((r) => {
      const rPhone = r.row.clientPhone.replace(/\D/g, "");
      const rKey = `${rPhone}-${r.row.date}-${r.row.serviceName.toLowerCase().trim()}`;
      return rKey === batchKey && r.action === "create";
    });

    if (existsInBatch && validation.action === "create") {
      validation.action = "skip";
      validation.reason = `DUPLICADO NO LOTE: Este registro já aparece anteriormente na importação`;
      validation.isValid = false;
    }

    // Atualizar contadores de novos registros
    if (validation.needsClientCreation) {
      newClientsPhones.add(normalizedPhone);
    }
    if (validation.needsProfessionalCreation) {
      newProfessionalsNames.add(row.professionalName.toLowerCase().trim());
    }
    if (validation.needsServiceCreation) {
      newServicesNames.add(row.serviceName.toLowerCase().trim());
    }

    results.push(validation);
  }

  const created = results.filter((r) => r.action === "create").length;
  const skipped = results.filter((r) => r.action === "skip").length;
  const updated = results.filter((r) => r.action === "update").length;
  const errors = results.filter((r) => r.action === "error").length;

  return {
    total: rows.length,
    created,
    skipped,
    updated,
    errors,
    clientsCreated: newClientsPhones.size,
    professionalsCreated: newProfessionalsNames.size,
    servicesCreated: newServicesNames.size,
    details: results,
  };
}

/**
 * Gera um PIN único de 4 dígitos
 */
function generateUniquePin(existingPins: string[]): string {
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (existingPins.includes(pin));
  return pin;
}

/**
 * Cria um novo cliente automaticamente
 */
export async function createClientFromImport(
  row: ImportRow,
  existingPins: string[]
): Promise<Client | null> {
  const pin = generateUniquePin(existingPins);
  
  const newClient: Partial<Client> = {
    id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: row.clientName.trim(),
    phone: row.clientPhone.trim(),
    email: row.clientEmail?.trim() || "",
    pin,
    pointsBalance: 0,
    totalSpent: 0,
    totalAppointments: 0,
    createdAt: new Date().toISOString(),
  };

  // Tentar salvar no Supabase
  try {
    const { data, error } = await supabase
      .from("fidelity_clients")
      .insert({
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        pin: newClient.pin,
        points_balance: 0,
        total_spent: 0,
        total_appointments: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cliente via importação:", error);
      return null;
    }

    return {
      ...newClient,
      id: data.id,
    } as Client;
  } catch (error) {
    console.error("Erro ao criar cliente via importação:", error);
    return null;
  }
}

/**
 * Cria um novo profissional automaticamente
 */
export async function createProfessionalFromImport(
  name: string
): Promise<Professional | null> {
  const newProfessional: Partial<Professional> = {
    id: `prof-import-${Date.now()}`,
    name: name.trim(),
    role: "profissional",
    specialty: "",
    email: "",
    phone: "",
    servicesIds: [],
    rating: 5.0,
    totalAppointments: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // Tentar salvar no Supabase
  try {
    const { data, error } = await supabase
      .from("fidelity_professionals")
      .insert({
        name: newProfessional.name,
        role: newProfessional.role,
        specialty: newProfessional.specialty,
        email: newProfessional.email,
        phone: newProfessional.phone,
        rating: newProfessional.rating,
        total_appointments: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar profissional via importação:", error);
      return null;
    }

    return {
      ...newProfessional,
      id: data.id,
    } as Professional;
  } catch (error) {
    console.error("Erro ao criar profissional via importação:", error);
    return null;
  }
}

/**
 * Cria um novo serviço automaticamente
 */
export async function createServiceFromImport(
  name: string,
  price: number
): Promise<Service | null> {
  const newService: Partial<Service> = {
    id: `svc-import-${Date.now()}`,
    name: name.trim(),
    categoryId: "cat-geral",
    categoryName: "Importados",
    price,
    durationMinutes: 60,
    isActive: true,
  };

  // Tentar salvar no Supabase
  try {
    const { data, error } = await supabase
      .from("fidelity_services")
      .insert({
        name: newService.name,
        category_id: newService.categoryId,
        category_name: newService.categoryName,
        price: newService.price,
        duration_minutes: newService.durationMinutes,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar serviço via importação:", error);
      return null;
    }

    return {
      ...newService,
      id: data.id,
    } as Service;
  } catch (error) {
    console.error("Erro ao criar serviço via importação:", error);
    return null;
  }
}

/**
 * Gera relatório resumido da validação
 */
export function generateValidationReport(result: ImportBatchResult): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════════════",
    "📊 RELATÓRIO DE VALIDAÇÃO DE IMPORTAÇÃO",
    "═══════════════════════════════════════════════════════",
    "",
    `📁 Total de registros: ${result.total}`,
    "",
    "📈 RESUMO:",
    `   ✅ Serão criados: ${result.created}`,
    `   ⏭️  Serão ignorados (duplicados): ${result.skipped}`,
    `   🔄 Serão atualizados: ${result.updated}`,
    `   ❌ Com erros: ${result.errors}`,
    "",
  ];

  if (result.clientsCreated > 0 || result.professionalsCreated > 0 || result.servicesCreated > 0) {
    lines.push("🆕 NOVOS REGISTROS A SEREM CRIADOS:");
    if (result.clientsCreated > 0) {
      lines.push(`   👤 Clientes: ${result.clientsCreated}`);
    }
    if (result.professionalsCreated > 0) {
      lines.push(`   👨‍⚕️ Profissionais: ${result.professionalsCreated}`);
    }
    if (result.servicesCreated > 0) {
      lines.push(`   💆 Serviços: ${result.servicesCreated}`);
    }
    lines.push("");
  }

  if (result.skipped > 0) {
    lines.push("⚠️ DUPLICADOS ENCONTRADOS:");
    const skippedItems = result.details.filter((d) => d.action === "skip").slice(0, 10);
    skippedItems.forEach((item, i) => {
      lines.push(`   ${i + 1}. ${item.row.clientName} - ${item.row.date} - ${item.row.serviceName}`);
    });
    if (result.skipped > 10) {
      lines.push(`   ... e mais ${result.skipped - 10} duplicados`);
    }
    lines.push("");
  }

  if (result.errors > 0) {
    lines.push("❌ ERROS ENCONTRADOS:");
    const errorItems = result.details.filter((d) => d.action === "error").slice(0, 10);
    errorItems.forEach((item, i) => {
      lines.push(`   ${i + 1}. ${item.reason}`);
    });
    if (result.errors > 10) {
      lines.push(`   ... e mais ${result.errors - 10} erros`);
    }
    lines.push("");
  }

  lines.push("═══════════════════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Calcula pontos baseado no valor do serviço
 * Regra padrão: 1 ponto por R$ 1,00 gasto
 */
export function calculatePointsFromValue(value: number): number {
  return Math.floor(value);
}
