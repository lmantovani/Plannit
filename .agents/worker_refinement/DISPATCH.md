## 2026-09-10T14:24:33Z

Você é o Worker de Refinamento responsável por aplicar as correções identificadas pelo Gate de Revisão (Reviewer 1 e Challenger 1) no módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva de metadados é: /home/porto/codespace/Plannit/.agents/worker_refinement
Diretório do projeto: /home/porto/codespace/Plannit/plannit

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Arquivos de entrada obrigatórios:
- /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md
- /home/porto/codespace/Plannit/PROJECT.md
- /home/porto/codespace/Plannit/.agents/orchestrator/GATE_STATUS.md (Lista de correções solicitadas)
- /home/porto/codespace/Plannit/.agents/reviewer_1/handoff.md (Achados do Reviewer 1)
- /home/porto/codespace/Plannit/.agents/challenger_1/handoff.md (Achados do Challenger 1)

Arquivos sob sua posse exclusiva de escrita:
- plannit/app/services/arquiteto_score_service.ts
- plannit/app/controllers/arquitetos_controller.ts
- plannit/scripts/test_http_arquitetos.js
- plannit/scripts/test_arquiteto_score.js

Instruções específicas para as 5 correções:
1. **Regra de Negócio de RFV (Challenger 1)**:
   Em `plannit/app/services/arquiteto_score_service.ts`, na função `calcularScoreArquiteto`:
   - No filtro de projetos para RFV, além de `.where('arquivado', false)`, adicione também `.whereNot('status', 'cancelado')` ou ignore projetos com `status === 'cancelado'`. Projetos cancelados não devem contar para Recência, Frequência ou Valor!
2. **Idempotência e Isolamento nos Scripts de Teste (Reviewer 1 & Challenger 1)**:
   - Em `plannit/scripts/test_http_arquitetos.js`:
     - Gere e-mail único com timestamp/random (ex: `beta.design.${Date.now()}@e2e-teste.com.br`) para o cadastro de novo especificador, evitando erro de chave duplicada em reexecuções.
     - No final do teste (ou bloco `finally`/cleanup), execute uma query de limpeza no PostgreSQL:
       `DELETE FROM arquitetos WHERE email LIKE '%@e2e-teste.com.br'`
     - E restaure a meta de visitas do consultor vendedor para 15:
       `UPDATE metas_visitas_consultor SET meta_visitas_mes = 15 WHERE consultor_id = $1`
3. **Transacionalidade em `store` (Reviewer 1)**:
   Em `plannit/app/controllers/arquitetos_controller.ts`:
   - No método `store`, envolva a criação de `Arquiteto` e a criação do primeiro `HistoricoDonoArquiteto` em um bloco `db.transaction(async (trx) => ...)` com rollback em caso de falha.
4. **RBAC em Endpoints Sensíveis (Reviewer 1)**:
   Em `plannit/app/controllers/arquitetos_controller.ts`:
   - No método `definirMeta`: verifique se o usuário tem permissão gerencial (`['diretoria', 'gerente_comercial', 'admin'].includes(user.perfil)`). Se não for gestor e estiver tentando alterar a meta de outro consultor, retorne 403 Forbidden.
   - No método `reatribuirDono`: verifique se o usuário é gestor (`diretoria`, `gerente_comercial`, `admin`). Vendedores comuns não devem poder transferir carteiras de outros.
   - No método `destroy`: verifique se o usuário é gestor ou o consultor dono do arquiteto.
   - Atualize `scripts/test_http_arquitetos.js` para usar o usuário Gerente (`gerente@lidermoveis.com.br`) ao chamar `definirMeta` e `reatribuirDono` se necessário, garantindo que o teste reflita o RBAC.
5. **Validação**:
   Execute no terminal do diretório `plannit`:
   - `node ace db:seed --files database/seeders/arquiteto_seeder.ts`
   - `node scripts/test_arquiteto_score.js`
   - `node scripts/test_http_arquitetos.js`
   - `node scripts/test_arquiteto_score.js` (confirme que agora passa mesmo APÓS o teste HTTP rodar!)
   - `npm run typecheck`
   - `npm run build`
6. Escreva seu relatório em `/home/porto/codespace/Plannit/.agents/worker_refinement/handoff.md` e envie mensagem com o resumo das correções ao parent.
