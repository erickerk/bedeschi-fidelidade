"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardPremium } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Progress } from "@/components/ui/progress";
import {
  getClientById,
  getClientAppointments,
  getClientRewards,
  getClientPendingReview,
  mockCategoryProgress,
  type Appointment,
  type Reward,
} from "@/lib/mock-data";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";

interface ClientDashboardProps {
  clientId: string;
}

type Tab = "pontos" | "historico";

export default function ClientDashboard({ clientId }: ClientDashboardProps) {
  const client = getClientById(clientId);
  const appointments = getClientAppointments(clientId);
  const rewards = getClientRewards(clientId).filter((r) => r.status === "available");
  const pendingReview = getClientPendingReview(clientId);
  const categoryProgress = mockCategoryProgress[clientId] || [];

  const [tab, setTab] = useState<Tab>("pontos");
  const [showReview, setShowReview] = useState(!!pendingReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cliente não encontrado</p>
      </div>
    );
  }

  const handleSubmitReview = () => {
    if (rating === 0) return;
    // Em produção, salvaria no banco
    console.log("Review:", { rating, comment, appointmentId: pendingReview?.id });
    setReviewSubmitted(true);
    setTimeout(() => setShowReview(false), 1500);
  };

  const handleSkipReview = () => {
    setShowReview(false);
  };

  // Modal de avaliação pendente
  if (showReview && pendingReview && !reviewSubmitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Como foi seu último atendimento?
              </h2>
              <p className="mt-2 text-slate-500">
                {pendingReview.services.map((s) => s.name).join(", ")}
              </p>
              <p className="text-sm text-slate-400">
                {formatDate(pendingReview.date)}
              </p>
            </div>

            <div className="my-8 flex justify-center">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <textarea
              placeholder="Deixe um comentário (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-6 h-24 w-full resize-none rounded-xl border-2 border-slate-200 p-3 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/20"
            />

            <div className="space-y-3">
              <Button
                onClick={handleSubmitReview}
                className="w-full"
                disabled={rating === 0}
              >
                Enviar Avaliação
              </Button>
              <button
                onClick={handleSkipReview}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Avaliar depois
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Feedback de avaliação enviada - redireciona automaticamente para dashboard
  if (reviewSubmitted && showReview) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cinematic-gold p-6">
        <div className="text-center animate-fade-up">
          <div className="mb-4 text-6xl">✨</div>
          <h2 className="text-2xl font-semibold text-white">Obrigada!</h2>
          <p className="text-gold-300">Sua avaliação foi enviada</p>
          <p className="text-sm text-slate-400 mt-4">Redirecionando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 safe-bottom">
      {/* Header */}
      <header className="bg-cinematic-gold px-4 sm:px-6 pb-20 sm:pb-24 pt-6 sm:pt-8 text-white safe-top">
        <p className="text-gold-300 text-sm">Olá,</p>
        <h1 className="font-display text-xl sm:text-2xl font-bold">{client.name} 👋</h1>
      </header>

      {/* Card de Pontos */}
      <div className="px-4 sm:px-6 -mt-14 sm:-mt-16">
        <CardPremium className="relative animate-fade-up">
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gold-300/30 text-4xl sm:text-6xl">✨</div>
          <div className="relative z-10">
            <p className="text-xs sm:text-sm text-gold-300">Seus Pontos</p>
            <p className="points-display text-4xl sm:text-5xl">
              {client.pointsBalance.toLocaleString()}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Total gasto: {formatCurrency(client.totalSpent)}
            </p>
          </div>
        </CardPremium>
      </div>

      {/* Progresso por categoria */}
      {categoryProgress.length > 0 && (
        <section className="mt-6 px-6">
          <h2 className="mb-3 font-semibold text-slate-800">Seu Progresso</h2>
          <div className="space-y-4">
            {categoryProgress.map((cp) => (
              <Card key={cp.categoryId} className="p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{cp.categoryName}</span>
                  <span className="text-gold-600">
                    {formatCurrency(cp.totalSpent)} / {formatCurrency(cp.threshold)}
                  </span>
                </div>
                <Progress value={cp.progress} />
                {cp.remaining > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Faltam {formatCurrency(cp.remaining)} para ganhar 1 {cp.categoryName.toLowerCase()} grátis
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recompensas */}
      {rewards.length > 0 && (
        <section className="mt-6 px-6">
          <h2 className="mb-3 font-semibold text-slate-800">🎁 Recompensas Disponíveis</h2>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200">
        <div className="flex px-6">
          <button
            onClick={() => setTab("pontos")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "pontos"
                ? "border-gold-500 text-gold-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Pontos
          </button>
          <button
            onClick={() => setTab("historico")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "historico"
                ? "border-gold-500 text-gold-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Conteúdo da tab */}
      <div className="px-6 py-4">
        {tab === "historico" && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                Nenhum atendimento registrado
              </p>
            ) : (
              appointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))
            )}
          </div>
        )}

        {tab === "pontos" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-2 font-medium text-slate-800">Como funciona</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-gold-500">✓</span>
                  A cada R$ 1 gasto, você ganha 1 ponto
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-500">✓</span>
                  500 pontos = R$ 50 de desconto
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-500">✓</span>
                  Acúmulo por categoria gera serviços grátis
                </li>
              </ul>
            </Card>

            <Card className="p-4 text-center">
              <p className="text-sm text-slate-500">
                Dúvidas sobre seus pontos?
              </p>
              <p className="mt-1 font-medium text-gold-600">
                Fale com nossa atendente
              </p>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  const days = daysUntil(reward.expiresAt);

  return (
    <Card premium className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{reward.title}</h3>
          <p className="text-sm text-slate-500">{reward.description}</p>
        </div>
        <span className="text-2xl">✨</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-xs ${
            days <= 7 ? "text-red-500" : "text-slate-400"
          }`}
        >
          Válido até {formatDate(reward.expiresAt)}
          {days <= 7 && ` (${days} dias)`}
        </span>
        <span className="text-xs text-gold-600">Fale com atendente</span>
      </div>
    </Card>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-800">
            {appointment.services.map((s) => s.name).join(", ")}
          </p>
          <p className="text-sm text-slate-500">{formatDate(appointment.date)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-slate-800">
            {formatCurrency(appointment.total)}
          </p>
          <p className="text-xs text-gold-600">+{appointment.pointsEarned} pts</p>
        </div>
      </div>
      {appointment.hasReview && appointment.review && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <StarRating value={appointment.review.rating} readonly size="sm" />
          {appointment.review.comment && (
            <span className="text-xs text-slate-500">
              "{appointment.review.comment}"
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
