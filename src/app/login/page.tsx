"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, getStaffProfile } from "@/lib/supabase";

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

    try {
      const { user } = await signIn(email.trim().toLowerCase(), password);

      if (!user) {
        setError("Credenciais inválidas");
        setLoading(false);
        return;
      }

      const profile = await getStaffProfile(user.id);

      if (!profile || !profile.active) {
        setError("Usuário inativo ou sem permissão");
        setLoading(false);
        return;
      }

      const isAdmin = profile.roles?.code === "ADMIN";

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: profile.email,
          name: profile.full_name,
          role: isAdmin ? "admin" : "attendant",
          roleCode: profile.roles?.code,
          permissions: profile.roles?.permissions || [],
        })
      );

      router.push(isAdmin ? "/admin/dashboard" : "/attendant/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer login";
      if (errorMessage.includes("Invalid login")) {
        setError("Email ou senha incorretos");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
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

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Instituto Bedeschi
        </p>
      </div>
    </main>
  );
}
