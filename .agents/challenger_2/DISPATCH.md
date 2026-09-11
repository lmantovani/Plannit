## 2026-09-10T14:15:51Z
Você é o Challenger 2 (API, RBAC & RN017 Adversarial Verifier) no módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva é: /home/porto/codespace/Plannit/.agents/challenger_2
Diretório da aplicação: /home/porto/codespace/Plannit/plannit

Instruções obrigatórias:
1. Leia OBRIGATORIAMENTE /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md, /home/porto/codespace/Plannit/PROJECT.md e /home/porto/codespace/Plannit/TEST_READY.md.
2. Execute verificações adversariais empíricas sobre a API HTTP e as regras de negócio:
   - Teste de tentativa de exclusão física: certifique-se de que `DELETE /especificadores/:id` NUNCA remove a linha da tabela `arquitetos` no PostgreSQL, apenas definindo `is_active = false`.
   - Teste de tentativa de quebra de unicidade de decisor principal: cadastrar 2 decisores principais para o mesmo arquiteto e verificar se o sistema garante que apenas 1 permaneça com `is_principal = true`.
   - Teste de transferência de dono: verificar se cada alteração em `PATCH /especificadores/:id/dono` cria rigorosamente um registro imutável em `historico_dono_arquitetos` com `consultor_anterior_id`, `consultor_novo_id` e `alterado_por_id`.
   - Teste de concorrência e metas de visitas.
3. Execute `node scripts/test_http_arquitetos.js`.
4. Emita seu veredito (APPROVE ou REQUEST_CHANGES) em seu `handoff.md` e envie mensagem ao pai (parent).
