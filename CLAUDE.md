# Plannit — Contexto Completo para Claude Code

## Sobre o Projeto
Plataforma de gestão operacional para **Líder Móveis Planejados** (móveis planejados de alto padrão).
Desenvolvido por Leandro Mantovani em parceria comercial. Baseado no SRS v3.0 (23 módulos, 74 RFs, 18 RNs, 32 etapas de fluxo).
Projeto em desenvolvimento ativo — Claude Code é o co-piloto principal.

## Stack Tecnológica
- **Backend:** Python 3.11 (Homebrew), FastAPI 0.111, PostgreSQL 18, SQLAlchemy 2.0, Alembic, JWT/bcrypt
- **Frontend:** React 19, Vite 8, TailwindCSS 3, Zustand, Axios, Lucide React, clsx
- **Deploy:** Railway (backend + frontend + PostgreSQL como serviços separados)
- **OS:** macOS, PyCharm (backend), VS Code (frontend)

## URLs de Produção (Railway)
- **Frontend:** https://plannit-frontend-production.up.railway.app
- **Backend API:** https://plannit-production.up.railway.app
- **Credenciais demo:** admin@plannit.com.br / Admin@123456

## Decisões de Arquitetura
- **Railway** escolhido para fase demo/evolução; migração para **AWS EC2** planejada quando virar negócio real
- **Drag-and-drop no Kanban** intencionalmente fora do escopo — mudança de status é feita pelo drawer do card
- Ambiente de demo: dados são de teste, sem valor real. Ao virar produto: rotacionar SECRET_KEY, trocar senhas e mover credenciais para variáveis de ambiente seguras

## Estrutura de Pastas
```
lider-moveis/                    ← raiz do projeto
├── CLAUDE.md                    ← este arquivo
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── __init__.py      ← registra todos os routers
│   │   │   └── endpoints/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── leads.py
│   │   │       ├── briefings.py
│   │   │       ├── dashboard.py
│   │   │       ├── arquitetos.py  ← módulo arquitetos completo
│   │   │       ├── projetos.py    ← módulo projetos completo
│   │   │       └── clientes.py    ← CRUD básico clientes
│   │   ├── core/
│   │   │   ├── config.py        ← pydantic-settings, extra="ignore"
│   │   │   ├── database.py      ← SQLAlchemy engine
│   │   │   └── security.py      ← JWT, bcrypt, require_roles()
│   │   ├── models/
│   │   │   ├── __init__.py      ← importa todos os models
│   │   │   ├── user.py          ← User, PerfilUsuario (14 perfis)
│   │   │   ├── crm.py           ← Lead, Cliente, Arquiteto, DecisorArquiteto
│   │   │   ├── projeto.py       ← Projeto, Briefing, FilaProjeto, ConfigWIP, HistoricoStatus
│   │   │   ├── fechamento.py    ← ProjetoComercial, Fechamento, Parcela, Handoff
│   │   │   └── notificacao.py   ← Notificacao, TipoNotificacao (inclui RN019-RN022)
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── crm.py
│   │   │   └── arquiteto.py     ← schemas Pydantic v2 do módulo arquitetos
│   │   ├── services/
│   │   │   ├── briefing_score.py    ← score 0-100, 10 critérios
│   │   │   ├── wip_service.py       ← WIP limit por projetista
│   │   │   └── arquiteto_score.py   ← RFV × Potencial × Lealdade
│   │   └── main.py
│   ├── alembic/
│   ├── seed.py                  ← cria tabelas + usuários + dados de teste
│   ├── requirements.txt
│   ├── .python-version          ← "3.12" (exigido pelo Railway)
│   ├── Dockerfile
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── App.jsx              ← rotas: /dashboard /crm /projetos /arquitetos
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── layout/          ← AppLayout, Sidebar, Header, AuthGuard
    │   │   └── ui/index.jsx     ← KpiCard, Modal, ConfirmDialog, StatusBadge, Tabs, ScoreBar, etc.
    │   ├── lib/
    │   │   ├── api.js           ← axios + APIs por módulo (authApi, leadsApi, projetosApi, etc.)
    │   │   └── constants.js     ← STATUS_CONFIG (32 status), formatCurrency, timeAgo
    │   ├── pages/
    │   │   ├── auth/LoginPage.jsx
    │   │   ├── dashboard/DashboardPage.jsx
    │   │   ├── crm/CRMPage.jsx
    │   │   ├── projetos/ProjetosPage.jsx      ← Kanban + Lista + Fila WIP
    │   │   ├── arquitetos/ArquitetosPage.jsx  ← score RFV, flags, decisores
    │   │   └── PlaceholderPages.jsx           ← módulos futuros sinalizados
    │   ├── store/index.js       ← useAuthStore (persist) + useUIStore
    │   └── styles/globals.css   ← design system completo
    ├── Dockerfile               ← multi-stage: build React + nginx
    ├── nginx.conf               ← SPA routing (try_files → index.html) + /health
    └── railway.toml
```

## Módulos Implementados ✅

### Backend
- **Auth:** JWT 8h, 14 perfis (PerfilUsuario enum), require_roles() dependency
- **CRM/Leads:** CRUD + interações + qualificar/perder + histórico
- **Briefing:** formulário + score automático (10 critérios, max 100pts) + envio para fila
- **Projetos:** fila WIP, kanban por fase, mudança status com histórico imutável, alocação gestor, flag estratégico
- **Arquitetos:** score RFV × Potencial × Lealdade, 7 segmentos, 4 flags, decisores multi-contato
- **Dashboard:** KPIs gerenciais, funil leads, projetos ativos, KPIs de carteira de arquitetos
- **Clientes:** CRUD básico

### Frontend
- **Login:** dark, branding Líder Móveis
- **Dashboard:** KPIs + funil + tabela projetos + auto-refresh 60s
- **CRM:** Kanban + Lista + Drawer + histórico interações
- **Projetos:** Kanban (5 fases) + Lista + Fila WIP + Drawer (Detalhes/Status/Histórico)
- **Arquitetos:** grid + flags + drawer 3 abas (Perfil/Score/Decisores)

## Módulos Pendentes (MVP Fase 1) ⏳
1. **Briefing frontend** — formulário com score em tempo real (backend já existe)
2. **Fechamento + Handoff** — checklist 8 itens, contrato, bloqueios RN006 (model já existe em fechamento.py)
3. **Financeiro básico** — parcelas, aprovação cadastro, bloqueios RN011
4. **Gestão Documental** — centralização arquivos com versionamento

## Regras de Negócio Implementadas
| RN | Descrição | Implementado em |
|----|-----------|-----------------|
| RN001 | Lead não avança sem qualificação | leads.py → qualificar() |
| RN002 | Briefing bloqueado se score < 70 | briefings.py → enviar_para_fila() |
| RN003 | WIP limit por projetista | wip_service.py + projetos.py → alocar_projetista() |
| RN004 | Render só após aprovação vendedor | projetos.py → mudar_status() |
| RN005 | Apresentação só após render concluído | projetos.py → mudar_status() |
| RN016 | Alerta projeto parado > 5 dias | dashboard.py, ProjetosPage.jsx |
| RN017 | Projetos nunca deletados, só arquivados; histórico imutável | projetos.py → arquivar(), HistoricoStatusProjeto |
| RN019-022 | Notificações módulo arquitetos | tipos criados em notificacao.py (motor pendente Fase 2) |

## Módulo Arquitetos — regras específicas
- Score calculado SEMPRE no backend (services/arquiteto_score.py) — frontend NUNCA envia score_combinado
- 7 dimensões (1-5 cada): RFV (Recência, Frequência, Valor) + P×L (Obras Ativas, Ticket, Exclusividade, Risco Concorrência)
- Sub-scores: score_rfv (máx 15), score_potencial (máx 10), score_lealdade (máx 10)
- Recência (R) atualizada automaticamente pela ultima_interacao_em do lead vinculado (US-04)
- 7 segmentos: diamante_ativo, diamante_em_risco, ouro_ativo, promessa_prioritaria, potencial_nao_ativado, fiel_em_declinio, qualificacao_pendente
- 4 flags: estrategico, risco_perda, vip, reativacao
- Decisores nunca deletados — desativados com ativo=False (alinhado RN017)
- Vendedor vê apenas sua carteira (filtro automático por consultor_id)

## Módulo Projetos — fluxo de status
- Transições seguem fluxo linear do SRS (32 etapas) — mapa PROXIMOS_STATUS em ProjetosPage.jsx
- Kanban agrupa status por fase: Comercial → Apresentação → Técnico → Produção → Montagem
- Toda mudança de status registra em HistoricoStatusProjeto (imutável, com autor e observação)
- Cancelamento exige observação obrigatória
- Código gerado automaticamente: PROJ-ANO-NNN (ex: PROJ-2025-001)
- Projetista/Vendedor veem apenas seus projetos; gestores veem todos

## Padrões de Código

### Backend
- Endpoints usam serialização manual (dict), não response_model Pydantic
- `require_roles(*perfis)` como dependency para controle de acesso
- `get_current_user` para rotas autenticadas sem restrição de perfil
- Migrations via Alembic — rodar após qualquer alteração de model
- `model_config = {"env_file": ".env", "extra": "ignore"}` no config.py
- IMPORTANTE FastAPI: rotas fixas (ex: /fila/lista, /wip/configuracoes) declaradas ANTES de rotas dinâmicas (/{id}) para evitar conflito de matching

### Frontend
- Componentes de página em `pages/<modulo>/<ModuloPage>.jsx`
- Componentes UI reutilizáveis em `components/ui/index.jsx`
- Todas as chamadas API em `lib/api.js` agrupadas por módulo (Ex: `projetosApi.list()`)
- Design system: cores `primary` (warm-gold), `stone` (neutros)
- Fontes: Playfair Display (display/títulos) + DM Sans (corpo)
- Animações: `animate-fade-in`, `animate-slide-in-right` via globals.css
- Classes utilitárias custom: `.card`, `.card-hover`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.kanban-col`, `.kanban-card`, `.kpi-card`, `.badge-*`, `.table-base`

## Deploy no Railway (fluxo e lições)
- Deploy é AUTOMÁTICO a cada `git push origin main` — nada a fazer no painel
- Monorepo: cada serviço tem Root Directory próprio (`backend` e `frontend`)
- Backend roda na porta 8000, frontend (nginx) na porta 80 — configurar variável PORT em cada serviço
- O seed NÃO roda automaticamente no deploy: rodar `python seed.py` via Console do Railway,
  e somente DEPOIS do banco PostgreSQL existir (rodar antes causa crash)
- Alterar FIRST_ADMIN_PASSWORD nas Variables NÃO troca a senha de usuário já criado —
  a variável só é usada na primeira execução do seed
- /docs desabilitado em produção (DEBUG=false) — comportamento esperado, não é bug
- Após alterar models: rodar migration também no Railway (Console → alembic upgrade head)
- Build do frontend: VITE_API_URL é injetada em BUILD TIME (ARG no Dockerfile) — mudar a variável exige redeploy

## Variáveis de Ambiente

### Backend (.env local)
```
DATABASE_URL=postgresql://postgres:861401@localhost:5432/plannit
SECRET_KEY=7f3d2a1e8b4c9f6d0e5a2b7c4d1f8e3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
FIRST_ADMIN_EMAIL=admin@plannit.com.br
FIRST_ADMIN_PASSWORD=Admin@123456
FIRST_ADMIN_NAME=Administrador
```
Nota: credenciais de ambiente de desenvolvimento/demo, sem dados reais.
Ao migrar para produto real (AWS): rotacionar SECRET_KEY e senhas.

### Frontend (.env local)
```
VITE_API_URL=http://localhost:8000/api/v1
```

### Railway (produção)
Mesmas variáveis do backend, com:
- DATABASE_URL apontando para o PostgreSQL do Railway
- APP_ENV=production, DEBUG=false
- ALLOWED_ORIGINS=["https://plannit-frontend-production.up.railway.app"]
- PORT=8000 (backend) / PORT=80 (frontend)
- Frontend: VITE_API_URL=https://plannit-production.up.railway.app/api/v1

## Credenciais de Teste (após seed.py)
| Perfil | E-mail | Senha |
|--------|--------|-------|
| Diretoria | admin@plannit.com.br | Admin@123456 |
| Vendedor | vendedor@lidermoveis.com.br | Teste@123 |
| Gerente | gerente@lidermoveis.com.br | Teste@123 |
| Projetista | projetista@lidermoveis.com.br | Teste@123 |
| Conferente | conferente@lidermoveis.com.br | Teste@123 |

## Lições Aprendidas (problemas já resolvidos)
- `pydantic-settings` requer `extra="ignore"` para ignorar variáveis extras do .env
- `ALLOWED_ORIGINS` no .env precisa ser JSON array: `["http://..."]`
- `bcrypt==4.0.1` separado do `passlib==1.7.4` no requirements.txt
- `.python-version` com valor `3.12` necessário para Railway (Railpack auto-seleciona 3.13 que quebra pydantic-core)
- PostgreSQL PATH no Mac: `/Library/PostgreSQL/18/bin/`
- Python 3.14 local é incompatível com psycopg2 — usar Python 3.11 (Homebrew)
- Claude Code instalado via npm em ~/.npm-global — PATH configurado no ~/.zshrc
- Após alterar models, sempre rodar: `alembic revision --autogenerate -m "descricao"` e `alembic upgrade head`

## Como Rodar Localmente
```bash
# Backend (PyCharm)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Acesse: http://localhost:8000/docs

# Frontend (VS Code)
cd frontend
npm run dev
# Acesse: http://localhost:5173

# Seed (popular banco)
cd backend && python seed.py
```

## Como Trabalhar Neste Projeto (para novos colaboradores)
1. Clone o repo e leia este CLAUDE.md por completo
2. Configure os .env conforme seção acima
3. Rode o seed para popular o banco local
4. Use Claude Code na RAIZ do projeto (lider-moveis/) — não dentro de backend/ ou frontend/
5. Toda decisão importante (nova RN, mudança de arquitetura, problema resolvido) deve ser
   registrada NESTE arquivo e commitada — este arquivo é a memória compartilhada do projeto
6. git push origin main = deploy automático no Railway (~3-5 min)
