/**
 * Script para resetar usuários e criar novos com senhas robustas
 */

const PROJECT_ID = "lvqcualqeevdenghexjm";
const ACCESS_TOKEN = "sbp_fbf88a127de883ddbc531dd002d652e730504570";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM";
const SUPABASE_URL = "https://lvqcualqeevdenghexjm.supabase.co";

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function deleteAllUsers() {
  console.log("🗑️  Removendo usuários antigos...\n");

  // Listar todos os usuários
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Erro ao listar usuários:", error.message);
    return;
  }

  for (const user of users.users) {
    console.log(`   Removendo ${user.email}...`);

    // Remover perfil primeiro (cascade deve cuidar, mas vamos garantir)
    await runQuery(
      `DELETE FROM public.staff_profiles WHERE user_id = '${user.id}';`,
    );

    // Remover usuário do Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) {
      console.log(`   ⚠️  Erro: ${deleteError.message}`);
    } else {
      console.log(`   ✅ ${user.email} removido`);
    }
  }
}

async function createNewUsers() {
  console.log("\n👥 Criando novos usuários com senhas robustas...\n");

  // Senhas robustas geradas
  const users = [
    {
      email: "raul.admin@bedeschi.com.br",
      password: "Bed3sch1#Adm!n2026",
      name: "Raul",
      role: "ADMIN",
    },
    {
      email: "recepcao@bedeschi.com.br",
      password: "R3c3pc@o#B3d2026!",
      name: "Recepção",
      role: "RECEPCAO",
    },
    {
      email: "qa.teste@bedeschi.com.br",
      password: "QaT3st3#S3gur0!2026",
      name: "Usuário QA",
      role: "QA",
    },
  ];

  // Buscar roles
  const roles = await runQuery(`SELECT id, code FROM public.roles;`);

  for (const user of users) {
    console.log(`   Criando ${user.name} (${user.role})...`);

    // Criar usuário no Auth
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

    console.log(`   ✅ Usuário ${user.email} criado no Auth`);

    // Buscar role_id
    const role = roles.find((r) => r.code === user.role);
    if (!role) {
      console.log(`   ❌ Role ${user.role} não encontrado`);
      continue;
    }

    // Criar perfil
    await runQuery(`
      INSERT INTO public.staff_profiles (user_id, full_name, email, role_id, active)
      VALUES ('${authData.user.id}', '${user.name}', '${user.email}', '${role.id}', true);
    `);
    console.log(`   ✅ Perfil de ${user.name} criado`);
  }

  return users;
}

async function validateUsers() {
  console.log("\n🔍 Validando usuários...\n");

  const profiles = await runQuery(`
    SELECT sp.full_name, sp.email, sp.active, r.code as role_code, r.name as role_name
    FROM public.staff_profiles sp
    JOIN public.roles r ON r.id = sp.role_id
    ORDER BY sp.full_name;
  `);

  console.log("📋 Perfis cadastrados:");
  profiles.forEach((p) => {
    const status = p.active ? "✅" : "❌";
    console.log(`   ${status} ${p.full_name} (${p.email}) - ${p.role_name}`);
  });
}

async function testLogins(users) {
  console.log("\n🧪 Testando logins...\n");

  const anonClient = createClient(
    SUPABASE_URL,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw",
  );

  for (const user of users) {
    console.log(`   Testando login: ${user.email}`);

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
    } else {
      console.log(`   ✅ Login OK`);

      // Buscar perfil
      const { data: profile } = await anonClient
        .from("staff_profiles")
        .select("full_name, roles(code, name)")
        .eq("user_id", data.user.id)
        .single();

      if (profile) {
        console.log(`      👤 ${profile.full_name} - ${profile.roles?.name}`);
      }

      await anonClient.auth.signOut();
    }
  }
}

async function main() {
  console.log("🚀 Resetando usuários do Bedeschi Fidelidade\n");
  console.log("=".repeat(50));

  try {
    await deleteAllUsers();
    const users = await createNewUsers();
    await validateUsers();
    await testLogins(users);

    console.log("\n" + "=".repeat(50));
    console.log("\n🎉 Reset concluído com sucesso!\n");
    console.log("📝 NOVAS CREDENCIAIS DE ACESSO:");
    console.log("─".repeat(50));
    console.log("🔑 ADMIN (Raul):");
    console.log("   Email: raul.admin@bedeschi.com.br");
    console.log("   Senha: Bed3sch1#Adm!n2026");
    console.log("");
    console.log("🔑 RECEPÇÃO:");
    console.log("   Email: recepcao@bedeschi.com.br");
    console.log("   Senha: R3c3pc@o#B3d2026!");
    console.log("");
    console.log("🔑 QA (Teste):");
    console.log("   Email: qa.teste@bedeschi.com.br");
    console.log("   Senha: QaT3st3#S3gur0!2026");
    console.log("─".repeat(50));
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
