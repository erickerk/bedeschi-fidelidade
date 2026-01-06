/**
 * Script para processar a planilha de serviços e gerar dados mock
 * Uso: node scripts/process-services.js
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Caminho do arquivo
const xlsxPath = path.join(
  __dirname,
  "..",
  "servicos-loja Instituto Bedeschi Beauty Clinic.xlsx",
);

// Ler arquivo
console.log("📖 Lendo arquivo:", xlsxPath);
const workbook = XLSX.readFile(xlsxPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log(`\n📊 Total de linhas: ${data.length}`);
console.log("📋 Colunas encontradas:", Object.keys(data[0] || {}));

// Mostrar primeiras linhas para debug
console.log("\n🔍 Primeiras 3 linhas:");
data.slice(0, 3).forEach((row, i) => {
  console.log(`  Linha ${i + 1}:`, JSON.stringify(row, null, 2));
});

// Mapear colunas (flexível)
function findColumn(row, aliases) {
  for (const key of Object.keys(row)) {
    const normalized = key.toLowerCase().trim();
    if (aliases.some((a) => normalized.includes(a))) {
      return key;
    }
  }
  return null;
}

const sampleRow = data[0] || {};
const columns = {
  code: findColumn(sampleRow, ["código", "codigo", "code", "cod", "id"]),
  name: findColumn(sampleRow, [
    "descrição",
    "descricao",
    "nome",
    "name",
    "servico",
    "serviço",
    "produto",
  ]),
  category: findColumn(sampleRow, [
    "categoria",
    "category",
    "cat",
    "tipo",
    "grupo",
  ]),
  price: findColumn(sampleRow, [
    "valor",
    "preço",
    "preco",
    "price",
    "vlr",
    "venda",
  ]),
  duration: findColumn(sampleRow, [
    "tempo",
    "duração",
    "duracao",
    "duration",
    "min",
  ]),
};

console.log("\n🔗 Mapeamento de colunas:");
Object.entries(columns).forEach(([field, col]) => {
  console.log(`  ${field}: ${col || "NÃO ENCONTRADO"}`);
});

// Processar serviços
const services = [];
const categories = new Map();

data.forEach((row, index) => {
  const name = String(row[columns.name] || "").trim();
  if (!name) return;

  const category = String(row[columns.category] || "Geral").trim();
  const code = String(row[columns.code] || `AUTO-${index + 1}`).trim();

  // Parse price
  let price = 0;
  if (columns.price && row[columns.price]) {
    const priceStr = String(row[columns.price]);
    const cleaned = priceStr.replace(/[R$\s.]/g, "").replace(",", ".");
    price = parseFloat(cleaned) || 0;
  }

  // Parse duration
  let duration = 60;
  if (columns.duration && row[columns.duration]) {
    const durationStr = String(row[columns.duration]);
    duration = parseInt(durationStr.replace(/\D/g, ""), 10) || 60;
  }

  // Adicionar categoria
  if (!categories.has(category)) {
    categories.set(category, {
      id: `cat-${categories.size + 1}`,
      name: category,
      slug: category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
      servicesCount: 0,
    });
  }
  categories.get(category).servicesCount++;

  const catData = categories.get(category);

  services.push({
    id: `srv-${index + 1}`,
    externalCode: code,
    name: name,
    categoryId: catData.id,
    categoryName: category,
    price: price,
    durationMinutes: duration,
    isActive: true,
  });
});

console.log(`\n✅ Serviços processados: ${services.length}`);
console.log(`📁 Categorias encontradas: ${categories.size}`);

// Mostrar categorias
console.log("\n📂 Categorias:");
categories.forEach((cat) => {
  console.log(`  - ${cat.name}: ${cat.servicesCount} serviços`);
});

// Gerar arquivo TypeScript
const outputPath = path.join(__dirname, "..", "src", "lib", "services-data.ts");

const tsContent = `/**
 * Dados de serviços importados da planilha
 * Gerado automaticamente em: ${new Date().toISOString()}
 * Total: ${services.length} serviços em ${categories.size} categorias
 */

export interface ServiceData {
  id: string;
  externalCode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  servicesCount: number;
}

export const importedCategories: CategoryData[] = ${JSON.stringify(
  Array.from(categories.values()),
  null,
  2,
)};

export const importedServices: ServiceData[] = ${JSON.stringify(
  services,
  null,
  2,
)};

// Funções auxiliares
export function getServicesByCategory(categoryId: string): ServiceData[] {
  return importedServices.filter((s) => s.categoryId === categoryId && s.isActive);
}

export function searchServices(query: string): ServiceData[] {
  const q = query.toLowerCase();
  return importedServices.filter(
    (s) =>
      s.isActive &&
      (s.name.toLowerCase().includes(q) ||
        s.externalCode.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q))
  );
}

export function getServiceById(id: string): ServiceData | undefined {
  return importedServices.find((s) => s.id === id);
}

export function getServiceByCode(code: string): ServiceData | undefined {
  return importedServices.find((s) => s.externalCode === code);
}
`;

fs.writeFileSync(outputPath, tsContent, "utf-8");
console.log(`\n💾 Arquivo gerado: ${outputPath}`);

// Estatísticas
const withPrice = services.filter((s) => s.price > 0).length;
const avgPrice =
  services.reduce((sum, s) => sum + s.price, 0) / services.length || 0;

console.log("\n📈 Estatísticas:");
console.log(`  - Com preço definido: ${withPrice}/${services.length}`);
console.log(`  - Preço médio: R$ ${avgPrice.toFixed(2)}`);
console.log(`  - Sem preço: ${services.length - withPrice}`);

console.log("\n✨ Processamento concluído!");
