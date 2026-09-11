## 2026-09-10T14:00:15Z

Você é o Worker de Testes e Seeders responsável pela implementação da Milestone M5 (Seeders e Scripts Automatizados E2E) do módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva de metadados é: /home/porto/codespace/Plannit/.agents/worker_tests_m5
Diretório do projeto: /home/porto/codespace/Plannit/plannit

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Arquivos de entrada obrigatórios (leia atentamente antes de codificar):
- /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (Acceptance Criteria de testes)
- /home/porto/codespace/Plannit/PROJECT.md
- /home/porto/codespace/Plannit/TEST_INFRA.md
- /home/porto/codespace/Plannit/.agents/explorer_survey_2/handoff.md (Especificação detalhada dos scripts de teste)
- /home/porto/codespace/Plannit/.agents/worker_backend_m1_m3/handoff.md (Modelos e endpoints reais implementados)

Arquivos sob sua posse exclusiva de escrita:
- plannit/database/seeders/arquiteto_seeder.ts
- plannit/scripts/test_arquiteto_score.js
- plannit/scripts/test_http_arquitetos.js

Instruções passo a passo:
1. Implementar o seeder `database/seeders/arquiteto_seeder.ts`:
   - Herdar de `BaseSeeder` do AdonisJS.
   - Criar consultores/usuários de teste se não existirem (ou vincular aos usuários padrão do sistema: vendedor, diretoria, etc.).
   - Criar especificadores cobrindo rigorosamente todos os 7 segmentos comportamentais e as 5 flags:
     - 1. Inativo: sem projetos e sem leads.
     - 2. Novo Promissor: cadastrado há menos de 90 dias com projetos/leads recentes.
     - 3. Em Risco: histórico prévio, porém sem projetos e leads há mais de 180 dias.
     - 4. Campeão: score geral >= 85, múltiplos projetos de alto valor nos 12m (ativa flag top_indicador e indicacao_alto_valor).
     - 5. Parceiro Fiel: lealdade >= 75 e rfv >= 50.
     - 6. Em Ascensão: potencial >= 70 (ativa flag alto_potencial).
     - 7. Ocasional: padrão que não cai nas condições anteriores.
     - 8. Esfriando: em_risco com consultor dono atribuído e sem interação há mais de 30 dias (ativa flag especificador_esfriando).
   - Inserir decisores (incluindo decisor principal), concorrentes com percentuais de fechamento variados (baixo <30%, médio 30-60%, alto >60%), interações (visitas ao escritório, ligações, etc.) e metas de visitas por consultor em `metas_visitas_consultor`.
   - Executar o seeder com `node ace db:seed --files database/seeders/arquiteto_seeder.ts` e verificar se completa sem erros.
2. Implementar `scripts/test_arquiteto_score.js`:
   - Utilizar biblioteca `pg` (`Pool`) conectado no PostgreSQL (`postgresql://postgres:postgres@localhost:5432/plannit`).
   - Validar integridade estrutural das 6 tabelas e das colunas FK em `projetos` e `leads`.
   - Validar todas as funções matemáticas puras de pontuação (Recência, Frequência, Valor, Potencial, Tempo de Parceria, Consistência, Conversão, Score Geral).
   - Validar a classificação dos 7 segmentos comportamentais e das 5 flags contra os dados reais inseridos pelo seeder.
   - Validar o cálculo de risco de concorrência e confirmar que não polui o Score Geral objetivo.
   - Executar `node scripts/test_arquiteto_score.js` e assegurar 100% de sucesso.
3. Implementar `scripts/test_http_arquitetos.js`:
   - Utilizar `fetch` nativo do Node com suporte a cookies/sessão e CSRF token contra o servidor Adonis (porta 3333 ou variável de ambiente).
   - Validar autenticação e sessão.
   - Validar `GET /especificadores` (com `X-Inertia: true`) verificando estrutura de props (`especificadores`, `kpis`, `minhaMeta`).
   - Validar criação de especificador (`POST /especificadores`).
   - Validar reatribuição de dono de carteira (`PATCH /especificadores/:id/dono`), consultando `historico_dono_arquitetos` para certificar que o registro imutável foi persistido (RN017).
   - Validar registro de interação (`POST /especificadores/:id/interacoes`).
   - Validar sub-recursos de decisores e concorrentes.
   - Validar soft delete (`DELETE /especificadores/:id`), conferindo que `is_active = false` e que o item não aparece na listagem ativa.
   - Validar metas de visitas (`PUT /especificadores/metas-visitas` e `GET /especificadores/metas-visitas/me`).
   - Executar `node scripts/test_http_arquitetos.js` e assegurar 100% de sucesso.
4. Validar `npm run typecheck` no final para garantir 0 erros de tipagem.
5. Escrever relatório final em `/home/porto/codespace/Plannit/.agents/worker_tests_m5/handoff.md` e enviar mensagem ao pai (parent) informando a conclusão com os resultados dos testes.
