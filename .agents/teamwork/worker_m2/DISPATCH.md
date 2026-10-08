## 2026-10-08T13:18:37Z

Você é o Worker M2 responsável por implementar o Marco M2: Modelagem e Backend da Agenda com Controle de Acesso (RBAC) no monólito Plannit (Requisito R2).

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/worker_m2
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Plano de Arquitetura e Contratos: /home/porto/codespace/Plannit/.agents/teamwork/orchestrator/PROJECT.md
Especificação Técnica Detalhada do Explorer 2: /home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_2/analysis.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tarefas do Marco M2:
1. Criar migration AdonisJS v7 para a tabela `compromissos_agenda`:
   - Colunas:
     - `id` (increments)
     - `titulo` (string 150, not nullable)
     - `tipo_id` (integer, references `tipos_compromisso_catalogo.id` on delete restrict, not nullable)
     - `data_hora_inicio` (timestamptz, not nullable)
     - `data_hora_fim` (timestamptz, not nullable)
     - `local` (string 255, nullable)
     - `status` (string 20, default 'agendado', not nullable)
     - `observacoes` (text, nullable)
     - `desfecho` (text, nullable)
     - `responsavel_id` (integer, references `users.id` on delete cascade, not nullable)
     - `criado_por_id` (integer, references `users.id` on delete cascade, not nullable)
     - `lead_id` (integer, nullable, references `leads.id` on delete set null)
     - `cliente_id` (integer, nullable, references `clientes.id` on delete set null)
     - `projeto_id` (integer, nullable, references `projetos.id` on delete set null)
     - `created_at`, `updated_at` (timestamptz)
   - Índices em `[responsavel_id, data_hora_inicio]`, `[status, data_hora_inicio]`, `lead_id`, `tipo_id`.
   - Executar `node ace migration:run` para aplicar a migration e regenerar `database/schema.ts`.
2. Criar Model Lucid `app/models/compromisso_agenda.ts`:
   - Estender `CompromissosAgendaSchema` (gerado em schema.ts) ou `BaseModel`.
   - Enum `StatusCompromisso = { AGENDADO = 'agendado', CONCLUIDO = 'concluido', CANCELADO = 'cancelado', REAGENDADO = 'reagendado' }`.
   - Relacionamentos Lucid:
     - `belongsTo(() => TipoCompromissoCatalogo, { foreignKey: 'tipoId' })`
     - `belongsTo(() => User, { foreignKey: 'responsavelId' })`
     - `belongsTo(() => User, { foreignKey: 'criadoPorId' })`
     - `belongsTo(() => Lead, { foreignKey: 'leadId' })`
     - `belongsTo(() => Cliente, { foreignKey: 'clienteId' })`
     - `belongsTo(() => Projeto, { foreignKey: 'projetoId' })`
   - Adicionar relacionamento `hasMany(() => CompromissoAgenda, { foreignKey: 'leadId' })` no model `app/models/lead.ts`.
3. Criar Validador VineJS `app/validators/compromisso_agenda.ts`:
   - `createCompromissoValidator`: titulo, tipoId, dataHoraInicio, dataHoraFim, local, observacoes, responsavelId (opcional para gestores), leadId, clienteId, projetoId.
   - `updateCompromissoValidator`.
   - `reagendarCompromissoValidator`: dataHoraInicio, dataHoraFim, observacoes.
   - `cancelarCompromissoValidator`: motivo/observacoes.
   - `concluirCompromissoValidator`: `desfecho` obrigatório (string min 3).
4. Criar Controller `app/controllers/agenda_controller.ts`:
   - Helper `wantsJson()`, helper `isGestor(user)`.
   - `index`:
     - Se perfil for operacional (`VENDEDOR` ou `PROJETISTA`), força `query.where('responsavel_id', user.id)`.
     - Se for gestão (`DIRETORIA` ou `GERENTE_COMERCIAL`), aceita filtro opcional `responsavelId` ou lista toda a equipe.
     - Suporta filtros por período (`inicio`, `fim`), `status`, `tipoId`.
     - Preloads: `tipo`, `responsavel`, `lead`, `cliente`, `projeto`.
     - Retorna `inertia.render('agenda/index', props)` ou JSON quando solicitado. (A página inertia/pages/agenda/index.tsx será criada no M3, mas crie um placeholder simples em `inertia/pages/agenda/index.tsx` se necessário para o controller renderizar sem erro).
   - `store`: cria compromisso com `criadoPorId = user.id`. Se usuário não é gestor, força `responsavelId = user.id`.
   - `update`: bloqueia com 403 Forbidden se o usuário não for gestor e o compromisso não for dele (`responsavelId !== user.id`).
   - `reagendar`: atualiza horários e muda status para `reagendado`.
   - `cancelar`: muda status para `cancelado`.
   - `concluir`:
     - Altera status para `concluido` e salva `desfecho`.
     - Se `lead_id` estiver preenchido, insere atômica e transacionalmente (`db.transaction`) um registro em `interacoes_lead` (`tipo: 'reuniao'`, `resumo: \`Compromisso concluído: \${compromisso.titulo} - Desfecho: \${desfecho}\``, `responsavelId: user.id`) e atualiza `lead.ultimaInteracaoEm = DateTime.now()`.
5. Registrar rotas em `start/routes.ts`:
   - Sob o grupo `middleware.auth()`:
     - `GET /agenda` -> `controllers.AgendaController.index`
     - `POST /agenda/compromissos` -> `controllers.AgendaController.store`
     - `PUT /agenda/compromissos/:id` -> `controllers.AgendaController.update`
     - `PATCH /agenda/compromissos/:id/reagendar` -> `controllers.AgendaController.reagendar`
     - `PATCH /agenda/compromissos/:id/cancelar` -> `controllers.AgendaController.cancelar`
     - `PATCH /agenda/compromissos/:id/concluir` -> `controllers.AgendaController.concluir`
6. Criar suíte de testes funcionais em `tests/functional/agenda.spec.ts`:
   - Validar autenticação e RBAC (vendedor só vê e manipula seus compromissos, 403 ao tentar editar de outro).
   - Validar criação, reagendamento, cancelamento e conclusão.
   - Validar que a conclusão de um compromisso vinculado a um lead gera a interação na linha do tempo do lead.
   - Executar limpeza em `group.each.teardown`.
7. Execução e Validação:
   - Rodar `node ace test functional --files=tests/functional/agenda.spec.ts`.
   - Rodar `npm run typecheck` com 0 erros.
