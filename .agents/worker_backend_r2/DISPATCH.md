# Dispatch — Worker Backend (R2)

## Identidade
- Archetype: teamwork_preview_worker
- Role: Backend Core Developer
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/worker_backend_r2
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/explorer_1_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/explorer_2_r2/handoff.md
5. /home/porto/codespace/Plannit/.agents/explorer_3_r2/handoff.md

## Aviso Obrigatório de Integridade
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Arquivos sob sua Posse Exclusiva (Write Ownership)
- `plannit/app/controllers/briefings_controller.ts`
- `plannit/app/controllers/clientes_controller.ts`
- `plannit/app/controllers/projetos_controller.ts`
- `plannit/app/validators/briefing.ts`
(NÃO altere nenhum outro arquivo!)

## Escopo e Instruções Cirúrgicas de Implementação

### 1. Requisito R1 (Backend) — `briefing.ts` e `briefings_controller.ts:update`
- Em `app/validators/briefing.ts`:
  - Garantir `arquitetoId: vine.number().positive().nullable().optional()`.
  - Alterar `arquitetoTelefone: vine.string().trim().maxLength(30).nullable().optional()`.
- Em `app/controllers/briefings_controller.ts` no método `update`:
  - Garantir que `projeto.arquitetoId` receba `payload.arquitetoId` de forma segura. Se `payload.arquitetoId !== undefined`, atribuir `projeto.arquitetoId = payload.arquitetoId ?? null`. Se `payload.arquitetoNome !== undefined`, atualizar `projeto.arquitetoNome = payload.arquitetoNome ?? null`.

### 2. Requisito R2 — Integridade Relacional de Clientes em Projetos e Conversão de Leads
- Em `app/controllers/clientes_controller.ts` no método `converterLead`:
  - Importar `db` de `@adonisjs/lucid/services/db` e `Projeto` de `#models/projeto`.
  - Se `!lead.qualificado`, rejeitar imediatamente com HTTP 400 (ver R5 abaixo).
  - Envolver as operações em `db.transaction(async (trx) => { ... })`.
  - Criar `Cliente` e `EnderecoCliente` passando `{ client: trx }`.
  - Executar: `await Projeto.query({ client: trx }).where('lead_id', lead.id).update({ cliente_id: cliente.id })`.
  - Atualizar `lead` (`lead.useTransaction(trx)`, `lead.convertidoEmCliente = true`, `lead.clienteId = cliente.id`, `lead.statusFunil = 'fechado'`, `await lead.save()`).
- Em `app/controllers/briefings_controller.ts` no método `store`:
  - Importar `Cliente` e `Lead`.
  - Se `leadId` for informado:
    - Se `!lead.qualificado`, rejeitar imediatamente com HTTP 400 (ver R5 abaixo).
    - Se o lead possuir `clienteId`, usar esse ID para o projeto.
    - Se não possuir `clienteId` e `clienteNome` estiver preenchido, localizar ou criar `Cliente` pelo nome (`Cliente.firstOrCreate(...)` com dados básicos) e atribuir `clienteId: cliente.id` em `Projeto.create`.
  - Se `!leadId` e `clienteNome` estiver preenchido:
    - Localizar ou criar `Cliente` (`Cliente.firstOrCreate({ nome: clienteNome.trim() }, { ... })`) para garantir que `clienteId` seja sempre populado em `Projeto.create`.

### 3. Requisito R3 — Auditoria Imutável no Envio de Briefing à Fila (RN017)
- Em `app/controllers/briefings_controller.ts` no método `enviarParaFila`:
  - Adicionar `auth` à desestruturação de `HttpContext`: `{ params, response, session, auth }: HttpContext`.
  - Obter `const user = auth.user!`.
  - Importar `HistoricoStatusProjeto` de `#models/historico_status_projeto`.
  - Registrar a transição de status em `HistoricoStatusProjeto` dentro da transação `trx`:
    ```typescript
    await HistoricoStatusProjeto.create(
      {
        projetoId: briefing.projeto.id,
        statusDe: statusAnterior, // status do projeto antes da alteração (StatusProjeto.EM_BRIEFING)
        statusPara: StatusProjeto.NA_FILA,
        alteradoPorId: user.id,
        observacao: 'Briefing aprovado com score de qualificação e enviado para a fila de projetos (RN017)',
      },
      { client: trx }
    )
    ```

### 4. Requisito R4 — Blindagem Contra Concorrência em Versões 3D
- Em `app/controllers/projetos_controller.ts` no método `submeterVersao3D`:
  - Abrir `db.transaction(async (trx) => { ... })` logo após a validação do payload.
  - Bloquear a linha do projeto com `.forUpdate()`:
    `const projeto = await Projeto.query({ client: trx }).where('id', params.id).forUpdate().first()`
  - Se `!projeto`, retornar 404. Se `projeto.arquivado`, retornar 400.
  - Consultar atomicamente o maior número de versão existente no banco:
    `const maxVersaoRes = await trx.from('projetos_comerciais').where('projeto_id', projeto.id).max('versao as max_versao').first()`
    `const proximaVersao = (Number(maxVersaoRes?.max_versao) || 0) + 1`
  - Criar `ProjetoComercial` com `versao: proximaVersao` usando `{ client: trx }`.
  - Atualizar status do projeto dentro da transação e gravar histórico.

### 5. Requisito R5 — Validação Estrita do Funil de Qualificação (RN001)
- Em `app/controllers/briefings_controller.ts:store`:
  - Se `leadId` for passado, buscar `const lead = await Lead.find(leadId)`.
  - Se `!lead`, retornar erro.
  - Se `!lead.qualificado`, retornar:
    `return response.badRequest({ message: 'RN001: Lead não pode avançar no funil sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' })`.
- Em `app/controllers/clientes_controller.ts:converterLead`:
  - Se `!lead.qualificado`, retornar:
    `return response.badRequest({ message: 'RN001: Lead não pode ser convertido sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' })`.

## Verificação Obrigatória
Após implementar, execute no diretório `/home/porto/codespace/Plannit/plannit`:
`npm run typecheck`
O resultado DEVE ser zero erros.
Registre os comandos e saídas em seu `handoff.md`.
Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:21:04Z
Você é o Worker Backend (R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/worker_backend_r2.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/worker_backend_r2/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Sua missão é implementar com precisão cirúrgica as correções de backend nos arquivos que você possui exclusivamente:
- plannit/app/controllers/briefings_controller.ts (R1, R2, R3, R5)
- plannit/app/controllers/clientes_controller.ts (R2, R5)
- plannit/app/controllers/projetos_controller.ts (R4)
- plannit/app/validators/briefing.ts (R1)

Execute npm run typecheck no diretório /home/porto/codespace/Plannit/plannit para comprovar zero erros.
Gere seu relatório completo de handoff em /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md e envie mensagem de conclusão via send_message para o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7).

