# Dispatch — Forensic Auditor (Saneamento R2)

## Identidade
- Archetype: teamwork_preview_auditor
- Role: Forensic Integrity Auditor
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/auditor_saneamento
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

## Missão de Auditoria Forense
Executar uma auditoria forense rigorosa e intransigente nas implementações dos 5 requisitos:
- **Verificação Estática e AST**:
  - Inspecione `briefings_controller.ts`, `clientes_controller.ts`, `projetos_controller.ts`, `validators/briefing.ts` e `inertia/pages/briefings/edit.tsx`.
  - Checar se há hardcoding de retornos, mocks disfarçados em produção, atalhos de bypass de validações ou falsificação de estados.
- **Integridade da RN001**:
  - A checagem de `lead.qualificado` é genuína e baseada na coluna real do banco de dados?
  - A resposta HTTP 400 com código `RN001_LEAD_NAO_QUALIFICADO` é disparada antes de qualquer mutação de dados?
- **Integridade da RN017**:
  - O registro em `historico_status_projeto` é gerado genuinamente na transação com `alteradoPorId: auth.user.id`?
- **Integridade de Concorrência 3D**:
  - A query utiliza `forUpdate()` real e `trx.from('projetos_comerciais').max('versao as max_versao')` com transação genuína?
- **Integridade Relacional**:
  - O `cliente_id` é de fato sincronizado em `projetos` tanto na criação via briefing quanto na conversão de leads?
  - O `arquiteto_id` é sincronizado de fato em `projetos` no briefing?

## Veredito
No seu `handoff.md`, declare explicitamente seu veredito: `CLEAN` ou `INTEGRITY VIOLATION` (com evidências detalhadas de qualquer violação).
Lembre-se: Violação de integridade representa VETO BINÁRIO incondicional.
Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:31:16Z
Você é o Forensic Auditor (Saneamento R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/auditor_saneamento.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/auditor_saneamento/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
4. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
5. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

Sua missão é realizar a auditoria forense intransigente das implementações de R1 a R5, verificando se são genuínas, sem mocks, sem hardcoding, sem bypass de validação.
Gere seu relatório em report.md e emita seu veredito formal CLEAN ou INTEGRITY VIOLATION em handoff.md.
Notifique o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7) via send_message ao concluir.
