# Original User Request

## 2026-10-08T12:46:26Z

Implementação do módulo completo de Agenda no monólito Plannit (AdonisJS v7 + Inertia React 19) com integração operacional bidirecional ao Kanban de Leads, catálogo de tipos de compromissos gerenciável em Configurações, controle de visualização por perfil (RBAC) e sincronização cross-tab em tempo real.

Working directory: /home/porto/codespace/Plannit/plannit
Integrity mode: development

## Requirements

### R1. Catálogo Parametrizável de Tipos de Compromisso em Configurações
- Criar migration e model TipoCompromissoCatalogo (tabela tipos_compromisso_catalogo: id, nome, slug, cor, is_active, ordem, timestamps).
- Adicionar a aba "Tipos de Compromisso" no painel /configuracoes (app/controllers/configuracoes_controller.ts e inertia/pages/configuracoes/index.tsx) com contadores, status ativo/inativo, ordenação e modal de cadastro/edição restrito à Diretoria e Gerente Comercial.
- Criar seed idempotente com os tipos padrão (Briefing Técnico, Visita e Medição no Local, Apresentação de Projeto 3D, Visita à Obra, Reunião de Alinhamento na Loja, Alinhamento com Especificador / Arquiteto, Outro).
- Fornecer atalho "Configurar ↗" nos modais de agendamento e suporte a sincronização cross-tab em tempo real (storage event plannit_catalogo_updated + window focus).

### R2. Modelagem e Backend da Agenda com Controle de Acesso (RBAC)
- Criar migration e model CompromissoAgenda (tabela compromissos_agenda: id, titulo, tipo_id, data_hora_inicio, data_hora_fim, local, status [agendado, concluido, cancelado, reagendado], observacoes, desfecho, responsavel_id, criado_por_id, lead_id [opcional], cliente_id [opcional], projeto_id [opcional], timestamps).
- Criar app/controllers/agenda_controller.ts e registrar rotas em start/routes.ts com validação VineJS (app/validators/compromisso_agenda.ts).
- Aplicar isolamento por perfil: vendedores e projetistas veem apenas seus compromissos (responsavel_id = user.id); Diretoria e Gerente Comercial visualizam todos os compromissos da loja ou filtram por colaborador específico.
- Endpoints para criar, atualizar, reagendar, cancelar e concluir (PATCH /agenda/compromissos/:id/concluir), onde a conclusão grava o desfecho e alimenta automaticamente a linha do tempo do lead (historico_status_leads / interações).

### R3. Tela de Agenda Central na Sidebar (/agenda)
- Adicionar o item "Agenda" na barra lateral de navegação (inertia/layouts/app_layout.tsx) com ícone de calendário (Calendar).
- Criar a página inertia/pages/agenda/index.tsx:
  - Cabeçalho com controles: alternador para gestores ("Minha Agenda" vs "Toda a Equipe"), filtro select por colaborador, e modos de visualização (Visão Calendário/Grade e Visão Lista).
  - Cards de compromisso estilizados com status, responsável, local, horário e link rápido para o Lead/Projeto quando associado.
  - Modal de criação de novo compromisso central com autocomplete para vincular Lead ou Parceiro se desejado.

### R4. Integração Operacional Bidirecional com o Kanban de Leads (CRM)
- No LeadCard (inertia/pages/crm/index.tsx): exibir badge com o próximo compromisso em aberto (ex.: 📅 24/09 14h — Visita Obra), com alertas cromáticos de urgência (azul para hoje, vermelho para atrasado).
- No LeadDrawer (inertia/pages/crm/index.tsx): exibir a lista de compromissos agendados e botão "Agendar Encontro" abrindo modal com o lead pré-selecionado.
- Conclusão do compromisso gera evento com o resumo na timeline do lead.

## Acceptance Criteria

### Integridade e Tipagem
- [ ] npm run typecheck executado com sucesso e zero erros de tipagem TypeScript.
- [ ] npm run build executado com sucesso sem falhas de bundle.

### Segurança e Controle de Acesso
- [ ] Vendedor autenticado visualiza somente os seus próprios compromissos na rota /agenda.
- [ ] Usuário com perfil DIRETORIA ou GERENTE_COMERCIAL consegue alternar entre a agenda pessoal e a visão de toda a equipe, bem como filtrar por colaborador.
- [ ] Cadastro e edição de tipos de compromissos em /configuracoes protegido por barreira de permissão de gestão.

### Funcionalidade e Sincronização
- [ ] Compromisso agendado para um lead reflete imediatamente com badge no card do Kanban e na linha do tempo do lead após conclusão.
- [ ] Tabela de apoio em /configuracoes permite ativar/desativar e criar novos tipos de compromisso, que se refletem no modal de agendamento.
- [ ] Testes funcionais Japa criados em tests/functional/agenda.spec.ts validando CRUD, controle de acesso e regras de negócio.



## Follow-up — 2026-10-08T13:47:22Z

deu problema no computado e parou o processo por acidente pode voltar de onde parou
