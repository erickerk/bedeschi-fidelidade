/**
 * Script para executar migração das tabelas de fidelidade no Supabase Bedeschi
 * Uso: node scripts/run-fidelity-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

console.log('🔗 Conectando ao Supabase Bedeschi:', supabaseUrl)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkTables() {
  console.log('\n🔍 Verificando tabelas existentes...')
  
  const tables = [
    'fidelity_clients',
    'fidelity_rules', 
    'fidelity_rewards',
    'fidelity_appointments',
    'fidelity_appointment_services',
    'fidelity_reviews'
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(1)
    
    if (error && error.code === '42P01') {
      console.log(`   ❌ ${table} - não existe`)
    } else if (error) {
      console.log(`   ⚠️  ${table} - erro: ${error.message}`)
    } else {
      console.log(`   ✅ ${table} - OK`)
    }
  }
}

async function seedClients() {
  console.log('\n👥 Inserindo clientes de exemplo...')
  
  const clients = [
    {
      name: 'Maria Silva',
      phone: '11999887766',
      pin: '7766',
      email: 'maria.silva@email.com',
      birth_date: '1985-03-15',
      points_balance: 1250,
      total_spent: 2850.00,
      total_appointments: 12,
      last_visit: '2026-01-02'
    },
    {
      name: 'Ana Santos',
      phone: '11988776655',
      pin: '6655',
      email: 'ana.santos@email.com',
      birth_date: '1990-07-22',
      points_balance: 580,
      total_spent: 1420.00,
      total_appointments: 6,
      last_visit: '2025-12-28'
    },
    {
      name: 'Carla Oliveira',
      phone: '11977665544',
      pin: '5544',
      email: 'carla.oliveira@email.com',
      birth_date: '1988-11-10',
      points_balance: 2100,
      total_spent: 4800.00,
      total_appointments: 20,
      last_visit: '2026-01-03'
    },
    {
      name: 'Juliana Costa',
      phone: '11966554433',
      pin: '4433',
      email: 'juliana.costa@email.com',
      birth_date: '1995-02-28',
      points_balance: 320,
      total_spent: 780.00,
      total_appointments: 3,
      last_visit: '2025-12-15'
    },
    {
      name: 'Patricia Mendes',
      phone: '11955443322',
      pin: '3322',
      email: 'patricia.mendes@email.com',
      birth_date: '1982-09-05',
      points_balance: 890,
      total_spent: 2100.00,
      total_appointments: 9,
      last_visit: '2025-12-30'
    }
  ]

  for (const client of clients) {
    const { error } = await supabase
      .from('fidelity_clients')
      .upsert(client, { onConflict: 'phone' })
    
    if (error) {
      console.error(`   ❌ Erro ao inserir ${client.name}:`, error.message)
    } else {
      console.log(`   ✅ ${client.name} inserido/atualizado`)
    }
  }
}

async function seedRules() {
  console.log('\n📋 Inserindo regras de fidelidade...')
  
  const rules = [
    {
      name: 'Combo Valor - Massagem Grátis',
      description: 'Gastou R$ 1.000 em qualquer serviço = Massagem Relaxante grátis',
      type: 'COMBO_VALUE',
      threshold_value: 1000,
      reward_type: 'FREE_SERVICE',
      reward_service_name: 'Massagem Relaxante 60min',
      validity_days: 60,
      is_active: true
    },
    {
      name: 'Depilação 10+1',
      description: 'A cada 10 sessões de depilação, ganha 1 grátis',
      type: 'QUANTITY_ACCUMULATION',
      category_id: 'cat-3',
      category_name: 'Depilação',
      threshold_quantity: 10,
      reward_type: 'FREE_SERVICE',
      reward_service_name: 'Depilação Perna Completa',
      validity_days: 90,
      is_active: true
    },
    {
      name: 'Pontos para Crédito',
      description: '500 pontos = R$ 50 de crédito',
      type: 'POINTS_CONVERSION',
      threshold_value: 500,
      reward_type: 'CREDIT',
      reward_value: 50,
      validity_days: 180,
      is_active: true
    },
    {
      name: 'Limpeza de Pele - Fidelidade',
      description: 'A cada 5 limpezas de pele, ganha 1 hidratação facial',
      type: 'SERVICE_SPECIFIC',
      service_name: 'Limpeza de Pele Profunda',
      threshold_quantity: 5,
      reward_type: 'FREE_SERVICE',
      reward_service_name: 'Hidratação Facial',
      validity_days: 90,
      is_active: true
    },
    {
      name: 'Combo Premium - R$ 2.000',
      description: 'Gastou R$ 2.000 = Drenagem Linfática grátis',
      type: 'COMBO_VALUE',
      threshold_value: 2000,
      reward_type: 'FREE_SERVICE',
      reward_service_name: 'Drenagem Linfática',
      validity_days: 90,
      is_active: true
    }
  ]

  for (const rule of rules) {
    const { error } = await supabase
      .from('fidelity_rules')
      .insert(rule)
    
    if (error) {
      if (error.code === '23505') { // Duplicate key
        console.log(`   ⚠️  ${rule.name} já existe`)
      } else {
        console.error(`   ❌ Erro ao inserir ${rule.name}:`, error.message)
      }
    } else {
      console.log(`   ✅ ${rule.name} inserida`)
    }
  }
}

async function seedRewards() {
  console.log('\n🎁 Inserindo recompensas de exemplo...')
  
  // Buscar IDs dos clientes
  const { data: clients } = await supabase
    .from('fidelity_clients')
    .select('id, name')
    .limit(3)

  if (!clients || clients.length === 0) {
    console.log('   ⚠️  Nenhum cliente encontrado para associar recompensas')
    return
  }

  const rewards = [
    {
      client_id: clients[0]?.id,
      title: '1 Limpeza de Pele GRÁTIS',
      description: 'Conquistado por acúmulo em Tratamento Facial',
      type: 'FREE_SERVICE',
      service_name: 'Limpeza de Pele Profunda',
      status: 'available',
      expires_at: '2026-02-15'
    },
    {
      client_id: clients[1]?.id,
      title: 'R$ 50 de desconto',
      description: 'Resgate de 500 pontos',
      type: 'CREDIT',
      value: 50,
      status: 'available',
      expires_at: '2026-03-01'
    }
  ]

  for (const reward of rewards) {
    if (!reward.client_id) continue
    
    const { error } = await supabase
      .from('fidelity_rewards')
      .insert(reward)
    
    if (error) {
      console.error(`   ❌ Erro ao inserir ${reward.title}:`, error.message)
    } else {
      console.log(`   ✅ ${reward.title} inserida`)
    }
  }
}

async function main() {
  console.log('🚀 Iniciando configuração do Supabase Bedeschi para Fidelidade\n')
  console.log('═'.repeat(60))
  
  // Verificar tabelas
  await checkTables()
  
  console.log('\n' + '═'.repeat(60))
  console.log('\n📝 INSTRUÇÕES PARA CRIAR AS TABELAS:')
  console.log('═'.repeat(60))
  console.log('\n1. Acesse o Dashboard do Supabase:')
  console.log('   https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new')
  console.log('\n2. Copie o conteúdo do arquivo:')
  console.log('   supabase/migrations/006_create_fidelity_tables.sql')
  console.log('\n3. Cole e execute no SQL Editor')
  console.log('\n4. Depois, rode este script novamente para popular os dados:')
  console.log('   node scripts/run-fidelity-migration.js --seed')
  console.log('═'.repeat(60))

  // Se passar --seed, popular dados
  if (process.argv.includes('--seed')) {
    console.log('\n🌱 Modo SEED ativado - Populando dados...')
    await seedClients()
    await seedRules()
    await seedRewards()
    console.log('\n✅ Seed concluído!')
  }

  console.log('\n🎉 Script finalizado!')
}

main().catch(console.error)
