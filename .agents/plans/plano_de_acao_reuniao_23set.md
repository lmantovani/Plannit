# Plano de Ação: Objetivos da Reunião (23 de Setembro)

Este plano de ação traduz as necessidades e objetivos levantados na reunião em tarefas de desenvolvimento e pesquisa. As tarefas estão ordenadas de forma lógica para execução em etapas.

## 1. Gestão e Histórico de Leads (CRM)
**Objetivo:** Garantir total rastreabilidade das interações e tempo em cada etapa, além de corrigir o fluxo de cadastro e qualificação.

*   **1.a. Adicionar histórico de status (Backend):** (✅ Concluído) Toda mudança de status do lead grava em `historico_status_leads` a data/hora, o responsável (`alterado_por_id`), o status de origem e de destino e o tempo de permanência na etapa anterior (`tempo_permanencia_segundos`).
*   **1.b. Criar histórico no card (Frontend):** (✅ Concluído) O drawer do lead no CRM tem a "Linha do Tempo", que junta as interações registradas e as mudanças de fase (com autor, data e tempo de permanência).
*   **1.c. Corrigir bug de cadastro/qualificação:** Ajustar o modal e endpoint para não permitir o avanço de leads sem qualificação (✅ *Parcialmente resolvido recentemente via implementação da RN001*).
*   **1.d. Módulo de Agenda na Sidebar e Conexão Bidirecional com o Kanban de Leads:** (⭕ Pendente) Criar um módulo completo de Agenda conectado operacionalmente ao fluxo de vendas e CRM:
    *   **1.d.1. Parametrização dos Tipos de Compromisso em Configurações (`/configuracoes`):**
        *   Criar tabela de apoio `tipos_compromisso_catalogo` (`id`, `nome`, `slug`, `cor`, `is_active`, `ordem`, `timestamps`).
        *   Nova aba **"Tipos de Compromisso"** no painel `/configuracoes` com contadores, status ativo/inativo, ordenação e modal de cadastro/edição restrito à Diretoria e Gerente Comercial.
        *   Seed idempotente com os tipos padrão (*Briefing Técnico*, *Visita e Medição no Local*, *Apresentação de Projeto 3D*, *Visita à Obra*, *Reunião de Alinhamento na Loja*, *Alinhamento com Especificador / Arquiteto*, *Outro*).
        *   Atalho **"Configurar ↗"** nos formulários de agendamento e sincronização em tempo real entre abas (cross-tab com eventos de `storage` e `focus`).
    *   **1.d.2. Modelagem e Backend da Agenda (`compromissos_agenda`):**
        *   Criar migration e model `CompromissoAgenda` contendo título, tipo (FK/slug do catálogo), data/hora início e fim (UTC/Luxon), local, status (`agendado`, `concluido`, `cancelado`, `reagendado`), observações prévias e desfecho pós-encontro.
        *   Vínculos relacionais com `responsavel_id` (User), `criado_por_id` (User), e entidades opcionais `lead_id`, `cliente_id` e `projeto_id`.
        *   Controller `AgendaController` com validação VineJS e regras de acesso rígidas: vendedores e projetistas veem apenas seus compromissos; Diretoria e Gerente Comercial acessam todos com filtros por usuário.
        *   Endpoint de conclusão (`PATCH /agenda/compromissos/:id/concluir`) que exige ou aceita o resumo do desfecho e registra na linha do tempo do lead.
    *   **1.d.3. Tela de Agenda Central na Sidebar (`/agenda`):**
        *   Novo item de navegação **"Agenda"** no menu lateral (`app_layout.tsx`) com ícone de calendário.
        *   Interface completa da agenda com cabeçalho de controle:
            *   **Filtros de Permissão (RBAC):** Alternador para gestores entre *"Minha Agenda"* e *"Toda a Equipe"*, mais select para filtrar por um colaborador específico.
            *   **Modos de Visualização:** Visão em calendário (Mês / Semana / Dia) e visão em lista cronológica com filtros de status (Próximos, Concluídos, Atrasados).
            *   **Modal de Novo Compromisso Central:** Criação de compromissos gerais da loja com busca autocomplete para associar Lead, Cliente ou Parceiro se desejado.
    *   **1.d.4. Conexão Operacional Bidirecional com o Kanban de Leads:**
        *   **No Card do Kanban (`LeadCard`):** Exibir badge destacado do próximo compromisso em aberto (ex.: `📅 Amanhã 14h — Apresentação 3D`), com codificação cromática de urgência (azul para hoje, vermelho para atrasado, padrão para datas futuras).
        *   **No Drawer do Lead (`LeadDrawer`):** Seção dedicada de compromissos com listagem dos agendados e botão *"Agendar Encontro"*, abrindo modal já pré-vinculado ao lead.
        *   **Conclusão e Linha do Tempo:** Ao marcar o compromisso como realizado, o desfecho/ata gera automaticamente uma interação na linha do tempo do lead (`historico_status_leads` / interações).
    *   **1.d.5. Testes Automatizados (Japa):**
        *   Testes cobrindo isolamento de permissão (vendedor não acessa compromissos de outros sem privilégio de gestão).
        *   Testes de criação, reagendamento e conclusão com alimentação da timeline do lead.

## 2. Ajustes na Qualificação de Leads e Campos Administrativos (✅ Concluído)
**Objetivo:** Parametrizar dados que hoje são texto livre para evitar inconsistências em relatórios (ex: "caixa de algodão").

*   **2.a. Configurar painel administrativo de tabelas de apoio:** (✅ Concluído) Telas criadas em `/configuracoes` com abas para `Ambientes`, `Origens` e `Campanhas`, integradas ao menu lateral e com restrição de acesso por perfil (`DIRETORIA` e `GERENTE_COMERCIAL`). Endpoints CRUD e seeds padrão executados.
*   **2.b. Atualização dos valores de qualificação:** (✅ Concluído) Novas faixas de investimento implementadas: Até 80k, 80k a 150k, 150k a 300k, 300k a 500k e Acima de 500k, com retrocompatibilidade para leads existentes.
*   **2.c. Prazos e Venda Futura:** (✅ Concluído) Adicionada a categoria "Venda futura (acima de 18 meses)" nos validadores e interface.
*   **2.d. Padronização de ambientes:** (✅ Concluído) Ambientes desmembrados (Living e Home, Banheiro e Lavabo, quartos específicos de Filho, Filha e Visita) e opção dinâmica "Outro" com descrição textual obrigatória e validação estrita.

## 3. Gestão de Especificadores (Arquitetos/Parceiros)
**Objetivo:** Unificar as planilhas Excel em uma aba de Especificadores focada em CRM, facilitando a vida do vendedor.

*   **3.a. Implementar busca de especificador no Lead:** (✅ Concluído) Campo de busca dinâmica (autocomplete) por nome ou escritório, sem diferenciar acentos, na criação do lead (origem "Especificador") e na qualificação. Se o especificador não existir, a opção "Cadastrar '<texto digitado>'" abre um cadastro rápido já com o nome preenchido (qualquer perfil pode cadastrar; o restante do perfil é completado depois em Especificadores). O lead fica vinculado ao especificador (só são aceitos especificadores ativos).
*   **3.b. Dashboard/Aba do Especificador:** Criar interface para exibir dados do parceiro, como: vendedor responsável, data da última visita, data do último orçamento, pontuação de associação (viagens) e histórico de interações com formato de timeline (ex: "ganhou pão de mel", "visita no escritório"). (✅ *Parcialmente resolvido: a aba Perfil do especificador já mostra o vendedor responsável e o histórico de interações, com registro de novos contatos em 9 tipos — incluindo visita ao escritório, viagem e envio de brinde. Faltam a data da última visita, a data do último orçamento e a pontuação de associação por viagens.*)
*   **3.c. Controle de Carteira e Histórico de Conversão:** Limitar visão/atribuição a até 25 arquitetos por vendedor. Linkar orçamentos e pedidos trazidos pelo especificador, contabilizando performance e metas diretamente no perfil dele. (✅ *Parcialmente resolvido: o lead criado com especificador já fica vinculado a ele e entra no score do especificador (potencial e taxa de conversão), e o vínculo passa para o projeto ao abrir o briefing. Faltam o limite de 25 especificadores por vendedor e o vínculo de orçamentos e pedidos às metas.*)

## 4. Ajustes no Briefing
**Objetivo:** Melhorar a coleta de informações técnicas e limpar dados desnecessários na etapa de Briefing.

*   **4.a. Integração ViaCEP:** Adicionar busca automática de endereço/cidade por CEP para evitar erros de digitação e padronizar cadastros.
*   **4.b. Novos campos e remoções:** Adicionar campos para `pé direito` e `observações gerais`. Remover a obrigatoriedade de estilo preferido e o aprofundamento em detalhes elétricos/hidráulicos nesta fase inicial.
*   **4.c. Urgência e Prazos:** Inserir métrica de urgência de fechamento (ex: prioridade máxima caso o cliente queira fechar até o final do mês corrente) e definir faixas de estimativas de entrega da obra (30, 60, 120, 180+ dias).
*   **4.d. Guias de entrevista:** Disponibilizar links de apoio (questionários de entrevista por ambiente) para orientar o vendedor durante o briefing, mantendo o preenchimento em formato de texto flexível.

## 5. Segmentação do Pipeline de Projetos
**Objetivo:** Otimizar a visualização do fluxo de trabalho, quebrando o Kanban único gigante (atualmente com 34 colunas) em funis menores.

*   **5.a. Avaliar e Definir estágios:** Coletar a lista exata dos estágios desejados para as novas etapas (Comercial, Projetos, Fechamento) antes de iniciar a codificação.
*   **5.b. Refatoração do Kanban:** Implementar múltiplas views/pipelines e garantir a migração automática de cards entre eles (ex: do Briefing Concluído para a Fila de Projetos), além de destacar as flags de atenção (cores por status).

## 6. Tarefas de Infraestrutura, Pesquisa e Integração
**Objetivo:** Garantir que o sistema opere no ambiente real e integre corretamente com serviços de terceiros.

*   **6.a. Verificar integração Real App:** Investigar a viabilidade técnica (APIs) de integrar a comunicação com o Real App e decidir se o uso da ferramenta será continuado.
*   **6.b. Aprender deploy (Infraestrutura):** Consolidar o processo de subida/deploy do monolito (Adonis/React) para o servidor de produção, viabilizando o trabalho do Jacan.
*   **6.c. Analisar o manual:** Leitura obrigatória do manual pelas partes envolvidas (Thiago, Leandro) para sugestões em versões futuras.

## 7. Entregas Fora do Plano Original (✅ Concluído)
**Objetivo:** Registrar o que foi desenvolvido a partir das anotações da reunião e de bugs encontrados nos testes, mas que não constava neste plano. Desenvolvido na branch `feature/lead-especificador`.

*   **7.a. Campanha do lead pelo catálogo:** (✅ Concluído) O campo "Campanha" do Novo Lead passou a ter a mesma busca do especificador e só aceita campanha ativa do catálogo, sem texto livre — base para KPIs confiáveis por campanha. Diretoria e Gerência podem cadastrar uma campanha nova direto do modal; o vendedor é orientado a pedir a um gestor.
*   **7.b. Descrição da origem "Outro":** (✅ Concluído) Ao escolher a origem "Outro", o lead exige o campo "Qual é a origem?" (texto livre), mostrado no drawer e como dica no card e na lista. Serve para avaliar se vale criar uma nova origem no catálogo.
*   **7.c. Bug — ambientes da qualificação não apareciam no briefing técnico:** (✅ Concluído) O briefing passou a usar o mesmo catálogo de ambientes da qualificação do lead, com os ambientes já marcados ao abrir. Ganhou a opção "Outro" com descrição obrigatória, e o detalhamento técnico separa os ambientes solicitados dos demais do catálogo. Briefings antigos são traduzidos automaticamente.
*   **7.d. Bug — projeto e briefing duplicados para o mesmo cliente:** (✅ Concluído) Iniciar o briefing de um lead que já tem projeto em aberto reaproveita esse projeto em vez de criar outro. No CRM, o botão vira "Abrir Briefing Técnico" e fica bloqueado durante o envio, evitando clique duplo. A lista de briefings deixou de mostrar projetos arquivados.
*   **7.e. Instruções para agentes de IA:** (✅ Concluído) `AGENTS.md` unificado como arquivo único de instruções do projeto para qualquer agente de IA (Claude, Codex, Cursor, Gemini/Antigravity, Copilot), já descrevendo o monólito AdonisJS; o `CLAUDE.md` só importa esse conteúdo. Bugs conhecidos ainda não corrigidos ficam registrados lá.
*   **7.f. Testes automatizados:** (✅ Concluído) A suíte funcional (Japa) passou de 14 para 27 testes, cobrindo o vínculo de especificador e campanha no lead, a origem "Outro" e a prevenção de briefing duplicado.