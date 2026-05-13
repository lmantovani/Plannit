# 🛋️ Lider Móveis — Plataforma Operacional

Plataforma de Gestão Operacional para Móveis Planejados de Alto Padrão  
Baseado no SRS v3.0 — 23 módulos · 74 RFs · 18 RNs

---

## 🏗️ Estrutura do Projeto

```
lider-moveis/
├── backend/                    # FastAPI + Python
│   ├── app/
│   │   ├── api/v1/endpoints/   # Rotas da API
│   │   │   ├── auth.py         # Login / JWT
│   │   │   ├── users.py        # Gestão de usuários (14 perfis)
│   │   │   ├── leads.py        # CRM + Pipeline
│   │   │   ├── briefings.py    # Formulário inteligente + score
│   │   │   └── dashboard.py    # KPIs em tempo real
│   │   ├── core/
│   │   │   ├── config.py       # Configurações
│   │   │   ├── database.py     # SQLAlchemy + PostgreSQL
│   │   │   └── security.py     # JWT + controle de perfis
│   │   ├── models/             # Entidades do banco
│   │   │   ├── user.py         # 14 perfis do SRS
│   │   │   ├── crm.py          # Lead, Cliente, Arquiteto
│   │   │   ├── projeto.py      # Projeto, Briefing, Fila, WIP
│   │   │   └── fechamento.py   # Contrato, Parcelas, Handoff
│   │   ├── schemas/            # Validação Pydantic
│   │   └── services/
│   │       ├── briefing_score.py  # Cálculo de score (RF009)
│   │       └── wip_service.py     # Controle WIP limit (RN003)
│   ├── alembic/                # Migrations
│   ├── seed.py                 # Dados iniciais + usuários de teste
│   ├── requirements.txt
│   └── .env.example
└── frontend/                   # React + TailwindCSS (próxima etapa)
```

---

## 🚀 Setup — Passo a Passo

### 1. Pré-requisitos

```bash
# Python 3.11+
python --version

# PostgreSQL rodando local
# Criar banco:
psql -U postgres -c "CREATE DATABASE lider_moveis;"
```

### 2. Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com sua senha do PostgreSQL e gere um SECRET_KEY

# Criar tabelas e dados iniciais
python seed.py

# Rodar o servidor
uvicorn app.main:app --reload --port 8000
```

### 3. Gerar SECRET_KEY segura

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Cole o resultado no campo `SECRET_KEY` do seu `.env`.

---

## 📖 Documentação da API

Com o servidor rodando, acesse:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🔑 Credenciais de Teste (após seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Diretoria (admin) | admin@lidermoveis.com.br | Admin@123456 |
| Vendedor | vendedor@lidermoveis.com.br | Teste@123 |
| Gerente Comercial | gerente@lidermoveis.com.br | Teste@123 |
| Projetista | projetista@lidermoveis.com.br | Teste@123 |
| Conferente | conferente@lidermoveis.com.br | Teste@123 |

---

## 🔐 Autenticação

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lidermoveis.com.br", "password": "Admin@123456"}'

# Usar token retornado:
# Authorization: Bearer <token>
```

---

## 📋 Endpoints do MVP (Fase 1)

### Auth
- `POST /api/v1/auth/login` — Login
- `GET /api/v1/auth/me` — Usuário logado

### CRM / Leads
- `GET /api/v1/leads/` — Pipeline de leads
- `POST /api/v1/leads/` — Cadastrar lead
- `POST /api/v1/leads/{id}/qualificar` — Qualificar lead (RN001)
- `POST /api/v1/leads/{id}/perder` — Marcar perdido com motivo (RF004)
- `GET /api/v1/leads/{id}/interacoes` — Histórico de interações
- `POST /api/v1/leads/{id}/interacoes` — Registrar interação

### Briefing
- `POST /api/v1/briefings/calcular-score` — Score em tempo real (RF009)
- `POST /api/v1/briefings/` — Salvar rascunho
- `POST /api/v1/briefings/{id}/enviar-para-fila` — Enviar (bloqueia se score < 70)

### Dashboard
- `GET /api/v1/dashboard/gestor` — KPIs gerenciais (US001)
- `GET /api/v1/dashboard/comercial` — KPIs comerciais
- `GET /api/v1/dashboard/projetos-ativos` — Lista com alertas

### Usuários
- `GET /api/v1/users/` — Listar equipe
- `POST /api/v1/users/` — Criar usuário
- `GET /api/v1/users/projetistas/disponibilidade` — WIP por projetista

---

## 🧠 Regras de Negócio Implementadas

| RN | Descrição | Onde |
|----|-----------|------|
| RN001 | Lead não avança sem qualificação | `leads.py → qualificar()` |
| RN002 | Briefing bloqueado se score < 70 | `briefings.py → enviar_para_fila()` |
| RN003 | WIP limit por projetista | `wip_service.py` |
| RN016 | Alerta projeto parado > 5 dias | `dashboard.py` |
| RN017 | Projetos nunca deletados (só arquivados) | `models/projeto.py` |

---

## 🗺️ Próximas Etapas

- [ ] **Frontend React** — UI do dashboard + pipeline Kanban
- [ ] **Projetos endpoint** — Fila com WIP, alocação, versionamento
- [ ] **Fechamento + Handoff** — Checklist, contrato, bloqueios RN006
- [ ] **Notificações** — Motor de alertas automáticos
- [ ] **Migrations Alembic** — Versionamento do schema

---

*SRS v3.0 · MVP Fase 1 · 2025*
