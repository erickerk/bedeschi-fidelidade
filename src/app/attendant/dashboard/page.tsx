"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  mockClients,
  searchClients,
  searchServices,
  getClientById,
  getClientRewards,
  importedCategories,
  mockAppointments,
  mockReviews,
  type Client,
  type Appointment,
} from "@/lib/mock-data";
import { importedServices } from "@/lib/services-data";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

type View = "home" | "search" | "client" | "new-appointment" | "new-client" | "evaluate";

// Mock profissionais
const mockProfessionals = [
  { id: "prof-1", name: "Dra. Amanda", specialty: "Estética Facial" },
  { id: "prof-2", name: "Carla Santos", specialty: "Massagem" },
  { id: "prof-3", name: "Juliana Lima", specialty: "Depilação" },
  { id: "prof-4", name: "Patricia Alves", specialty: "Tratamento Corporal" },
];

// Gerar código OTP de 4 dígitos
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AttendantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lastAppointment, setLastAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(searchClients(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setView("client");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-800">
              Instituto Bedeschi
            </h1>
            <p className="text-xs text-slate-500">Olá, {user.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="sticky top-[60px] z-40 border-b border-slate-200 bg-white px-4 py-3">
        <Input
          placeholder="🔍 Buscar cliente (nome ou celular)..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full"
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {searchResults.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-800">{client.name}</p>
                  <p className="text-sm text-slate-500">{formatPhone(client.phone)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gold-600">{client.pointsBalance} pts</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <main className="p-4">
        {view === "home" && <HomeView onNewClient={() => setView("new-client")} />}
        {view === "client" && selectedClient && (
          <ClientView
            client={selectedClient}
            onBack={() => {
              setSelectedClient(null);
              setView("home");
            }}
            onNewAppointment={() => setView("new-appointment")}
          />
        )}
        {view === "new-appointment" && selectedClient && (
          <NewAppointmentView
            client={selectedClient}
            onBack={() => setView("client")}
            onSave={(appointment) => {
              setLastAppointment(appointment);
              setView("evaluate");
            }}
          />
        )}
        {view === "evaluate" && selectedClient && lastAppointment && (
          <EvaluateView
            client={selectedClient}
            appointment={lastAppointment}
            onBack={() => setView("client")}
            onComplete={() => {
              alert("Atendimento finalizado com sucesso!");
              setLastAppointment(null);
              setView("client");
            }}
          />
        )}
        {view === "new-client" && (
          <NewClientView
            onBack={() => setView("home")}
            onSave={(client) => {
              handleSelectClient(client);
            }}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white safe-bottom">
        <button
          onClick={() => setView("home")}
          className={`flex flex-col items-center gap-1 text-xs ${
            view === "home" ? "text-gold-600" : "text-slate-500"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span>Início</span>
        </button>
        <button
          onClick={() => setView("new-client")}
          className="flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-gold"
        >
          <span className="text-2xl">+</span>
        </button>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="flex flex-col items-center gap-1 text-xs text-slate-500"
        >
          <span className="text-xl">⚙️</span>
          <span>Admin</span>
        </button>
      </nav>
    </div>
  );
}

function HomeView({ onNewClient }: { onNewClient: () => void }) {
  const recentClients = mockClients.slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gold-600">{mockClients.length}</p>
          <p className="text-xs text-slate-500">Clientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gold-600">{importedServices.length}</p>
          <p className="text-xs text-slate-500">Serviços</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-800">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4" onClick={onNewClient}>
            <div className="text-center">
              <span className="text-2xl">👤</span>
              <p className="mt-1 text-sm">Novo Cliente</p>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <div className="text-center">
              <span className="text-2xl">📋</span>
              <p className="mt-1 text-sm">Novo Atendimento</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Clients */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-800">Clientes Recentes</h2>
        <div className="space-y-2">
          {recentClients.map((client) => (
            <Card key={client.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{client.name}</p>
                  <p className="text-xs text-slate-500">{formatPhone(client.phone)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gold-600">{client.pointsBalance} pts</p>
                  <p className="text-xs text-slate-400">
                    {client.lastVisit ? `Última visita: ${client.lastVisit}` : "Novo"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-800">Categorias ({importedCategories.length})</h2>
        <div className="flex flex-wrap gap-2">
          {importedCategories.slice(0, 10).map((cat) => (
            <span
              key={cat.id}
              className="rounded-full bg-gold-100 px-3 py-1 text-xs text-gold-700"
            >
              {cat.name} ({cat.servicesCount})
            </span>
          ))}
          {importedCategories.length > 10 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              +{importedCategories.length - 10} mais
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientView({
  client,
  onBack,
  onNewAppointment,
}: {
  client: Client;
  onBack: () => void;
  onNewAppointment: () => void;
}) {
  const rewards = getClientRewards(client.id).filter((r) => r.status === "available");

  return (
    <div className="space-y-4 pb-20">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600">
        <span>←</span> Voltar
      </button>

      {/* Client Info */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{client.name}</h2>
            <p className="text-slate-500">{formatPhone(client.phone)}</p>
            {client.email && <p className="text-sm text-slate-400">{client.email}</p>}
          </div>
          <Button variant="ghost" size="sm">Editar</Button>
        </div>
      </Card>

      {/* Points */}
      <Card premium className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gold-600">Pontos</p>
            <p className="text-3xl font-bold text-slate-800">{client.pointsBalance}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total gasto</p>
            <p className="font-semibold text-slate-700">{formatCurrency(client.totalSpent)}</p>
          </div>
        </div>
      </Card>

      {/* Rewards */}
      {rewards.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-slate-800">🎁 Recompensas ({rewards.length})</h3>
          <div className="space-y-2">
            {rewards.map((reward) => (
              <Card key={reward.id} className="p-3 border-gold-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{reward.title}</p>
                    <p className="text-xs text-slate-500">Válido até {reward.expiresAt}</p>
                  </div>
                  <Button size="sm">Resgatar</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onNewAppointment} className="w-full">
          Lançar Atendimento
        </Button>
        <Button variant="outline" className="w-full">
          Ver Histórico
        </Button>
      </div>
    </div>
  );
}

function NewAppointmentView({
  client,
  onBack,
  onSave,
}: {
  client: Client;
  onBack: () => void;
  onSave: (appointment: Appointment) => void;
}) {
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<typeof importedServices>([]);
  const [serviceResults, setServiceResults] = useState<typeof importedServices>([]);
  const [selectedProfessional, setSelectedProfessional] = useState("");

  const handleServiceSearch = (query: string) => {
    setServiceSearch(query);
    if (query.length >= 2) {
      setServiceResults(searchServices(query).slice(0, 10));
    } else {
      setServiceResults([]);
    }
  };

  const addService = (service: typeof importedServices[0]) => {
    if (!selectedServices.find((s) => s.id === service.id)) {
      setSelectedServices([...selectedServices, service]);
    }
    setServiceSearch("");
    setServiceResults([]);
  };

  const removeService = (id: string) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== id));
  };

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600">
        <span>←</span> Voltar
      </button>

      <h2 className="text-xl font-semibold text-slate-800">Novo Atendimento</h2>
      
      {/* Client */}
      <Card className="p-3 bg-slate-50">
        <p className="text-sm text-slate-500">Cliente</p>
        <p className="font-medium text-slate-800">{client.name}</p>
      </Card>

      {/* Service Search */}
      <div className="relative">
        <Input
          placeholder="Buscar serviço..."
          value={serviceSearch}
          onChange={(e) => handleServiceSearch(e.target.value)}
        />
        
        {serviceResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-10">
            {serviceResults.map((service) => (
              <button
                key={service.id}
                onClick={() => addService(service)}
                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.categoryName}</p>
                </div>
                <p className="text-sm font-medium text-gold-600">{formatCurrency(service.price)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Services */}
      {selectedServices.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Serviços selecionados</h3>
          <div className="space-y-2">
            {selectedServices.map((service) => (
              <Card key={service.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{service.name}</p>
                    <p className="text-xs text-slate-500">{service.categoryName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-slate-700">{formatCurrency(service.price)}</p>
                    <button
                      onClick={() => removeService(service.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <Card className="p-4 bg-slate-800 text-white">
        <div className="flex items-center justify-between">
          <p className="text-slate-300">Total</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>
        <p className="mt-1 text-sm text-gold-400">
          +{total} pontos para o cliente
        </p>
      </Card>

      {/* Profissional */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Profissional *</label>
        <select
          aria-label="Selecionar profissional"
          value={selectedProfessional}
          onChange={(e) => setSelectedProfessional(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
        >
          <option value="">Selecione o profissional...</option>
          {mockProfessionals.map((p) => (
            <option key={p.id} value={p.id}>{p.name} - {p.specialty}</option>
          ))}
        </select>
      </div>

      {/* Save */}
      <Button
        onClick={() => {
          if (!selectedProfessional) {
            alert("Selecione um profissional");
            return;
          }
          const appointment: Appointment = {
            id: `apt-${Date.now()}`,
            clientId: client.id,
            clientName: client.name,
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            services: selectedServices.map((s) => ({ name: s.name, price: s.price })),
            total,
            pointsEarned: total,
            status: "completed",
            hasReview: false,
          };
          mockAppointments.push(appointment);
          // Atualizar pontos do cliente
          const clientIndex = mockClients.findIndex((c) => c.id === client.id);
          if (clientIndex >= 0) {
            mockClients[clientIndex].pointsBalance += total;
            mockClients[clientIndex].totalSpent += total;
            mockClients[clientIndex].totalAppointments += 1;
            mockClients[clientIndex].lastVisit = appointment.date;
          }
          onSave(appointment);
        }}
        className="w-full"
        disabled={selectedServices.length === 0}
      >
        Salvar Atendimento
      </Button>
    </div>
  );
}

function EvaluateView({
  client,
  appointment,
  onBack,
  onComplete,
}: {
  client: Client;
  appointment: Appointment;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const clientOTP = generateOTP();
  
  // URL do app para o cliente
  const clientAccessUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/bedeschi?phone=${client.phone}&otp=${clientOTP}`;

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Selecione uma nota para a avaliação");
      return;
    }
    
    // Salvar avaliação
    mockReviews.push({
      id: `rev-${Date.now()}`,
      clientId: client.id,
      appointmentId: appointment.id,
      rating,
      comment: comment || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    });
    
    // Atualizar appointment como avaliado
    const aptIndex = mockAppointments.findIndex((a) => a.id === appointment.id);
    if (aptIndex >= 0) {
      mockAppointments[aptIndex].hasReview = true;
      mockAppointments[aptIndex].review = { rating, comment };
    }
    
    onComplete();
  };

  const handleSkipReview = () => {
    onComplete();
  };

  const whatsappMessage = `Olá ${client.name}! 🌟\n\nObrigado por visitar o Instituto Bedeschi!\n\nAcesse seu programa de fidelidade:\n${clientAccessUrl}\n\nSeu código de acesso: ${clientOTP}\n\nAtenciosamente,\nInstituto Bedeschi`;
  const whatsappUrl = `https://wa.me/55${client.phone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-4 pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600">
        <span>←</span> Voltar
      </button>

      <h2 className="text-xl font-semibold text-slate-800">Finalizar Atendimento</h2>

      {/* Resumo */}
      <Card className="p-4 bg-green-50 border-green-200">
        <p className="text-sm text-green-600 font-medium">✅ Atendimento registrado!</p>
        <p className="mt-1 text-slate-700">{client.name}</p>
        <p className="text-sm text-slate-500">{appointment.services.map((s) => s.name).join(", ")}</p>
        <p className="mt-2 font-semibold text-green-700">{formatCurrency(appointment.total)} • +{appointment.pointsEarned} pontos</p>
      </Card>

      {/* Avaliação */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3">⭐ Avaliação do Atendimento</h3>
        <p className="text-sm text-slate-500 mb-3">Como o cliente avalia o atendimento?</p>
        
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-3xl transition-transform hover:scale-110 ${
                star <= rating ? "text-gold-500" : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        
        <Input
          label="Comentário (opcional)"
          placeholder="O cliente disse algo sobre o atendimento?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Card>

      {/* WhatsApp */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3">📱 Enviar Acesso via WhatsApp</h3>
        <p className="text-sm text-slate-500 mb-3">
          Envie o link de acesso ao programa de fidelidade para o cliente consultar seus pontos.
        </p>
        
        <Button 
          variant="outline" 
          className="w-full mb-3"
          onClick={() => setShowWhatsApp(!showWhatsApp)}
        >
          {showWhatsApp ? "Ocultar QR Code" : "Ver QR Code e Link"}
        </Button>

        {showWhatsApp && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg shadow">
                <QRCodeSVG value={clientAccessUrl} size={150} />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Código de acesso do cliente:</p>
              <p className="text-2xl font-mono font-bold text-gold-600">{clientOTP}</p>
            </div>
            
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span className="text-xl">📲</span>
              Enviar via WhatsApp
            </a>
          </div>
        )}
      </Card>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleSkipReview}>
          Pular Avaliação
        </Button>
        <Button onClick={handleSubmitReview}>
          Salvar Avaliação
        </Button>
      </div>
    </div>
  );
}

function NewClientView({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (client: Client) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Celular inválido");
      return;
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      email: email || undefined,
      pointsBalance: 0,
      totalSpent: 0,
      totalAppointments: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Em produção, salvaria no banco
    mockClients.push(newClient);
    onSave(newClient);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600">
        <span>←</span> Voltar
      </button>

      <h2 className="text-xl font-semibold text-slate-800">Novo Cliente</h2>

      <Input
        label="Nome *"
        placeholder="Nome completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <Input
        label="Celular *"
        type="tel"
        placeholder="(11) 99999-9999"
        value={phone}
        onChange={(e) => {
          let v = e.target.value.replace(/\D/g, "");
          if (v.length > 11) v = v.slice(0, 11);
          if (v.length > 6) {
            v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
          } else if (v.length > 2) {
            v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
          }
          setPhone(v);
        }}
      />

      <Input
        label="Email (opcional)"
        type="email"
        placeholder="email@exemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} className="w-full">
        Cadastrar Cliente
      </Button>
    </div>
  );
}
