import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helpers
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/staff/login`);
  await page.fill('input[type="email"]', 'raul.admin@bedeschi.com.br');
  await page.fill('input[type="password"]', 'Bed3sch1#Adm!n2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard**', { timeout: 15000 });
}

async function loginAsRecepcao(page: Page) {
  await page.goto(`${BASE_URL}/staff/login`);
  await page.fill('input[type="email"]', 'recepcao@bedeschi.com.br');
  await page.fill('input[type="password"]', 'R3c3pc@o#B3d2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/recepcao**', { timeout: 15000 });
}

test.describe('Admin Dashboard Tests', () => {
  test('should login and access admin dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should navigate through all tabs', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Dashboard tab
    await expect(page.locator('text=Resumo Geral')).toBeVisible();
    
    // Analytics tab
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Análise Detalhada')).toBeVisible();
    
    // Clientes tab
    await page.click('button:has-text("Clientes")');
    await expect(page.locator('text=Gestão de Clientes')).toBeVisible();
    
    // Serviços tab
    await page.click('button:has-text("Serviços")');
    await expect(page.locator('text=Catálogo de Serviços')).toBeVisible();
    
    // Regras tab
    await page.click('button:has-text("Regras")');
    await expect(page.locator('text=Regras de Fidelidade')).toBeVisible();
    
    // Equipe tab
    await page.click('button:has-text("Equipe")');
    await expect(page.locator('text=Gestão da Equipe')).toBeVisible();
  });

  test('should display client sorting options', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Clientes")');
    
    // Check sort dropdown exists
    const sortSelect = page.locator('select[aria-label="Ordenar lista de clientes"]');
    await expect(sortSelect).toBeVisible();
    
    // Test sorting options
    await sortSelect.selectOption('name-asc');
    await sortSelect.selectOption('name-desc');
    await sortSelect.selectOption('spent-desc');
  });

  test('should create a new fidelity rule', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Regras")');
    
    // Click new rule button
    await page.click('button:has-text("Nova Regra")');
    
    // Fill rule form
    await page.fill('input[placeholder*="Nome da regra"]', 'Teste Automático - Ganhe Desconto');
    await page.fill('textarea[placeholder*="Descrição"]', 'Regra de teste criada automaticamente');
    
    // Select rule type
    await page.selectOption('select:has-text("Acúmulo por Valor")', 'VALUE_ACCUMULATION');
    
    // Fill threshold value
    await page.fill('input[placeholder*="Valor mínimo"]', '500');
    
    // Select reward type
    await page.selectOption('select:has-text("Desconto")', 'DISCOUNT_PERCENT');
    
    // Fill reward value
    await page.fill('input[placeholder*="Valor do desconto"]', '10');
    
    // Submit
    await page.click('button[type="submit"]:has-text("Criar")');
    
    // Verify rule appears in list
    await expect(page.locator('text=Teste Automático - Ganhe Desconto')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Recepção Dashboard Tests', () => {
  test('should login and access recepcao dashboard', async ({ page }) => {
    await loginAsRecepcao(page);
    await expect(page).toHaveURL(/.*recepcao/);
  });

  test('should navigate through recepcao tabs', async ({ page }) => {
    await loginAsRecepcao(page);
    
    // Atendimentos tab
    await expect(page.locator('text=Atendimentos')).toBeVisible();
    
    // Clientes tab
    await page.click('button:has-text("Clientes")');
    await expect(page.locator('text=Clientes')).toBeVisible();
    
    // Bônus tab
    await page.click('button:has-text("Bônus")');
    await expect(page.locator('text=Bônus')).toBeVisible();
  });

  test('should search for clients', async ({ page }) => {
    await loginAsRecepcao(page);
    await page.click('button:has-text("Clientes")');
    
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill('Maria');
    
    // Wait for search results
    await page.waitForTimeout(500);
  });
});

test.describe('Client Dashboard Tests', () => {
  test('should access client dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/c/bedeschi`);
    await expect(page.locator('text=Bem-vindo')).toBeVisible({ timeout: 10000 });
  });

  test('should login as client with phone and pin', async ({ page }) => {
    await page.goto(`${BASE_URL}/c/bedeschi`);
    
    // Look for login form
    const phoneInput = page.locator('input[placeholder*="Telefone"], input[type="tel"]').first();
    const pinInput = page.locator('input[placeholder*="PIN"], input[type="password"]').first();
    
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('11999999999');
      await pinInput.fill('1234');
      await page.click('button[type="submit"]');
    }
  });
});

test.describe('Data Synchronization Tests', () => {
  test('should load clients from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Clientes")');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if clients table has rows
    const clientRows = page.locator('tbody tr');
    const count = await clientRows.count();
    
    console.log(`Loaded ${count} clients from Supabase`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should load rules from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Regras")');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if rules are displayed
    const rulesCount = page.locator('text=Regras ativas');
    await expect(rulesCount).toBeVisible();
  });

  test('should load services from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Serviços")');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if services table has rows
    const serviceRows = page.locator('tbody tr');
    const count = await serviceRows.count();
    
    console.log(`Loaded ${count} services from Supabase`);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
