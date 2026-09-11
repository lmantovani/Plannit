# Projeto: Módulo de Especificadores (ERP/CRM Plannit)

## Architecture
- **Stack Backend**: AdonisJS v7 (`@adonisjs/core`), Lucid ORM (`@adonisjs/lucid`), PostgreSQL (`pg`), VineJS (`@vinejs/vine`).
- **Stack Frontend**: Inertia.js (`@adonisjs/inertia`, `@inertiajs/react`), React 19, Lucide React, TailwindCSS 3 (paleta warm-gold / stone).
- **Diretório da Aplicação**: `/home/porto/codespace/Plannit/plannit`
- **Fluxo de Dados**:
  1. Banco de Dados PostgreSQL armazena as entidades de Especificadores, Decisores, Concorrentes, Histórico Imutável de Dono, Interações e Metas de Visitas.
  2. Motor Analítico no Backend (`arquiteto_score_service.ts`) calcula sob demanda scores (RFV × Potencial × Lealdade), 7 segmentos comportamentais, 5 flags ativas e risco de concorrência a partir de dados reais de projetos, leads e interações.
  3. Controller (`arquitetos_controller.ts`) entrega dados via SSR para páginas Inertia e endpoints JSON para operações interativas.
  4. Interface do Usuário consome dados estritamente calculados pelo backend, com navegação na Sidebar, KPIs, Tabela, Drawer com 3 abas e Modais de operação.

## Feature Inventory
| # | Feature | Descrição | Milestone | Source |
|---|---------|-----------|-----------|--------|
| F01 | Schema e Migrations de Especificadores | Criação das tabelas `arquitetos`, `decisores_arquitetos`, `concorrentes_arquitetos`, `historico_dono_arquitetos`, `interacoes_arquitetos`, `metas_visitas_consultor` | M1 | R1, ORIGINAL_REQUEST |
| F02 | Vínculo de Projetos e Leads com Especificador | Adicionar coluna `arquiteto_id` e índice na tabela `projetos`; formalizar FK em `leads.arquiteto_id` | M1 | R1, ORIGINAL_REQUEST |
| F03 | Modelos Lucid ORM e Relacionamentos | Classes tipadas de modelo em `app/models/` com decorators `@belongsTo`, `@hasMany`, `@hasOne` e atualização de `User`, `Projeto`, `Lead` | M1 | R1, Survey E1 |
| F04 | Motor Analítico de Score RFV | Cálculo determinístico de Recência (0-100), Frequência (0-100) e Valor (0-100) com base em projetos dos últimos 12 meses | M2 | R2, Survey E2 |
| F05 | Motor Analítico de Potencial e Lealdade | Cálculo de Potencial (leads ativos + projetos em andamento) e Lealdade (tempo parceria, consistência, conversão) | M2 | R2, Survey E2 |
| F06 | Classificação nos 7 Segmentos Comportamentais | Cascata estrita: `inativo`, `novo_promissor`, `em_risco`, `campeao`, `parceiro_fiel`, `em_ascensao`, `ocasional` | M2 | R2, Survey E2 |
| F07 | Motor de 5 Flags Ativas | Ativação simultânea de `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando` | M2 | R2, Survey E2 |
| F08 | Risco de Concorrência e KPIs de Carteira | Indicador de risco desacoplado (baixo, médio, alto) e cálculo de KPIs agregados de vendas e atendimentos | M2 | R2, Survey E2 |
| F09 | Guardrails de Auditoria Imutável e Soft Delete (RN017) | Soft delete via `is_active = false` e registro transacional imutável em `historico_dono_arquitetos` | M3 | R3, ORIGINAL_REQUEST |
| F10 | Controllers HTTP e Validações VineJS | `app/controllers/arquitetos_controller.ts` e `app/validators/arquiteto.ts` para CRUD, sub-recursos e metas | M3 | R1, R3, Survey E1 |
| F11 | Registro e Ordenação de Rotas HTTP | Rotas estáticas antes de dinâmicas em `start/routes.ts` com proteção de autenticação e RBAC | M3 | R1, Survey E1 |
| F12 | Integração de Navegação (Sidebar e Dashboard) | Item "Especificadores" (ícone Compass) no grupo Comercial de `app_layout.tsx` e ativação em `dashboard.tsx` | M4 | R4, Survey E3 |
| F13 | Painel de KPIs e Meta Individual | Painel superior em `/especificadores` com 5 KPIs, barra de meta do vendedor e gatilho de configuração | M4 | R4, Survey E3 |
| F14 | Tabela Estruturada com Filtros Combinados | Listagem de especificadores com pesquisa, filtros por tipo, status e consultor, badges e ações | M4 | R4, Survey E3 |
| F15 | Drawer Lateral Retrátil com 3 Abas | Componente retrátil deslizante com Aba Perfil, Aba Score (com barras comparativas) e Aba Decisores & Concorrentes | M4 | R4, Survey E3 |
| F16 | Modais de Cadastro, Edição e Metas | Modais dedicados para novo especificador, edição rápida, reatribuição de dono e metas de visitas | M4 | R4, Survey E3 |
| F17 | Seeder de Testes com 7 Segmentos | `database/seeders/arquiteto_seeder.ts` populando dados para todos os 7 segmentos e metas de visitas | M5 | Acceptance Criteria |
| F18 | Teste Automatizado do Motor de Score | `scripts/test_arquiteto_score.js` com validação de fórmulas matemáticas e dados do seeder | M5 | Acceptance Criteria |
| F19 | Teste Automatizado HTTP E2E | `scripts/test_http_arquitetos.js` com validação de rotas, auth, reatribuição, interações e soft delete | M5 | Acceptance Criteria |
| F20 | Verificação de Tipagem e Build | `npm run typecheck` (0 erros) e `npm run build` (sucesso Vite) | M5 | Acceptance Criteria |

## Milestones
| # | Nome | Escopo | Dependências | Status |
|---|------|--------|--------------|--------|
| M1 | Banco de Dados, Migrations e Models Lucid | F01, F02, F03 (migrations, schema, models e relações) | Nenhuma | DONE |
| M2 | Motor Analítico de Score e Regras de Negócio | F04, F05, F06, F07, F08 (`arquiteto_score_service.ts`, fórmulas puras e integração com banco) | M1 | DONE |
| M3 | Endpoints HTTP, Controllers e Guardrails RN017 | F09, F10, F11 (controller, validators, rotas, soft delete, histórico dono) | M1, M2 | DONE |
| M4 | Interface Visual Inertia.js + React 19 | F12, F13, F14, F15, F16 (sidebar, dashboard, páginas index e show, drawer 3 abas, modais) | M3 | DONE |
| M5 | E2E Testing, Seeders e Hardening Final | F17, F18, F19, F20 (seeder dos 7 segmentos, scripts de teste, typecheck, build e auditoria forense) | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `arquiteto_score_service.ts` ↔ `arquitetos_controller.ts`
- `calcularScoreArquiteto(arquitetoId: number): Promise<ArquitetoScoreResult>`
  - Retorno: `{ rfv, potencial, lealdade, scoreGeral, segmento, flags, detalhes, concorrencia }`
  - Valores numéricos: `0.0` a `100.0` arredondados para 1 casa decimal.
  - `segmento`: `'inativo' | 'novo_promissor' | 'em_risco' | 'campeao' | 'parceiro_fiel' | 'em_ascensao' | 'ocasional'`
  - `flags`: `('top_indicador' | 'em_risco_de_perda' | 'alto_potencial' | 'indicacao_alto_valor' | 'especificador_esfriando')[]`
- `calcularKpisCarteira(consultorId?: number): Promise<KpisCarteiraResult>`
  - Retorno: `{ especificadoresAtivos, pctVendaMes, pctVendaAno, atendimentosMes, visitasEscritorioMes }`

### `arquitetos_controller.ts` ↔ Inertia Frontend (`inertia/pages/especificadores/index.tsx`)
- Props de `index`:
  - `especificadores`: Array de especificadores ativos serializados com dados cadastrais, consultor dono e score analítico.
  - `kpis`: Dados agregados de carteira.
  - `minhaMeta`: `{ metaVisitasMes, visitasRealizadasMes, percentualAtingido }`.
  - `consultores`: Lista de consultores para filtros e reatribuição.
  - `filtros`: Filtros aplicados no momento (`tipo`, `statusCarteira`, `consultorId`, `busca`).
- Operações de Mutação via Inertia router:
  - `POST /especificadores`: Criação com dados cadastrais.
  - `PATCH /especificadores/:id`: Edição rápida.
  - `DELETE /especificadores/:id`: Soft delete (`is_active = false`).
  - `PATCH /especificadores/:id/dono`: Reatribuição de dono (`consultorNovoId`, `motivo`).
  - `POST /especificadores/:id/interacoes`: Registro de nova interação (`tipo`, `resumo`, `data`).
  - `POST /especificadores/:id/decisores`: Cadastro de decisor (`nome`, `cargo`, `telefone`, `isPrincipal`).
  - `POST /especificadores/:id/concorrentes`: Monitoramento de concorrente (`nomeConcorrente`, `percentualFechamentoEstimado`).
  - `PUT /especificadores/metas-visitas`: Configuração de metas (`consultorId`, `metaVisitasMes`).

## Code Layout
- Migrations: `plannit/database/migrations/*_create_arquitetos_tables.ts`, `*_add_arquiteto_id_to_projetos_and_leads.ts`
- Models: `plannit/app/models/arquiteto.ts`, `decisor_arquiteto.ts`, `concorrente_arquiteto.ts`, `historico_dono_arquiteto.ts`, `interacao_arquiteto.ts`, `meta_visitas_consultor.ts`
- Services: `plannit/app/services/arquiteto_score_service.ts`
- Validators: `plannit/app/validators/arquiteto.ts`
- Controllers: `plannit/app/controllers/arquitetos_controller.ts`
- Routes: `plannit/start/routes.ts`
- Seeders: `plannit/database/seeders/arquiteto_seeder.ts`
- Scripts de Teste: `plannit/scripts/test_arquiteto_score.js`, `plannit/scripts/test_http_arquitetos.js`
- Frontend Layout: `plannit/inertia/layouts/app_layout.tsx`, `plannit/inertia/pages/dashboard.tsx`
- Frontend Páginas: `plannit/inertia/pages/especificadores/index.tsx`, `plannit/inertia/pages/especificadores/show.tsx`
- Frontend Componentes: `plannit/inertia/pages/especificadores/components/*`
