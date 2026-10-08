# Handoff Report: Mapeamento de Backend, Modelos de Dados e RBAC da Agenda (R2)

**Agente**: Explorer 2 (Teamwork Explorer)  
**Data**: 2026-10-08  
**Destinatário**: Orquestrador (`a8c91f27-599c-4180-947d-139e34820fa8`) e Desenvolvedores Subsequentes  
**Arquivo de Análise Completa**: `/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_2/analysis.md`  

---

## 1. Observation

Durante a investigação no repositório `/home/porto/codespace/Plannit/plannit`, foram observados diretamente os seguintes fatos, arquivos e trechos de código:

1. **Estrutura de Perfis e Permissões em `plannit/app/models/user.ts`**:
   - Linhas 10–26: Enum `PerfilUsuario` com 15 perfis mapeados (`DIRETORIA`, `GERENTE_COMERCIAL`, `VENDEDOR`, `PROJETISTA`, etc.).
   - Linhas 46–49: Constante `PERFIS_GESTAO = [PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL]`.
   - Linhas 93–99: Método `hasRole(roles)` valida `this.isSuperuser || this.perfil === PerfilUsuario.DIRETORIA || roleList.includes(this.perfil)`.
   - Linhas 101–103: Getter `isGestor` chama `this.hasRole(PERFIS_GESTAO)`.

2. **Modelos de Dados do CRM e Projetos**:
   - `plannit/app/models/lead.ts`: Linhas 109–128 estabelecem relações com `vendedor` (`User`), `interacoes` (`InteracaoLead`), `historicoStatus` (`HistoricoStatusLead`) e `arquiteto` (`Arquiteto`). Linhas 134–150 definem getters `diasSemInteracao` e `precisaAtencao`.
   - `plannit/app/models/cliente.ts`: Linhas 14–36 definem relações com `projetos`, `enderecos`, `arquiteto` e `aprovadoPor`.
   - `plannit/app/models/projeto.ts`: Linhas 88–150 mapeiam status (32 etapas do SRS), vinculações com `vendedorId`, `projetistaId`, `conferenteId`, `leadId`, `clienteId`, `briefing`, `fechamento`, `handoff` e `historicoStatus`.
   - `plannit/app/models/historico_status_lead.ts`: Linhas 7–19 definem a tabela `historico_status_leads` (imutável, transição de funil e tempo de permanência).
   - `plannit/app/models/interacao_lead.ts`: Linhas 7–21 definem a tabela `interacoes_lead` (`tipo`: `'whatsapp' | 'ligacao' | 'email' | 'visita' | 'reuniao'`, `resumo`, `leadId`, `responsavelId`, `createdAt`).

3. **Padrão de Isolamento por Perfil (RBAC) nos Controllers**:
   - Em `plannit/app/controllers/leads_controller.ts` (linhas 60–65):
     ```typescript
     if (user.perfil === PerfilUsuario.VENDEDOR) {
       leadsQuery.where('vendedor_id', user.id)
     } else if (vendedorFilter) {
       leadsQuery.where('vendedor_id', vendedorFilter)
     }
     ```
   - Em `plannit/app/controllers/projetos_controller.ts` (linhas 51–55):
     ```typescript
     if (user.perfil === PerfilUsuario.VENDEDOR) {
       projetosQuery.where('vendedor_id', user.id)
     } else if (user.perfil === PerfilUsuario.PROJETISTA) {
       projetosQuery.where('projetista_id', user.id)
     }
     ```
   - Em `plannit/app/controllers/arquitetos_controller.ts` (linhas 42–46):
     ```typescript
     private isGestor(user: User): boolean {
       if (user.isSuperuser) return true
       const perfil = String(user.perfil || '').toLowerCase()
       return ['diretoria', 'gerente_comercial', 'admin'].includes(perfil)
     }
     ```

4. **Composição da Timeline do Lead em `plannit/inertia/pages/crm/index.tsx`**:
   - Linhas 755–768: A timeline mescla `lead.interacoes` (`type: 'interacao'`) e `lead.historicoStatus` (`type: 'historico_status'`) ordenando por data decrescente.
   - Em `plannit/app/controllers/leads_controller.ts` (linhas 350–355): A qualificação cria uma `InteracaoLead` com `tipo: 'reuniao'` e atualiza `lead.ultimaInteracaoEm = DateTime.now()`.

5. **Padrão de Transações Lucid e Flash Messages**:
   - Em `plannit/app/controllers/projetos_controller.ts` (linhas 456–478): Uso de `await db.transaction(async (trx) => { ... })` com `projeto.useTransaction(trx)` e `{ client: trx }` para inserções.
   - Em `plannit/app/controllers/projetos_controller.ts` (linhas 22–27) e `configuracoes_controller.ts` (linhas 28–33): Helper `wantsJson(request)`.
   - Conforme documentado em `AGENTS.md` ("Bugs conhecidos"): O middleware do Inertia só repassa as chaves `'success'` e `'error'` de `session.flash`. Qualquer uso de `'erro'` ou `'info'` é descartado sem aviso ao usuário.

6. **Validações VineJS e Rotas**:
   - Em `plannit/app/validators/configuracao.ts` (linhas 5–15): Uso de `DateTime.fromISO` com Luxon em regra personalizada `vine.createRule`.
   - Em `plannit/app/validators/lead.ts` (linhas 57–77): Uso da regra `.exists({ table, column, filter })`.
   - Em `plannit/start/routes.ts`: Todas as rotas autenticadas agrupadas em `middleware.auth()`, com nomes `.as(...)`.

---

## 2. Logic Chain

A partir das observações acima, a cadeia de raciocínio lógico estruturada é a seguinte:

1. **Definição de Autorização (RBAC)**:
   - *Premissa*: `User.hasRole(PERFIS_GESTAO)` (ou `user.isGestor`) identifica Diretoria e Gerente Comercial; perfis como `VENDEDOR` e `PROJETISTA` são operacionais.
   - *Dedução*: Na rota `GET /agenda` (`AgendaController.index`), usuários operacionais devem ter a query condicionada a `query.where('responsavel_id', user.id)`. Usuários de gestão têm permissão para visualizar todos os compromissos da loja ou filtrar por um colaborador específico (`responsavelId`).
   - *Proteção em Mutações*: Nos métodos `store`, `update`, `reagendar`, `cancelar` e `concluir`, o usuário operacional só pode interagir com compromissos onde `responsavel_id === user.id`. Qualquer tentativa de manipular compromissos de terceiros deve ser rejeitada com `403 Forbidden`.

2. **Integridade da Linha do Tempo do Lead**:
   - *Premissa*: O frontend do CRM exibe a linha do tempo com base no relacionamento `lead.interacoes` (`InteracaoLead`).
   - *Dedução*: Quando um compromisso associado a um lead (`lead_id != null`) é concluído via `PATCH /agenda/compromissos/:id/concluir`, o backend deve gravar o `desfecho` no compromisso e, dentro da mesma transação, inserir uma `InteracaoLead` com o resumo do compromisso e desfecho, atualizando `lead.ultima_interacao_em`.
   - *Garantia de Atomicidade*: Utilizar `db.transaction(async (trx) => ...)` para garantir que o desfecho e a inserção na timeline ocorram de forma atômica.

3. **Arquitetura de Dados (CompromissoAgenda)**:
   - *Premissa*: O compromisso deve permitir associação opcional com Lead, Cliente e Projeto, além de relacionar-se com o catálogo de tipos (R1).
   - *Dedução*: A tabela `compromissos_agenda` necessita das chaves estrangeiras `tipo_id` (RESTRICT), `responsavel_id` (CASCADE), `criado_por_id` (CASCADE), `lead_id` (SET NULL), `cliente_id` (SET NULL) e `projeto_id` (SET NULL), com índices compostos para otimização de consultas por período de calendário (`responsavel_id, data_hora_inicio`).

4. **Padronização de Interface e Respostas**:
   - *Premissa*: O monólito atende requisições Inertia e JSON de forma unificada.
   - *Dedução*: `AgendaController` deve implementar o helper `wantsJson()`, respondendo com JSON nas chamadas de API/testes e com `session.flash('success' | 'error')` + `redirect().back()` nas requisições Inertia.

---

## 3. Caveats

1. **Restrição Read-Only mantida**: Nenhuma alteração foi realizada nos arquivos de código ou banco de dados durante esta investigação. O relatório atua como especificação completa para a fase de implementação.
2. **Dependência com Requisito R1**: A migration de `compromissos_agenda` possui chave estrangeira para `tipos_compromisso_catalogo.id`. Portanto, a migration de R1 deve ser executada antes (ou no mesmo batch) da migration de R2.
3. **Escopo de Timeline**: A timeline automática foi desenhada para registros vinculados a `lead_id`. Caso um compromisso esteja vinculado exclusivamente a `cliente_id` ou `projeto_id` (sem lead), ele será persistido normalmente, mas não criará registro em `interacoes_lead` (que é exclusivo de leads).

---

## 4. Conclusion

A modelagem do Requisito R2 foi completamente definida, abrangendo:
1. **Migration DDL**: Tabela `compromissos_agenda` com campos `id`, `titulo`, `tipo_id`, `data_hora_inicio`, `data_hora_fim`, `local`, `status` (`agendado`, `concluido`, `cancelado`, `reagendado`), `observacoes`, `desfecho`, `responsavel_id`, `criado_por_id`, `lead_id`, `cliente_id`, `projeto_id`, `created_at`, `updated_at` e índices de alta performance.
2. **Model Lucid**: `CompromissoAgenda` com enum `StatusCompromisso`, getters de urgência (`isAtrasado`, `isHoje`) e relacionamentos completos. Relações reversas em `Lead`, `User`, `Cliente` e `Projeto`.
3. **Validação VineJS**: Schemas em `app/validators/compromisso_agenda.ts` para criação, edição, reagendamento, cancelamento e conclusão (com `desfecho` obrigatório).
4. **Controller e Rotas**: `app/controllers/agenda_controller.ts` com métodos `index`, `store`, `update`, `reagendar`, `cancelar` e `concluir`, aplicando controle estrito de RBAC por perfil e transação atômica que alimenta `interacoes_lead`.
5. **Integração CRM (R4)**: Mapeamento de preloading em `leads_controller.ts` para injetar `proximoCompromisso` em cada cartão Kanban sem sobrecarga de queries.

O documento completo com todo o código sugerido está disponível em `/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_2/analysis.md`.

---

## 5. Verification Method

Para verificar de forma independente e validar a implementação subsequente:

1. **Inspeção de Documentos**:
   - Verificar `/home/porto/codespace/Plannit/.agents/teamwork/explorer_survey_2/analysis.md`.
2. **Comandos de Verificação do Projeto**:
   - `npm run typecheck` (a partir de `plannit/`): Deve passar com 0 erros de tipagem no servidor e no Inertia.
   - `node ace test functional`: Executa a suíte de testes funcionais contra o banco PostgreSQL de desenvolvimento.
3. **Cenários Críticos a Testar em `tests/functional/agenda.spec.ts`**:
   - Vendedor autenticado tenta listar compromissos e só recebe os seus (`responsavel_id = user.id`).
   - Vendedor tenta atualizar compromisso de outro vendedor e recebe `403 Forbidden`.
   - Gestor autenticado lista compromissos de toda a equipe e filtra por colaborador.
   - Endpoint `PATCH /agenda/compromissos/:id/concluir` grava desfecho, altera status para `concluido` e cria registro em `interacoes_lead` para o lead vinculado.
