"use client";

import "./charts.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/app-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  type Service as DomainService,
  type Professional,
  type FidelityRule,
  type Client,
} from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  getServices as getServicesFromSupabase,
  createService as createSupabaseService,
  updateService as updateSupabaseService,
  type Service as SupabaseService,
} from "@/lib/services-api";
import {
  createStaffUser,
  getStaffUsers,
  deactivateStaffUser,
  deleteStaffUser,
  type StaffUser,
} from "@/lib/staff-users-api";
import { getReviewsForReport } from "@/lib/reviews-api";
import {
  Sun,
  Moon,
  LogOut,
  Users,
  Calendar,
  Gift,
  Star,
  TrendingUp,
  Settings,
  Download,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  BarChart3,
  PieChart,
  UserPlus,
  Award,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Target,
  Zap,
  Info,
  AlertCircle,
  CheckCircle,
  Save,
  ArrowUp,
  ArrowDown,
  Trophy,
  Crown,
  Percent,
  Hash,
  Send,
} from "lucide-react";

type Tab =
  | "dashboard"
  | "analytics"
  | "clientes"
  | "equipe"
  | "servicos"
  | "regras"
  | "relatorios";

interface StaffSession {
  email: string;
  role: string;
  name: string;
  loggedAt: string;
}

// Cores para gráficos
const CHART_COLORS = [
  "bg-amber-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const PERIOD_LABEL: Record<"7d" | "30d" | "90d" | "all", string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  all: "todo o período",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [services, setServices] = useState<DomainService[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [editingService, setEditingService] = useState<DomainService | null>(
    null,
  );
  const [editingRule, setEditingRule] = useState<FidelityRule | null>(null);
  const [showRulesHelp, setShowRulesHelp] = useState(false);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  // Categorias dinâmicas extraídas dos serviços
  const categories = useMemo(() => {
    const uniqueCats = new Map<string, { id: string; name: string }>();
    services.forEach((s) => {
      if (s.categoryId && s.categoryName) {
        uniqueCats.set(s.categoryId, { id: s.categoryId, name: s.categoryName });
      }
    });
    return Array.from(uniqueCats.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [services]);

  // Filtros
  const [clientFilter, setClientFilter] = useState<
    "all" | "withRewards" | "vip" | "inactive"
  >("all");
  const [professionalRoleFilter, setProfessionalRoleFilter] = useState<
    "all" | "medico" | "profissional" | "recepcionista"
  >("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] =
    useState<string>("all");
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] =
    useState<string>("all");
  const [analyticsProfessionalFilter, setAnalyticsProfessionalFilter] =
    useState<string>("all");
  const [analyticsPeriodFilter, setAnalyticsPeriodFilter] = useState<
    "7d" | "30d" | "90d" | "all"
  >("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Estados para formulários
  const [newProfessional, setNewProfessional] = useState<{
    name: string;
    role: Professional["role"];
    specialty: string;
    email: string;
    phone: string;
    servicesIds: string[];
    loginPassword: string;
  }>({
    name: "",
    role: "profissional",
    specialty: "",
    email: "",
    phone: "",
    servicesIds: [],
    loginPassword: "",
  });
  const [newService, setNewService] = useState({
    name: "",
    categoryId: "",
    price: 0,
    durationMinutes: 30,
  });
  const [newRule, setNewRule] = useState<{
    name: string;
    description: string;
    type: FidelityRule["type"];
    thresholdValue: number;
    rewardType: FidelityRule["rewardType"];
    rewardValue: number;
    validityDays: number;
    categoryId: string;
  }>({
    name: "",
    description: "",
    type: "VALUE_ACCUMULATION",
    thresholdValue: 0,
    rewardType: "DISCOUNT_PERCENT",
    rewardValue: 0,
    validityDays: 30,
    categoryId: "",
  });

  const appData = useApp();
  const {
    clients,
    appointments,
    rewards,
    reviews,
    professionals,
    rules,
    updateClient,
    deleteClient,
    addProfessional,
    updateProfessional,
    removeProfessional,
    getRules,
    toggleRule,
    addRule,
    updateRule,
    getClientRewards,
    redeemReward,
  } = appData;

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Carregar serviços do Supabase (fallback para mocks em caso de erro)
  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        const apiServices = await getServicesFromSupabase();
        if (cancelled) return;

        if (apiServices && apiServices.length > 0) {
          const mapped: DomainService[] = apiServices.map(
            (svc: SupabaseService) => ({
              id: svc.id,
              externalCode: svc.external_code,
              name: svc.name,
              categoryId: svc.category_id,
              categoryName: svc.category_name,
              price: svc.price,
              durationMinutes: svc.duration_minutes,
              isActive: svc.is_active,
            }),
          );
          setServices(mapped);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar serviços do Supabase. Mantendo lista mock em memória.",
          error,
        );
      }
    };

    loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

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

  // Carregar usuários criados no Supabase
  useEffect(() => {
    const loadStaffUsers = async () => {
      try {
        const users = await getStaffUsers();
        setStaffUsers(users);
        console.log(`✅ ${users.length} usuários carregados do Supabase`);
      } catch (error) {
        console.warn("⚠️ Erro ao carregar usuários do Supabase:", error);
      }
    };
    loadStaffUsers();
  }, []);

  // Aplicar estilos dinâmicos dos gráficos via DOM para evitar style inline
  useEffect(() => {
    // Evita rodar desnecessariamente em telas que não usam gráficos
    if (tab !== "dashboard" && tab !== "analytics") return;

    const applyChartStyles = () => {
      document.querySelectorAll("[data-chart-height]").forEach((el) => {
        const height = el.getAttribute("data-chart-height");
        if (height)
          (el as HTMLElement).style.setProperty("--chart-height", height);
      });
      document.querySelectorAll("[data-chart-width]").forEach((el) => {
        const width = el.getAttribute("data-chart-width");
        if (width)
          (el as HTMLElement).style.setProperty("--chart-width", width);
      });
    };

    applyChartStyles();
  }, [
    tab,
    analyticsPeriodFilter,
    analyticsProfessionalFilter,
    analyticsCategoryFilter,
    dateFrom,
    dateTo,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("staffSession");
    router.push("/staff/login");
  };

  const handleSendWhatsAppToClient = (client: Client) => {
    if (typeof window === "undefined") return;

    const rawPhone = client.phone || "";
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) return;

    const phoneWithCountry = digits.startsWith("55") ? digits : `55${digits}`;

    const appUrl = `${window.location.origin}/c/bedeschi`;
    const loginInfo = `Telefone: ${client.phone} | PIN: ${client.pin}`;

    const message = [
      `Olá ${client.name.split(" ")[0]}, tudo bem?`,
      "",
      "Bem-vindo(a) ao programa de fidelidade do Instituto Bedeschi.",
      `Acesse seus pontos e benefícios em: ${appUrl}`,
      "",
      "Seus dados de acesso são:",
      loginInfo,
      "",
      "Qualquer dúvida, responda esta mensagem e nossa equipe irá te ajudar.",
    ].join("\n");

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  // Excluir cliente (apenas admin)
  const handleDeleteClient = async (client: Client) => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Tem certeza que deseja excluir o cliente "${client.name}"?\n\n` +
      `Esta ação irá remover permanentemente:\n` +
      `- Todos os atendimentos do cliente\n` +
      `- Todas as recompensas do cliente\n` +
      `- Todos os dados do cliente\n\n` +
      `Esta ação NÃO pode ser desfeita!`
    );

    if (!confirmed) return;

    const success = await deleteClient(client.id);
    if (success) {
      alert(`✅ Cliente "${client.name}" excluído com sucesso!`);
    } else {
      alert(`❌ Erro ao excluir cliente "${client.name}". Tente novamente.`);
    }
  };

  // Estado para modal de usar bônus
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedClientForRedeem, setSelectedClientForRedeem] =
    useState<Client | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const handleOpenRedeemModal = (client: Client) => {
    setSelectedClientForRedeem(client);
    setSelectedRewardId(null);
    setShowRedeemModal(true);
  };

  const handleRedeemReward = () => {
    if (!selectedClientForRedeem || !selectedRewardId) return;

    redeemReward(selectedRewardId);
    setShowRedeemModal(false);
    setSelectedClientForRedeem(null);
    setSelectedRewardId(null);
  };

  const getClientAvailableRewards = (clientId: string) => {
    return getClientRewards(clientId).filter((r) => r.status === "available");
  };

  // Filtrar atendimentos por período
  const getFilteredAppointments = useCallback(
    (period: string) => {
      // Priorizar filtro de data personalizado se preenchido
      if (dateFrom && dateTo) {
        const start = new Date(dateFrom);
        // Ajustar fuso horário adicionando o offset ou definindo a hora para 00:00:00 local
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);

        return appointments.filter((a) => {
          const d = new Date(a.date);
          // Adicionar o timezone offset para garantir comparação correta da data string (YYYY-MM-DD)
          // Ou simplesmente comparar as strings de data se a.date for YYYY-MM-DD
          return d >= start && d <= end;
        });
      }

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          return appointments; // Retorna todos para "all"
        default:
          return appointments;
      }
      
      // Zerar horas para comparação justa
      startDate.setHours(0, 0, 0, 0);

      return appointments.filter((a) => new Date(a.date) >= startDate);
    },
    [appointments, dateFrom, dateTo],
  );

  // Analytics calculados com filtros
  const analytics = useMemo(() => {
    const now = new Date();

    // Filtra atendimentos por período
    const baseFilteredApts = getFilteredAppointments(analyticsPeriodFilter);

    // Filtra por categoria de procedimento quando selecionado
    const filteredApts =
      analyticsCategoryFilter === "all"
        ? baseFilteredApts
        : baseFilteredApts.filter((a) =>
            a.services.some((s) => {
              const serviceData = services.find((srv) => srv.name === s.name);
              return serviceData?.categoryId === analyticsCategoryFilter;
            }),
          );

    // Filtrar por mês atual e anterior OU pelo período customizado se definido
    let thisMonth: typeof appointments;
    let lastMonth: typeof appointments;

    if (dateFrom && dateTo) {
      // Se há filtro de data customizado, usar o período selecionado como "mês atual"
      // e comparar com o mês anterior ao período inicial
      const customStart = new Date(dateFrom);
      customStart.setHours(0, 0, 0, 0);
      const customEnd = new Date(dateTo);
      customEnd.setHours(23, 59, 59, 999);

      thisMonth = appointments.filter((a) => {
        const d = new Date(a.date);
        if (d < customStart || d > customEnd) return false;

        // Aplicar filtro de categoria se selecionado
        if (analyticsCategoryFilter === "all") return true;
        return a.services.some((s) => {
          const serviceData = services.find((srv) => srv.name === s.name);
          return serviceData?.categoryId === analyticsCategoryFilter;
        });
      });

      // Calcular período anterior com mesma duração
      const periodDays = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(customStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(customStart.getTime() - 1);

      lastMonth = appointments.filter((a) => {
        const d = new Date(a.date);
        if (d < prevStart || d > prevEnd) return false;

        // Aplicar filtro de categoria se selecionado
        if (analyticsCategoryFilter === "all") return true;
        return a.services.some((s) => {
          const serviceData = services.find((srv) => srv.name === s.name);
          return serviceData?.categoryId === analyticsCategoryFilter;
        });
      });
    } else {
      // Usar mês corrente e anterior
      thisMonth = appointments.filter((a) => {
        const d = new Date(a.date);
        const isThisMonth =
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
        if (!isThisMonth) return false;

        // Aplicar filtro de categoria se selecionado
        if (analyticsCategoryFilter === "all") return true;
        return a.services.some((s) => {
          const serviceData = services.find((srv) => srv.name === s.name);
          return serviceData?.categoryId === analyticsCategoryFilter;
        });
      });

      lastMonth = appointments.filter((a) => {
        const d = new Date(a.date);
        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const isLastMonth =
          d.getMonth() === lastM.getMonth() &&
          d.getFullYear() === lastM.getFullYear();
        if (!isLastMonth) return false;

        // Aplicar filtro de categoria se selecionado
        if (analyticsCategoryFilter === "all") return true;
        return a.services.some((s) => {
          const serviceData = services.find((srv) => srv.name === s.name);
          return serviceData?.categoryId === analyticsCategoryFilter;
        });
      });
    }

    const revenueThisMonth = thisMonth.reduce((sum, a) => sum + a.total, 0);
    const revenueLastMonth = lastMonth.reduce((sum, a) => sum + a.total, 0);
    const revenueGrowth =
      revenueLastMonth > 0
        ? (
            ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) *
            100
          ).toFixed(1)
        : "N/A";

    // Serviços mais populares
    const serviceCount: Record<string, number> = {};
    const serviceRevenue: Record<string, number> = {};
    filteredApts.forEach((a) => {
      a.services.forEach((s) => {
        serviceCount[s.name] = (serviceCount[s.name] || 0) + 1;
        serviceRevenue[s.name] = (serviceRevenue[s.name] || 0) + s.price;
      });
    });
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        revenue: serviceRevenue[name] || 0,
      }));

    // Top clientes por gasto
    const topClients = [...clients]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((c) => ({
        ...c,
        appointmentsInPeriod: filteredApts.filter((a) => a.clientId === c.id)
          .length,
      }));

    // Performance da equipe - usar avaliações dos appointments diretamente
    const professionalPerformance = professionals
      .map((p) => {
        const profAppointments = filteredApts.filter(
          (a) => a.professionalId === p.id,
        );
        // Buscar avaliações dos appointments (hasReview e review.rating)
        const allProfAppointments = appointments.filter(
          (a) => a.professionalId === p.id,
        );
        const appointmentsWithReview = allProfAppointments.filter(
          (a) => a.hasReview && a.review?.rating,
        );
        const avgRating =
          appointmentsWithReview.length > 0
            ? (
                appointmentsWithReview.reduce((sum, a) => sum + (a.review?.rating || 0), 0) /
                appointmentsWithReview.length
              ).toFixed(1)
            : "N/A";
        const totalRevenue = profAppointments.reduce(
          (sum, a) => sum + a.total,
          0,
        );

        return {
          ...p,
          appointmentsCount: profAppointments.length,
          revenue: totalRevenue,
          avgRating,
          reviewsCount: appointmentsWithReview.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Profissionais mais bem avaliados - mostrar apenas quem tem avaliações
    const topRatedProfessionals = [...professionalPerformance]
      .filter((p) => p.avgRating !== "N/A" && p.reviewsCount > 0)
      .sort(
        (a, b) =>
          parseFloat(b.avgRating as string) - parseFloat(a.avgRating as string),
      )
      .slice(0, 5);

    // Profissionais que mais atendem
    const mostActiveProfessionals = [...professionalPerformance]
      .sort((a, b) => b.appointmentsCount - a.appointmentsCount)
      .slice(0, 5);

    // Piores profissionais por avaliação - mostrar apenas quem tem avaliações
    const worstProfessionals = [...professionalPerformance]
      .filter((p) => p.avgRating !== "N/A" && p.reviewsCount > 0)
      .sort(
        (a, b) =>
          parseFloat(a.avgRating as string) - parseFloat(b.avgRating as string),
      )
      .slice(0, 5);

    // Receita por categoria
    const categoryRevenue: Record<string, number> = {};
    filteredApts.forEach((a) => {
      a.services.forEach((s) => {
        const serviceData = services.find((srv) => srv.name === s.name);
        const categoryName = serviceData?.categoryName ?? "Outros";
        categoryRevenue[categoryName] =
          (categoryRevenue[categoryName] || 0) + s.price;
      });
    });
    const revenueByCategory = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Receita diária baseada no período filtrado
    const dailyRevenue: { date: string; revenue: number }[] = [];
    
    let loopStartDate: Date;
    let loopEndDate: Date = new Date(); // Default to now

    if (dateFrom && dateTo) {
      loopStartDate = new Date(dateFrom);
      // Ajustar start para 00:00:00 local (ou utc dependendo de como é salvo)
      // Como estamos lidando com strings YYYY-MM-DD, o new Date("YYYY-MM-DD") cria em UTC meia noite.
      // Vamos garantir que lidamos com dias inteiros.
      loopStartDate.setUTCHours(0, 0, 0, 0); 
      
      loopEndDate = new Date(dateTo);
      loopEndDate.setUTCHours(23, 59, 59, 999);
    } else {
      let daysBack = 30;
      if (analyticsPeriodFilter === "7d") daysBack = 7;
      else if (analyticsPeriodFilter === "90d") daysBack = 90;
      else if (analyticsPeriodFilter === "all") daysBack = 90; // Default limit
      
      loopStartDate = new Date();
      loopStartDate.setDate(loopStartDate.getDate() - daysBack);
      loopStartDate.setHours(0, 0, 0, 0);
    }

    // Iterar dia a dia
    const currentIter = new Date(loopStartDate);
    // Ajuste simples para loop: enquanto data atual <= data final
    // Usando getTime para comparação segura
    while (currentIter <= loopEndDate) {
      const dateStr = currentIter.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const dayRevenue = filteredApts
        .filter((a) => a.date === dateStr)
        .reduce((sum, a) => sum + a.total, 0);
        
      dailyRevenue.push({ date: dateStr, revenue: dayRevenue });
      
      // Avançar 1 dia
      currentIter.setDate(currentIter.getDate() + 1);
    }

    // Avaliações do período filtrado
    const reviewsInPeriod = reviews.filter((r) => {
      // 1. Tentar filtrar pelo vínculo com agendamento no período
      const linkedToPeriod = filteredApts.some((a) => a.id === r.appointmentId);
      if (linkedToPeriod) return true;

      // 2. Fallback: Filtrar pela data de criação da avaliação
      if (dateFrom && dateTo) {
        const rDate = new Date(r.createdAt);
        const start = new Date(dateFrom);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        return rDate >= start && rDate <= end;
      } else if (analyticsPeriodFilter !== "all") {
        const days = analyticsPeriodFilter === "7d" ? 7 : analyticsPeriodFilter === "30d" ? 30 : 90;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const rDate = new Date(r.createdAt);
        return rDate >= cutoff;
      }
      
      return true; // Se for "all" e não tiver datas, retorna tudo
    });

    const avgRatingPeriod =
      reviewsInPeriod.length > 0
        ? (
            reviewsInPeriod.reduce((sum, r) => sum + r.rating, 0) /
            reviewsInPeriod.length
          ).toFixed(1)
        : "0.0";

    const avgTicketPeriod =
      filteredApts.length > 0
        ? filteredApts.reduce((sum, a) => sum + a.total, 0) /
          filteredApts.length
        : 0;

    return {
      totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowth,
      revenuePeriod: filteredApts.reduce((sum, a) => sum + a.total, 0),
      appointmentsPeriod: filteredApts.length,
      avgTicket:
        filteredApts.length > 0
          ? filteredApts.reduce((sum, a) => sum + a.total, 0) /
            filteredApts.length
          : 0,
      avgTicketPeriod,
      avgRatingPeriod,
      reviewsInPeriod: reviewsInPeriod.length,
      topServices,
      topClients,
      professionalPerformance,
      topRatedProfessionals,
      mostActiveProfessionals,
      worstProfessionals,
      revenueByCategory,
      dailyRevenue, // Dados já estão em ordem cronológica (antigo -> recente)
      clientsThisMonth: clients.filter((c) => {
        const d = new Date(c.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length,
      totalPoints: clients.reduce((sum, c) => sum + c.pointsBalance, 0),
      avgRating:
        reviews.length > 0
          ? (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1)
          : "N/A",
      totalReviews: reviews.length,
      activeRewards: rewards.filter((r) => r.status === "available").length,
      redeemedRewards: rewards.filter((r) => r.status === "redeemed").length,
    };
  }, [
    clients,
    appointments,
    reviews,
    professionals,
    rewards,
    getFilteredAppointments,
    analyticsPeriodFilter,
    analyticsCategoryFilter,
    services,
    dateFrom,
    dateTo,
  ]);

  // Exportar para CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      alert("Não há dados para exportar neste período.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(","),
      ),
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
    if (clientFilter === "inactive") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return !c.lastVisit || new Date(c.lastVisit) < thirtyDaysAgo;
    }
    return true;
  });

  const filteredServices = useMemo(
    () =>
      services
        .filter((s) =>
          serviceCategoryFilter === "all"
            ? true
            : s.categoryId === serviceCategoryFilter,
        )
        .filter((s) =>
          serviceSearch.trim()
            ? s.name.toLowerCase().includes(serviceSearch.toLowerCase())
            : true,
        ),
    [services, serviceCategoryFilter, serviceSearch],
  );

  // Handlers para CRUD de Profissionais
  const handleAddProfessional = async () => {
    if (!newProfessional.name) return;

    const professional: Professional = {
      id: `prof-${Date.now()}`,
      name: newProfessional.name,
      role: newProfessional.role,
      specialty: newProfessional.specialty,
      email: newProfessional.email,
      phone: newProfessional.phone,
      servicesIds: newProfessional.servicesIds,
      rating: 5.0,
      totalAppointments: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      loginPassword:
        newProfessional.role === "recepcionista" &&
        newProfessional.loginPassword
          ? newProfessional.loginPassword
          : undefined,
    };
    addProfessional(professional);

    // SALVAR USUÁRIO PERSISTENTE NO SUPABASE
    // APENAS RECEPCIONISTAS TÊM LOGIN - Profissionais/Médicos são cadastros para seleção/avaliação
    const isReceptionist = professional.role === "recepcionista";

    if (isReceptionist) {
      // Recepcionista PRECISA de email e senha
      if (!professional.email || !newProfessional.loginPassword) {
        alert("Email e senha são obrigatórios para cadastrar recepcionistas.");
        return;
      }
    } else {
      // Profissionais/Médicos NÃO precisam de email/senha (apenas prestadores de serviço)
      // Gerar email fictício e senha padrão para o Supabase
      if (!professional.email) {
        const nameSlug = professional.name.toLowerCase().replace(/\s+/g, ".");
        professional.email = `${nameSlug}@prestador.bedeschi.local`;
      }
      if (!newProfessional.loginPassword) {
        newProfessional.loginPassword = "prestador123"; // Senha padrão (não usada)
      }
    }

    try {
      // Mapear role do formulário para role do Supabase
      const supabaseRole =
        professional.role === "recepcionista" ? "recepcao" : professional.role;

      // Salvar na tabela staff_users do Supabase (PERSISTENTE)
      await createStaffUser({
        email: professional.email,
        password: newProfessional.loginPassword,
        name: professional.name,
        role: supabaseRole as "admin" | "recepcao" | "profissional" | "medico",
        specialty: professional.specialty,
        created_by: user?.email || "admin",
      });

      const roleLabel = isReceptionist ? "Recepcionista" : "Prestador(a)";
      alert(`${roleLabel} cadastrado(a) com sucesso!`);
      console.log(
        "✅ Usuário salvo permanentemente no Supabase:",
        professional.email,
      );

      // Recarregar lista de usuários
      const updatedUsers = await getStaffUsers();
      setStaffUsers(updatedUsers);
    } catch (error) {
      console.error("❌ Erro ao salvar usuário no Supabase:", error);
      alert(
        `Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
      return;
    }

    setNewProfessional({
      name: "",
      role: "profissional",
      specialty: "",
      email: "",
      phone: "",
      servicesIds: [],
      loginPassword: "",
    });
    setShowAddProfessional(false);
  };

  const handleUpdateProfessional = () => {
    if (!editingProfessional) return;
    updateProfessional(editingProfessional);
    setEditingProfessional(null);
  };

  // Handlers para CRUD de Serviços (integrado ao Supabase com fallback local)
  const handleAddService = async () => {
    if (!newService.name || !newService.categoryId) return;

    const category = categories.find(
      (c) => c.id === newService.categoryId,
    );
    const categoryName = category?.name ?? "Outros";

    try {
      const created = await createSupabaseService({
        name: newService.name,
        price: newService.price,
        duration_minutes: newService.durationMinutes,
        category_id: newService.categoryId,
        category_name: categoryName,
      });

      const mapped: DomainService = {
        id: created.id,
        externalCode: created.external_code,
        name: created.name,
        categoryId: created.category_id,
        categoryName: created.category_name,
        price: created.price,
        durationMinutes: created.duration_minutes,
        isActive: created.is_active,
      };

      setServices((prev) => [mapped, ...prev]);
    } catch (error) {
      console.error(
        "Erro ao criar serviço no Supabase, usando apenas estado local.",
        error,
      );

      const fallbackService: DomainService = {
        id: `srv-custom-${Date.now()}`,
        externalCode: "CUSTOM",
        name: newService.name,
        categoryId: newService.categoryId,
        categoryName,
        price: newService.price,
        durationMinutes: newService.durationMinutes,
        isActive: true,
      };

      setServices((prev) => [fallbackService, ...prev]);
    }

    setNewService({ name: "", categoryId: "", price: 0, durationMinutes: 30 });
    setShowAddService(false);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const updated = await updateSupabaseService(editingService.id, {
        name: editingService.name,
        price: editingService.price,
        duration_minutes: editingService.durationMinutes,
        category_id: editingService.categoryId,
        category_name: editingService.categoryName,
        is_active: editingService.isActive,
      });

      const mapped: DomainService = {
        id: updated.id,
        externalCode: updated.external_code,
        name: updated.name,
        categoryId: updated.category_id,
        categoryName: updated.category_name,
        price: updated.price,
        durationMinutes: updated.duration_minutes,
        isActive: updated.is_active,
      };

      setServices((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)));
    } catch (error) {
      console.error(
        "Erro ao atualizar serviço no Supabase, mantendo atualização apenas em memória.",
        error,
      );
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? editingService : s)),
      );
    }

    setEditingService(null);
  };

  const handleToggleServiceActive = async (service: DomainService) => {
    const nextIsActive = !service.isActive;

    // Atualização otimista no estado local
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, isActive: nextIsActive } : s,
      ),
    );

    try {
      await updateSupabaseService(service.id, { is_active: nextIsActive });
    } catch (error) {
      console.error(
        "Erro ao atualizar status do serviço no Supabase, revertendo no estado local.",
        error,
      );
      // Reverter em caso de erro
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, isActive: service.isActive } : s,
        ),
      );
    }
  };

  // Handlers para CRUD de Regras
  const handleAddRule = () => {
    if (!newRule.name) return;
    const rule: FidelityRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: newRule.description,
      type: newRule.type,
      categoryId: newRule.categoryId || undefined,
      categoryName: categories.find((c) => c.id === newRule.categoryId)
        ?.name,
      thresholdValue: newRule.thresholdValue,
      rewardType: newRule.rewardType,
      rewardValue: newRule.rewardValue,
      validityDays: newRule.validityDays,
      isActive: true,
    };
    addRule(rule);
    setNewRule({
      name: "",
      description: "",
      type: "VALUE_ACCUMULATION",
      thresholdValue: 0,
      rewardType: "DISCOUNT_PERCENT",
      rewardValue: 0,
      validityDays: 30,
      categoryId: "",
    });
    setShowAddRule(false);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    updateRule(editingRule);
    setEditingRule(null);
  };

  const filteredProfessionals = useMemo(
    () =>
      professionals.filter((p) =>
        professionalRoleFilter === "all"
          ? true
          : p.role === professionalRoleFilter,
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
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-100"}`}
      >
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
    <div
      className={`min-h-screen transition-colors ${isDark ? "bg-slate-900" : "bg-slate-100"}`}
    >
      {/* Header */}
      <header
        className={`px-6 py-4 ${isDark ? "bg-slate-800/95 backdrop-blur" : "bg-white/95 backdrop-blur border-b border-slate-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <Image
                src="/Logo.png"
                alt="Instituto Bedeschi"
                width={120}
                height={36}
                className={`h-9 w-auto object-contain ${
                  isDark
                    ? "drop-shadow-[0_0_22px_rgba(251,191,36,0.45)]"
                    : "drop-shadow-[0_0_18px_rgba(148,163,184,0.55)]"
                }`}
                priority
              />
            </div>
            <div>
              <h1
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                Painel Administrativo
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Instituto Bedeschi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? "bg-slate-700 text-amber-400 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              aria-label="Alternar tema"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <span
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors ${isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav
        className={`border-b px-6 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
      >
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === t.id
                    ? isDark
                      ? "border-amber-500 text-amber-400"
                      : "border-amber-500 text-amber-600"
                    : isDark
                      ? "border-transparent text-slate-400 hover:text-slate-300"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {/* Dashboard - Visão Geral com Gráficos */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* Filtros rápidos do Dashboard */}
            <div
              className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`h-4 w-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Período:
                  </span>
                </div>
                
                {/* Filtros de Data Personalizada */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <label htmlFor="dashboard-date-from" className="sr-only">Data Inicial</label>
                    <input
                      id="dashboard-date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      title="Data inicial"
                      placeholder="Data inicial"
                      className={`rounded-lg border px-2 py-1.5 text-xs md:text-sm ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-slate-200"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    />
                  </div>
                  <span className={isDark ? "text-slate-500" : "text-slate-400"}>até</span>
                  <div className="flex flex-col">
                    <label htmlFor="dashboard-date-to" className="sr-only">Data Final</label>
                    <input
                      id="dashboard-date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      title="Data final"
                      placeholder="Data final"
                      className={`rounded-lg border px-2 py-1.5 text-xs md:text-sm ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-slate-200"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    />
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />

                <div className="flex gap-2">
                  {[
                    { value: "7d", label: "7 dias" },
                    { value: "30d", label: "30 dias" },
                    { value: "90d", label: "90 dias" },
                    { value: "all", label: "Todo período" },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setAnalyticsPeriodFilter(
                          period.value as typeof analyticsPeriodFilter,
                        );
                        // Limpar datas personalizadas ao selecionar um preset
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
                        analyticsPeriodFilter === period.value && !dateFrom
                          ? "bg-amber-500 text-white"
                          : isDark
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Filter
                    className={`h-4 w-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <span
                    id="dashboard-category-label"
                    className={`text-xs ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Tipo de procedimento
                  </span>
                  <select
                    aria-labelledby="dashboard-category-label"
                    title="Filtrar visão geral por tipo de procedimento"
                    value={analyticsCategoryFilter}
                    onChange={(e) => setAnalyticsCategoryFilter(e.target.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs md:text-sm ${
                      isDark
                        ? "bg-slate-900 border-slate-700 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="all">Todos</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* KPIs Principais - SINCRONIZADOS COM FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total de Clientes"
                value={clients.length}
                icon={Users}
                isDark={isDark}
                trend={`+${analytics.clientsThisMonth} este mês`}
              />
              <StatCard
                title="Receita Total"
                value={formatCurrency(analytics.revenuePeriod)}
                icon={DollarSign}
                isDark={isDark}
                trend={
                  analytics.revenueGrowth !== "N/A"
                    ? `${Number(analytics.revenueGrowth) > 0 ? "+" : ""}${analytics.revenueGrowth}%`
                    : undefined
                }
                trendUp={Number(analytics.revenueGrowth) > 0}
              />
              <StatCard
                title="Ticket Médio"
                value={formatCurrency(analytics.avgTicketPeriod)}
                icon={Target}
                isDark={isDark}
                trend={`${analytics.appointmentsPeriod} atendimentos`}
              />
              <StatCard
                title="Avaliação Média"
                value={`${analytics.avgRatingPeriod} ⭐`}
                icon={Star}
                isDark={isDark}
                trend={`${analytics.reviewsInPeriod} avaliações`}
              />
            </div>

            {/* Gráficos em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receita Premium - Linha (Recharts) */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      📈 Receita no Período
                    </h3>
                    <p
                      className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {dateFrom && dateTo 
                        ? `${new Date(dateFrom).toLocaleDateString('pt-BR')} até ${new Date(dateTo).toLocaleDateString('pt-BR')}`
                        : PERIOD_LABEL[analyticsPeriodFilter]
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                    >
                      {formatCurrency(analytics.revenuePeriod)}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {analytics.appointmentsPeriod} atendimentos
                    </p>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  {analytics.dailyRevenue.some((d) => d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics.dailyRevenue}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          vertical={false} 
                          stroke={isDark ? "#334155" : "#e2e8f0"} 
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                            });
                          }}
                          stroke={isDark ? "#94a3b8" : "#64748b"}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tickFormatter={(value) => 
                            new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              notation: "compact",
                              maximumFractionDigits: 1,
                            }).format(value)
                          }
                          stroke={isDark ? "#94a3b8" : "#64748b"}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1e293b" : "#ffffff",
                            borderColor: isDark ? "#334155" : "#e2e8f0",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          itemStyle={{
                            color: isDark ? "#f59e0b" : "#d97706",
                          }}
                          labelStyle={{
                            color: isDark ? "#e2e8f0" : "#1e293b",
                            marginBottom: "0.25rem",
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Receita",
                          ]}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return date.toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            });
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`h-full flex items-center justify-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Nenhuma receita no período selecionado
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Procedimentos */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  🏆 Top 5 Procedimentos
                </h3>
                <div className="space-y-3">
                  {analytics.topServices.slice(0, 5).map((service, i) => {
                    const maxRevenue = analytics.topServices[0]?.revenue || 1;
                    const widthPercent = (service.revenue / maxRevenue) * 100;
                    return (
                      <div key={service.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {i + 1}. {service.name}
                          </span>
                          <div className="text-right">
                            <span
                              className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                            >
                              {formatCurrency(service.revenue)}
                            </span>
                            <span
                              className={`text-xs ml-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              ({service.count}x)
                            </span>
                          </div>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                        >
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 chart-bar-horizontal"
                            data-chart-width={`${widthPercent}%`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Avaliações dos Profissionais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mais Bem Avaliados */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  ⭐ Mais Bem Avaliados
                </h3>
                {analytics.topRatedProfessionals.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topRatedProfessionals.map((prof, i) => (
                      <div
                        key={prof.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? "bg-amber-500 text-white"
                                : isDark
                                  ? "bg-slate-600 text-slate-300"
                                  : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                            >
                              {prof.name}
                            </p>
                            <p
                              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {prof.reviewsCount} avaliações
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span
                            className={`text-lg font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                          >
                            {prof.avgRating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Nenhuma avaliação registrada ainda
                  </div>
                )}
              </div>

              {/* Piores Avaliações */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  ⚠️ Piores Avaliações
                </h3>
                {analytics.worstProfessionals.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.worstProfessionals.map((prof, i) => (
                      <div
                        key={prof.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? "bg-slate-600 text-slate-300" : "bg-slate-200 text-slate-600"}`}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                            >
                              {prof.name}
                            </p>
                            <p
                              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {prof.reviewsCount} avaliações
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span
                            className={`text-lg font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                          >
                            {prof.avgRating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Nenhuma avaliação registrada ainda
                  </div>
                )}
              </div>
            </div>

            {/* Profissionais - Grid de 3 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mais Atendimentos */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  🔥 Mais Atendimentos
                </h3>
                <div className="space-y-3">
                  {analytics.mostActiveProfessionals.map((prof, i) => (
                    <div
                      key={prof.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg ${i === 0 ? "text-amber-400" : ""}`}
                        >
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `${i + 1}.`}
                        </span>
                        <span
                          className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {prof.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        {prof.appointmentsCount} atend.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs Rápidos */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  📋 Resumo Rápido
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Recompensas Ativas
                    </span>
                    <span
                      className={`font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      {analytics.activeRewards}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Recompensas Resgatadas
                    </span>
                    <span
                      className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      {analytics.redeemedRewards}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Pontos Distribuídos
                    </span>
                    <span
                      className={`font-semibold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                    >
                      {analytics.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Regras Ativas
                    </span>
                    <span
                      className={`font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                    >
                      {rules.filter((r) => r.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Profissionais Ativos
                    </span>
                    <span
                      className={`font-semibold ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
                    >
                      {professionals.filter((p) => p.isActive).length}
                    </span>
                  </div>
                </div>
              </div>
              {/* Maior Receita */}
              <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}
                >
                  💰 Maior Receita
                </h3>
                <div className="space-y-3">
                  {analytics.professionalPerformance
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map((prof, i) => (
                      <div
                        key={prof.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          isDark ? "bg-slate-700/50" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg ${i === 0 ? "text-amber-400" : ""}`}
                          >
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `${i + 1}.`}
                          </span>
                          <span
                            className={`text-sm ${
                              isDark ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {prof.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-sm font-medium ${
                              isDark ? "text-emerald-400" : "text-emerald-600"
                            }`}
                          >
                            {formatCurrency(prof.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics - Análises Avançadas */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {/* Filtros de Período - MOVIDO PARA O TOPO */}
            <div
              className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Período:
                  </span>
                </div>

                {/* Filtros de Data Personalizada */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <label htmlFor="analytics-date-from" className="sr-only">Data Inicial de Análise</label>
                    <input
                      id="analytics-date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      title="Data inicial"
                      placeholder="Data inicial"
                      className={`rounded-lg border px-2 py-1.5 text-xs md:text-sm ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-slate-200"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    />
                  </div>
                  <span
                    className={isDark ? "text-slate-500" : "text-slate-400"}
                  >
                    até
                  </span>
                  <div className="flex flex-col">
                    <label htmlFor="analytics-date-to" className="sr-only">Data Final de Análise</label>
                    <input
                      id="analytics-date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      title="Data final"
                      placeholder="Data final"
                      className={`rounded-lg border px-2 py-1.5 text-xs md:text-sm ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-slate-200"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    />
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />

                <div className="flex gap-2">
                  {[
                    { value: "7d", label: "7 dias" },
                    { value: "30d", label: "30 dias" },
                    { value: "90d", label: "90 dias" },
                    { value: "all", label: "Todo período" },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setAnalyticsPeriodFilter(
                          period.value as typeof analyticsPeriodFilter,
                        );
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        analyticsPeriodFilter === period.value && !dateFrom
                          ? "bg-amber-500 text-white"
                          : isDark
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <select
                    value={analyticsCategoryFilter}
                    onChange={(e) => setAnalyticsCategoryFilter(e.target.value)}
                    aria-label="Filtrar por categoria de procedimento"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="all">Todos os tipos</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={analyticsProfessionalFilter}
                    onChange={(e) =>
                      setAnalyticsProfessionalFilter(e.target.value)
                    }
                    aria-label="Filtrar por profissional"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-slate-200"
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
              </div>
            </div>

            {/* Comparativo Mensal */}
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                📊 Comparativo Mensal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className={`p-5 rounded-xl ${isDark ? "bg-gradient-to-br from-slate-700/80 to-slate-700/50" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}
                >
                  <p
                    className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Mês Atual
                  </p>
                  <p
                    className={`text-3xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {formatCurrency(analytics.revenueThisMonth)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {new Date().toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className={`p-5 rounded-xl ${isDark ? "bg-gradient-to-br from-slate-700/80 to-slate-700/50" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}
                >
                  <p
                    className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Mês Anterior
                  </p>
                  <p
                    className={`text-3xl font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {formatCurrency(analytics.revenueLastMonth)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {new Date(
                      new Date().setMonth(new Date().getMonth() - 1),
                    ).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className={`p-5 rounded-xl ${isDark ? "bg-gradient-to-br from-slate-700/80 to-slate-700/50" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}
                >
                  <p
                    className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Variação (Crescimento)
                  </p>
                  <div className="flex items-center gap-2">
                    {Number(analytics.revenueGrowth) > 0 ? (
                      <ArrowUp className="h-6 w-6 text-green-500" />
                    ) : Number(analytics.revenueGrowth) < 0 ? (
                      <ArrowDown className="h-6 w-6 text-red-500" />
                    ) : null}
                    <p
                      className={`text-3xl font-bold ${
                        Number(analytics.revenueGrowth) > 0
                          ? "text-green-500"
                          : Number(analytics.revenueGrowth) < 0
                            ? "text-red-500"
                            : isDark
                              ? "text-slate-400"
                              : "text-slate-500"
                      }`}
                    >
                      {analytics.revenueGrowth !== "N/A"
                        ? `${Number(analytics.revenueGrowth) > 0 ? "+" : ""}${analytics.revenueGrowth}%`
                        : "Sem dados"}
                    </p>
                  </div>
                  {analytics.revenueGrowth === "N/A" && (
                    <p
                      className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Mês anterior sem receita
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* KPIs do Período */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-amber-500/20" : "bg-amber-50"}`}
                  >
                    <DollarSign
                      className={`h-6 w-6 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Receita no Período
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                    >
                      {formatCurrency(analytics.revenuePeriod)}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-emerald-500/20" : "bg-emerald-50"}`}
                  >
                    <Calendar
                      className={`h-6 w-6 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Atendimentos
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      {analytics.appointmentsPeriod}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-blue-500/20" : "bg-blue-50"}`}
                  >
                    <Target
                      className={`h-6 w-6 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Ticket Médio
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      {formatCurrency(analytics.avgTicket)}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-50"}`}
                  >
                    <TrendingUp
                      className={`h-6 w-6 ${isDark ? "text-purple-400" : "text-purple-600"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Crescimento Mensal
                    </p>
                    <p
                      className={`text-2xl font-bold ${Number(analytics.revenueGrowth) > 0 ? "text-green-500" : Number(analytics.revenueGrowth) < 0 ? "text-red-500" : isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {analytics.revenueGrowth !== "N/A"
                        ? `${Number(analytics.revenueGrowth) > 0 ? "+" : ""}${analytics.revenueGrowth}%`
                        : "Sem dados"}
                    </p>
                    {analytics.revenueGrowth === "N/A" && (
                      <p
                        className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Mês anterior sem receita
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Principal - AUMENTADO E MELHORADO */}
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                📊 Top 10 Procedimentos por Receita
              </h3>
              <div className="space-y-4">
                {analytics.topServices.map((service, i) => {
                  const maxRevenue = analytics.topServices[0]?.revenue || 1;
                  const widthPercent = (service.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={service.name}
                      className={`p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg"
                                : i === 1
                                  ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md"
                                  : i === 2
                                    ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md"
                                    : isDark
                                      ? "bg-slate-600 text-slate-300"
                                      : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            #{i + 1}
                          </div>
                          <span
                            className={`text-base font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {service.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                          >
                            {formatCurrency(service.revenue)}
                          </span>
                          <span
                            className={`text-sm ml-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            ({service.count}x)
                          </span>
                        </div>
                      </div>
                      <div
                        className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-600" : "bg-slate-200"}`}
                      >
                        <div
                          className={`h-3 rounded-full transition-all duration-700 chart-bar-horizontal ${
                            i === 0
                              ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400"
                              : i === 1
                                ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400"
                                : i === 2
                                  ? "bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"
                                  : "bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400"
                          }`}
                          data-chart-width={`${widthPercent}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance da Equipe - MELHORADO */}
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}
              >
                👥 Performance Detalhada da Equipe
              </h3>
              <div className="space-y-4">
                {filteredProfessionalPerformance.map((prof, i) => (
                  <div
                    key={prof.id}
                    className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-500 text-white" : isDark ? "bg-slate-600 text-slate-300" : "bg-slate-200 text-slate-600"}`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                          >
                            {prof.name}
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {prof.role === "medico"
                              ? "Médico"
                              : prof.role === "profissional"
                                ? "Profissional"
                                : "Recepção"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                        >
                          {formatCurrency(prof.revenue)}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          <span
                            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {prof.appointmentsCount} atend.
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span
                              className={`text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}
                            >
                              {prof.avgRating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-600" : "bg-slate-200"}`}
                    >
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700 chart-bar-horizontal"
                        data-chart-width={`${(prof.revenue / (analytics.professionalPerformance[0]?.revenue || 1)) * 100}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clientes */}
        {tab === "clientes" && (
          <div
            className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Gestão de Clientes
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                >
                  <Search
                    className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`bg-transparent border-none outline-none text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
                  />
                </div>
                <button
                  onClick={() =>
                    exportToCSV(
                      clients.map((c) => ({
                        Nome: c.name,
                        Telefone: c.phone,
                        Email: c.email || "",
                        Pontos: c.pointsBalance,
                        TotalGasto: c.totalSpent,
                        Visitas: c.totalAppointments,
                      })),
                      "clientes",
                    )
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                <select
                  value={clientFilter}
                  onChange={(e) =>
                    setClientFilter(e.target.value as typeof clientFilter)
                  }
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
                  <option value="inactive">Inativos (30+ dias)</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? "text-slate-400" : "text-slate-500"}>
                    <th className="text-left p-3 text-sm font-medium">Nome</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Telefone
                    </th>
                    <th className="text-left p-3 text-sm font-medium">PIN</th>
                    <th className="text-left p-3 text-sm font-medium">Email</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Pontos
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Total Gasto
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Visitas
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Última Visita
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className={`border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
                    >
                      <td
                        className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                      >
                        {client.name}
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {client.phone}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}
                        >
                          🔑 {client.pin}
                        </span>
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {client.email || "-"}
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                      >
                        {client.pointsBalance.toLocaleString()}
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {formatCurrency(client.totalSpent)}
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {client.totalAppointments}
                      </td>
                      <td
                        className={`p-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {client.lastVisit ? formatDate(client.lastVisit) : "-"}
                      </td>
                      <td className="p-3 text-right flex gap-2 justify-end">
                        {getClientAvailableRewards(client.id).length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenRedeemModal(client)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              isDark
                                ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                            aria-label={`Usar bônus de ${client.name}`}
                          >
                            <Gift className="h-3 w-3" />
                            Usar Bônus
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppToClient(client)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            isDark
                              ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                          aria-label={`Enviar acesso via WhatsApp para ${client.name}`}
                        >
                          <Send className="h-3 w-3" />
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClient(client)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            isDark
                              ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                          aria-label={`Excluir cliente ${client.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Equipe */}
        {tab === "equipe" && (
          <div className="space-y-6">
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    Gestão da Equipe
                  </h3>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Gerencie profissionais, médicos e recepcionistas da clínica
                  </p>
                </div>
              </div>

              {/* Resumo por função - Dados do Supabase */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    {staffUsers.length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Total
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {staffUsers.filter((u) => u.role === "medico").length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Médicos
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {staffUsers.filter((u) => u.role === "profissional").length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Profissionais
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                  >
                    {
                      staffUsers.filter(
                        (u) => u.role === "recepcao" || u.role === "admin",
                      ).length
                    }
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Recepção/Admin
                  </p>
                </div>
              </div>

              {/* Usuários do Sistema - Dados Persistentes */}
              <div
                className={`mt-8 rounded-xl p-6 ${isDark ? "bg-slate-900/50 border border-slate-700" : "bg-slate-50 border border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}
                    >
                      <Users
                        className={`h-5 w-5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                      />
                    </div>
                    <div>
                      <h4
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                      >
                        Usuários do Sistema
                      </h4>
                      <p
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {staffUsers.length} usuário
                        {staffUsers.length !== 1 ? "s" : ""} cadastrado
                        {staffUsers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddProfessional(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Usuário
                  </button>
                </div>

                {staffUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                        >
                          <th
                            className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Usuário
                          </th>
                          <th
                            className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Função
                          </th>
                          <th
                            className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Cadastrado em
                          </th>
                          <th
                            className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Status
                          </th>
                          <th
                            className={`text-right py-3 px-4 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"} hover:${isDark ? "bg-slate-800/50" : "bg-slate-50"} transition-colors`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    user.role === "admin"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : user.role === "recepcao"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : user.role === "profissional"
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-cyan-500/20 text-cyan-400"
                                  }`}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p
                                    className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}
                                  >
                                    {user.name}
                                  </p>
                                  <p
                                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : user.role === "recepcao"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : user.role === "profissional"
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-cyan-500/20 text-cyan-400"
                                }`}
                              >
                                {user.role === "admin"
                                  ? "Administrador"
                                  : user.role === "recepcao"
                                    ? "Recepção"
                                    : user.role === "profissional"
                                      ? "Profissional"
                                      : "Médico"}
                              </span>
                            </td>
                            <td
                              className={`py-4 px-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {new Date(user.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                Ativo
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) {
                                    try {
                                      await deleteStaffUser(user.id);
                                      setStaffUsers(prev => prev.filter(u => u.id !== user.id));
                                      alert("Usuário excluído com sucesso!");
                                    } catch (error) {
                                      alert("Erro ao excluir usuário. Tente novamente.");
                                      console.error("Erro ao excluir:", error);
                                    }
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? "hover:bg-red-500/20 text-red-400 hover:text-red-300"
                                    : "hover:bg-red-50 text-red-500 hover:text-red-600"
                                }`}
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className={`text-center py-12 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                    >
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      Nenhum usuário cadastrado
                    </p>
                    <p className="text-sm mb-4">
                      Adicione usuários do sistema para gerenciar a equipe
                    </p>
                    <button
                      onClick={() => setShowAddProfessional(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Primeiro Usuário
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de novo profissional / recepcionista */}
        {(showAddProfessional || editingProfessional) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
              className={`w-full max-w-lg rounded-2xl p-6 shadow-xl ${
                isDark
                  ? "bg-slate-900 border border-slate-700"
                  : "bg-white border border-slate-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                {editingProfessional
                  ? "Editar Profissional"
                  : "Novo Profissional / Recepcionista"}
              </h3>
              {!editingProfessional && (
                <p
                  className={`text-xs mb-4 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Use este formulário para cadastrar profissionais em geral,
                  médicos e também recepcionistas (basta escolher o papel
                  &quot;Recepção&quot;).
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editingProfessional
                    ? handleUpdateProfessional()
                    : handleAddProfessional();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={
                      editingProfessional
                        ? editingProfessional.name
                        : newProfessional.name
                    }
                    onChange={(e) =>
                      editingProfessional
                        ? setEditingProfessional((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev,
                          )
                        : setNewProfessional({
                            ...newProfessional,
                            name: e.target.value,
                          })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-slate-50 placeholder:text-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    }`}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      Papel
                    </label>
                    <select
                      aria-label="Selecionar o papel do profissional"
                      value={
                        editingProfessional
                          ? editingProfessional.role
                          : newProfessional.role
                      }
                      onChange={(e) =>
                        editingProfessional
                          ? setEditingProfessional((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    role: e.target
                                      .value as Professional["role"],
                                  }
                                : prev,
                            )
                          : setNewProfessional({
                              ...newProfessional,
                              role: e.target.value as Professional["role"],
                            })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-50"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="profissional">Profissional</option>
                      <option value="medico">Médico</option>
                      <option value="recepcionista">Recepção</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="specialty-select"
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      Especialidade
                    </label>
                    <select
                      id="specialty-select"
                      title="Selecione a especialidade do profissional"
                      value={
                        editingProfessional
                          ? editingProfessional.specialty || ""
                          : newProfessional.specialty
                      }
                      onChange={(e) =>
                        editingProfessional
                          ? setEditingProfessional((prev) =>
                              prev
                                ? { ...prev, specialty: e.target.value }
                                : prev,
                            )
                          : setNewProfessional({
                              ...newProfessional,
                              specialty: e.target.value,
                            })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-50"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="">Selecione uma especialidade</option>
                      <option value="Massagem e Estética Corporal">
                        Massagem e Estética Corporal
                      </option>
                      <option value="Estética Facial">Estética Facial</option>
                      <option value="Depilação">Depilação</option>
                      <option value="Design de Sobrancelhas">
                        Design de Sobrancelhas
                      </option>
                      <option value="Micropigmentação">Micropigmentação</option>
                      <option value="Alongamento de Cílios">
                        Alongamento de Cílios
                      </option>
                      <option value="Manicure e Pedicure">
                        Manicure e Pedicure
                      </option>
                      <option value="Dermatologia Estética">
                        Dermatologia Estética
                      </option>
                      <option value="Harmonização Facial">
                        Harmonização Facial
                      </option>
                      <option value="Fisioterapia Dermato-Funcional">
                        Fisioterapia Dermato-Funcional
                      </option>
                      <option value="Nutrição Estética">
                        Nutrição Estética
                      </option>
                      <option value="Cosmetologia">Cosmetologia</option>
                      <option value="Outra">Outra (digite abaixo)</option>
                    </select>
                    {(editingProfessional?.specialty === "Outra" ||
                      newProfessional.specialty === "Outra") && (
                      <input
                        type="text"
                        placeholder="Digite a especialidade"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                        onChange={(e) =>
                          editingProfessional
                            ? setEditingProfessional((prev) =>
                                prev
                                  ? { ...prev, specialty: e.target.value }
                                  : prev,
                              )
                            : setNewProfessional({
                                ...newProfessional,
                                specialty: e.target.value,
                              })
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      Email{" "}
                      {editingProfessional?.role === "recepcionista" ||
                      newProfessional.role === "recepcionista"
                        ? "*"
                        : "(opcional)"}
                    </label>
                    <input
                      type="email"
                      value={
                        editingProfessional
                          ? editingProfessional.email || ""
                          : newProfessional.email
                      }
                      onChange={(e) =>
                        editingProfessional
                          ? setEditingProfessional((prev) =>
                              prev ? { ...prev, email: e.target.value } : prev,
                            )
                          : setNewProfessional({
                              ...newProfessional,
                              email: e.target.value,
                            })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-50"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      placeholder="contato@clinica.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      Telefone (opcional)
                    </label>
                    <input
                      type="tel"
                      value={
                        editingProfessional
                          ? editingProfessional.phone || ""
                          : newProfessional.phone
                      }
                      onChange={(e) =>
                        editingProfessional
                          ? setEditingProfessional((prev) =>
                              prev ? { ...prev, phone: e.target.value } : prev,
                            )
                          : setNewProfessional({
                              ...newProfessional,
                              phone: e.target.value,
                            })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-50"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                {(editingProfessional
                  ? editingProfessional.role
                  : newProfessional.role) === "recepcionista" && (
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      Senha de acesso da recepção *
                    </label>
                    <input
                      type="text"
                      value={
                        editingProfessional
                          ? (editingProfessional as Professional)
                              .loginPassword || ""
                          : newProfessional.loginPassword
                      }
                      onChange={(e) =>
                        editingProfessional
                          ? setEditingProfessional((prev) =>
                              prev
                                ? {
                                    ...(prev as Professional),
                                    loginPassword: e.target.value,
                                  }
                                : prev,
                            )
                          : setNewProfessional({
                              ...newProfessional,
                              loginPassword: e.target.value,
                            })
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-50"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      placeholder="Defina uma senha forte para uso na tela de recepção"
                    />
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      Essa senha será usada no login de recepção junto com o
                      email informado acima.
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProfessional(false);
                      setEditingProfessional(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      isDark
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingProfessional ? "Salvar" : "Cadastrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Serviços */}
        {tab === "servicos" && (
          <div className="space-y-6">
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    Catálogo de Serviços
                  </h3>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Serviços importados da planilha e organizados por categoria
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    <Search
                      className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <input
                      type="text"
                      placeholder="Buscar serviço..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className={`bg-transparent border-none outline-none text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
                    />
                  </div>
                  <select
                    value={serviceCategoryFilter}
                    onChange={(e) => setServiceCategoryFilter(e.target.value)}
                    aria-label="Filtrar serviços por categoria"
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setNewService({
                        name: "",
                        categoryId: "",
                        price: 0,
                        durationMinutes: 30,
                      });
                      setShowAddService(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Serviço
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className={isDark ? "text-slate-400" : "text-slate-500"}
                    >
                      <th className="text-left p-3 font-medium">Nome</th>
                      <th className="text-left p-3 font-medium">Categoria</th>
                      <th className="text-left p-3 font-medium">Preço</th>
                      <th className="text-left p-3 font-medium">Duração</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
                      >
                        <td
                          className={`p-3 ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {s.name}
                        </td>
                        <td
                          className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {s.categoryName}
                        </td>
                        <td
                          className={`p-3 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          {formatCurrency(s.price)}
                        </td>
                        <td
                          className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {s.durationMinutes} min
                        </td>
                        <td
                          className={`p-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {s.isActive ? "Ativo" : "Inativo"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingService(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                isDark
                                  ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setServices((prev) =>
                                  prev.map((svc) =>
                                    svc.id === s.id
                                      ? { ...svc, isActive: !svc.isActive }
                                      : svc,
                                  ),
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                s.isActive
                                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                  : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                              }`}
                            >
                              {s.isActive ? (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Ativar
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredServices.length === 0 && (
                <p
                  className={`mt-4 text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}
                >
                  Nenhum serviço encontrado para os filtros selecionados.
                </p>
              )}
            </div>

            {/* Modais de Serviços */}
            {showAddService && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div
                  className={`w-full max-w-lg rounded-2xl p-6 shadow-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Novo Serviço
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddService();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        Nome do serviço
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) =>
                          setNewService({ ...newService, name: e.target.value })
                        }
                        placeholder="Ex: Limpeza de pele premium"
                        title="Nome do serviço"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          className={`text-sm font-medium ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          Categoria
                        </label>
                        <select
                          title="Selecione a categoria do serviço"
                          value={newService.categoryId}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              categoryId: e.target.value,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label
                          className={`text-sm font-medium ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          Preço
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={newService.price || ""}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              price: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor em reais"
                          title="Preço do serviço em reais"
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        Duração (minutos)
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={newService.durationMinutes || ""}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            durationMinutes: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="Duração em minutos"
                        title="Duração estimada do serviço em minutos"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddService(false)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Cadastrar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {editingService && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div
                  className={`w-full max-w-lg rounded-2xl p-6 shadow-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Editar Serviço
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateService();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        Nome do serviço
                      </label>
                      <input
                        type="text"
                        value={editingService.name}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nome do serviço"
                        title="Nome do serviço"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          className={`text-sm font-medium ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          Categoria
                        </label>
                        <select
                          title="Categoria do serviço"
                          value={editingService.categoryId}
                          onChange={(e) => {
                            const cat = categories.find(
                              (c) => c.id === e.target.value,
                            );
                            setEditingService({
                              ...editingService,
                              categoryId: e.target.value,
                              categoryName:
                                cat?.name ?? editingService.categoryName,
                            });
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label
                          className={`text-sm font-medium ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          Preço
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editingService.price || ""}
                          onChange={(e) =>
                            setEditingService({
                              ...editingService,
                              price: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor em reais"
                          title="Preço do serviço em reais"
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        Duração (minutos)
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={editingService.durationMinutes || ""}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            durationMinutes: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="Duração em minutos"
                        title="Duração estimada do serviço em minutos"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regras */}
        {tab === "regras" && (
          <div className="space-y-6">
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    Regras de Fidelidade
                  </h3>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Configure e acompanhe as regras que geram pontos, créditos e
                    brindes
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRulesHelp((prev) => !prev)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      isDark
                        ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Info className="h-3 w-3" />
                    Como funcionam as regras?
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewRule({
                      name: "",
                      description: "",
                      type: "VALUE_ACCUMULATION",
                      thresholdValue: 0,
                      rewardType: "DISCOUNT_PERCENT",
                      rewardValue: 0,
                      validityDays: 30,
                      categoryId: "",
                    });
                    setShowAddRule(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nova Regra
                </button>
              </div>
              {showRulesHelp && (
                <div
                  className={`mb-6 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200"
                      : "border-amber-100 bg-amber-50 text-slate-800"
                  }`}
                >
                  <p className="font-semibold mb-1">
                    Como configurar boas regras:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <span className="font-medium">Acúmulo por valor:</span>{" "}
                      defina um valor mínimo gasto (gatilho) para liberar um
                      desconto ou crédito.
                    </li>
                    <li>
                      <span className="font-medium">
                        Acúmulo por quantidade:
                      </span>{" "}
                      ideal para combos do tipo &quot;a cada 10 sessões, ganhe 1
                      grátis&quot;.
                    </li>
                    <li>
                      <span className="font-medium">Tipo de recompensa:</span>{" "}
                      escolha se o benefício será desconto em reais, desconto em
                      %, serviço grátis ou crédito em carteira.
                    </li>
                    <li>
                      <span className="font-medium">Validade:</span> use a
                      validade em dias para estimular o resgate dentro de um
                      período saudável.
                    </li>
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    {rules.length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Regras cadastradas
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {rules.filter((r) => r.isActive).length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Regras ativas
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  >
                    {rules.filter((r) => !r.isActive).length}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Regras pausadas
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? "bg-slate-800/60 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {rule.name}
                        </p>
                        <p
                          className={`text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {rule.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isDark
                                ? "bg-slate-700 text-slate-200"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            Tipo: {rule.type}
                          </span>
                          {rule.thresholdValue && (
                            <span
                              className={`px-2 py-1 rounded-full ${
                                isDark
                                  ? "bg-slate-700 text-slate-200"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              Gatilho: {formatCurrency(rule.thresholdValue)}
                            </span>
                          )}
                          {rule.thresholdQuantity && (
                            <span
                              className={`px-2 py-1 rounded-full ${
                                isDark
                                  ? "bg-slate-700 text-slate-200"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              Quantidade: {rule.thresholdQuantity}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isDark
                                ? "bg-slate-700 text-slate-200"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            Recompensa: {rule.rewardType}
                            {rule.rewardValue
                              ? ` (${formatCurrency(rule.rewardValue)})`
                              : ""}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isDark
                                ? "bg-slate-700 text-slate-200"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            Validade: {rule.validityDays} dias
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            rule.isActive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-600/40 text-slate-200"
                          }`}
                        >
                          {rule.isActive ? "Ativa" : "Pausada"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingRule(rule)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            isDark
                              ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <Edit2 className="h-3 w-3" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRule(rule.id)}
                          className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            rule.isActive
                              ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          }`}
                        >
                          {rule.isActive ? (
                            <>
                              <EyeOff className="h-3 w-3" /> Pausar
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" /> Ativar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Modais de Regras */}
            {showAddRule && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div
                  className={`w-full max-w-xl rounded-2xl p-6 shadow-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Nova Regra de Fidelidade
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddRule();
                    }}
                    className="space-y-4 text-sm"
                  >
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Nome
                      </label>
                      <input
                        type="text"
                        value={newRule.name}
                        onChange={(e) =>
                          setNewRule({ ...newRule, name: e.target.value })
                        }
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                        placeholder="Ex: R$ 1.000 em 90 dias = 10% de desconto"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Descrição
                      </label>
                      <textarea
                        value={newRule.description}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                        placeholder="Explique de forma simples quando o cliente ganha o benefício."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Tipo de regra
                        </label>
                        <select
                          title="Tipo de regra de fidelidade"
                          value={newRule.type}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              type: e.target.value as FidelityRule["type"],
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <option value="VALUE_ACCUMULATION">
                            Acúmulo por valor
                          </option>
                          <option value="QUANTITY_ACCUMULATION">
                            Acúmulo por quantidade
                          </option>
                          <option value="POINTS_CONVERSION">
                            Conversão de pontos
                          </option>
                          <option value="SERVICE_SPECIFIC">
                            Serviço específico
                          </option>
                          <option value="COMBO_VALUE">Combo / pacote</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Categoria (opcional)
                        </label>
                        <select
                          title="Categoria de serviços à qual a regra se aplica"
                          value={newRule.categoryId}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              categoryId: e.target.value,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <option value="">Todas as categorias</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Gatilho (valor mínimo)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={newRule.thresholdValue || ""}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              thresholdValue: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor mínimo gasto para aplicar a regra"
                          title="Valor mínimo gasto para que a regra seja aplicada"
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Tipo de recompensa
                        </label>
                        <select
                          title="Tipo de recompensa oferecida pela regra"
                          value={newRule.rewardType}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              rewardType: e.target
                                .value as FidelityRule["rewardType"],
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <option value="DISCOUNT_PERCENT">Desconto %</option>
                          <option value="DISCOUNT_FIXED">Desconto em R$</option>
                          <option value="FREE_SERVICE">Serviço grátis</option>
                          <option value="CREDIT">Crédito em carteira</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Valor da recompensa
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={newRule.rewardValue || ""}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              rewardValue: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor da recompensa (percentual ou em reais)"
                          title="Valor da recompensa (percentual ou em reais, conforme o tipo)"
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Validade (dias)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={newRule.validityDays || ""}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            validityDays: Number(e.target.value) || 1,
                          })
                        }
                        placeholder="Validade em dias"
                        title="Número de dias de validade da recompensa"
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRule(false)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Cadastrar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {editingRule && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div
                  className={`w-full max-w-xl rounded-2xl p-6 shadow-xl ${
                    isDark
                      ? "bg-slate-900 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Editar Regra
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateRule();
                    }}
                    className="space-y-4 text-sm"
                  >
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Nome
                      </label>
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nome da regra de fidelidade"
                        title="Nome da regra de fidelidade"
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Descrição
                      </label>
                      <textarea
                        value={editingRule.description}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Explique de forma simples quando o cliente ganha o benefício."
                        title="Descrição detalhada da regra de fidelidade"
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Gatilho (valor mínimo)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editingRule.thresholdValue || ""}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              thresholdValue: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor mínimo gasto para aplicar a regra"
                          title="Valor mínimo gasto para que a regra seja aplicada"
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Tipo de recompensa
                        </label>
                        <select
                          title="Tipo de recompensa oferecida pela regra"
                          value={editingRule.rewardType}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              rewardType: e.target
                                .value as FidelityRule["rewardType"],
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <option value="DISCOUNT_PERCENT">Desconto %</option>
                          <option value="DISCOUNT_FIXED">Desconto em R$</option>
                          <option value="FREE_SERVICE">Serviço grátis</option>
                          <option value="CREDIT">Crédito em carteira</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label
                          className={
                            isDark ? "text-slate-200" : "text-slate-700"
                          }
                        >
                          Valor da recompensa
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editingRule.rewardValue || ""}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              rewardValue: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Valor da recompensa (percentual ou em reais)"
                          title="Valor da recompensa (percentual ou em reais, conforme o tipo)"
                          className={`w-full rounded-lg border px-3 py-2 ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-50"
                              : "bg-white border-slate-300 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={isDark ? "text-slate-200" : "text-slate-700"}
                      >
                        Validade (dias)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={editingRule.validityDays || ""}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            validityDays: Number(e.target.value) || 1,
                          })
                        }
                        placeholder="Validade em dias"
                        title="Número de dias de validade da recompensa"
                        className={`w-full rounded-lg border px-3 py-2 ${
                          isDark
                            ? "bg-slate-800 border-slate-600 text-slate-50"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingRule(null)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Relatórios */}
        {tab === "relatorios" && (
          <div className="space-y-6">
            <div
              className={`rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                Exportar Relatórios
              </h3>
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Período (para agendamentos e resumo)
                </span>
                <div className="flex flex-col">
                  <label htmlFor="report-date-from" className="sr-only">Data Inicial do Relatório</label>
                  <input
                    id="report-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    title="Data inicial para relatórios"
                    placeholder="Data inicial"
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      isDark
                        ? "bg-slate-900 border-slate-700 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  até
                </span>
                <div className="flex flex-col">
                  <label htmlFor="report-date-to" className="sr-only">Data Final do Relatório</label>
                  <input
                    id="report-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    title="Data final para relatórios"
                    placeholder="Data final"
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      isDark
                        ? "bg-slate-900 border-slate-700 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
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
                  onClick={() =>
                    exportToCSV(
                      clients.map((c) => ({
                        Nome: c.name,
                        Telefone: c.phone,
                        Email: c.email || "",
                        Nascimento: c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : "",
                        Pontos: c.pointsBalance,
                        TotalGasto: c.totalSpent,
                        Visitas: c.totalAppointments,
                        UltimaVisita: c.lastVisit || "",
                      })),
                      "clientes",
                    )
                  }
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Users
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Clientes
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Lista completa com pontos e gastos
                  </p>
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
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Calendar
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Agendamentos
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Histórico de atendimentos
                  </p>
                </button>

                <button
                  onClick={() =>
                    exportToCSV(
                      rewards.map((r) => ({
                        Titulo: r.title,
                        Cliente:
                          clients.find((c) => c.id === r.clientId)?.name || "",
                        Status: r.status,
                        Expira: r.expiresAt,
                      })),
                      "recompensas",
                    )
                  }
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Gift
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Recompensas
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Brindes e status de resgate
                  </p>
                </button>

                <button
                  onClick={() => {
                    const availableRewards = rewards.filter(
                      (r) => r.status === "available",
                    );
                    const redeemedRewards = rewards.filter(
                      (r) => r.status === "redeemed",
                    );
                    const expiredRewards = rewards.filter(
                      (r) => r.status === "expired",
                    );

                    const getTipoRecompensa = (type: string) => {
                      if (type === "FREE_SERVICE") return "Serviço Grátis";
                      if (type === "DISCOUNT_FIXED") return "Desconto Fixo";
                      if (type === "DISCOUNT_PERCENT") return "Desconto %";
                      if (type === "CREDIT") return "Crédito";
                      return type;
                    };

                    const getValorRecompensa = (r: (typeof rewards)[0]) => {
                      if (r.type === "FREE_SERVICE")
                        return r.serviceName || "Serviço";
                      if (r.type === "DISCOUNT_PERCENT")
                        return `${r.value || 0}%`;
                      if (r.type === "DISCOUNT_FIXED" || r.type === "CREDIT")
                        return `R$ ${r.value || 0}`;
                      return "";
                    };

                    const reportData = [
                      ...availableRewards.map((r) => ({
                        Status: "DISPONÍVEL",
                        Cliente:
                          clients.find((c) => c.id === r.clientId)?.name || "",
                        Telefone:
                          clients.find((c) => c.id === r.clientId)?.phone || "",
                        Recompensa: r.title,
                        Tipo: getTipoRecompensa(r.type),
                        Valor: getValorRecompensa(r),
                        Expira: r.expiresAt,
                        DiasRestantes: Math.ceil(
                          (new Date(r.expiresAt).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      })),
                      ...redeemedRewards.map((r) => ({
                        Status: "RESGATADO",
                        Cliente:
                          clients.find((c) => c.id === r.clientId)?.name || "",
                        Telefone:
                          clients.find((c) => c.id === r.clientId)?.phone || "",
                        Recompensa: r.title,
                        Tipo: getTipoRecompensa(r.type),
                        Valor: getValorRecompensa(r),
                        Expira: r.expiresAt,
                        DiasRestantes: "Já utilizado",
                      })),
                      ...expiredRewards.map((r) => ({
                        Status: "EXPIRADO",
                        Cliente:
                          clients.find((c) => c.id === r.clientId)?.name || "",
                        Telefone:
                          clients.find((c) => c.id === r.clientId)?.phone || "",
                        Recompensa: r.title,
                        Tipo: getTipoRecompensa(r.type),
                        Valor: getValorRecompensa(r),
                        Expira: r.expiresAt,
                        DiasRestantes: "Expirado",
                      })),
                    ];

                    exportToCSV(reportData, "itens-fidelidade-detalhado");
                  }}
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Award
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Itens de Fidelidade
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Utilizados e disponíveis
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"}`}
                    >
                      {rewards.filter((r) => r.status === "available").length}{" "}
                      disponíveis
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"}`}
                    >
                      {rewards.filter((r) => r.status === "redeemed").length}{" "}
                      resgatados
                    </span>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const toastId = "export-reviews"; // Simples feedback visual se tivesse toast
                      document.body.style.cursor = "wait";
                      
                      const reportData = await getReviewsForReport();
                      
                      if (!reportData || reportData.length === 0) {
                        alert("Nenhuma avaliação encontrada para exportar.");
                        document.body.style.cursor = "default";
                        return;
                      }

                      const csvData = reportData.map((r) => ({
                        Cliente: r.clientName,
                        Telefone: r.clientPhone,
                        Nota: r.rating,
                        Comentario: r.comment || "",
                        Data: new Date(r.created_at).toLocaleString("pt-BR"),
                      }));

                      exportToCSV(csvData, "avaliacoes_completo");
                    } catch (error) {
                      console.error("Erro ao exportar avaliações:", error);
                      alert("Erro ao exportar avaliações. Tente novamente.");
                    } finally {
                      document.body.style.cursor = "default";
                    }
                  }}
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Star
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Avaliações
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Feedback dos clientes
                  </p>
                </button>

                <button
                  onClick={() =>
                    exportToCSV(
                      professionals.map((p) => ({
                        Nome: p.name,
                        Especialidade: p.specialty || "",
                        Avaliacao: p.rating,
                        Atendimentos: p.totalAppointments,
                        Status: p.isActive ? "Ativo" : "Inativo",
                      })),
                      "equipe",
                    )
                  }
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <UserPlus
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Equipe
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Profissionais e performance
                  </p>
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
                  className={`p-4 rounded-xl text-left ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <BarChart3
                    className={`h-8 w-8 mb-3 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Resumo Executivo
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    KPIs e métricas principais
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Usar Bônus */}
      {showRedeemModal && selectedClientForRedeem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md rounded-xl p-6 ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Usar Bônus - {selectedClientForRedeem.name}
              </h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className={isDark ? "text-slate-400" : "text-slate-500"}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {getClientAvailableRewards(selectedClientForRedeem.id).map(
                (reward) => (
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
                      value={reward.id}
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
                ),
              )}

              {getClientAvailableRewards(selectedClientForRedeem.id).length ===
                0 && (
                <p
                  className={`text-center py-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Nenhum bônus disponível para este cliente.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  isDark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleRedeemReward}
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
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  isDark,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isDark: boolean;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 ${isDark ? "bg-slate-800" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-800"}`}
          >
            {value}
          </p>
          {trend && (
            <p
              className={`text-xs mt-1 ${trendUp === true ? "text-emerald-500" : trendUp === false ? "text-red-500" : isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {trend}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${isDark ? "bg-slate-700" : "bg-amber-50"}`}
        >
          <Icon
            className={`h-6 w-6 ${isDark ? "text-amber-400" : "text-amber-600"}`}
          />
        </div>
      </div>
    </div>
  );
}
