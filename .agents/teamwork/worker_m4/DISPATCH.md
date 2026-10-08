## 2026-10-08T13:56:26Z
Você é o Worker M4 responsável por implementar o Marco M4: Integração Operacional Bidirecional com o Kanban de Leads (CRM) no monólito Plannit (Requisito R4).

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/worker_m4
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Plano de Arquitetura e Contratos: /home/porto/codespace/Plannit/.agents/teamwork/orchestrator/PROJECT.md
Especificação Técnica Detalhada do Explorer 3: /home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3/analysis.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tarefas do Marco M4:
1. Backend (`app/controllers/leads_controller.ts`):
   - Adicionar eager loading dos compromissos em `Lead.query()` no método `index`:
     `.preload('compromissos', (query) => { query.orderBy('data_hora_inicio', 'asc').preload('tipo').preload('responsavel') })` garantindo zero consultas N+1.
   - No mapeamento dos leads para o frontend:
     - Identificar o `proximoCompromisso`: o primeiro compromisso em status `agendado` ou `reagendado`.
     - Calcular flags de urgência com Luxon: `isHoje` (mesmo dia atual) e `isAtrasado` (fim < agora ou início < agora - 1h).
     - Serializar dados de `proximoCompromisso` (id, titulo, dataHoraInicio, tipoNome, tipoCor, responsavelNome, isHoje, isAtrasado).
     - Serializar a lista completa de `compromissos` do lead para exibição no `LeadDrawer` (id, titulo, dataHoraInicio, dataHoraFim, local, status, responsavelNome, tipoNome, tipoCor, desfecho).
   - Carregar e repassar `tiposCompromissoCatalogo` ativos e ordenados nas props de `inertia.render('crm/index', ...)` para abastecer o modal de agendamento acionado a partir do CRM.
2. Frontend (`inertia/pages/crm/index.tsx`):
   - Atualizar a tipagem `LeadItem` com `proximoCompromisso` e `compromissos`.
   - No `LeadCard`:
     - Se houver `proximoCompromisso`, renderizar badge destacado exibindo:
       - Ícone de calendário (`Calendar`).
       - Data e hora formatadas (ex.: `24/09 14h`) e tipo (ex.: `Visita Obra`).
       - Alerta cromático de urgência estrito:
         * Vermelho/Rose para atrasado (`bg-rose-50 text-rose-700 border-rose-200`).
         * Azul para hoje (`bg-blue-50 text-blue-700 border-blue-200`).
         * Neutro/Stone para futuro (`bg-stone-50 text-stone-700 border-stone-200`).
   - No `LeadDrawer`:
     - Adicionar o botão "Agendar Encontro" (com ícone `Calendar` ou `Clock`) na barra de Ações Rápidas (ao lado de Qualificar Lead, Iniciar Briefing Técnico).
     - Adicionar seção dedicada "Compromissos Agendados" no drawer exibindo a lista de compromissos deste lead:
       * Título, tipo com cor, data/hora formatada, status e responsável.
       * Se concluído, exibir o desfecho destacado.
       * Ação para concluir o compromisso ou botão para abrir a agenda.
     - Garantir que a linha do tempo do lead exiba os eventos de encontros concluídos gerados em `interacoes_lead` (criados automaticamente quando o compromisso é concluído via `PATCH /agenda/compromissos/:id/concluir`).
   - Modal de Agendamento do CRM:
     - Pode reaproveitar ou invocar o `ModalNovoCompromisso` com o `leadId` pré-selecionado e travado, com atalho "Configurar ↗" para gestores e sync cross-tab.
3. Testes e Validações:
   - Rodar `npm run typecheck` (0 erros).
   - Rodar `npm run build` (sucesso).
   - Rodar `node ace test functional --files=tests/functional/agenda.spec.ts`.
   - Adicionar se cabível em `tests/functional/agenda.spec.ts` ou validar teste da integração de agenda no CRM.

