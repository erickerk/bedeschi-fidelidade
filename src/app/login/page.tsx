"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
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

    // Mock login - aceita qualquer credencial para demo
    // Em produção, validaria com Supabase Auth
    if (email.includes("@") && password.length >= 4) {
      // Simula role baseado no email
      const isAdmin = email.toLowerCase().includes("admin");
      localStorage.setItem("user", JSON.stringify({
        id: "user-1",
        email,
        name: isAdmin ? "Raul" : "Julia Atendente",
        role: isAdmin ? "admin" : "attendant",
      }));
      
      router.push(isAdmin ? "/admin/dashboard" : "/attendant/dashboard");
    } else {
      setError("Credenciais inválidas");
    }
    
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-premium p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gold-500/20 p-3">
            <img
              src="/logo.svg"
              alt="Instituto Bedeschi"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Instituto Bedeschi
          </h1>
          <p className="text-gold-400">Área do Colaborador</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-premium">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Acesse sua conta de colaborador
              </p>
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Entrar
            </Button>

            <p className="text-center text-xs text-slate-400">
              Esqueceu a senha?{" "}
              <span className="text-gold-600 cursor-pointer hover:underline">
                Fale com o administrador
              </span>
            </p>
          </form>
        </div>

        {/* Demo Info */}
        <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-slate-300">
          <p className="font-medium text-gold-400 mb-2">🧪 Modo Demo</p>
          <p>Use qualquer email/senha para testar:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• <code>admin@bedeschi.com</code> → Painel Admin</li>
            <li>• <code>julia@bedeschi.com</code> → Painel Atendente</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Instituto Bedeschi
        </p>
      </div>
    </main>
  );
}
