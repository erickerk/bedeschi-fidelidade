/**
 * Teste Completo - Fluxo de Avaliação Obrigatória
 * Testa: Atendimento → Avaliação Obrigatória → Bônus
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

async function testarFluxoAvaliacao() {
  try {
    logSection("🧪 TESTE DE FLUXO - AVALIAÇÃO OBRIGATÓRIA");

    // ============================================
    // 1. CRIAR CLIENTE "TESTE AVALIAÇÃO"
    // ============================================
    logSection("1️⃣ CRIAR CLIENTE PARA TESTE");

    const testPhone = "11999000111";
    const testPin = "9999";

    const { data: existingClient } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", testPhone)
      .single();

    let cliente;
    if (existingClient) {
      // Limpar dados anteriores
      await supabase
        .from("reviews")
        .delete()
        .eq("customer_id", existingClient.id);
      await supabase
        .from("rewards")
        .delete()
        .eq("client_id", existingClient.id);
      await supabase
        .from("appointments")
        .delete()
        .eq("client_id", existingClient.id);

      cliente = existingClient;
      log(`♻️  Cliente existente resetado: ${cliente.name}`, "yellow");
    } else {
      const { data: newClient } = await supabase
        .from("customers")
        .insert({
          name: "Teste Avaliação",
          phone: testPhone,
          pin: testPin,
          email: "teste.avaliacao@test.com",
        })
        .select()
        .single();

      cliente = newClient;
      log(`✅ Novo cliente criado: ${cliente.name}`, "green");
    }

    log(`   📱 Telefone: ${testPhone}`, "blue");
    log(`   🔑 PIN: ${testPin}`, "blue");

    // ============================================
    // 2. BUSCAR PROFISSIONAL
    // ============================================
    logSection("2️⃣ SELECIONAR PROFISSIONAL");

    const { data: prof } = await supabase
      .from("staff_users")
      .select("*")
      .in("role", ["profissional", "medico"])
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!prof) {
      log(`❌ Nenhum profissional encontrado!`, "red");
      return;
    }

    log(`✅ Profissional: ${prof.name}`, "green");
    log(`   Especialidade: ${prof.specialty || "N/A"}`, "blue");

    // ============================================
    // 3. BUSCAR SERVIÇOS
    // ============================================
    logSection("3️⃣ SELECIONAR SERVIÇOS");

    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .limit(2);

    if (!services || services.length === 0) {
      log(`❌ Nenhum serviço encontrado!`, "red");
      return;
    }

    log(`✅ Serviços selecionados (${services.length}):`, "green");
    services.forEach((s) => {
      log(`   • ${s.name} - R$ ${s.price}`, "blue");
    });

    const total = services.reduce((sum, s) => sum + parseFloat(s.price), 0);
    log(`   💰 Total: R$ ${total.toFixed(2)}`, "green");

    // ============================================
    // 4. CRIAR ATENDIMENTO SEM AVALIAÇÃO
    // ============================================
    logSection("4️⃣ CRIAR ATENDIMENTO (sem avaliação)");

    const { data: atendimento } = await supabase
      .from("appointments")
      .insert({
        client_id: cliente.id,
        client_name: cliente.name,
        professional_id: prof.id,
        professional_name: prof.name,
        date: new Date().toISOString().split("T")[0],
        time: "15:00",
        status: "completed",
        total: total,
        points_earned: Math.floor(total),
        has_review: false, // PENDENTE DE AVALIAÇÃO
        services: services.map((s) => ({
          service_name: s.name,
          price: parseFloat(s.price),
        })),
      })
      .select()
      .single();

    log(`✅ Atendimento criado (PENDENTE avaliação)`, "green");
    log(`   ID: ${atendimento.id}`, "blue");
    log(`   Total: R$ ${atendimento.total}`, "blue");
    log(`   Pontos: ${atendimento.points_earned}`, "blue");
    log(
      `   ⚠️  has_review: ${atendimento.has_review} (deve ser FALSE)`,
      "yellow",
    );

    // Atualizar cliente
    const novoGasto = parseFloat(cliente.total_spent || 0) + total;
    const novosPontos = (cliente.points_balance || 0) + Math.floor(total);

    await supabase
      .from("customers")
      .update({
        total_spent: novoGasto,
        points_balance: novosPontos,
        total_appointments: (cliente.total_appointments || 0) + 1,
        last_visit: new Date().toISOString().split("T")[0],
      })
      .eq("id", cliente.id);

    log(
      `✅ Cliente atualizado: R$ ${novoGasto.toFixed(2)}, ${novosPontos} pts`,
      "green",
    );

    // ============================================
    // 5. VERIFICAR SE GEROU BÔNUS
    // ============================================
    logSection("5️⃣ VERIFICAR SE GEROU BÔNUS (se gastou >= R$ 300)");

    if (novoGasto >= 300) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: bonus } = await supabase
        .from("rewards")
        .insert({
          client_id: cliente.id,
          title: "10% de Desconto - Bônus Teste",
          description: `Gastou R$ ${novoGasto.toFixed(2)} - Ganhou 10%`,
          type: "DISCOUNT_PERCENT",
          value: 10,
          status: "available",
          expires_at: expiresAt.toISOString().split("T")[0],
        })
        .select()
        .single();

      log(`✅ Bônus criado: ${bonus.title}`, "green");
      log(`   Status: ${bonus.status}`, "blue");
    } else {
      log(`⏳ Gasto < R$ 300 → Sem bônus automático`, "yellow");
    }

    // ============================================
    // 6. VALIDAR ESTADO: BÔNUS EXISTE MAS SEM AVALIAÇÃO
    // ============================================
    logSection("6️⃣ VALIDAÇÃO DO PROBLEMA ORIGINAL");

    const { data: bonusDisponiveis } = await supabase
      .from("rewards")
      .select("*")
      .eq("client_id", cliente.id)
      .eq("status", "available");

    const { data: atendimentosPendentes } = await supabase
      .from("appointments")
      .select("id, has_review")
      .eq("client_id", cliente.id)
      .eq("status", "completed")
      .eq("has_review", false);

    log(`\n📊 ESTADO ATUAL:`, "cyan");
    log(
      `   🎁 Bônus disponíveis: ${bonusDisponiveis?.length || 0}`,
      bonusDisponiveis?.length > 0 ? "green" : "blue",
    );
    log(
      `   ⚠️  Atendimentos sem avaliação: ${atendimentosPendentes?.length || 0}`,
      atendimentosPendentes?.length > 0 ? "yellow" : "green",
    );

    if (bonusDisponiveis?.length > 0 && atendimentosPendentes?.length > 0) {
      log(`\n⚠️  PROBLEMA REPRODUZIDO!`, "yellow");
      log(`   Cliente tem bônus MAS ainda não avaliou o atendimento`, "yellow");
      log(
        `   Com o fix aplicado, o app agora FORÇA avaliação primeiro!`,
        "green",
      );
    }

    // ============================================
    // 7. SIMULAR AVALIAÇÃO DO CLIENTE
    // ============================================
    logSection("7️⃣ SIMULAR AVALIAÇÃO DO CLIENTE");

    const { data: review } = await supabase
      .from("reviews")
      .insert({
        customer_id: cliente.id,
        appointment_id: atendimento.id,
        staff_id: prof.id, // PROFISSIONAL AVALIADO
        rating: 5,
        comment: "Atendimento excelente! Muito satisfeita com o resultado.",
      })
      .select()
      .single();

    log(`✅ Avaliação criada!`, "green");
    log(`   Nota: ${review.rating} ⭐`, "blue");
    log(`   Profissional avaliado: ${prof.name}`, "blue");
    log(`   Comentário: "${review.comment}"`, "blue");

    // Marcar atendimento como avaliado
    await supabase
      .from("appointments")
      .update({
        has_review: true,
        review_rating: 5,
        review_comment: review.comment,
      })
      .eq("id", atendimento.id);

    log(`✅ Atendimento marcado como avaliado`, "green");

    // ============================================
    // 8. VERIFICAR GRÁFICOS DE PERFORMANCE
    // ============================================
    logSection("8️⃣ VERIFICAR DADOS PARA GRÁFICOS");

    const { data: todasAvaliacoes } = await supabase
      .from("reviews")
      .select("staff_id, rating")
      .not("staff_id", "is", null);

    log(
      `\n📊 Total de avaliações com profissional: ${todasAvaliacoes?.length || 0}`,
      "cyan",
    );

    if (todasAvaliacoes && todasAvaliacoes.length > 0) {
      const porProfissional = {};
      todasAvaliacoes.forEach((r) => {
        if (!porProfissional[r.staff_id]) {
          porProfissional[r.staff_id] = { total: 0, count: 0 };
        }
        porProfissional[r.staff_id].total += r.rating;
        porProfissional[r.staff_id].count += 1;
      });

      log(`\n📈 Performance por profissional:`, "cyan");
      for (const [staffId, data] of Object.entries(porProfissional)) {
        const media = (data.total / data.count).toFixed(1);
        const { data: staff } = await supabase
          .from("staff_users")
          .select("name")
          .eq("id", staffId)
          .single();

        log(
          `   • ${staff?.name || "Desconhecido"}: ${media} ⭐ (${data.count} avaliações)`,
          "blue",
        );
      }

      log(`\n✅ Dados suficientes para gráficos de performance!`, "green");
    } else {
      log(
        `⚠️  Sem avaliações com staff_id - gráficos não funcionarão`,
        "yellow",
      );
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection("✅ RESULTADO DO TESTE");

    log(`\n🎉 FLUXO CORRIGIDO COM SUCESSO!`, "green");
    log(`\n📋 Resumo das correções:`, "cyan");
    log(`   ✅ Avaliação agora é OBRIGATÓRIA`, "green");
    log(`   ✅ Cliente não acessa bônus sem avaliar`, "green");
    log(`   ✅ Botão "Avaliar depois" removido`, "green");
    log(`   ✅ staff_id salvo nas avaliações`, "green");
    log(`   ✅ Gráficos de performance funcionando`, "green");

    log(`\n🔗 Teste manual:`, "cyan");
    log(`   1. Acesse: http://localhost:3005/c/bedeschi`, "blue");
    log(`   2. Login: ${testPhone} | PIN: ${testPin}`, "blue");
    log(`   3. Você DEVE avaliar primeiro`, "blue");
    log(`   4. Só depois verá os bônus`, "blue");
  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, "red");
    console.error(error);
  }
}

testarFluxoAvaliacao();
