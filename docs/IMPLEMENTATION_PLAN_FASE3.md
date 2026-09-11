# Plano de Ação: Fase 3 — Módulo de Briefings & Score Inteligente (RN002)

Este documento detalha o plano de desenvolvimento do **Módulo 02: Briefings & Score de Qualidade (RF007 a RF012 e RN002)** no Plannit com **AdonisJS v7 + Inertia.js + React 19**, integrando a transição fluida do CRM para o levantamento técnico de projetos de alto padrão da Líder Móveis.

---

## 1. Contexto e Objetivos de Negócio

No fluxo operacional da Líder Móveis Planejados (SRS v3.0):
1. Quando um lead é qualificado no CRM e entra na fase de projeto, é gerado um **Projeto** e aberto o preenchimento do **Briefing**.
2. O briefing não é um formulário estático: ele possui um **motor de pontuação inteligente (0 a 100 pontos)** baseado em **10 critérios objetivos e ponderados**.
3. **Regra Inegociável RN002 (Bloqueio de Fila):** Um briefing com score inferior a **70 pontos** é estritamente bloqueado de avançar para a fila de projetos de projetistas (`POST /briefings/:id/enviar-para-fila`). Isso impede que projetistas recebam projetos incompletos, com escopo vago ou sem faixa orçamentária definida, evitando retrabalho no desenvolvimento 3D/Promob.
4. O vendedor precisa de **feedback visual em tempo real** enquanto preenche o formulário, sabendo exatamente quais campos faltam para alcançar os 70 pontos mínimos necessários para liberação.

---

## 2. O Algoritmo de Score do Briefing (10 Critérios)

O motor calcula a soma ponderada de 3 grupos de critérios (total 100 pontos):

| Grupo | Critério | Peso | Regra de Pontuação |
| :--- | :--- | :---: | :--- |
| **Dados Obrigatórios (40 pts)** | `cidade_obra` | 8 | Cidade da obra preenchida |
| | `ambientes` | 10 | Pelo menos 1 ambiente selecionado da lista padrão |
| | `prazo_desejado` | 8 | Prazo desejado de entrega/instalação definido |
| | `faixa_investimento` | 14 | Faixas mínima e máxima de investimento informadas |
| **Qualidade do Levantamento (35 pts)** | `ambientes_detalhados` | 15 | Pelo menos 1 ambiente com descrição detalhada de escopo |
| | `referencias_visuais` | 12 | Pelo menos 1 link/imagem de referência anexada |
| | `medidas_preliminares` | 8 | Medidas preliminares preenchidas em algum ambiente |
| **Informações Comerciais (25 pts)** | `estilo_preferido` | 8 | Estilo arquitetônico informado (ex: Contemporâneo, Minimalista) |
| | `arquiteto_vinculado` | 7 | Nome ou ID de arquiteto/especificador informado |
| | `observacoes` | 10 | Contexto do cliente preenchido com pelo menos 50 caracteres |
| **TOTAL** | | **100** | **Mínimo para aprovação na fila (RN002): 70 pontos** |

---

## 3. Mudanças Propostas por Componente

### Banco de Dados & Backend (AdonisJS v7)

#### [NEW] [1761885935171_create_projetos_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935171_create_projetos_table.ts)
- Criação da tabela `projetos`:
  - `id` (serial PK)
  - `codigo` (varchar 20, unique, ex: `PROJ-2026-0001`)
  - `lead_id` (FK `leads.id` nullable on delete set null)
  - `cliente_nome` (varchar 200, not null)
  - `vendedor_id` (FK `users.id` nullable)
  - `projetista_id` (FK `users.id` nullable)
  - `conferente_id` (FK `users.id` nullable)
  - `arquiteto_nome` (varchar 200, nullable)
  - `status` (varchar 50, default `'em_briefing'`)
  - `valor_contrato` (decimal nullable)
  - `prazo_entrega_estimado` (date nullable)
  - `alerta_parado` (boolean default false — RN016)
  - `arquivado` (boolean default false — RN017)
  - `arquivado_motivo` (text nullable)
  - Timestamps (`created_at`, `updated_at`, `status_alterado_em`)

#### [NEW] [1761885935172_create_briefings_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935172_create_briefings_table.ts)
- Criação da tabela `briefings`:
  - `id` (serial PK)
  - `projeto_id` (FK `projetos.id` on delete cascade, unique, not null)
  - `cidade_obra` (varchar 100, nullable)
  - `estado_obra` (varchar 2, nullable)
  - `endereco_obra` (varchar 300, nullable)
  - `ambientes` (jsonb, array de strings, ex: `["cozinha", "closet"]`)
  - `prazo_desejado` (varchar 100, nullable)
  - `faixa_investimento_min` (decimal nullable)
  - `faixa_investimento_max` (decimal nullable)
  - `estilo_preferido` (varchar 100, nullable)
  - `observacoes` (text nullable)
  - `referencias_url` (jsonb, array de links)
  - `arquiteto_nome`, `arquiteto_email`, `arquiteto_telefone`
  - `score` (decimal(5,1) default 0.0)
  - `score_minimo` (decimal(5,1) default 70.0)
  - `score_detalhes` (jsonb com status booleano de cada critério)
  - `status` (varchar 50, default `'rascunho'` — `rascunho`, `enviado`, `aprovado`, `devolvido`)
  - `enviado_em` (timestamptz nullable)
  - `motivo_devolucao` (text nullable)
  - Timestamps (`created_at`, `updated_at`)

#### [NEW] [1761885935173_create_ambientes_briefing_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935173_create_ambientes_briefing_table.ts)
- Criação da tabela `ambientes_briefing`:
  - `id` (serial PK)
  - `briefing_id` (FK `briefings.id` on delete cascade, not null)
  - `tipo` (varchar 100, not null)
  - `descricao` (text nullable)
  - `medidas_preliminares` (varchar 200, nullable)
  - `observacoes_especificas` (text nullable)

#### [NEW] [1761885935174_create_fila_projetos_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935174_create_fila_projetos_table.ts)
- Criação da tabela `fila_projetos` (ponte para a alocação de projetistas):
  - `id` (serial PK)
  - `projeto_id` (FK `projetos.id` on delete cascade, unique, not null)
  - `projetista_id` (FK `users.id` nullable)
  - `prioridade` (integer default 5)
  - `status` (varchar 30 default `'aguardando'` — `aguardando`, `alocado`, `em_andamento`, `concluido`)
  - `data_entrada_fila` (timestamptz)
  - `data_alocacao` (timestamptz nullable)

#### [NEW] [app/models/projeto.ts](file:///home/porto/codespace/Plannit/plannit/app/models/projeto.ts)
- Model Lucid `Projeto` com relacionamentos para `Briefing`, `User` (vendedor, projetista), `Lead`.

#### [NEW] [app/models/briefing.ts](file:///home/porto/codespace/Plannit/plannit/app/models/briefing.ts)
- Model Lucid `Briefing` com relacionamentos para `Projeto` e `AmbienteBriefing`.

#### [NEW] [app/models/ambiente_briefing.ts](file:///home/porto/codespace/Plannit/plannit/app/models/ambiente_briefing.ts)
- Model Lucid `AmbienteBriefing`.

#### [NEW] [app/models/fila_projeto.ts](file:///home/porto/codespace/Plannit/plannit/app/models/fila_projeto.ts)
- Model Lucid `FilaProjeto`.

#### [NEW] [app/services/briefing_score_service.ts](file:///home/porto/codespace/Plannit/plannit/app/services/briefing_score_service.ts)
- Implementação em TypeScript estrito da função `calcularScoreBriefing(dados)`.
- Retorno: `{ score: number, scoreMinimo: number, aprovado: boolean, detalhes: Record<string, boolean>, pontosFaltantes: string[] }`.

#### [NEW] [app/validators/briefing.ts](file:///home/porto/codespace/Plannit/plannit/app/validators/briefing.ts)
- Validações VineJS para criação/atualização de briefing e ambientes.

#### [NEW] [app/controllers/briefings_controller.ts](file:///home/porto/codespace/Plannit/plannit/app/controllers/briefings_controller.ts)
- Ações:
  - `index`: renderiza lista de briefings/projetos com busca, status e barra de score.
  - `create` / `edit`: carrega dados do briefing e opções para preenchimento.
  - `calcularScore`: endpoint AJAX rápido para feedback em tempo real.
  - `store` / `update`: salva alterações do briefing (status rascunho) e atualiza score.
  - `enviarParaFila`: aplica **RN002**. Se `score < 70`, bloqueia e retorna erro com lista de pendências. Se `>= 70`, avança status para `enviado`, cria entrada em `fila_projetos` e atualiza projeto para `na_fila`.

#### [NEW] [database/seeders/briefing_seeder.ts](file:///home/porto/codespace/Plannit/plannit/database/seeders/briefing_seeder.ts)
- Popula projetos de teste e briefings com diferentes scores (ex: um com score 45 bloqueado, um com score 85 pronto para envio, e um já enviado para fila).

#### [MODIFY] [start/routes.ts](file:///home/porto/codespace/Plannit/plannit/start/routes.ts)
- Rotas REST sob `middleware.auth()`:
  - `GET /briefings`: listagem
  - `GET /briefings/:id`: detalhe/edição
  - `POST /briefings/:id`: salvar rascunho
  - `POST /briefings/calcular-score`: cálculo prévio em tempo real
  - `POST /briefings/:id/enviar-para-fila`: envio com validação **RN002**

---

### Frontend (Inertia.js + React 19)

#### [NEW] [inertia/lib/briefing_constants.ts](file:///home/porto/codespace/Plannit/plannit/inertia/lib/briefing_constants.ts)
- Listas de seleção e cálculo local instantâneo (espelhando `briefing_score_service.ts` para renderização imediata enquanto o vendedor digita):
  - `AMBIENTES_OPCOES` (Cozinha, Closet, Quarto Casal, Home Theater, Gourmet, etc.)
  - `ESTILOS_OPCOES` (Contemporâneo, Minimalista, Clássico, Industrial, etc.)
  - `PRAZOS_OPCOES` (1 mês, 2 meses, 3 meses, etc.)
  - Função `calcularScoreLocal(form)`.

#### [NEW] [inertia/pages/briefings/index.tsx](file:///home/porto/codespace/Plannit/plannit/inertia/pages/briefings/index.tsx)
- Painel de listagem dos briefings/projetos:
  - Indicadores no topo: Total em Briefing, Aguardando Complemento (Score < 70), Prontos para Fila (Score >= 70).
  - Tabela com Código do Projeto, Cliente, Vendedor Responsável, Ambientes, Score atual com barra de progresso colorida (vermelho/âmbar/verde), Status e Ação de Editar.

#### [NEW] [inertia/pages/briefings/edit.tsx](file:///home/porto/codespace/Plannit/plannit/inertia/pages/briefings/edit.tsx)
- Formulário multi-seções de alta fidelidade Líder Móveis:
  - **Sidebar de Score Fixo:** Painel lateral acompanhando a rolagem com o Score Circular/Barra (0 a 100), status de aprovação RN002 (Meta: 70 pts) e checklist dos 10 critérios marcando em tempo real quais já foram atendidos e quais faltam.
  - **Seção 1 — Dados da Obra & Prazo:** Endereço, cidade, prazo desejado.
  - **Seção 2 — Ambientes & Medidas:** Seleção em chips dos ambientes e detalhamento individual (medidas preliminares, especificações particulares).
  - **Seção 3 — Faixa de Investimento & Estilo:** Valores mínimo e máximo esperados pelo cliente e preferência estética.
  - **Seção 4 — Especificador / Arquiteto:** Vínculo com arquiteto parceiro.
  - **Seção 5 — Referências & Observações:** Mínimo de 50 caracteres para garantir contexto detalhado + links de referências/moodboard.
  - **Barra de Ações:** Botão "Salvar Rascunho" e botão de destaque "Enviar para a Fila de Projetos (RN002)" com alerta visual se o score for inferior a 70.

#### [MODIFY] [inertia/layouts/app_layout.tsx](file:///home/porto/codespace/Plannit/plannit/inertia/layouts/app_layout.tsx)
- Ativar o link de navegação "Briefings" no menu lateral (`/briefings`).

---

## 4. Plano de Verificação e Testes

1. **Migrações e Banco de Dados:**
   - Executar `node ace migration:run` e `node ace db:seed`.
   - Confirmar tabelas `projetos`, `briefings`, `ambientes_briefing` e `fila_projetos` criadas no PostgreSQL do Docker.
2. **Tipagem e Build:**
   - Executar `npm run typecheck` e garantir **0 erros TypeScript**.
   - Executar `npm run build` e validar compilação dos bundles do Vite e server.
3. **Validação da Regra RN002 (Bloqueio de Fila):**
   - Tentar enviar um briefing com score = 55 pontos para a fila -> Operação rejeitada com mensagem de erro informativa e lista de pendências.
   - Completar os campos faltantes até atingir score >= 70 -> Operação aceita com sucesso, briefing passa a `enviado`, projeto avança para `na_fila` e registro é criado em `fila_projetos`.
4. **Validação do Score em Tempo Real:**
   - Testar o preenchimento na interface e checar a sincronização visual da pontuação a cada campo preenchido.
