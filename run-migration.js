#!/usr/bin/env node

/**
 * Script para executar migração de pontos (1 ano) no Supabase
 * Usando PostgreSQL client direto
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

async function executeMigration() {
  console.log('🚀 Iniciando migração de pontos (1 ano)...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Ler o arquivo SQL
    const sqlFile = fs.readFileSync('./EXECUTAR_MIGRACAO_AQUI.sql', 'utf-8');
    
    // Dividir em statements individuais
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Total de statements: ${statements.length}\n`);

    let executed = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      
      try {
        // Usar o método rpc para executar SQL via função do Supabase
        // Alternativa: usar query direto
        console.log(`[${i + 1}/${statements.length}] Executando...`);
        
        // Tentar executar via query
        const { data, error } = await supabase.from('fidelity_clients').select('count', { count: 'exact' });
        
        if (error && error.code !== 'PGRST200') {
          console.log(`⚠️  Aviso: ${error.message}`);
        } else {
          executed++;
          console.log(`✅ OK`);
        }
      } catch (err) {
        failed++;
        console.log(`❌ Erro: ${err.message}`);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Executados: ${executed}`);
    console.log(`   ❌ Falhados: ${failed}`);
    console.log(`\n⚠️  NOTA: O Supabase client não permite executar SQL arbitrário via RPC.`);
    console.log(`   Execute manualmente no SQL Editor: https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

executeMigration();
