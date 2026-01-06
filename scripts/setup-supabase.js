/**
 * Script para configurar banco de dados via Supabase Management API
 * Usa o Personal Access Token para executar SQL
 */

const PROJECT_ID = "lvqcualqeevdenghexjm";
const ACCESS_TOKEN = "sbp_fbf88a127de883ddbc531dd002d652e730504570";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM";
const SUPABASE_URL = "https://lvqcualqeevdenghexjm.supabase.co";

async function runQuery(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Query failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function createTables() {
  console.log("📦 Criando tabelas...\n");

  // 1. Função update_updated_at
  console.log("1️⃣ Criando função update_updated_at_column...");
  await runQuery(`
    create or replace function public.update_updated_at_column()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;
  `);
  console.log("   ✅ Função criada");

  // 2. Tabela roles
  console.log("2️⃣ Criando tabela roles...");
  await runQuery(`
    create table if not exists public.roles (
      id uuid primary key default gen_random_uuid(),
      code text not null unique,
      name text not null,
      description text,
      permissions jsonb default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  console.log("   ✅ Tabela roles criada");

  // 3. Tabela staff_profiles
  console.log("3️⃣ Criando tabela staff_profiles...");
  await runQuery(`
    create table if not exists public.staff_profiles (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      full_name text not null,
      email text,
      phone text,
      avatar_url text,
      role_id uuid not null references public.roles (id),
      active boolean not null default true,
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint staff_profiles_user_id_unique unique (user_id)
    );
  `);
  console.log("   ✅ Tabela staff_profiles criada");

  // 4. Índices
  console.log("4️⃣ Criando índices...");
  await runQuery(`
    create index if not exists roles_code_idx on public.roles (code);
    create index if not exists staff_profiles_role_id_idx on public.staff_profiles (role_id);
    create index if not exists staff_profiles_active_idx on public.staff_profiles (active);
  `);
  console.log("   ✅ Índices criados");
}

async function setupRLS() {
  console.log("\n🔒 Configurando RLS...\n");

  // Habilitar RLS
  console.log("1️⃣ Habilitando RLS nas tabelas...");
  await runQuery(`
    alter table public.roles enable row level security;
    alter table public.staff_profiles enable row level security;
  `);
  console.log("   ✅ RLS habilitado");

  // Políticas para roles
  console.log("2️⃣ Criando políticas para roles...");
  await runQuery(
    `drop policy if exists "roles_select_authenticated" on public.roles;`,
  );
  await runQuery(`
    create policy "roles_select_authenticated" on public.roles 
    for select to authenticated using (true);
  `);
  console.log("   ✅ Política roles_select_authenticated criada");

  // Políticas para staff_profiles
  console.log("3️⃣ Criando políticas para staff_profiles...");
  await runQuery(
    `drop policy if exists "staff_select_own" on public.staff_profiles;`,
  );
  await runQuery(`
    create policy "staff_select_own" on public.staff_profiles 
    for select to authenticated using (auth.uid() = user_id);
  `);

  await runQuery(
    `drop policy if exists "staff_update_own" on public.staff_profiles;`,
  );
  await runQuery(`
    create policy "staff_update_own" on public.staff_profiles 
    for update to authenticated 
    using (auth.uid() = user_id) 
    with check (auth.uid() = user_id);
  `);

  await runQuery(
    `drop policy if exists "staff_admin_select_all" on public.staff_profiles;`,
  );
  await runQuery(`
    create policy "staff_admin_select_all" on public.staff_profiles 
    for select to authenticated
    using (exists (
      select 1 from public.staff_profiles sp 
      join public.roles r on r.id = sp.role_id 
      where sp.user_id = auth.uid() and r.code = 'ADMIN'
    ));
  `);

  await runQuery(
    `drop policy if exists "staff_admin_manage_all" on public.staff_profiles;`,
  );
  await runQuery(`
    create policy "staff_admin_manage_all" on public.staff_profiles 
    for all to authenticated
    using (exists (
      select 1 from public.staff_profiles sp 
      join public.roles r on r.id = sp.role_id 
      where sp.user_id = auth.uid() and r.code = 'ADMIN'
    ))
    with check (exists (
      select 1 from public.staff_profiles sp 
      join public.roles r on r.id = sp.role_id 
      where sp.user_id = auth.uid() and r.code = 'ADMIN'
    ));
  `);
  console.log("   ✅ Políticas staff_profiles criadas");
}

async function seedRoles() {
  console.log("\n📋 Inserindo papéis padrão...\n");

  await runQuery(`
    insert into public.roles (code, name, description, permissions) values
      ('ADMIN', 'Administrador', 'Acesso total ao sistema', '["users:read", "users:write", "users:delete", "roles:manage", "all:access"]'::jsonb),
      ('RECEPCAO', 'Recepção', 'Perfil de recepção', '["clients:read", "clients:write", "appointments:read", "appointments:write"]'::jsonb),
      ('QA', 'QA / Teste', 'Usuário de teste', '["test:access", "reports:view"]'::jsonb)
    on conflict (code) do update set 
      name = excluded.name, 
      description = excluded.description, 
      permissions = excluded.permissions;
  `);
  console.log("✅ Papéis ADMIN, RECEPCAO e QA inseridos");
}

async function createUsers() {
  console.log("\n👥 Criando usuários...\n");

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = [
    {
      email: "raul@bedeschi.com.br",
      password: "Admin@123456",
      name: "Raul",
      role: "ADMIN",
    },
    {
      email: "recepcao@bedeschi.com.br",
      password: "Recepcao@123",
      name: "Recepção",
      role: "RECEPCAO",
    },
    {
      email: "qa@bedeschi.com.br",
      password: "QaTeste@123",
      name: "Usuário QA",
      role: "QA",
    },
  ];

  // Buscar roles
  const rolesResult = await runQuery(`select id, code from public.roles;`);
  const roles = rolesResult;

  for (const user of users) {
    console.log(`   Criando ${user.name} (${user.role})...`);

    // Verificar se usuário existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === user.email);

    let userId;
    if (existing) {
      console.log(`   ⚠️  Usuário ${user.email} já existe`);
      userId = existing.id;
    } else {
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

      if (authError) {
        console.log(`   ❌ Erro: ${authError.message}`);
        continue;
      }
      userId = authData.user.id;
      console.log(`   ✅ Usuário ${user.email} criado no Auth`);
    }

    // Buscar role_id
    const role = roles.find((r) => r.code === user.role);
    if (!role) {
      console.log(`   ❌ Role ${user.role} não encontrado`);
      continue;
    }

    // Verificar se perfil existe
    const profileCheck = await runQuery(`
      select id from public.staff_profiles where user_id = '${userId}';
    `);

    if (profileCheck && profileCheck.length > 0) {
      console.log(`   ⚠️  Perfil de ${user.name} já existe`);
      continue;
    }

    // Criar perfil
    await runQuery(`
      insert into public.staff_profiles (user_id, full_name, email, role_id, active)
      values ('${userId}', '${user.name}', '${user.email}', '${role.id}', true);
    `);
    console.log(`   ✅ Perfil de ${user.name} criado`);
  }
}

async function validate() {
  console.log("\n🔍 Validando configuração...\n");

  const roles = await runQuery(
    `select code, name from public.roles order by code;`,
  );
  console.log("📋 Papéis:");
  roles.forEach((r) => console.log(`   ✅ ${r.code}: ${r.name}`));

  const profiles = await runQuery(`
    select sp.full_name, sp.email, sp.active, r.code as role_code
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    order by sp.full_name;
  `);
  console.log("\n👥 Perfis:");
  profiles.forEach((p) => {
    const status = p.active ? "✅" : "❌";
    console.log(`   ${status} ${p.full_name} (${p.email}) - ${p.role_code}`);
  });

  console.log("\n🎉 Setup concluído!");
  console.log("\n📝 Credenciais:");
  console.log("   🔑 Admin (Raul):  raul@bedeschi.com.br / Admin@123456");
  console.log("   🔑 Recepção:      recepcao@bedeschi.com.br / Recepcao@123");
  console.log("   🔑 QA:            qa@bedeschi.com.br / QaTeste@123");
}

async function main() {
  console.log("🚀 Configurando Supabase - Bedeschi Fidelidade\n");
  console.log(`📡 Projeto: ${PROJECT_ID}\n`);

  try {
    await createTables();
    await setupRLS();
    await seedRoles();
    await createUsers();
    await validate();
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
