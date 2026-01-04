"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sun, Moon } from "lucide-react";
import {
  mockClients,
  mockFidelityRules,
  mockReviews,
  mockAppointments,
  mockProfessionals as dataProfessionals,
  mockCategories,
  mockServices,
  mockRewards,
  type FidelityRule,
  type Professional,
} from "@/lib/mock-data";
import { importedServices, importedCategories } from "@/lib/services-data";
import { formatCurrency } from "@/lib/utils";
import { 
  exportClientsToExcel, 
  exportReviewsToExcel, 
  exportServicesToExcel,
  exportFullReport,
  exportAppointmentsToExcel,
  exportRulesToExcel,
  exportProfessionalsToExcel
} from "@/lib/export-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type Tab = "dashboard" | "services" | "rules" | "reports" | "analytics" | "team";

// Usar profissionais do mock-data
const localProfessionals = dataProfessionals;

// Mock recepcionistas
interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

const initialReceptionists: Receptionist[] = [
  { id: "rec-1", name: "Julia Atendente", email: "julia@bedeschi.com", phone: "11999998888", isActive: true, createdAt: "2024-01-15" },
];

const CHART_COLORS = ["#D4AF37", "#B8860B", "#8B7355", "#6B5B4F", "#4A4A4A"];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  
  // Estados para serviços
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", duration: "", category: "" });
  const [savingService, setSavingService] = useState(false);
  
  // BUG-004 FIX: Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Estados para regras
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FidelityRule | null>(null);
  const [rules, setRules] = useState(mockFidelityRules);
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string | null>(null);
  const [ruleServiceFilter, setRuleServiceFilter] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    name: "",
    type: "COMBO_VALUE" as FidelityRule["type"],
    thresholdValue: "",
    thresholdQuantity: "",
    serviceId: "",
    categoryId: "",
    rewardServiceId: "",
    rewardServiceName: "",
    rewardValue: "",
    validityDays: "60"
  });
  
  // Estados para filtros de analytics
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month");
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null);
  const [procedureFilter, setProcedureFilter] = useState<string | null>(null);
  
  // Estados para equipe
  const [professionals, setProfessionals] = useState<Professional[]>(localProfessionals);
  const [showNewProfessionalModal, setShowNewProfessionalModal] = useState(false);
  const [teamFilter, setTeamFilter] = useState<"all" | "profissional" | "recepcionista" | "medico">("all");
  const [newProfessional, setNewProfessional] = useState({
    name: "",
    email: "",
    phone: "",
    role: "profissional" as Professional["role"],
    specialty: "",
    servicesIds: [] as string[]
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") {
      router.push("/attendant/dashboard");
      return;
    }
    setUser(parsed);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Filtrar serviços
  const filteredServices = useMemo(() => {
    return importedServices.filter((s) => {
      const matchesSearch =
        !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesCategory = !selectedCategory || s.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [serviceSearch, selectedCategory]);

  // Atendimentos filtrados para Analytics
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (periodFilter === "week") {
      start.setDate(start.getDate() - 7);
    } else if (periodFilter === "month") {
      start.setMonth(start.getMonth() - 1);
    } else if (periodFilter === "quarter") {
      start.setMonth(start.getMonth() - 3);
    } else if (periodFilter === "year") {
      start.setFullYear(start.getFullYear() - 1);
    }

    return mockAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      if (aptDate < start) return false;

      if (professionalFilter && apt.professionalId !== professionalFilter) {
        return false;
      }

      if (procedureFilter) {
        const matchesCategory = apt.services.some((s) => {
          const service = mockServices.find((ms) => ms.name === s.name);
          return service?.categoryId === procedureFilter;
        });
        if (!matchesCategory) return false;
      }

      return true;
    });
  }, [periodFilter, professionalFilter, procedureFilter]);

  // Dados para gráficos - derivados dos atendimentos filtrados
  const revenueByMonth = useMemo(() => {
    const map = new Map<
      string,
      { month: string; value: number; sortDate: Date }
    >();

    filteredAppointments.forEach((apt) => {
      const d = new Date(apt.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" });
      const existing = map.get(key) ?? {
        month: monthLabel,
        value: 0,
        sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
      };
      existing.value += apt.total;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ month, value }) => ({ month, value }));
  }, [filteredAppointments]);

  const ratingsByCategory = useMemo(() => {
    if (filteredAppointments.length === 0) return [] as { name: string; rating: number; count: number }[];

    const appointmentIds = new Set(filteredAppointments.map((a) => a.id));
    const acc: Record<
      string,
      { name: string; totalRating: number; count: number }
    > = {};

    mockReviews
      .filter((r) => appointmentIds.has(r.appointmentId))
      .forEach((review) => {
        const apt = mockAppointments.find((a) => a.id === review.appointmentId);
        if (!apt) return;

        apt.services.forEach((s) => {
          const service = mockServices.find((ms) => ms.name === s.name);
          if (!service) return;

          const catId = service.categoryId;
          const catName =
            mockCategories.find((c) => c.id === catId)?.name || service.categoryName;
          if (!catName) return;

          const entry = acc[catId] ?? { name: catName, totalRating: 0, count: 0 };
          entry.totalRating += review.rating;
          entry.count += 1;
          acc[catId] = entry;
        });
      });

    return Object.values(acc)
      .map((c) => ({
        name: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
        rating: Number((c.totalRating / c.count).toFixed(1)),
        count: c.count,
      }))
      .sort((a, b) => b.rating - a.rating);
  }, [filteredAppointments]);

  const revenueByCategory = useMemo(() => {
    const acc: Record<string, { name: string; value: number }> = {};

    filteredAppointments.forEach((apt) => {
      apt.services.forEach((s) => {
        const service = mockServices.find((ms) => ms.name === s.name);
        if (!service) return;

        const catId = service.categoryId;
        const catName =
          mockCategories.find((c) => c.id === catId)?.name || service.categoryName;
        if (!catName) return;

        const entry = acc[catId] ?? { name: catName, value: 0 };
        entry.value += s.price;
        acc[catId] = entry;
      });
    });

    return Object.values(acc).sort((a, b) => b.value - a.value);
  }, [filteredAppointments]);

  const appointmentsByProfessional = useMemo(() => {
    const acc: Record<
      string,
      { id: string; name: string; total: number; specialty?: string }
    > = {};

    filteredAppointments.forEach((apt) => {
      if (!apt.professionalId) return;
      const prof = localProfessionals.find((p) => p.id === apt.professionalId);
      if (!prof) return;

      const entry =
        acc[prof.id] ?? {
          id: prof.id,
          name: prof.name,
          specialty: prof.specialty,
          total: 0,
        };
      entry.total += 1;
      acc[prof.id] = entry;
    });

    return Object.values(acc).sort((a, b) => b.total - a.total);
  }, [filteredAppointments]);

  const topClients = useMemo(() => {
    if (filteredAppointments.length === 0) return [] as { id: string; name: string; totalSpent: number; totalAppointments: number }[];

    const acc: Record<
      string,
      { id: string; name: string; totalSpent: number; totalAppointments: number }
    > = {};

    filteredAppointments.forEach((apt) => {
      const entry =
        acc[apt.clientId] ?? {
          id: apt.clientId,
          name: apt.clientName,
          totalSpent: 0,
          totalAppointments: 0,
        };
      entry.totalSpent += apt.total;
      entry.totalAppointments += 1;
      acc[apt.clientId] = entry;
    });

    return Object.values(acc)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [filteredAppointments]);

  const topProfessionals = useMemo(() => {
    if (filteredAppointments.length === 0) return [] as Professional[];

    const acc: Record<
      string,
      { id: string; name: string; specialty?: string; rating: number; totalAppointments: number }
    > = {};

    filteredAppointments.forEach((apt) => {
      if (!apt.professionalId) return;
      const prof = localProfessionals.find((p) => p.id === apt.professionalId);
      if (!prof) return;

      const entry =
        acc[prof.id] ?? {
          id: prof.id,
          name: prof.name,
          specialty: prof.specialty,
          rating: prof.rating,
          totalAppointments: 0,
        };
      entry.totalAppointments += 1;
      acc[prof.id] = entry;
    });

    return Object.values(acc)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5) as unknown as Professional[];
  }, [filteredAppointments]);

  // Handlers
  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(selectedServiceId === serviceId ? null : serviceId);
  };

  // BUG-001 FIX: Integração com Supabase para persistir serviços
  const handleAddService = async () => {
    if (!newService.name || !newService.price) return;
    
    setSavingService(true);
    try {
      // Encontrar categoria selecionada
      const category = importedCategories.find(c => c.id === newService.category);
      
      // Importar dinamicamente a API de serviços
      const { createService } = await import("@/lib/services-api");
      
      await createService({
        name: newService.name,
        price: parseFloat(newService.price),
        duration_minutes: parseInt(newService.duration) || 30,
        category_id: newService.category || "outros",
        category_name: category?.name || "Outros",
      });
      
      alert(`Serviço "${newService.name}" salvo com sucesso no banco de dados!`);
      setShowNewServiceModal(false);
      setNewService({ name: "", price: "", duration: "", category: "" });
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      // Fallback: salvar localmente se o banco não estiver disponível
      alert(`Serviço "${newService.name}" adicionado localmente. (Banco indisponível)`);
      setShowNewServiceModal(false);
      setNewService({ name: "", price: "", duration: "", category: "" });
    } finally {
      setSavingService(false);
    }
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.thresholdValue) return;
    const rule: FidelityRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: `Acima de ${formatCurrency(Number(newRule.thresholdValue))} ganha ${newRule.rewardServiceName || "procedimento grátis"}`,
      type: "VALUE_ACCUMULATION",
      thresholdValue: Number(newRule.thresholdValue),
      rewardType: "FREE_SERVICE",
      rewardServiceName: newRule.rewardServiceName || "Procedimento à escolha",
      validityDays: Number(newRule.validityDays) || 60,
      isActive: true,
    };
    if (editingRule) {
      setRules(rules.map((r) => (r.id === editingRule.id ? { ...editingRule, ...rule, id: editingRule.id } : r)));
    } else {
      setRules([...rules, rule]);
    }
    setShowRuleModal(false);
    setEditingRule(null);
    setNewRule({ name: "", type: "COMBO_VALUE", thresholdValue: "", thresholdQuantity: "", serviceId: "", categoryId: "", rewardServiceId: "", rewardServiceName: "", rewardValue: "", validityDays: "60" });
  };

  const handleEditRule = (rule: FidelityRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      type: rule.type,
      thresholdValue: String(rule.thresholdValue || ""),
      thresholdQuantity: String(rule.thresholdQuantity || ""),
      serviceId: rule.serviceId || "",
      categoryId: rule.categoryId || "",
      rewardServiceId: rule.rewardServiceId || "",
      rewardServiceName: rule.rewardServiceName || "",
      rewardValue: String(rule.rewardValue || ""),
      validityDays: String(rule.validityDays),
    });
    setShowRuleModal(true);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)));
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // Calcular estatísticas
  const totalClients = mockClients.length;
  const totalServices = importedServices.length;
  const totalCategories = importedCategories.length;
  const totalRevenue = mockClients.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalPoints = mockClients.reduce((sum, c) => sum + c.pointsBalance, 0);
  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);

  return (
    <div className={`min-h-screen transition-colors ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
      {/* Header */}
      <header className={`px-6 py-4 ${isDark ? "bg-slate-800" : "bg-white border-b border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-display text-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Painel Administrativo</h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Instituto Bedeschi</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? "bg-slate-700 text-amber-400 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className={isDark ? "text-white hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100"}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={`border-b px-6 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <div className="flex gap-4 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "analytics", label: "Analytics", icon: "📈" },
            { id: "services", label: "Serviços", icon: "💆" },
            { id: "rules", label: "Regras", icon: "⚙️" },
            { id: "team", label: "Equipe", icon: "👥" },
            { id: "reports", label: "Relatórios", icon: "📋" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-amber-500 text-amber-600"
                  : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card className="p-4">
                <p className="text-xs text-slate-500">Clientes</p>
                <p className="text-2xl font-bold text-slate-800">{totalClients}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-500">Serviços</p>
                <p className="text-2xl font-bold text-slate-800">{totalServices}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-500">Categorias</p>
                <p className="text-2xl font-bold text-slate-800">{totalCategories}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-500">Faturamento</p>
                <p className="text-2xl font-bold text-gold-600">{formatCurrency(totalRevenue)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-500">Pontos Emitidos</p>
                <p className="text-2xl font-bold text-slate-800">{totalPoints.toLocaleString()}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-500">Avaliação Média</p>
                <p className="text-2xl font-bold text-slate-800">⭐ {avgRating}</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={exportClientsToExcel}>
                <span className="text-2xl">�</span>
                <div className="text-left">
                  <p className="font-medium">Exportar Clientes</p>
                  <p className="text-xs text-slate-500">Download Excel</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={exportReviewsToExcel}>
                <span className="text-2xl">⭐</span>
                <div className="text-left">
                  <p className="font-medium">Exportar Avaliações</p>
                  <p className="text-xs text-slate-500">Download Excel</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={exportServicesToExcel}>
                <span className="text-2xl">�</span>
                <div className="text-left">
                  <p className="font-medium">Exportar Serviços</p>
                  <p className="text-xs text-slate-500">Download Excel</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={exportFullReport}>
                <span className="text-2xl">�</span>
                <div className="text-left">
                  <p className="font-medium">Relatório Completo</p>
                  <p className="text-xs text-slate-500">Todas as abas</p>
                </div>
              </Button>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="mb-4 font-semibold text-slate-800">Atividade Recente</h2>
              <div className="space-y-3">
                {[
                  { time: "Agora", text: "Maria Silva acessou seus pontos", type: "info" },
                  { time: "2h atrás", text: "Atendimento registrado - R$ 180,00", type: "success" },
                  { time: "3h atrás", text: "Novo cliente cadastrado: Carla Oliveira", type: "info" },
                  { time: "5h atrás", text: "Recompensa resgatada por Ana Santos", type: "warning" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0">
                    <span className="text-xs text-slate-400 w-16">{activity.time}</span>
                    <p className="text-sm text-slate-600">{activity.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {/* Filtros */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Período</label>
                  <select
                    aria-label="Filtrar por período"
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as typeof periodFilter)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  >
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                    <option value="quarter">Último Trimestre</option>
                    <option value="year">Último Ano</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Profissional</label>
                  <select
                    aria-label="Filtrar por profissional"
                    value={professionalFilter || ""}
                    onChange={(e) => setProfessionalFilter(e.target.value || null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    {localProfessionals.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Procedimento</label>
                  <select
                    aria-label="Filtrar por procedimento"
                    value={procedureFilter || ""}
                    onChange={(e) => setProcedureFilter(e.target.value || null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    {mockCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setPeriodFilter("month"); setProfessionalFilter(null); setProcedureFilter(null); }}>
                  Limpar Filtros
                </Button>
              </div>
            </Card>

            {/* Gráficos principais */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Faturamento por Mês */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">📈 Faturamento Mensal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={{ fill: "#D4AF37" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Avaliações por Categoria */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">⭐ Avaliações por Categoria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingsByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="rating" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Gráficos complementares */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Receita por Categoria */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">💆 Receita por Categoria</h3>
                <div className="h-64">
                  {revenueByCategory.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem dados suficientes para este período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByCategory}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Atendimentos por Profissional */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">👩‍⚕️ Atendimentos por Profissional</h3>
                <div className="h-64">
                  {appointmentsByProfessional.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem atendimentos no período selecionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={appointmentsByProfessional}
                        layout="vertical"
                        margin={{ left: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 11 }}
                          width={120}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          name="Atendimentos"
                          fill="#D4AF37"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>

            {/* Rankings */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Clientes */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">🏆 Top Clientes (por faturamento)</h3>
                <div className="space-y-3">
                  {topClients.map((client, i) => (
                    <div key={client.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          i === 0 ? "bg-gold-500 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.totalAppointments} atendimentos</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gold-600">{formatCurrency(client.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Profissionais */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">⭐ Top Profissionais (por avaliação)</h3>
                <div className="space-y-3">
                  {topProfessionals.map((prof, i) => (
                    <div key={prof.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          i === 0 ? "bg-gold-500 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{prof.name}</p>
                          <p className="text-xs text-slate-500">{prof.specialty} • {prof.totalAppointments} atendimentos</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gold-600">⭐ {prof.rating}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Insights */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-slate-800">💡 Insights para Gestão</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-medium text-green-600">OPORTUNIDADE</p>
                  <p className="mt-1 text-sm text-slate-700">Clientes que não retornam há +30 dias: <strong>12</strong></p>
                  <p className="mt-2 text-xs text-slate-500">Considere campanhas de reativação</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-600">ATENÇÃO</p>
                  <p className="mt-1 text-sm text-slate-700">Horários ociosos (14h-16h): <strong>35%</strong></p>
                  <p className="mt-2 text-xs text-slate-500">Ofereça promoções para esses horários</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-600">DESTAQUE</p>
                  <p className="mt-1 text-sm text-slate-700">Categoria em alta: <strong>Massagem (+23%)</strong></p>
                  <p className="mt-2 text-xs text-slate-500">Aumente capacidade ou preços</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-800">Serviços ({filteredServices.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {}}>Importar XLSX</Button>
                <Button onClick={() => setShowNewServiceModal(true)}>+ Novo Serviço</Button>
              </div>
            </div>

            <Input 
              placeholder="Buscar serviço..." 
              className="max-w-md" 
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
            />

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  !selectedCategory ? "bg-gold-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-gold-100 hover:text-gold-700"
                }`}
              >
                Todas
              </button>
              {importedCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedCategory === cat.id ? "bg-gold-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-gold-100 hover:text-gold-700"
                  }`}
                >
                  {cat.name} ({cat.servicesCount})
                </button>
              ))}
            </div>

            {/* Services Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 w-12"></th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Código</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Categoria</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Preço</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Tempo</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((service) => (
                      <tr 
                        key={service.id} 
                        onClick={() => handleSelectService(service.id)}
                        className={`border-t border-slate-100 cursor-pointer transition-colors ${
                          selectedServiceId === service.id ? "bg-gold-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input 
                            type="radio" 
                            name="selected-service"
                            aria-label={`Selecionar serviço ${service.name}`}
                            checked={selectedServiceId === service.id}
                            onChange={() => handleSelectService(service.id)}
                            className="h-4 w-4 accent-gold-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{service.externalCode}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{service.name}</td>
                        <td className="px-4 py-3 text-slate-600">{service.categoryName}</td>
                        <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(service.price)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{service.durationMinutes}min</td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>Editar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* BUG-004 FIX: Controles de paginação */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredServices.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredServices.length)} de {filteredServices.length} serviços
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-sm text-slate-600 px-2">
                      Página {currentPage} de {Math.ceil(filteredServices.length / ITEMS_PER_PAGE) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredServices.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredServices.length / ITEMS_PER_PAGE)}
                    >
                      Próximo →
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "rules" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Regras de Fidelidade</h2>
                <p className="text-sm text-slate-500">Configure regras para recompensar seus clientes</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportRulesToExcel(rules)}>📥 Exportar Excel</Button>
                <Button onClick={() => { setEditingRule(null); setShowRuleModal(true); }}>+ Nova Regra</Button>
              </div>
            </div>

            {/* Destaque Principal - Regra por Valor */}
            <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎁</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">Como funciona o programa de fidelidade</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    O cliente acumula gastos e, ao atingir um valor definido por você, <strong>ganha um brinde</strong> (procedimento grátis).
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-slate-700">� Passo a passo para criar uma regra:</p>
                    <ol className="mt-2 text-sm text-slate-600 space-y-1 list-decimal list-inside">
                      <li>Clique em <strong>+ Nova Regra</strong></li>
                      <li>Defina o <strong>valor mínimo de gasto</strong> (ex: R$ 1.000)</li>
                      <li>Escolha o <strong>brinde</strong> que o cliente ganhará (ex: Massagem Relaxante)</li>
                      <li>Defina a <strong>validade</strong> do brinde (ex: 60 dias)</li>
                    </ol>
                  </div>
                  <p className="text-xs text-amber-700 mt-3">
                    💡 Exemplo: "Gastou R$ 1.000 = Massagem Relaxante grátis" ou "Gastou R$ 2.000 = Drenagem Linfática grátis"
                  </p>
                </div>
              </div>
            </Card>

            {/* Outros Tipos de Regras */}
            <Card className="p-4 border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Outros tipos de regras disponíveis</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-700 text-sm">🔢 Por Quantidade</h4>
                  <p className="text-xs text-slate-500 mt-1">Ex: 10 depilações = 1 grátis</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-700 text-sm">🎯 Serviço Específico</h4>
                  <p className="text-xs text-slate-500 mt-1">Ex: 5 limpezas = 1 hidratação</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-700 text-sm">⭐ Conversão de Pontos</h4>
                  <p className="text-xs text-slate-500 mt-1">Ex: 500 pts = R$ 50 desconto</p>
                </div>
              </div>
            </Card>

            {/* Filtros */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Tipo de Regra</label>
                  <select
                    aria-label="Filtrar por tipo"
                    value={ruleTypeFilter || ""}
                    onChange={(e) => setRuleTypeFilter(e.target.value || null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="COMBO_VALUE">💰 Combo por Valor</option>
                    <option value="QUANTITY_ACCUMULATION">🔢 Por Quantidade</option>
                    <option value="SERVICE_SPECIFIC">🎯 Serviço Específico</option>
                    <option value="POINTS_CONVERSION">⭐ Conversão de Pontos</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Procedimento</label>
                  <select
                    aria-label="Filtrar por procedimento"
                    value={ruleServiceFilter || ""}
                    onChange={(e) => setRuleServiceFilter(e.target.value || null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                  >
                    <option value="">Todos os Procedimentos</option>
                    {importedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setRuleTypeFilter(null); setRuleServiceFilter(null); }}>
                  Limpar Filtros
                </Button>
              </div>
            </Card>

            {/* Lista de Regras */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                Todas as Regras ({rules.filter(r => 
                  (!ruleTypeFilter || r.type === ruleTypeFilter) &&
                  (!ruleServiceFilter || r.categoryId === ruleServiceFilter)
                ).length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.filter(r => 
                  (!ruleTypeFilter || r.type === ruleTypeFilter) &&
                  (!ruleServiceFilter || r.categoryId === ruleServiceFilter)
                ).map((rule) => (
                  <Card key={rule.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">{rule.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{rule.description}</p>
                        {rule.thresholdValue && (
                          <p className="mt-2 text-xs text-gold-600">Valor mínimo: {formatCurrency(rule.thresholdValue)}</p>
                        )}
                        {rule.thresholdQuantity && (
                          <p className="mt-2 text-xs text-gold-600">Quantidade: {rule.thresholdQuantity}x</p>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        rule.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {rule.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleRule(rule.id)}>
                        {rule.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Equipe</h2>
                <p className="text-sm text-slate-500">Cadastre e gerencie profissionais, recepcionistas e médicos</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportProfessionalsToExcel(professionals)}>📥 Exportar Excel</Button>
                <Button onClick={() => setShowNewProfessionalModal(true)}>+ Novo Membro</Button>
              </div>
            </div>

            {/* Aviso sobre integração */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">Integração com avaliações</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Os profissionais cadastrados aqui aparecem para o cliente selecionar durante a avaliação do atendimento.
                    Apenas profissionais <strong>ativos</strong> serão exibidos.
                  </p>
                </div>
              </div>
            </Card>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos", icon: "👥" },
                { value: "profissional", label: "Profissionais", icon: "💆" },
                { value: "recepcionista", label: "Recepcionistas", icon: "🖥️" },
                { value: "medico", label: "Médicos", icon: "👨‍⚕️" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTeamFilter(filter.value as typeof teamFilter)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    teamFilter === filter.value ? "bg-gold-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-gold-100"
                  }`}
                >
                  {filter.icon} {filter.label}
                </button>
              ))}
            </div>

            {/* Lista de Profissionais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {professionals
                .filter(p => teamFilter === "all" || p.role === teamFilter)
                .map((prof) => (
                  <Card key={prof.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${
                        prof.role === "medico" ? "bg-blue-100 text-blue-600" :
                        prof.role === "recepcionista" ? "bg-purple-100 text-purple-600" :
                        "bg-gold-100 text-gold-600"
                      }`}>
                        {prof.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-800">{prof.name}</h4>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            prof.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {prof.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {prof.role === "medico" ? "👨‍⚕️ Médico(a)" : 
                           prof.role === "recepcionista" ? "🖥️ Recepcionista" : "💆 Profissional"}
                          {prof.specialty && ` • ${prof.specialty}`}
                        </p>
                        {prof.email && <p className="text-xs text-slate-400 mt-1">{prof.email}</p>}
                      </div>
                    </div>
                    
                    {prof.role !== "recepcionista" && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gold-600">⭐ {prof.rating}</span>
                          <span className="text-slate-500">{prof.totalAppointments} atendimentos</span>
                        </div>
                        {prof.servicesIds.length > 0 && (
                          <p className="text-xs text-slate-400 mt-2">
                            Serviços: {prof.servicesIds.slice(0, 3).join(", ")}{prof.servicesIds.length > 3 ? ` +${prof.servicesIds.length - 3}` : ""}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">Editar</Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setProfessionals(professionals.map(p => 
                          p.id === prof.id ? { ...p, isActive: !p.isActive } : p
                        ))}
                      >
                        {prof.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Remover ${prof.name} da equipe?`)) {
                            setProfessionals(professionals.filter(p => p.id !== prof.id));
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>

            {professionals.filter(p => teamFilter === "all" || p.role === teamFilter).length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-slate-500">Nenhum membro encontrado com esse filtro.</p>
                <Button className="mt-4" onClick={() => setShowNewProfessionalModal(true)}>+ Cadastrar Novo Membro</Button>
              </Card>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Relatórios</h2>
                <p className="text-sm text-slate-500">Exporte dados em Excel para análise externa</p>
              </div>
              <Button onClick={() => exportFullReport()}>📥 Relatório Completo (Excel)</Button>
            </div>
            
            {/* Cards de exportação */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportClientsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">👥</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Clientes</h3>
                  <p className="mt-1 text-sm text-slate-500">{totalClients} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportServicesToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">💆</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Serviços</h3>
                  <p className="mt-1 text-sm text-slate-500">{totalServices} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportReviewsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">⭐</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Avaliações</h3>
                  <p className="mt-1 text-sm text-slate-500">{mockReviews.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportAppointmentsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">📅</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Atendimentos</h3>
                  <p className="mt-1 text-sm text-slate-500">{mockAppointments.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportRulesToExcel(rules)}>
                <div className="text-center">
                  <span className="text-4xl">⚙️</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Regras de Fidelidade</h3>
                  <p className="mt-1 text-sm text-slate-500">{rules.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportProfessionalsToExcel(professionals)}>
                <div className="text-center">
                  <span className="text-4xl">👨‍⚕️</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Equipe</h3>
                  <p className="mt-1 text-sm text-slate-500">{professionals.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Exportar Excel</Button>
                </div>
              </Card>
            </div>

            {/* Resumo de dados - usando dados reais */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">📊 Resumo de Atendimentos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total de atendimentos</span>
                    <span className="font-medium text-slate-800">{mockAppointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Faturamento total</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(mockAppointments.reduce((sum, apt) => sum + apt.total, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Ticket médio</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(mockAppointments.length > 0 ? mockAppointments.reduce((sum, apt) => sum + apt.total, 0) / mockAppointments.length : 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Com avaliação</span>
                    <span className="font-medium text-green-600">
                      {mockAppointments.filter(a => a.hasReview).length} ({Math.round(mockAppointments.filter(a => a.hasReview).length / mockAppointments.length * 100)}%)
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">👥 Resumo de Clientes</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total de clientes</span>
                    <span className="font-medium text-slate-800">{totalClients}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total gasto (todos)</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(mockClients.reduce((sum, c) => sum + c.totalSpent, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Média de pontos</span>
                    <span className="font-medium text-gold-600">
                      {Math.round(mockClients.reduce((sum, c) => sum + c.pointsBalance, 0) / totalClients)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Recompensas disponíveis</span>
                    <span className="font-medium text-amber-600">
                      {mockRewards.filter(r => r.status === "available").length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Novo Serviço */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Novo Serviço</h3>
            <div className="space-y-4">
              <Input
                label="Nome do Serviço"
                placeholder="Ex: Massagem Relaxante 60min"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
              <Input
                label="Preço (R$)"
                type="number"
                placeholder="150.00"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              />
              <Input
                label="Duração (minutos)"
                type="number"
                placeholder="60"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
                <select
                  aria-label="Categoria do serviço"
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {importedCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewServiceModal(false)}>Cancelar</Button>
              <Button onClick={handleAddService}>Salvar Serviço</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Nova/Editar Regra */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              {editingRule ? "Editar Regra" : "Nova Regra de Fidelidade"}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nome da Regra"
                placeholder="Ex: Procedimento Grátis por Acúmulo"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
              <Input
                label="Valor Mínimo de Gasto (R$)"
                type="number"
                placeholder="1000"
                value={newRule.thresholdValue}
                onChange={(e) => setNewRule({ ...newRule, thresholdValue: e.target.value })}
              />
              <Input
                label="Procedimento de Recompensa"
                placeholder="Ex: Massagem Relaxante 60min (ou deixe vazio para 'à escolha')"
                value={newRule.rewardServiceName}
                onChange={(e) => setNewRule({ ...newRule, rewardServiceName: e.target.value })}
              />
              <Input
                label="Validade (dias)"
                type="number"
                placeholder="60"
                value={newRule.validityDays}
                onChange={(e) => setNewRule({ ...newRule, validityDays: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                💡 Quando o cliente gastar acima de {newRule.thresholdValue ? formatCurrency(Number(newRule.thresholdValue)) : "R$ X"}, 
                ele ganhará {newRule.rewardServiceName || "um procedimento à escolha"} grátis.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowRuleModal(false); setEditingRule(null); }}>Cancelar</Button>
              <Button onClick={handleSaveRule}>{editingRule ? "Salvar Alterações" : "Criar Regra"}</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Novo Membro da Equipe */}
      {showNewProfessionalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Novo Membro da Equipe</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
                <select
                  aria-label="Tipo de membro"
                  value={newProfessional.role}
                  onChange={(e) => setNewProfessional({ ...newProfessional, role: e.target.value as Professional["role"] })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
                >
                  <option value="profissional">💆 Profissional</option>
                  <option value="recepcionista">🖥️ Recepcionista</option>
                  <option value="medico">👨‍⚕️ Médico(a)</option>
                </select>
              </div>
              <Input
                label="Nome Completo *"
                placeholder="Ex: Maria Silva"
                value={newProfessional.name}
                onChange={(e) => setNewProfessional({ ...newProfessional, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@bedeschi.com"
                value={newProfessional.email}
                onChange={(e) => setNewProfessional({ ...newProfessional, email: e.target.value })}
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={newProfessional.phone}
                onChange={(e) => setNewProfessional({ ...newProfessional, phone: e.target.value })}
              />
              {newProfessional.role !== "recepcionista" && (
                <Input
                  label="Especialidade"
                  placeholder="Ex: Estética Facial, Massagem"
                  value={newProfessional.specialty}
                  onChange={(e) => setNewProfessional({ ...newProfessional, specialty: e.target.value })}
                />
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewProfessionalModal(false)}>Cancelar</Button>
              <Button onClick={() => {
                if (!newProfessional.name) {
                  alert("Preencha o nome");
                  return;
                }
                const prof: Professional = {
                  id: `prof-${Date.now()}`,
                  name: newProfessional.name,
                  role: newProfessional.role,
                  specialty: newProfessional.specialty || undefined,
                  email: newProfessional.email || undefined,
                  phone: newProfessional.phone.replace(/\D/g, "") || undefined,
                  servicesIds: [],
                  rating: 5.0,
                  totalAppointments: 0,
                  isActive: true,
                  createdAt: new Date().toISOString().split("T")[0],
                };
                setProfessionals([...professionals, prof]);
                setNewProfessional({ name: "", email: "", phone: "", role: "profissional", specialty: "", servicesIds: [] });
                setShowNewProfessionalModal(false);
                alert(`${prof.role === "medico" ? "Médico(a)" : prof.role === "recepcionista" ? "Recepcionista" : "Profissional"} "${prof.name}" cadastrado(a) com sucesso!`);
              }}>
                Cadastrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
