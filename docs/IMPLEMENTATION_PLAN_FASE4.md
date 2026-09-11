# Plano de Implementação — Fase 4: Fila de Projetos, Alocação & Limite WIP por Projetista (RN003)

Nesta **Fase 4**, implementaremos o coração operacional do desenvolvimento de projetos da **Líder Móveis Planejados**: a **Fila de Projetos** e o **Controle de Capacidade WIP Limit (RN003)**. O objetivo é assegurar que projetos qualificados (Fase 3) sejam distribuídos para a equipe de projetistas de forma equilibrada, respeitando a capacidade simultânea de cada profissional e mantendo rastreabilidade total de histórico e arquivamento (RN017).

---

## 1. Regras de Negócio e Guardrails da Fase 4

1. **RN003 — Limite WIP por Projetista:**
   - Nenhum projetista pode receber novos projetos se atingiu sua capacidade máxima simultânea (`wip_atual >= wip_limit`).
   - Padrão do sistema: **3 projetos simultâneos** por projetista (status `alocado` ou `em_andamento`).
   - Gestores (`DIRETORIA`, `GERENTE_COMERCIAL`) podem customizar o limite de cada projetista na tabela `config_wip_projetistas`.
2. **RF013 & RF014 — Alocação Técnica e Despacho:**
   - Projetos que chegam da Fase 3 (com status `na_fila` e na `fila_projetos` como `aguardando`) podem ser alocados manual ou sugeridamente para projetistas disponíveis.
   - Ao alocar um projetista:
     - `fila_projetos.projetista_id` é vinculado e `fila_projetos.status` avança para `alocado`.
     - `projetos.projetista_id` é atualizado e `projetos.status` avança para `em_projeto`.
     - `fila_projetos.data_alocacao` é registrada com timestamp UTC.
3. **RN017 — Preservação de Histórico e Soft Delete:**
   - Toda alteração de status grava histórico imutável em `historico_status_projeto` com autor (`alterado_por_id`), status anterior, status novo e observação.
   - Projetos nunca são deletados fisicamente; apenas arquivados (`arquivado = true`) com motivo obrigatório.
4. **Isolamento de Acesso (RBAC):**
   - Projetistas visualizam apenas seus projetos atribuídos e a fila geral disponível.
   - Vendedores visualizam os projetos de seus clientes.
   - Gestão (`DIRETORIA`, `GERENTE_COMERCIAL`) tem visão panorâmica de todos os projetistas, capacidade da equipe e projetos.

---

## 2. Mudanças Propostas

### A. Banco de Dados & Migrations (PostgreSQL)

#### [NEW] [create_config_wip_projetistas_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935175_create_config_wip_projetistas_table.ts)
- Tabela `config_wip_projetistas`:
  - `id`: increments
  - `projetista_id`: FK `users.id` (unique, onDelete CASCADE, notNullable)
  - `wip_limit`: integer (default 3, notNullable)
  - `ativo`: boolean (default true, notNullable)
  - `created_at`, `updated_at`: timestamps com timezone

#### [NEW] [create_historico_status_projeto_table.ts](file:///home/porto/codespace/Plannit/plannit/database/migrations/1761885935176_create_historico_status_projeto_table.ts)
- Tabela `historico_status_projeto` (RN017):
  - `id`: increments
  - `projeto_id`: FK `projetos.id` (onDelete CASCADE, notNullable)
  - `status_de`: string (nullable)
  - `status_para`: string (notNullable)
  - `alterado_por_id`: FK `users.id` (onDelete SET NULL, nullable)
  - `observacao`: text (nullable)
  - `created_at`: timestamp com timezone

---

### B. Camada de Domínio & Models (Lucid ORM)

#### [NEW] [config_wip_projetista.ts](file:///home/porto/codespace/Plannit/plannit/app/models/config_wip_projetista.ts)
- Model `ConfigWIPProjetista` com relacionamento `belongsTo(User)` para o projetista.

#### [NEW] [historico_status_projeto.ts](file:///home/porto/codespace/Plannit/plannit/app/models/historico_status_projeto.ts)
- Model `HistoricoStatusProjeto` com relacionamentos `belongsTo(Projeto)` e `belongsTo(User, { foreignKey: 'alteradoPorId' })`.

#### [MODIFY] [projeto.ts](file:///home/porto/codespace/Plannit/plannit/app/models/projeto.ts)
- Adicionar relacionamento `hasMany(HistoricoStatusProjeto)`.

---

### C. Camada de Serviço (WIP Limit Engine)

#### [NEW] [wip_service.ts](file:///home/porto/codespace/Plannit/plannit/app/services/wip_service.ts)
- Funções operacionais:
  - `getWipAtual(projetistaId: number): Promise<number>`: contabiliza projetos ativos em `fila_projetos` com status `['alocado', 'em_andamento']`.
  - `getWipLimit(projetistaId: number): Promise<number>`: obtém limite configurado ou fallback padrão de 3.
  - `podeAlocar(projetistaId: number): Promise<PodeAlocarResult>`: verifica se `wipAtual < wipLimit`, retornando capacidade restante e mensagem amigável.
  - `listarProjetistasComCapacidade(): Promise<ProjetistaCapacidade[]>`: obtém todos os projetistas ativos com WIP atual, limite, % de ocupação e se estão aptos a receber projetos.
  - `configurarWipLimit(projetistaId: number, limite: number): Promise<void>`: atualiza ou cria configuração de WIP.

---

### D. Camada de Validação (VineJS)

#### [NEW] [fila.ts](file:///home/porto/codespace/Plannit/plannit/app/validators/fila.ts)
- `alocarProjetistaValidator`: `{ projetistaId: number, prioridade?: number, observacao?: string }`.
- `configurarWipValidator`: `{ projetistaId: number, wipLimit: number }`.
- `mudarStatusProjetoValidator`: `{ status: string, observacao?: string }`.
- `arquivarProjetoValidator`: `{ motivo: string }`.

---

### E. Camada de Controle & Rotas

#### [NEW] [fila_controller.ts](file:///home/porto/codespace/Plannit/plannit/app/controllers/fila_controller.ts)
- `index`: Renderiza a tela principal da Fila de Projetos via Inertia com:
  - Projetos na fila agrupados por status (`aguardando`, `alocado`, `em_andamento`, `concluido`).
  - Lista de projetistas com indicador de capacidade WIP em tempo real.
  - Métricas da fila: total aguardando, projetos alocados, tempo médio de fila e taxa de ocupação da equipe.
- `alocar`: Endpoint `POST /fila/:id/alocar` com validação estrita da **RN003**:
  - Se projetista atingiu limite: bloqueia com erro 422 e flash message explicativa.
  - Se apto: aloca projetista, atualiza status para `alocado` / `em_projeto`, grava histórico imutável e emite notificação de sucesso.
- `desalocar`: Endpoint `POST /fila/:id/desalocar` para retornar projeto à fila de espera caso necessário.
- `iniciarExecucao`: Endpoint `POST /fila/:id/iniciar` para o projetista marcar o projeto como `em_andamento`.
- `configurarWip`: Endpoint `POST /wip/configuracoes` exclusivo para gestores ajustarem a capacidade de projetistas.
- `arquivar`: Endpoint `POST /projetos/:id/arquivar` com validação de motivo (RN017).

#### [MODIFY] [routes.ts](file:///home/porto/codespace/Plannit/plannit/start/routes.ts)
- Registrar rotas sob autenticação e RBAC:
  - `GET /fila` -> `FilaController.index`
  - `POST /wip/configuracoes` -> `FilaController.configurarWip` (caminho fixo antes dos dinâmicos)
  - `POST /fila/:id/alocar` -> `FilaController.alocar`
  - `POST /fila/:id/desalocar` -> `FilaController.desalocar`
  - `POST /fila/:id/iniciar` -> `FilaController.iniciarExecucao`
  - `POST /projetos/:id/arquivar` -> `FilaController.arquivar`

---

### F. Seeders de Demonstração

#### [NEW] [fila_seeder.ts](file:///home/porto/codespace/Plannit/plannit/database/seeders/fila_seeder.ts)
- Cria múltiplos projetistas de demonstração com diferentes cargas de trabalho:
  1. *Projetista 1 (Líder)*: 2 projetos ativos de 3 (Disponível para 1 projeto).
  2. *Projetista 2 (Sênior)*: 3 projetos ativos de 3 (**Capacidade Esgotada - Teste RN003**).
  3. *Projetista 3 (Júnior)*: Limite customizado de 2 projetos, 0 ativos (Totalmente Livre).
- Cria múltiplos projetos na fila com status `aguardando`, prazos e prioridades variadas.

---

### G. Interface Gráfica & Componentes (Inertia + React 19)

#### [MODIFY] [app_layout.tsx](file:///home/porto/codespace/Plannit/plannit/inertia/layouts/app_layout.tsx)
- Ativar link "Fila de Projetos" / "Projetos" na barra lateral de navegação com ícone e badge `RN003`.

#### [NEW] [fila/index.tsx](file:///home/porto/codespace/Plannit/plannit/inertia/pages/fila/index.tsx)
- **Barra Superior de Indicadores Operacionais:**
  - Projetos Aguardando Alocação, Projetos em Andamento, Capacidade Total da Equipe de Projetistas.
- **Painel de Capacidade da Equipe (WIP Monitor):**
  - Card visual para cada projetista exibindo foto/iniciais, projetos ativos / limite (ex: `2/3`), barra de progresso colorida (Verde < 70%, Âmbar 70-99%, Vermelho 100% Lotado) e badge "Disponível" / "Lotado (RN003)".
  - Botão para gestores ajustarem os limites WIP.
- **Visão Dupla: Quadro Kanban da Fila e Tabela:**
  - Coluna 1: **Aguardando Alocação** (Projetos recém-chegados de briefings aprovados ≥ 70 pts).
  - Coluna 2: **Alocados** (Projetista definido, aguardando início da modelagem 3D).
  - Coluna 3: **Em Andamento** (Modelagem técnica sendo executada).
  - Coluna 4: **Concluídos** (Prontos para render/validação).
- **Cards de Projetos Ricos:**
  - Código, cliente, vendedor, score do briefing aprovado, dias na fila, prioridade.
  - Botão de ação direta "Alocar Projetista" com modal inteligente:
    - O seletor de projetistas destaca quem tem vaga livre e desabilita ou alerta quem está com capacidade esgotada pela regra RN003.

---

## 3. Plano de Verificação

### Testes Automatizados
- **Verificação de Tipagem:** `npm run typecheck` cobrindo o backend AdonisJS e o frontend Inertia/React 19 (0 erros).
- **Compilação de Produção:** `npm run build` garantindo bundle Vite e controllers sem falhas.
- **Script de Teste de Domínio e Banco (`scripts/test_wip.js`):**
  - Validação da query de contagem de WIP ativo.
  - Teste de tentativa de alocação no projetista lotado (3/3): deve retornar `pode: false` e bloquear a transação.
  - Teste de alocação no projetista disponível (2/3): deve autorizar, avançar status para `alocado` e criar histórico imutável (RN017).
- **Script de Teste HTTP End-to-End (`scripts/test_http_fila.js`):**
  - Autenticação e navegação em `GET /fila` via Inertia.
  - `POST /fila/:id/alocar` com projetista lotado -> valida resposta de bloqueio RN003.
  - `POST /fila/:id/alocar` com projetista livre -> valida sucesso, transição para `em_projeto` e atualização dos dados.
  - `POST /wip/configuracoes` -> valida alteração do limite por perfil gestor.

### Testes Manuais
- Acessar o sistema pelo navegador, navegar até a Fila de Projetos e interagir com o modal de alocação observando o bloqueio visual e a mensagem amigável para profissionais com capacidade esgotada.
