/**
 * Script de Teste de Carga - Bedeschi Fidelidade
 * Simula múltiplos usuários simultâneos
 */

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw'

const { createClient } = require('@supabase/supabase-js')

const CONCURRENT_USERS = 10
const REQUESTS_PER_USER = 5

const users = [
  { email: 'raul.admin@bedeschi.com.br', password: 'Bed3sch1#Adm!n2026' },
  { email: 'recepcao@bedeschi.com.br', password: 'R3c3pc@o#B3d2026!' },
  { email: 'qa.teste@bedeschi.com.br', password: 'QaT3st3#S3gur0!2026' }
]

const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: []
}

async function simulateUserSession(userId) {
  const supabase = createClient(SUPABASE_URL, ANON_KEY)
  const user = users[userId % users.length]
  
  console.log(`[User ${userId}] Iniciando sessão...`)
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const startTime = Date.now()
    
    try {
      results.totalRequests++
      
      // Login
      if (i === 0) {
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password
        })
        if (error) throw error
      }
      
      // Simular diferentes operações
      const operation = i % 4
      
      switch (operation) {
        case 0:
          // Buscar roles
          const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*')
          if (rolesError) throw rolesError
          break
          
        case 1:
          // Buscar perfil
          const { data: session } = await supabase.auth.getSession()
          if (session?.session?.user?.id) {
            const { data: profile, error: profileError } = await supabase
              .from('staff_profiles')
              .select('*, roles(*)')
              .eq('user_id', session.session.user.id)
              .single()
            if (profileError && profileError.code !== 'PGRST116') throw profileError
          }
          break
          
        case 2:
          // Verificar sessão
          await supabase.auth.getUser()
          break
          
        case 3:
          // Buscar dados públicos
          const { data: publicRoles, error: publicError } = await supabase
            .from('roles')
            .select('code, name')
          if (publicError) throw publicError
          break
      }
      
      const responseTime = Date.now() - startTime
      results.responseTimes.push(responseTime)
      results.successfulRequests++
      
      console.log(`[User ${userId}] Request ${i + 1}/${REQUESTS_PER_USER} - ${responseTime}ms`)
      
    } catch (error) {
      results.failedRequests++
      results.errors.push({
        userId,
        request: i,
        error: error.message
      })
      console.log(`[User ${userId}] Request ${i + 1} FAILED: ${error.message}`)
    }
  }
  
  // Logout
  await supabase.auth.signOut()
  console.log(`[User ${userId}] Sessão encerrada`)
}

async function runLoadTest() {
  console.log('🚀 Iniciando Teste de Carga\n')
  console.log(`   Usuários simultâneos: ${CONCURRENT_USERS}`)
  console.log(`   Requests por usuário: ${REQUESTS_PER_USER}`)
  console.log(`   Total de requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`)
  console.log('\n' + '='.repeat(50) + '\n')
  
  const startTime = Date.now()
  
  // Executar todos os usuários em paralelo
  const userPromises = []
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUserSession(i))
  }
  
  await Promise.all(userPromises)
  
  const totalTime = Date.now() - startTime
  
  // Calcular métricas
  const avgResponseTime = results.responseTimes.length > 0
    ? Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length)
    : 0
  
  const minResponseTime = results.responseTimes.length > 0
    ? Math.min(...results.responseTimes)
    : 0
  
  const maxResponseTime = results.responseTimes.length > 0
    ? Math.max(...results.responseTimes)
    : 0
  
  const successRate = results.totalRequests > 0
    ? ((results.successfulRequests / results.totalRequests) * 100).toFixed(2)
    : 0
  
  const requestsPerSecond = (results.totalRequests / (totalTime / 1000)).toFixed(2)
  
  // Relatório
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 RELATÓRIO DE TESTE DE CARGA\n')
  console.log('─'.repeat(50))
  console.log(`   Tempo total:           ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
  console.log(`   Total de requests:     ${results.totalRequests}`)
  console.log(`   Requests com sucesso:  ${results.successfulRequests}`)
  console.log(`   Requests com falha:    ${results.failedRequests}`)
  console.log(`   Taxa de sucesso:       ${successRate}%`)
  console.log(`   Requests/segundo:      ${requestsPerSecond}`)
  console.log('─'.repeat(50))
  console.log(`   Tempo de resposta médio: ${avgResponseTime}ms`)
  console.log(`   Tempo de resposta min:   ${minResponseTime}ms`)
  console.log(`   Tempo de resposta max:   ${maxResponseTime}ms`)
  console.log('─'.repeat(50))
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERROS ENCONTRADOS:')
    results.errors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. User ${err.userId}, Request ${err.request}: ${err.error}`)
    })
    if (results.errors.length > 5) {
      console.log(`   ... e mais ${results.errors.length - 5} erros`)
    }
  }
  
  // Avaliação
  console.log('\n📝 AVALIAÇÃO:')
  if (parseFloat(successRate) >= 95 && avgResponseTime < 500) {
    console.log('   ✅ EXCELENTE - Sistema estável sob carga')
  } else if (parseFloat(successRate) >= 90 && avgResponseTime < 1000) {
    console.log('   ✅ BOM - Sistema funcional com pequenas lentidões')
  } else if (parseFloat(successRate) >= 80) {
    console.log('   ⚠️  REGULAR - Algumas falhas sob carga')
  } else {
    console.log('   ❌ CRÍTICO - Sistema instável sob carga')
  }
  
  console.log('\n' + '='.repeat(50))
  
  return {
    totalTime,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    successRate: parseFloat(successRate),
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    requestsPerSecond: parseFloat(requestsPerSecond)
  }
}

runLoadTest()
  .then(metrics => {
    console.log('\n✅ Teste de carga concluído')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Erro no teste:', error.message)
    process.exit(1)
  })
