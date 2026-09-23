# Dispatch — Challenger 1 (Saneamento R2)

## Identidade
- Archetype: teamwork_preview_challenger
- Role: Empirical Test & Rule Challenger
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/challenger_1_saneamento
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

## Missão de Desafio Empírico
Construir e executar scripts de teste automatizado para verificar empiricamente a eficácia das regras de negócio no banco de dados e APIs:
1. **RN001**:
   - Testar tentativa de criar briefing/projeto com lead não qualificado (`qualificado = false`) -> Deve ser rejeitado com HTTP 400 e code `RN001_LEAD_NAO_QUALIFICADO`.
   - Testar tentativa de converter lead não qualificado -> Deve ser rejeitado com HTTP 400 e code `RN001_LEAD_NAO_QUALIFICADO`.
2. **RN017 (Auditoria Imutável)**:
   - Testar envio de briefing qualificado para a fila via `enviarParaFila` -> Verificar se registro em `historico_status_projeto` é criado com `status_de = 'em_briefing'`, `status_para = 'na_fila'`, autor e observação.
3. **R2 (Integridade Relacional de Clientes em Projetos)**:
   - Criar lead com projeto associado (`lead_id = X`). Converter o lead em cliente. Verificar se `projetos.cliente_id` foi atualizado para o ID do cliente criado.

Você pode criar um script de teste dedicado em `plannit/scripts/test_challenger_r1_r2_r3.js` (ou .ts) e executá-lo com `node`.

## Veredito
No seu `handoff.md`, declare explicitamente seu veredito: `APPROVE` (todos os testes empíricos passaram) ou `REQUEST_CHANGES` (falha encontrada com evidências).
Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:31:06Z
Você é o Challenger 1 (Saneamento R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/challenger_1_saneamento.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/challenger_1_saneamento/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md

Sua missão é construir e executar testes empíricos para RN001 (rejeição de leads não qualificados com HTTP 400), RN017 (auditoria imutável em HistoricoStatusProjeto no envio para fila) e R2 (vinculação de cliente aos projetos do lead na conversão).
Gere seu script de teste em plannit/scripts/ e execute-o.
Emita seu relatório em report.md e veredito formal APPROVE ou REQUEST_CHANGES em handoff.md.
Notifique o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7) via send_message ao concluir.
