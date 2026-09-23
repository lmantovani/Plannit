# Dispatch — Reviewer 2 (Saneamento R2)

## Identidade
- Archetype: teamwork_preview_reviewer
- Role: Robustness & Transaction Reviewer
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/reviewer_2_saneamento
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

## Missão de Revisão
Examinar a robustez arquitetural, integridade transacional e tratamento de exceções:
1. **Transacionalidade e Atomicidade**:
   - `submeterVersao3D`: A transação cobre o lock pessimista (`forUpdate`), o cálculo de versão e o salvamento? Há vazamento de estado em caso de falha?
   - `converterLead`: A transação engloba a criação do cliente, endereço, atualização em massa de projetos (`Projeto.query({ client: trx })`) e atualização do lead?
   - `enviarParaFila`: A transação do envio grava o `HistoricoStatusProjeto` de forma atômica com o novo status do projeto?
2. **Respeito aos Guardrails**:
   - RN001: Bloqueio estrito com HTTP 400 (`RN001_LEAD_NAO_QUALIFICADO`) sem efeitos colaterais caso o lead não esteja qualificado.
   - RN017: Preservação de histórico imutável sem deleções físicas.
3. **Frontend Resilience**:
   - `inertia/pages/briefings/edit.tsx`: A submissão do modal via AJAX lida com estados de loading, erros de resposta e auto-preenchimento seguro de campos opcionais/nulos?

## Validação Prática Obrigatória
Execute no diretório `/home/porto/codespace/Plannit/plannit`:
- `npm run typecheck`
- `npm run build`
Comprove que ambos passam com 0 erros.

## Regras
- NÃO modifique arquivos de código da aplicação.
- Escreva seu relatório detalhado em `/home/porto/codespace/Plannit/.agents/reviewer_2_saneamento/report.md`.
- Escreva seu `handoff.md` com veredito explícito: `APPROVE` ou `REQUEST_CHANGES`.
- Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:31:06Z
Você é o Reviewer 2 (Saneamento R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/reviewer_2_saneamento.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/reviewer_2_saneamento/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
4. /home/porto/codespace/Plannit/.agents/worker_backend_r2/handoff.md
5. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md

Sua missão é revisar a robustez transacional, concorrência, RN001 e RN017.
Execute npm run typecheck e npm run build em /home/porto/codespace/Plannit/plannit.
Emita seu relatório em report.md e seu veredito formal APPROVE ou REQUEST_CHANGES em handoff.md.
Notifique o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7) via send_message ao concluir.
