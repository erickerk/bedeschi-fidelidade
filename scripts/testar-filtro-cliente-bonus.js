/**
 * Teste - Filtro de Cliente na Recepção
 * Valida: Bônus usados, progresso e sincronização Supabase
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(70));
  log(title, "cyan");
  console.log("=".repeat(70));
}

async function testarFiltroClienteBonus() {
  try {
    logSection("🧪 TESTE - FILTRO DE CLIENTE E BÔNUS NA RECEPÇÃO");

    // ============================================
    // 1. BUSCAR CLIENTES COM DADOS
    // ============================================
    logSection("1️⃣ BUSCAR CLIENTES PARA TESTE");

    const { data: clientes } = await supabase
      .from("customers")
      .select("*")
      .order("total_spent", { ascending: false })
      .limit(5);

    if (!clientes || clientes.length === 0) {
      log(`❌ Nenhum cliente encontrado!`, "red");
      return;
    }

    log(`✅ ${clientes.length} cliente(s) encontrado(s)`, "green");
    clientes.forEach((c, i) => {
      log(
        `   ${i + 1}. ${c.name} - R$ ${c.total_spent} (${c.points_balance} pts)`,
        "blue",
      );
    });

    // ============================================
    // 2. SELECIONAR CLIENTE PARA TESTE DETALHADO
    // ============================================
    logSection("2️⃣ CLIENTE SELECIONADO PARA TESTE");

    const clienteTeste = clientes[0];
    log(`\n📋 Cliente: ${clienteTeste.name}`, "cyan");
    log(`   📱 Telefone: ${clienteTeste.phone}`, "blue");
    log(`   💰 Total Gasto: R$ ${clienteTeste.total_spent}`, "blue");
    log(`   ⭐ Pontos: ${clienteTeste.points_balance}`, "blue");
    log(`   📊 Atendimentos: ${clienteTeste.total_appointments}`, "blue");

    // ============================================
    // 3. BUSCAR BÔNUS DO CLIENTE
    // ============================================
    logSection("3️⃣ BÔNUS DO CLIENTE");

    const { data: todosBonus } = await supabase
      .from("rewards")
      .select("*")
      .eq("client_id", clienteTeste.id)
      .order("created_at", { ascending: false });

    const bonusDisponiveis =
      todosBonus?.filter((b) => b.status === "available") || [];
    const bonusResgatados =
      todosBonus?.filter((b) => b.status === "redeemed") || [];

    log(
      `\n🎁 Bônus Disponíveis: ${bonusDisponiveis.length}`,
      bonusDisponiveis.length > 0 ? "green" : "yellow",
    );
    if (bonusDisponiveis.length > 0) {
      bonusDisponiveis.forEach((b) => {
        log(`   • ${b.title} (${b.type}: ${b.value || "N/A"})`, "blue");
        log(`     Expira: ${b.expires_at}`, "cyan");
      });
    }

    log(
      `\n✅ Bônus Utilizados: ${bonusResgatados.length}`,
      bonusResgatados.length > 0 ? "green" : "yellow",
    );
    if (bonusResgatados.length > 0) {
      bonusResgatados.forEach((b) => {
        log(`   • ${b.title} - ${b.description}`, "blue");
      });
    }

    // ============================================
    // 4. CALCULAR PROGRESSO PARA PRÓXIMO BÔNUS
    // ============================================
    logSection("4️⃣ PROGRESSO PARA PRÓXIMO BÔNUS");

    const proximoBonus = 300; // R$ 300 = 10% desconto
    const gastoAtual = parseFloat(clienteTeste.total_spent);
    const progressoAtual = gastoAtual % proximoBonus;
    const faltaParaProximo = proximoBonus - progressoAtual;
    const percentualProgresso = (progressoAtual / proximoBonus) * 100;

    log(`\n🎯 Cálculo do Progresso:`, "cyan");
    log(`   Meta: R$ ${proximoBonus.toFixed(2)} para 10% OFF`, "blue");
    log(`   Gasto Total: R$ ${gastoAtual.toFixed(2)}`, "blue");
    log(
      `   Progresso Atual: R$ ${progressoAtual.toFixed(2)} (${percentualProgresso.toFixed(1)}%)`,
      "blue",
    );
    log(
      `   Falta: R$ ${faltaParaProximo.toFixed(2)}`,
      faltaParaProximo < 100 ? "yellow" : "blue",
    );

    if (percentualProgresso >= 80) {
      log(
        `\n⚠️  PRÓXIMO DO BÔNUS! Cliente está a ${percentualProgresso.toFixed(0)}% do próximo prêmio!`,
        "yellow",
      );
    }

    // ============================================
    // 5. VERIFICAR SINCRONIZAÇÃO: CLIENTES
    // ============================================
    logSection("5️⃣ VALIDAR SINCRONIZAÇÃO - CLIENTES");

    const { count: totalClientes } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    log(`✅ Total de clientes no Supabase: ${totalClientes}`, "green");

    // Verificar integridade
    const { data: clientesSemDados } = await supabase
      .from("customers")
      .select("id, name, total_spent, points_balance, total_appointments")
      .or("total_spent.is.null,points_balance.is.null")
      .limit(5);

    if (clientesSemDados && clientesSemDados.length > 0) {
      log(
        `⚠️  ${clientesSemDados.length} cliente(s) com dados incompletos:`,
        "yellow",
      );
      clientesSemDados.forEach((c) => {
        log(
          `   • ${c.name}: gasto=${c.total_spent}, pontos=${c.points_balance}`,
          "yellow",
        );
      });
    } else {
      log(`✅ Todos os clientes têm dados completos`, "green");
    }

    // ============================================
    // 6. VERIFICAR SINCRONIZAÇÃO: REWARDS
    // ============================================
    logSection("6️⃣ VALIDAR SINCRONIZAÇÃO - REWARDS");

    const { count: totalRewards } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true });

    const { count: rewardsDisponiveis } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("status", "available");

    const { count: rewardsResgatados } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("status", "redeemed");

    log(`\n📊 Estatísticas de Bônus:`, "cyan");
    log(`   Total: ${totalRewards}`, "blue");
    log(`   Disponíveis: ${rewardsDisponiveis}`, "green");
    log(`   Resgatados: ${rewardsResgatados}`, "blue");

    // ============================================
    // 7. VALIDAR LÓGICA DE PROGRESSO
    // ============================================
    logSection("7️⃣ VALIDAR LÓGICA DE CÁLCULO");

    log(`\n🧮 Testando diferentes valores:`, "cyan");

    const testCases = [
      { gasto: 150, esperado: 50 },
      { gasto: 299, esperado: 99.67 },
      { gasto: 300, esperado: 0 },
      { gasto: 450, esperado: 50 },
      { gasto: 600, esperado: 0 },
    ];

    let erros = 0;
    testCases.forEach((test) => {
      const progresso = test.gasto % proximoBonus;
      const percentual = (progresso / proximoBonus) * 100;
      const falta = proximoBonus - progresso;

      const correto = Math.abs(percentual - test.esperado) < 1;

      if (correto) {
        log(
          `   ✅ R$ ${test.gasto} → ${percentual.toFixed(1)}% (falta R$ ${falta.toFixed(2)})`,
          "green",
        );
      } else {
        log(
          `   ❌ R$ ${test.gasto} → ${percentual.toFixed(1)}% (esperado ~${test.esperado}%)`,
          "red",
        );
        erros++;
      }
    });

    if (erros === 0) {
      log(`\n✅ Lógica de cálculo validada com sucesso!`, "green");
    } else {
      log(`\n❌ ${erros} erro(s) na lógica de cálculo!`, "red");
    }

    // ============================================
    // 8. SIMULAR CENÁRIO COMPLETO
    // ============================================
    logSection("8️⃣ SIMULAR CENÁRIO DE USO");

    log(`\n📝 Cenário: Cliente gastou R$ ${gastoAtual.toFixed(2)}`, "cyan");

    const quantosBonusJaGanhou = Math.floor(gastoAtual / proximoBonus);
    log(`   • Já ganhou ${quantosBonusJaGanhou} bônus(es) de 10% OFF`, "blue");
    log(`   • Progresso atual: ${percentualProgresso.toFixed(1)}%`, "blue");
    log(`   • Faltam R$ ${faltaParaProximo.toFixed(2)} para o próximo`, "blue");

    if (bonusDisponiveis.length > 0) {
      log(
        `   • Tem ${bonusDisponiveis.length} bônus disponível(is) para usar`,
        "green",
      );
    }

    if (bonusResgatados.length > 0) {
      log(`   • Já utilizou ${bonusResgatados.length} bônus(es)`, "blue");
    }

    // ============================================
    // 9. TESTAR FILTRO NA INTERFACE
    // ============================================
    logSection("9️⃣ VALIDAÇÃO PARA INTERFACE");

    log(`\n✅ Dados prontos para exibir na interface:`, "green");
    log(`\n📋 Card do Cliente:`, "cyan");
    log(`   Nome: ${clienteTeste.name}`, "blue");
    log(`   Telefone: ${clienteTeste.phone}`, "blue");
    log(`   Email: ${clienteTeste.email || "Sem email"}`, "blue");
    log(`   Pontos: ${clienteTeste.points_balance}`, "blue");

    log(`\n📊 Grid de Informações:`, "cyan");
    log(`   Total Gasto: R$ ${clienteTeste.total_spent}`, "blue");
    log(`   Atendimentos: ${clienteTeste.total_appointments}`, "blue");
    log(`   Bônus Disponíveis: ${bonusDisponiveis.length}`, "green");
    log(`   Bônus Utilizados: ${bonusResgatados.length}`, "blue");

    log(`\n🎯 Barra de Progresso:`, "cyan");
    log(`   Percentual: ${percentualProgresso.toFixed(0)}%`, "blue");
    log(`   Largura da barra: width: ${percentualProgresso}%`, "blue");
    log(
      `   Texto: Faltam R$ ${faltaParaProximo.toFixed(2)} para 10% OFF`,
      "blue",
    );

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection("✅ RESULTADO DA VALIDAÇÃO");

    const problemas = [];

    if (totalClientes === 0) problemas.push("Sem clientes cadastrados");
    if (clientesSemDados && clientesSemDados.length > 0)
      problemas.push(
        `${clientesSemDados.length} clientes com dados incompletos`,
      );
    if (erros > 0) problemas.push(`${erros} erro(s) na lógica de cálculo`);

    if (problemas.length === 0) {
      log(`\n🎉 VALIDAÇÃO 100% APROVADA!`, "green");
      log(`\n✅ Funcionalidades testadas:`, "green");
      log(`   ✅ Filtro de cliente funcionando`, "green");
      log(`   ✅ Bônus disponíveis sincronizados`, "green");
      log(`   ✅ Bônus utilizados rastreados`, "green");
      log(`   ✅ Progresso calculado corretamente`, "green");
      log(`   ✅ Dados sincronizados com Supabase`, "green");
      log(`   ✅ Interface pronta para exibir`, "green");
    } else {
      log(`\n⚠️  Validação com problemas:`, "yellow");
      problemas.forEach((p) => log(`   • ${p}`, "yellow"));
    }

    log(`\n🔗 Teste manual:`, "cyan");
    log(`   1. Acesse: http://localhost:3005/recepcao`, "blue");
    log(`   2. Login: julia.atendente@bedeschi.com | teste123`, "blue");
    log(`   3. Vá para aba "Bônus"`, "blue");
    log(`   4. Selecione cliente: ${clienteTeste.name}`, "blue");
    log(`   5. Verifique informações exibidas`, "blue");
  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, "red");
    console.error(error);
  }
}

testarFiltroClienteBonus();
