# API Specification - Bedeschi Fidelidade

## 1. Visão Geral

**Base URL:** `https://api.bedeschi.fidelidade.com.br/v1`  
**Autenticação:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## 2. Autenticação

### 2.1 Login Staff (Email/Senha)

```http
POST /auth/login
```

**Request:**
```json
{
  "email": "atendente@bedeschi.com.br",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Julia Atendente",
      "email": "atendente@bedeschi.com.br",
      "role": "attendant",
      "tenant": {
        "id": "uuid",
        "name": "Instituto Bedeschi",
        "slug": "bedeschi"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-01-03T18:00:00Z"
  }
}
```

### 2.2 Enviar OTP (Cliente)

```http
POST /auth/otp/send
```

**Request:**
```json
{
  "tenantSlug": "bedeschi",
  "phone": "11999999999"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sent": true,
    "expiresIn": 300,
    "method": "whatsapp"
  }
}
```

### 2.3 Verificar OTP (Cliente)

```http
POST /auth/otp/verify
```

**Request:**
```json
{
  "tenantSlug": "bedeschi",
  "phone": "11999999999",
  "code": "1234"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "name": "Maria Silva",
      "phone": "11999999999"
    },
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-01-03T12:30:00Z"
  }
}
```

---

## 3. Clientes

### 3.1 Buscar Cliente

```http
GET /clients/search?q={query}
```

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `q` - Busca por nome ou telefone
- `limit` - Máximo de resultados (default: 10)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "name": "Maria Silva",
        "phone": "11999999999",
        "pointsBalance": 1250,
        "lastVisit": "2025-12-28",
        "availableRewards": 1
      }
    ],
    "total": 1
  }
}
```

### 3.2 Criar Cliente

```http
POST /clients
```

**Request:**
```json
{
  "name": "Maria Silva",
  "phone": "11999999999",
  "email": "maria@email.com",
  "birthDate": "1985-05-15",
  "document": "12345678901",
  "consentAccepted": true
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "name": "Maria Silva",
      "phone": "11999999999",
      "email": "maria@email.com",
      "createdAt": "2026-01-03T10:00:00Z"
    }
  }
}
```

### 3.3 Detalhes do Cliente

```http
GET /clients/{clientId}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "name": "Maria Silva",
      "phone": "11999999999",
      "email": "maria@email.com",
      "birthDate": "1985-05-15",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "summary": {
      "pointsBalance": 1250,
      "totalAppointments": 15,
      "totalSpent": 2850.00,
      "lastVisit": "2025-12-28",
      "avgRating": 4.8
    },
    "categoryAccumulation": [
      {
        "categoryId": "uuid",
        "categoryName": "Massagem",
        "totalSpent": 850.00,
        "threshold": 1000.00,
        "progress": 85
      }
    ],
    "availableRewards": [
      {
        "id": "uuid",
        "title": "1 Limpeza de Pele GRÁTIS",
        "type": "FREE_SERVICE",
        "expiresAt": "2026-01-15T23:59:59Z"
      }
    ],
    "pendingReview": {
      "appointmentId": "uuid",
      "date": "2025-12-28",
      "services": ["Massagem Relaxante 60min"]
    }
  }
}
```

### 3.4 Histórico do Cliente

```http
GET /clients/{clientId}/appointments
```

**Query Params:**
- `page` - Página (default: 1)
- `limit` - Itens por página (default: 10)
- `startDate` - Data inicial
- `endDate` - Data final

**Response 200:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "date": "2025-12-28",
        "services": [
          {
            "name": "Massagem Relaxante 60min",
            "price": 180.00
          }
        ],
        "total": 180.00,
        "pointsEarned": 180,
        "review": {
          "rating": 5,
          "comment": "Excelente!"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

## 4. Atendimentos

### 4.1 Criar Atendimento

```http
POST /appointments
```

**Request:**
```json
{
  "clientId": "uuid",
  "appointmentDate": "2026-01-03",
  "appointmentTime": "14:30",
  "items": [
    {
      "serviceId": "uuid",
      "quantity": 1,
      "unitPrice": 180.00,
      "discount": 0
    },
    {
      "serviceId": "uuid",
      "quantity": 1,
      "unitPrice": 120.00,
      "discount": 0
    }
  ],
  "paymentMethod": "pix",
  "notes": "Cliente VIP"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "uuid",
      "clientId": "uuid",
      "date": "2026-01-03",
      "time": "14:30",
      "subtotal": 300.00,
      "discount": 0,
      "total": 300.00,
      "status": "completed"
    },
    "pointsEarned": 300,
    "newBalance": 1550,
    "earnedRewards": [
      {
        "id": "uuid",
        "title": "1 Massagem Relaxante GRÁTIS",
        "type": "FREE_SERVICE",
        "message": "Parabéns! Você ganhou uma massagem grátis por atingir R$ 1.000 gastos em Massagem!"
      }
    ]
  }
}
```

### 4.2 Listar Atendimentos (Atendente)

```http
GET /appointments
```

**Query Params:**
- `date` - Data específica
- `startDate` / `endDate` - Range
- `clientId` - Filtro por cliente
- `status` - Filtro por status

**Response 200:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "client": {
          "id": "uuid",
          "name": "Maria Silva",
          "phone": "11999999999"
        },
        "date": "2026-01-03",
        "time": "14:30",
        "total": 300.00,
        "status": "completed",
        "hasReview": false
      }
    ],
    "pagination": {
      "page": 1,
      "total": 25
    }
  }
}
```

---

## 5. Serviços

### 5.1 Listar Serviços

```http
GET /services
```

**Query Params:**
- `categoryId` - Filtro por categoria
- `search` - Busca por nome/código
- `active` - Apenas ativos (default: true)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "externalCode": "001",
        "name": "Massagem Relaxante 60min",
        "category": {
          "id": "uuid",
          "name": "Massagem"
        },
        "price": 180.00,
        "durationMinutes": 60,
        "isActive": true
      }
    ],
    "total": 303
  }
}
```

### 5.2 Importar Serviços (XLSX)

```http
POST /services/import
Content-Type: multipart/form-data
```

**Request:**
- `file` - Arquivo XLSX

**Response 200:**
```json
{
  "success": true,
  "data": {
    "imported": 280,
    "updated": 20,
    "errors": 3,
    "errorDetails": [
      {
        "row": 45,
        "code": "ABC123",
        "error": "Categoria não encontrada"
      }
    ]
  }
}
```

### 5.3 Listar Categorias

```http
GET /categories
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Massagem",
        "slug": "massagem",
        "servicesCount": 25,
        "isActive": true
      },
      {
        "id": "uuid",
        "name": "Limpeza de Pele",
        "slug": "limpeza-pele",
        "servicesCount": 10,
        "isActive": true
      }
    ]
  }
}
```

---

## 6. Pontos

### 6.1 Transações de Pontos

```http
GET /clients/{clientId}/points
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "balance": 1550,
    "transactions": [
      {
        "id": "uuid",
        "type": "EARN_APPOINTMENT",
        "amount": 300,
        "balanceAfter": 1550,
        "description": "Atendimento #123",
        "createdAt": "2026-01-03T14:30:00Z"
      },
      {
        "id": "uuid",
        "type": "REDEEM",
        "amount": -500,
        "balanceAfter": 1250,
        "description": "Resgate de crédito R$ 50",
        "createdAt": "2025-12-20T10:00:00Z"
      }
    ]
  }
}
```

### 6.2 Ajuste Manual de Pontos (Admin)

```http
POST /clients/{clientId}/points/adjust
```

**Request:**
```json
{
  "amount": 100,
  "type": "add",
  "reason": "Compensação por erro no atendimento anterior"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "ADJUST_ADD",
      "amount": 100,
      "balanceAfter": 1650
    },
    "auditId": "uuid"
  }
}
```

---

## 7. Recompensas

### 7.1 Listar Recompensas do Cliente

```http
GET /clients/{clientId}/rewards
```

**Query Params:**
- `status` - available, redeemed, expired, all

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "uuid",
        "title": "1 Limpeza de Pele GRÁTIS",
        "description": "Conquistado por acúmulo em Facial",
        "type": "FREE_SERVICE",
        "service": {
          "id": "uuid",
          "name": "Limpeza de Pele Profunda"
        },
        "status": "available",
        "expiresAt": "2026-01-15T23:59:59Z",
        "daysRemaining": 12
      }
    ]
  }
}
```

### 7.2 Resgatar Recompensa

```http
POST /rewards/{rewardId}/redeem
```

**Request:**
```json
{
  "appointmentId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reward": {
      "id": "uuid",
      "status": "redeemed",
      "redeemedAt": "2026-01-03T15:00:00Z"
    },
    "message": "Recompensa resgatada com sucesso!"
  }
}
```

---

## 8. Avaliações

### 8.1 Obter Avaliação Pendente

```http
GET /clients/{clientId}/pending-review
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "hasPending": true,
    "appointment": {
      "id": "uuid",
      "date": "2025-12-28",
      "services": [
        {
          "id": "uuid",
          "name": "Massagem Relaxante 60min"
        }
      ],
      "attendant": {
        "id": "uuid",
        "name": "Julia"
      }
    },
    "expiresAt": "2026-01-27T23:59:59Z"
  }
}
```

### 8.2 Enviar Avaliação

```http
POST /reviews
```

**Request:**
```json
{
  "appointmentId": "uuid",
  "rating": 5,
  "comment": "Atendimento excelente, muito profissional!",
  "serviceRatings": [
    {
      "serviceId": "uuid",
      "rating": 5
    }
  ],
  "attendantRating": 5
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "uuid",
      "rating": 5,
      "createdAt": "2026-01-03T15:30:00Z"
    },
    "message": "Obrigado pela sua avaliação!"
  }
}
```

### 8.3 Pular Avaliação

```http
POST /reviews/skip
```

**Request:**
```json
{
  "appointmentId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "skipped": true,
    "remindAt": "2026-01-04T12:00:00Z"
  }
}
```

---

## 9. Regras de Fidelidade (Admin)

### 9.1 Listar Regras

```http
GET /admin/fidelity-rules
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "uuid",
        "name": "Massagem Grátis por Acúmulo",
        "description": "A cada R$ 1.000 em Massagem, ganha 1 sessão grátis",
        "type": "VALUE_ACCUMULATION",
        "trigger": {
          "categoryId": "uuid",
          "categoryName": "Massagem",
          "thresholdValue": 1000.00
        },
        "reward": {
          "type": "FREE_SERVICE",
          "serviceName": "Massagem Relaxante 60min",
          "validityDays": 60
        },
        "isActive": true,
        "timesTriggered": 45
      }
    ]
  }
}
```

### 9.2 Criar Regra

```http
POST /admin/fidelity-rules
```

**Request:**
```json
{
  "name": "Massagem Grátis por Acúmulo",
  "description": "A cada R$ 1.000 em Massagem, ganha 1 sessão grátis",
  "ruleType": "VALUE_ACCUMULATION",
  "triggerConfig": {
    "categoryId": "uuid",
    "thresholdValue": 1000.00
  },
  "rewardConfig": {
    "type": "FREE_SERVICE",
    "serviceId": "uuid",
    "validityDays": 60
  },
  "resetAfterReward": true,
  "isActive": true
}
```

---

## 10. Dashboard (Admin)

### 10.1 KPIs

```http
GET /admin/dashboard/kpis
```

**Query Params:**
- `period` - today, week, month, year, custom
- `startDate` / `endDate` - Para custom

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-01-03"
    },
    "kpis": {
      "activeClients": 150,
      "activeClientsChange": 5.2,
      "newClients": 12,
      "totalRevenue": 15250.00,
      "revenueChange": 8.5,
      "appointmentsCount": 45,
      "avgTicket": 338.89,
      "pointsIssued": 15250,
      "pointsRedeemed": 2500,
      "rewardsIssued": 8,
      "rewardsRedeemed": 5,
      "avgRating": 4.7,
      "reviewsCount": 38
    }
  }
}
```

### 10.2 Relatório de Serviços

```http
GET /admin/reports/services
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "serviceId": "uuid",
        "serviceName": "Massagem Relaxante 60min",
        "categoryName": "Massagem",
        "totalAppointments": 120,
        "totalRevenue": 21600.00,
        "avgRating": 4.8,
        "reviewsCount": 95
      }
    ]
  }
}
```

---

## 11. Erros

### Formato Padrão de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "phone",
        "message": "Telefone inválido"
      }
    ],
    "correlationId": "uuid"
  }
}
```

### Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| `VALIDATION_ERROR` | 400 | Dados inválidos |
| `UNAUTHORIZED` | 401 | Não autenticado |
| `FORBIDDEN` | 403 | Sem permissão |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `CONFLICT` | 409 | Conflito (ex: cliente já existe) |
| `RATE_LIMITED` | 429 | Muitas requisições |
| `OTP_INVALID` | 400 | Código OTP inválido |
| `OTP_EXPIRED` | 400 | Código OTP expirado |
| `REWARD_EXPIRED` | 400 | Recompensa expirada |
| `REWARD_ALREADY_REDEEMED` | 400 | Já resgatada |

---

## 12. Webhooks (Futuro)

### Eventos Disponíveis

- `appointment.created`
- `appointment.updated`
- `reward.earned`
- `reward.expiring` (3 dias antes)
- `review.received`

### Payload Exemplo

```json
{
  "event": "reward.earned",
  "timestamp": "2026-01-03T15:00:00Z",
  "data": {
    "clientId": "uuid",
    "clientName": "Maria Silva",
    "clientPhone": "11999999999",
    "reward": {
      "id": "uuid",
      "title": "1 Massagem Grátis",
      "expiresAt": "2026-03-03T23:59:59Z"
    }
  }
}
```

---

## 13. Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `POST /auth/otp/send` | 5/min por IP |
| `POST /auth/otp/verify` | 10/min por IP |
| `GET /clients/*` | 100/min por user |
| `POST /appointments` | 30/min por user |
| `POST /admin/*` | 60/min por user |

**Headers de Resposta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704293400
```

---

*API versionada - Breaking changes apenas em major versions*
