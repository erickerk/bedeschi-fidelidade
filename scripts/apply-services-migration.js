/**
 * Script para aplicar migration da tabela de serviços
 * BUG-001 FIX: Persistência real de serviços
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://lvqcualqeevdenghexjm.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log("🔧 Aplicando migration da tabela de serviços...\n");

  const migrationPath = path.join(__dirname, "../supabase/migrations/005_create_services_table.sql");
  
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Arquivo de migration não encontrado:", migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");
  
  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    
    if (error) {
      // Tentar executar diretamente via REST se rpc não estiver disponível
      console.log("⚠️ RPC não disponível, tentando criar tabela diretamente...");
      
      // Verificar se tabela já existe
      const { data: tables } = await supabase
        .from("services")
        .select("id")
        .limit(1);
      
      if (tables !== null) {
        console.log("✅ Tabela 'services' já existe!");
      } else {
        console.log("📋 Tabela precisa ser criada manualmente no Supabase Dashboard.");
        console.log("\nSQL para executar no SQL Editor do Supabase:");
        console.log("─".repeat(50));
        console.log(sql);
        console.log("─".repeat(50));
      }
    } else {
      console.log("✅ Migration aplicada com sucesso!");
    }
  } catch (err) {
    console.log("⚠️ Verificando se tabela existe...");
    
    // Tentar criar a tabela usando insert e verificar erro
    const { error: checkError } = await supabase
      .from("services")
      .select("id")
      .limit(1);
    
    if (!checkError) {
      console.log("✅ Tabela 'services' já existe e está acessível!");
    } else if (checkError.message.includes("does not exist")) {
      console.log("\n📋 Execute o seguinte SQL no Supabase Dashboard > SQL Editor:\n");
      console.log("─".repeat(50));
      console.log(sql);
      console.log("─".repeat(50));
    } else {
      console.log("✅ Tabela verificada:", checkError.message);
    }
  }

  // Testar inserção de serviço de exemplo
  console.log("\n🧪 Testando inserção de serviço...");
  
  const testService = {
    external_code: "TEST001",
    name: "Serviço de Teste QA",
    category_id: "outros",
    category_name: "Outros",
    price: 99.90,
    duration_minutes: 30,
    is_active: true
  };

  const { data, error: insertError } = await supabase
    .from("services")
    .upsert(testService, { onConflict: "external_code" })
    .select()
    .single();

  if (insertError) {
    console.log("⚠️ Erro ao inserir serviço de teste:", insertError.message);
    
    if (insertError.message.includes("does not exist")) {
      console.log("\n💡 A tabela 'services' precisa ser criada primeiro.");
      console.log("   Acesse: https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql");
      console.log("   E execute o SQL do arquivo: supabase/migrations/005_create_services_table.sql");
    }
  } else {
    console.log("✅ Serviço de teste criado/atualizado:", data.name);
    
    // Limpar serviço de teste
    await supabase.from("services").delete().eq("external_code", "TEST001");
    console.log("🧹 Serviço de teste removido.");
  }

  console.log("\n✅ Script finalizado!");
}

applyMigration().catch(console.error);
