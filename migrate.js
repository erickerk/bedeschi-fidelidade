#!/usr/bin/env node

/**
 * Script para executar migração de pontos (1 ano) no Supabase
 * Usando API REST com PostgreSQL
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runMigration() {
  console.log('🚀 Iniciando migração de pontos (1 ano)...\n');

  const sqlFile = fs.readFileSync('./EXECUTAR_MIGRACAO_AQUI.sql', 'utf-8');
  
  // Remover comentários e dividir em statements
  const lines = sqlFile
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim())
    .join('\n');

  const statements = lines
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Total de statements: ${statements.length}\n`);

  let executed = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    
    try {
      console.log(`[${i + 1}/${statements.length}] ${sql.substring(0, 50)}...`);
      
      await executeSQL(sql);
      executed++;
      console.log(`✅ OK\n`);
      
    } catch (err) {
      failed++;
      console.log(`❌ Erro: ${err.message}\n`);
    }
  }

  console.log(`\n📊 Resultado Final:`);
  console.log(`   ✅ Executados: ${executed}`);
  console.log(`   ❌ Falhados: ${failed}`);
  console.log(`\n✨ Migração 012 - Sistema de validade de pontos (1 ano) implementado!`);
  
  if (failed === 0) {
    console.log(`\n🎉 SUCESSO! Todas as alterações foram aplicadas ao banco de dados.`);
  }
}

runMigration().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
