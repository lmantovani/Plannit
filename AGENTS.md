# Plannit — Diretrizes e Contexto do Projeto (Antigravity)

Plataforma de gestão operacional para **Líder Móveis Planejados** (móveis planejados de alto padrão).
Desenvolvido por Leandro Mantovani em parceria comercial. Baseado no SRS v3.0 (23 módulos, 74 RFs, 18 RNs, 32 etapas de fluxo).

---

## 🛠️ Stack Tecnológica

- **Backend:** Python 3.11/3.12, FastAPI 0.111, PostgreSQL 18, SQLAlchemy 2.0, Alembic, JWT (jose) + bcrypt (passlib).
- **Frontend:** React 19, Vite 8, TailwindCSS 3, Zustand (persist), Axios, Lucide React, clsx, React Query (@tanstack/react-query).
- **Deploy:** Railway (monorepo: backend porta 8000, frontend nginx porta 80, PostgreSQL dedicado). Deploy automático a cada push na branch `main`.

---

## 🏛️ Estrutura do Repositório

```
lider-moveis/ (Plannit)
├── AGENTS.md                  ← Regras de workspace do Antigravity
├── CLAUDE.md                  ← Contexto legado do Claude Code
├── Makefile                   ← Comandos make dev, setup, backend, frontend, seed
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  ← auth, users, leads, briefings, dashboard, arquitetos, projetos, clientes, colaboradores
│   │   ├── core/              ← config (pydantic-settings), database, security (JWT/RBAC)
│   │   ├── models/            ← user, crm, projeto, fechamento, notificacao, colaborador
│   │   ├── schemas/           ← auth, crm, colaborador
│   │   ├── services/          ← briefing_score, wip_service, arquiteto_score
│   │   └── main.py            ← FastAPI app, CORS, rotas v1
│   ├── alembic/               ← Migrations (fonte de verdade: 94d29e691390)
│   └── seed.py                ← Popula dados e usuários de teste
├── frontend/
│   ├── src/
│   │   ├── components/        ← layout (AppLayout, Header, Sidebar), ui (index.jsx), especificadores
│   │   ├── lib/               ← api.js (Axios por módulo), constants.js
│   │   ├── pages/             ← auth, dashboard, crm, briefing, especificadores, colaboradores, PlaceholderPages
│   │   ├── store/             ← useAuthStore, useUIStore
│   │   └── styles/globals.css ← Design system (primary warm-gold, stone)
└── docs/                      ← Specs técnicas (docs/superpowers/specs/), planos e auditoria
```

---

## 🛡️ Regras de Negócio e Guardrails Inegociáveis

1. **RN001 — Qualificação de Leads:** Lead não pode avançar no funil sem qualificação registrada (`leads.py → qualificar()`).
2. **RN002 — Bloqueio de Briefing:** Briefing com score automático < 70 não pode ser enviado para a fila de projetos (`POST /briefings/{id}/enviar-para-fila`).
3. **RN003 — Limite WIP por Projetista:** Projetista não pode receber novo projeto se atingiu sua capacidade (`wip_service.pode_alocar`). Padrão: 3 projetos simultâneos.
4. **RN004 & RN005 — Aprovações de Render e Apresentação:** Render só avança com aprovação do vendedor; apresentação do projeto ao cliente só ocorre com render concluído.
5. **RN016 — Alerta de Estagnação:** Alerta disparado para projetos parados por mais de 5 dias na mesma fase (`dashboard.py`, `ProjetosPage.jsx`).
6. **RN017 — Preservação de Histórico e Soft Delete:**
   - **Projetos:** NUNCA deletados fisicamente; apenas arquivados (`arquivado=True`). Mudanças de status gravam histórico imutável em `HistoricoStatusProjeto` com autor e justificativa. Cancelamento exige observação obrigatória.
   - **Especificadores:** NUNCA deletados; desativados via `is_active=False` (`DELETE /arquitetos/{id}`). Histórico de alteração de consultor dono é imutável em `HistoricoDonoArquiteto`.
7. **RH-RN009 — Desligamento de Colaborador:** Colaborador nunca é deletado na rotina padrão, apenas desligado (`is_active=False` + data, motivo e entrevista de saída). Histórico salarial e de cargos são estritamente imutáveis (apenas `POST` em histórico próprio; `PUT /colaboradores/{id}` direto com alteração de salário ou cargo é rejeitado).
8. **RH-RN011 — Exceção Administrativa de Purga:** `DELETE /colaboradores/{id}` só é permitido para perfil `DIRETORIA` e EXCLUSIVAMENTE se o colaborador já estiver desligado (purga administrativa de cadastros errôneos).
9. **Cálculo de Score de Especificadores:** Calculado ESTRITAMENTE no backend (`app/services/arquiteto_score.py`) com os 3 pilares (RFV × Potencial × Lealdade). O frontend nunca envia nem recalcula este score.

---

## ⚠️ Armadilhas Técnicas e Invariantes do Código

### 1. Alembic é a Única Fonte da Verdade do Banco
- **NÃO use `Base.metadata.create_all()`** para gerenciar schema. O schema oficial parte da migration inicial `94d29e691390_schema_inicial_completo`.
- Ao alterar qualquer model em `app/models/`:
  1. Gere a revisão: `alembic revision --autogenerate -m "descricao"`
  2. **REVISE OBRIGATORIAMENTE** o arquivo em `alembic/versions/` para garantir que não existam comandos espúrios de `op.drop_table` ou `op.drop_column`.
  3. Execute `alembic upgrade head`.
- Se o banco apresentar erro de tipo existente (`DuplicateObject`), utilize `alembic stamp head` para sincronizar a base.

### 2. Ordem de Declaração de Rotas no FastAPI
- Rotas com caminhos fixos (ex: `/fila/lista`, `/wip/configuracoes`, `/departamentos`) DEVEM ser declaradas **ANTES** de rotas com parâmetros dinâmicos (ex: `/{id}`) para evitar captura indevida de URLs pelo roteador.

### 3. Datas e Fusos Horários
- NUNCA utilize `datetime.utcnow()` ou datetimes sem timezone para cálculos comparativos. Utilize sempre `datetime.now(timezone.utc)` para evitar erros de comparação `can't compare offset-naive and offset-aware datetimes`.

### 4. Serialização e Respostas da API
- Módulos legados utilizam serialização manual (dicionários / ORM direto). O módulo de `colaboradores` utiliza schemas Pydantic v2 (`response_model`). Mantenha a consistência do padrão local de cada módulo ao editá-lo.

### 5. Frontend & Design System
- Estilização com paleta `primary` (warm-gold) e `stone` (neutros).
- Tipografia: Playfair Display (display/títulos) e DM Sans (textos).
- Chamadas HTTP centralizadas no `lib/api.js`. Constantes de enums e status centralizadas em `lib/constants.js`.
- Autenticação e estado UI gerenciados via Zustand em `store/index.js`.
