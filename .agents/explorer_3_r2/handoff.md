# Handoff Report — Explorer 3 (R2)

**Data**: 2026-09-11T18:18:00Z  
**De**: Explorer 3 (R2)  
**Para**: orchestrator_r2 (ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)  
**Escopo**: Requisitos R4 (Blindagem Contra Concorrência em Versões 3D) e R5 (Validação Estrita do Funil de Qualificação RN001)

---

## 1. Observation

### R4: Concorrência e Transação em Versões 3D
- **Arquivo**: `/home/porto/codespace/Plannit/plannit/app/controllers/projetos_controller.ts`
  - Linhas 494–509:
    ```typescript
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
    ```
    A busca de `projeto` e a leitura de `ultimaVersao` ocorrem fora da transação de banco de dados e sem cláusula de bloqueio pessimista (`FOR UPDATE`).
  - Linhas 511–551:
    ```typescript
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
    A transação só é aberta após o número da versão já ter sido calculado em memória JavaScript.
- **Entidade e Nomenclatura**:
  - Não existe o arquivo `app/models/versao_3d.ts` no projeto. O modelo responsável pelas maquetes/versões 3D é `ProjetoComercial` (`/home/porto/codespace/Plannit/plannit/app/models/projeto_comercial.ts`), que herda de `ProjetosComerciaiSchema` e referencia a tabela `projetos_comerciais`.
  - O relacionamento no modelo `Projeto` (`app/models/projeto.ts:139`) é:
    ```typescript
    @hasMany(() => ProjetoComercial, { foreignKey: 'projetoId' })
    declare versoesComerciais: HasMany<typeof ProjetoComercial>
    ```
- **Constraints no Banco de Dados**:
  - No arquivo de migration `database/migrations/1789065365479_create_projetos_comerciais_table.ts` (linhas 54–56):
    ```typescript
    table.index(['projeto_id'])
    table.index(['status'])
    table.index(['versao'])
    ```
    Não existe índice único nem constraint `UNIQUE(projeto_id, versao)`.
- **Suporte a Bloqueio no Lucid**:
  - No arquivo `node_modules/@adonisjs/lucid/build/src/database/query_builder/chainable.d.ts:638`:
    ```typescript
    forUpdate(...tableNames: string[]): this;
    ```
    O método `forUpdate()` é nativo do Query Builder do Lucid ORM e pode ser chamado em consultas com transação (`Projeto.query({ client: trx }).where(...).forUpdate().first()`).

### R5: Validação da Qualificação de Leads (RN001)
- **Arquivo**: `/home/porto/codespace/Plannit/plannit/app/controllers/briefings_controller.ts`
  - Linhas 276–321:
    ```typescript
    async store({ request, response, session, auth }: HttpContext) {
      const user = auth.user!
      const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

      let projeto: Projeto | null = null

      if (projetoId) {
        projeto = await Projeto.find(projetoId)
        // ...
      } else if (clienteNome && clienteNome.trim()) {
        // ...
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
    O parâmetro `leadId` é associado diretamente ao novo `Projeto` sem verificar a existência de `Lead` nem se `lead.qualificado === true`. Nenhuma resposta HTTP 400 é retornada quando o lead não está qualificado.
- **Arquivo**: `/home/porto/codespace/Plannit/plannit/app/controllers/clientes_controller.ts`
  - Linhas 294–302:
    ```typescript
    async converterLead({ params, request, response, session }: HttpContext) {
      const lead = await Lead.find(params.leadId)
      if (!lead) {
        session.flash('error', 'Lead não encontrado')
        return response.redirect().back()
      }

      const payload = await request.validateUsing(createClienteValidator)
    ```
    Não existe verificação da propriedade `lead.qualificado`. Um lead com `qualificado === false` é convertido diretamente em cliente e tem seu status alterado para `fechado` no funil.
- **Modelo `Lead`**:
  - Em `database/migrations/1761885935169_create_leads_table.ts` (linha 29): `table.boolean('qualificado').notNullable().defaultTo(false)`.
  - Em `database/schema.ts` (linha 641): `@column() declare qualificado: boolean`.
  - Em `app/models/lead.ts`: classe `Lead extends LeadSchema`.

---

## 2. Logic Chain

1. **R4 (Concorrência em Versões 3D)**:
   - A observação comprova que duas chamadas simultâneas a `submeterVersao3D` para o mesmo `params.id` leem os registros de `projetos_comerciais` antes de qualquer transação ou trava de linha.
   - Logo, ambas as chamadas computam o mesmo `proximaVersao = ultimaVersao + 1`.
   - Como a tabela `projetos_comerciais` não possui constraint única composta em `(projeto_id, versao)`, o PostgreSQL aceita ambas as inserções.
   - Isso resulta em versões duplicadas (ex.: duas versões `v2`) para o mesmo projeto, quebrando o ordenamento das revisões comerciais e gerando concorrência destrutiva no status do projeto.
   - Portanto, para blindar o endpoint contra concorrência, é necessário: (a) abrir `db.transaction`, (b) bloquear a linha do `Projeto` com `.forUpdate()`, (c) consultar `MAX(versao)` atomicamente no banco (`trx.from('projetos_comerciais').where(...).max('versao as max_versao')`), (d) computar a próxima versão e persistir dentro da mesma transação.

2. **R5 (Validação RN001)**:
   - A observação comprova que `briefings_controller.ts:store` aceita `leadId` e cria projetos/briefings vinculados a leads independentemente de seu estado de qualificação.
   - Da mesma forma, `clientes_controller.ts:converterLead` permite converter qualquer lead em cliente, ignorando o campo `qualificado`.
   - Isso contraria diretamente a regra de negócio inegociável RN001 ("Lead não pode avançar no funil sem qualificação registrada").
   - Logo, a validação de `lead.qualificado === false` deve ser inserida como barreira de entrada (*fail fast*) em ambos os controllers, retornando HTTP 400 com código `RN001_LEAD_NAO_QUALIFICADO` e mensagem explicativa.

---

## 3. Caveats

- **Nomenclatura do Modelo**: O briefing de despacho e o requisito mencionam `model versao_3d.ts`. No repositório, o modelo é `ProjetoComercial` (`app/models/projeto_comercial.ts`) e a tabela é `projetos_comerciais`. A rota é `/projetos/:id/versoes-3d` e o validador é `submeterVersao3DValidator`. Nenhuma alteração de nome de arquivo ou classe é recomendada para não quebrar referências no restante do monorepo.
- **Interferência com Outros Requisitos**:
  - `briefings_controller.ts:store` também sofrerá intervenções nos requisitos R1 (especificadores parceiros) e R2 (integridade de clientes). A validação de qualificação (R5) deve ser posicionada antes dessas regras para evitar criação inútil de registros se o lead for inválido.
  - `clientes_controller.ts:converterLead` também será alterado por R2 para sincronizar `projetos.cliente_id`. A checagem da RN001 de R5 deve preceder essa lógica.
- **Modificação de Código**: Nenhuma alteração foi realizada em arquivos de código da aplicação durante esta investigação, em estrita conformidade com o papel de Explorer.

---

## 4. Conclusion

1. **R4**: A vulnerabilidade de condição de corrida em `submeterVersao3D` é eliminada através da transação serializada com `.forUpdate()` no modelo `Projeto` somada à consulta atômica `COALESCE(MAX(versao), 0) + 1` no PostgreSQL. Uma migration opcional com `table.unique(['projeto_id', 'versao'])` provê defesa em profundidade.
2. **R5**: A brecha de avanço indevido no funil da RN001 em `briefings_controller.ts:store` e `clientes_controller.ts:converterLead` é sanada pela checagem imediata de `lead.qualificado === false`, retornando HTTP 400 (`response.badRequest`) com código de erro estruturado e mensagem padronizada.

---

## 5. Verification Method

Para verificar de forma independente e reproduzível:

1. **Tipagem e Build**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   npm run typecheck
   npm run build
   ```
2. **Inspeção de Código e Pontos Críticos**:
   - `plannit/app/controllers/projetos_controller.ts`: linha 490 (`submeterVersao3D`).
   - `plannit/app/controllers/briefings_controller.ts`: linha 276 (`store`).
   - `plannit/app/controllers/clientes_controller.ts`: linha 294 (`converterLead`).
   - `plannit/app/models/projeto_comercial.ts` e `database/migrations/1789065365479_create_projetos_comerciais_table.ts`.
3. **Teste Automatizado de Rejeição RN001**:
   - Criar script que efetue chamada `POST /briefings` com `{ clienteNome: 'Teste', leadId: <id_lead_nao_qualificado> }` e assertar que o retorno seja HTTP 400 com `code === 'RN001_LEAD_NAO_QUALIFICADO'`.
   - Efetuar chamada `POST /clientes/converter-lead/<id_lead_nao_qualificado>` com payload de cliente e assertar retorno HTTP 400 com `code === 'RN001_LEAD_NAO_QUALIFICADO'`.
4. **Teste Automatizado de Concorrência 3D**:
   - Disparar 5 requisições HTTP paralelas via `Promise.all` para `POST /projetos/:id/versoes-3d` com o mesmo `projetoId`.
   - Assertar que o banco de dados resulte em 5 versões sequenciais distintas (ex.: v1, v2, v3, v4, v5) sem nenhuma colisão de versão.
