## 2026-09-10T13:49:33Z

Você é o Worker Backend responsável pela implementação das Milestones M1, M2 e M3 do módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva de metadados é: /home/porto/codespace/Plannit/.agents/worker_backend_m1_m3
Diretório do projeto: /home/porto/codespace/Plannit/plannit

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Arquivos de entrada obrigatórios (leia atentamente antes de codificar):
- /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md
- /home/porto/codespace/Plannit/PROJECT.md
- /home/porto/codespace/Plannit/.agents/explorer_survey_1/handoff.md (Schema, Migrations e Models Lucid)
- /home/porto/codespace/Plannit/.agents/explorer_survey_2/handoff.md (Especificação do Motor de Score, Fórmulas, 7 Segmentos, 5 Flags, RN017)

Arquivos sob sua posse exclusiva de escrita:
- plannit/database/migrations/* (criar as migrations de especificadores e de vínculo com projetos e leads)
- plannit/app/models/arquiteto.ts
- plannit/app/models/decisor_arquiteto.ts
- plannit/app/models/concorrente_arquiteto.ts
- plannit/app/models/historico_dono_arquiteto.ts
- plannit/app/models/interacao_arquiteto.ts
- plannit/app/models/meta_visitas_consultor.ts
- plannit/app/models/user.ts (atualizar relações)
- plannit/app/models/projeto.ts (atualizar relação com arquiteto)
- plannit/app/models/lead.ts (atualizar relação com arquiteto)
- plannit/app/services/arquiteto_score_service.ts
- plannit/app/validators/arquiteto.ts
- plannit/app/controllers/arquitetos_controller.ts
- plannit/start/routes.ts

Instruções passo a passo:
1. Criar as migrations no diretório database/migrations/:
   - Criação das 6 tabelas: `arquitetos`, `decisores_arquitetos`, `concorrentes_arquitetos`, `historico_dono_arquitetos`, `interacoes_arquitetos`, `metas_visitas_consultor`.
   - Adição de `arquiteto_id` na tabela `projetos` com FK e índice, e formalização da FK em `leads.arquiteto_id`.
   - Executar `node ace migration:run` no diretório plannit e verificar se completou com sucesso e gerou `database/schema.ts`.
2. Criar os models Lucid ORM herdando dos schemas gerados em `database/schema.ts` e com as relações @belongsTo, @hasMany e @hasOne conforme detalhado no handoff do Explorer 1.
3. Atualizar os models `User`, `Projeto` e `Lead` com as relações com `Arquiteto`.
4. Implementar o serviço `app/services/arquiteto_score_service.ts`:
   - Fórmulas exatas de RFV (Recência, Frequência, Valor de contratos dos últimos 12m), Potencial (leads ativos + projetos ativos), Lealdade (tempo parceria, consistência meses distintos, conversão com neutro 50%).
   - Score Geral = média dos 3 pilares.
   - Cascata exata dos 7 segmentos comportamentais (inativo, novo_promissor, em_risco, campeao, parceiro_fiel, em_ascensao, ocasional).
   - Motor das 5 flags ativas (top_indicador, em_risco_de_perda, alto_potencial, indicacao_alto_valor, especificador_esfriando).
   - Risco de concorrência desacoplado e cálculo de KPIs agregados da carteira.
5. Criar validators em `app/validators/arquiteto.ts` usando VineJS.
6. Implementar `app/controllers/arquitetos_controller.ts`:
   - Listagem e detalhamento com suporte duplo (Inertia view e JSON se aceitar JSON).
   - Criação e atualização de especificador.
   - Soft delete (RN017): `DELETE /especificadores/:id` executa exclusivamente `is_active = false`.
   - Reatribuição de dono de carteira (RN017): `PATCH /especificadores/:id/dono` insere registro imutável em `historico_dono_arquitetos` com consultor anterior, novo consultor, alterado por e timestamp UTC.
   - Sub-recursos: CRUD de decisores, concorrentes e registro cronológico de interações.
   - Gestão de metas de visitas mensais por consultor (`GET /metas-visitas`, `PUT /metas-visitas`, `GET /metas-visitas/me`).
7. Registrar as rotas em `start/routes.ts` com a devida proteção de autenticação (`middleware.auth()`) e com ordenação estrita de caminhos fixos antes dos dinâmicos.
8. Executar `npm run typecheck` e garantir 0 erros de tipagem.
9. Escrever relatório final em /home/porto/codespace/Plannit/.agents/worker_backend_m1_m3/handoff.md e enviar mensagem ao pai (parent) informando a conclusão.
