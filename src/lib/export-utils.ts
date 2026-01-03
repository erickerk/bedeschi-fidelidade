import ExcelJS from "exceljs";
import { mockClients, mockAppointments, mockReviews, type Review } from "./mock-data";
import { importedServices, importedCategories } from "./services-data";
import { formatCurrency } from "./utils";

/**
 * Exporta dados de clientes para Excel
 */
export function exportClientsToExcel() {
  const headers = ["ID", "Nome", "Telefone", "Email", "Data Nascimento", "Pontos", "Total Gasto", "Total Atendimentos", "Última Visita", "Data Cadastro"];
  const data = mockClients.map((client) => [
    client.id,
    client.name,
    client.phone,
    client.email || "-",
    client.birthDate || "-",
    client.pointsBalance,
    formatCurrency(client.totalSpent),
    client.totalAppointments || 0,
    client.lastVisit || "-",
    client.createdAt || "-",
  ]);

  downloadExcel(headers, data, "clientes_bedeschi", "Clientes");
}

/**
 * Exporta avaliações para Excel
 */
export function exportReviewsToExcel() {
  const headers = ["ID", "Cliente", "Telefone", "Data", "Nota", "Comentário", "Serviço"];
  const data = mockReviews.map((review: Review) => {
    const client = mockClients.find((c) => c.id === review.clientId);
    const appointment = mockAppointments.find((a) => a.id === review.appointmentId);
    
    return [
      review.id,
      client?.name || "-",
      client?.phone || "-",
      review.createdAt,
      review.rating,
      review.comment || "-",
      appointment?.services.map((s) => s.name).join(", ") || "-",
    ];
  });

  downloadExcel(headers, data, "avaliacoes_bedeschi", "Avaliações");
}

/**
 * Exporta serviços para Excel
 */
export function exportServicesToExcel() {
  const headers = ["Código", "Nome", "Categoria", "Preço", "Duração (min)", "Ativo"];
  const data = importedServices.map((service) => [
    service.externalCode,
    service.name,
    service.categoryName,
    formatCurrency(service.price),
    service.durationMinutes,
    service.isActive ? "Sim" : "Não",
  ]);

  downloadExcel(headers, data, "servicos_bedeschi", "Serviços");
}

/**
 * Exporta atendimentos para Excel
 */
export function exportAppointmentsToExcel() {
  const headers = ["ID", "Cliente", "Data", "Serviços", "Total", "Pontos Ganhos", "Status"];
  const data = mockAppointments.map((apt) => {
    const client = mockClients.find((c) => c.id === apt.clientId);
    
    return [
      apt.id,
      client?.name || "-",
      apt.date,
      apt.services.map((s) => s.name).join(", "),
      formatCurrency(apt.total),
      apt.pointsEarned,
      apt.status,
    ];
  });

  downloadExcel(headers, data, "atendimentos_bedeschi", "Atendimentos");
}

/**
 * Exporta relatório completo (múltiplas abas)
 */
export async function exportFullReport() {
  const workbook = new ExcelJS.Workbook();

  // Aba de Clientes
  const wsClients = workbook.addWorksheet("Clientes");
  wsClients.addRow(["Nome", "Telefone", "Pontos", "Total Gasto"]);
  mockClients.forEach((client) => {
    wsClients.addRow([client.name, client.phone, client.pointsBalance, client.totalSpent]);
  });

  // Aba de Avaliações
  const wsReviews = workbook.addWorksheet("Avaliações");
  wsReviews.addRow(["Cliente", "Nota", "Comentário", "Data"]);
  mockReviews.forEach((review: Review) => {
    const client = mockClients.find((c) => c.id === review.clientId);
    wsReviews.addRow([client?.name || "-", review.rating, review.comment || "-", review.createdAt]);
  });

  // Aba de Categorias
  const wsCategories = workbook.addWorksheet("Categorias");
  wsCategories.addRow(["Nome", "Qtd Serviços"]);
  importedCategories.forEach((cat) => {
    wsCategories.addRow([cat.name, cat.servicesCount]);
  });

  // Download
  const filename = `relatorio_completo_bedeschi_${new Date().toISOString().split("T")[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, filename);
}

/**
 * Função utilitária para download de Excel
 */
async function downloadExcel(headers: string[], data: unknown[][], filename: string, sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  worksheet.addRow(headers);
  data.forEach((row) => worksheet.addRow(row));

  // Ajustar largura das colunas
  worksheet.columns.forEach((column, i) => {
    column.width = Math.max(headers[i]?.length || 10, 15);
  });

  const fullFilename = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, fullFilename);
}

/**
 * Função para download do buffer como arquivo
 */
function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
