## 2026-10-08T13:00:44Z
Você é o Worker M1 responsável por implementar o Requisito R1: Catálogo Parametrizável de Tipos de Compromisso em Configurações no monólito Plannit.

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/worker_m1
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Plano de Arquitetura e Contratos: /home/porto/codespace/Plannit/.agents/teamwork/orchestrator/PROJECT.md
Especificação Técnica Detalhada do Explorer 1: /home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_1/analysis.md
Skill: /home/porto/codespace/Plannit/.agents/skills/parametrizacao-campos-configuracoes/SKILL.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tarefas do Marco M1:
1. Criar migration AdonisJS v7 para a tabela `tipos_compromisso_catalogo`:
   - Colunas: `id` (increments), `nome` (string 100), `slug` (string 100, unique), `cor` (string 20, default '#3B82F6'), `is_active` (boolean, default true), `ordem` (integer, default 0), `created_at`, `updated_at`.
   - Incluir índice em `ordem` e `is_active`.
   - Executar `node ace migration:run` para aplicar a migration e atualizar o schema.
2. Criar Model Lucid `app/models/tipo_compromisso_catalogo.ts`:
   - Tipagem completa, colunas decoradas, escopo de ordenação ou ordenação padrão.
3. Atualizar `database/seeders/tabelas_apoio_seeder.ts`:
   - Incluir os 7 tipos padrão de forma idempotente (só insere se não houver registros):
     1. Briefing Técnico (#3B82F6)
     2. Visita e Medição no Local (#10B981)
     3. Apresentação de Projeto 3D (#8B5CF6)
     4. Visita à Obra (#F59E0B)
     5. Reunião de Alinhamento na Loja (#EC4899)
     6. Alinhamento com Especificador / Arquiteto (#6366F1)
     7. Outro (#6B7280)
   - Executar o seeder com `node ace db:seed --files database/seeders/tabelas_apoio_seeder.ts`.
4. Criar validações VineJS em `app/validators/configuracao.ts`:
   - `createTipoCompromissoValidator` e `updateTipoCompromissoValidator` (nome, slug opcional, cor hexadecimal, ordem opcional, is_active opcional).
5. Implementar ações em `app/controllers/configuracoes_controller.ts`:
   - No `index`: carregar `tiposCompromisso` ordenados por `ordem asc, nome asc` e passar nas props do Inertia e JSON.
   - Criar `storeTipoCompromisso`, `updateTipoCompromisso`, `toggleTipoCompromisso`, `destroyTipoCompromisso`.
   - Na exclusão, verificar se existem compromissos vinculados antes de excluir (se não houver compromissos, permite exclusão física; se houver ou na dúvida, orienta a desativação).
   - Manter helper `wantsJson()` e flash messages com as chaves `'success'` e `'error'` (NUNCA usar `'erro'` ou `'info'`).
6. Registrar rotas em `start/routes.ts`:
   - Sob o grupo de rotas `/configuracoes` com `middleware.role([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])`.
7. Atualizar frontend em `inertia/pages/configuracoes/index.tsx`:
   - Adicionar a aba "Tipos de Compromisso" (com contadores ativos/inativos, badge da cor do tipo, ordenação, botões de toggle ativo/inativo, editar e excluir).
   - Modal de criação e edição com campo de cor (seletor visual ou paleta pré-definida de cores), nome e ordem.
   - Disparo do evento de sincronização cross-tab `notifyCatalogoUpdate('tipos_compromisso')` para a chave `plannit_catalogo_updated`.
8. Executar verificação:
   - Rodar `npm run typecheck` dentro de `plannit/` e garantir que não há erros de tipagem.
   - Executar `node ace test functional --files=tests/functional/configuracoes_and_qualificacao.spec.ts` para confirmar que nada existente quebrou.

Ao concluir, escreva seu relatório em:
`/home/porto/codespace/Plannit/.agents/teamwork/worker_m1/handoff.md`
e envie mensagem informando os arquivos alterados e os comandos executados.
