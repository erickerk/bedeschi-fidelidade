"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserRole = "admin" | "attendant";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    // Credenciais de teste
    const credentials: Record<string, { password: string; role: UserRole; name: string }> = {
      "admin@bedeschi.com": { password: "admin123", role: "admin", name: "Dr. Bedeschi" },
      "recepcao@bedeschi.com": { password: "recepcao123", role: "attendant", name: "Julia Atendente" },
    };

    const user = credentials[email.toLowerCase()];
    if (!user || user.password !== password) {
      setError("Email ou senha incorretos");
      setLoading(false);
      return;
    }

    // Salva sessão no localStorage
    localStorage.setItem("staffSession", JSON.stringify({
      email,
      role: user.role,
      name: user.name,
      loggedAt: new Date().toISOString(),
    }));

    // Redireciona baseado no role
    if (user.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/attendant/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Área do Colaborador</h1>
          <p className="mt-2 text-slate-400">Instituto Bedeschi</p>
        </div>

        {/* Card de Login */}
        <div className="rounded-2xl bg-slate-800/50 p-8 ring-1 ring-slate-700/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
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

          {/* Info de teste */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">Credenciais de teste:</p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between bg-slate-700/30 rounded px-3 py-2">
                <span>Admin:</span>
                <span className="text-slate-300">admin@bedeschi.com / admin123</span>
              </div>
              <div className="flex justify-between bg-slate-700/30 rounded px-3 py-2">
                <span>Recepção:</span>
                <span className="text-slate-300">recepcao@bedeschi.com / recepcao123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          © 2026 Instituto Bedeschi
        </p>
      </div>
    </main>
  );
}
