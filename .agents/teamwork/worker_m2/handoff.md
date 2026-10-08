# Relatório de Handoff — Marco M2: Modelagem e Backend da Agenda com RBAC (Requisito R2)

**Autor**: Worker M2 (Implementer & QA)  
**Data**: 2026-10-08  
**Diretório de Trabalho**: `/home/porto/codespace/Plannit/.agents/teamwork/worker_m2`  
**Destinatário**: Orchestrator (`a8c91f27-599c-4180-947d-139e34820fa8`)  

---

## 1. Observation

Durante a execução do Marco M2 no monólito Plannit (`/home/porto/codespace/Plannit/plannit`), foram observados e executados os seguintes itens:

1. **Migração do Banco de Dados**:
   - Criado arquivo `database/migrations/1791465200000_create_compromissos_agenda_table.ts` com a estrutura exata exigida:
     - Chaves: `id`, `titulo (150)`, `tipo_id` (FK `tipos_compromisso_catalogo.id` ON DELETE RESTRICT), `data_hora_inicio` e `data_hora_fim` (timestamptz), `local` (255, nullable), `status` (20, default 'agendado'), `observacoes` (text, nullable), `desfecho` (text, nullable), `responsavel_id` (FK `users.id` ON DELETE CASCADE), `criado_por_id` (FK `users.id` ON DELETE CASCADE), `lead_id` (FK `leads.id` ON DELETE SET NULL, nullable), `cliente_id` (FK `clientes.id` ON DELETE SET NULL, nullable), `projeto_id` (FK `projetos.id` ON DELETE SET NULL, nullable), `created_at`, `updated_at`.
     - Índices de performance: `['responsavel_id', 'data_hora_inicio']`, `['status', 'data_hora_inicio']`, `['tipo_id']`, `['lead_id']`, `['cliente_id']`, `['projeto_id']`.
   - Executado `node ace migration:run`:
     ```text
     ❯ migrating database/migrations/1791465200000_create_compromissos_agenda_table
     ❯ migrated database/migrations/1791465200000_create_compromissos_agenda_table
     [ success ] Schema classes generated (707 ms)
     ```
     O arquivo `database/schema.ts` foi automaticamente regenerado, gerando `CompromissosAgendumSchema` (linha 316).

2. **Model Lucid**:
   - Criado `app/models/compromisso_agenda.ts` estendendo `CompromissosAgendumSchema`:
     - Enum `StatusCompromisso` com valores `AGENDADO = 'agendado'`, `CONCLUIDO = 'concluido'`, `CANCELADO = 'cancelado'`, `REAGENDADO = 'reagendado'`.
     - Relacionamentos `@belongsTo`: `tipo` (`TipoCompromissoCatalogo`), `responsavel` (`User`), `criadoPor` (`User`), `lead` (`Lead`), `cliente` (`Cliente`), `projeto` (`Projeto`).
     - Getters de conveniência: `isAtrasado`, `isHoje`, `statusLabel`.
   - Atualizado `app/models/lead.ts`:
     - Adicionado `@hasMany(() => CompromissoAgenda, { foreignKey: 'leadId' }) declare compromissos: HasMany<typeof CompromissoAgenda>`.

3. **Validação VineJS**:
   - Criado `app/validators/compromisso_agenda.ts`:
     - `createCompromissoValidator`: valida título (2 a 150 caracteres), tipoId existente e ativo em `tipos_compromisso_catalogo`, dataHoraInicio e dataHoraFim via regra customizada ISO-8601, responsavelId opcional e ativo, relacionamentos opcionais com `leads`, `clientes`, `projetos`.
     - `updateCompromissoValidator`: campos opcionais para edição parcial.
     - `reagendarCompromissoValidator`: dataHoraInicio, dataHoraFim e observacoes.
     - `cancelarCompromissoValidator`: motivo/observacoes.
     - `concluirCompromissoValidator`: `desfecho` obrigatório (mínimo 3 caracteres).

4. **Controller e RBAC**:
   - Criado `app/controllers/agenda_controller.ts`:
     - Suporte à dualidade Inertia/JSON através do helper `wantsJson(request)`.
     - Helper RBAC `isGestor(user)` verificando superusuário ou perfis `DIRETORIA` / `GERENTE_COMERCIAL`.
     - Método `index`: restringe a query com `where('responsavel_id', user.id)` para perfis operacionais (`VENDEDOR`, `PROJETISTA`, etc.); para gestores, permite visualização ampla de equipe (`visao=equipe`), alternância para agenda pessoal (`visao=minha`) e filtro por colaborador específico (`responsavelId`). Suporta filtros de período (`dataInicio`/`inicio`, `dataFim`/`fim`), `status`, `tipoId`, `leadId`, `clienteId`, `projetoId` e busca textual `q`.
     - Método `store`: atribui `criadoPorId = user.id`; força `responsavelId = user.id` caso o autor não seja gestor; valida consistência temporal (`dataFim > dataInicio`). Se associado a `leadId`, atualiza `lead.ultimaInteracaoEm`.
     - Método `update`: verifica se o compromisso pertence ao usuário autenticado ou se este é gestor; retorna HTTP 403 Forbidden em caso de violação de acesso.
     - Método `reagendar`: valida datas e RBAC; altera status para `reagendado` e anexa log de reagendamento nas observações.
     - Método `cancelar`: valida RBAC; altera status para `cancelado` e armazena motivo do cancelamento.
     - Método `concluir`: valida RBAC e obrigatoriedade do desfecho; executa transação Lucid atômica (`db.transaction`) persistindo `status = 'concluido'`, salvando `desfecho`, inserindo registro em `interacoes_lead` (`tipo: 'reuniao'`, `resumo: 'Compromisso concluído: ... - Desfecho: ...'`, `responsavelId: user.id`) e atualizando `lead.ultimaInteracaoEm = DateTime.now()`.

5. **Rotas e Frontend Placeholder**:
   - Registradas rotas sob `middleware.auth()` em `start/routes.ts`:
     - `GET /agenda` -> `agenda.index`
     - `POST /agenda/compromissos` -> `agenda.compromissos.store`
     - `PUT /agenda/compromissos/:id` -> `agenda.compromissos.update`
     - `PATCH /agenda/compromissos/:id` -> `agenda.compromissos.patch`
     - `PATCH /agenda/compromissos/:id/reagendar` -> `agenda.compromissos.reagendar`
     - `PATCH /agenda/compromissos/:id/cancelar` -> `agenda.compromissos.cancelar`
     - `PATCH /agenda/compromissos/:id/concluir` -> `agenda.compromissos.concluir`
   - Criado placeholder tipado `inertia/pages/agenda/index.tsx` compatível com TypeScript e sem warnings de `noUnusedLocals`.

6. **Testes e Tipagem**:
   - Suíte `tests/functional/agenda.spec.ts` com 12 testes cobrindo autenticação, autorização RBAC, criação, spoofing prevention, reagendamento, cancelamento, validação e conclusão com alimentação transacional da timeline do lead.
   - Execução de `node ace test functional --files=tests/functional/agenda.spec.ts`:
     ```text
     functional / Módulo de Agenda — Backend & RBAC (tests/functional/agenda.spec.ts)
       ✔ bloqueia acesso não autenticado na rota /agenda
       ✔ bloqueia criação de compromisso sem autenticação (redireciona em form e 401 em JSON)
       ✔ vendedor cria compromisso com sucesso e responsavelId é fixado no seu ID
       ✔ vendedor não consegue forçar responsavelId de outro colaborador
       ✔ gestor (Diretoria) consegue agendar compromisso atribuído a outro colaborador
       ✔ rejeita agendamento com data/hora de término anterior ou igual ao início
       ✔ isolamento por perfil na listagem: vendedor vê apenas seus compromissos, gestão vê de todos
       ✔ atualização de compromisso: bloqueia com 403 se outro vendedor tentar editar
       ✔ reagendamento altera status para reagendado e atualiza horários
       ✔ cancelamento altera status para cancelado e registra motivo
       ✔ conclusão de compromisso vinculado a Lead grava desfecho e insere interação atômica na timeline
       ✔ rejeita conclusão de compromisso sem desfecho ou desfecho insuficiente

      PASSED 
     Tests  12 passed (12)
     Time  1s
     ```
   - Execução de toda a suíte funcional `node ace test functional`: 43 testes executados, 43 passaram (0 falhas).
   - Execução de `npm run typecheck`: exit code 0 (zero erros TypeScript).

---

## 2. Logic Chain

1. A persistência dos compromissos operacionais necessitava de uma tabela dedicada com suporte a relacionamentos polivalentes (responsável, criador, lead, cliente, projeto, tipo) e restrições de integridade referencial:
   - Portanto, a migration `1791465200000_create_compromissos_agenda_table.ts` estabeleceu FKs com `CASCADE` para usuários e `SET NULL` para entidades de negócio opcionais, além de `RESTRICT` para os tipos do catálogo parametrizável.
2. A integridade dos dados e das regras de negócio exige que o backend garanta regras temporais e de perfil antes da gravação:
   - Os validadores em `app/validators/compromisso_agenda.ts` e a verificação `fim > inicio` no `AgendaController` garantem que nenhum compromisso com duração nula ou invertida seja criado.
   - O controlador restringe a modificação de `responsavelId` para apenas usuários gestores (`isGestor`), impedindo que vendedores atribuam tarefas ou compromissos a terceiros indevidamente.
3. Para atender aos Requisitos R2 e R4 de integração com o CRM:
   - A rota `PATCH /agenda/compromissos/:id/concluir` opera sob uma transação de banco de dados (`db.transaction`). Ao receber a confirmação de desfecho, atualiza o status do compromisso e simultaneamente insere um registro na tabela `interacoes_lead`, atualizando a data `ultimaInteracaoEm` do lead, permitindo que a timeline do `LeadDrawer` apresente cronologicamente o histórico sem intervenção manual.
4. A suíte funcional `tests/functional/agenda.spec.ts` reproduz o comportamento real do navegador e de chamadas assíncronas JSON, validando que requisições não autorizadas recebem 403 Forbidden e que a limpeza em `group.each.teardown` remove registros transitórios do banco de desenvolvimento sem deixar resíduos.

---

## 3. Caveats

- **No Caveats**: Todos os itens do Requisito R2 foram integralmente implementados com código real de produção, sem mocks nem atalhos. O frontend completo da tela `/agenda` (visualização em calendário/grade e lista, modais com UI rica) é responsabilidade do Marco M3, e a integração visual no `LeadCard` e `LeadDrawer` é do Marco M4. A interface do placeholder `inertia/pages/agenda/index.tsx` já fornece o contrato de dados exato esperado pelo frontend.

---

## 4. Conclusion

O Marco M2 está **concluído com êxito**:
- Modelagem e banco de dados ativos e sincronizados.
- Controller RESTful com suporte a JSON e Inertia, validação estrita com VineJS e isolamento por perfil (RBAC) plenamente funcional.
- Conclusão com gravação de desfecho e alimentação transacional da timeline de Leads.
- 100% dos testes funcionais passando (12/12 específicos, 43/43 globais).
- Typecheck limpo com 0 erros.
- A aplicação está pronta para receber as telas do frontend no Marco M3 e a integração do Kanban no Marco M4.

---

## 5. Verification Method

Para verificar independentemente a entrega do Marco M2:

1. **Executar a suíte de testes funcionais da Agenda**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node ace test functional --files=tests/functional/agenda.spec.ts
   ```
   *Critério de aprovação*: 12 testes executados e 12 passando com status `PASSED`.

2. **Executar a suíte completa de testes funcionais do projeto**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node ace test functional
   ```
   *Critério de aprovação*: 43 testes passando sem nenhuma regressão.

3. **Verificar tipagem estrita TypeScript**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   npm run typecheck
   ```
   *Critério de aprovação*: Exit code 0 sem nenhum erro reportado pelo `tsc`.

4. **Inspecionar rotas registradas da Agenda**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node ace list:routes | grep agenda
   ```
   *Critério de aprovação*: Retorna as rotas `agenda.index`, `agenda.compromissos.store`, `agenda.compromissos.update`, `agenda.compromissos.patch`, `agenda.compromissos.reagendar`, `agenda.compromissos.cancelar` e `agenda.compromissos.concluir`.
