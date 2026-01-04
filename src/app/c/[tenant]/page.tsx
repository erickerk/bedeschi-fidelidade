"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/input";
import { getClientByPhone, validateClientPin } from "@/lib/mock-data";
import { isValidPhone, cleanPhone } from "@/lib/utils";
import ClientDashboard from "./client-dashboard";

type Step = "phone" | "pin" | "dashboard";

export default function ClientAccessPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanedPhone = cleanPhone(phone);
    if (!isValidPhone(cleanedPhone)) {
      setError("Digite um celular válido");
      return;
    }

    setLoading(true);

    // Simula delay de rede
    await new Promise((r) => setTimeout(r, 800));

    const client = getClientByPhone(cleanedPhone);
    if (!client) {
      setError("Celular não cadastrado. Fale com nossa atendente.");
      setLoading(false);
      return;
    }

    // Vai para tela de PIN
    setStep("pin");
    setLoading(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 4) {
      setError("Digite seu código de 4 dígitos");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const cleanedPhone = cleanPhone(phone);
    const client = validateClientPin(cleanedPhone, otp);
    
    if (!client) {
      setError("Código incorreto. Tente novamente.");
      setLoading(false);
      return;
    }
    
    setClientId(client.id);
    setStep("dashboard");
    setLoading(false);
  };

  if (step === "dashboard" && clientId) {
    return <ClientDashboard clientId={clientId} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cinematic-gold p-6 particles-bg">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="mb-10 text-center stagger-children">
          <div className="mx-auto mb-5 h-24 w-24 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/30 p-4 animate-glow">
            <img
              src="/logo.svg"
              alt="Instituto Bedeschi"
              className="h-full w-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Instituto Bedeschi
          </h1>
          <p className="text-gold-400 text-lg font-light tracking-wide mt-1">Beauty Clinic</p>
          <div className="divider-gold w-32 mx-auto mt-4 opacity-50"></div>
          <span className="badge-premium mt-3">✨ Programa Exclusivo</span>
        </div>

        {/* Card */}
        <div className="card-luxury glass-premium p-8 animate-fade-scale">
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-800">
                  Bem-vinda! 👋
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Digite seu celular para acessar seus pontos
                </p>
              </div>

              <PhoneInput
                value={phone}
                onChange={setPhone}
                error={error}
                autoFocus
              />

              <button 
                type="submit" 
                disabled={loading}
                className="btn-premium w-full text-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Verificando...
                  </span>
                ) : "Acessar Meus Pontos"}
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Primeira vez?{" "}
                <span className="text-gold-600 font-medium cursor-pointer hover:underline">
                  Fale com nossa atendente
                </span>
              </p>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-800">
                  Digite seu Código PIN 🔐
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seu código de 4 dígitos para acessar
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  (Padrão: últimos 4 dígitos do celular)
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    aria-label={`Dígito ${i + 1} do PIN`}
                    placeholder="•"
                    className="h-14 w-14 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/20 placeholder:text-slate-300"
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join("").slice(0, 4));

                      if (val && i < 3) {
                        const next = e.target.nextElementSibling as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        prev?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}

              <button 
                type="submit" 
                disabled={loading || otp.length !== 4}
                className="btn-premium w-full text-center disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>

              <div className="flex justify-center gap-4 text-sm">
                <button
                  type="button"
                  className="text-gold-600 hover:underline"
                  onClick={() => {
                    alert("Fale com a recepção para redefinir seu PIN");
                  }}
                >
                  Esqueci meu PIN
                </button>
                <button
                  type="button"
                  className="text-slate-500 hover:underline"
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                >
                  Voltar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">
          © 2026 Instituto Bedeschi. Seus dados estão protegidos.
        </p>
      </div>
    </main>
  );
}
