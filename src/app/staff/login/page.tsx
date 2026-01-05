"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";

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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const lowerEmail = email.toLowerCase();

    let user: StaffUser | undefined = STAFF_CREDENTIALS[lowerEmail];

    if (!user && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("extraStaffCredentials");
        if (raw) {
          const extras = JSON.parse(raw) as Record<string, StaffUser>;
          user = extras[lowerEmail];
        }
      } catch {
        // ignore erro de parse e segue com credenciais padrão
      }
    }
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

    // Redireciona baseado no perfil
    if (user.role === "admin" || user.role === "qa") {
      router.push("/admin/dashboard");
    } else if (user.role === "recepcao") {
      router.push("/recepcao");
    }
  };

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-6 transition-colors ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-amber-50 via-white to-amber-50"
      }`}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="Instituto Bedeschi"
            className={`mx-auto mb-4 h-14 w-auto object-contain ${
              isDark
                ? "drop-shadow-[0_0_28px_rgba(251,191,36,0.5)]"
                : "drop-shadow-[0_0_22px_rgba(148,163,184,0.6)]"
            }`}
          />
          <h1
            className={`text-2xl font-semibold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Área do Colaborador
          </h1>
          <p
            className={`mt-2 text-sm ${
              isDark ? "text-amber-400" : "text-amber-600"
            }`}
          >
            Instituto Bedeschi
          </p>
        </div>

        <div
          className={`rounded-2xl p-8 ring-1 backdrop-blur-sm ${
            isDark
              ? "bg-slate-800/50 ring-slate-700/50"
              : "bg-white/80 ring-amber-100"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                  isDark
                    ? "border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500"
                    : "border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500"
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                  isDark
                    ? "border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500"
                    : "border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500"
                }`}
              />
            </div>

            {error && (
              <p
                className={`text-sm text-center ${
                  isDark ? "text-red-400" : "text-red-500"
                }`}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-medium text-slate-900 transition-all hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p
          className={`mt-8 text-center text-xs ${
            isDark ? "text-slate-500" : "text-slate-500"
          }`}
        >
          © 2026 Instituto Bedeschi
        </p>
      </div>
    </main>
  );
}
