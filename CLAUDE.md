# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Plannit — Contexto Completo para Claude Code

## Sobre o Projeto
Plataforma de gestão operacional para **Líder Móveis Planejados** (móveis planejados de alto padrão).
Desenvolvido por Leandro Mantovani em parceria comercial. Baseado no SRS v3.0 (23 módulos, 74 RFs, 18 RNs, 32 etapas de fluxo).
Projeto em desenvolvimento ativo — Claude Code é o co-piloto principal.

## Estado do repositório
- **`plannit/` — sistema principal.** Monólito AdonisJS v7 + Inertia.js (React 19 + TypeScript). Todo código novo vai aqui.
- **`backend/` + `frontend/` — legado** (FastAPI + React SPA), substituído pelo monólito. Só consulta ou correção pontual; ver a seção "Legado" no fim deste arquivo.
- O monólito nasceu na branch `feature/adonis-migration` e ainda não tem deploy configurado (sem Dockerfile nem `railway.toml` em `plannit/`). Até isso existir e chegar à `main`, o que roda no Railway é o legado.
- Abra o Claude Code na **raiz** do repositório. Os comandos do monólito rodam dentro de `plannit/`; o `Makefile` da raiz tem atalhos `make adonis-*` e `make db-*`.

## Stack (`plannit/`)
AdonisJS v7 · Lucid ORM · VineJS · `@adonisjs/auth` (sessão) · Inertia.js + React 19 + TypeScript · Vite · TailwindCSS 3 · lucide-react · sonner (toasts) · Luxon · PostgreSQL 16 (Docker) · Japa (testes). Node >= 24.

## Comandos
```bash
make db-up                      # (na raiz) PostgreSQL 16 no Docker: container plannit-postgres, postgres/postgres, banco plannit
cd plannit
cp -n .env.example .env && node ace generate:key   # primeira vez
node ace migration:run          # aplica migrations E regenera database/schema.ts
node ace db:seed                # todos os seeders (idempotentes; cada um garante os usuários de que precisa)
node ace db:seed --files database/seeders/arquiteto_seeder.ts
npm run dev                     # http://localhost:3333 (HMR + polling)
npm run typecheck               # tsc do servidor + tsc de inertia/tsconfig.json
npm run lint                    # npm run format para prettier
npm run build && node --env-file=.env build/bin/server.js

# Testes Japa (suites unit / functional / browser — hoje só existe tests/functional/)
node ace test functional
node ace test functional --files=tests/functional/configuracoes_and_qualificacao.spec.ts
node ace test --tests="bloqueia acesso de perfil vendedor em /configuracoes com 403"
```
- Os testes Japa rodam contra o **mesmo banco de desenvolvimento**: `.env.test` só sobrescreve `SESSION_DRIVER=memory` e `tests/bootstrap.ts` não faz truncate nem rollback, então os testes gravam registros reais.
- `scripts/test_*.js` são scripts Node avulsos (`node scripts/test_http_crm.js`), não Japa. Os `test_http_*` exigem `npm run dev` rodando em `localhost:3333` e os usuários do seed; os demais acessam o Postgres direto via `pg` (`postgresql://postgres:postgres@localhost:5432/plannit`).
- Antes de concluir uma mudança: `npm run typecheck` (precisa ficar com 0 erros) e, se mexeu em fluxo de módulo, o `scripts/test_http_<modulo>.js` correspondente.

## Credenciais de teste (após `node ace db:seed`)
| Perfil | E-mail | Senha |
|--------|--------|-------|
| Diretoria | admin@plannit.com.br | Admin@123456 |
| Gerente Comercial | gerente@lidermoveis.com.br | Teste@123 |
| Vendedor | vendedor@lidermoveis.com.br | Teste@123 |
| Projetista | projetista@lidermoveis.com.br | Teste@123 |
| Conferente | conferente@lidermoveis.com.br | Teste@123 |

Não há usuário `RH` no seed — use o admin para o módulo Colaboradores.

## Arquitetura do monólito
- **Sem API REST separada:** as rotas em `start/routes.ts` são URLs de página (`/crm`, `/especificadores/:id`...), não `/api/v1`. GET → `inertia.render('<modulo>/index', props)`. Mutação → validator VineJS (`app/validators/`) → `session.flash('success' | 'error', msg)` → `response.redirect().back()`.
- **JSON paralelo:** vários controllers têm um helper privado `wantsJson()`. Quando a requisição não é Inertia (`X-Inertia` ausente) e pede `application/json` ou `?format=json`, respondem JSON em vez de redirect. Bloqueios de RN devolvem um `code` (ex.: `RN005_RENDER_NAO_CONCLUIDO`, `RN006_HANDOFF_INCOMPLETO`). Os scripts `test_http_*` dependem disso.
- **Flash → toast:** `app/middleware/inertia_middleware.ts` (`flash()`) só repassa as chaves `error` e `success`, exibidas como toast em `layouts/app_layout.tsx` e `layouts/default.tsx`. Flash com outra chave (`'erro'` em `briefings_controller.ts`, `'info'` em `fechamentos_controller.ts`/`clientes_controller.ts`) é descartado silenciosamente.
- **Controllers auto-registrados:** `routes.ts` usa `controllers.X` de `#generated/controllers`, gerado em `.adonisjs/` pelo hook `indexEntities` do `adonisrc.ts` (no dev server e no build). Nunca editar `.adonisjs/`. Imports internos usam os aliases `#models/*`, `#validators/*`, `#services/*` etc. do `package.json`.
- **Ordem de rotas:** caminhos fixos (`especificadores/kpis`, `colaboradores/departamentos`, `wip/configuracoes`) declarados ANTES dos com `:id` em `start/routes.ts`.
- **Schema gerado:** `database/schema.ts` é regenerado pelo `migration:run` a partir do banco — NÃO editar. Os models estendem essas classes (`class Arquiteto extends ArquitetoSchema`) e acrescentam relações, getters computados, enums e mapas `*_LABELS`. Mudar coluna = nova migration (`node ace make:migration`) + `migration:run`. Só redeclarar `@column` no model para sobrescrever comportamento (ex.: `jsonPrepareConsume` nas colunas JSON de `lead.ts`, `briefing.ts`, `handoff.ts`).
- **Auth e perfis:** sessão por cookie (não JWT). O grupo principal de rotas usa `middleware.auth()`. `middleware.role([PerfilUsuario...])` protege grupos de rotas (hoje só Configurações). Os demais controllers checam o perfil internamente com helpers privados (`isGestor`, `isAuthorized`, `isDiretoria`), que também aceitam `isSuperuser`. `User.hasRole()` sempre retorna `true` para `isSuperuser` ou `DIRETORIA`. `PerfilUsuario` (`app/models/user.ts`) tem 15 valores (inclui `RH` e `CLIENTE`) e define `PERFIS_GESTAO` (Diretoria + Gerente Comercial).
- **Isolamento por perfil** é feito na query do controller: vendedor vê só os seus leads/projetos (`vendedor_id`), projetista só os seus projetos (`projetista_id`).
- **Frontend:** `inertia.render('crm/index')` resolve `inertia/pages/crm/index.tsx`. Cada página se envolve em `layouts/app_layout.tsx` (sidebar/header, menu definido no próprio arquivo); `default.tsx` é aplicado automaticamente a todas. Componentes de módulo ficam em `pages/<modulo>/components/` e tipos em `pages/<modulo>/types.ts`. Mutações usam `router.post/patch` ou `useForm` do `@inertiajs/react`. As props compartilhadas (`user`, `errors`) vêm de `inertia_middleware.ts → share()`. Alias `~/` → `inertia/`.
- **Serviços de domínio** em `app/services/`: `arquiteto_score_service.ts`, `briefing_score_service.ts`, `wip_service.ts`. O score de briefing tem espelho client-side em `inertia/lib/briefing_constants.ts` (`calcularScoreBriefingClient`) para o preview em tempo real — alterar os dois juntos. O score de especificador é só backend.
- **Datas:** Luxon com `DateTime.now().toUTC()` (`TZ=UTC` no `.env`).
- **Transações:** fluxos com várias escritas (histórico imutável + mudança de estado) usam `db.transaction(async (trx) => ...)` + `model.useTransaction(trx)` / `{ client: trx }` (ver `fechamentos_controller.ts`, `reatribuirDono` em `arquitetos_controller.ts`).
- **Design system:** `tailwind.config.js` (paleta `primary` warm-gold + `stone`, fontes Playfair Display/DM Sans, animações `fade-in`/`slide-up`) e classes em `inertia/css/app.css` (`.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.badge`, `.table-base`, `.kanban-col`, `.kanban-card`, `.kpi-card`, `.nav-item`).
- **Manual do usuário:** servido pelo próprio app em `/manual/index.html` (`plannit/public/manual/`); fonte em `docs/manual/`.

## Módulos do monólito
| Rota | Controller | Observação |
|------|-----------|------------|
| `/dashboard` | `dashboard_controller.ts` | KPIs, alerta RN016 |
| `/crm` | `leads_controller.ts` | Kanban com drag-and-drop + lista, qualificação estruturada, histórico de status do lead |
| `/clientes` | `clientes_controller.ts` | Ficha, endereços, aprovação cadastral (Diretoria/Gerente/Financeiro), conversão de lead |
| `/briefings` | `briefings_controller.ts` | Cria o projeto e o briefing; score; envio para fila |
| `/fila` | `fila_controller.ts` | Kanban de 4 colunas + monitor de WIP |
| `/projetos` | `projetos_controller.ts` | Lista, detalhe, mudança de status, versões 3D/render, arquivamento |
| `/projetos/:id/fechamento` | `fechamentos_controller.ts` | Contrato, parcelas (liquidação), handoff de 8 itens |
| `/especificadores` | `arquitetos_controller.ts` | Score, decisores, concorrentes, interações, dono, metas |
| `/colaboradores` | `colaboradores_controller.ts` | RH01 |
| `/configuracoes` | `configuracoes_controller.ts` | Catálogos de ambientes, origens e campanhas (só Diretoria/Gerente) |

**Pendentes:** Conferência e Montagem (desabilitados na sidebar), Financeiro além de parcelas, Gestão Documental, motor de notificações (RN019-RN022 — não há model de notificação no monólito), RH02-RH11 e o deploy do monólito.

## Decisões de Arquitetura
- **Railway** escolhido para fase demo/evolução; migração para **AWS EC2** planejada quando virar negócio real.
- **Drag-and-drop:** existe no Kanban do CRM (muda o status do lead). Em Projetos, a mudança de status é feita pela página de detalhe (`projetos/show.tsx`), sem drag-and-drop.
- Ambiente de demo: dados de teste, sem valor real. Ao virar produto: rotacionar `APP_KEY`, trocar senhas e mover credenciais para variáveis de ambiente seguras.

## Regras de Negócio
| RN | Descrição | Onde está no monólito |
|----|-----------|-----------------------|
| RN001 | Lead não avança sem qualificação (faixa de orçamento, prazo, tipo de imóvel, ambientes) | `leads_controller.ts → qualificar`; bloqueios em `briefings_controller.ts → store` e `clientes_controller.ts → converterLead` |
| RN002 | Briefing bloqueado para a fila se score < `scoreMinimo` (padrão 70) | `briefings_controller.ts → enviarParaFila`, `briefing_score_service.ts` |
| RN003 | WIP limit por projetista (padrão 3, configurável em `config_wip_projetistas`) | `wip_service.ts`, `fila_controller.ts → alocar` |
| RN004 | Render só após aprovação do vendedor; devolução exige motivo | `projetos_controller.ts → avaliarVersao3D` |
| RN005 | Apresentação/fechamento só com versão comercial aprovada ou finalizada | `projetos_controller.ts → mudarStatus` |
| RN006 | Etapas técnicas (de `contato_conf` até `em_montagem`) só com handoff completo (8 itens de `ITENS_OBRIGATORIOS_HANDOFF`) | `projetos_controller.ts → mudarStatus`, `fechamentos_controller.ts → salvarHandoff`, `app/models/handoff.ts` |
| RN016 | Alerta de projeto parado > 5 dias | `dashboard_controller.ts`, `projetos/index.tsx` |
| RN017 | Nada de exclusão física de projeto/especificador; históricos imutáveis | `HistoricoStatusProjeto`, `HistoricoStatusLead`, `HistoricoDonoArquiteto`; `projetos_controller.ts → arquivar` |
| RH-RN009 / RH-RN011 | Colaborador só é desligado; exclusão definitiva só pela Diretoria e só se já desligado | `colaboradores_controller.ts` |
| RN019-022 | Notificações do módulo Especificadores | não portado |

## Módulo Projetos — fluxo de status
- `StatusProjeto` (`app/models/projeto.ts`) tem as 32 etapas do SRS + `cancelado`. O projeto nasce em `em_briefing` ao criar o briefing.
- `mudarStatus` aceita qualquer status do enum (a página de detalhe oferece todos). Não há mapa de transições lineares como no legado — as únicas travas são RN005, RN006 e projeto arquivado.
- Toda mudança de status grava `HistoricoStatusProjeto` (autor + observação) na mesma transação. A observação é opcional em `mudarStatus`; o arquivamento (`arquivar`) exige motivo e grava `cancelado` no histórico.
- Código gerado em `briefings_controller.ts`: **`PRJ-ANO-NNN`** (ex.: `PRJ-2026-001`). Os seeders usam códigos fixos `PROJ-2026-*`.
- Vendedor e projetista veem só os seus projetos; gestores veem todos.

## Módulo Especificadores
- Nome do módulo é **Especificadores** (rota `/especificadores`, `inertia/pages/especificadores/`). Model, tabela (`arquitetos`) e controller (`arquitetos_controller.ts`) mantêm o nome histórico "Arquiteto".
- `TipoEspecificador`: `arquiteto`, `designer_interiores`, `decorador`, `engenheiro`, `corretor`, `outro`. Campos: nome, escritorio, `enderecoEscritorio`, telefone, email, `nivelParceria`, `especialidade`, tipo, `statusCarteira`. `Cliente`, `Lead` e `Projeto` têm `arquitetoId` opcional.
- **Score calculado SEMPRE no backend** (`arquiteto_score_service.ts → calcularScoreArquiteto`); o frontend só consome. Score = média de 3 pilares (RFV, Potencial, Lealdade), cada um 0-100:
  - RFV: recência (dias desde o último projeto), frequência (projetos nos últimos 12 meses), valor (soma de contratos nos últimos 12 meses)
  - Potencial: leads ativos + projetos em andamento não arquivados
  - Lealdade: tempo de parceria, consistência (meses com projeto no último ano), taxa de conversão de leads (padrão neutro 50%)
- 7 segmentos em cascata (a primeira condição verdadeira vence): `inativo`, `novo_promissor` (< 90 dias de cadastro), `em_risco`, `campeao` (score >= 85), `parceiro_fiel`, `em_ascensao`, `ocasional`.
- 5 flags: `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando` (em risco + dono definido + > 30 dias sem interação).
- Risco de concorrência separado do score: maior `% de fechamento estimado` entre os concorrentes (< 30 baixo, 30-60 médio, > 60 alto).
- Dono da carteira: `consultorId`. Reatribuição (`PATCH /especificadores/:id/dono`) só por gestor, gravando `HistoricoDonoArquiteto` na mesma transação. **Não há notificação** ao novo consultor (diferente do legado).
- Soft delete (`DELETE /especificadores/:id` → `isActive = false`), permitido ao gestor ou ao consultor dono. Decisores e concorrentes SÃO hard-deletados (`.delete()`) — divergência com o padrão RN017 herdada do legado.
- Interações (`TipoInteracaoArquiteto`, 9 tipos): `ligacao`, `whatsapp`, `email`, `visita_escritorio`, `visita_loja`, `reuniao`, `evento`, `viagem`, `envio_brinde`.
- Metas de visita: `MetaVisitasConsultor` (meta mensal por consultor, `PUT /especificadores/metas-visitas`); o vendedor só pode definir a própria, o gestor define de qualquer um. `GET /especificadores/metas-visitas/me` e `GET /especificadores/kpis` (ativos, % de venda com especificador no mês/ano, atendimentos e visitas ao escritório no mês).
- **Visibilidade:** a listagem mostra a carteira inteira também para o vendedor; o filtro por `consultorId` é opcional (o legado restringia o vendedor à própria carteira).

## Módulo Colaboradores (RH01 — Cadastro do Colaborador)
- Primeiro de 11 submódulos de um SRS de RH/Departamento Pessoal (RH01-RH11); os demais (RH02 Comissões, RH03 Férias e Afastamentos, RH04 Acordos e Ajustes, RH05 Avaliação de Desempenho + PDI, RH06-RH11) ainda não têm spec e serão especificados um de cada vez. Spec do RH01: `docs/superpowers/specs/2026-07-26-colaboradores-rh01-design.md`.
- Acesso só para `RH`, `DIRETORIA` e superusuário (`isAuthorized` no controller).
- `Colaborador` tem `userId` opcional; `Departamento` e `Cargo` são cadastros próprios, sem unicidade de nome.
- Contato pessoal/corporativo para telefone e e-mail. DISC como par `perfilDiscPrimario`/`perfilDiscSecundario` (validado por enum no VineJS: `dominante`, `influente`, `estavel`, `cauteloso`) + `observacoesComportamentais`.
- Documentos só com URL (não há infra de upload). Dados bancários sem criptografia (ambiente demo).
- Histórico salarial e de cargo imutáveis: só `POST` em `historico-salarial`/`historico-cargo`. `PUT/PATCH /colaboradores/:id` rejeita `salarioClt`/`cargoId` no corpo.
- `gestorId` (organograma) validado contra auto-referência.
- **RH-RN009:** colaborador nunca é excluído na rotina, só desligado (`POST /colaboradores/:id/desligar`).
- **RH-RN011 (exceção deliberada):** `DELETE /colaboradores/:id` só para Diretoria e só se já desligado — purga administrativa de cadastro errado. Apaga em cascata históricos e documentos e zera o `gestor_id` dos subordinados. Não desativa o `User` vinculado.

## Como Trabalhar Neste Projeto
1. Clone o repo e leia este CLAUDE.md por completo.
2. Suba o banco (`make db-up`), configure `plannit/.env`, rode migrations e seed.
3. Use o Claude Code na RAIZ do projeto.
4. Toda decisão importante (nova RN, mudança de arquitetura, problema resolvido) deve ser registrada NESTE arquivo e commitada — este arquivo é a memória compartilhada do projeto.
5. **Antes de escrever código em qualquer branch, dê `git pull` e confira se `main` não avançou** — já aconteceu de uma branch (`feature/arch`, PR #4) ficar semanas desatualizada em relação a um trabalho feito em paralelo em `main`, gerando conflitos de desenho e uma migration que apagaria tabelas reais.
6. Outros documentos: `AGENTS.md` (instruções para o Antigravity, ainda descreve o legado); `PROJECT.md`, `TEST_INFRA.md`, `TEST_READY.md`, `WALKTHROUGH.md` e `.agents/` são relatórios de execuções multi-agente de fases da migração; `docs/superpowers/` tem specs e planos (a maioria escrita para o legado, mas as regras de domínio continuam válidas).

---

## Legado: `backend/` (FastAPI) + `frontend/` (React SPA)
Substituído pelo monólito; mantido para consulta e enquanto for o que roda em produção. Não adicionar funcionalidades aqui.

### Stack e estrutura
- **Backend:** Python 3.11/3.12, FastAPI 0.111, SQLAlchemy 2.0, Alembic, JWT (8h) + bcrypt. Endpoints em `backend/app/api/v1/endpoints/` (prefixo `/api/v1`; Especificadores em `/arquitetos`), models em `app/models/`, schemas Pydantic em `app/schemas/`, serviços em `app/services/` (`briefing_score.py`, `wip_service.py`, `arquiteto_score.py`). Controle de acesso com a dependency `require_roles(*perfis)`; serialização manual em dict (exceto Colaboradores, que usa `response_model`).
- **Frontend:** React 19 + Vite + Zustand + Axios. Chamadas agrupadas por módulo em `frontend/src/lib/api.js`, constantes em `lib/constants.js`, páginas em `src/pages/<modulo>/`, store em `src/store/index.js`.

### Comandos
```bash
make setup                      # cria venv + npm install
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000   # /docs só com DEBUG=true
cd frontend && npm run dev      # http://localhost:5173
cd backend && python seed.py    # popula usuários e dados de teste
cd backend && ./venv/bin/pytest                         # SQLite em memória (tests/conftest.py)
./venv/bin/pytest tests/test_leads.py::nome_do_teste    # um teste
```

### Variáveis de ambiente (dev/demo, sem dados reais)
```
# backend/.env
DATABASE_URL=postgresql://postgres:861401@localhost:5432/plannit
SECRET_KEY=7f3d2a1e8b4c9f6d0e5a2b7c4d1f8e3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]   # precisa ser JSON array
FIRST_ADMIN_EMAIL=admin@plannit.com.br
FIRST_ADMIN_PASSWORD=Admin@123456
FIRST_ADMIN_NAME=Administrador
# frontend/.env
VITE_API_URL=http://localhost:8000/api/v1
```

### Deploy no Railway (legado)
- URLs: frontend https://plannit-frontend-production.up.railway.app · API https://plannit-production.up.railway.app
- Deploy automático a cada `git push origin main`. Monorepo com Root Directory `backend` (porta 8000) e `frontend` (nginx, porta 80) — variável `PORT` em cada serviço.
- Produção: `APP_ENV=production`, `DEBUG=false` (por isso `/docs` fica desabilitado), `ALLOWED_ORIGINS=["https://plannit-frontend-production.up.railway.app"]`, `VITE_API_URL=https://plannit-production.up.railway.app/api/v1`.
- `VITE_API_URL` é injetada em BUILD TIME (ARG no Dockerfile) — mudar exige redeploy.
- O seed não roda no deploy: `python seed.py` pelo Console do Railway, só depois do Postgres existir. Mudar `FIRST_ADMIN_PASSWORD` não troca a senha de um usuário já criado.

### Alembic (legado)
- Fonte de verdade do schema desde a migration `94d29e691390_schema_inicial_completo` (2026-07-28); `Base.metadata.create_all()` no `seed.py` é obsoleto.
- Fluxo: alterar model → `alembic revision --autogenerate -m "..."` → **revisar o arquivo em busca de `op.drop_table`/`op.drop_column` inesperados** (sintoma de autogenerate contra models desatualizados) → commit → no Railway, `alembic upgrade head`.
- Banco que já tinha tabelas criadas por `create_all()`: rodar `alembic stamp head` uma vez. `DuplicateObject: type "X" already exists` no `upgrade` é esse caso — resolver com `stamp`, nunca apagando tabelas.
- A branch `feature/arch` (PR #4) tinha um desenho antigo e descartado de Especificadores (`TipoArquiteto`, `vendedor_id`, `FuncionarioArquiteto`) e uma migration que apagaria as tabelas de RH — nunca aplicar.

### Lições de ambiente (legado)
- `pydantic-settings` precisa de `extra="ignore"`; `bcrypt==4.0.1` separado de `passlib==1.7.4`.
- `.python-version` = `3.12` no Railway (o Railpack escolhe 3.13, que quebra o pydantic-core). Python 3.13+/3.14 não tem wheel de `psycopg2-binary==2.9.9`.
- macOS: PostgreSQL em `/Library/PostgreSQL/18/bin/`.
- Windows: com o Postgres em locale pt-BR, o psycopg2 lança `UnicodeDecodeError` antes de mostrar o erro real (geralmente senha errada) — usar `psycopg` v3 (`postgresql+psycopg://...`). Gravar o `.env` em ASCII (não pelo Notepad) e liberar scripts no PowerShell (`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`). O guia completo está no histórico git deste arquivo.
