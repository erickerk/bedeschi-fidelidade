/**
 * Parser de arquivos XLSX para importação de serviços
 *
 * Formato esperado da planilha:
 * | Código | Descrição | Categoria | Valor | Tempo (min) | CNAE |
 */

import ExcelJS from "exceljs";

export interface ServiceImportRow {
  code: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  cnae?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: ImportError[];
  services: ServiceImportRow[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

const COLUMN_MAPPINGS: Record<string, string[]> = {
  code: ["código", "codigo", "code", "cod", "id"],
  name: ["descrição", "descricao", "nome", "name", "servico", "serviço"],
  category: ["categoria", "category", "cat", "tipo"],
  price: ["valor", "preço", "preco", "price", "vlr"],
  durationMinutes: [
    "tempo",
    "duração",
    "duracao",
    "duration",
    "min",
    "minutos",
  ],
  cnae: ["cnae", "cnae_code"],
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findColumnMapping(header: string): string | null {
  const normalized = normalizeHeader(header);

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return field;
    }
  }
  return null;
}

function parsePrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[R$\s.]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseDuration(value: unknown): number {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const parsed = parseInt(value.replace(/\D/g, ""), 10);
    return isNaN(parsed) ? 60 : parsed;
  }
  return 60;
}

function getCellValue(cell: ExcelJS.Cell): unknown {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  if (typeof cell.value === "object" && "result" in cell.value) {
    return cell.value.result;
  }
  return cell.value;
}

export async function parseXLSX(buffer: ArrayBuffer): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const services: ServiceImportRow[] = [];

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount === 0) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [
          { row: 0, field: "file", message: "Arquivo vazio ou sem dados" },
        ],
        services: [],
      };
    }

    // Extrair headers da primeira linha
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(getCellValue(cell) || "");
    });

    const columnMap: Record<string, number> = {};
    headers.forEach((header, colIndex) => {
      if (header) {
        const mapping = findColumnMapping(header);
        if (mapping) {
          columnMap[mapping] = colIndex;
        }
      }
    });

    if (!columnMap.name) {
      return {
        success: false,
        totalRows: worksheet.rowCount - 1,
        validRows: 0,
        errors: [
          {
            row: 0,
            field: "headers",
            message: "Coluna de nome/descrição não encontrada",
          },
        ],
        services: [],
      };
    }

    // Processar linhas de dados (a partir da linha 2)
    for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      const name = String(
        getCellValue(row.getCell(columnMap.name)) || "",
      ).trim();

      if (!name) {
        errors.push({
          row: rowNum,
          field: "name",
          message: "Nome do serviço vazio",
        });
        continue;
      }

      const service: ServiceImportRow = {
        code: String(
          getCellValue(row.getCell(columnMap.code)) || `AUTO-${rowNum - 1}`,
        ).trim(),
        name,
        category: String(
          getCellValue(row.getCell(columnMap.category)) || "Geral",
        ).trim(),
        price: parsePrice(getCellValue(row.getCell(columnMap.price))),
        durationMinutes: parseDuration(
          getCellValue(row.getCell(columnMap.durationMinutes)),
        ),
        cnae: columnMap.cnae
          ? String(getCellValue(row.getCell(columnMap.cnae)) || "").trim()
          : undefined,
      };

      if (service.price <= 0) {
        errors.push({
          row: rowNum,
          field: "price",
          message: `Preço inválido: ${getCellValue(row.getCell(columnMap.price))}`,
        });
      }

      services.push(service);
    }

    return {
      success: errors.length === 0,
      totalRows: worksheet.rowCount - 1,
      validRows: services.length,
      errors,
      services,
    };
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      errors: [
        {
          row: 0,
          field: "file",
          message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Desconhecido"}`,
        },
      ],
      services: [],
    };
  }
}

export function groupByCategory(
  services: ServiceImportRow[],
): Record<string, ServiceImportRow[]> {
  return services.reduce(
    (acc, service) => {
      const cat = service.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    },
    {} as Record<string, ServiceImportRow[]>,
  );
}

export function generateImportSummary(result: ImportResult): string {
  const lines: string[] = [
    `📊 Resumo da Importação`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Total de linhas: ${result.totalRows}`,
    `Serviços válidos: ${result.validRows}`,
    `Erros: ${result.errors.length}`,
  ];

  if (result.services.length > 0) {
    const byCategory = groupByCategory(result.services);
    lines.push(``, `📁 Por categoria:`);

    for (const [cat, svcs] of Object.entries(byCategory)) {
      lines.push(`  • ${cat}: ${svcs.length} serviços`);
    }
  }

  if (result.errors.length > 0) {
    lines.push(``, `⚠️ Erros encontrados:`);
    for (const err of result.errors.slice(0, 10)) {
      lines.push(`  • Linha ${err.row}: ${err.message}`);
    }
    if (result.errors.length > 10) {
      lines.push(`  ... e mais ${result.errors.length - 10} erros`);
    }
  }

  return lines.join("\n");
}
