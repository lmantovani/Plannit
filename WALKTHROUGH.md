# Walkthrough: Fase 4 — Fila de Projetos, Alocação & Limite WIP por Projetista (RN003)

A migração do Plannit para **AdonisJS v7 + Inertia.js + React 19** avançou com a conclusão e validação completa da **Fase 4: Fila de Projetos, Alocação & Limite WIP por Projetista (RN003)** na branch `feature/adonis-migration`.

---

## 1. Resumo da Fase 4

Nesta fase, implementamos o módulo de distribuição e alocação operacional da **Líder Móveis Planejados**, garantindo que nenhum profissional receba projetos além de sua capacidade simultânea e preservando histórico imutável:

1. **Modelagem de Dados & Histórico (PostgreSQL):**
   - Tabela [`config_wip_projetistas`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935175_create_config_wip_projetistas_table.ts) para limites customizados de capacidade por projetista.
   - Tabela [`historico_status_projeto`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935176_create_historico_status_projeto_table.ts) para auditoria imutável (RN017).
2. **Motor de Controle de Capacidade WIP (RN003):**
   - Serviço [`wip_service.ts`](file:///home/porto/codespace/Plannit/plannit/app/services/wip_service.ts) calculando projetos ativos (`alocado` e `em_andamento`) e bloqueando novas alocações se `wipAtual >= wipLimit` (padrão: 3 projetos).
3. **Controlador Operacional da Fila:**
   - [`fila_controller.ts`](file:///home/porto/codespace/Plannit/plannit/app/controllers/fila_controller.ts) com listagem da fila, alocação com validação estrita da RN003, desalocação, avanço para modelagem 3D, ajuste gerencial de WIP e arquivamento justificado (RN017).
4. **Interface Gráfica Reativa (Inertia + React 19):**
   - Menu "Fila de Projetos" ativado na barra lateral com badge `RN003`.
   - Página [`fila/index.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/fila/index.tsx):
     - Monitor visual de capacidade (WIP Monitor) com barras coloridas (verde, âmbar, vermelho) por projetista.
     - Quadro Kanban em 4 colunas (`Aguardando Alocação`, `Alocado`, `Em Andamento`, `Concluído`) e alternador para Visão em Lista.
     - Modal de Alocação Inteligente destacando disponibilidade e bloqueando visualmente profissionais lotados.
     - Modal gerencial para customização do WIP limit individual.

---

## 2. Detalhes Técnicos da Implementação

### A. Persistência & Migrations (PostgreSQL)

* **Tabela `config_wip_projetistas`:**
  - `projetista_id`: FK `users.id` (onDelete CASCADE, unique, notNullable).
  - `wip_limit`: integer (default 3, notNullable).
  - `ativo`: boolean (default true, notNullable).
* **Tabela `historico_status_projeto` (RN017):**
  - `projeto_id`: FK `projetos.id` (onDelete CASCADE).
  - `status_de`: string nullable.
  - `status_para`: string notNullable.
  - `alterado_por_id`: FK `users.id` (onDelete SET NULL).
  - `observacao`: text nullable.
  - `created_at`: timestamp com timezone.
* **Models Lucid:**
  - [`ConfigWipProjetista`](file:///home/porto/codespace/Plannit/plannit/app/models/config_wip_projetista.ts) com `belongsTo(User)`.
  - [`HistoricoStatusProjeto`](file:///home/porto/codespace/Plannit/plannit/app/models/historico_status_projeto.ts) com `belongsTo(Projeto)` e `belongsTo(User)`.
  - [`Projeto`](file:///home/porto/codespace/Plannit/plannit/app/models/projeto.ts) atualizado com `hasMany(HistoricoStatusProjeto)`.

---

### B. Motor de Controle de Capacidade WIP (RN003)

O serviço [`wip_service.ts`](file:///home/porto/codespace/Plannit/plannit/app/services/wip_service.ts) encapsula a inteligência de alocação:

- **`getWipAtual(projetistaId)`:** Consulta projetos na `fila_projetos` com status `alocado` ou `em_andamento`.
- **`getWipLimit(projetistaId)`:** Obtém o limite configurado em `config_wip_projetistas` ou assume o padrão de 3.
- **`podeAlocar(projetistaId)`:** Retorna `{ pode, wipAtual, wipLimit, vagasDisponiveis, porcentagemOcupacao, mensagem }`.
- **`listarProjetistasComCapacidade()`:** Retorna todos os projetistas ativos ordenados por disponibilidade de vagas.
- **`configurarWipLimit(projetistaId, wipLimit)`:** Permite à Diretoria ou Gerência Comercial customizar o teto operacional.

---

### C. Camada de Controle & Rotas

* **Controller [`fila_controller.ts`](file:///home/porto/codespace/Plannit/plannit/app/controllers/fila_controller.ts):**
  - `index`: Carrega projetos da fila e indicadores da equipe, isolando visibilidade por perfil (projetista vê sua alocação + fila pública; gestão vê todos).
  - `alocar`: Valida `alocarProjetistaValidator`, invoca `podeAlocar(projetistaId)`. Se `!pode`, **aborta com erro 422** e emite flash message explicativa. Se autorizado, vincula projetista, avança status para `alocado` / `em_projeto` e registra no `HistoricoStatusProjeto`.
  - `desalocar`: Desfaz a atribuição em caso de renegociação e devolve o projeto à fila de espera (`aguardando` / `na_fila`).
  - `iniciarExecucao`: Marca o projeto como `em_andamento` para início da modelagem técnica 3D.
  - `configurarWip`: Permite atualização atômica de limites com gate de perfil (`DIRETORIA`, `GERENTE_COMERCIAL`).
  - `arquivar`: Soft delete com justificativa obrigatória (RN017).
* **Rotas ([routes.ts](file:///home/porto/codespace/Plannit/plannit/start/routes.ts)):**
  - `/wip/configuracoes` declarada antes das rotas dinâmicas `/fila/:id/*`.

---

### D. Interface Gráfica (Inertia + React 19)

* **Monitor de Capacidade (WIP Monitor):**
  - Exibe cards de cada projetista com indicador visual de carga (ex: `3 / 3 projetos ativos (100%) - Lotado (RN003)` ou `0 / 2 projetos ativos - Disponível (2 vagas)`).
  - Botão de engrenagem para gestores customizarem o teto operacional.
* **Kanban de Fila & Tabela Alternável:**
  - Colunas: `Aguardando Alocação`, `Alocado (Aguard. Início)`, `Em Andamento (3D)`, `Concluído`.
  - Cartões com código do projeto, cliente, vendedor, score do briefing aprovado e badge de prioridade (Urgente, Alta, Normal).
* **Modal de Alocação com Trava Visual RN003:**
  - Exibe os projetistas cadastrados. Se o profissional estiver com a capacidade esgotada, a opção é destacada com aviso `Lotado (RN003)` e a seleção é **desabilitada**.

---

## 3. Matriz de Testes e Validações

| Teste Realizado | Escopo / Método | Resultado |
| :--- | :--- | :--- |
| **Migrations PostgreSQL** | `node ace migration:run` | ✅ **2 tabelas criadas** (`config_wip_projetistas`, `historico_status_projeto`) |
| **Seeder de Demonstração** | `node ace db:seed --files database/seeders/fila_seeder.ts` | ✅ **3 projetistas (1 lotado 3/3, 1 parcial 1/3, 1 livre 0/2) e 3 projetos aguardando populados** |
| **Typecheck TypeScript** | `npm run typecheck` (tsc servidor + tsc Inertia) | ✅ **0 erros** em todo o codebase |
| **Compilação Vite / Build** | `npm run build` | ✅ **Compilação bem-sucedida** (`fila-D9-Lu-Qt.js`, `app-deB6x0oj.css`) |
| **Validação Direta do Banco** | `node scripts/test_wip.js` | ✅ **Cálculos de WIP e bloqueio RN003 validados** |
| **Bloqueio RN003 (Projetista Lotado)** | `POST /fila/:id/alocar` para André Valente (3/3) | ✅ **Bloqueado com sucesso!** Alocação rejeitada e projeto retido em `aguardando` |
| **Alocação Válida (Projetista Livre)** | `POST /fila/:id/alocar` para Mariana Duarte (0/2) | ✅ **Aprovado com sucesso!** Status avançou para `alocado` / `em_projeto` e histórico gerado |
| **Avanço para Modelagem 3D** | `POST /fila/:id/iniciar` | ✅ **Status atualizado para `em_andamento`** com registro de auditoria |
| **Ajuste Gerencial de WIP** | `POST /wip/configuracoes` | ✅ **Limite atualizado para 4 projetos** com persistência no banco |
| **Desalocação e Retorno à Fila** | `POST /fila/:id/desalocar` | ✅ **Projeto devolvido para `aguardando`** |

---

## 4. Próxima Etapa: Orquestração Paralela com Subagentes Especializados

Conforme solicitado, para as próximas fases avançaremos em paralelo utilizando a divisão em 3 subagentes dedicados:

1. **Subagente 1 (Backend & Regras):** Migrations Lucid, Models com relacionamentos, validações VineJS e porte dos algoritmos do Python para TypeScript.
2. **Subagente 2 (Frontend & Inertia):** Telas em React 19, componentes visuais, Kanban, tabelas e modais com feedback em tempo real.
3. **Subagente 3 (QA & Integridade):** Execução de `npm run typecheck`, seeds, testes ponta-a-ponta e garantia estrita dos guardrails inegociáveis.

---

# Walkthrough: Fase 5 — Módulo de Especificadores / Arquitetos & Motor de Score RFV

A **Fase 5: Módulo de Especificadores / Arquitetos & Motor de Score RFV** foi completamente implementada, integrada e auditada com **100% de sucesso** em AdonisJS v7 + Inertia.js + React 19.

---

## 1. O que foi Entregue na Fase 5

1. **Modelagem de Dados & Relacionamentos (PostgreSQL):**
   - Tabela [`arquitetos`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935177_create_arquitetos_tables.ts) com dados cadastrais, perfil de parceria, consultor dono e soft-delete (`is_active`).
   - Tabela `decisores_arquitetos` com garantia de unicidade estrita de decisor principal (`is_principal`).
   - Tabela `concorrentes_arquitetos` para mapeamento de market share e nível de risco (baixo, médio, alto).
   - Tabela `historico_dono_arquitetos` para auditoria imutável de transferências de carteira (RN017).
   - Tabela `interacoes_arquitetos` com histórico cronológico multicanal (visita escritório, showroom, almoço, whatsapp).
   - Tabela `metas_visitas_consultor` para controle de metas mensais por consultor com validação RBAC.
   - Chaves estrangeiras `arquiteto_id` integradas em `projetos` e `leads`.

2. **Motor Analítico de Score RFV & Lealdade (`arquiteto_score_service.ts`):**
   - **Pilar RFV (40%):** Recência (faixas de dias), Frequência (volume de projetos) e Valor acumulado (R$).
   - **Pilar Potencial (30%):** Projetos ativos em carteira.
   - **Pilar Lealdade (30%):** Tempo de parceria, consistência de indicações em 12 meses e taxa de conversão em vendas.
   - **Segmentação Automática (7 clusters):** `campeao`, `parceiro_fiel`, `em_ascensao`, `novo_promissor`, `ocasional`, `em_risco`, `inativo`.
   - **5 Flags Analíticas:** `top_indicador`, `alto_potencial`, `em_risco_de_perda`, `especificador_esfriando`, `indicacao_alto_valor`.
   - Desacoplamento estrito entre pontuação geral e risco de concorrência.

3. **Camada de Controle & Rotas com Guardrails:**
   - [`arquitetos_controller.ts`](file:///home/porto/codespace/Plannit/plannit/app/controllers/arquitetos_controller.ts) cobrindo CRUD completo, listagem com filtros combinados e busca textual, KPIs da carteira e endpoints dedicados de score.
   - **RBAC Estrito:** Apenas gestores (`DIRETORIA`, `GERENTE_COMERCIAL`) podem reatribuir o consultor dono de um arquiteto ou definir metas de outros consultores.
   - **RN017 (Soft Delete):** Exclusão física bloqueada; desativação via `is_active = false`.

4. **Interface Gráfica Reativa (Inertia + React 19):**
   - Página [`especificadores/index.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/especificadores/index.tsx) com painel de KPIs (especificadores ativos, % vendas ano, atendimentos e visitas mês), barra de progresso da meta do consultor, tabela de especificadores com badges de segmentos e barra de score colorida.
   - Página de Detalhes [`especificadores/show.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/especificadores/show.tsx) com abas de Perfil, Score Analítico detalhado (RFV, Potencial, Lealdade), Decisores & Concorrentes e Linha do Tempo de Interações.
   - Modais: Novo Especificador, Edição, Reatribuição de Dono com justificativa obrigatória e Metas de Visitas.

---

## 2. Matriz de Testes e Validações

| Teste Realizado | Escopo / Método | Asserções | Resultado |
| :--- | :--- | :---: | :--- |
| **Migrations PostgreSQL** | `node ace migration:run` | — | ✅ **Tabelas criadas com integridade relacional** |
| **Povoamento de Dados (Seeders)** | `arquiteto_seeder.ts` | — | ✅ **8 especificadores realistas em todos os 7 segmentos e concorrência populados** |
| **Typecheck TypeScript** | `npm run typecheck` | — | ✅ **0 erros** no servidor Adonis e cliente Inertia |
| **Build de Produção** | `npm run build` | — | ✅ **Compilação bem-sucedida** (`especificadores-DOKkzRhD.js`, `ScoreTab-BPyLIY5v.js`) |
| **Suíte do Motor de Score** | `scripts/test_arquiteto_score.js` | 97 | ✅ **100% aprovado** (Fórmulas RFV, 7 segmentos, 5 flags, concorrência e metas) |
| **Suíte HTTP End-to-End** | `scripts/test_http_arquitetos.js` | 58 | ✅ **100% aprovado** (CRUD, RBAC em reatribuição de dono, decisor principal único, soft delete RN017) |
| **TOTAL GERAL DE ASSERÇÕES** | — | **155** | ✅ **100% DE SUCESSO** |

---

# Walkthrough: Fase 6 — Módulo de Colaboradores & RH Imutável (RH-RN009 e RH-RN011)

O **Módulo de Colaboradores & RH Imutável** foi 100% implementado, auditado e validado em **AdonisJS v7 + Inertia.js + React 19**, com rigorosa observância às regras corporativas inegociáveis **RH-RN009** e **RH-RN011**.

---

## 1. O que foi Entregue na Fase 6

1. **Modelagem de Dados Relacional & Auditoria Imutável (PostgreSQL):**
   - Tabela [`departamentos`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935179_create_departamentos_and_cargos_tables.ts) e [`cargos`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935179_create_departamentos_and_cargos_tables.ts).
   - Tabela [`colaboradores`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935180_create_colaboradores_table.ts) com suporte a múltiplos regimes (`CLT`, `PJ`, `ESTAGIO`, `SOCIO`), modalidades (`PRESENCIAL`, `HIBRIDO`, `REMOTO`), perfil comportamental DISC (`DOMINANCIA`, `INFLUENCIA`, `ESTABILIDADE`, `CONFORMIDADE`), dados bancários e contato de emergência.
   - Tabelas imutáveis [`historico_salarial_colaboradores`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935181_create_historicos_and_documentos_colaborador_tables.ts) e [`historico_cargos_colaboradores`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935181_create_historicos_and_documentos_colaborador_tables.ts) registrando qualquer alteração de remuneração ou cargo com data de vigência, motivo e autor da ação.
   - Tabela [`documentos_colaboradores`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935181_create_historicos_and_documentos_colaborador_tables.ts) para gestão documental.

2. **Guardrails de Negócio Inegociáveis:**
   - **RH-RN009 (Imutabilidade de Salário e Cargo):** Qualquer tentativa de alteração direta de `salario_clt`, `remuneracao_pj` ou `cargo_id` via `PUT/PATCH /colaboradores/:id` é bloqueada e rejeitada com `400 Bad Request`. Alterações só são aceitas via endpoints dedicados de histórico (`POST /colaboradores/:id/historico-salarial` e `POST /colaboradores/:id/historico-cargos`).
   - **RH-RN009 (Desligamento Humanizado e Soft Delete):** Colaborador nunca é deletado na rotina operacional, apenas inativado via `POST /colaboradores/:id/desligar` com data de rescisão, motivo e registro da entrevista de desligamento (`entrevista_saida`).
   - **RH-RN011 (Purga Restrita à Diretoria sob Inativação Prévia):** A exclusão física (`DELETE /colaboradores/:id`) é uma exceção administrativa restrita exclusivamente ao perfil `DIRETORIA`. Caso outro perfil tente executar a ação, retorna `403 Forbidden`. Se o colaborador ainda estiver ativo (`is_active = true`), retorna `400 Bad Request` exigindo o desligamento formal prévio.

3. **Interface Gráfica Reativa Completa (Inertia + React 19):**
   - **Listagem e Gestão Geral:** [`colaboradores/index.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/colaboradores/index.tsx) com KPIs de headcount total, ativos, CLT, PJ e custo da folha mensal estimada; filtros combinados por departamento, status, regime e busca textual; tabela com badges DISC e status.
   - **Prontuário Individual do Colaborador:** [`colaboradores/show.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/colaboradores/show.tsx) organizado em 6 abas detalhadas:
     1. *Perfil & Contato:* dados pessoais, endereço, emergência e dados bancários.
     2. *Contrato & Organograma:* departamento, cargo atual, modalidade e líder imediato.
     3. *Histórico Salarial:* linha do tempo imutável de reajustes com motivo, valor e vigência.
     4. *Progressão de Cargos:* histórico de promoções, transferências e méritos.
     5. *Documentos:* controle de contratos, termos e certidões.
     6. *Rescisão & Purga:* controle do processo de desligamento formal e gatilho de purga administrativa (visível apenas para Diretoria).
   - **Modais Dedicados:** Admissão de Novo Colaborador, Reajuste Salarial, Alteração de Cargo, Desligamento Formal, Novo Documento e Purga Definitiva com confirmação de segurança digitada.

---

## 2. Matriz de Testes e Validações da Fase 6

| Teste Realizado | Escopo / Método | Asserções | Resultado |
| :--- | :--- | :---: | :--- |
| **Migrations PostgreSQL** | `node ace migration:run` | — | ✅ **Tabelas criadas com integridade relacional (Batch 6)** |
| **Povoamento de Dados (Seeders)** | `colaborador_seeder.ts` | — | ✅ **7 departamentos, 13 cargos e 6 colaboradores representativos populados** |
| **Typecheck TypeScript** | `npm run typecheck` | — | ✅ **0 erros** no servidor Adonis e cliente Inertia |
| **Build de Produção** | `npm run build` | — | ✅ **Compilação bem-sucedida** (`colaboradores-*.js`) |
| **Suíte de Modelos & Integridade** | `scripts/test_colaboradores.js` | 25 | ✅ **100% aprovado** (Cálculos de folha, admissão inaugural, relacionamentos) |
| **Suíte HTTP & Guardrails** | `scripts/test_http_colaboradores.js` | 35 | ✅ **100% aprovado** (RH-RN009 bloqueio de alteração direta, histórico salarial/cargo, desligamento, RH-RN011 purga restrita) |
| **TOTAL DE ASSERÇÕES DA FASE 6** | — | **60** | ✅ **100% DE SUCESSO** |

---

# Walkthrough: Fase 7 — Módulo de Clientes, Múltiplos Endereços & Histórico de Compras

O **Módulo de Clientes** foi 100% implementado, auditado e validado em **AdonisJS v7 + Inertia.js + React 19**, integrando dados cadastrais, aprovação de crédito financeiro, múltiplos endereços de montagem/entrega e rastreabilidade total do histórico de compras e projetos.

---

## 1. O que foi Entregue na Fase 7

1. **Modelagem de Dados Relacional & Endereços (PostgreSQL):**
   - Tabela [`clientes`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1789065365478_create_clientes_and_enderecos_tables_table.ts) com suporte a Pessoa Física (PF) e Pessoa Jurídica (PJ), documento único (`cpf_cnpj`), contato, arquiteto/especificador parceiro indicador e travas de aprovação de crédito (`cadastro_aprovado`, `cadastro_aprovado_por`, `cadastro_aprovado_em`).
   - Tabela [`enderecos_cliente`](file:///home/porto/codespace/Plannit/plannit/database/migrations/1789065365478_create_clientes_and_enderecos_tables_table.ts) suportando múltiplos locais para o mesmo cliente (`montagem`, `entrega`, `cobranca`, `residencial`, `comercial`) com flag de endereço principal (`is_principal`).
   - Inclusão da chave estrangeira `cliente_id` na tabela `projetos` para vínculo direto ao cliente contratante.

2. **Regras de Negócio & Guardrails:**
   - **Aprovação Financeira de Cadastro:** Clientes possuem fluxo de liberação cadastral (`POST /clientes/:id/aprovar`) restrito estritamente aos perfis `DIRETORIA`, `GERENTE_COMERCIAL` e `FINANCEIRO`.
   - **Vínculo com Especificador:** Clientes indicados por arquitetos mantêm o vínculo persistido para cálculo automático de comissionamento e pontuação no motor RFV.
   - **Conversão de Lead em Cliente:** Endpoint `POST /clientes/converter-lead/:leadId` transiciona o lead do funil comercial (`status = fechado`) e gera a ficha formal do cliente com seu primeiro endereço.

3. **Interface Gráfica Reativa Completa (Inertia + React 19):**
   - **Menu Lateral:** Adicionado item "Clientes" no menu Comercial com ícone dedicado.
   - **Listagem e Gestão Geral:** [`clientes/index.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/clientes/index.tsx) com painel de KPIs (Total de Clientes, Cadastros Aprovados, Pendentes e PJ), filtros dinâmicos e tabela de clientes com badges visuais.
   - **Ficha do Cliente:** [`clientes/show.tsx`](file:///home/porto/codespace/Plannit/plannit/inertia/pages/clientes/show.tsx) com dados cadastrais completos, modo de edição inline, cards de múltiplos endereços com exclusão/adição e tabela com histórico completo de compras/projetos com valor contratado e status.
   - **Modais:** `NovoClienteModal.tsx` e `NovoEnderecoModal.tsx`.

---

## 2. Matriz de Testes e Validações da Fase 7

| Teste Realizado | Escopo / Método | Asserções | Resultado |
| :--- | :--- | :---: | :--- |
| **Migrations PostgreSQL** | `node ace migration:run` | — | ✅ **Tabelas `clientes` e `enderecos_cliente` criadas + FK em `projetos`** |
| **Povoamento de Dados (Seeders)** | `cliente_seeder.ts` | — | ✅ **Clientes PF e PJ realistas populados com múltiplos endereços e projetos** |
| **Typecheck TypeScript** | `npm run typecheck` | — | ✅ **0 erros** em todo o servidor e cliente Inertia |
| **Build de Produção** | `npm run build` | — | ✅ **Compilação concluída com sucesso** (`clientes-*.js`) |
| **Suíte HTTP End-to-End** | `scripts/test_http_clientes.js` | 7 | ✅ **100% aprovado** (Listagem, show, criação, múltiplos endereços, aprovação e bloqueio RBAC) |
| **TOTAL DE ASSERÇÕES DA FASE 7** | — | **7** | ✅ **100% DE SUCESSO** |

---

# Walkthrough: Fase 8 — Dashboard Gerencial Consolidado & Alertas de Estagnação (RN016)

O **Dashboard Gerencial Consolidado** foi 100% implementado, auditado e validado em **AdonisJS v7 + Inertia.js + React 19**, unificando as métricas executivas de todos os módulos da plataforma e aplicando a regra inegociável **RN016**.

---

## 1. O que foi Entregue na Fase 8

1. **Camada Analítica de Controle & Agregação (`dashboard_controller.ts`):**
   - Agregação em tempo real dos 6 subsistemas: CRM de Leads, Projetos Ativos, Briefings, Fila de Capacidade WIP, Carteira de Especificadores e Headcount de RH.
   - Cálculo automático do **Valor Total em Carteira (R$)** e da **Taxa de Conversão Comercial** (leads → contratos fechados).
   - Integração com o serviço [`wip_service.ts`](file:///home/porto/codespace/Plannit/plannit/app/services/wip_service.ts), expondo em tempo real a taxa de ocupação e vagas de cada projetista.

2. **Regra de Negócio Inegociável RN016 — Alerta de Estagnação:**
   - Todo projeto ativo (não concluído e não cancelado) cuja última movimentação de etapa (`status_alterado_em` ou `updated_at`) seja superior a **5 dias úteis** aciona imediatamente o alerta de estagnação.
   - O projeto é destacado com badge vermelho de atenção (`+X dias parado`) e priorizado no topo da esteira produtiva.

3. **Interface Gráfica Reativa Executiva (`dashboard.tsx`):**
   - **Banner de Alerta Crítico RN016:** Cartão proeminente no topo com contagem e cards individuais dos projetos travados, vendedor responsável, projetista e dias de atraso.
   - **Cards de KPIs Executivos:** Projetos Ativos, Leads no Funil, Taxa de Conversão de Vendas (%) e Valor em Carteira (R$).
   - **Funil de Conversão Comercial:** Gráfico de barras com distribuição percentual dos leads em cada estágio do funil.
   - **Monitor de Ocupação WIP (RN003):** Cartões com barras coloridas (verde, âmbar, vermelho) indicando carga de cada projetista.
   - **Tabela Operacional de Projetos:** Listagem com código, cliente, status, vendedor, projetista, valor de contrato e indicador cronológico de estagnação.

---

## 2. Matriz de Testes e Validações da Fase 8

| Teste Realizado | Escopo / Método | Asserções | Resultado |
| :--- | :--- | :---: | :--- |
| **Povoamento de Dados (Seeders)** | `dashboard_rn016_seeder.ts` | — | ✅ **Projeto estagnado há 8 dias criado para auditoria** |
| **Typecheck TypeScript** | `npm run typecheck` | — | ✅ **0 erros** no servidor Adonis e cliente Inertia |
| **Build de Produção** | `npm run build` | — | ✅ **Compilação concluída com sucesso** (`dashboard-*.js`) |
| **Suíte HTTP End-to-End** | `scripts/test_http_dashboard.js` | 6 | ✅ **100% aprovado** (KPIs consolidados, RN016 alerta de estagnação, WIP 3D e tabela operacional) |
| **TOTAL DE ASSERÇÕES DA FASE 8** | — | **6** | ✅ **100% DE SUCESSO** |



