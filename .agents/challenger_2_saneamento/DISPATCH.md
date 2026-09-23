# Dispatch — Challenger 2 (Saneamento R2)

## Identidade
- Archetype: teamwork_preview_challenger
- Role: Concurrency & Stress Challenger
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/challenger_2_saneamento
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

## Missão de Desafio Empírico
Construir e executar testes adversariais automatizados focados em:
1. **R4 (Blindagem contra Concorrência em Versões 3D)**:
   - Disparar múltiplas requisições simultâneas (ex: 5 a 10 requisições paralelas via `Promise.all`) submetendo versões 3D para o mesmo projeto (`submeterVersao3D`).
   - Verificar no banco de dados se as versões geradas são estritamente sequenciais e sem colisão (ex: v1, v2, v3, v4, v5) e sem duplicidade de versão para o mesmo `projeto_id`.
2. **R1 (Sincronização de Parceiro no Briefing)**:
   - Testar salvamento de rascunho de briefing (`update`) com `arquitetoId` preenchido -> Verificar se `projetos.arquiteto_id` é persistido.
   - Testar salvamento subsequente sem `arquitetoId` no payload -> Verificar se o vínculo com `projetos.arquiteto_id` é preservado (não é deletado silenciosamente).
   - Testar endpoint `POST /especificadores` com header `Accept: application/json` -> Verificar resposta HTTP 201 com objeto JSON do arquiteto.

Você pode criar um script de teste em `plannit/scripts/test_challenger_concorrencia_3d.js` (ou .ts) e executá-lo com `node`.

## Veredito
No seu `handoff.md`, declare explicitamente seu veredito: `APPROVE` (todos os testes de estresse/concorrência passaram) ou `REQUEST_CHANGES` (falha encontrada com evidências).
Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:31:06Z
Você é o Challenger 2 (Saneamento R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/challenger_2_saneamento.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/challenger_2_saneamento/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md

Sua missão é construir e executar testes empíricos de estresse para R4 (concorrência com múltiplas requisições simultâneas em submeterVersao3D garantindo versões estritamente sequenciais) e R1 (sincronização de parceiro no briefing e persistência em projetos.arquiteto_id).
Gere seu script de teste em plannit/scripts/ e execute-o.
Emita seu relatório em report.md e veredito formal APPROVE ou REQUEST_CHANGES em handoff.md.
Notifique o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7) via send_message ao concluir.

