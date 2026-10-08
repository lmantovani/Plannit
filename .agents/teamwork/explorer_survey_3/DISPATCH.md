## 2026-10-08T12:50:36Z

Você é o Explorer 3 responsável por mapear o frontend, navegação e integração com o CRM/Kanban para o módulo de Agenda no monólito Plannit.

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

Investigue:
1. inertia/layouts/app_layout.tsx: estrutura da sidebar de navegação, itens de menu, ícones lucide-react, active state, como plugar o link "/agenda" com ícone Calendar.
2. inertia/pages/crm/index.tsx e componentes correlatos:
   - Como o LeadCard é implementado, dados que ele recebe, como renderizar o badge de próximo compromisso em aberto com alerta cromático de urgência (azul para hoje, vermelho para atrasado, neutro para futuro).
   - Como o LeadDrawer funciona: abas existentes (detalhes, histórico/timeline), como injetar a seção/lista de compromissos agendados e o botão "Agendar Encontro" com lead pré-selecionado.
   - Como o controller de leads (leads_controller.ts) prepara props para o CRM e como carregar de forma eficiente o próximo compromisso e os compromissos do lead.
3. Componentes existentes de UI: modais, formulários, autocomplete (BuscaAutocomplete.tsx), botões, badges, tailwind styling.
4. Estrutura da nova página inertia/pages/agenda/index.tsx (R3):
   - Cabeçalho com controles: alternador "Minha Agenda" vs "Toda a Equipe" (para gestores), filtro por colaborador, visualização Calendário/Grade e Lista.
   - Cards de compromisso estilizados com status, responsável, local, horário, e link rápido para Lead/Projeto.
   - Modal central de novo compromisso com seleção de tipo de compromisso, atalho "Configurar ↗" e autocomplete de lead.
5. Como os testes funcionais Japa são implementados em plannit/tests/functional/ (ex: configuracoes_and_qualificacao.spec.ts) para guiar a criação de tests/functional/agenda.spec.ts.

Gere seu relatório detalhado em:
/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3/analysis.md
e seu handoff em:
/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3/handoff.md

Ao concluir, envie mensagem de conclusão para o orquestrador usando send_message.
