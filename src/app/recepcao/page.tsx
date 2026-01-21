"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/app-context";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { type Service } from "@/lib/services-api";
import {
  Sun,
  Moon,
  LogOut,
  Users,
  Calendar,
  Gift,
  Plus,
  Search,
  Send,
  Check,
  X,
  User,
  Phone,
  Mail,
  Clock,
  Star,
  ChevronDown,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  CalendarDays,
  Filter,
} from "lucide-react";

interface StaffSession {
  email: string;
  role: string;
  name: string;
  loggedAt: string;
}

type Tab = "atendimentos" | "clientes" | "bonus";

export default function RecepcaoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("atendimentos");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filtro de cliente específico para bônus
  const [bonusClientFilter, setBonusClientFilter] = useState<string>("");
  const [bonusClientSearchTerm, setBonusClientSearchTerm] =
    useState<string>("");
  const [showBonusClientDetails, setShowBonusClientDetails] = useState(false);

  // Filtro de data para atendimentos
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showAllDates, setShowAllDates] = useState(false);

  // Modal de histórico do cliente
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);

  // Estados para modais
  const [showNewClient, setShowNewClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Formulário novo cliente
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
  });

  // Formulário novo atendimento
  const [newAppointment, setNewAppointment] = useState({
    clientId: "",
    professionalId: "",
    selectedServices: [] as string[],
    date: "",
    time: "09:00",
  });

  const {
    clients,
    appointments,
    rewards,
    professionals,
    services, // Usando services do contexto global
    addClient,
    addAppointment,
    getClientRewards,
    redeemReward,
    updateClient,
  } = useApp();

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Marcar como mounted e definir data atual
  useEffect(() => {
    setMounted(true);
    setNewAppointment((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  // Verificar autenticação
  useEffect(() => {
    const session = localStorage.getItem("staffSession");
    if (!session) {
      router.push("/staff/login");
      return;
    }
    const parsed = JSON.parse(session) as StaffSession;
    if (parsed.role !== "recepcao") {
      router.push("/staff/login");
      return;
    }
    setUser(parsed);
    setLoading(false);
  }, [router]);

  // Profissionais vêm do contexto global (AppContext já carrega do Supabase)

  const handleLogout = () => {
    localStorage.removeItem("staffSession");
    router.push("/staff/login");
  };

  // Filtrar clientes (por nome ou telefone)
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true; // Mostrar todos se não houver termo de busca
    
    // Busca por nome
    const nameMatch = c.name.toLowerCase().includes(term);
    
    // Busca por telefone (apenas se o termo contiver dígitos)
    const searchDigits = searchTerm.replace(/\D/g, "");
    const phoneMatch = searchDigits.length > 0 && 
      c.phone.replace(/\D/g, "").includes(searchDigits);
    
    return nameMatch || phoneMatch;
  });

  // Filtrar clientes para bônus (por nome ou telefone)
  const filteredBonusClients = clients.filter((c) => {
    const searchTerm = bonusClientSearchTerm.toLowerCase().trim();
    if (!searchTerm) return false;
    
    // Busca por nome
    const nameMatch = c.name.toLowerCase().includes(searchTerm);
    
    // Busca por telefone (apenas se o termo contiver dígitos)
    const searchDigits = bonusClientSearchTerm.replace(/\D/g, "");
    const phoneMatch = searchDigits.length > 0 && 
      c.phone.replace(/\D/g, "").includes(searchDigits);
    
    return nameMatch || phoneMatch;
  });

  // Formatar input de telefone em tempo real
  const handlePhoneInput = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length === 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  // Cadastrar novo cliente
  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) {
      alert("Preencha nome e telefone");
      return;
    }

    const cleanPhone = newClient.phone.replace(/\D/g, "");
    // Gerar PIN de 4 dígitos
    const generatedPin = String(Math.floor(1000 + Math.random() * 9000));

    const client = {
      id: crypto.randomUUID(),
      name: newClient.name,
      phone: cleanPhone,
      email: newClient.email || "",
      birthDate: newClient.birthDate || undefined,
      pin: generatedPin,
      pointsBalance: 0,
      totalSpent: 0,
      totalAppointments: 0,
      createdAt: new Date().toISOString(),
    };

    addClient(client);
    alert(
      `Cliente cadastrado com sucesso!\n\nPIN de acesso: ${generatedPin}\n\nAnote este PIN para o cliente.`,
    );
    setNewClient({ name: "", phone: "", email: "", birthDate: "" });
    setShowNewClient(false);
  };

  // Abrir modal de edição
  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setShowEditClient(true);
  };

  // Salvar edição de cliente
  const handleSaveEditClient = () => {
    if (!editingClient.name || !editingClient.phone) {
      alert("Preencha nome e telefone");
      return;
    }

    const cleanPhone = editingClient.phone.replace(/\D/g, "");
    updateClient({
      ...editingClient,
      phone: cleanPhone,
      birthDate: editingClient.birthDate || undefined,
    });

    setShowEditClient(false);
    setEditingClient(null);
  };

  // Registrar atendimento
  const handleAddAppointment = async () => {
    console.log("📝 Iniciando criação de atendimento...", newAppointment);

    // Validações detalhadas
    if (!newAppointment.clientId) {
      alert("❌ Selecione um cliente");
      return;
    }

    if (!newAppointment.professionalId) {
      alert("❌ Selecione um profissional");
      return;
    }

    if (newAppointment.selectedServices.length === 0) {
      alert("❌ Selecione pelo menos um procedimento");
      return;
    }

    if (!newAppointment.date) {
      alert("❌ Selecione a data do atendimento");
      return;
    }

    const client = clients.find((c) => c.id === newAppointment.clientId);
    if (!client) {
      alert("❌ Cliente não encontrado");
      return;
    }

    // VERIFICAÇÃO DE DUPLICIDADE: Verificar se já existe atendimento igual
    const selectedServicesNames = services
      .filter((s) => newAppointment.selectedServices.includes(s.id))
      .map((s) => s.name)
      .sort()
      .join(",");

    const duplicateAppointment = appointments.find((apt) => {
      if (apt.clientId !== newAppointment.clientId) return false;
      if (apt.date !== newAppointment.date) return false;
      
      // Verificar se os serviços são iguais
      const aptServicesNames = apt.services.map((s) => s.name).sort().join(",");
      return aptServicesNames === selectedServicesNames;
    });

    if (duplicateAppointment) {
      const confirmDuplicate = window.confirm(
        `⚠️ ATENÇÃO: Já existe um atendimento registrado para:\n\n` +
        `Cliente: ${client.name}\n` +
        `Data: ${formatDate(newAppointment.date)}\n` +
        `Procedimentos: ${selectedServicesNames.replace(/,/g, ", ")}\n\n` +
        `Deseja registrar mesmo assim?`
      );
      
      if (!confirmDuplicate) {
        return;
      }
    }

    const selectedServicesData = services.filter((s) =>
      newAppointment.selectedServices.includes(s.id),
    );

    if (selectedServicesData.length === 0) {
      alert("❌ Serviços selecionados não encontrados");
      return;
    }

    const total = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
    const professional = professionals.find(
      (p) => p.id === newAppointment.professionalId,
    );

    if (!professional) {
      alert("❌ Profissional não encontrado");
      return;
    }

    const appointment = {
      id: crypto.randomUUID(),
      clientId: newAppointment.clientId,
      clientName: client.name,
      professionalId: newAppointment.professionalId,
      professionalName: professional.name,
      date: newAppointment.date,
      time: newAppointment.time,
      services: selectedServicesData.map((s) => ({
        name: s.name,
        price: s.price,
      })),
      total,
      pointsEarned: Math.floor(total),
      status: "completed" as const,
      hasReview: false,
    };

    console.log("✅ Atendimento criado:", appointment);

    try {
      await addAppointment(appointment);

      alert(
        `✅ Atendimento registrado com sucesso!\n\nCliente: ${client.name}\nProfissional: ${professional.name}\nTotal: R$ ${total.toFixed(2)}\nPontos ganhos: ${Math.floor(total)}`,
      );

      // Resetar formulário COMPLETAMENTE
      setNewAppointment({
        clientId: "",
        professionalId: "",
        selectedServices: [],
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
      });
      setClientSearchTerm("");
      setProcedureSearchTerm("");
      setShowClientDropdown(false);
      setShowProcedureDropdown(false);
      setShowNewAppointment(false);

      console.log("✅ Formulário resetado e modal fechado");
    } catch (error) {
      console.error("❌ Erro ao salvar atendimento:", error);
      alert("❌ Erro ao salvar atendimento. Veja o console para detalhes.");
    }
  };

  // Abrir modal de resgate
  const handleOpenRedeem = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedRewardId(null);
    setShowRedeemModal(true);
  };

  // Confirmar resgate
  const handleConfirmRedeem = () => {
    if (!selectedRewardId) return;
    redeemReward(selectedRewardId);
    setShowRedeemModal(false);
    setSelectedClientId(null);
    setSelectedRewardId(null);
  };

  // Enviar WhatsApp
  const handleSendWhatsApp = (client: (typeof clients)[0]) => {
    const digits = client.phone.replace(/\D/g, "");
    const phoneWithCountry = digits.startsWith("55") ? digits : `55${digits}`;
    const appUrl = `${window.location.origin}/c/bedeschi`;

    const message = [
      `Olá ${client.name.split(" ")[0]}, tudo bem?`,
      "",
      "Bem-vindo(a) ao programa de fidelidade do Instituto Bedeschi!",
      `Acesse seus pontos e benefícios em: ${appUrl}`,
      "",
      "Seus dados de acesso:",
      `Telefone: ${client.phone}`,
      `PIN: ${client.pin}`,
      "",
      "Qualquer dúvida, estamos à disposição!",
    ].join("\n");

    window.open(
      `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  // Obter recompensas disponíveis do cliente
  const getAvailableRewards = (clientId: string) => {
    return getClientRewards(clientId).filter((r) => r.status === "available");
  };

  // Obter atendimentos do cliente
  const getClientAppointmentsHistory = (clientId: string) => {
    return appointments
      .filter((apt) => apt.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Filtrar atendimentos por data
  const filteredAppointments = showAllDates
    ? [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : appointments
        .filter((apt) => apt.date === dateFilter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Navegar entre datas
  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(dateFilter);
    if (direction === "prev") {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    setDateFilter(current.toISOString().split("T")[0]);
  };

  // Formatar data para exibição amigável
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    
    return date.toLocaleDateString("pt-BR", { 
      weekday: "short", 
      day: "2-digit", 
      month: "short" 
    });
  };

  // Abrir histórico do cliente
  const handleOpenClientHistory = (clientId: string) => {
    setHistoryClientId(clientId);
    setShowClientHistory(true);
  };

  // Mostrar loading enquanto não está montado ou carregando para evitar erro de hidratação
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3" />
          <p className="text-amber-400/70 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100"}`}
    >
      {/* Header */}
      <header
        className={`border-b ${isDark ? "bg-slate-800 border-slate-700" : "bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm"}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="Instituto Bedeschi"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <div>
              <h1
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Recepção
              </h1>
              <p
                className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
              >
                {user?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDark ? "bg-slate-700 text-amber-400" : "bg-amber-100 text-amber-600"}`}
              aria-label="Alternar tema"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav
        className={`border-b ${isDark ? "border-slate-700" : "border-amber-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[
            {
              id: "atendimentos" as Tab,
              label: "Atendimentos",
              icon: Calendar,
            },
            { id: "clientes" as Tab, label: "Clientes", icon: Users },
            { id: "bonus" as Tab, label: "Bônus", icon: Gift },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? isDark
                    ? "border-amber-500 text-amber-400"
                    : "border-amber-500 text-amber-600"
                  : isDark
                    ? "border-transparent text-slate-400 hover:text-slate-300"
                    : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Aba Atendimentos */}
        {tab === "atendimentos" && (
          <div className="space-y-6">
            {/* Header com botão de novo atendimento */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2
                  className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  📋 Atendimentos
                </h2>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Registre e acompanhe todos os atendimentos
                </p>
              </div>
              <button
                onClick={() => setShowNewAppointment(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 font-semibold shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Novo Atendimento
              </button>
            </div>

            {/* Filtro de Data - Simples e Intuitivo */}
            <div
              className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-white shadow-md border border-slate-100"}`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Navegação por Data */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateDate("prev")}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                    title="Dia anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isDark ? "bg-slate-700" : "bg-amber-50"
                  }`}>
                    <CalendarDays className={`h-5 w-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setShowAllDates(false);
                      }}
                      title="Selecionar data"
                      aria-label="Selecionar data para filtrar atendimentos"
                      className={`bg-transparent border-none outline-none font-medium ${
                        isDark ? "text-white" : "text-slate-800"
                      }`}
                    />
                    <span className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      ({formatDateDisplay(dateFilter)})
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigateDate("next")}
                    disabled={dateFilter >= new Date().toISOString().split("T")[0]}
                    className={`p-2 rounded-lg transition-colors ${
                      dateFilter >= new Date().toISOString().split("T")[0]
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${
                      isDark 
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                    title="Próximo dia"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Botões de Atalho */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDateFilter(new Date().toISOString().split("T")[0]);
                      setShowAllDates(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilter === new Date().toISOString().split("T")[0] && !showAllDates
                        ? isDark
                          ? "bg-amber-500 text-slate-900"
                          : "bg-amber-500 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📅 Hoje
                  </button>
                  <button
                    onClick={() => setShowAllDates(!showAllDates)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showAllDates
                        ? isDark
                          ? "bg-amber-500 text-slate-900"
                          : "bg-amber-500 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📊 Ver Todos
                  </button>
                </div>
              </div>

              {/* Resumo do dia */}
              <div className={`mt-4 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {showAllDates 
                      ? `📈 Total: ${filteredAppointments.length} atendimento(s)` 
                      : `📈 ${formatDateDisplay(dateFilter)}: ${filteredAppointments.length} atendimento(s)`}
                  </p>
                  <p className={`text-sm font-semibold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    💰 {formatCurrency(filteredAppointments.reduce((sum, apt) => sum + apt.total, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Atendimentos */}
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white shadow-md border border-slate-100"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                <History className="h-5 w-5" />
                {showAllDates ? "Todos os Atendimentos" : `Atendimentos - ${formatDateDisplay(dateFilter)}`}
              </h3>
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const client = clients.find((c) => c.id === apt.clientId);
                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-xl transition-all hover:scale-[1.01] ${
                        isDark 
                          ? "bg-slate-700/50 hover:bg-slate-700" 
                          : "bg-gradient-to-r from-slate-50 to-amber-50/30 hover:from-slate-100 hover:to-amber-50/50 border border-slate-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-800"}`}
                            >
                              {apt.clientName || client?.name || "Cliente"}
                            </p>
                            {client && (
                              <button
                                onClick={() => handleOpenClientHistory(client.id)}
                                className={`p-1 rounded transition-colors ${
                                  isDark 
                                    ? "hover:bg-slate-600 text-slate-400 hover:text-amber-400" 
                                    : "hover:bg-amber-100 text-slate-400 hover:text-amber-600"
                                }`}
                                title="Ver histórico completo"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-sm mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            🩺 {apt.services.map((s) => s.name).join(" • ")}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                              👨‍⚕️ {apt.professionalName || "Profissional"}
                            </span>
                            <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                              🕐 {apt.time || "—"}
                            </span>
                            {showAllDates && (
                              <span className={`px-2 py-0.5 rounded ${isDark ? "bg-slate-600 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                                📅 {formatDate(apt.date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${isDark ? "text-amber-400" : "text-amber-600"}`}
                          >
                            {formatCurrency(apt.total)}
                          </p>
                          <p
                            className={`text-xs px-2 py-1 rounded-full inline-block ${
                              isDark 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            +{apt.pointsEarned} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredAppointments.length === 0 && (
                  <div className={`text-center py-12 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-1">Nenhum atendimento</p>
                    <p className="text-sm">
                      {showAllDates 
                        ? "Ainda não há atendimentos registrados" 
                        : `Nenhum atendimento em ${formatDateDisplay(dateFilter)}`}
                    </p>
                    <button
                      onClick={() => setShowNewAppointment(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                    >
                      + Novo Atendimento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aba Clientes */}
        {tab === "clientes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Clientes
              </h2>
              {/* Botão de Novo Cliente removido - Recepção só pode editar clientes existentes */}
            </div>

            {/* Busca */}
            <div
              className={`relative ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-amber-200 text-slate-800"
                }`}
              />
            </div>

            {/* Lista de clientes */}
            <div
              className={`rounded-xl overflow-hidden ${isDark ? "bg-slate-800" : "bg-white shadow-md border border-slate-200"}`}
            >
              <table className="w-full">
                <thead>
                  <tr className={isDark ? "text-slate-400" : "text-slate-500"}>
                    <th className="text-left p-4 text-sm font-medium">
                      Cliente
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Telefone
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Nascimento
                    </th>
                    <th className="text-left p-4 text-sm font-medium">PIN</th>
                    <th className="text-left p-4 text-sm font-medium">
                      Pontos
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Visitas
                    </th>
                    <th className="text-right p-4 text-sm font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const availableRewards = getAvailableRewards(client.id);
                    return (
                      <tr
                        key={client.id}
                        className={`border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
                      >
                        <td className="p-4">
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {client.name}
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {client.email || "-"}
                          </p>
                        </td>
                        <td
                          className={`p-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {formatPhone(client.phone)}
                        </td>
                        <td className="p-4">
                          <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {client.birthDate ? formatDate(client.birthDate) : "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}
                          >
                            🔑 {client.pin}
                          </span>
                        </td>
                        <td
                          className={`p-4 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                        >
                          {client.pointsBalance}
                        </td>
                        <td
                          className={`p-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {client.totalAppointments}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => handleEditClient(client)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                isDark
                                  ? "bg-blue-500/10 text-blue-300"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                              title="Editar dados do cliente"
                            >
                              <Edit2 className="h-3 w-3 inline mr-1" />
                              Editar
                            </button>
                            {availableRewards.length > 0 && (
                              <button
                                onClick={() => handleOpenRedeem(client.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                  isDark
                                    ? "bg-amber-500/10 text-amber-300"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                <Gift className="h-3 w-3 inline mr-1" />
                                Bônus ({availableRewards.length})
                              </button>
                            )}
                            <button
                              onClick={() => handleSendWhatsApp(client)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                isDark
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              <Send className="h-3 w-3 inline mr-1" />
                              WhatsApp
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aba Bônus */}
        {tab === "bonus" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Gestão de Bônus
              </h2>
            </div>

            {/* Filtro de Cliente */}
            <div
              className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <label
                className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                🔍 Buscar Cliente Específico
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <input
                    type="text"
                    placeholder="Digite nome ou telefone do cliente..."
                    value={bonusClientSearchTerm}
                    onChange={(e) => setBonusClientSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                {bonusClientSearchTerm && filteredBonusClients.length > 0 && (
                  <div
                    className={`border rounded-lg max-h-64 overflow-y-auto ${
                      isDark
                        ? "border-slate-600 bg-slate-700"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {filteredBonusClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setBonusClientFilter(c.id);
                          setBonusClientSearchTerm("");
                          setShowBonusClientDetails(true);
                        }}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-opacity-80 transition-colors ${
                          isDark
                            ? "border-slate-600 hover:bg-slate-600"
                            : "border-slate-100 hover:bg-slate-100"
                        }`}
                      >
                        <p
                          className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {c.name}
                        </p>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {formatPhone(c.phone)} • {c.pointsBalance} pts
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {bonusClientSearchTerm && filteredBonusClients.length === 0 && (
                  <p
                    className={`text-sm text-center py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Nenhum cliente encontrado
                  </p>
                )}
                {bonusClientFilter && (
                  <button
                    onClick={() => {
                      setBonusClientFilter("");
                      setBonusClientSearchTerm("");
                      setShowBonusClientDetails(false);
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium ${
                      isDark
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Limpar Seleção
                  </button>
                )}
              </div>
            </div>

            {/* Detalhes do Cliente Selecionado */}
            {showBonusClientDetails &&
              bonusClientFilter &&
              (() => {
                const selectedClient = clients.find(
                  (c) => c.id === bonusClientFilter,
                );
                if (!selectedClient) return null;

                const availableRewards = getClientRewards(bonusClientFilter);
                const allRewards = rewards.filter(
                  (r) => r.clientId === bonusClientFilter,
                );
                const redeemedRewards = allRewards.filter(
                  (r) => r.status === "redeemed",
                );

                // Calcular progresso para próximo bônus (baseado em R$ 300 = 10% desconto)
                const proximoBonus = 300;
                const gastoAtual = selectedClient.totalSpent;
                const progressoAtual = gastoAtual % proximoBonus;
                const faltaParaProximo = proximoBonus - progressoAtual;
                const percentualProgresso =
                  (progressoAtual / proximoBonus) * 100;

                return (
                  <div
                    className={`rounded-xl p-6 ${isDark ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20" : "bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200"}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3
                          className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {selectedClient.name}
                        </h3>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {formatPhone(selectedClient.phone)} •{" "}
                          {selectedClient.email || "Sem email"}
                        </p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}
                      >
                        <p
                          className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}
                        >
                          {selectedClient.pointsBalance}
                        </p>
                        <p
                          className={`text-xs ${isDark ? "text-amber-300" : "text-amber-600"}`}
                        >
                          pontos
                        </p>
                      </div>
                    </div>

                    {/* Grid de Informações */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
                      >
                        <p
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Total Gasto
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {formatCurrency(selectedClient.totalSpent)}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
                      >
                        <p
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Atendimentos
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {selectedClient.totalAppointments}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}
                      >
                        <p
                          className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          Bônus Disponíveis
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          {availableRewards.length}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}
                      >
                        <p
                          className={`text-xs ${isDark ? "text-blue-400" : "text-blue-600"}`}
                        >
                          Bônus Utilizados
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-blue-300" : "text-blue-700"}`}
                        >
                          {redeemedRewards.length}
                        </p>
                      </div>
                    </div>

                    {/* Progresso para Próximo Bônus */}
                    <div
                      className={`p-4 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p
                          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          🎯 Progresso para Próximo Bônus (10% OFF)
                        </p>
                        <p
                          className={`text-sm font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                        >
                          {percentualProgresso.toFixed(0)}%
                        </p>
                      </div>
                      <div
                        className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                        aria-label={`Progresso: ${percentualProgresso.toFixed(0)}%`}
                      >
                        <div
                          className={`h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300`}
                          {...({
                            style: { width: `${Math.min(percentualProgresso, 100)}%` },
                          } as any)}
                        />
                      </div>
                      <p
                        className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Faltam{" "}
                        <span className="font-bold">
                          {formatCurrency(faltaParaProximo)}
                        </span>{" "}
                        para ganhar 10% de desconto
                      </p>
                    </div>

                    {/* Bônus Disponíveis */}
                    {availableRewards.length > 0 && (
                      <div className="mt-6">
                        <h4
                          className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          🎁 Bônus Disponíveis
                        </h4>
                        <div className="space-y-2">
                          {availableRewards.map((reward) => (
                            <div
                              key={reward.id}
                              className={`p-3 rounded-lg flex items-center justify-between ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}
                            >
                              <div>
                                <p
                                  className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-800"}`}
                                >
                                  {reward.title}
                                </p>
                                <p
                                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  Válido até {formatDate(reward.expiresAt)}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleOpenRedeem(selectedClient.id)
                                }
                                className="px-3 py-1 rounded bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600"
                              >
                                Resgatar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bônus Utilizados */}
                    {redeemedRewards.length > 0 && (
                      <div className="mt-6">
                        <h4
                          className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          ✅ Bônus Já Utilizados
                        </h4>
                        <div className="space-y-2">
                          {redeemedRewards.map((reward) => (
                            <div
                              key={reward.id}
                              className={`p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p
                                    className={`font-medium text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                  >
                                    {reward.title}
                                  </p>
                                  <p
                                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                  >
                                    {reward.description}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}
                                >
                                  Resgatado
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico de Atendimentos */}
                    <div className="mt-6">
                      <h4
                        className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
                      >
                        <History className="h-4 w-4" />
                        Histórico de Atendimentos ({getClientAppointmentsHistory(selectedClient.id).length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getClientAppointmentsHistory(selectedClient.id).length > 0 ? (
                          getClientAppointmentsHistory(selectedClient.id).map((apt) => (
                            <div
                              key={apt.id}
                              className={`p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p
                                    className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-800"}`}
                                  >
                                    {apt.services.map((s) => s.name).join(" • ")}
                                  </p>
                                  <p
                                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    📅 {formatDate(apt.date)} • 🕐 {apt.time || "—"} • 👨‍⚕️ {apt.professionalName}
                                  </p>
                                </div>
                                <div className="text-right ml-3">
                                  <p
                                    className={`font-bold text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                  >
                                    {formatCurrency(apt.total)}
                                  </p>
                                  <p
                                    className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                                  >
                                    +{apt.pointsEarned} pts
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className={`text-sm text-center py-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Nenhum atendimento registrado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Clientes com Bônus Disponível
              </h3>
              <div className="space-y-3">
                {clients
                  .filter((c) => getAvailableRewards(c.id).length > 0)
                  .map((client) => {
                    const availableRewards = getAvailableRewards(client.id);
                    return (
                      <div
                        key={client.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <div>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {client.name}
                          </p>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {formatPhone(client.phone)} •{" "}
                            {availableRewards.length} bônus disponível(is)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenRedeem(client.id)}
                            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 font-medium text-sm"
                          >
                            Usar Bônus
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(client)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm ${
                              isDark
                                ? "bg-slate-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            Avisar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {clients.filter((c) => getAvailableRewards(c.id).length > 0)
                  .length === 0 && (
                  <p
                    className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Nenhum cliente com bônus disponível
                  </p>
                )}
              </div>
            </div>

            {/* Bônus resgatados recentemente */}
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Bônus Resgatados
              </h3>
              <div className="space-y-3">
                {rewards
                  .filter((r) => r.status === "redeemed")
                  .map((reward) => {
                    const client = clients.find(
                      (c) => c.id === reward.clientId,
                    );
                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <div>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {client?.name || "Cliente"}
                          </p>
                          <p
                            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {reward.title}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isDark
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          Resgatado
                        </span>
                      </div>
                    );
                  })}
                {rewards.filter((r) => r.status === "redeemed").length ===
                  0 && (
                  <p
                    className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Nenhum bônus resgatado ainda
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Novo Cliente */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Novo Cliente
              </h3>
              <button
                onClick={() => setShowNewClient(false)}
                className={isDark ? "text-slate-400" : "text-slate-500"}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="new-client-name"
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Nome completo *
                </label>
                <input
                  id="new-client-name"
                  type="text"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  placeholder="Nome completo do cliente"
                  title="Nome completo do cliente"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      phone: handlePhoneInput(e.target.value),
                    })
                  }
                  placeholder="(11) 99999-9999"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  htmlFor="new-client-email"
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Email
                </label>
                <input
                  id="new-client-email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                  placeholder="email@cliente.com"
                  title="Email do cliente"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={newClient.birthDate}
                  onChange={(e) =>
                    setNewClient({ ...newClient, birthDate: e.target.value })
                  }
                  title="Data de nascimento do cliente"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? "bg-blue-500/10 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
              >
                <p
                  className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}
                >
                  ℹ️ O PIN de 4 dígitos será gerado automaticamente após o
                  cadastro.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewClient(false)}
                className={`flex-1 py-2 rounded-lg font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddClient}
                className="flex-1 py-2 rounded-lg font-medium bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {showEditClient && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Editar Cliente
              </h3>
              <button
                onClick={() => {
                  setShowEditClient(false);
                  setEditingClient(null);
                }}
                className={isDark ? "text-slate-400" : "text-slate-500"}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, name: e.target.value })
                  }
                  placeholder="Nome completo do cliente"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={editingClient.phone}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      phone: handlePhoneInput(e.target.value),
                    })
                  }
                  placeholder="(11) 99999-9999"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={editingClient.email || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      email: e.target.value,
                    })
                  }
                  placeholder="email@cliente.com"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={editingClient.birthDate || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      birthDate: e.target.value,
                    })
                  }
                  title="Data de nascimento do cliente"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>

              {editingClient && (
                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
                >
                  <p
                    className={`text-sm ${isDark ? "text-amber-300" : "text-amber-700"}`}
                  >
                    🔑 PIN atual:{" "}
                    <span className="font-bold">
                      {editingClient.pin || "N/A"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditClient(false);
                  setEditingClient(null);
                }}
                className={`flex-1 py-2 rounded-lg font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditClient}
                className="flex-1 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Atendimento */}
      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div
            className={`w-full max-w-lg rounded-xl p-6 mx-4 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Novo Atendimento
              </h3>
              <button
                onClick={() => setShowNewAppointment(false)}
                className={isDark ? "text-slate-400" : "text-slate-500"}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="new-appointment-client"
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Cliente * (busque por nome ou telefone)
                </label>
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <input
                    id="new-appointment-client"
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Digite nome ou telefone (ex: Maria ou 11999887766)..."
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>
                {showClientDropdown && clientSearchTerm && (
                  <div
                    className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"}`}
                  >
                    {clients
                      .filter((c) => {
                        const term = clientSearchTerm.toLowerCase().trim();
                        if (!term) return true;
                        
                        // Busca por nome
                        const nameMatch = c.name.toLowerCase().includes(term);
                        
                        // Busca por telefone (apenas se o termo contiver dígitos)
                        const searchDigits = clientSearchTerm.replace(/\D/g, "");
                        const phoneMatch = searchDigits.length > 0 && 
                          c.phone.replace(/\D/g, "").includes(searchDigits);
                        
                        return nameMatch || phoneMatch;
                      })
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setNewAppointment({
                              ...newAppointment,
                              clientId: c.id,
                            });
                            setClientSearchTerm(
                              `${c.name} - ${formatPhone(c.phone)}`,
                            );
                            setShowClientDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 ${isDark ? "hover:bg-slate-600" : "hover:bg-slate-50"} border-b last:border-b-0 ${isDark ? "border-slate-600" : "border-slate-100"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                              >
                                {c.name}
                              </p>
                              <p
                                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {formatPhone(c.phone)}
                              </p>
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}
                            >
                              PIN: {c.pin}
                            </div>
                          </div>
                        </button>
                      ))}
                    {clients.filter(
                      (c) =>
                        c.name
                          .toLowerCase()
                          .includes(clientSearchTerm.toLowerCase()) ||
                        c.phone
                          .replace(/\D/g, "")
                          .includes(clientSearchTerm.replace(/\D/g, "")),
                    ).length === 0 && (
                      <div
                        className={`px-3 py-4 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="new-appointment-professional"
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Profissional
                </label>
                <select
                  id="new-appointment-professional"
                  value={newAppointment.professionalId}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      professionalId: e.target.value,
                    })
                  }
                  title="Profissional responsável pelo atendimento"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                >
                  <option value="">Selecione o profissional</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.specialty || "Sem especialidade"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-appointment-date"
                    className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Data
                  </label>
                  <input
                    id="new-appointment-date"
                    type="date"
                    value={newAppointment.date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        date: e.target.value,
                      })
                    }
                    title="Data do atendimento - máximo hoje"
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-appointment-time"
                    className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Horário
                  </label>
                  <input
                    id="new-appointment-time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        time: e.target.value,
                      })
                    }
                    title="Horário do atendimento"
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>
              </div>

              <div className="relative">
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Procedimentos realizados * (busque pelo nome)
                </label>
                <div className="relative mb-2">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <input
                    type="text"
                    value={procedureSearchTerm}
                    onChange={(e) => {
                      setProcedureSearchTerm(e.target.value);
                      setShowProcedureDropdown(true);
                    }}
                    onFocus={() => setShowProcedureDropdown(true)}
                    placeholder="Digite o nome do procedimento..."
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>
                {showProcedureDropdown && (
                  <div
                    className={`max-h-64 overflow-y-auto rounded-lg border mb-3 ${isDark ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}`}
                  >
                    {services
                      .filter((service) => {
                        // Mostrar TODOS os serviços - apenas filtrar por termo de busca se digitado
                        if (procedureSearchTerm === "") return true;
                        return (
                          service.name
                            .toLowerCase()
                            .includes(procedureSearchTerm.toLowerCase()) ||
                          service.categoryName
                            ?.toLowerCase()
                            .includes(procedureSearchTerm.toLowerCase())
                        );
                      })
                      .map((service) => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                        >
                          <input
                            type="checkbox"
                            checked={newAppointment.selectedServices.includes(
                              service.id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAppointment({
                                  ...newAppointment,
                                  selectedServices: [
                                    ...newAppointment.selectedServices,
                                    service.id,
                                  ],
                                });
                              } else {
                                setNewAppointment({
                                  ...newAppointment,
                                  selectedServices:
                                    newAppointment.selectedServices.filter(
                                      (id) => id !== service.id,
                                    ),
                                });
                              }
                            }}
                            className="rounded border-slate-400"
                          />
                          <span
                            className={`flex-1 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                          >
                            {service.name}
                          </span>
                          <span
                            className={`text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}
                          >
                            {formatCurrency(service.price)}
                          </span>
                        </label>
                      ))}
                    {services.length === 0 && (
                      <div
                        className={`px-3 py-4 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Nenhum procedimento encontrado
                      </div>
                    )}
                  </div>
                )}
                {newAppointment.selectedServices.length > 0 && (
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
                  >
                    <p
                      className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      ✓ {newAppointment.selectedServices.length} procedimento(s)
                      selecionado(s)
                    </p>
                    <p
                      className={`text-lg font-bold mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      Total:{" "}
                      {formatCurrency(
                        services
                          .filter((s) =>
                            newAppointment.selectedServices.includes(s.id),
                          )
                          .reduce((sum, s) => sum + s.price, 0),
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewAppointment(false)}
                className={`flex-1 py-2 rounded-lg font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAppointment}
                disabled={
                  !newAppointment.clientId ||
                  !newAppointment.professionalId ||
                  newAppointment.selectedServices.length === 0
                }
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  newAppointment.clientId &&
                  newAppointment.professionalId &&
                  newAppointment.selectedServices.length > 0
                    ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                    : isDark
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Usar Bônus */}
      {showRedeemModal && selectedClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Usar Bônus -{" "}
                {clients.find((c) => c.id === selectedClientId)?.name}
              </h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className={isDark ? "text-slate-400" : "text-slate-500"}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {getAvailableRewards(selectedClientId).map((reward) => (
                <label
                  key={reward.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                    selectedRewardId === reward.id
                      ? isDark
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-amber-500 bg-amber-50"
                      : isDark
                        ? "border-slate-700 hover:border-slate-600"
                        : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="reward"
                    checked={selectedRewardId === reward.id}
                    onChange={() => setSelectedRewardId(reward.id)}
                    className="sr-only"
                  />
                  <Gift
                    className={`h-5 w-5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      {reward.title}
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {reward.description}
                    </p>
                    <p
                      className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Válido até: {formatDate(reward.expiresAt)}
                    </p>
                  </div>
                  {selectedRewardId === reward.id && (
                    <Check className="h-5 w-5 text-amber-500" />
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={!selectedRewardId}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  selectedRewardId
                    ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                    : isDark
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Confirmar Resgate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico do Cliente */}
      {showClientHistory && historyClientId && (() => {
        const client = clients.find((c) => c.id === historyClientId);
        const clientHistory = getClientAppointmentsHistory(historyClientId);
        const totalGasto = clientHistory.reduce((sum, apt) => sum + apt.total, 0);
        const totalPontos = clientHistory.reduce((sum, apt) => sum + apt.pointsEarned, 0);
        
        // Agrupar por mês
        const groupedByMonth: { [key: string]: typeof clientHistory } = {};
        clientHistory.forEach((apt) => {
          const date = new Date(apt.date + "T12:00:00");
          const monthKey = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
          if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
          groupedByMonth[monthKey].push(apt);
        });

        if (!client) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div
              className={`w-full max-w-2xl rounded-2xl p-6 my-8 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    📋 Histórico de Atendimentos
                  </h3>
                  <p className={`text-lg font-medium mt-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    {client.name}
                  </p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatPhone(client.phone)} • PIN: {client.pin}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowClientHistory(false);
                    setHistoryClientId(null);
                  }}
                  className={`p-2 rounded-lg ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                  aria-label="Fechar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Resumo Geral */}
              <div className={`grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-amber-50"}`}>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                    {clientHistory.length}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Atendimentos
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    {formatCurrency(totalGasto)}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Total Gasto
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    {totalPontos}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Pontos Ganhos
                  </p>
                </div>
              </div>

              {/* Lista de Atendimentos Agrupados */}
              <div className={`max-h-96 overflow-y-auto rounded-xl ${isDark ? "bg-slate-900/50" : "bg-slate-50"} p-4`}>
                {clientHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className={`h-12 w-12 mx-auto mb-3 opacity-50 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <p className={`text-lg font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Nenhum atendimento registrado
                    </p>
                    <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Este cliente ainda não possui atendimentos
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedByMonth).map(([month, apts]) => (
                    <div key={month} className="mb-6 last:mb-0">
                      <h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 sticky top-0 py-2 ${
                        isDark ? "text-amber-400 bg-slate-900/90" : "text-amber-600 bg-slate-50/90"
                      }`}>
                        📅 {month} ({apts.length} atendimento{apts.length > 1 ? "s" : ""})
                      </h4>
                      <div className="space-y-2">
                        {apts.map((apt, idx) => (
                          <div
                            key={apt.id}
                            className={`p-3 rounded-lg ${
                              isDark 
                                ? "bg-slate-800 border border-slate-700" 
                                : "bg-white border border-slate-200 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                    isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {formatDate(apt.date)}
                                  </span>
                                  {apt.time && (
                                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                      {apt.time}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-700"}`}>
                                  {apt.services.map((s) => s.name).join(" • ")}
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  👨‍⚕️ {apt.professionalName || "Profissional não informado"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                                  {formatCurrency(apt.total)}
                                </p>
                                <p className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                  +{apt.pointsEarned} pts
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer com Info de Verificação */}
              {clientHistory.length > 0 && (
                <div className={`mt-4 p-3 rounded-lg ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
                  <p className={`text-sm ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                    ✅ <strong>Verificação:</strong> {clientHistory.length} atendimento(s) registrado(s) para {client.name}. 
                    Último atendimento: {formatDate(clientHistory[0]?.date || "")}
                  </p>
                </div>
              )}

              {/* Botão Fechar */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowClientHistory(false);
                    setHistoryClientId(null);
                  }}
                  className="px-6 py-2 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
