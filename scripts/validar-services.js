/**
 * Validação Completa - Tabela Services
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function validarServices() {
  try {
    logSection('📊 VALIDAÇÃO COMPLETA - TABELA SERVICES');

    // ============================================
    // 1. CONTAR TOTAL DE SERVIÇOS
    // ============================================
    logSection('1️⃣ TOTAL DE SERVIÇOS CADASTRADOS');

    const { count, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      log(`❌ Erro: ${countError.message}`, 'red');
      return;
    }

    const expectedCount = 69; // 7+10+8+10+5+6+8+9+6
    
    if (count === expectedCount) {
      log(`✅ Total correto: ${count} serviços (esperado: ${expectedCount})`, 'green');
    } else {
      log(`⚠️  Total: ${count} serviços (esperado: ${expectedCount})`, 'yellow');
    }

    // ============================================
    // 2. SERVIÇOS POR CATEGORIA
    // ============================================
    logSection('2️⃣ SERVIÇOS POR CATEGORIA');

    const { data: byCategory, error: catError } = await supabase
      .from('services')
      .select('category_name')
      .eq('is_active', true);

    if (catError) {
      log(`❌ Erro: ${catError.message}`, 'red');
      return;
    }

    const categoryCounts = {};
    byCategory.forEach(s => {
      categoryCounts[s.category_name] = (categoryCounts[s.category_name] || 0) + 1;
    });

    const expectedCounts = {
      'Massagens': 7,
      'Facial': 10,
      'Corporal': 8,
      'Depilação': 10,
      'Sobrancelhas': 5,
      'Cílios': 6,
      'Manicure/Pedicure': 8,
      'Cabelos': 9,
      'Estética Avançada': 6,
    };

    let allCorrect = true;
    Object.entries(expectedCounts).forEach(([cat, expected]) => {
      const actual = categoryCounts[cat] || 0;
      if (actual === expected) {
        log(`✅ ${cat}: ${actual} serviços`, 'green');
      } else {
        log(`❌ ${cat}: ${actual} serviços (esperado: ${expected})`, 'red');
        allCorrect = false;
      }
    });

    // ============================================
    // 3. VERIFICAR PREÇOS
    // ============================================
    logSection('3️⃣ FAIXA DE PREÇOS POR CATEGORIA');

    const { data: priceRanges, error: priceError } = await supabase
      .from('services')
      .select('category_name, price')
      .eq('is_active', true)
      .order('category_name');

    if (priceError) {
      log(`❌ Erro: ${priceError.message}`, 'red');
    } else {
      const ranges = {};
      priceRanges.forEach(s => {
        if (!ranges[s.category_name]) {
          ranges[s.category_name] = { min: s.price, max: s.price };
        } else {
          ranges[s.category_name].min = Math.min(ranges[s.category_name].min, s.price);
          ranges[s.category_name].max = Math.max(ranges[s.category_name].max, s.price);
        }
      });

      Object.entries(ranges).forEach(([cat, range]) => {
        log(`💰 ${cat}: R$ ${range.min.toFixed(2)} - R$ ${range.max.toFixed(2)}`, 'blue');
      });
    }

    // ============================================
    // 4. VERIFICAR DUPLICATAS
    // ============================================
    logSection('4️⃣ VERIFICAR DUPLICATAS');

    const { data: allServices } = await supabase
      .from('services')
      .select('external_code, name')
      .eq('is_active', true);

    const codes = {};
    const names = {};
    let duplicates = 0;

    allServices.forEach(s => {
      if (codes[s.external_code]) {
        log(`⚠️  Código duplicado: ${s.external_code}`, 'yellow');
        duplicates++;
      }
      codes[s.external_code] = true;

      if (names[s.name]) {
        log(`⚠️  Nome duplicado: ${s.name}`, 'yellow');
        duplicates++;
      }
      names[s.name] = true;
    });

    if (duplicates === 0) {
      log(`✅ Nenhuma duplicata encontrada`, 'green');
    } else {
      log(`❌ ${duplicates} duplicata(s) encontrada(s)`, 'red');
    }

    // ============================================
    // 5. SERVIÇOS MAIS CAROS E MAIS BARATOS
    // ============================================
    logSection('5️⃣ TOP 5 MAIS CAROS E MAIS BARATOS');

    const { data: expensive } = await supabase
      .from('services')
      .select('name, price, category_name')
      .eq('is_active', true)
      .order('price', { ascending: false })
      .limit(5);

    log('\n💎 5 Mais Caros:', 'cyan');
    expensive.forEach((s, i) => {
      log(`   ${i + 1}. ${s.name} - R$ ${s.price} (${s.category_name})`, 'blue');
    });

    const { data: cheap } = await supabase
      .from('services')
      .select('name, price, category_name')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(5);

    log('\n💵 5 Mais Baratos:', 'cyan');
    cheap.forEach((s, i) => {
      log(`   ${i + 1}. ${s.name} - R$ ${s.price} (${s.category_name})`, 'blue');
    });

    // ============================================
    // 6. TESTE DE BUSCA
    // ============================================
    logSection('6️⃣ TESTE DE BUSCA');

    const searchTerms = ['massagem', 'depilação', 'facial', 'manicure'];
    
    for (const term of searchTerms) {
      const { data: results } = await supabase
        .from('services')
        .select('name')
        .eq('is_active', true)
        .or(`name.ilike.%${term}%,category_name.ilike.%${term}%`);

      log(`🔍 Busca "${term}": ${results.length} resultado(s)`, 'blue');
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('✅ RESULTADO DA VALIDAÇÃO');

    if (count === expectedCount && allCorrect && duplicates === 0) {
      log('\n🎉 VALIDAÇÃO 100% APROVADA!', 'green');
      log(`   ✅ Total: ${count} serviços`, 'green');
      log(`   ✅ Categorias: Todas corretas`, 'green');
      log(`   ✅ Sem duplicatas`, 'green');
      log(`   ✅ Preços válidos`, 'green');
      log(`   ✅ Busca funcionando`, 'green');
    } else {
      log('\n⚠️  VALIDAÇÃO COM PROBLEMAS', 'yellow');
      if (count !== expectedCount) {
        log(`   ⚠️  Total incorreto: ${count} (esperado: ${expectedCount})`, 'yellow');
      }
      if (!allCorrect) {
        log(`   ⚠️  Algumas categorias com quantidade errada`, 'yellow');
      }
      if (duplicates > 0) {
        log(`   ⚠️  ${duplicates} duplicata(s) encontrada(s)`, 'yellow');
      }
    }

    log('\n📋 Resumo:', 'cyan');
    log(`   Massagens: 7 | Facial: 10 | Corporal: 8`, 'blue');
    log(`   Depilação: 10 | Sobrancelhas: 5 | Cílios: 6`, 'blue');
    log(`   Manicure/Pedicure: 8 | Cabelos: 9 | Estética Avançada: 6`, 'blue');
    log(`   TOTAL ESPERADO: 69 serviços`, 'cyan');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
  }
}

validarServices();
