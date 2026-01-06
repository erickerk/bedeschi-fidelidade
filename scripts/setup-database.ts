/**
 * Script para configurar o banco de dados do Bedeschi Fidelidade
 *
 * Uso:
 *   npx tsx scripts/setup-database.ts
 *
 * Requisitos:
 *   - SUPABASE_SERVICE_ROLE_KEY configurada no .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Carrega variáveis de ambiente
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Erro: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration(sqlFile: string): Promise<void> {
  const filePath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    sqlFile,
  );
  const sql = fs.readFileSync(filePath, "utf-8");

  console.log(`\n📄 Executando: ${sqlFile}`);

  const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    console.error(`❌ Erro em ${sqlFile}:`, error.message);
    throw error;
  }

  console.log(`✅ ${sqlFile} executado com sucesso`);
}

async function createTestUsers(): Promise<void> {
  console.log("\n👥 Criando usuários de teste...");

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

  for (const user of users) {
    // Cria usuário no Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log(`⚠️  Usuário ${user.email} já existe`);
        continue;
      }
      console.error(`❌ Erro ao criar ${user.email}:`, authError.message);
      continue;
    }

    if (!authData.user) {
      console.error(`❌ Usuário ${user.email} não foi criado`);
      continue;
    }

    // Busca o role_id
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("code", user.role)
      .single();

    if (!roleData) {
      console.error(`❌ Role ${user.role} não encontrado`);
      continue;
    }

    // Cria o perfil
    const { error: profileError } = await supabase
      .from("staff_profiles")
      .insert({
        user_id: authData.user.id,
        full_name: user.name,
        email: user.email,
        role_id: roleData.id,
        active: true,
      });

    if (profileError) {
      console.error(
        `❌ Erro ao criar perfil de ${user.name}:`,
        profileError.message,
      );
      continue;
    }

    console.log(`✅ ${user.name} (${user.role}) criado com sucesso`);
  }
}

async function validateSetup(): Promise<void> {
  console.log("\n🔍 Validando configuração...");

  // Verifica roles
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("*");

  if (rolesError) {
    console.error("❌ Erro ao buscar roles:", rolesError.message);
    return;
  }

  console.log("\n📋 Papéis cadastrados:");
  roles?.forEach((r) => {
    console.log(`   - ${r.code}: ${r.name}`);
  });

  // Verifica staff_profiles
  const { data: profiles, error: profilesError } = await supabase.from(
    "staff_profiles",
  ).select(`
      full_name,
      email,
      active,
      roles (code, name)
    `);

  if (profilesError) {
    console.error("❌ Erro ao buscar perfis:", profilesError.message);
    return;
  }

  console.log("\n👥 Perfis cadastrados:");
  profiles?.forEach((p: any) => {
    const status = p.active ? "✅" : "❌";
    console.log(
      `   ${status} ${p.full_name} (${p.email}) - ${p.roles?.name || "Sem papel"}`,
    );
  });

  console.log("\n✅ Validação concluída!");
}

async function main(): Promise<void> {
  console.log("🚀 Iniciando setup do banco de dados Bedeschi Fidelidade\n");
  console.log(`📡 Supabase URL: ${supabaseUrl}`);

  try {
    // Teste de conexão
    const { data, error } = await supabase
      .from("roles")
      .select("count")
      .limit(1);

    if (error && error.code === "42P01") {
      // Tabela não existe, vamos criar
      console.log("📦 Tabelas não existem, executando migração completa...");
      console.log(
        "\n⚠️  Execute o arquivo supabase/migrations/000_full_migration.sql",
      );
      console.log("   no SQL Editor do Supabase Dashboard primeiro!");
      console.log(
        "\n   Depois rode este script novamente para criar os usuários.",
      );
      return;
    }

    console.log("✅ Conexão com Supabase estabelecida");

    // Cria usuários de teste
    await createTestUsers();

    // Valida setup
    await validateSetup();

    console.log("\n🎉 Setup concluído com sucesso!");
    console.log("\n📝 Credenciais de teste:");
    console.log("   Admin (Raul):  raul@bedeschi.com.br / Admin@123456");
    console.log("   Recepção:      recepcao@bedeschi.com.br / Recepcao@123");
    console.log("   QA:            qa@bedeschi.com.br / QaTeste@123");
  } catch (error) {
    console.error("\n❌ Erro durante o setup:", error);
    process.exit(1);
  }
}

main();
