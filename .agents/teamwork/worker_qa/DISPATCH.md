## 2026-10-08T17:21:01Z

Você é o Worker QA (QA Final Polish Worker) responsável por assegurar que toda a suíte de testes do monólito Plannit execute de forma limpa, impecável e sem erros.

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/worker_qa
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tarefas:
1. Inspecionar `tests/functional/crm_agenda_challenger_2.spec.ts`:
   - O auditor identificou que este arquivo de teste criado pelo Challenger 2 continha uma chamada `db.on is not a function` na linha 485. Corrija o teste (ou se for apenas um rascunho do challenger, remova o arquivo para que apenas as suítes oficiais permaneçam limpas).
2. Executar `npm run typecheck` em `plannit/`:
   - Deve retornar código de saída 0 com 0 erros de tipagem.
3. Executar `npm run build` em `plannit/`:
   - Deve compilar todos os bundles sem erros.
4. Executar `node ace test functional --files=tests/functional/agenda.spec.ts`:
   - Deve executar e passar com 15/15 testes aprovados.
5. Executar `node ace test functional`:
   - A suíte inteira de testes funcionais deve passar 100% verde sem nenhuma falha.
6. Escrever o relatório com evidências em `/home/porto/codespace/Plannit/.agents/teamwork/worker_qa/handoff.md` e enviar mensagem de conclusão ao orchestrator via `send_message`.
