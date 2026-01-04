"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { importedServices, importedCategories } from "@/lib/mock-data";
import { 
  Sun, Moon, LogOut, Users, Calendar, Gift, Star, TrendingUp, Settings,
  Download, Plus, Edit2, Trash2, Search, Filter, ChevronDown, Check, X,
  BarChart3, PieChart, UserPlus, Award, FileSpreadsheet, Eye, EyeOff
} from "lucide-react";

type Tab = "dashboard" | "analytics" | "clientes" | "equipe" | "servicos" | "regras" | "relatorios";

interface StaffSession {
  email: string;
  role: string;
  name: string;
  loggedAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<"all" | "withRewards" | "vip">("all");
  const [professionalRoleFilter, setProfessionalRoleFilter] =
    useState<"all" | "medico" | "profissional" | "recepcionista">("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("all");
  const [analyticsProfessionalFilter, setAnalyticsProfessionalFilter] =
    useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const appData = useApp();
  const { 
    clients, appointments, rewards, reviews, professionals, rules,
    updateClient, addProfessional, updateProfessional, removeProfessional,
    getRules, toggleRule, addRule, updateRule
  } = appData;

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  useEffect(() => {
    const session = localStorage.getItem("staffSession");
    if (!session) {
      router.push("/staff/login");
      return;
    }
    const parsed = JSON.parse(session) as StaffSession;
    if (!["admin", "qa", "recepcao"].includes(parsed.role)) {
      router.push("/staff/login");
      return;
    }
    setUser(parsed);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("staffSession");
    router.push("/staff/login");
  };

  // Analytics calculados
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = appointments.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = appointments.filter((a) => {
      const d = new Date(a.date);
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    });

    const revenueThisMonth = thisMonth.reduce((sum, a) => sum + a.total, 0);
    const revenueLastMonth = lastMonth.reduce((sum, a) => sum + a.total, 0);
    const revenueGrowth =
      revenueLastMonth > 0
        ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
        : "N/A";

    const serviceCount: Record<string, number> = {};
    appointments.forEach((a) => {
      a.services.forEach((s) => {
        serviceCount[s.name] = (serviceCount[s.name] || 0) + 1;
      });
    });
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Performance da equipe baseada em atendimentos e avaliações ligadas ao atendimento
    const professionalPerformance = professionals
      .map((p) => {
        const profAppointments = appointments.filter((a) => a.professionalId === p.id);
        const profReviews = reviews.filter((r) => {
          const apt = appointments.find((a) => a.id === r.appointmentId);
          return apt?.professionalId === p.id;
        });
        const avgRating =
          profReviews.length > 0
            ? (
                profReviews.reduce((sum, r) => sum + r.rating, 0) /
                profReviews.length
              ).toFixed(1)
            : "N/A";

        return {
          ...p,
          appointmentsCount: profAppointments.length,
          revenue: profAppointments.reduce((sum, a) => sum + a.total, 0),
          avgRating,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
      revenueThisMonth,
      revenueGrowth,
      avgTicket:
        appointments.length > 0
          ? appointments.reduce((sum, a) => sum + a.total, 0) / appointments.length
          : 0,
      topServices,
      professionalPerformance,
      clientsThisMonth: clients.filter((c) => {
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      totalPoints: clients.reduce((sum, c) => sum + c.pointsBalance, 0),
      avgRating:
        reviews.length > 0
          ? (
              reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviews.length
            ).toFixed(1)
          : "N/A",
    };
  }, [clients, appointments, reviews, professionals]);

  // Exportar para CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (clientFilter === "withRewards") {
      return rewards.some(
        (r) => r.clientId === c.id && r.status === "available",
      );
    }

    if (clientFilter === "vip") {
      return c.totalSpent >= 3000 || c.pointsBalance >= 2000;
    }

    return true;
  });

  const filteredProfessionals = useMemo(
    () =>
      professionals.filter((p) =>
        professionalRoleFilter === "all" ? true : p.role === professionalRoleFilter,
      ),
    [professionals, professionalRoleFilter],
  );

  const filteredProfessionalPerformance = useMemo(
    () =>
      analytics.professionalPerformance.filter((p) =>
        analyticsProfessionalFilter === "all"
          ? true
          : p.id === analyticsProfessionalFilter,
      ),
    [analytics.professionalPerformance, analyticsProfessionalFilter],
  );

  const filteredAppointmentsByDate = useMemo(() => {
    if (!dateFrom && !dateTo) return appointments;

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return appointments.filter((a) => {
      const d = new Date(a.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [appointments, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "equipe", label: "Equipe", icon: UserPlus },
    { id: "servicos", label: "Serviços", icon: Gift },
    { id: "regras", label: "Regras", icon: Award },
    { id: "relatorios", label: "Relatórios", icon: FileSpreadsheet },
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
      {/* Header */}
      <header className={`px-6 py-4 ${isDark ? "bg-slate-800" : "bg-white border-b border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Painel Administrativo</h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Instituto Bedeschi</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDark ? "bg-slate-700 text-amber-400 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} aria-label="Alternar tema">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{user.name}</span>
            <button onClick={handleLogout} className={`p-2 rounded-lg transition-colors ${isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={`border-b px-6 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                tab === t.id
                  ? isDark ? "border-amber-500 text-amber-400" : "border-amber-500 text-amber-600"
                  : isDark ? "border-transparent text-slate-400 hover:text-slate-300" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {/* Dashboard */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total de Clientes" value={clients.length} icon={Users} isDark={isDark} />
              <StatCard title="Receita Total" value={formatCurrency(analytics.totalRevenue)} icon={TrendingUp} isDark={isDark} />
              <StatCard title="Recompensas Ativas" value={rewards.filter((r) => r.status === "available").length} icon={Gift} isDark={isDark} />
              <StatCard title="Avaliação Média" value={analytics.avgRating} icon={Star} isDark={isDark} />
            </div>
          </div>
        )}

        {/* Analytics */}
        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Receita do Mês</p>
                <p className={`text-3xl font-bold mt-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>{formatCurrency(analytics.revenueThisMonth)}</p>
                <p className={`text-sm mt-2 ${Number(analytics.revenueGrowth) > 0 ? "text-green-500" : "text-red-500"}`}>
                  {analytics.revenueGrowth !== "N/A" ? `${Number(analytics.revenueGrowth) > 0 ? "+" : ""}${analytics.revenueGrowth}% vs mês anterior` : "Sem dados anteriores"}
                </p>
              </div>
              <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ticket Médio</p>
                <p className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-800"}`}>{formatCurrency(analytics.avgTicket)}</p>
                <p className={`text-sm mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{appointments.length} atendimentos</p>
              </div>
              <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Novos Clientes (Mês)</p>
                <p className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-800"}`}>{analytics.clientsThisMonth}</p>
                <p className={`text-sm mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{analytics.totalPoints.toLocaleString()} pontos distribuídos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-lg font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Serviços Mais Populares
                  </h3>
                </div>
                <div className="space-y-3">
                  {analytics.topServices.map(([name, count], i) => {
                    const max = analytics.topServices[0]?.[1] || 1;
                    const ratio = max > 0 ? Number(count) / Number(max) : 0;
                    const widthClass =
                      ratio >= 0.95
                        ? "w-full"
                        : ratio >= 0.8
                        ? "w-11/12"
                        : ratio >= 0.6
                        ? "w-9/12"
                        : ratio >= 0.4
                        ? "w-7/12"
                        : ratio >= 0.2
                        ? "w-5/12"
                        : "w-3/12";

                    return (
                      <div key={name} className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold ${
                            isDark ? "text-amber-400" : "text-amber-600"
                          }`}
                        >
                          #{i + 1}
                        </span>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {name}
                          </p>
                          <div
                            className={`h-2 rounded-full mt-1 ${
                              isDark ? "bg-slate-700" : "bg-slate-200"
                            }`}
                          >
                            <div
                              className={`h-2 rounded-full bg-amber-500 ${widthClass}`}
                            />
                          </div>
                        </div>
                        <span
                          className={`text-sm ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-lg font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Performance da Equipe
                  </h3>
                  <select
                    value={analyticsProfessionalFilter}
                    onChange={(e) => setAnalyticsProfessionalFilter(e.target.value)}
                    aria-label="Filtrar performance por profissional"
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="all">Todos os profissionais</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  {filteredProfessionalPerformance.slice(0, 5).map((p) => (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                      <div>
                        <p className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{p.name}</p>
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.appointmentsCount} atendimentos</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>{formatCurrency(p.revenue)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.avgRating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clientes */}
        {tab === "clientes" && (
          <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Gestão de Clientes</h3>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                  <Search className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-transparent border-none outline-none text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
                  />
                </div>
                <button
                  onClick={() => exportToCSV(clients.map(c => ({ Nome: c.name, Telefone: c.phone, Email: c.email || "", Pontos: c.pointsBalance, TotalGasto: c.totalSpent, Visitas: c.totalAppointments })), "clientes")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value as typeof clientFilter)}
                  aria-label="Filtrar lista de clientes"
                  className={`rounded-lg border px-2 py-2 text-xs ${
                    isDark
                      ? "bg-slate-800 border-slate-600 text-slate-200"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">Todos os clientes</option>
                  <option value="withRewards">Com brinde disponível</option>
                  <option value="vip">VIP (alto gasto/pontos)</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? "text-slate-400" : "text-slate-500"}>
                    <th className="text-left p-3 text-sm font-medium">Nome</th>
                    <th className="text-left p-3 text-sm font-medium">Telefone</th>
                    <th className="text-left p-3 text-sm font-medium">Email</th>
                    <th className="text-left p-3 text-sm font-medium">Pontos</th>
                    <th className="text-left p-3 text-sm font-medium">Total Gasto</th>
                    <th className="text-left p-3 text-sm font-medium">Visitas</th>
                    <th className="text-left p-3 text-sm font-medium">Última Visita</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className={`border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                      <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{client.name}</td>
                      <td className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{client.phone}</td>
                      <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{client.email || "-"}</td>
                      <td className={`p-3 ${isDark ? "text-amber-400" : "text-amber-600"}`}>{client.pointsBalance.toLocaleString()}</td>
                      <td className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{formatCurrency(client.totalSpent)}</td>
                      <td className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{client.totalAppointments}</td>
                      <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{client.lastVisit ? formatDate(client.lastVisit) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Equipe */}
        {tab === "equipe" && (
          <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Gestão da Equipe</h3>
              <button
                onClick={() => setShowAddProfessional(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {professionals.length} profissionais cadastrados
              </p>
              <select
                value={professionalRoleFilter}
                onChange={(e) =>
                  setProfessionalRoleFilter(
                    e.target.value as typeof professionalRoleFilter,
                  )
                }
                aria-label="Filtrar equipe por papel"
                className={`rounded-lg border px-2 py-1 text-xs ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-slate-200"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <option value="all">Todos os papéis</option>
                <option value="medico">Médicos</option>
                <option value="profissional">Profissionais</option>
                <option value="recepcionista">Recepção</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfessionals.map((prof) => (
                <div key={prof.id} className={`p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{prof.name}</p>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{prof.specialty || prof.role}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${prof.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {prof.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{prof.rating}</span>
                    </div>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{prof.totalAppointments} atendimentos</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-600/30 flex gap-2">
                    <button className={`flex-1 py-2 rounded-lg text-sm ${isDark ? "bg-slate-600 text-white hover:bg-slate-500" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>
                      <Edit2 className="h-3 w-3 inline mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => updateProfessional({ ...prof, isActive: !prof.isActive })}
                      className={`flex-1 py-2 rounded-lg text-sm ${prof.isActive ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}
                    >
                      {prof.isActive ? <><EyeOff className="h-3 w-3 inline mr-1" /> Desativar</> : <><Eye className="h-3 w-3 inline mr-1" /> Ativar</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Serviços */}
        {tab === "servicos" && (
          <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                Catálogo de Serviços
              </h3>
              <div className="flex items-center gap-3">
                <p
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {importedServices.length} serviços em {importedCategories.length} categorias
                </p>
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  aria-label="Filtrar serviços por categoria"
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    isDark
                      ? "bg-slate-800 border-slate-600 text-slate-200"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">Todas as categorias</option>
                  {importedCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-6">
              {importedCategories
                .filter((cat) =>
                  serviceCategoryFilter === "all"
                    ? true
                    : cat.id === serviceCategoryFilter,
                )
                .map((cat) => {
                const catServices = importedServices.filter(s => s.categoryId === cat.id);
                return (
                  <div key={cat.id}>
                    <h4 className={`font-medium mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`}>{cat.name} ({catServices.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catServices.slice(0, 6).map((service) => (
                        <div key={service.id} className={`p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                          <p className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-800"}`}>{service.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}>{formatCurrency(service.price)}</span>
                            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{service.durationMinutes}min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regras */}
        {tab === "regras" && (
          <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Regras de Fidelidade</h3>
            </div>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className={`p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{rule.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${rule.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                          {rule.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{rule.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={`text-xs ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          Tipo: {rule.type.replace(/_/g, " ")}
                        </span>
                        {rule.categoryName && (
                          <span
                            className={`text-xs ${
                              isDark ? "text-amber-400" : "text-amber-600"
                            }`}
                          >
                            Categoria: {rule.categoryName}
                          </span>
                        )}
                        {(rule.thresholdValue !== undefined ||
                          rule.thresholdQuantity !== undefined) && (
                          <span
                            className={`text-xs ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {rule.type === "VALUE_ACCUMULATION" ||
                            rule.type === "COMBO_VALUE"
                              ? `Meta: ${formatCurrency(rule.thresholdValue ?? 0)}`
                              : rule.type === "QUANTITY_ACCUMULATION"
                              ? `Meta: ${(rule.thresholdQuantity ?? 0).toString()} sessões`
                              : rule.type === "POINTS_CONVERSION"
                              ? `Meta: ${Number(
                                  rule.thresholdValue ?? 0
                                ).toLocaleString()} pontos`
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.isActive
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : isDark ? "bg-slate-600 text-slate-400 hover:bg-slate-500" : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                      }`}
                    >
                      {rule.isActive ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relatórios */}
        {tab === "relatorios" && (
          <div className="space-y-6">
            <div className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}>
                Exportar Relatórios
              </h3>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Período (para agendamentos e resumo)
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Data inicial do filtro de relatórios"
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                />
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>até</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Data final do filtro de relatórios"
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                />
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className={`rounded-lg px-3 py-1 text-xs ${
                      isDark
                        ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Limpar período
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => exportToCSV(clients.map(c => ({ Nome: c.name, Telefone: c.phone, Email: c.email || "", Pontos: c.pointsBalance, TotalGasto: c.totalSpent, Visitas: c.totalAppointments, UltimaVisita: c.lastVisit || "" })), "clientes")}
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Users className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Clientes</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Lista completa com pontos e gastos</p>
                </button>

                <button
                  onClick={() =>
                    exportToCSV(
                      filteredAppointmentsByDate.map((a) => ({
                        Cliente: a.clientName,
                        Data: a.date,
                        Hora: a.time,
                        Servicos: a.services.map((s) => s.name).join("; "),
                        Total: a.total,
                        Pontos: a.pointsEarned,
                        Status: a.status,
                      })),
                      "agendamentos",
                    )
                  }
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Calendar className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Agendamentos</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Histórico de atendimentos</p>
                </button>

                <button
                  onClick={() => exportToCSV(rewards.map(r => ({ Titulo: r.title, Cliente: clients.find(c => c.id === r.clientId)?.name || "", Status: r.status, Expira: r.expiresAt })), "recompensas")}
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Gift className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Recompensas</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Brindes e status de resgate</p>
                </button>

                <button
                  onClick={() => exportToCSV(reviews.map(r => ({ Cliente: clients.find(c => c.id === r.clientId)?.name || "", Nota: r.rating, Comentario: r.comment || "", Data: r.createdAt })), "avaliacoes")}
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Star className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Avaliações</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Feedback dos clientes</p>
                </button>

                <button
                  onClick={() => exportToCSV(professionals.map(p => ({ Nome: p.name, Especialidade: p.specialty || "", Avaliacao: p.rating, Atendimentos: p.totalAppointments, Status: p.isActive ? "Ativo" : "Inativo" })), "equipe")}
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <UserPlus className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Equipe</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Profissionais e performance</p>
                </button>

                <button
                  onClick={() => {
                    const report = {
                      GeradoEm: new Date().toISOString(),
                      TotalClientes: clients.length,
                      ReceitaTotal: analytics.totalRevenue,
                      ReceitaPeriodo: filteredAppointmentsByDate.reduce(
                        (sum, a) => sum + a.total,
                        0,
                      ),
                      TicketMedio: analytics.avgTicket,
                      AvaliacaoMedia: analytics.avgRating,
                      TotalAtendimentos: filteredAppointmentsByDate.length,
                      RecompensasAtivas: rewards.filter(
                        (r) => r.status === "available",
                      ).length,
                    };
                    exportToCSV([report], "resumo_executivo");
                  }}
                  className={`p-4 rounded-xl text-left ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <BarChart3 className={`h-8 w-8 mb-3 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Resumo Executivo</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>KPIs e métricas principais</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isDark }: { title: string; value: string | number; icon: React.ElementType; isDark: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-800"}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700" : "bg-amber-50"}`}>
          <Icon className={`h-6 w-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
        </div>
      </div>
    </div>
  );
}
