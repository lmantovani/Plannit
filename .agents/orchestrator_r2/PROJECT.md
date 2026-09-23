# Projeto: Saneamento Arquitetural e Correções Plannit (Round 2)

## Architecture
- **Stack Backend**: AdonisJS v7 (`@adonisjs/core`), Lucid ORM (`@adonisjs/lucid`), PostgreSQL (`pg`), VineJS (`@vinejs/vine`).
- **Stack Frontend**: Inertia.js (`@adonisjs/inertia`, `@inertiajs/react`), React 19, Lucide React, TailwindCSS 3.
- **Diretório da Aplicação**: `/home/porto/codespace/Plannit/plannit`
- **Fluxo e Integridade**:
  1. **RN001**: Bloqueio prévio de avanço de funil para leads com `qualificado === false` em `briefings_controller.ts:store` e `clientes_controller.ts:converterLead`.
  2. **RN017**: Auditoria imutável compulsória em `HistoricoStatusProjeto` para transições de status (`enviarParaFila` -> `EM_BRIEFING` para `NA_FILA`).
  3. **Concorrência 3D**: Transações atômicas com `forUpdate` no `Projeto` e cálculo `COALESCE(MAX(versao), 0) + 1` no banco para novas versões comerciais.
  4. **Integridade Relacional de Clientes**: Vinculação obrigatória de `cliente_id` em projetos criados via briefing e atualização em massa de projetos na conversão de leads.
  5. **Especificadores em Briefing**: Auto-preenchimento relacional de dados de contato do parceiro na Seção 6 de `edit.tsx` e cadastro rápido via AJAX (sem perda de rascunho).

## Feature Inventory
| # | Feature | Descrição | Milestone | Source |
|---|---------|-----------|-----------|--------|
| F21 | Integração Relacional de Especificadores no Briefing e Projetos | Seção 6 de `edit.tsx` com `<select>` de arquitetos ativos, auto-preenchimento, modal AJAX sem perda de rascunho, e sincronização de `projetos.arquiteto_id` via `update` | M7, M6 | R1, ORIGINAL_REQUEST |
| F22 | Integridade Relacional de Clientes em Projetos e Conversão de Leads | Criação de projetos em `briefings_controller:store` populando `cliente_id`; em `converterLead`, atualizar todos os projetos do lead (`where('lead_id', lead.id)`) definindo `cliente_id = cliente.id` | M6 | R2, ORIGINAL_REQUEST |
| F23 | Auditoria Imutável no Envio de Briefing à Fila (RN017) | Em `enviarParaFila`, registrar transição em `HistoricoStatusProjeto` (`statusDe: EM_BRIEFING`, `statusPara: NA_FILA`, autor `auth.user.id` e justificativa) | M6 | R3, ORIGINAL_REQUEST |
| F24 | Blindagem Contra Concorrência em Versões 3D | Em `submeterVersao3D`, executar transação com `.forUpdate()` no `Projeto` e `MAX(versao) + 1` no banco de dados para eliminar race conditions | M6 | R4, ORIGINAL_REQUEST |
| F25 | Validação Estrita do Funil de Qualificação (RN001) | Em `briefings_controller:store` e `clientes_controller:converterLead`, rejeitar leads com `qualificado === false` com HTTP 400 (`RN001_LEAD_NAO_QUALIFICADO`) | M6 | R5, ORIGINAL_REQUEST |
| F26 | Suíte de Testes Automatizados E2E e Validação de Tipagem/Build | Scripts de teste automatizado para as 5 regras, `npm run typecheck` (0 erros) e `npm run build` (sucesso Vite) | M8 | Acceptance Criteria |

## Milestones
| # | Nome | Escopo | Dependências | Status |
|---|------|--------|--------------|--------|
| M6 | Backend Core: Saneamento Relacional e Regras de Negócio | F22, F23, F24, F25 e backend de F21 (`briefings_controller.ts`, `clientes_controller.ts`, `projetos_controller.ts`, `validators/briefing.ts`) | Survey concluído | DONE |
| M7 | Frontend Briefing: Seção 6 e Modal Rápido AJAX | F21 frontend (`inertia/pages/briefings/edit.tsx` com props, select, auto-complete e modal AJAX) | M6 | DONE |
| M8 | Verificação E2E, Testes Automatizados e Auditoria | F26 (testes funcionais R1-R5, typecheck, build, 2x Reviewers, 2x Challengers, 1x Forensic Auditor) | M6, M7 | DONE |

## Interface Contracts
### `briefings_controller.ts:update`
- Payload aceito: `arquitetoId` (number, positive, optional, nullable).
- Sincronização: se `projeto` existir, atribui `projeto.arquitetoId = payload.arquitetoId !== undefined ? payload.arquitetoId : projeto.arquitetoId`.

### `briefings_controller.ts:store`
- Se `leadId` informado:
  - Busca `lead`. Se `!lead.qualificado`, retorna HTTP 400 `{ message: 'RN001: Lead não pode avançar no funil sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' }`.
  - Resolve `clienteId`: se `lead.clienteId` existir, usa; caso contrário, busca ou cria `Cliente` pelo nome do cliente e vincula `clienteId`.

### `clientes_controller.ts:converterLead`
- Se `!lead.qualificado`, retorna HTTP 400 `{ message: 'RN001: Lead não pode ser convertido sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' }`.
- Dentro de `db.transaction`:
  - Cria cliente e endereço.
  - Atualiza projetos associados: `await Projeto.query({ client: trx }).where('lead_id', lead.id).update({ cliente_id: cliente.id })`.
  - Atualiza lead (`convertidoEmCliente = true`, `clienteId = cliente.id`, `statusFunil = 'fechado'`).

### `briefings_controller.ts:enviarParaFila`
- Recebe `auth` no `HttpContext`.
- Dentro de `db.transaction`:
  - Atualiza status do projeto para `StatusProjeto.NA_FILA`.
  - Registra em `HistoricoStatusProjeto`:
    - `projetoId`: `briefing.projeto.id`
    - `statusDe`: `statusAnterior` (`StatusProjeto.EM_BRIEFING`)
    - `statusPara`: `StatusProjeto.NA_FILA`
    - `alteradoPorId`: `auth.user.id`
    - `observacao`: `'Briefing aprovado com score de qualificação e enviado para a fila de projetos (RN017)'`

### `projetos_controller.ts:submeterVersao3D`
- Dentro de `db.transaction`:
  - `const projeto = await Projeto.query({ client: trx }).where('id', params.id).forUpdate().first()`
  - Consulta atômica:
    `const maxRes = await trx.from('projetos_comerciais').where('projeto_id', projeto.id).max('versao as max_versao').first()`
    `const proximaVersao = (Number(maxRes?.max_versao) || 0) + 1`
  - Cria `ProjetoComercial` com `versao: proximaVersao`.

### Frontend `inertia/pages/briefings/edit.tsx` (Seção 6)
- Props: `especificadores` (`Arquiteto[]`) e `consultores` (`User[]`).
- Dropdown para selecionar arquiteto parceiro existente.
- Auto-preenchimento dos campos `arquitetoNome`, `arquitetoEmail`, `arquitetoTelefone`.
- Botão "+ Novo Parceiro": abre modal.
- Submissão do modal via AJAX (`fetch('/especificadores?format=json', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': ... } })`):
  - Retorna 201 JSON com novo arquiteto.
  - Adiciona o novo arquiteto na lista local `especificadores`, seleciona-o e preenche os campos de contato.
  - Rascunho não é perdido (zero reload de página).

## Code Layout
- Backend:
  - `plannit/app/controllers/briefings_controller.ts`
  - `plannit/app/controllers/clientes_controller.ts`
  - `plannit/app/controllers/projetos_controller.ts`
  - `plannit/app/validators/briefing.ts`
- Frontend:
  - `plannit/inertia/pages/briefings/edit.tsx`
- Testes:
  - `plannit/scripts/test_challenger_concorrencia_3d.js`
  - `plannit/scripts/test_saneamento_r2.js`
