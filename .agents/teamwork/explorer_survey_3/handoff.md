# Relatório de Handoff: Mapeamento de Frontend, Navegação e Integração CRM da Agenda

**Agente**: Explorer 3  
**Destinatário**: Orchestrator (`a8c91f27-599c-4180-947d-139e34820fa8`)  
**Data**: 2026-10-08  
**Tipo**: Hard Handoff (Levantamento Concluído)

---

## 1. Observation

Durante a investigação da base de código do Plannit, foram observados os seguintes fatos concretos:

1. **Estrutura de Navegação Global (`inertia/layouts/app_layout.tsx`)**:
   - Linhas 3-21: A lista de imports de `lucide-react` contém `LayoutDashboard`, `Users`, `FileText`, `Layers`, `Building2`, `Hammer`, `UserCog`, `UserCheck`, `Compass`, `FolderKanban`, mas **não importa** o ícone `Calendar`.
   - Linhas 107-154: A constante `navigation: NavGroup[]` define 5 grupos: `Principal` (apenas `/dashboard`), `Comercial` (`/crm`, `/clientes`, `/briefings`, `/fila`, `/projetos`, `/especificadores`), `Operacional`, `Gestão` e `Suporte`.
   - Linha 204: A lógica de ativação de rota é `const isActive = item.exact ? url === item.href : url.startsWith(item.href) && item.href !== '#'`. Um item `{ label: 'Agenda', href: '/agenda', icon: Calendar }` sem `exact` responde automaticamente a `/agenda` e qualquer query string relacionada.

2. **Renderização do Card no CRM (`inertia/pages/crm/index.tsx`)**:
   - Linhas 65-105: O tipo `LeadItem` possui dados do lead, flags `precisaAtencao`, `interacoes: LeadInteracao[]` e `historicoStatus: LeadHistoricoStatus[]`, mas não possui campos de compromisso agendado ou data futura.
   - Linhas 627-726: A função `LeadCard` renderiza alertas de estagnação (`precisaAtencao` com `AlertTriangle` âmbar), nome, qualificação, informações de contato/cidade, chips de ambientes de interesse e rodapé com origem e `timeAgo(lead.ultimaInteracaoEm)`. Não possui badge de compromisso.
   - Linhas 696-701: Há um bloco de destaque para ambientes de interesse que serve como referência de layout para o novo badge cromático de urgência de compromissos.

3. **Drawer do Lead no CRM (`inertia/pages/crm/index.tsx`)**:
   - Linhas 729-1130: O componente `LeadDrawer` possui um painel vertical de rolagem única com largura de 440px.
   - Linhas 843-886: A barra de Ações Rápidas contém botões para `Qualificar Lead`, `Iniciar Briefing Técnico` e `Marcar como Perdido`.
   - Linhas 1010-1091: A seção de Linha do Tempo mescla `interacoes` e `historicoStatus` ordenados decrescentemente por data.
   - Linhas 1094-1127: O rodapé possui um formulário para lançar nova interação rápida (WhatsApp, Ligação, E-mail, Visita, Reunião).

4. **Carregamento de Dados no Backend (`app/controllers/leads_controller.ts`)**:
   - Linhas 57-96: O método `index()` do `LeadsController` executa `Lead.query().where('convertido_em_cliente', false)` com preloads encadeados de `vendedor`, `qualificadoPor`, `arquiteto`, `interacoes` e `historicoStatus`.
   - Linhas 114-176: O controller mapeia cada lead para um objeto serializável com ISO strings nas datas e dados formatados.
   - Linhas 194-207: O controller carrega tabelas de apoio ativas (`AmbienteCatalogo`, `OrigemLeadCatalogo`, `CampanhaLead`) e as repassa nas props do `inertia.render('crm/index', ...)`.

5. **Padrão de Autocomplete e Catálogos (`inertia/components/ui/BuscaAutocomplete.tsx`)**:
   - Linhas 1-233: O componente `BuscaAutocomplete` aceita `opcoes: OpcaoBusca[]`, `value: string`, `onChange`, `textoVazio`, `tituloLimpar` e `acaoCriar?: AcaoCriarBusca`. Possui navegação por teclado (ArrowUp, ArrowDown, Enter, Escape) e busca sem acentos.
   - `CampanhaAutocomplete.tsx` (linhas 44-65) e `QualificarLeadModal.tsx` (linhas 150-168 e 461-470): Demonstram o padrão de sincronização cross-tab via `window.addEventListener('storage')` escutando a chave `plannit_catalogo_updated`, botão `RotateCw` e link `<a href="/configuracoes?tab=..." target="_blank">Configurar <ExternalLink /></a>`.

6. **Padrão de Testes Funcionais Japa (`tests/functional/configuracoes_and_qualificacao.spec.ts` e `leads_campanha.spec.ts`)**:
   - Linhas 1-60: Os testes utilizam `@japa/runner` com grupos `test.group('...')`.
   - Linhas 24-34 (`leads_campanha.spec.ts`): Como os testes rodam no mesmo banco PostgreSQL de desenvolvimento (sem rollback automático em `bootstrap.ts`), os testes executam limpeza explícita em `group.each.teardown(async () => { ... })`.

---

## 2. Logic Chain

A partir das observações acima, decorre a seguinte cadeia lógica de engenharia:

1. **Navegação Global**:
   - Dado que o ícone `Calendar` de `lucide-react` ainda não está importado no `app_layout.tsx` (Observação 1), sua importação deve ser adicionada.
   - Dado que a Agenda atende a múltiplos papéis operacionais (vendas, projetos, medições, gestão), alocá-la no grupo `Principal` logo após `Dashboard` garante visibilidade imediata sem poluir o grupo comercial.
   - Dado que o matching de URL usa `url.startsWith(item.href)`, rotas aninhadas e query params como `/agenda?view=lista` terão ativação cromática garantida.

2. **Badge Cromático no `LeadCard`**:
   - Para atender ao requisito R4 de urgência visual (azul para hoje, vermelho para atrasado, neutro para futuro), a tipagem `LeadItem` precisa expor o `proximoCompromisso` em aberto (Observação 2).
   - O cálculo compara a data UTC/ISO com a data/hora atual (`DateTime.now()` do Luxon):
     - `dt < agora`: atrasado (`bg-rose-50 text-rose-700 border-rose-200`).
     - `dt.hasSame(agora, 'day')`: hoje (`bg-blue-50 text-blue-700 border-blue-200`).
     - `dt > agora`: futuro (`bg-stone-50 text-stone-600 border-stone-200`).
   - O badge deve ser inserido entre os dados do lead e o rodapé do card, exibindo data, hora abreviada e tipo (ex.: `📅 24/09 14h — Visita Obra`).

3. **Operacionalização do `LeadDrawer`**:
   - O `LeadDrawer` é um componente vertical único (Observação 3). A injeção da seção "Compromissos Agendados" logo abaixo dos dados de qualificação fornece visibilidade rápida de todos os encontros daquele lead.
   - Adicionar o botão "Agendar Encontro" na barra de ações rápidas permite abrir o modal de agendamento já com `leadId` e `leadNome` pré-selecionados.
   - A conclusão do compromisso (`PATCH /agenda/compromissos/:id/concluir`) gera um registro de interação no backend, que é refletido automaticamente na lista de `eventosTimeline` já existente no drawer.

4. **Desempenho no Backend (`leads_controller.ts`)**:
   - Para evitar N+1 queries ao listar leads no CRM, o relacionamento `compromissos` deve ser carregado via `.preload('compromissos', ...)` na consulta única do `index` (Observação 4).
   - O primeiro item pendente (`agendado` ou `reagendado`) da ordenação cronológica torna-se `proximoCompromisso`, enquanto a lista completa é repassada para o `LeadDrawer`.
   - Incluir `tiposCompromissoCatalogo` nas props do `crm/index` garante que o modal de agendamento acionado pelo CRM tenha a lista de tipos disponível imediatamente.

5. **Padrão de Modais, UI e Cross-Tab**:
   - `BuscaAutocomplete` já é o componente padrão do sistema para seleção assistida (Observação 5). Criar `LeadAutocomplete` sobre essa base garante coerência UX e navegação por teclado.
   - Modais devem incluir o atalho "Configurar ↗" (`/configuracoes?tab=tipos_compromisso`) visível para gestores e escutar `storage` (`plannit_catalogo_updated`) e `window.focus` com `router.reload({ only: ['tiposCompromissoCatalogo'] })`.

6. **Estratégia de Testes (`tests/functional/agenda.spec.ts`)**:
   - Dado que o banco é compartilhado e não sofre rollback (Observação 6), os testes de Agenda devem gerar dados com sufixos únicos (ex.: `Date.now()`) e registrar rotinas de teardown em `group.each.teardown`.

---

## 3. Caveats

1. **Notificações em Tempo Real / WebSockets**:
   - O Plannit atualmente opera como monólito tradicional com Inertia.js (sem WebSockets / Pusher configurados). A sincronização cross-tab baseia-se em `localStorage` (`storage event`) e `window.focus`. Usuários em abas/janelas distintas na mesma máquina recebem o evento instantaneamente; usuários em máquinas diferentes recebem a sincronização ao recarregar ou navegar.
2. **Integração de Notificações RN019-RN022**:
   - Conforme documentado no `AGENTS.md`, o motor de notificações push/e-mail ainda não está implementado no monólito. O foco da Agenda é a governança operacional no sistema.
3. **Escopo dos Testes em Banco Compartilhado**:
   - A criação de seeders e testes funcionais deve sempre respeitar a idempotência e executar teardown dos registros de compromisso e catálogo gerados durante a suíte.

---

## 4. Conclusion

O ecossistema frontend e de CRM do Plannit está plenamente preparado para acomodar o módulo de Agenda de forma elegante, coesa e de alto desempenho:
1. A inclusão da rota na sidebar (`app_layout.tsx`) é imediata e atende aos padrões de estilo.
2. A integração no CRM (`LeadCard`, `LeadDrawer` e `leads_controller.ts`) adiciona o badge cromático de urgência e gestão de encontros com **zero consultas N+1**.
3. O design system baseado em Tailwind, Lucide Icons, `BuscaAutocomplete` e o padrão de sincronização cross-tab `plannit_catalogo_updated` com atalho "Configurar ↗" já possui precedentes claros a serem replicados.
4. A tela `/agenda` centralizará a governança com alternador de visão por perfil (RBAC), alternância Grade/Lista e modais de ciclo de vida do compromisso.
5. Os testes funcionais Japa possuem padrão consolidado para validação de RBAC, CRUD e integração.

O relatório técnico detalhado está salvo em:  
`/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_3/analysis.md`.

---

## 5. Verification Method

Para verificar e validar as constatações deste relatório:

1. **Inspeção de Arquivos Mapeados**:
   - `plannit/inertia/layouts/app_layout.tsx` (linhas 1-22 e 107-154) — confirma ausência de `Calendar` e estrutura de `navigation`.
   - `plannit/inertia/pages/crm/index.tsx` (linhas 627-726 e 729-1130) — confirma arquitetura do `LeadCard` e `LeadDrawer`.
   - `plannit/app/controllers/leads_controller.ts` (linhas 57-96 e 114-176) — confirma queries e mapeamento de props.
   - `plannit/inertia/components/ui/BuscaAutocomplete.tsx` — confirma componente de autocomplete.
   - `plannit/tests/functional/configuracoes_and_qualificacao.spec.ts` e `leads_campanha.spec.ts` — confirma padrão de testes Japa e teardown.

2. **Comandos de Verificação do Projeto (na pasta `plannit`)**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   npm run typecheck
   npm run lint
   node ace test functional --files=tests/functional/configuracoes_and_qualificacao.spec.ts
   ```

3. **Condições de Invalidação**:
   - Se o ícone `Calendar` causar conflito de nomes ou tipos no bundle.
   - Se o carregamento de `compromissos` em `leads_controller.ts` for feito sem `.preload()`, introduzindo N+1.
   - Se os testes funcionais deixarem dados residuais sem limpeza em `group.each.teardown`.
