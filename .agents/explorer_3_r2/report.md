# Relatório Técnico de Investigação: Requisitos R4 e R5 (Explorer 3 - R2)

**Data**: 2026-09-11  
**Autor**: Explorer 3 (R2) — Codebase Explorer  
**Alvos Investigados**:
- **R4**: Concorrência e atomicidade em maquetes/versões 3D (`projetos_controller.ts:submeterVersao3D`, `projeto_comercial.ts`, migration `create_projetos_comerciais_table.ts`)
- **R5**: Bloqueio estrito de avanço de leads não qualificados conforme RN001 (`briefings_controller.ts:store`, `clientes_controller.ts:converterLead`, `lead.ts`)

---

## Sumário Executivo

A investigação confirmou vulnerabilidades reais e lacunas de guardrails nos pontos apontados pelos requisitos R4 e R5:
1. **R4 (Concorrência em Versões 3D)**: Em `projetos_controller.ts:submeterVersao3D`, a leitura da versão atual é realizada em memória **fora da transação** e sem qualquer bloqueio pessimista (`FOR UPDATE`). Concorrentemente, duas requisições simultâneas calculam o mesmo número de versão (`ultimaVersao + 1`). Ademais, a tabela `projetos_comerciais` não possui constraint de unicidade composta (`UNIQUE(projeto_id, versao)`), permitindo duplicação silenciosa de versões no PostgreSQL. Observa-se também que, no domínio da aplicação, a entidade que representa as versões 3D é o modelo `ProjetoComercial` (`app/models/projeto_comercial.ts`), e não `versao_3d.ts`.
2. **R5 (Validação RN001)**: Nem `briefings_controller.ts:store` (ao abrir briefing/projeto a partir de lead) nem `clientes_controller.ts:converterLead` (ao converter lead em cliente) verificavam o atributo booleano `qualificado` da entidade `Lead`. Ambas as operações permitiam que leads em estado não qualificado (`qualificado === false`) pulassem etapas cruciais do funil comercial, violando a regra inegociável RN001.

---

## 1. Requisito R4: Blindagem Contra Concorrência em Versões 3D

### 1.1 Mapeamento e Descoberta de Nomenclatura
- **Menção no Despacho/SRS**: "model `versao_3d.ts` e constraints".
- **Realidade no Código-Fonte**: Não existe arquivo `versao_3d.ts` no diretório `app/models/`. A maquete/versão 3D é representada pela classe `ProjetoComercial` (`app/models/projeto_comercial.ts`), que mapeia para a tabela `projetos_comerciais` criada na migration `database/migrations/1789065365479_create_projetos_comerciais_table.ts`.
- O modelo `Projeto` (`app/models/projeto.ts`, linha 139) declara a relação:
  ```typescript
  @hasMany(() => ProjetoComercial, { foreignKey: 'projetoId' })
  declare versoesComerciais: HasMany<typeof ProjetoComercial>
  ```
- No frontend (`inertia/pages/projetos/show.tsx`) e nas rotas (`start/routes.ts`, linha 134), a funcionalidade é exposta como `versoes-3d` e o método do controller é `submeterVersao3D`.

### 1.2 Diagnóstico da Vulnerabilidade de Concorrência
No arquivo `app/controllers/projetos_controller.ts` (linhas 490 a 552):
```typescript
490: async submeterVersao3D({ params, request, response, session, auth }: HttpContext) {
491:   const user = auth.user!
492:   const payload = await request.validateUsing(submeterVersao3DValidator)
493: 
494:   const projeto = await Projeto.query()
495:     .where('id', params.id)
496:     .preload('versoesComerciais', (q) => q.orderBy('versao', 'desc'))
497:     .first()
...
508:   const ultimaVersao = projeto.versoesComerciais[0]?.versao || 0
509:   const proximaVersao = ultimaVersao + 1
510: 
511:   let novaVersao: ProjetoComercial
512:   await db.transaction(async (trx) => {
513:     novaVersao = await ProjetoComercial.create({
514:       projetoId: projeto.id,
515:       versao: proximaVersao,
...
```

**Mecanismo de Falha Sob Concorrência**:
1. **Leitura Não Isolada**: A consulta `Projeto.query().where('id', params.id)...` roda fora de `db.transaction`.
2. **Ausência de Lock**: Não há `FOR UPDATE` sobre o registro do `Projeto` nem sobre a tabela `projetos_comerciais`.
3. **Cálculo Desincronizado**: Se a Requisição A e a Requisição B executarem as linhas 494–509 simultaneamente (ex.: duplo clique rápido do projetista ou submissão simultânea de arquivos):
   - Ambas leem `ultimaVersao = 1`.
   - Ambas calculam `proximaVersao = 2`.
   - Ambas abrem transações isoladas subsequentes e inserem registros com `versao = 2`.
4. **Ausência de Constraint no Banco**:
   No arquivo `database/migrations/1789065365479_create_projetos_comerciais_table.ts`:
   ```typescript
   54: table.index(['projeto_id'])
   55: table.index(['status'])
   56: table.index(['versao'])
   ```
   Há apenas índices simples não exclusivos. O banco de dados aceita ambas as inserções com `versao = 2`, corrompendo a sequência cronológica de aprovação/revisão (RF018/RN004).
5. **Inconsistência de Estado do Projeto**: As duas requisições tentarão atualizar o status do projeto e gravar em `HistoricoStatusProjeto` concorrentemente, gerando registros de auditoria duplicados ou com `statusDe` defasado.

### 1.3 Solução Arquitetural Recomendada
1. **Bloqueio Pessimista (`FOR UPDATE`) no Projeto**:
   Dentro da transação `db.transaction`, executar:
   ```typescript
   const projeto = await Projeto.query({ client: trx })
     .where('id', params.id)
     .forUpdate()
     .firstOrFail()
   ```
   Como o método nativo `.forUpdate()` é suportado pelo Lucid Query Builder (conforme verificado em `node_modules/@adonisjs/lucid/build/src/database/query_builder/chainable.d.ts:638`), o PostgreSQL bloqueia a linha de `projetos` com lock exclusivo até o `COMMIT` ou `ROLLBACK`. A segunda requisição aguardará a conclusão da primeira.
2. **Cálculo Atômico `COALESCE(MAX(versao), 0) + 1`**:
   Após adquirir o lock exclusivo do projeto, executar o cálculo da versão diretamente no banco:
   ```typescript
   const maxResult = await trx
     .from('projetos_comerciais')
     .where('projeto_id', projeto.id)
     .max('versao as max_versao')
     .first()

   const ultimaVersao = Number(maxResult?.max_versao) || 0
   const proximaVersao = ultimaVersao + 1
   ```
3. **Criação e Atualizações Atômicas**: Criar a `novaVersao`, alterar `projeto.status = StatusProjeto.AGUARD_VALIDACAO` e registrar `HistoricoStatusProjeto` estritamente com `{ client: trx }`.
4. **Constraint no Banco (Defesa em Profundidade)**:
   Criar migration adicionando `table.unique(['projeto_id', 'versao'])` para assegurar que, a nível físico de banco, nunca ocorram duplicidades.

### 1.4 Proposta de Código: `submeterVersao3D`
**Arquivo**: `app/controllers/projetos_controller.ts`  
**Linhas alvo**: 490 a 565

#### Snippet Antes:
```typescript
  async submeterVersao3D({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(submeterVersao3DValidator)

    const projeto = await Projeto.query()
      .where('id', params.id)
      .preload('versoesComerciais', (q) => q.orderBy('versao', 'desc'))
      .first()

    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    if (projeto.arquivado) {
      return response.badRequest({ message: 'Projeto arquivado não aceita novas versões 3D' })
    }

    // Calcula próximo número de versão
    const ultimaVersao = projeto.versoesComerciais[0]?.versao || 0
    const proximaVersao = ultimaVersao + 1

    let novaVersao: ProjetoComercial
    await db.transaction(async (trx) => {
      novaVersao = await ProjetoComercial.create(
        {
          projetoId: projeto.id,
          versao: proximaVersao,
          arquivoUrl: payload.arquivoUrl || null,
          descricaoAlteracao: payload.descricaoAlteracao || `Versão ${proximaVersao} desenvolvida pelo projetista`,
          renderUrls: payload.renderUrls || null,
          status: StatusProjetoComercial.AGUARD_VALIDACAO_VENDEDOR,
          submetidoParaValidacaoEm: DateTime.now(),
          criadoPorId: user.id,
        },
        { client: trx }
      )
      // ...
    })
```

#### Snippet Proposto:
```typescript
  async submeterVersao3D({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(submeterVersao3DValidator)

    // Pré-validação de existência e estado fora da transação para respostas rápidas
    const projetoExistente = await Projeto.query().where('id', params.id).first()
    if (!projetoExistente) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }
    if (projetoExistente.arquivado) {
      return response.badRequest({ message: 'Projeto arquivado não aceita novas versões 3D' })
    }

    let novaVersao: ProjetoComercial
    let proximaVersao: number

    await db.transaction(async (trx) => {
      // 1. Bloqueio pessimista FOR UPDATE no projeto para serializar chamadas concorrentes
      const projeto = await Projeto.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()

      // 2. Consulta autoritativa do maior número de versão já registrado no banco
      const maxResult = await trx
        .from('projetos_comerciais')
        .where('projeto_id', projeto.id)
        .max('versao as max_versao')
        .first()

      const ultimaVersao = Number(maxResult?.max_versao) || 0
      proximaVersao = ultimaVersao + 1

      // 3. Persistência da nova versão comercial
      novaVersao = await ProjetoComercial.create(
        {
          projetoId: projeto.id,
          versao: proximaVersao,
          arquivoUrl: payload.arquivoUrl || null,
          descricaoAlteracao: payload.descricaoAlteracao || `Versão ${proximaVersao} desenvolvida pelo projetista`,
          renderUrls: payload.renderUrls || null,
          status: StatusProjetoComercial.AGUARD_VALIDACAO_VENDEDOR,
          submetidoParaValidacaoEm: DateTime.now(),
          criadoPorId: user.id,
        },
        { client: trx }
      )

      // 4. Se o projeto estiver em_projeto ou em_ajuste, transiciona para aguard_validacao
      if (
        projeto.status === StatusProjeto.EM_PROJETO ||
        projeto.status === StatusProjeto.EM_AJUSTE
      ) {
        const statusAnterior = projeto.status
        projeto.useTransaction(trx)
        projeto.status = StatusProjeto.AGUARD_VALIDACAO
        projeto.statusAlteradoEm = DateTime.now()
        projeto.alertaParado = false
        await projeto.save()

        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.AGUARD_VALIDACAO,
            alteradoPorId: user.id,
            observacao: `Versão 3D (v${proximaVersao}) submetida para validação do vendedor.`,
          },
          { client: trx }
        )
      }
    })

    if (this.wantsJson(request)) {
      return response.created({
        message: `Versão 3D (v${proximaVersao!}) submetida para aprovação comercial`,
        versao: novaVersao!,
      })
    }

    session.flash(
      'success',
      `Versão 3D (v${proximaVersao!}) submetida com sucesso para validação do vendedor.`
    )
    return response.redirect().back()
  }
```

---

## 2. Requisito R5: Validação Estrita do Funil de Qualificação (RN001)

### 2.1 Modelo `Lead` e Regra Inegociável RN001
- No arquivo `app/models/lead.ts` e `database/schema.ts` (linha 641), o modelo possui:
  ```typescript
  @column()
  declare qualificado: boolean
  ```
- Na migration `database/migrations/1761885935169_create_leads_table.ts` (linha 29):
  `table.boolean('qualificado').notNullable().defaultTo(false)`.
- Todo lead entra no sistema como `qualificado = false`.
- **Regra RN001**: O lead não pode avançar para etapas de planejamento operacional, orçamentação ou fechamento contratual sem que a qualificação seja explicitamente realizada pelo vendedor (`leads_controller.ts:qualificar`).

### 2.2 Diagnóstico em `briefings_controller.ts:store`
No arquivo `app/controllers/briefings_controller.ts` (linhas 276 a 334):
```typescript
276: async store({ request, response, session, auth }: HttpContext) {
277:   const user = auth.user!
278:   const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])
279: 
280:   let projeto: Projeto | null = null
281: 
282:   if (projetoId) {
283:     projeto = await Projeto.find(projetoId)
...
288:   } else if (clienteNome && clienteNome.trim()) {
...
311:     projeto = await Projeto.create({
312:       codigo,
313:       clienteNome: clienteNome.trim(),
314:       leadId: leadId ? Number(leadId) : null,
...
```

**Problema Observado**:
1. Se `leadId` for enviado na requisição de criação de projeto/briefing, o controller associava o lead diretamente a `Projeto.create` sem consultar se `lead.qualificado === true`.
2. Se `projetoId` for enviado para iniciar briefing de um projeto pré-existente cujo `projeto.leadId` aponte para um lead não qualificado, o briefing era criado sem impedimento.
3. Não havia retorno HTTP 400 com código e mensagem informativa explicando o bloqueio da RN001.

### 2.3 Diagnóstico em `clientes_controller.ts:converterLead`
No arquivo `app/controllers/clientes_controller.ts` (linhas 294 a 326):
```typescript
294: async converterLead({ params, request, response, session }: HttpContext) {
295:   const lead = await Lead.find(params.leadId)
296:   if (!lead) {
297:     session.flash('error', 'Lead não encontrado')
298:     return response.redirect().back()
299:   }
300: 
301:   const payload = await request.validateUsing(createClienteValidator)
302: 
303:   const { endereco, ...dadosCliente } = payload
...
```

**Problema Observado**:
O método busca o `lead` por ID, mas **não valida** se `lead.qualificado === true`. Qualquer lead, inclusive recém-criado em `novo_lead` com `qualificado: false`, podia ser convertido em cliente comercial ativo na carteira, contornando toda a esteira de qualificação.

### 2.4 Padrão de Resposta HTTP 400 e Suporte a JSON/Inertia
Para cumprir rigorosamente o critério de aceitação ("rejeitar com erro HTTP 400 com mensagem informativa da RN001"), os endpoints devem:
1. Retornar `response.badRequest({ message: '...', code: 'RN001_LEAD_NAO_QUALIFICADO' })`.
2. Também popular `session.flash('erro', '...')` (ou `'error'`) caso o cliente seja navegador tradicional ou requisição Inertia.
3. No caso de `briefings_controller.ts`, incluir o método auxiliar padronizado:
   ```typescript
   private wantsJson(request: HttpContext['request']): boolean {
     const accept = request.header('accept') || ''
     return accept.includes('application/json') || request.url().endsWith('.json')
   }
   ```

### 2.5 Proposta de Código para `briefings_controller.ts:store`
**Arquivo**: `app/controllers/briefings_controller.ts`  
**Linhas alvo**: 276 a 334

#### Snippet Proposto:
```typescript
  /**
   * Cria briefing para um projeto existente ou cria novo projeto com briefing
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

    // RN001: Validação prévia de qualificação se leadId for informado
    if (leadId) {
      const lead = await Lead.find(leadId)
      if (!lead) {
        if (this.wantsJson(request)) {
          return response.notFound({ message: 'Lead informado não foi encontrado.' })
        }
        session.flash('erro', 'Lead informado não foi encontrado.')
        return response.redirect().back()
      }

      if (lead.qualificado === false) {
        const msg = 'RN001 — Bloqueio de Qualificação: Lead não pode avançar no funil sem qualificação registrada.'
        session.flash('erro', msg)
        return response.badRequest({
          message: msg,
          code: 'RN001_LEAD_NAO_QUALIFICADO',
        })
      }
    }

    let projeto: Projeto | null = null

    if (projetoId) {
      projeto = await Projeto.find(projetoId)
      if (!projeto) {
        if (this.wantsJson(request)) {
          return response.notFound({ message: 'Projeto não encontrado' })
        }
        session.flash('erro', 'Projeto não encontrado')
        return response.redirect().back()
      }

      // RN001: Validação de qualificação caso o projeto já existente esteja vinculado a um lead
      if (projeto.leadId) {
        const leadProjeto = await Lead.find(projeto.leadId)
        if (leadProjeto && leadProjeto.qualificado === false) {
          const msg = 'RN001 — Bloqueio de Qualificação: O lead vinculado a este projeto não possui qualificação registrada.'
          session.flash('erro', msg)
          return response.badRequest({
            message: msg,
            code: 'RN001_LEAD_NAO_QUALIFICADO',
          })
        }
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

      // Registro imutável de histórico inicial (RN017)
      await HistoricoStatusProjeto.create({
        projetoId: projeto.id,
        statusDe: null,
        statusPara: StatusProjeto.EM_BRIEFING,
        alteradoPorId: user.id,
        observacao: 'Criação do projeto e abertura de briefing',
      })
    } else {
      if (this.wantsJson(request)) {
        return response.badRequest({ message: 'Informe o projeto ou o nome do cliente.' })
      }
      session.flash('erro', 'Informe o projeto ou o nome do cliente.')
      return response.redirect().back()
    }

    // Verifica se já existe briefing
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

    if (this.wantsJson(request)) {
      return response.created({
        message: 'Briefing iniciado com sucesso!',
        briefing,
        projeto,
      })
    }

    session.flash('sucesso', 'Briefing iniciado com sucesso!')
    return response.redirect().toRoute('briefings.edit', { id: briefing.id })
  }
```

### 2.6 Proposta de Código para `clientes_controller.ts:converterLead`
**Arquivo**: `app/controllers/clientes_controller.ts`  
**Linhas alvo**: 294 a 326

#### Snippet Proposto:
```typescript
  /**
   * Converte um lead qualificado do CRM em cliente
   */
  async converterLead({ params, request, response, session }: HttpContext) {
    const lead = await Lead.find(params.leadId)
    if (!lead) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Lead não encontrado' })
      }
      session.flash('error', 'Lead não encontrado')
      return response.redirect().back()
    }

    // =========================================================================
    // RN001 — Guardrail Inegociável: Bloqueia conversão se o lead não estiver qualificado
    // =========================================================================
    if (lead.qualificado === false) {
      const msg = 'RN001 — Bloqueio de Qualificação: Lead não pode ser convertido em cliente sem qualificação prévia registrada no CRM.'
      session.flash('error', msg)
      return response.badRequest({
        message: msg,
        code: 'RN001_LEAD_NAO_QUALIFICADO',
      })
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
    lead.statusFunil = StatusFunil.FECHADO
    await lead.save()

    // (Nota: A sincronização de projetos.cliente_id associados ao lead será integrada no Requisito R2)

    if (this.wantsJson(request)) {
      return response.created({
        message: `Lead ${lead.nome} convertido com sucesso em Cliente!`,
        cliente,
      })
    }

    session.flash('success', `Lead ${lead.nome} convertido com sucesso em Cliente!`)
    return response.redirect().toRoute('clientes.show', { id: cliente.id })
  }
```

---

## 3. Plano de Ação para Implementação (PT-BR)

Este plano deve ser seguido pelo agente implementador (Builder):

### Fase 1: Implementação da Blindagem Contra Concorrência em Versões 3D (R4)
1. **Editar `app/controllers/projetos_controller.ts`**:
   - Localizar o método `submeterVersao3D` (linha ~490).
   - Manter a verificação preliminar rápida de existência e estado arquivado.
   - Envolver a obtenção do projeto em `db.transaction(async (trx) => { ... })`.
   - Adicionar o bloqueio pessimista: `Projeto.query({ client: trx }).where('id', params.id).forUpdate().firstOrFail()`.
   - Substituir a leitura em memória de `ultimaVersao` pela query atômica no PostgreSQL: `trx.from('projetos_comerciais').where('projeto_id', projeto.id).max('versao as max_versao').first()`.
   - Incrementar `proximaVersao = Number(maxResult?.max_versao || 0) + 1`.
   - Criar `ProjetoComercial` com `{ client: trx }`.
   - Atualizar status do projeto e registrar `HistoricoStatusProjeto` atomicamente dentro da transação `{ client: trx }`.

2. **Criar Migration de Constraint de Unicidade (Opcional, porém Altamente Recomendado)**:
   - Gerar migration para adicionar `table.unique(['projeto_id', 'versao'])` na tabela `projetos_comerciais` garantindo proteção a nível de engine do PostgreSQL.

### Fase 2: Implementação dos Guardrails da RN001 (R5)
1. **Editar `app/controllers/briefings_controller.ts`**:
   - Adicionar helper `private wantsJson(request: HttpContext['request']): boolean` na classe.
   - No método `store` (linha ~276), verificar se `leadId` foi recebido. Em caso positivo, carregar `Lead.find(leadId)`. Se `lead.qualificado === false`, interromper com `return response.badRequest({ message: '...', code: 'RN001_LEAD_NAO_QUALIFICADO' })`.
   - Se `projetoId` for recebido, verificar se `projeto.leadId` existe e se esse lead possui `qualificado === false`. Caso afirmativo, rejeitar com o mesmo erro HTTP 400.
   - Adicionar suporte a resposta JSON (`response.created`) ou redirecionamento Inertia.

2. **Editar `app/controllers/clientes_controller.ts`**:
   - No método `converterLead` (linha ~294), após buscar `const lead = await Lead.find(params.leadId)`, adicionar a checagem:
     ```typescript
     if (lead.qualificado === false) {
       return response.badRequest({
         message: 'RN001 — Bloqueio de Qualificação: Lead não pode ser convertido em cliente sem qualificação prévia registrada no CRM.',
         code: 'RN001_LEAD_NAO_QUALIFICADO',
       })
     }
     ```
   - Assegurar que `Lead` e `StatusFunil` estejam devidamente importados.

### Fase 3: Validação, Tipagem e Testes
1. Executar `npm run typecheck` para garantir que não há erros de tipagem no TypeScript.
2. Executar `npm run build` para certificar a compilação limpa do Vite e dos assets.
3. Escrever e rodar scripts de teste de integração HTTP para:
   - Validar bloqueio HTTP 400 com código `RN001_LEAD_NAO_QUALIFICADO` ao tentar criar briefing a partir de lead não qualificado.
   - Validar bloqueio HTTP 400 ao tentar converter lead não qualificado em cliente via `/clientes/converter-lead/:leadId`.
   - Validar submissão concorrente de versões 3D simulando chamadas paralelas e verificando se os números de versão são estritamente sequenciais (ex.: v1, v2, v3 sem colisões).

---

## 4. Matriz de Impacto e Integração

| Componente | Requisito Relacionado | Impacto / Compatibilidade |
|---|---|---|
| `briefings_controller.ts:store` | R1 (Arquitetos), R2 (Clientes), R5 (RN001) | R1 e R2 também alteram `store` para sincronizar `arquiteto_id` e `cliente_id`. A validação RN001 deve ficar no topo do método para falhar cedo (*fail fast*), antes de qualquer criação de projeto ou cliente. |
| `clientes_controller.ts:converterLead` | R2 (Clientes) e R5 (RN001) | R2 atualiza `projetos.cliente_id` ao converter o lead. A checagem da RN001 de R5 protege contra a conversão indevida, devendo ser executada antes da criação do cliente e do update de projetos. |
| `projetos_controller.ts:submeterVersao3D` | R4 (Concorrência 3D) | O método é isolado e afeta apenas a esteira de render e maquete. Não há conflito com os outros requisitos, e a serialização via `forUpdate` no projeto harmoniza com `HistoricoStatusProjeto` (RN017). |

---

## 5. Conclusão da Investigação
As causas-raiz foram mapeadas e as soluções propostas utilizam as capacidades nativas do AdonisJS v7 e Lucid ORM sem necessidade de novas dependências externas. A implementação é direta e blinda o ecossistema Plannit contra inconsistências de concorrência e quebras da regra de negócio RN001.
