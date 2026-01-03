"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockClients, mockFidelityRules, mockReviews, mockAppointments, type FidelityRule } from "@/lib/mock-data";
import { importedServices, importedCategories } from "@/lib/services-data";
import { formatCurrency } from "@/lib/utils";
import { 
  exportClientsToExcel, 
  exportReviewsToExcel, 
  exportServicesToExcel,
  exportFullReport,
  exportAppointmentsToExcel
} from "@/lib/export-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type Tab = "dashboard" | "services" | "rules" | "reports" | "analytics" | "team";

// Mock profissionais
const mockProfessionals = [
  { id: "prof-1", name: "Dra. Amanda", specialty: "Estética Facial", rating: 4.9, appointments: 145 },
  { id: "prof-2", name: "Carla Santos", specialty: "Massagem", rating: 4.8, appointments: 128 },
  { id: "prof-3", name: "Juliana Lima", specialty: "Depilação", rating: 4.7, appointments: 98 },
  { id: "prof-4", name: "Patricia Alves", specialty: "Tratamento Corporal", rating: 4.6, appointments: 87 },
];

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
  
  // Estados para serviços
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", duration: "", category: "" });
  
  // Estados para regras
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FidelityRule | null>(null);
  const [rules, setRules] = useState(mockFidelityRules);
  const [newRule, setNewRule] = useState({ name: "", thresholdValue: "", rewardServiceName: "", validityDays: "60" });
  
  // Estados para filtros de analytics
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month");
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null);
  const [procedureFilter, setProcedureFilter] = useState<string | null>(null);
  
  // Estados para equipe (recepcionistas)
  const [receptionists, setReceptionists] = useState<Receptionist[]>(initialReceptionists);
  const [showNewReceptionistModal, setShowNewReceptionistModal] = useState(false);
  const [newReceptionist, setNewReceptionist] = useState({ name: "", email: "", phone: "" });

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
      const matchesSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesCategory = !selectedCategory || s.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [serviceSearch, selectedCategory]);

  // Dados para gráficos
  const ratingsByCategory = useMemo(() => {
    return importedCategories.slice(0, 5).map((cat) => ({
      name: cat.name.length > 12 ? cat.name.slice(0, 12) + "..." : cat.name,
      rating: (4 + Math.random() * 0.9).toFixed(1),
      count: Math.floor(Math.random() * 50) + 10,
    }));
  }, []);

  const revenueByMonth = useMemo(() => {
    return [
      { month: "Set", value: 12500 },
      { month: "Out", value: 15800 },
      { month: "Nov", value: 18200 },
      { month: "Dez", value: 22400 },
      { month: "Jan", value: 19800 },
    ];
  }, []);

  const topClients = useMemo(() => {
    return [...mockClients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, []);

  const topProfessionals = useMemo(() => {
    return [...mockProfessionals].sort((a, b) => b.rating - a.rating);
  }, []);

  // Handlers
  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(selectedServiceId === serviceId ? null : serviceId);
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;
    // Em produção, salvaria no banco
    alert(`Serviço "${newService.name}" adicionado com sucesso!`);
    setShowNewServiceModal(false);
    setNewService({ name: "", price: "", duration: "", category: "" });
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
    setNewRule({ name: "", thresholdValue: "", rewardServiceName: "", validityDays: "60" });
  };

  const handleEditRule = (rule: FidelityRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      thresholdValue: String(rule.thresholdValue || ""),
      rewardServiceName: rule.rewardServiceName || "",
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
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Painel Administrativo</h1>
            <p className="text-sm text-slate-400">Instituto Bedeschi</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-slate-700">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-slate-200 bg-white px-6">
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
                  ? "border-gold-500 text-gold-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
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
                    {mockProfessionals.map((p) => (
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
                    {importedCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setPeriodFilter("month"); setProfessionalFilter(null); setProcedureFilter(null); }}>
                  Limpar Filtros
                </Button>
              </div>
            </Card>

            {/* Gráficos */}
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
                          <p className="text-xs text-slate-500">{prof.specialty} • {prof.appointments} atendimentos</p>
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
                    {filteredServices.slice(0, 20).map((service) => (
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
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                Mostrando {Math.min(20, filteredServices.length)} de {filteredServices.length} serviços
              </div>
            </Card>
          </div>
        )}

        {tab === "rules" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Regras de Fidelidade</h2>
                <p className="text-sm text-slate-500">Configure regras para recompensar seus clientes</p>
              </div>
              <Button onClick={() => { setEditingRule(null); setNewRule({ name: "", thresholdValue: "", rewardServiceName: "", validityDays: "60" }); setShowRuleModal(true); }}>
                + Nova Regra
              </Button>
            </div>

            {/* Como Funciona */}
            <Card className="p-6 bg-gradient-to-r from-slate-50 to-gold-50 border-gold-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📖 Como Funciona o Programa de Fidelidade</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl mb-2">💰</div>
                  <h4 className="font-semibold text-slate-700">1. Cliente Gasta</h4>
                  <p className="text-sm text-slate-500 mt-1">A cada R$ 1 gasto, o cliente acumula 1 ponto</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-semibold text-slate-700">2. Atinge a Meta</h4>
                  <p className="text-sm text-slate-500 mt-1">Quando atingir o valor configurado, ganha recompensa</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl mb-2">🎁</div>
                  <h4 className="font-semibold text-slate-700">3. Ganha Procedimento</h4>
                  <p className="text-sm text-slate-500 mt-1">Procedimento grátis ou desconto especial</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gold-100 rounded-lg">
                <p className="text-sm text-gold-800">
                  <strong>💡 Exemplo:</strong> Se você configurar "Gastou R$ 1.000 = Massagem Grátis", 
                  quando o cliente acumular R$ 1.000 em atendimentos, ele automaticamente ganha direito a uma massagem grátis.
                </p>
              </div>
            </Card>

            {/* Configuração Rápida */}
            <Card className="border-2 border-gold-300 bg-gold-50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 text-xs font-medium text-gold-700 bg-gold-200 rounded-full mb-2">💎 REGRA PRINCIPAL</span>
                  <h3 className="text-lg font-semibold text-slate-800">Procedimento Grátis por Acúmulo de Valor</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Configure quanto o cliente precisa gastar para ganhar um procedimento grátis.
                  </p>
                  
                  {/* Mostrar regra atual se existir */}
                  {rules.find(r => r.type === "VALUE_ACCUMULATION") && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gold-200">
                      <p className="text-sm font-medium text-slate-700">
                        ✅ Regra ativa: Gastou <span className="text-gold-600 font-bold">{formatCurrency(rules.find(r => r.type === "VALUE_ACCUMULATION")?.thresholdValue || 0)}</span> → 
                        Ganha <span className="text-green-600 font-bold">{rules.find(r => r.type === "VALUE_ACCUMULATION")?.rewardServiceName || "Procedimento à escolha"}</span>
                      </p>
                    </div>
                  )}
                </div>
                <Button onClick={() => {
                  const mainRule = rules.find(r => r.type === "VALUE_ACCUMULATION");
                  if (mainRule) handleEditRule(mainRule);
                  else {
                    setEditingRule(null);
                    setNewRule({ name: "Procedimento Grátis por Acúmulo", thresholdValue: "1000", rewardServiceName: "", validityDays: "60" });
                    setShowRuleModal(true);
                  }
                }}>
                  {rules.find(r => r.type === "VALUE_ACCUMULATION") ? "Editar Regra" : "Configurar Agora"}
                </Button>
              </div>
            </Card>

            {/* Lista de Regras */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Todas as Regras ({rules.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map((rule) => (
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Equipe</h2>
                <p className="text-sm text-slate-500">Gerencie recepcionistas e profissionais</p>
              </div>
              <Button onClick={() => setShowNewReceptionistModal(true)}>+ Nova Recepcionista</Button>
            </div>

            {/* Recepcionistas */}
            <div>
              <h3 className="mb-3 font-semibold text-slate-700">Recepcionistas ({receptionists.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {receptionists.map((rec) => (
                  <Card key={rec.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">{rec.name}</h4>
                        <p className="text-sm text-slate-500">{rec.email}</p>
                        <p className="text-xs text-slate-400">{rec.phone}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        rec.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {rec.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReceptionists(receptionists.map(r => 
                          r.id === rec.id ? { ...r, isActive: !r.isActive } : r
                        ))}
                      >
                        {rec.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Profissionais */}
            <div>
              <h3 className="mb-3 font-semibold text-slate-700">Profissionais ({mockProfessionals.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {mockProfessionals.map((prof) => (
                  <Card key={prof.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600 font-semibold">
                        {prof.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{prof.name}</h4>
                        <p className="text-xs text-slate-500">{prof.specialty}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gold-600">⭐ {prof.rating}</span>
                      <span className="text-slate-500">{prof.appointments} atendimentos</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportClientsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">👥</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Clientes</h3>
                  <p className="mt-1 text-sm text-slate-500">{totalClients} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Exportar Excel
                  </Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportServicesToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">💆</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Serviços</h3>
                  <p className="mt-1 text-sm text-slate-500">{totalServices} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Exportar Excel
                  </Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportReviewsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">⭐</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Avaliações</h3>
                  <p className="mt-1 text-sm text-slate-500">{mockReviews.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Exportar Excel
                  </Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportAppointmentsToExcel()}>
                <div className="text-center">
                  <span className="text-4xl">📅</span>
                  <h3 className="mt-3 font-semibold text-slate-800">Atendimentos</h3>
                  <p className="mt-1 text-sm text-slate-500">{mockAppointments.length} registros</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Exportar Excel
                  </Button>
                </div>
              </Card>
            </div>

            {/* Resumo de dados */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">📊 Faturamento por Categoria</h3>
                <div className="space-y-3">
                  {importedCategories.slice(0, 5).map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{cat.name}</span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(Math.random() * 10000)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-slate-800">🎁 Recompensas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Emitidas (mês)</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Resgatadas (mês)</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expiradas (mês)</span>
                    <span className="font-medium text-red-500">2</span>
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

      {/* Modal: Nova Recepcionista */}
      {showNewReceptionistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Nova Recepcionista</h3>
            <div className="space-y-4">
              <Input
                label="Nome Completo *"
                placeholder="Ex: Maria Silva"
                value={newReceptionist.name}
                onChange={(e) => setNewReceptionist({ ...newReceptionist, name: e.target.value })}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="email@bedeschi.com"
                value={newReceptionist.email}
                onChange={(e) => setNewReceptionist({ ...newReceptionist, email: e.target.value })}
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={newReceptionist.phone}
                onChange={(e) => setNewReceptionist({ ...newReceptionist, phone: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                💡 A recepcionista poderá fazer login usando o email cadastrado com qualquer senha no modo demo.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewReceptionistModal(false)}>Cancelar</Button>
              <Button onClick={() => {
                if (!newReceptionist.name || !newReceptionist.email) {
                  alert("Preencha nome e email");
                  return;
                }
                const rec: Receptionist = {
                  id: `rec-${Date.now()}`,
                  name: newReceptionist.name,
                  email: newReceptionist.email,
                  phone: newReceptionist.phone.replace(/\D/g, ""),
                  isActive: true,
                  createdAt: new Date().toISOString().split("T")[0],
                };
                setReceptionists([...receptionists, rec]);
                setNewReceptionist({ name: "", email: "", phone: "" });
                setShowNewReceptionistModal(false);
                alert(`Recepcionista "${rec.name}" cadastrada com sucesso!`);
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
