"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function HomePage() {
  const [showQR, setShowQR] = useState(false);
  const accessUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/c/bedeschi` 
    : "https://bedeschi.com/c/bedeschi";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cinematic-gold p-4 sm:p-6 particles-bg">
      <div className="w-full max-w-md text-center animate-fade-up">
        {/* Logo */}
        <div className="mb-8 sm:mb-10 stagger-children">
          <div className="mx-auto mb-4 sm:mb-5 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/30 p-3 sm:p-4 animate-glow">
            <img
              src="/logo.svg"
              alt="Instituto Bedeschi"
              className="h-full w-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Instituto Bedeschi
          </h1>
          <p className="text-gold-400 text-base sm:text-lg font-light tracking-wide mt-1">Beauty Clinic</p>
          <div className="divider-gold w-24 sm:w-32 mx-auto mt-3 sm:mt-4 opacity-50"></div>
        </div>

        {/* Card Principal */}
        <div className="card-luxury glass-premium p-6 sm:p-8 animate-fade-scale">
          {!showQR ? (
            <>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                Programa de Fidelidade
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Acumule pontos a cada atendimento e ganhe recompensas exclusivas.
              </p>

              <div className="space-y-3">
                <Link
                  href="/c/bedeschi"
                  className="btn-premium block w-full text-center"
                >
                  Acessar Meus Pontos
                </Link>

                <button
                  onClick={() => setShowQR(true)}
                  className="w-full rounded-xl border-2 border-gold-300 bg-gold-50 px-6 py-3 text-gold-700 font-medium transition-all hover:bg-gold-100 hover:border-gold-400"
                >
                  📱 Ver QR Code de Acesso
                </button>

                <Link
                  href="/login"
                  className="block w-full rounded-xl border-2 border-slate-200 px-6 py-3 text-center text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Área do Colaborador
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                QR Code de Acesso
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Escaneie para acessar o programa de fidelidade
              </p>
              
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg inline-block mb-4">
                <QRCodeSVG 
                  value={accessUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#2d3548"
                />
              </div>
              
              <p className="text-xs text-slate-400 mb-4 break-all px-2">
                {accessUrl}
              </p>

              <button
                onClick={() => setShowQR(false)}
                className="text-gold-600 font-medium hover:underline"
              >
                ← Voltar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-xs text-slate-400">
          © 2026 Instituto Bedeschi. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
