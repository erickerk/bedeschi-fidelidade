"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { useApp } from "@/lib/app-context";
import { mockCategoryProgress } from "@/lib/mock-data";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";

interface ClientDashboardProps {
  clientId: string;
  onLogout?: () => void;
}

type Tab = "inicio" | "historico" | "beneficios";

export default function ClientDashboard({ clientId, onLogout }: ClientDashboardProps) {
  const { 
    getClientById, 
    getClientAppointments, 
    getClientRewards, 
    getClientPendingReview,
    getProfessionals,
    addReview,
    redeemReward,
    updateAppointment,
  } = useApp();

  const client = getClientById(clientId);
  const appointments = getClientAppointments(clientId);
  const rewards = getClientRewards(clientId);
  const pendingReview = getClientPendingReview(clientId);
  const categoryProgress = mockCategoryProgress[clientId] || [];
  const professionals = getProfessionals().filter(p => p.role !== "recepcionista");

  const [tab, setTab] = useState<Tab>("inicio");
  const [showReview, setShowReview] = useState(!!pendingReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Cliente não encontrado</p>
      </div>
    );
  }

  const handleSubmitReview = () => {
    if (rating === 0 || !pendingReview) return;
    
    // Salva review no contexto global
    addReview({
      id: `rev-${Date.now()}`,
      clientId,
      appointmentId: pendingReview.id,
      rating,
      comment: comment || undefined,
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

  const handleSkipReview = () => {
    setShowReview(false);
  };

  // Modal de avaliação pendente - Premium
  if (showReview && pendingReview && !reviewSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 flex items-center justify-center">
              <svg className="h-7 w-7 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-xl font-light text-white">Avalie seu atendimento</h2>
          </div>

          {/* Procedimento sendo avaliado - Destaque */}
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">Procedimento realizado</p>
            <p className="text-white font-medium">{pendingReview.services.map((s) => s.name).join(", ")}</p>
            <p className="text-sm text-slate-400 mt-1">{formatDate(pendingReview.date)}</p>
          </div>

          {/* Card de avaliação */}
          <div className="rounded-3xl bg-white/[0.03] p-8 backdrop-blur-xl ring-1 ring-white/10">
            {/* Seleção de profissional */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Quem te atendeu?</label>
              <select
                aria-label="Selecionar profissional"
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">Selecione o profissional</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Estrelas */}
            <div className="mb-6 text-center">
              <p className="text-sm text-slate-400 mb-3">Como foi a experiência?</p>
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

            {/* Botões */}
            <button
              onClick={handleSubmitReview}
              disabled={rating === 0}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 font-medium text-slate-900 disabled:opacity-50 mb-3"
            >
              Enviar Avaliação
            </button>
            <button
              onClick={handleSkipReview}
              className="w-full py-3 text-sm text-slate-500 hover:text-white transition-colors"
            >
              Avaliar depois
            </button>
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
            <svg className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
      {/* Header Premium */}
      <header className="relative px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">Olá,</p>
            <h1 className="text-2xl font-light text-white">{client.name.split(" ")[0]}</h1>
          </div>
          <div className="flex items-center gap-3">
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Sair"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 flex items-center justify-center ring-1 ring-amber-500/30">
              <span className="text-amber-400 font-semibold text-sm">
                {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Card de Pontos Premium */}
      <div className="px-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 ring-1 ring-amber-500/20">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-amber-400/70 text-sm uppercase tracking-wider">Seus Pontos</p>
                <p className="text-5xl font-light text-white mt-2">
                  {client.pointsBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Total investido</p>
                <p className="text-xl font-light text-white">{formatCurrency(client.totalSpent)}</p>
              </div>
            </div>
            
            {/* Barra de progresso para próximo brinde */}
            {categoryProgress.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Próximo brinde</span>
                  <span className="text-amber-400">{categoryProgress[0].progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <ProgressBar value={categoryProgress[0].progress} />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Faltam {formatCurrency(categoryProgress[0].remaining)} para {categoryProgress[0].categoryName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recompensas Disponíveis */}
      {rewards.length > 0 && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 p-5 ring-1 ring-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-400 font-medium">{rewards.length} brinde{rewards.length > 1 ? 's' : ''} disponível</p>
                <p className="text-xs text-slate-500">Resgate na sua próxima visita</p>
              </div>
            </div>
            {rewards.slice(0, 1).map((reward) => (
              <div key={reward.id} className="bg-slate-900/50 rounded-xl p-4 mt-3">
                <p className="text-white font-medium">{reward.title}</p>
                <p className="text-xs text-slate-400 mt-1">Válido até {formatDate(reward.expiresAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegação por Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {[
            { id: "inicio", label: "Início", icon: "🏠" },
            { id: "historico", label: "Histórico", icon: "📋" },
            { id: "beneficios", label: "Benefícios", icon: "✨" },
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
          <div className="space-y-4">
            {/* Progresso por categoria */}
            {categoryProgress.map((cp) => (
              <div key={cp.categoryId} className="rounded-2xl bg-slate-800/30 p-5 ring-1 ring-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-medium">{cp.categoryName}</span>
                  <span className="text-amber-400 text-sm">{cp.progress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <ProgressBar value={cp.progress} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{formatCurrency(cp.totalSpent)}</span>
                  <span>{formatCurrency(cp.threshold)}</span>
                </div>
              </div>
            ))}

            {categoryProgress.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">Continue usando nossos serviços para acumular pontos!</p>
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
                <div key={apt.id} className="rounded-2xl bg-slate-800/30 p-4 ring-1 ring-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {apt.services.map((s) => s.name).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(apt.date)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-white font-medium">{formatCurrency(apt.total)}</p>
                      <p className="text-xs text-amber-400">+{apt.pointsEarned} pts</p>
                    </div>
                  </div>
                  {apt.hasReview && apt.review && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                      <StarRating value={apt.review.rating} readonly size="sm" />
                      <span className="text-xs text-slate-500">Avaliado</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "beneficios" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-800/30 p-5 ring-1 ring-slate-700/50">
              <h3 className="text-white font-medium mb-4">Como funciona</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Acumule pontos</p>
                    <p className="text-slate-500 text-xs mt-1">A cada R$ 1 gasto, você ganha 1 ponto</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Troque por descontos</p>
                    <p className="text-slate-500 text-xs mt-1">500 pontos = R$ 50 de desconto</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Ganhe brindes exclusivos</p>
                    <p className="text-slate-500 text-xs mt-1">Ao atingir metas de valor, ganhe procedimentos grátis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recompensas disponíveis */}
            {rewards.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 p-5 ring-1 ring-emerald-500/20">
                <h3 className="text-emerald-400 font-medium mb-3">Seus brindes</h3>
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-slate-900/50 rounded-xl p-4 mb-2 last:mb-0">
                    <p className="text-white font-medium">{reward.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
                    <p className="text-xs text-emerald-400 mt-2">Válido até {formatDate(reward.expiresAt)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-sm text-slate-500">Dúvidas? Fale com nossa equipe</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ProgressBar({ value }: { value: number }) {
  const getWidthClass = (v: number) => {
    if (v >= 100) return "w-full";
    if (v >= 95) return "w-[95%]";
    if (v >= 90) return "w-[90%]";
    if (v >= 85) return "w-[85%]";
    if (v >= 80) return "w-4/5";
    if (v >= 75) return "w-3/4";
    if (v >= 70) return "w-[70%]";
    if (v >= 65) return "w-[65%]";
    if (v >= 60) return "w-3/5";
    if (v >= 55) return "w-[55%]";
    if (v >= 50) return "w-1/2";
    if (v >= 45) return "w-[45%]";
    if (v >= 40) return "w-2/5";
    if (v >= 35) return "w-[35%]";
    if (v >= 30) return "w-[30%]";
    if (v >= 25) return "w-1/4";
    if (v >= 20) return "w-1/5";
    if (v >= 15) return "w-[15%]";
    if (v >= 10) return "w-[10%]";
    if (v >= 5) return "w-[5%]";
    return "w-0";
  };

  return (
    <div className={`h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all ${getWidthClass(value)}`} />
  );
}
