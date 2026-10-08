# Project: Módulo de Agenda no Plannit

## Arquitetura
O módulo de Agenda no monólito Plannit (AdonisJS v7 + Lucid ORM + Inertia React 19 + TypeScript) integra a gestão de compromissos operacionais, comerciais e técnicos ao fluxo do CRM/Kanban de Leads.
- **Camada de Dados**: PostgreSQL 16 com Lucid ORM. Duas tabelas principais:
  - `tipos_compromisso_catalogo`: Catálogo dinâmico gerenciável por gestores em `/configuracoes`.
  - `compromissos_agenda`: Compromissos vinculados a responsáveis, criadores e entidades do negócio (Lead, Cliente, Projeto).
- **Camada de Controle e RBAC**: `AgendaController` e `ConfiguracoesController` com regras de autorização estritas baseadas em `PerfilUsuario` (`DIRETORIA`, `GERENTE_COMERCIAL`, `VENDEDOR`, `PROJETISTA`). Vendedores e projetistas possuem isolamento total (somente compromissos próprios); Diretoria e Gerente Comercial possuem visão global e alternador de equipe.
- **Camada de Validação**: Schemas VineJS em `app/validators/configuracao.ts` e `app/validators/compromisso_agenda.ts`.
- **Camada Frontend**: Inertia.js com React 19 e TailwindCSS 3.
  - Tela central `/agenda` com modos grade/calendário e lista, alternador RBAC "Minha Agenda" vs "Toda a Equipe".
  - Aba em `/configuracoes` para gestão do catálogo.
  - Integração no CRM com badge cromático de urgência no `LeadCard` e seção com botão de agendamento no `LeadDrawer`.
- **Sincronização**: Suporte a atualização cross-tab via eventos `storage` (`plannit_catalogo_updated`) e foco de janela (`window.focus`).

## Feature Inventory
| # | Feature | Descrição | Milestone | Source |
|---|---------|-----------|-----------|--------|
| 1 | Migration `tipos_compromisso_catalogo` | Tabela com id, nome, slug, cor, is_active, ordem e timestamps | M1 | Survey E1 / R1 |
| 2 | Model `TipoCompromissoCatalogo` | Model Lucid com casting, scopes de ordenação e ativos | M1 | Survey E1 / R1 |
| 3 | Seed idempotente de tipos de compromisso | Inserção dos 7 tipos padrão na inicialização do sistema | M1 | Survey E1 / R1 |
| 4 | Controller e Rotas de Tipos de Compromisso | CRUD e toggle no `ConfiguracoesController` protegidos por perfil de gestão | M1 | Survey E1 / R1 |
| 5 | Aba em `/configuracoes` para Tipos de Compromisso | Interface de listagem, reordenação, badges de cores e modais no React | M1 | Survey E1 / R1 |
| 6 | Sincronização cross-tab e atalho "Configurar ↗" | Disparo de `plannit_catalogo_updated` e link para `/configuracoes?tab=tipos_compromisso` | M1 | Survey E1 / R1 |
| 7 | Migration `compromissos_agenda` | Tabela com campos completos, status enum e índices de calendário | M2 | Survey E2 / R2 |
| 8 | Model `CompromissoAgenda` | Model Lucid, relacionamentos (`tipo`, `responsavel`, `lead`, `cliente`, `projeto`), getters de urgência | M2 | Survey E2 / R2 |
| 9 | Validador VineJS `compromisso_agenda` | Regras para criação, edição, reagendamento, cancelamento e conclusão | M2 | Survey E2 / R2 |
| 10 | `AgendaController` e rotas em `routes.ts` | Endpoints index, store, update, reagendar, cancelar e concluir com suporte a JSON e Inertia | M2 | Survey E2 / R2 |
| 11 | RBAC estrito na Agenda | Vendedores/projetistas restritos aos seus compromissos; gestores com visão global e filtros | M2 | Survey E2 / R2 |
| 12 | Conclusão atômica e alimentação da timeline do lead | `PATCH :id/concluir` grava desfecho e insere `InteracaoLead` transacionalmente | M2 | Survey E2 / R2 |
| 13 | Item de navegação na sidebar com ícone `Calendar` | Inclusão de `/agenda` no grupo Principal em `app_layout.tsx` | M3 | Survey E3 / R3 |
| 14 | Página central `/agenda` | Cabeçalho com alternador RBAC, modos Grade/Calendário e Lista | M3 | Survey E3 / R3 |
| 15 | Cards de compromisso e modais centrais | Cards estilizados com status e horários; modal de novo compromisso e ações de ciclo de vida | M3 | Survey E3 / R3 |
| 16 | Preloading otimizado de compromissos no CRM | `leads_controller.ts` carrega `compromissos` e calcula `proximoCompromisso` sem consultas N+1 | M4 | Survey E3 / R4 |
| 17 | Badge cromático de urgência no `LeadCard` | Alerta visual no card (azul para hoje, vermelho para atrasado, neutro para futuro) | M4 | Survey E3 / R4 |
| 18 | Integração no `LeadDrawer` | Lista de compromissos do lead e botão "Agendar Encontro" com lead pré-selecionado | M4 | Survey E3 / R4 |
| 19 | Exibição de desfechos na timeline do CRM | Registros de encontros concluídos visíveis cronologicamente na timeline | M4 | Survey E3 / R4 |
| 20 | Testes funcionais Japa (`tests/functional/agenda.spec.ts`) | Suíte automatizada cobrindo catálogo, RBAC, CRUD, conclusão e timeline | M5 | Acceptance Criteria |
| 21 | Verificação de Tipagem (`npm run typecheck`) | Validação estrita TypeScript com 0 erros | M5 | Acceptance Criteria |
| 22 | Verificação de Build (`npm run build`) | Bundle de produção gerado com sucesso | M5 | Acceptance Criteria |
| 23 | Auditoria Forense de Integridade | Validação independente contra atalhos, mocks e violações de integridade | M5 | Acceptance Criteria |

## Milestones
| # | Nome | Escopo | Dependências | Status |
|---|------|--------|-------------|--------|
| M1 | Catálogo Parametrizável em Configurações (R1) | Migration, model, seed, controller, rotas, aba em `/configuracoes`, sync cross-tab | none | DONE |
| M2 | Modelagem e Backend da Agenda com RBAC (R2) | Migration, model, validator VineJS, controller, rotas, RBAC e timeline do lead | M1 | DONE |
| M3 | Tela Central da Agenda na Sidebar (R3) | `app_layout.tsx`, `inertia/pages/agenda/index.tsx`, filtros, alternador RBAC e modais | M1, M2 | DONE |
| M4 | Integração Operacional com o Kanban de Leads (R4) | `LeadCard` (badge), `LeadDrawer` (lista e agendamento), `leads_controller.ts` preloads | M2, M3 | DONE |
| M5 | Testes Funcionais, Tipagem e Auditoria Forense | `agenda.spec.ts`, `typecheck`, `build`, auditoria forense independente | M1, M2, M3, M4 | DONE |

## Interface Contracts

### M1 ↔ M2 (Catálogo ↔ Compromisso)
- Tabela `tipos_compromisso_catalogo`:
  - `id` (serial primary key)
  - `nome` (varchar 100)
  - `slug` (varchar 100, unique)
  - `cor` (varchar 20)
  - `is_active` (boolean, default true)
  - `ordem` (integer, default 0)
  - `created_at`, `updated_at` (timestamptz)
- Model `TipoCompromissoCatalogo`: exportado em `#models/tipo_compromisso_catalogo`.
- Tabela `compromissos_agenda` possui FK `tipo_id REFERENCES tipos_compromisso_catalogo(id) ON DELETE RESTRICT`.

### M2 ↔ M3 / M4 (Backend Agenda ↔ Frontend)
- Model `CompromissoAgenda`: exportado em `#models/compromisso_agenda`.
- Endpoints RESTful no monólito:
  - `GET /agenda`: Renderiza `agenda/index` ou responde JSON (quando `wantsJson()`). Retorna `{ compromissos, tipos, colaboradores, stats, filtros, podeVerEquipe }`.
  - `POST /agenda/compromissos`: Cria compromisso.
  - `PUT /agenda/compromissos/:id`: Atualiza dados do compromisso.
  - `PATCH /agenda/compromissos/:id/reagendar`: Altera datas/horários.
  - `PATCH /agenda/compromissos/:id/cancelar`: Altera status para `cancelado` com motivo opcional.
  - `PATCH /agenda/compromissos/:id/concluir`: Altera status para `concluido`, grava `desfecho` e cria `InteracaoLead` transacionalmente se `lead_id` estiver preenchido.
- Respostas:
  - Inertia: `session.flash('success' | 'error', msg)` + `response.redirect().back()`.
  - JSON: payload com `{ status, compromisso, message }` e códigos HTTP padrão (200, 201, 400, 403, 404).

### M2 / M4 (Backend Leads ↔ LeadCard & LeadDrawer)
- Propriedade estendida no objeto serializado de cada Lead em `LeadsController`:
  - `proximoCompromisso?: { id: number, titulo: string, dataHoraInicio: string, tipoNome: string, tipoCor: string, isHoje: boolean, isAtrasado: boolean }`
  - `compromissos?: Array<{ id: number, titulo: string, dataHoraInicio: string, dataHoraFim: string, local?: string, status: string, responsavelNome: string, tipoNome: string, tipoCor: string, desfecho?: string }>`
  - `tiposCompromissoCatalogo`: Array de tipos ativos repassados nas props de `crm/index.tsx`.

## Code Layout
- Backend:
  - `plannit/database/migrations/*_create_tipos_compromisso_catalogo_table.ts`
  - `plannit/database/migrations/*_create_compromissos_agenda_table.ts`
  - `plannit/database/seeders/tabelas_apoio_seeder.ts`
  - `plannit/app/models/tipo_compromisso_catalogo.ts`
  - `plannit/app/models/compromisso_agenda.ts`
  - `plannit/app/validators/configuracao.ts`
  - `plannit/app/validators/compromisso_agenda.ts`
  - `plannit/app/controllers/configuracoes_controller.ts`
  - `plannit/app/controllers/agenda_controller.ts`
  - `plannit/app/controllers/leads_controller.ts`
  - `plannit/start/routes.ts`
- Frontend:
  - `plannit/inertia/layouts/app_layout.tsx`
  - `plannit/inertia/pages/configuracoes/index.tsx`
  - `plannit/inertia/pages/agenda/index.tsx`
  - `plannit/inertia/pages/agenda/components/*`
  - `plannit/inertia/pages/crm/index.tsx`
  - `plannit/inertia/components/agenda/ModalNovoCompromisso.tsx`
  - `plannit/inertia/components/agenda/ModalConcluirCompromisso.tsx`
- Testes:
  - `plannit/tests/functional/agenda.spec.ts`
