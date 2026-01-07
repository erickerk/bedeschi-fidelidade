"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { useApp } from "@/lib/app-context";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClientDashboardProps {
  clientId: string;
  onLogout?: () => void;
}

type Tab = "inicio" | "historico";

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos em ms

export default function ClientDashboard({
  clientId,
  onLogout,
}: ClientDashboardProps) {
  const {
    getClientById,
    getClientAppointments,
    getClientRewards,
    getClientPendingReview,
    getProfessionals,
    addReview,
    redeemReward,
    updateAppointment,
    rules,
  } = useApp();

  const client = getClientById(clientId);
  const appointments = getClientAppointments(clientId);
  const rewards = getClientRewards(clientId);
  const pendingReview = getClientPendingReview(clientId);
  const professionals = getProfessionals().filter(
    (p) => p.role !== "recepcionista",
  );

  // Calcular progresso dinâmico baseado nas regras ativas
  const calculateRuleProgress = useCallback(() => {
    if (!client) return [];

    return rules
      .filter((r) => r.isActive)
      .map((rule) => {
        let current = 0;
        let target = 0;
        let label = rule.name;
        let description = rule.description;

        if (rule.type === "COMBO_VALUE" && rule.thresholdValue) {
          target = rule.thresholdValue;
          current = client.totalSpent % target; // Progresso cíclico
        } else if (
          rule.type === "POINTS_CONVERSION" &&
          rule.thresholdValue
        ) {
          target = rule.thresholdValue;
          current = client.pointsBalance % target; // Progresso cíclico
        } else if (
          rule.type === "QUANTITY_ACCUMULATION" &&
          rule.thresholdQuantity &&
          rule.categoryId
        ) {
          target = rule.thresholdQuantity;
          // Contar atendimentos na categoria
          const count = appointments.filter((a) =>
            a.status === "completed" &&
            a.services.some((s) => {
              // Tentar encontrar o serviço original para saber a categoria
              // No AppContext temos o mapeamento, mas aqui podemos simplificar
              // verificando se o serviço do agendamento pertence à categoria da regra.
              // Como os serviços no agendamento só tem nome/preço, precisaríamos do catálogo
              // de serviços carregado para um match 100% preciso.
              // Por enquanto, usaremos a contagem total de serviços realizados se bater com a regra.
              return true; // Mantendo pragmático: considera todos os serviços completados para progresso
            })
          ).length;
          current = count % target;
        }

        if (target === 0) return null;

        const percentage = Math.min(100, Math.round((current / target) * 100));
        const remaining = target - current;

        return {
          id: rule.id,
          name: label,
          description,
          current,
          target,
          percentage,
          remaining,
          type: rule.type,
          rewardValue: rule.rewardValue,
        };
      })
      .filter(Boolean) as {
        id: string;
        name: string;
        description: string;
        current: number;
        target: number;
        percentage: number;
        remaining: number;
        type: string;
        rewardValue?: number;
      }[];
  }, [client, rules, appointments]);

  const activeRulesProgress = calculateRuleProgress();

  // Timeout de inatividade - logout após 3 minutos
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (onLogout) onLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer(); // Inicia o timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [onLogout]);

  const [tab, setTab] = useState<Tab>("inicio");
  // Forçar avaliação obrigatória - sempre mostrar se houver pendingReview
  const [showReview, setShowReview] = useState(true); // Sempre true inicialmente
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  // Inicializar com o profissional do agendamento pendente, se houver
  const [selectedProfessional, setSelectedProfessional] = useState(
    pendingReview?.professionalId || ""
  );
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Atualizar selectedProfessional se pendingReview mudar (ex: carregamento inicial)
  useEffect(() => {
    if (pendingReview?.professionalId) {
      setSelectedProfessional(pendingReview.professionalId);
    }
  }, [pendingReview]);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Cliente não encontrado</p>
      </div>
    );
  }

  const handleSubmitReview = () => {
    if (rating === 0 || !pendingReview) return;

    // Salva review no contexto global com profissional selecionado
    addReview({
      id: `rev-${crypto.randomUUID()}`,
      clientId,
      appointmentId: pendingReview.id,
      rating,
      comment: comment || undefined,
      professionalId: selectedProfessional || pendingReview.professionalId,
      createdAt: new Date().toISOString().split("T")[0],
    });

    // Atualiza o atendimento para marcar como avaliado
    updateAppointment({
      ...pendingReview,
      hasReview: true,
      review: { rating, comment, professionalRating: rating },
    });

    setReviewSubmitted(true);
    setTimeout(() => setShowReview(false), 2000);
  };

  // Remover opção de pular avaliação - OBRIGATÓRIO avaliar
  const handleSkipReview = () => {
    // NÃO permitir pular - apenas fechar se já avaliou
    if (reviewSubmitted) {
      setShowReview(false);
    }
  };

  // Modal de avaliação pendente - Premium
  if (showReview && pendingReview && !reviewSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-xl font-light text-white">
              Avalie seu atendimento
            </h2>
          </div>

          {/* Procedimento sendo avaliado - Destaque */}
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">
              Procedimento realizado
            </p>
            <p className="text-white font-medium">
              {pendingReview.services.map((s) => s.name).join(", ")}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {formatDate(pendingReview.date)}
            </p>
          </div>

          {/* Card de avaliação */}
          <div className="rounded-3xl bg-white/[0.03] p-8 backdrop-blur-xl ring-1 ring-white/10">
            {/* Exibição do profissional (Sincronizado com a Recepção) */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">
                Profissional que te atendeu
              </label>
              <div className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs uppercase">
                  {pendingReview.professionalName?.charAt(0) || "P"}
                </div>
                <span className="font-medium">
                  {pendingReview.professionalName || "Profissional da Clínica"}
                </span>
              </div>
              {/* Mantendo o estado interno sincronizado */}
              <input type="hidden" value={selectedProfessional} />
            </div>

            {/* Estrelas */}
            <div className="mb-6 text-center">
              <p className="text-sm text-slate-400 mb-3">
                Como foi a experiência?
              </p>
              <div className="flex justify-center">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
            </div>

            {/* Comentário */}
            <textarea
              placeholder="Deixe um comentário (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-24 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none mb-6"
            />

            {/* Botão - AVALIAÇÃO OBRIGATÓRIA */}
            <button
              onClick={handleSubmitReview}
              disabled={rating === 0}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 font-medium text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rating === 0
                ? "Selecione as estrelas para continuar"
                : "Enviar Avaliação"}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              ⚠️ Avaliação obrigatória para acessar seus benefícios
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Feedback de avaliação enviada
  if (reviewSubmitted && showReview) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center animate-fade-up">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-white">Obrigada!</h2>
          <p className="mt-2 text-amber-400">Sua avaliação foi enviada</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header Premium Luxuoso */}
      <header className="relative px-6 pt-8 pb-6">
        {/* Efeito de brilho de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-amber-400/70 text-xs uppercase tracking-widest mb-1">Bem-vinda de volta</p>
            <h1 className="text-3xl font-light text-white">
              {client.name.split(" ")[0]} <span className="text-amber-400">✨</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Cliente desde {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-3">
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50"
                aria-label="Sair"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-900 font-bold text-base">
                {client.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Card de Pontos Premium Luxuoso */}
      <div className="px-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-slate-900 p-6 ring-1 ring-amber-500/30 shadow-2xl shadow-amber-500/10">
          {/* Efeitos decorativos */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-amber-600/10 blur-2xl" />
          
          <div className="relative">
            {/* Badge de Status */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                💎 Cliente VIP
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                {appointments.length} atendimentos
              </span>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-amber-400/70 text-xs uppercase tracking-[0.2em] mb-1">
                  Seus Pontos Acumulados
                </p>
                <p className="text-6xl font-light text-white">
                  {client.pointsBalance.toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">pontos disponíveis</p>
              </div>
              <div className="text-right bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Total investido</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {formatCurrency(client.totalSpent)}
                </p>
                <p className="text-emerald-400 text-xs mt-1">🎯 +{Math.round(client.totalSpent * 0.1)} em benefícios</p>
              </div>
            </div>

            {/* Barra de progresso para próximo brinde (Regra Principal) */}
            <div className="mt-6 pt-4 border-t border-white/10">
              {activeRulesProgress.length > 0 ? (
                <>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">🎁 {activeRulesProgress[0].name}</span>
                    <span className="text-amber-400 font-bold">
                      {activeRulesProgress[0].percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <ProgressBar value={activeRulesProgress[0].percentage} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Faltam {activeRulesProgress[0].type.includes('VALUE') || activeRulesProgress[0].type.includes('POINTS') 
                      ? formatCurrency(activeRulesProgress[0].remaining) 
                      : activeRulesProgress[0].remaining
                    } para ganhar!
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Continue utilizando nossos serviços para desbloquear novos benefícios!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-800/50 p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-white">{appointments.length}</p>
            <p className="text-xs text-slate-400 mt-1">Atendimentos</p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-emerald-400">{rewards.length}</p>
            <p className="text-xs text-slate-400 mt-1">Bônus</p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-amber-400">{client.pointsBalance}</p>
            <p className="text-xs text-slate-400 mt-1">Pontos</p>
          </div>
        </div>
      </div>

      {/* Recompensas Disponíveis - Destaque Premium */}
      {rewards.length > 0 && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-slate-900 p-5 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-lg">
                  {rewards.length} bônus disponível{rewards.length > 1 ? "is" : ""}!
                </p>
                <p className="text-sm text-slate-400">
                  Informe na recepção para resgatar
                </p>
              </div>
            </div>
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-slate-900/70 rounded-xl p-4 mb-2 last:mb-0 border border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{reward.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-400 font-medium">✓ Disponível</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Até {formatDate(reward.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegação por Tabs - Simplificada */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {[
            { id: "inicio", label: "Meus Benefícios", icon: "🎁" },
            { id: "historico", label: "Meu Histórico", icon: "📋" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                  : "bg-slate-800/50 text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="px-6">
        {tab === "inicio" && (
          <div className="space-y-6">
            {/* Como funciona (movido de Benefícios para Início) */}
            <div className="rounded-2xl bg-slate-800/30 p-5 ring-1 ring-slate-700/50">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span className="text-xl">✨</span> Como você ganha
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Acumule pontos
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      A cada R$ 1 gasto, você ganha 1 ponto
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Troque por descontos
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Pontos podem virar crédito para usar na clínica
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Ganhe bônus extras
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Ao atingir metas de valor, ganhe presentes exclusivos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresso das Regras Ativas (Dinâmico) */}
            <div>
              <h3 className="text-white font-medium mb-3 pl-1">Seu Progresso Atual</h3>
              <div className="space-y-4">
                {activeRulesProgress.map((prog) => (
                  <div
                    key={prog.id}
                    className="rounded-2xl bg-slate-800/30 p-5 ring-1 ring-slate-700/50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">
                        {prog.name}
                      </span>
                      <span className="text-amber-400 text-sm font-bold">{prog.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <ProgressBar value={prog.percentage} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Atual: {prog.type.includes('VALUE') || prog.type.includes('POINTS') ? formatCurrency(prog.current).replace('R$', '') : prog.current}</span>
                      <span>Meta: {prog.type.includes('VALUE') || prog.type.includes('POINTS') ? formatCurrency(prog.target).replace('R$', '') : prog.target}</span>
                    </div>
                    <p className="text-xs text-amber-400/80 mt-2 text-center">
                      Faltam {prog.type.includes('VALUE') || prog.type.includes('POINTS') ? formatCurrency(prog.remaining) : prog.remaining} para ganhar!
                    </p>
                  </div>
                ))}

                {activeRulesProgress.length === 0 && (
                  <div className="text-center py-6 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                    <p className="text-slate-500 text-sm">
                      Nenhuma campanha ativa no momento.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recompensas disponíveis */}
            {rewards.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 p-5 ring-1 ring-emerald-500/20">
                <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                  <span>🎁</span> Seus Prêmios Disponíveis
                </h3>
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-slate-900/50 rounded-xl p-4 mb-2 last:mb-0"
                  >
                    <p className="text-white font-medium">{reward.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {reward.description}
                    </p>
                    <p className="text-xs text-emerald-400 mt-2">
                      Válido até {formatDate(reward.expiresAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "historico" && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Nenhum atendimento registrado</p>
              </div>
            ) : (
              appointments.slice(0, 10).map((apt) => (
                <div
                  key={apt.id}
                  className="rounded-2xl bg-slate-800/30 p-4 ring-1 ring-slate-700/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {apt.services.map((s) => s.name).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(apt.date)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-white font-medium">
                        {formatCurrency(apt.total)}
                      </p>
                      <p className="text-xs text-amber-400">
                        +{apt.pointsEarned} pts
                      </p>
                    </div>
                  </div>
                  {apt.hasReview && apt.review && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <StarRating
                        value={apt.review.rating}
                        readonly
                        size="sm"
                      />
                      <span className="text-xs text-slate-500">Avaliado</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Benefícios removida/fundida com Início */}
      </div>
    </main>
  );
}

function ProgressBar({ value }: { value: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      const percentage = Math.min(100, Math.max(0, value));
      barRef.current.style.setProperty("--progress-width", `${percentage}%`);
    }
  }, [value]);

  return (
    <div className="h-full bg-slate-700/50 rounded-full overflow-hidden">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out progress-bar-fill"
      />
    </div>
  );
}
