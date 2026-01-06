/**
 * Script de Validação - Integridade e Sincronização
 * Verifica consistência entre todas as tabelas
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
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(70));
  log(title, "cyan");
  console.log("=".repeat(70));
}

async function validarSincronizacao() {
  let todosOk = true;
  const problemas = [];

  try {
    logSection("🔍 VALIDAÇÃO COMPLETA - INTEGRIDADE E SINCRONIZAÇÃO");

    // ============================================
    // 1. VALIDAR CLIENTES
    // ============================================
    logSection("1️⃣ VALIDAR DADOS DOS CLIENTES");

    const { data: clientes, error: clientesError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientesError) {
      log(`❌ Erro ao buscar clientes: ${clientesError.message}`, "red");
      todosOk = false;
    } else {
      log(`✅ ${clientes.length} cliente(s) encontrado(s)`, "green");

      // Validar cada cliente
      for (const cliente of clientes) {
        const erros = [];

        // Buscar atendimentos do cliente
        const { data: atendimentos } = await supabase
          .from("appointments")
          .select("*")
          .eq("client_id", cliente.id);

        const numAtendimentos = atendimentos?.length || 0;
        const gastoReal =
          atendimentos?.reduce((sum, a) => sum + parseFloat(a.total), 0) || 0;
        const pontosReais =
          atendimentos?.reduce((sum, a) => sum + a.points_earned, 0) || 0;

        // Verificar consistência
        if (cliente.total_appointments !== numAtendimentos) {
          erros.push(
            `Total atendimentos: esperado ${numAtendimentos}, registrado ${cliente.total_appointments}`,
          );
        }

        if (Math.abs(parseFloat(cliente.total_spent) - gastoReal) > 0.01) {
          erros.push(
            `Gasto total: esperado R$ ${gastoReal.toFixed(2)}, registrado R$ ${parseFloat(cliente.total_spent).toFixed(2)}`,
          );
        }

        if (cliente.points_balance !== pontosReais) {
          erros.push(
            `Pontos: esperado ${pontosReais}, registrado ${cliente.points_balance}`,
          );
        }

        if (erros.length > 0) {
          log(`\n⚠️  ${cliente.name} (${cliente.phone}):`, "yellow");
          erros.forEach((e) => log(`   ❌ ${e}`, "red"));
          problemas.push(...erros);
          todosOk = false;
        } else {
          log(
            `✅ ${cliente.name}: Dados consistentes (${numAtendimentos} atendimentos, R$ ${gastoReal.toFixed(2)}, ${pontosReais} pontos)`,
            "green",
          );
        }
      }
    }

    // ============================================
    // 2. VALIDAR ATENDIMENTOS
    // ============================================
    logSection("2️⃣ VALIDAR ATENDIMENTOS E AVALIAÇÕES");

    const { data: atendimentos, error: atendError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (atendError) {
      log(`❌ Erro ao buscar atendimentos: ${atendError.message}`, "red");
      todosOk = false;
    } else {
      log(`✅ ${atendimentos.length} atendimento(s) encontrado(s)`, "green");

      let comAvaliacao = 0;
      let semAvaliacao = 0;

      for (const atendimento of atendimentos) {
        // Verificar se tem avaliação no banco
        const { data: review } = await supabase
          .from("reviews")
          .select("*")
          .eq("appointment_id", atendimento.id)
          .single();

        const temReview = !!review;

        if (atendimento.has_review !== temReview) {
          log(
            `⚠️  Inconsistência: Atendimento ${atendimento.id.slice(0, 8)}...`,
            "yellow",
          );
          log(`   Campo has_review: ${atendimento.has_review}`, "yellow");
          log(`   Review existe: ${temReview}`, "yellow");
          problemas.push("Atendimento com flag has_review incorreta");
          todosOk = false;
        }

        if (temReview) {
          comAvaliacao++;
          if (atendimento.review_rating !== review.rating) {
            log(
              `⚠️  Nota diferente: atendimento tem ${atendimento.review_rating}, review tem ${review.rating}`,
              "yellow",
            );
            problemas.push("Rating inconsistente entre atendimento e review");
            todosOk = false;
          }
        } else {
          semAvaliacao++;
        }
      }

      log(`\n📊 Resumo de Avaliações:`, "cyan");
      log(`   ✅ Com avaliação: ${comAvaliacao}`, "green");
      log(
        `   ⏳ Pendente avaliação: ${semAvaliacao}`,
        semAvaliacao > 0 ? "yellow" : "green",
      );
    }

    // ============================================
    // 3. VALIDAR REVIEWS
    // ============================================
    logSection("3️⃣ VALIDAR REVIEWS (AVALIAÇÕES)");

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        customers!reviews_customer_id_fkey(name),
        appointments!reviews_appointment_id_fkey(id, total),
        staff_users!reviews_staff_id_fkey(name)
      `,
      )
      .order("created_at", { ascending: false });

    if (reviewsError) {
      log(`❌ Erro ao buscar reviews: ${reviewsError.message}`, "red");
      todosOk = false;
    } else {
      log(`✅ ${reviews.length} avaliação(ões) encontrada(s)`, "green");

      const estatisticas = {};

      reviews.forEach((review) => {
        const profissional = review.staff_users?.name || "Desconhecido";

        if (!estatisticas[profissional]) {
          estatisticas[profissional] = {
            total: 0,
            soma: 0,
            notas: [],
          };
        }

        estatisticas[profissional].total++;
        estatisticas[profissional].soma += review.rating;
        estatisticas[profissional].notas.push(review.rating);
      });

      log(`\n📊 Estatísticas por Profissional:`, "cyan");
      Object.entries(estatisticas).forEach(([nome, stats]) => {
        const media = stats.soma / stats.total;
        const notasStr = stats.notas.join(", ");
        const emoji = media >= 4.5 ? "🏆" : media >= 4.0 ? "👍" : "⚠️";

        log(`   ${emoji} ${nome}:`, "blue");
        log(`      Avaliações: ${stats.total}`, "blue");
        log(`      Média: ${media.toFixed(1)}/5`, "blue");
        log(`      Notas: [${notasStr}]`, "blue");
      });
    }

    // ============================================
    // 4. VALIDAR PROFISSIONAIS
    // ============================================
    logSection("4️⃣ VALIDAR PROFISSIONAIS");

    const { data: profissionais, error: profError } = await supabase
      .from("staff_users")
      .select("*")
      .in("role", ["profissional", "medico"])
      .eq("is_active", true);

    if (profError) {
      log(`❌ Erro ao buscar profissionais: ${profError.message}`, "red");
      todosOk = false;
    } else {
      log(`✅ ${profissionais.length} profissional(is) ativo(s)`, "green");

      for (const prof of profissionais) {
        const { data: atendProf } = await supabase
          .from("appointments")
          .select("id")
          .eq("professional_id", prof.id);

        const { data: reviewsProf } = await supabase
          .from("reviews")
          .select("rating")
          .eq("staff_id", prof.id);

        const numAtend = atendProf?.length || 0;
        const numReviews = reviewsProf?.length || 0;

        log(`\n👤 ${prof.name} (${prof.role})`, "blue");
        log(`   Especialidade: ${prof.specialty || "Não informada"}`, "blue");
        log(`   Atendimentos: ${numAtend}`, "blue");
        log(`   Avaliações: ${numReviews}`, "blue");

        if (numAtend > 0 && numReviews === 0) {
          log(`   ⚠️  Tem atendimentos mas nenhuma avaliação`, "yellow");
        }
      }
    }

    // ============================================
    // 5. VALIDAR INTEGRIDADE REFERENCIAL
    // ============================================
    logSection("5️⃣ VALIDAR INTEGRIDADE REFERENCIAL");

    // Verificar appointments órfãos
    const { data: atendOrfaos } = await supabase
      .from("appointments")
      .select("id, client_id, professional_id")
      .is("client_id", null);

    if (atendOrfaos && atendOrfaos.length > 0) {
      log(`⚠️  ${atendOrfaos.length} atendimento(s) sem cliente`, "yellow");
      problemas.push("Atendimentos órfãos encontrados");
      todosOk = false;
    } else {
      log(`✅ Todos os atendimentos têm cliente associado`, "green");
    }

    // Verificar reviews órfãs
    const { data: reviewsOrfas } = await supabase
      .from("reviews")
      .select("id, appointment_id")
      .is("appointment_id", null);

    if (reviewsOrfas && reviewsOrfas.length > 0) {
      log(
        `⚠️  ${reviewsOrfas.length} avaliação(ões) sem atendimento`,
        "yellow",
      );
      problemas.push("Reviews órfãs encontradas");
      todosOk = false;
    } else {
      log(`✅ Todas as avaliações têm atendimento associado`, "green");
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection("📋 RESULTADO DA VALIDAÇÃO");

    if (todosOk && problemas.length === 0) {
      log("✅ SISTEMA 100% ÍNTEGRO E SINCRONIZADO!", "green");
      log("\n🎉 Todos os dados estão consistentes:", "green");
      log("   ✅ Clientes com pontos e gastos corretos", "green");
      log("   ✅ Atendimentos sincronizados com avaliações", "green");
      log("   ✅ Reviews vinculadas corretamente", "green");
      log("   ✅ Integridade referencial OK", "green");
      log("   ✅ Estatísticas precisas", "green");
    } else {
      log("⚠️  PROBLEMAS ENCONTRADOS NA VALIDAÇÃO", "yellow");
      log(`\nTotal de problemas: ${problemas.length}`, "yellow");

      if (problemas.length > 0) {
        log("\n📝 Resumo dos problemas:", "cyan");
        const unicos = [...new Set(problemas)];
        unicos.forEach((p, i) => {
          log(`   ${i + 1}. ${p}`, "yellow");
        });
      }

      log("\n💡 Recomendação:", "cyan");
      log(
        "   Execute o script de correção ou revise os dados manualmente",
        "blue",
      );
    }
  } catch (error) {
    log(`\n❌ ERRO FATAL: ${error.message}`, "red");
    console.error(error);
    todosOk = false;
  }

  process.exit(todosOk ? 0 : 1);
}

validarSincronizacao();
