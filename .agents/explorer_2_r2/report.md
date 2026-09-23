# Relatório Técnico de Investigação Arquitetural — R2 e R3
**Projeto:** Plannit (Líder Móveis Planejados)  
**Stack:** AdonisJS v7, Lucid ORM, Inertia.js React 19, PostgreSQL  
**Data:** 11 de Setembro de 2026  
**Agente:** Explorer 2 (R2) — Reposição  

---

## 1. Resumo Executivo das Descobertas

Esta investigação estática aprofundada analisou o código-fonte em `/home/porto/codespace/Plannit/plannit` com foco nos requisitos **R2 (Integridade Relacional de Clientes em Projetos e Conversão de Leads)** e **R3 (Auditoria Imutável no Envio de Briefing à Fila - RN017)**, além de sua articulação direta com a regra **RN001 (R5 - Bloqueio de Lead Não Qualificado)**.

### Principais Diagnósticos Identificados:
1. **R2 — Falha de Vínculo na Conversão de Leads (`clientes_controller.ts:converterLead`)**:
   - O método `converterLead` cria o `Cliente` e atualiza o `Lead` (`convertidoEmCliente = true`, `clienteId = cliente.id`, `statusFunil = 'fechado'`), mas **NÃO** atualiza os projetos pré-existentes vinculados ao lead (`where('lead_id', lead.id)`).
   - Como resultado, os projetos mantêm `cliente_id = null`. Ao carregar a ficha do cliente em `/clientes/:id` (`ClientesController.show`), a relação `@hasMany('projetos')` retorna vazia, quebrando o resumo financeiro (`resumoCompras`) e a rastreabilidade histórica.
   - Além disso, `Projeto` e `db` não estão importados no controller.

2. **R2 — Falha de Vínculo na Criação de Projetos via Briefing (`briefings_controller.ts:store`)**:
   - Ao iniciar um novo projeto através de `POST /briefings` (acionado pelos modais de "Novo Projeto" em `/projetos` e "Novo Briefing" em `/briefings`), o controller recebe `clienteNome` (e opcionalmente `leadId`).
   - O `Projeto.create` grava `codigo`, `clienteNome`, `leadId`, `vendedorId`, `status`, mas **não atribui `cliente_id`**, deixando o campo nulo no banco.
   - Não há busca nem instanciação da entidade `Cliente` na tabela `clientes`, desrespeitando o requisito que exige "associar ou criar a entidade relacional na tabela clientes populando `projetos.cliente_id`".
   - Os models `Cliente` e `Lead` não estão importados em `briefings_controller.ts`.

3. **R3 — Ausência de Auditoria Imutável no Envio à Fila (`briefings_controller.ts:enviarParaFila`)**:
   - O método `enviarParaFila` valida o score mínimo (RN002, score >= 70), atualiza `briefing.status = 'enviado'`, cria/atualiza `FilaProjeto` e altera o status do projeto para `na_fila` (`StatusProjeto.NA_FILA`).
   - Contudo, **NÃO registra o evento em `HistoricoStatusProjeto`**. Em todos os demais controllers do ecossistema (`projetos_controller.ts`, `fila_controller.ts`, `fechamentos_controller.ts`), as transições gravam obrigatoriamente um registro imutável com `statusDe`, `statusPara`, `alteradoPorId` e `observacao`.
   - Ademais, `auth` sequer é desestruturado dos parâmetros de `HttpContext` em `enviarParaFila`, impossibilitando identificar o autor da transição (`alteradoPorId`).

4. **Conexão com R5 (RN001)**:
   - Nem `clientes_controller.ts:converterLead` nem `briefings_controller.ts:store` checam se o lead possui `qualificado === false`, permitindo que leads não qualificados avancem no funil ou sejam convertidos, violando a regra de negócio RN001.

---

## 2. Investigação Detalhada do Requisito R2

### 2.1 Mapeamento de Modelos, Migrations e Schemas

#### A. Modelo e Tabela `clientes`
- **Migration:** `database/migrations/1789065365478_create_clientes_and_enderecos_tables_table.ts`
- **Schema Base:** `database/schema.ts` (linhas 132–167)
- **Model:** `app/models/cliente.ts`
- **Colunas no Banco (`clientes`):**
  - `id`: increments
  - `nome`: varchar(200), notNullable
  - `cpf_cnpj`: varchar(30), unique, nullable
  - `telefone`: varchar(30), notNullable
  - `email`: varchar(200), nullable
  - `tipo`: varchar(30), default 'pessoa_fisica'
  - `rg_ie`: varchar(30), nullable
  - `profissao_ramo`: varchar(150), nullable
  - `observacoes`: text, nullable
  - `arquiteto_id`: integer, references `arquitetos.id`, nullable
  - `cadastro_aprovado`: boolean, default false
  - `cadastro_aprovado_por`: integer, references `users.id`, nullable
  - `cadastro_aprovado_em`: timestamp, nullable
  - `is_active`: boolean, default true
  - `created_at`, `updated_at`: timestamps
- **Relação com Projetos em `Cliente` (`app/models/cliente.ts`, linhas 22-25):**
  ```typescript
  @hasMany(() => Projeto, {
    foreignKey: 'clienteId',
  })
  declare projetos: HasMany<typeof Projeto>
  ```

#### B. Modelo e Tabela `projetos`
- **Migration:** `database/migrations/1761885935171_create_projetos_table.ts` e alteração em `1789065365478_create_clientes_and_enderecos_tables_table.ts`
- **Schema Base:** `database/schema.ts` (linhas 700–741)
- **Model:** `app/models/projeto.ts`
- **Colunas Relevantes:**
  - `lead_id`: integer, references `leads.id`, nullable (`leadId` no model)
  - `cliente_id`: integer, references `clientes.id`, nullable (`clienteId` no model)
  - `cliente_nome`: varchar(200), notNullable (`clienteNome` no model)
- **Relações em `Projeto` (`app/models/projeto.ts`, linhas 106-135):**
  ```typescript
  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>
  ```

#### C. Modelo e Tabela `leads`
- **Migration:** `database/migrations/1761885935169_create_leads_table.ts`
- **Schema Base:** `database/schema.ts` (linhas 611–653)
- **Model:** `app/models/lead.ts`
- **Colunas Relevantes:**
  - `qualificado`: boolean, notNullable, default false
  - `convertido_em_cliente`: boolean, notNullable, default false
  - `cliente_id`: integer, nullable
  - `telefone`: varchar(30), notNullable
  - `email`: varchar(254), nullable
  - `arquiteto_id`: integer, nullable

---

### 2.2 Análise de `app/controllers/clientes_controller.ts:converterLead`

#### Código Atual Observado (linhas 294 a 326):
```typescript
  /**
   * Converte um lead qualificado do CRM em cliente
   */
  async converterLead({ params, request, response, session }: HttpContext) {
    const lead = await Lead.find(params.leadId)
    if (!lead) {
      session.flash('error', 'Lead não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(createClienteValidator)

    const { endereco, ...dadosCliente } = payload

    const cliente = await Cliente.create({
      ...dadosCliente,
      arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId,
    })

    if (endereco && endereco.logradouro) {
      await EnderecoCliente.create({
        clienteId: cliente.id,
        ...endereco,
        isPrincipal: true,
      })
    }

    // Atualiza o Lead no funil
    lead.convertidoEmCliente = true
    lead.clienteId = cliente.id
    lead.statusFunil = 'fechado'
    await lead.save()

    session.flash('success', `Lead ${lead.nome} convertido com sucesso em Cliente!`)
    return response.redirect().toRoute('clientes.show', { id: cliente.id })
  }
```

#### Deficiências Identificadas:
1. **Ausência de Atualização dos Projetos:**
   Projetos vinculados a este lead (`projetos.lead_id = lead.id`) permanecem com `cliente_id = null`.
2. **Impacto Funcional Imediato:**
   O redirecionamento ocorre para `clientes.show` (`id: cliente.id`). A rota `show` carrega:
   ```typescript
   .preload('projetos', (q) => {
     q.preload('vendedor')
       .preload('projetista')
       .preload('briefing')
       .orderBy('createdAt', 'desc')
   })
   ```
   Como `projetos.cliente_id` é nulo, nenhum projeto é retornado. A ficha do cliente não exibe os projetos do lead, `totalProjetos` torna-se 0 e `valorTotalComprado` torna-se R$ 0,00.
3. **Falta de Transação Atômica:**
   A criação do cliente, do endereço e a atualização do lead não ocorrem em `db.transaction`. Se houver falha na persistência do endereço ou na atualização de projetos, o banco fica em estado inconsistente.
4. **Falta de Validação RN001 (R5):**
   Não há validação de `lead.qualificado`. Se o lead estiver `qualificado === false`, a conversão deveria ser recusada com HTTP 400.

---

### 2.3 Análise de `app/controllers/briefings_controller.ts:store` e Modais

#### Ponto de Invocação no Frontend:
1. **`inertia/pages/projetos/index.tsx` (linhas 73–87):**
   O modal "Iniciar Novo Projeto" envia `router.post('/briefings', { clienteNome })`.
2. **`inertia/pages/briefings/index.tsx` (linhas 106–118):**
   O modal "Iniciar Novo Briefing" envia `router.post('/briefings', { projetoId, clienteNome })`.

#### Código Atual Observado em `BriefingsController.store` (linhas 276 a 321):
```typescript
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

    let projeto: Projeto | null = null

    if (projetoId) {
      projeto = await Projeto.find(projetoId)
      if (!projeto) {
        session.flash('erro', 'Projeto não encontrado')
        return response.redirect().back()
      }
    } else if (clienteNome && clienteNome.trim()) {
      // Gera próximo código sequencial livre (evita colisões com gaps ou seeds existentes)
      const year = new Date().getFullYear()
      const prefix = `PRJ-${year}-`
      const projetosAno = await Projeto.query().whereILike('codigo', `${prefix}%`).select('codigo')

      let maxSeq = 0
      for (const p of projetosAno) {
        const match = p.codigo.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxSeq) maxSeq = num
        }
      }

      let nextSeq = Math.max(maxSeq + 1, 1)
      let codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`

      while (await Projeto.query().where('codigo', codigo).first()) {
        nextSeq++
        codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`
      }

      projeto = await Projeto.create({
        codigo,
        clienteNome: clienteNome.trim(),
        leadId: leadId ? Number(leadId) : null,
        vendedorId: user.id,
        status: StatusProjeto.EM_BRIEFING,
        arquivado: false,
        alertaParado: false,
        statusAlteradoEm: DateTime.now(),
      })
```

#### Deficiências Identificadas:
1. `Projeto.create` **NUNCA** atribui `clienteId`.
2. Não há consulta a `Cliente.query().whereILike('nome', clienteNome.trim())` nem instanciação de novo registro caso não exista.
3. Se um `leadId` for informado:
   - Não verifica `lead.qualificado` (RN001 / R5).
   - Não verifica se o lead já possui `clienteId`.
   - Não vincula o novo `Cliente` criado de volta ao `Lead.clienteId`.
4. Se um `projetoId` pré-existente for fornecido:
   - Se o projeto pré-existente tiver `clienteId === null`, ele não é saneado nem associado a um cliente.
5. Os modelos `Cliente` e `Lead` não estão importados em `briefings_controller.ts`.

---

## 3. Investigação Detalhada do Requisito R3

### 3.1 O Modelo `HistoricoStatusProjeto` e Regra RN017
- **Migration:** `database/migrations/1761885935176_create_historico_status_projeto_table.ts`
- **Model:** `app/models/historico_status_projeto.ts`
- **Campos Obrigatórios/Relevantes:**
  - `projetoId`: number (notNullable)
  - `statusDe`: string | null (nullable para criação inicial)
  - `statusPara`: string (notNullable)
  - `alteradoPorId`: number | null (references `users.id`)
  - `observacao`: string | null
  - `createdAt`: DateTime (autoCreate)

### 3.2 Análise de `app/controllers/briefings_controller.ts:enviarParaFila`

#### Código Atual Observado (linhas 449 a 536):
```typescript
  /**
   * RF008, RF009, RN002 — Valida score e trava se score < mínimo antes de enviar para a fila
   */
  async enviarParaFila({ params, response, session }: HttpContext) {
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('ambientesDetalhados')
      .preload('projeto')
      .first()

    if (!briefing) {
      session.flash('erro', 'Briefing não encontrado')
      return response.redirect().back()
    }

    if (briefing.status !== StatusBriefing.RASCUNHO && briefing.status !== StatusBriefing.DEVOLVIDO) {
      session.flash('erro', `Briefing já se encontra no status "${briefing.status}".`)
      return response.redirect().back()
    }

    // Calcula o score definitivo para validar RN002
    const scoreResult = calcularScoreBriefing({ ... })

    // RN002: Bloqueio estrito se score < 70
    if (!scoreResult.aprovado) {
      const msg = `Score insuficiente (${scoreResult.score}/${scoreResult.scoreMinimo} pts). Critérios faltantes: ${scoreResult.pontosFaltantes.join(', ')}`
      session.flash('erro', msg)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      briefing.useTransaction(trx)
      briefing.status = StatusBriefing.ENVIADO
      briefing.score = String(scoreResult.score)
      briefing.scoreDetalhes = scoreResult.detalhes
      briefing.enviadoEm = DateTime.now()
      await briefing.save()

      // Cria ou atualiza entrada na fila de projetos
      const filaExistente = await FilaProjeto.query({ client: trx })
        .where('projeto_id', briefing.projetoId)
        .first()

      if (!filaExistente) {
        await FilaProjeto.create(
          {
            projetoId: briefing.projetoId,
            status: StatusFila.AGUARDANDO,
            prioridade: 5,
            dataEntradaFila: DateTime.now(),
          },
          { client: trx }
        )
      } else {
        filaExistente.status = StatusFila.AGUARDANDO
        filaExistente.dataEntradaFila = DateTime.now()
        await filaExistente.save()
      }

      // Atualiza status do projeto para NA_FILA
      if (briefing.projeto) {
        briefing.projeto.useTransaction(trx)
        briefing.projeto.status = StatusProjeto.NA_FILA
        briefing.projeto.statusAlteradoEm = DateTime.now()
        await briefing.projeto.save()
      }
    })

    session.flash(
      'sucesso',
      `Briefing aprovado com Score ${scoreResult.score} pts! O projeto avançou para a Fila de Projetos.`
    )
    return response.redirect().toRoute('briefings.index')
  }
```

#### Deficiências Identificadas:
1. **Omissão Completa do Registro de Auditoria RN017:**
   - Embora `briefing.projeto.status` mude para `StatusProjeto.NA_FILA`, **nenhuma chamada** a `HistoricoStatusProjeto.create` é realizada.
   - Enquanto `BriefingsController.store` grava a entrada inicial (`statusDe: null, statusPara: EM_BRIEFING`), `enviarParaFila` não grava a transição `statusDe: EM_BRIEFING, statusPara: NA_FILA`.
2. **Quebra de Rastreabilidade e Métricas de SLA:**
   - Na Sala de Controle do Projeto (`ProjetosController.show`), a aba "Histórico" carrega `historicoStatus`. Sem esse registro, a transição crucial da esteira comercial para a fila de projetos desaparece da timeline.
   - O cálculo do tempo de permanência na fase de briefing versus fila torna-se impossível.
3. **Ausência de Usuário Autenticado na Assinatura do Método:**
   - A assinatura atual é `async enviarParaFila({ params, response, session }: HttpContext)`.
   - Falta desestruturar `auth` para obter `auth.user!.id` e preencher `alteradoPorId` no histórico.

---

## 4. Proposta de Solução Arquitetural

### 4.1 Proposta para `app/controllers/clientes_controller.ts`

#### Imports Necessários:
```typescript
import db from '@adonisjs/lucid/services/db'
import Projeto from '#models/projeto'
```

#### Método `converterLead` Reformulado:
```typescript
  /**
   * Converte um lead qualificado do CRM em cliente (R2 e R5)
   */
  async converterLead({ params, request, response, session }: HttpContext) {
    const lead = await Lead.find(params.leadId)
    if (!lead) {
      session.flash('error', 'Lead não encontrado')
      return response.redirect().back()
    }

    // R5 / RN001: Bloqueio estrito de avanço/conversão de lead não qualificado
    if (!lead.qualificado) {
      const msg = 'RN001 — Bloqueio de Funil: O lead precisa ser qualificado antes de ser convertido em Cliente.'
      const isInertia = request.header('x-inertia') === 'true'
      const accept = request.header('accept') || ''
      const wantsJson = !isInertia && (accept.includes('application/json') || request.qs().format === 'json')

      if (wantsJson) {
        return response.status(400).json({ message: msg, code: 'RN001_LEAD_NAO_QUALIFICADO' })
      }
      session.flash('error', msg)
      return response.redirect().back()
    }

    const payload = await request.validateUsing(createClienteValidator)
    const { endereco, ...dadosCliente } = payload

    let cliente: Cliente

    await db.transaction(async (trx) => {
      // Cria a entidade Cliente na tabela clientes
      cliente = await Cliente.create(
        {
          ...dadosCliente,
          arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId,
        },
        { client: trx }
      )

      // Registra endereço se fornecido
      if (endereco && endereco.logradouro) {
        await EnderecoCliente.create(
          {
            clienteId: cliente.id,
            ...endereco,
            isPrincipal: true,
          },
          { client: trx }
        )
      }

      // Atualiza o Lead no funil
      lead.useTransaction(trx)
      lead.convertidoEmCliente = true
      lead.clienteId = cliente.id
      lead.statusFunil = 'fechado'
      await lead.save()

      // R2: Atualiza todos os projetos associados ao lead definindo cliente_id = cliente.id
      await Projeto.query({ client: trx })
        .where('lead_id', lead.id)
        .update({ cliente_id: cliente.id })
    })

    session.flash('success', `Lead ${lead.nome} convertido com sucesso em Cliente!`)
    return response.redirect().toRoute('clientes.show', { id: cliente!.id })
  }
```

---

### 4.2 Proposta para `app/controllers/briefings_controller.ts`

#### Imports Adicionais Necessários:
```typescript
import Cliente from '#models/cliente'
import Lead from '#models/lead'
```

#### Método Auxiliar ou Lógica em `store`:
```typescript
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

    let projeto: Projeto | null = null

    if (projetoId) {
      projeto = await Projeto.find(projetoId)
      if (!projeto) {
        session.flash('erro', 'Projeto não encontrado')
        return response.redirect().back()
      }

      // R2: Se o projeto pré-existente não possuir cliente_id, assegura integridade relacional
      if (!projeto.clienteId) {
        let cliente = await Cliente.query()
          .whereILike('nome', projeto.clienteNome.trim())
          .where('isActive', true)
          .first()

        if (!cliente) {
          cliente = await Cliente.create({
            nome: projeto.clienteNome.trim(),
            telefone: '(00) 00000-0000',
            tipo: 'pessoa_fisica',
            cadastroAprovado: false,
            isActive: true,
          })
        }
        projeto.clienteId = cliente.id
        await projeto.save()
      }
    } else if (clienteNome && clienteNome.trim()) {
      // R5 / RN001: Se leadId fornecido, validar qualificação
      let lead: Lead | null = null
      if (leadId) {
        lead = await Lead.find(leadId)
        if (lead && !lead.qualificado) {
          const msg = 'RN001 — Bloqueio de Funil: O lead precisa ser qualificado antes de criar projeto ou briefing.'
          const isInertia = request.header('x-inertia') === 'true'
          const accept = request.header('accept') || ''
          const wantsJson = !isInertia && (accept.includes('application/json') || request.qs().format === 'json')

          if (wantsJson) {
            return response.status(400).json({ message: msg, code: 'RN001_LEAD_NAO_QUALIFICADO' })
          }
          session.flash('erro', msg)
          return response.redirect().back()
        }
      }

      // R2: Resolução ou criação da entidade Cliente na tabela clientes
      let cliente: Cliente | null = null

      if (lead?.clienteId) {
        cliente = await Cliente.find(lead.clienteId)
      }

      if (!cliente) {
        cliente = await Cliente.query()
          .whereILike('nome', clienteNome.trim())
          .where('isActive', true)
          .first()
      }

      if (!cliente) {
        cliente = await Cliente.create({
          nome: clienteNome.trim(),
          telefone: lead?.telefone || '(00) 00000-0000',
          email: lead?.email || null,
          tipo: 'pessoa_fisica',
          arquitetoId: lead?.arquitetoId || null,
          cadastroAprovado: false,
          isActive: true,
        })
      }

      // Se o lead existe e ainda não apontava para o cliente, vincula
      if (lead && !lead.clienteId) {
        lead.clienteId = cliente.id
        await lead.save()
      }

      // Gera código sequencial PRJ-YYYY-XXX
      const year = new Date().getFullYear()
      const prefix = `PRJ-${year}-`
      const projetosAno = await Projeto.query().whereILike('codigo', `${prefix}%`).select('codigo')

      let maxSeq = 0
      for (const p of projetosAno) {
        const match = p.codigo.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxSeq) maxSeq = num
        }
      }

      let nextSeq = Math.max(maxSeq + 1, 1)
      let codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`

      while (await Projeto.query().where('codigo', codigo).first()) {
        nextSeq++
        codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`
      }

      // R2: Instanciação do Projeto populando clienteId
      projeto = await Projeto.create({
        codigo,
        clienteNome: clienteNome.trim(),
        clienteId: cliente.id,
        leadId: leadId ? Number(leadId) : null,
        arquitetoId: lead?.arquitetoId || cliente.arquitetoId || null,
        vendedorId: user.id,
        status: StatusProjeto.EM_BRIEFING,
        arquivado: false,
        alertaParado: false,
        statusAlteradoEm: DateTime.now(),
      })

      // RN017: Registro inicial de histórico imutável
      await HistoricoStatusProjeto.create({
        projetoId: projeto.id,
        statusDe: null,
        statusPara: StatusProjeto.EM_BRIEFING,
        alteradoPorId: user.id,
        observacao: 'Criação do projeto e abertura de briefing técnico',
      })
    } else {
      session.flash('erro', 'Informe o projeto ou o nome do cliente.')
      return response.redirect().back()
    }

    // Criação do briefing rascunho vinculado
    let briefing = await Briefing.query().where('projeto_id', projeto.id).first()
    if (!briefing) {
      briefing = await Briefing.create({
        projetoId: projeto.id,
        status: StatusBriefing.RASCUNHO,
        score: '0',
        scoreMinimo: '70',
        ambientes: [],
        referenciasUrl: [],
      })
    }

    session.flash('sucesso', 'Briefing iniciado com sucesso!')
    return response.redirect().toRoute('briefings.edit', { id: briefing.id })
  }
```

#### Método `enviarParaFila` com Auditoria Imutável R3 (RN017):
```typescript
  /**
   * RF008, RF009, RN002, RN017 — Valida score (>= 70), avança para a Fila e registra auditoria imutável (R3)
   */
  async enviarParaFila({ params, response, session, auth }: HttpContext) {
    const user = auth.user!
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('ambientesDetalhados')
      .preload('projeto')
      .first()

    if (!briefing) {
      session.flash('erro', 'Briefing não encontrado')
      return response.redirect().back()
    }

    if (briefing.status !== StatusBriefing.RASCUNHO && briefing.status !== StatusBriefing.DEVOLVIDO) {
      session.flash('erro', `Briefing já se encontra no status "${briefing.status}".`)
      return response.redirect().back()
    }

    // Calcula o score definitivo para validar RN002
    const scoreResult = calcularScoreBriefing({
      cidadeObra: briefing.cidadeObra,
      ambientes: briefing.ambientes,
      prazoDesejado: briefing.prazoDesejado,
      faixaInvestimentoMin: briefing.faixaInvestimentoMin,
      faixaInvestimentoMax: briefing.faixaInvestimentoMax,
      ambientesDetalhados: briefing.ambientesDetalhados.map((a) => ({
        tipo: a.tipo,
        descricao: a.descricao,
        medidasPreliminares: a.medidasPreliminares,
        observacoesEspecificas: a.observacoesEspecificas,
      })),
      referenciasUrl: briefing.referenciasUrl,
      estiloPreferido: briefing.estiloPreferido,
      arquitetoNome: briefing.arquitetoNome,
      observacoes: briefing.observacoes,
      scoreMinimo: Number(briefing.scoreMinimo || 70),
    })

    // RN002: Bloqueio estrito se score < 70
    if (!scoreResult.aprovado) {
      const msg = `Score insuficiente (${scoreResult.score}/${scoreResult.scoreMinimo} pts). Critérios faltantes: ${scoreResult.pontosFaltantes.join(', ')}`
      session.flash('erro', msg)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      briefing.useTransaction(trx)
      briefing.status = StatusBriefing.ENVIADO
      briefing.score = String(scoreResult.score)
      briefing.scoreDetalhes = scoreResult.detalhes
      briefing.enviadoEm = DateTime.now()
      await briefing.save()

      // Cria ou atualiza entrada na fila de projetos
      const filaExistente = await FilaProjeto.query({ client: trx })
        .where('projeto_id', briefing.projetoId)
        .first()

      if (!filaExistente) {
        await FilaProjeto.create(
          {
            projetoId: briefing.projetoId,
            status: StatusFila.AGUARDANDO,
            prioridade: 5,
            dataEntradaFila: DateTime.now(),
          },
          { client: trx }
        )
      } else {
        filaExistente.status = StatusFila.AGUARDANDO
        filaExistente.dataEntradaFila = DateTime.now()
        await filaExistente.save()
      }

      // Atualiza status do projeto para NA_FILA
      if (briefing.projeto) {
        const statusAnterior = briefing.projeto.status || StatusProjeto.EM_BRIEFING

        briefing.projeto.useTransaction(trx)
        briefing.projeto.status = StatusProjeto.NA_FILA
        briefing.projeto.statusAlteradoEm = DateTime.now()
        await briefing.projeto.save()

        // R3: Registro obrigatório de transição imutável em HistoricoStatusProjeto (RN017)
        await HistoricoStatusProjeto.create(
          {
            projetoId: briefing.projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.NA_FILA,
            alteradoPorId: user.id,
            observacao: `Briefing técnico aprovado com score ${scoreResult.score} pts (mínimo ${scoreResult.scoreMinimo} pts) e enviado para a Fila de Projetos (RN002 / RN017).`,
          },
          { client: trx }
        )
      }
    })

    session.flash(
      'sucesso',
      `Briefing aprovado com Score ${scoreResult.score} pts! O projeto avançou para a Fila de Projetos.`
    )
    return response.redirect().toRoute('briefings.index')
  }
```

---

## 5. Plano de Ação Estruturado (pt-br)

Este plano de ação foi desenhado para ser executado pelos agentes implementadores:

| Etapa | Arquivo Alvo | Ação a Realizar | Justificativa Técnica |
| :--- | :--- | :--- | :--- |
| **1.1** | `app/controllers/clientes_controller.ts` | Importar `db` e `Projeto`. | Viabilizar operações transacionais e consultas no modelo de Projetos. |
| **1.2** | `app/controllers/clientes_controller.ts` | No método `converterLead`: envolver criação em `db.transaction`, validar `lead.qualificado` (RN001/R5), e executar `await Projeto.query({ client: trx }).where('lead_id', lead.id).update({ cliente_id: cliente.id })`. | Garante que projetos do lead herdem o `cliente_id` e apareçam na tela `/clientes/:id`. |
| **2.1** | `app/controllers/briefings_controller.ts` | Importar `Cliente` e `Lead`. | Permitir resolução relacional de entidades a partir de nomes e leads. |
| **2.2** | `app/controllers/briefings_controller.ts` | No método `store`: resolver ou criar registro na tabela `clientes` antes de chamar `Projeto.create`, atribuindo `clienteId: cliente.id`. Validar `lead.qualificado` caso `leadId` seja passado. | Elimina projetos com `cliente_id = null` originados de briefings e modais. |
| **3.1** | `app/controllers/briefings_controller.ts` | No método `enviarParaFila`: adicionar `auth` nos argumentos de `HttpContext`, obter `user.id`. | Permite atribuir `alteradoPorId` no histórico. |
| **3.2** | `app/controllers/briefings_controller.ts` | Dentro da transação de `enviarParaFila`: invocar `HistoricoStatusProjeto.create` com `statusDe: statusAnterior`, `statusPara: StatusProjeto.NA_FILA`, `alteradoPorId: user.id`, e justificativa descritiva. | Cumprimento estrito da RN017 e restauração de SLAs e rastreabilidade da esteira. |
| **4.1** | Scripts de Teste | Adicionar teste em `scripts/test_http_briefings.js` ou novo script para validar que `historico_status_projeto` contém o registro de `na_fila` após envio. | Verificação automatizada de conformidade. |
| **4.2** | Scripts de Teste | Adicionar teste em `scripts/test_http_clientes.js` para converter lead com projeto e validar se o projeto aparece em `GET /clientes/:id`. | Verificação automatizada de integridade relacional. |
| **5.1** | Compilação & Build | Executar `npm run typecheck` e `npm run build`. | Validação de 0 erros de tipagem TypeScript e empacotamento Vite. |

---

## 6. Métodos de Verificação Independente

Para validar a integridade após a aplicação das alterações propostas:

1. **Inspeção Estática de Tipagem TypeScript:**
   - Comando: `npm run typecheck`
   - Critério de sucesso: 0 erros de tipagem no servidor AdonisJS e na pasta `inertia/`.

2. **Verificação de Banco de Dados via Consulta SQL direta:**
   - Ao converter lead via `POST /clientes/converter-lead/:leadId`:
     ```sql
     SELECT id, codigo, cliente_id, lead_id FROM projetos WHERE lead_id = <leadId>;
     ```
     O campo `cliente_id` deve ser igual ao `id` retornado na tabela `clientes`.
   - Ao enviar briefing para fila via `POST /briefings/:id/enviar-para-fila`:
     ```sql
     SELECT h.id, h.projeto_id, h.status_de, h.status_para, h.alterado_por_id, h.observacao, h.created_at
     FROM historico_status_projeto h
     WHERE h.projeto_id = <projetoId>
     ORDER BY h.created_at DESC;
     ```
     Deve constar um registro recente com `status_de = 'em_briefing'` e `status_para = 'na_fila'`.

3. **Verificação Funcional na Interface (Inertia):**
   - Na página `/clientes/:id` do cliente convertido: a tabela "Projetos Vinculados" e os cards de "Resumo de Compras" devem exibir os projetos vinculados ao lead anterior.
   - Na página `/projetos/:id`: a timeline na aba de histórico deve conter o evento de envio para a Fila de Projetos com autor e observação descritiva.
