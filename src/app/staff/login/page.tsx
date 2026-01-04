"use client";

import { useState } from "react";

type UserRole = "admin" | "recepcao" | "qa";

interface StaffUser {
  password: string;
  role: UserRole;
  name: string;
}

const STAFF_CREDENTIALS: Record<string, StaffUser> = {
  "raul.admin@bedeschi.com.br": { password: "Bed3sch1#Adm!n2026", role: "admin", name: "Raul Bedeschi" },
  "recepcao@bedeschi.com.br": { password: "R3c3pc@o#B3d2026!", role: "recepcao", name: "Recepção Bedeschi" },
  "qa.teste@bedeschi.com.br": { password: "QaT3st3#S3gur0!2026", role: "qa", name: "QA Tester" },
};

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState<{ name: string; role: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const user = STAFF_CREDENTIALS[email.toLowerCase()];
    if (!user || user.password !== password) {
      setError("Email ou senha incorretos");
      setLoading(false);
      return;
    }

    localStorage.setItem("staffSession", JSON.stringify({
      email,
      role: user.role,
      name: user.name,
      loggedAt: new Date().toISOString(),
    }));

    setLoggedUser({ name: user.name, role: user.role });
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("staffSession");
    setLoggedUser(null);
    setEmail("");
    setPassword("");
  };

  if (loggedUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 flex items-center justify-center ring-2 ring-amber-500/40">
            <svg className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Bem-vindo!</h1>
          <p className="text-amber-400 text-lg">{loggedUser.name}</p>
          <p className="text-slate-400 text-sm mt-1 uppercase">{loggedUser.role}</p>
          
          <div className="mt-8 p-6 rounded-2xl bg-slate-800/50 ring-1 ring-slate-700/50">
            <p className="text-slate-300 text-sm mb-4">Login realizado com sucesso!</p>
            <p className="text-slate-500 text-xs">Painel administrativo em desenvolvimento.</p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Área do Colaborador</h1>
          <p className="mt-2 text-slate-400">Instituto Bedeschi</p>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-8 ring-1 ring-slate-700/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-3 font-medium text-slate-900 transition-all hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          © 2026 Instituto Bedeschi
        </p>
      </div>
    </main>
  );
}
