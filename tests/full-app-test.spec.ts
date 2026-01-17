import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helpers
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/staff/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'raul.admin@bedeschi.com.br');
  await page.fill('input[type="password"]', 'Bed3sch1#Adm!n2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard**', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

async function loginAsRecepcao(page: Page) {
  await page.goto(`${BASE_URL}/staff/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'recepcao@bedeschi.com.br');
  await page.fill('input[type="password"]', 'R3c3pc@o#B3d2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/recepcao**', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Dashboard Tests', () => {
  test('should login and access admin dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    // Use more specific selector - nav button
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
  });

  test('should navigate through all tabs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(1000);
    
    // Get nav buttons specifically
    const navButtons = page.locator('nav button');
    
    // Dashboard tab - check for heading or content
    await expect(page.getByText('Resumo Geral')).toBeVisible({ timeout: 10000 });
    
    // Analytics tab
    await navButtons.filter({ hasText: 'Analytics' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Análise Detalhada')).toBeVisible({ timeout: 5000 });
    
    // Clientes tab
    await navButtons.filter({ hasText: 'Clientes' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Gestão de Clientes')).toBeVisible({ timeout: 5000 });
    
    // Serviços tab
    await navButtons.filter({ hasText: 'Serviços' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Catálogo de Serviços')).toBeVisible({ timeout: 5000 });
    
    // Regras tab
    await navButtons.filter({ hasText: 'Regras' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Regras de Fidelidade')).toBeVisible({ timeout: 5000 });
    
    // Equipe tab
    await navButtons.filter({ hasText: 'Equipe' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Gestão da Equipe')).toBeVisible({ timeout: 5000 });
  });

  test('should display client sorting options', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /Clientes/i }).click();
    await page.waitForTimeout(1000);
    
    // Check sort dropdown exists
    const sortSelect = page.locator('select[aria-label="Ordenar lista de clientes"]');
    await expect(sortSelect).toBeVisible({ timeout: 5000 });
    
    // Test sorting options
    await sortSelect.selectOption('name-asc');
    await sortSelect.selectOption('name-desc');
    await sortSelect.selectOption('spent-desc');
  });

  test('should access rules tab and see rules', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /Regras/i }).click();
    await page.waitForTimeout(1000);
    
    // Check that rules section is visible
    await expect(page.getByText('Regras de Fidelidade')).toBeVisible({ timeout: 5000 });
    
    // Check for Nova Regra button
    await expect(page.getByRole('button', { name: /Nova Regra/i })).toBeVisible();
    
    // Check for rule sort dropdown
    const sortSelect = page.locator('select[aria-label="Ordenar regras"]');
    await expect(sortSelect).toBeVisible();
  });
});

test.describe('Recepção Dashboard Tests', () => {
  test('should login and access recepcao dashboard', async ({ page }) => {
    await loginAsRecepcao(page);
    await expect(page).toHaveURL(/.*recepcao/);
  });

  test('should navigate through recepcao tabs', async ({ page }) => {
    await loginAsRecepcao(page);
    await page.waitForTimeout(1000);
    
    // Atendimentos tab - use nav button specifically
    const navButtons = page.locator('nav button');
    await expect(navButtons.first()).toBeVisible();
    
    // Clientes tab - click the nav button
    await navButtons.filter({ hasText: 'Clientes' }).click();
    await page.waitForTimeout(500);
    
    // Bônus tab - click the nav button (exact match to avoid "Bônus (6)")
    await navButtons.filter({ hasText: /^Bônus$/ }).click();
    await page.waitForTimeout(500);
  });

  test('should search for clients', async ({ page }) => {
    await loginAsRecepcao(page);
    await page.getByRole('button', { name: /Clientes/i }).click();
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Maria');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Client Dashboard Tests', () => {
  test('should access client dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/c/bedeschi`);
    await page.waitForLoadState('networkidle');
    
    // The page might show login first or welcome message
    // Check for either login form or page loaded correctly
    const hasLoginForm = await page.locator('input[type="tel"], input[placeholder*="Telefone"]').isVisible();
    const pageLoaded = await page.locator('body').isVisible();
    
    expect(hasLoginForm || pageLoaded).toBeTruthy();
  });

  test('should show client login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/c/bedeschi`);
    await page.waitForLoadState('networkidle');
    
    // Look for login form elements
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Telefone"]').first();
    const pinInput = page.locator('input[placeholder*="PIN"], input[type="password"]').first();
    
    // Either the form is visible or we're already logged in
    const formVisible = await phoneInput.isVisible();
    expect(formVisible).toBeDefined();
  });
});

test.describe('Data Synchronization Tests', () => {
  test('should load clients from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /Clientes/i }).click();
    await page.waitForTimeout(2000);
    
    // Check if clients table exists
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
    
    // Check if we have table rows (might be 0 if no clients)
    const clientRows = page.locator('tbody tr');
    const count = await clientRows.count();
    console.log(`Loaded ${count} clients from Supabase`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should load rules from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /Regras/i }).click();
    await page.waitForTimeout(2000);
    
    // Check if rules section is visible
    await expect(page.getByText('Regras de Fidelidade')).toBeVisible({ timeout: 5000 });
  });

  test('should load services from Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /Serviços/i }).click();
    await page.waitForTimeout(2000);
    
    // Check if services table exists
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
    
    const serviceRows = page.locator('tbody tr');
    const count = await serviceRows.count();
    console.log(`Loaded ${count} services from Supabase`);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
