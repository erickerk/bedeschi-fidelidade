"use client";

import { useState, lazy, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "@/lib/app-context";

const ClientDashboard = lazy(() => import("./client-dashboard"));

type Step = "login" | "pin" | "dashboard";
type Theme = "light" | "dark";

export default function ClientAccessPage() {
  const { getClientByPhone, clients } = useApp();
  const [step, setStep] = useState<Step>("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const isDark = theme === "dark";

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
      setError("Digite um celular válido");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const client = getClientByPhone(cleanedPhone);
    if (!client) {
      setError("Celular não cadastrado");
      setLoading(false);
      return;
    }

    setStep("pin");
    setLoading(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 4) {
      setError("Digite os 4 dígitos");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    const cleanedPhone = phone.replace(/\D/g, "");
    const client = getClientByPhone(cleanedPhone);
    
    if (!client || client.pin !== otp) {
      setError("PIN incorreto");
      setLoading(false);
      return;
    }
    
    setClientId(client.id);
    setStep("dashboard");
    setLoading(false);
  };

  const handleLogout = () => {
    setStep("login");
    setClientId(null);
    setPhone("");
    setOtp("");
    setError("");
  };

  if (step === "dashboard" && clientId) {
    return (
      <Suspense fallback={<LoadingScreen isDark={isDark} />}>
        <ClientDashboard clientId={clientId} onLogout={handleLogout} />
      </Suspense>
    );
  }

  return (
    <main 
      suppressHydrationWarning
      className={`relative h-screen overflow-hidden transition-colors duration-300 ${
        isDark 
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" 
          : "bg-gradient-to-br from-amber-50 via-white to-amber-50"
      }`}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-t from-amber-900/10 via-transparent to-transparent" : ""}`} />

      {/* Toggle Tema */}
      <button
        suppressHydrationWarning
        onClick={toggleTheme}
        className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-all ${
          isDark 
            ? "bg-slate-800 text-amber-400 hover:bg-slate-700" 
            : "bg-amber-100 text-amber-600 hover:bg-amber-200"
        }`}
        aria-label="Alternar tema"
      >
        {isDark ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Conteúdo */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        
        {/* Tela de Login Premium */}
        {step === "login" && (
          <div className="w-full max-w-md text-center">
            {/* Logo Premium - Maior e mais destaque */}
            <div className="mx-auto mb-8 relative">
              {/* Efeito de brilho circular */}
              <div className={`absolute inset-0 blur-3xl opacity-20 ${isDark ? "bg-amber-500" : "bg-amber-400"}`} />
              <img
                src="/Logo.png"
                alt="Instituto Bedeschi"
                className={`h-32 w-auto mx-auto object-contain relative z-10 ${
                  isDark
                    ? "drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                    : "drop-shadow-[0_0_35px_rgba(217,119,6,0.4)]"
                }`}
              />
            </div>
            
            {/* Título Premium */}
            <div className="mb-8">
              <h1 className={`text-2xl font-light mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                Instituto <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Bedeschi</span>
              </h1>
              <div className={`h-px w-32 mx-auto mb-3 ${isDark ? "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" : "bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"}`} />
              <p className={`text-xs uppercase tracking-[0.25em] font-light ${isDark ? "text-amber-400/70" : "text-amber-700/80"}`}>
                Programa de Fidelidade
              </p>
            </div>

            {/* QR Code Premium */}
            <div className="my-6 flex justify-center">
              <div className="relative">
                {/* Border dourado animado */}
                <div className={`absolute -inset-1 rounded-2xl blur-sm ${isDark ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500" : "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"} opacity-50`} />
                <div className={`relative rounded-2xl p-4 ${isDark ? "bg-slate-900 shadow-2xl" : "bg-white shadow-xl"}  border ${isDark ? "border-slate-800" : "border-amber-100"}`}>
                  <QRCodeSVG 
                    value="https://bedeschi-fidelidade-app.vercel.app"
                    size={120}
                    level="H"
                    includeMargin={false}
                    fgColor="#1e293b"
                    bgColor="#ffffff"
                  />
                </div>
              </div>
            </div>
            <p className={`text-xs mb-6 font-light ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              <span className="inline-block mr-2">📱</span>
              Escaneie o QR Code ou digite seu celular
            </p>

            {/* Form Login Premium */}
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  autoFocus
                  className={`w-full rounded-2xl border-2 px-6 py-4 text-center text-lg font-light focus:outline-none transition-all duration-300 ${
                    isDark 
                      ? "border-slate-700 bg-slate-800/60 backdrop-blur-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:bg-slate-800/80 focus:shadow-lg focus:shadow-amber-500/20" 
                      : "border-amber-200 bg-white/80 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:shadow-xl focus:shadow-amber-200/50"
                  }`}
                />
              </div>
              
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="relative w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 py-4 font-semibold text-white shadow-2xl shadow-amber-500/40 disabled:opacity-50 hover:shadow-amber-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Acessar Meus Pontos
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer Premium */}
            <div className={`mt-8 pt-6 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <p className={`text-xs font-light ${isDark ? "text-slate-600" : "text-slate-500"}`}>
                © 2026 Instituto Bedeschi • Todos os direitos reservados
              </p>
            </div>
          </div>
        )}

        {/* Tela de PIN */}
        {step === "pin" && (
          <div className="w-full max-w-xs text-center">
            <div className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${
              isDark ? "bg-amber-500/20" : "bg-amber-100"
            }`}>
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className={`text-xl font-light mb-1 ${isDark ? "text-white" : "text-slate-800"}`}>Digite seu PIN</h2>
            <p className={`text-xs mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Código de 4 dígitos</p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    aria-label={`PIN ${i + 1}`}
                    className={`h-12 w-12 rounded-lg border text-center text-xl focus:outline-none transition-colors ${
                      isDark 
                        ? "border-slate-700 bg-slate-800 text-white focus:border-amber-500" 
                        : "border-amber-200 bg-white text-slate-800 focus:border-amber-500 shadow-sm"
                    }`}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join("").slice(0, 4));
                      if (val && i < 3) {
                        (e.target.nextElementSibling as HTMLInputElement)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        ((e.target as HTMLElement).previousElementSibling as HTMLInputElement)?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button 
                type="submit" 
                disabled={loading || otp.length !== 4}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-semibold text-white disabled:opacity-50 hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                {loading ? "..." : "Entrar"}
              </button>
            </form>

            <button
              onClick={() => { setStep("login"); setOtp(""); setError(""); }}
              className={`mt-4 text-xs hover:underline ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>
      {/* Versão para debug */}
      <div className="absolute bottom-2 left-2 z-50">
        <span className={`text-[8px] opacity-30 ${isDark ? "text-white" : "text-slate-600"}`}>
          v1.1.1-CACHE-FIX
        </span>
      </div>
    </main>
  );
}

function LoadingScreen({ isDark = true }: { isDark?: boolean }) {
  return (
    <div className={`flex h-screen items-center justify-center ${isDark ? "bg-slate-950" : "bg-amber-50"}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    </div>
  );
}
