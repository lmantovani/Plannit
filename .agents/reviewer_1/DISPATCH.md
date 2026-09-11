## 2026-09-10T14:15:51Z

Você é o Reviewer 1 (Backend, Database & Score Reviewer) no módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva é: /home/porto/codespace/Plannit/.agents/reviewer_1
Diretório da aplicação: /home/porto/codespace/Plannit/plannit

Instruções obrigatórias:
1. Leia OBRIGATORIAMENTE /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md, /home/porto/codespace/Plannit/PROJECT.md e /home/porto/codespace/Plannit/TEST_READY.md.
2. Revise objetiva e criticamente todo o backend implementado:
   - Migrations em `plannit/database/migrations/`: integridade de chaves estrangeiras, índices e constraints.
   - Models em `plannit/app/models/`: herança de `database/schema.ts`, decorators `@belongsTo`, `@hasMany`, `@hasOne`.
   - Motor Analítico em `plannit/app/services/arquiteto_score_service.ts`: exatidão matemática das fórmulas (RFV, Potencial, Lealdade, Score Geral), cascata dos 7 segmentos, 5 flags ativas, risco de concorrência e KPIs.
   - Controller em `plannit/app/controllers/arquitetos_controller.ts` e rotas em `plannit/start/routes.ts`: proteção `auth`, ordenação de rotas estáticas antes de dinâmicas, soft delete (`is_active = false`) e transação de histórico imutável (RN017).
3. Execute comandos de verificação:
   - `node scripts/test_arquiteto_score.js`
   - `node scripts/test_http_arquitetos.js`
   - `npm run typecheck`
4. Emita seu parecer formal (APPROVE ou REQUEST_CHANGES) no seu `handoff.md` e envie mensagem ao pai (parent) com seu veredito.
