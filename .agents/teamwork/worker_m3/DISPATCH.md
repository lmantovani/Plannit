## 2026-10-08T13:37:22Z

Você é o Worker M3 responsável por implementar o Marco M3: Tela Central da Agenda na Sidebar (/agenda) no monólito Plannit (Requisito R3).

Diretório de trabalho exclusivo: /home/porto/codespace/Plannit/.agents/teamwork/worker_m3
Pedido original obrigatório: /home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md
Plano de Arquitetura e Contratos: /home/porto/codespace/Plannit/.agents/teamwork/orchestrator/PROJECT.md
Especificação Técnica Detalhada do Explorer 3: /home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3/analysis.md
Diretrizes do projeto: /home/porto/codespace/Plannit/AGENTS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tarefas do Marco M3:
1. Atualizar a sidebar de navegação em `inertia/layouts/app_layout.tsx`:
   - Importar o ícone `Calendar` de `lucide-react`.
   - Adicionar o item "Agenda" no grupo `Principal` (logo após `Dashboard`):
     `{ label: 'Agenda', href: '/agenda', icon: Calendar }`.
   - Garantir que o active state e o comportamento colapsado funcionem perfeitamente.
2. Implementar a página completa e rica `inertia/pages/agenda/index.tsx` (e componentes em `inertia/pages/agenda/components/` ou modularizados):
   - Controles de cabeçalho:
     - Alternador de visão RBAC para gestores (`DIRETORIA` e `GERENTE_COMERCIAL`): botões "Minha Agenda" vs "Toda a Equipe" (com query param ou estado integrado com `router.get('/agenda', { ... })`). Para vendedores e projetistas, não exibir esse alternador (eles operam na sua própria agenda).
     - Filtro select por colaborador (ativo na visão "Toda a Equipe" para gestores).
     - Alternador de Modo de Visualização: Visão Calendário / Grade (agrupada por dias/semana) e Visão Lista.
     - Filtros por Status (Todos, Agendado, Concluído, Cancelado, Reagendado).
     - Filtro por Tipo de Compromisso (usando os tipos do catálogo).
     - Filtros por Período rápido (Hoje, Esta Semana, Este Mês, Todos).
     - Botão de Ação Primária: "+ Novo Compromisso".
   - Cards de compromisso estilizados:
     - Indicador cromático do tipo com a cor cadastrada no catálogo.
     - Badge de status (Agendado, Concluído, Cancelado, Reagendado).
     - Badge de urgência (Vermelho se atrasado, Azul se hoje, Neutro se futuro).
     - Horário de início e término formatados, duração calculada.
     - Local com ícone `MapPin`.
     - Responsável com avatar ou nome.
     - Link rápido para o Lead (`/crm?leadId=...`) ou Projeto quando vinculado.
     - Ações no card: "Concluir" (abre modal de desfecho), "Reagendar" (abre modal de reagendamento), "Editar" e "Cancelar".
   - Modais interativos:
     - `ModalNovoCompromisso`: formulário completo com título, tipo de compromisso (com swatches/cores), data/hora início e fim, local, observações, seleção de responsável (para gestores), autocomplete para vincular Lead (usando `BuscaAutocomplete.tsx` ou componente de busca), atalho "Configurar ↗" para gestores (`/configuracoes?tab=tipos_compromisso`), e escuta a `plannit_catalogo_updated` e `window.focus`.
     - `ModalConcluirCompromisso`: campo obrigatório de "Desfecho da Reunião / Encontro" com envio via `router.patch('/agenda/compromissos/' + id + '/concluir', { desfecho })`.
     - `ModalReagendarCompromisso`: novos horários e motivo.
     - `ModalCancelarCompromisso`: confirmação e motivo.
     - `ModalEditarCompromisso`: edição de título, local, observações.
3. Execução e Validação:
   - Rodar `npm run typecheck` e garantir 0 erros de compilação TypeScript no servidor e no Inertia.
   - Rodar `npm run build` ou testar se os bundles e imports funcionam perfeitamente.
   - Rodar os testes funcionais existentes `node ace test functional --files=tests/functional/agenda.spec.ts`.


## 2026-10-08T13:51:04Z

O ambiente foi reiniciado. Verifique o estado atual da implementação do Marco M3 (layouts/app_layout.tsx, inertia/pages/agenda/*). Execute npm run typecheck e node ace test functional --files=tests/functional/agenda.spec.ts. Se tudo estiver ok ou com pequenos ajustes, escreva o handoff.md e reporte a conclusão para prosseguirmos para o Marco M4.
