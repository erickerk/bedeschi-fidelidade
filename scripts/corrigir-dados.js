/**
 * Script de Correção - Zerar dados fictícios de clientes de exemplo
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
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function corrigirDados() {
  try {
    log("\n🔧 CORRIGINDO DADOS FICTÍCIOS DOS CLIENTES DE EXEMPLO\n", "cyan");

    // Buscar clientes com dados mas sem atendimentos
    const { data: clientes } = await supabase
      .from("customers")
      .select("*")
      .or("total_appointments.gt.0,total_spent.gt.0,points_balance.gt.0");

    for (const cliente of clientes) {
      // Verificar se tem atendimentos reais
      const { data: atendimentos } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", cliente.id);

      const numAtendReais = atendimentos?.length || 0;

      if (
        numAtendReais === 0 &&
        (cliente.total_appointments > 0 ||
          cliente.total_spent > 0 ||
          cliente.points_balance > 0)
      ) {
        log(
          `🔧 Zerando dados fictícios de: ${cliente.name} (${cliente.phone})`,
          "yellow",
        );
        log(
          `   Antes: ${cliente.total_appointments} atendimentos, R$ ${cliente.total_spent}, ${cliente.points_balance} pontos`,
          "yellow",
        );

        const { error } = await supabase
          .from("customers")
          .update({
            total_appointments: 0,
            total_spent: 0,
            points_balance: 0,
          })
          .eq("id", cliente.id);

        if (error) {
          log(`   ❌ Erro: ${error.message}`, "red");
        } else {
          log(`   ✅ Corrigido: 0 atendimentos, R$ 0.00, 0 pontos`, "green");
        }
      } else if (numAtendReais > 0) {
        // Recalcular baseado em atendimentos reais
        const { data: atendimentosCompletos } = await supabase
          .from("appointments")
          .select("total, points_earned")
          .eq("client_id", cliente.id);

        const gastoReal =
          atendimentosCompletos?.reduce(
            (sum, a) => sum + parseFloat(a.total),
            0,
          ) || 0;
        const pontosReais =
          atendimentosCompletos?.reduce((sum, a) => sum + a.points_earned, 0) ||
          0;

        if (
          cliente.total_spent !== gastoReal ||
          cliente.points_balance !== pontosReais ||
          cliente.total_appointments !== numAtendReais
        ) {
          log(`🔧 Recalculando: ${cliente.name} (${cliente.phone})`, "yellow");
          log(
            `   Antes: ${cliente.total_appointments} atendimentos, R$ ${cliente.total_spent}, ${cliente.points_balance} pontos`,
            "yellow",
          );

          const { error } = await supabase
            .from("customers")
            .update({
              total_appointments: numAtendReais,
              total_spent: gastoReal,
              points_balance: pontosReais,
            })
            .eq("id", cliente.id);

          if (error) {
            log(`   ❌ Erro: ${error.message}`, "red");
          } else {
            log(
              `   ✅ Corrigido: ${numAtendReais} atendimentos, R$ ${gastoReal.toFixed(2)}, ${pontosReais} pontos`,
              "green",
            );
          }
        } else {
          log(`✅ ${cliente.name}: Já está correto`, "green");
        }
      }
    }

    log("\n✅ CORREÇÃO CONCLUÍDA!\n", "green");
  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

corrigirDados();
