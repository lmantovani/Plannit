# Relatório de Análise Técnica: Backend, Modelos de Dados e RBAC da Agenda (Requisito R2)

**Autor**: Explorer 2 (Teamwork Explorer)  
**Data**: 2026-10-08  
**Contexto**: Monólito Plannit (AdonisJS v7 + Lucid ORM + VineJS + Inertia.js React 19)  
**Documento de Origem**: `ORIGINAL_REQUEST.md` (R1-R4) e `AGENTS.md`  

---

## 1. Mapeamento dos Modelos Existentes

### 1.1. Model `User` (`app/models/user.ts`)
- **Tabela**: `users` (estende `UserSchema` via `database/schema.ts`).
- **Enum `PerfilUsuario`**: Possui 15 perfis mapeados:
  - Gestão: `DIRETORIA = 'diretoria'`, `GERENTE_COMERCIAL = 'gerente_comercial'`.
  - Operacional Vendas/Projeto: `VENDEDOR = 'vendedor'`, `PROJETISTA = 'projetista'`.
  - Apoio/Técnico: `CONFERENTE = 'conferente'`, `SUPERVISOR_MONTAGEM = 'supervisor_montagem'`, `GESTOR_LOGISTICA = 'gestor_logistica'`, `RECEPCAO = 'recepcao'`, `SAC = 'sac'`, `FINANCEIRO = 'financeiro'`, `RH = 'rh'`.
  - Produção/Montagem: `MONTADOR_PROPRIO = 'montador_proprio'`, `MONTADOR_TERCEIRO = 'montador_terceiro'`.
  - Externos: `ARQUITETO = 'arquiteto'`, `CLIENTE = 'cliente'`.
- **Agrupamentos de Perfis**:
  - `PERFIS_GESTAO = [PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL]`.
  - `PERFIS_INTERNOS`: Todos os colaboradores internos (13 perfis).
  - `PERFIS_EXTERNOS = [PerfilUsuario.ARQUITETO, PerfilUsuario.CLIENTE]`.
- **RBAC no Model**:
  - `user.hasRole(roles)`: Avalia se o usuário tem a permissão. Retorna `true` incondicionalmente se `user.isSuperuser === true` ou `user.perfil === PerfilUsuario.DIRETORIA`. Caso contrário, verifica se `user.perfil` está contido na lista fornecida.
  - `user.isGestor`: Getter booleano que chama `this.hasRole(PERFIS_GESTAO)`.
  - `user.isInterno`: Getter booleano que chama `this.hasRole(PERFIS_INTERNOS)`.
- **Relevância para a Agenda**: O campo `responsavel_id` de um compromisso deve obrigatoriamente referenciar um usuário ativo com perfil interno. Gestores têm visibilidade global e capacidade de filtrar por qualquer colaborador; vendedores e projetistas são estritamente limitados aos registros em que `responsavel_id === user.id`.

### 1.2. Model `Lead` (`app/models/lead.ts`)
- **Tabela**: `leads` (estende `LeadSchema`).
- **Campos-chave**:
  - `id`: Chave primária.
  - `nome`, `telefone`, `email`: Contato primário.
  - `statusFunil`: Enum `StatusFunil` (`novo_lead`, `qualificando`, `em_visita`, `em_briefing`, `em_projeto`, `em_fechamento`, `fechado`, `perdido`, `desqualificado`).
  - `vendedorId`: Chave estrangeira para `users.id` (vendedor responsável).
  - `qualificado`: Booleano (RN001).
  - `ultimaInteracaoEm`: Timestamp com time zone que rastreia o último contato ativo.
  - `statusAlteradoEm`: Timestamp com time zone da última mudança de funil.
- **Getters Computados**:
  - `diasSemInteracao`: Diferença em dias entre `DateTime.now()` e `ultimaInteracaoEm || createdAt`.
  - `precisaAtencao`: Retorna `true` se o lead não estiver finalizado (`fechado`/`perdido`/`desqualificado`) e `diasSemInteracao >= 3`.
- **Relações Atuais**:
  - `@belongsTo(() => User, { foreignKey: 'vendedorId' }) declare vendedor: BelongsTo<typeof User>`.
  - `@hasMany(() => InteracaoLead, { foreignKey: 'leadId' }) declare interacoes: HasMany<typeof InteracaoLead>`.
  - `@hasMany(() => HistoricoStatusLead, { foreignKey: 'leadId' }) declare historicoStatus: HasMany<typeof HistoricoStatusLead>`.
  - `@belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' }) declare arquiteto: BelongsTo<typeof Arquiteto>`.

### 1.3. Model `Cliente` (`app/models/cliente.ts`)
- **Tabela**: `clientes` (estende `ClienteSchema`).
- **Campos-chave**: `id`, `nome`, `cpfCnpj`, `telefone`, `email`, `tipo` (`pessoa_fisica` | `pessoa_juridica`), `arquitetoId`, `cadastroAprovado`.
- **Relações Atuais**:
  - `@hasMany(() => Projeto, { foreignKey: 'clienteId' }) declare projetos: HasMany<typeof Projeto>`.
  - `@hasMany(() => EnderecoCliente, { foreignKey: 'clienteId' }) declare enderecos: HasMany<typeof EnderecoCliente>`.

### 1.4. Model `Projeto` (`app/models/projeto.ts`)
- **Tabela**: `projetos` (estende `ProjetoSchema`).
- **Campos-chave**: `id`, `codigo` (ex.: `PRJ-2026-001`), `clienteNome`, `clienteId`, `vendedorId`, `projetistaId`, `conferenteId`, `leadId`, `status` (`StatusProjeto` — 32 etapas), `statusAlteradoEm`, `alertaParado` (RN016), `arquivado`.
- **Relações**: Vinculado a `vendedor`, `projetista`, `conferente`, `lead`, `cliente`, `briefing`, `fechamento`, `handoff`, `historicoStatus`.

### 1.5. Model `HistoricoStatusLead` (`app/models/historico_status_lead.ts`)
- **Tabela**: `historico_status_leads` (estende `HistoricoStatusLeadSchema`).
- **Campos**: `id`, `leadId`, `alteradoPorId`, `statusDe`, `statusPara`, `tempoPermanenciaSegundos`, `observacao`, `createdAt`.
- **Padrão**: Registro imutável (append-only) para auditoria e cálculo de SLA das etapas do funil de vendas.

### 1.6. Model `InteracaoLead` (`app/models/interacao_lead.ts`)
- **Tabela**: `interacoes_lead` (estende `InteracoesLeadSchema`).
- **Campos**:
  - `id`: Chave primária.
  - `leadId`: FK para `leads.id` (`onDelete: CASCADE`).
  - `responsavelId`: FK para `users.id` (`onDelete: CASCADE`).
  - `tipo`: String (50) — `whatsapp` | `ligacao` | `email` | `visita` | `reuniao`.
  - `resumo`: Text com a descrição detalhada da interação.
  - `createdAt`: Timestamp com time zone.
- **Relações**: `belongsTo(() => Lead)`, `belongsTo(() => User, { foreignKey: 'responsavelId' })`.

---

## 2. Isolamento por Perfil (RBAC) nos Controllers Existentes

O monólito Plannit implementa um controle de acesso baseado em escopo (Scoped RBAC) direto nas queries dos controllers, sem expor endpoints REST genéricos.

### 2.1. Padrão em `leads_controller.ts`
```typescript
// Isolamento por perfil na listagem do CRM (linhas 60-65)
if (user.perfil === PerfilUsuario.VENDEDOR) {
  leadsQuery.where('vendedor_id', user.id)
} else if (vendedorFilter) {
  leadsQuery.where('vendedor_id', vendedorFilter)
}
```
- **Visibilidade**: Vendedores só enxergam leads onde `vendedor_id === user.id`. Gestores (`user.isGestor` ou `user.isSuperuser`) visualizam todos os leads ativos e recebem a lista completa de vendedores para filtragem.
- **Criação (`store`)**: Caso um vendedor cadastre um lead, `vendedorId` é automaticamente forçado para `user.id`.

### 2.2. Padrão em `projetos_controller.ts`
```typescript
// Isolamento por perfil na listagem de Projetos (linhas 51-55)
if (user.perfil === PerfilUsuario.VENDEDOR) {
  projetosQuery.where('vendedor_id', user.id)
} else if (user.perfil === PerfilUsuario.PROJETISTA) {
  projetosQuery.where('projetista_id', user.id)
}
```
- **Visibilidade**: Vendedor vê apenas seus projetos (`vendedor_id = user.id`); Projetista vê apenas os seus (`projetista_id = user.id`); Gestão vê todos os projetos da loja.

### 2.3. Padrão em `arquitetos_controller.ts`
- **Helper Privado**:
  ```typescript
  private isGestor(user: User): boolean {
    if (user.isSuperuser) return true
    const perfil = String(user.perfil || '').toLowerCase()
    return ['diretoria', 'gerente_comercial', 'admin'].includes(perfil)
  }
  ```
- **Permissão de Ações Críticas**: A reatribuição de carteira (`PATCH /especificadores/:id/dono`) e definição de metas de terceiros são restritas a gestores. O vendedor comum só altera sua própria meta.

### 2.4. Matriz de Autorização para o Módulo de Agenda

| Ação | Vendedor | Projetista | Diretoria / Gerente Comercial |
|---|---|---|---|
| **Listar Compromissos (`index`)** | Apenas onde `responsavel_id = user.id` | Apenas onde `responsavel_id = user.id` | Todos os compromissos; alterna "Minha Agenda" vs "Toda a Equipe"; filtro por colaborador |
| **Criar Compromisso (`store`)** | `responsavel_id` fixo em `user.id` | `responsavel_id` fixo em `user.id` | Pode atribuir a qualquer colaborador interno ativo |
| **Editar/Atualizar (`update`)** | Apenas seus compromissos | Apenas seus compromissos | Qualquer compromisso |
| **Reagendar (`reagendar`)** | Apenas seus compromissos | Apenas seus compromissos | Qualquer compromisso |
| **Cancelar (`cancelar`)** | Apenas seus compromissos | Apenas seus compromissos | Qualquer compromisso |
| **Concluir (`concluir`)** | Apenas seus compromissos | Apenas seus compromissos | Qualquer compromisso |

---

## 3. Linha do Tempo e Histórico do Lead

### 3.1. Estrutura e Composição no Frontend
No arquivo `inertia/pages/crm/index.tsx` (linhas 755-768), a timeline do `LeadDrawer` é uma fusão cronológica de dois fluxos:
```typescript
const eventosTimeline = [
  ...(lead.interacoes || []).map((i) => ({
    id: `int_${i.id}`,
    type: 'interacao' as const,
    date: new Date(i.createdAt || 0),
    dataInt: i,
  })),
  ...(lead.historicoStatus || []).map((h) => ({
    id: `hist_${h.id}`,
    type: 'historico_status' as const,
    date: new Date(h.createdAt || 0),
    dataHist: h,
  })),
].sort((a, b) => b.date.getTime() - a.date.getTime())
```
- Cada item de `interacoes_lead` renderiza um ícone baseado no `tipo` (`whatsapp`, `ligacao`, `email`, `visita`, `reuniao`), o autor, o horário e o texto do resumo.
- Cada item de `historico_status_leads` renderiza a mudança de status, tempo de permanência e observações.

### 3.2. Disparo Automático na Conclusão do Compromisso (R2 + R4)
Quando um compromisso vinculado a um lead (`lead_id != null`) é concluído via `PATCH /agenda/compromissos/:id/concluir`:
1. O backend grava o status como `concluido` e persiste o `desfecho`.
2. Dentro da mesma transação de banco de dados (`db.transaction`), cria automaticamente um registro em `interacoes_lead`:
   - `lead_id`: `compromisso.leadId`.
   - `responsavel_id`: `user.id` (autor da conclusão).
   - `tipo`: Mapeado a partir do tipo de compromisso (ex.: se o tipo for visita/medição/obra -> `'visita'`; caso contrário -> `'reuniao'`).
   - `resumo`: `Compromisso Concluído: [${tipoNome}] "${compromisso.titulo}" — Desfecho: ${payload.desfecho}`.
3. Atualiza o campo `lead.ultima_interacao_em = DateTime.now()` no model `Lead`.
4. Opcionalmente, se o payload de conclusão incluir um `novoStatusFunil` (ex.: avanço de "Em Visita" para "Em Briefing"), o backend também executa `registrarHistoricoStatus(lead, statusAnterior, novoStatus, user)`.

---

## 4. Padrões de Engenharia do Monólito

### 4.1. Transações Lucid (`db.transaction`)
Para operações que tocam múltiplas tabelas (ex.: salvar compromisso + registrar desfecho + criar interação na timeline + atualizar lead), o padrão obrigatório do Plannit é:
```typescript
await db.transaction(async (trx) => {
  compromisso.useTransaction(trx)
  compromisso.status = StatusCompromisso.CONCLUIDO
  compromisso.desfecho = payload.desfecho
  await compromisso.save()

  if (compromisso.leadId) {
    await InteracaoLead.create(
      {
        leadId: compromisso.leadId,
        responsavelId: user.id,
        tipo: tipoInteracao,
        resumo: `Compromisso Concluído: "${compromisso.titulo}". Desfecho: ${payload.desfecho}`,
      },
      { client: trx }
    )

    const lead = await Lead.find(compromisso.leadId, { client: trx })
    if (lead) {
      lead.useTransaction(trx)
      lead.ultimaInteracaoEm = DateTime.now()
      await lead.save()
    }
  }
})
```

### 4.2. Formatação de Datas com Luxon UTC
- Conforme `AGENTS.md`, o fuso horário padrão do servidor é `UTC` (`TZ=UTC` no `.env`).
- Criação e carimbos: `DateTime.now()` ou `DateTime.now().toUTC()`.
- Parsing de strings do formulário/API: `DateTime.fromISO(payload.dataHoraInicio).toUTC()`.
- Serialização para Inertia/JSON: `.toISO()` para timestamps com hora (ex.: `2026-10-08T14:30:00.000Z`) e `.toISODate()` para campos exclusivamente de data.

### 4.3. Dualidade Inertia / JSON e `wantsJson()`
O monólito não possui uma API REST separada; a mesma rota atende requisições de página via Inertia e chamadas assíncronas JSON.
- Helper obrigatório no controller:
  ```typescript
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }
  ```
- **Tratamento de Flash Messages**:
  - `session.flash('success', ...)` e `session.flash('error', ...)` são os **únicos** canais repassados pelo middleware do Inertia (`inertia_middleware.ts`).
  - **Atenção**: Conforme item documentado em "Bugs conhecidos" do `AGENTS.md`, nunca utilizar `'erro'` nem `'info'`, pois são descartados sem aviso.
  - Para requisições Inertia: `return response.redirect().back()`.
  - Para requisições JSON: `return response.json(...)` ou `return response.status(201).json(...)`.

### 4.4. Validação VineJS (`app/validators/`)
- Os validadores utilizam `vine.create({ ... })`.
- Regras personalizadas com `vine.createRule` para checar strings ISO de data/hora válidas.
- A regra `exists` verifica chaves estrangeiras garantindo que o registro exista e esteja ativo:
  ```typescript
  tipoId: vine.number().positive().exists({
    table: 'tipos_compromisso_catalogo',
    column: 'id',
    filter: (db) => db.where('is_active', true),
  })
  ```
- Provedor de mensagens amigáveis em português via `new SimpleMessagesProvider({ ... })`.

### 4.5. Convenções de Rotas (`start/routes.ts`)
- Todas as rotas de Agenda devem residir no bloco autenticado `router.group(() => { ... }).use(middleware.auth())`.
- Os controllers são referenciados via `#generated/controllers` (`controllers.Agenda`).
- Rotas fixas antes de rotas com `:id` (ex.: `/agenda` antes de `/agenda/compromissos/:id`).
- Nomeação com `.as('agenda.index')`, `.as('agenda.compromissos.store')`, etc.

---

## 5. Arquitetura Detalhada Recomendada para o Requisito R2

### 5.1. Migration: `database/migrations/xxxx_create_compromissos_agenda_table.ts`

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'compromissos_agenda'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('titulo', 200).notNullable()
      table
        .integer('tipo_id')
        .unsigned()
        .references('id')
        .inTable('tipos_compromisso_catalogo')
        .onDelete('RESTRICT')
        .notNullable()

      table.timestamp('data_hora_inicio', { useTz: true }).notNullable()
      table.timestamp('data_hora_fim', { useTz: true }).notNullable()
      table.string('local', 255).nullable()
      table.string('status', 50).notNullable().defaultTo('agendado')
      table.text('observacoes').nullable()
      table.text('desfecho').nullable()

      table
        .integer('responsavel_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('criado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('cliente_id')
        .unsigned()
        .references('id')
        .inTable('clientes')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      // Índices de performance para busca em calendário e filtros operacionais
      table.index(['responsavel_id', 'data_hora_inicio'])
      table.index(['status', 'data_hora_inicio'])
      table.index(['tipo_id'])
      table.index(['lead_id'])
      table.index(['cliente_id'])
      table.index(['projeto_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 5.2. Model: `app/models/compromisso_agenda.ts`

```typescript
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Lead from '#models/lead'
import Cliente from '#models/cliente'
import Projeto from '#models/projeto'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'

export enum StatusCompromisso {
  AGENDADO = 'agendado',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
  REAGENDADO = 'reagendado',
}

export const STATUS_COMPROMISSO_LABELS: Record<StatusCompromisso, string> = {
  [StatusCompromisso.AGENDADO]: 'Agendado',
  [StatusCompromisso.CONCLUIDO]: 'Concluído',
  [StatusCompromisso.CANCELADO]: 'Cancelado',
  [StatusCompromisso.REAGENDADO]: 'Reagendado',
}

export default class CompromissoAgenda extends BaseModel {
  static table = 'compromissos_agenda'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare titulo: string

  @column()
  declare tipoId: number

  @column.dateTime()
  declare dataHoraInicio: DateTime

  @column.dateTime()
  declare dataHoraFim: DateTime

  @column()
  declare local: string | null

  @column()
  declare status: StatusCompromisso

  @column()
  declare observacoes: string | null

  @column()
  declare desfecho: string | null

  @column()
  declare responsavelId: number

  @column()
  declare criadoPorId: number

  @column()
  declare leadId: number | null

  @column()
  declare clienteId: number | null

  @column()
  declare projetoId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @belongsTo(() => TipoCompromissoCatalogo, { foreignKey: 'tipoId' })
  declare tipo: BelongsTo<typeof TipoCompromissoCatalogo>

  @belongsTo(() => User, { foreignKey: 'responsavelId' })
  declare responsavel: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'criadoPorId' })
  declare criadoPor: BelongsTo<typeof User>

  @belongsTo(() => Lead, { foreignKey: 'leadId' })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => Cliente, { foreignKey: 'clienteId' })
  declare cliente: BelongsTo<typeof Cliente>

  @belongsTo(() => Projeto, { foreignKey: 'projetoId' })
  declare projeto: BelongsTo<typeof Projeto>

  // Getters computados
  get isAtrasado(): boolean {
    if (this.status !== StatusCompromisso.AGENDADO) return false
    return this.dataHoraFim < DateTime.now()
  }

  get isHoje(): boolean {
    return this.dataHoraInicio.hasSame(DateTime.now(), 'day')
  }

  get statusLabel(): string {
    return STATUS_COMPROMISSO_LABELS[this.status] || this.status
  }
}
```

### 5.3. Relações Reversas nos Models Existentes
- **Em `app/models/lead.ts`**:
  ```typescript
  @hasMany(() => CompromissoAgenda, { foreignKey: 'leadId' })
  declare compromissos: HasMany<typeof CompromissoAgenda>
  ```
- **Em `app/models/user.ts`**:
  ```typescript
  @hasMany(() => CompromissoAgenda, { foreignKey: 'responsavelId' })
  declare compromissos: HasMany<typeof CompromissoAgenda>
  ```
- **Em `app/models/cliente.ts`**:
  ```typescript
  @hasMany(() => CompromissoAgenda, { foreignKey: 'clienteId' })
  declare compromissos: HasMany<typeof CompromissoAgenda>
  ```
- **Em `app/models/projeto.ts`**:
  ```typescript
  @hasMany(() => CompromissoAgenda, { foreignKey: 'projetoId' })
  declare compromissos: HasMany<typeof CompromissoAgenda>
  ```

### 5.4. Validador VineJS: `app/validators/compromisso_agenda.ts`

```typescript
import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

const isoDateTimeRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (value === null || value === undefined || value === '') return
  if (typeof value !== 'string') {
    field.report('Data e hora devem ser uma string no formato ISO-8601', 'isoDateTime', field)
    return
  }
  const dt = DateTime.fromISO(value)
  if (!dt.isValid) {
    field.report('Data e hora informadas são inválidas', 'isoDateTime', field)
  }
})

export const createCompromissoValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(200),
  tipoId: vine
    .number()
    .positive()
    .exists({
      table: 'tipos_compromisso_catalogo',
      column: 'id',
      filter: (db) => db.where('is_active', true),
    }),
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()),
  local: vine.string().trim().maxLength(255).nullable().optional(),
  observacoes: vine.string().trim().maxLength(2000).nullable().optional(),
  responsavelId: vine
    .number()
    .positive()
    .exists({
      table: 'users',
      column: 'id',
      filter: (db) => db.where('is_active', true),
    })
    .optional(),
  leadId: vine
    .number()
    .positive()
    .exists({
      table: 'leads',
      column: 'id',
    })
    .nullable()
    .optional(),
  clienteId: vine
    .number()
    .positive()
    .exists({
      table: 'clientes',
      column: 'id',
    })
    .nullable()
    .optional(),
  projetoId: vine
    .number()
    .positive()
    .exists({
      table: 'projetos',
      column: 'id',
    })
    .nullable()
    .optional(),
})

createCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'titulo.required': 'Informe o título do compromisso.',
  'titulo.minLength': 'O título deve ter no mínimo 2 caracteres.',
  'tipoId.required': 'Selecione o tipo de compromisso.',
  'tipoId.database.exists': 'Tipo de compromisso não encontrado ou inativo.',
  'dataHoraInicio.required': 'Informe a data e horário de início.',
  'dataHoraFim.required': 'Informe a data e horário de término.',
  'responsavelId.database.exists': 'Colaborador responsável não encontrado ou inativo.',
  'leadId.database.exists': 'Lead informado não encontrado.',
  'clienteId.database.exists': 'Cliente informado não encontrado.',
  'projetoId.database.exists': 'Projeto informado não encontrado.',
})

export const updateCompromissoValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(200).optional(),
  tipoId: vine
    .number()
    .positive()
    .exists({
      table: 'tipos_compromisso_catalogo',
      column: 'id',
      filter: (db) => db.where('is_active', true),
    })
    .optional(),
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()).optional(),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()).optional(),
  local: vine.string().trim().maxLength(255).nullable().optional(),
  observacoes: vine.string().trim().maxLength(2000).nullable().optional(),
  responsavelId: vine
    .number()
    .positive()
    .exists({
      table: 'users',
      column: 'id',
      filter: (db) => db.where('is_active', true),
    })
    .optional(),
  leadId: vine
    .number()
    .positive()
    .exists({ table: 'leads', column: 'id' })
    .nullable()
    .optional(),
  clienteId: vine
    .number()
    .positive()
    .exists({ table: 'clientes', column: 'id' })
    .nullable()
    .optional(),
  projetoId: vine
    .number()
    .positive()
    .exists({ table: 'projetos', column: 'id' })
    .nullable()
    .optional(),
})

export const reagendarCompromissoValidator = vine.create({
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()),
  observacoes: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const cancelarCompromissoValidator = vine.create({
  motivo: vine.string().trim().minLength(3).maxLength(1000).optional(),
})

export const concluirCompromissoValidator = vine.create({
  desfecho: vine.string().trim().minLength(3).maxLength(2000),
})

concluirCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'desfecho.required': 'Informe o desfecho do compromisso para concluí-lo.',
  'desfecho.minLength': 'O desfecho deve ter pelo menos 3 caracteres.',
})
```

### 5.5. Controller: `app/controllers/agenda_controller.ts`

Estrutura detalhada de métodos:

1. **`wantsJson(request)` e `isGestor(user)`**: Helpers privados padrão.
2. **`index({ request, inertia, auth, response }: HttpContext)`**:
   - Extrai parâmetros de busca: `q`, `visao` ('minha' | 'equipe'), `responsavelId`, `tipoId`, `status`, `dataInicio`, `dataFim`.
   - **Isolamento RBAC**:
     - Se `!user.isGestor`: filtra estritamente `query.where('responsavel_id', user.id)`. Ignora qualquer tentativa do vendedor de filtrar outro colaborador.
     - Se `user.isGestor`: se `visao === 'minha'`, filtra `responsavel_id = user.id`. Se `visao === 'equipe'` e `responsavelId` informado, filtra por esse colaborador. Se `visao === 'equipe'` sem filtro, retorna todos.
   - Filtros de data: `data_hora_inicio >= dataInicio` e `data_hora_fim <= dataFim` (ou intervalo da semana/mês).
   - Preloads: `tipo`, `responsavel`, `criadoPor`, `lead`, `cliente`, `projeto`.
   - Carrega `colaboradores` (apenas para gestores) e `tiposCompromisso` ativos para os filtros.
   - Formata dados para Inertia ou responde JSON se `wantsJson()`.
3. **`store({ request, response, auth, session }: HttpContext)`**:
   - Valida com `createCompromissoValidator`.
   - RBAC: se `!user.isGestor`, força `responsavelId = user.id`. Se for gestor, usa `payload.responsavelId || user.id`.
   - Valida coerência temporal: `dataHoraFim >= dataHoraInicio`. Se inválido, lança erro `A data/hora de término deve ser posterior ao início`.
   - Cria o compromisso com `status: StatusCompromisso.AGENDADO` e `criadoPorId: user.id`.
   - Se vinculado a `leadId`: atualiza `lead.ultimaInteracaoEm = DateTime.now()`.
   - Retorna redirect com flash `'success'` ou JSON 201.
4. **`update({ params, request, response, auth, session }: HttpContext)`**:
   - Busca `CompromissoAgenda.findOrFail(params.id)`.
   - RBAC: se `!user.isGestor && compromisso.responsavelId !== user.id`, recusa com 403 Forbidden.
   - Bloqueia alteração se compromisso já estiver `concluido` ou `cancelado`.
   - Valida e atualiza campos.
5. **`reagendar({ params, request, response, auth, session }: HttpContext)`**:
   - Busca compromisso e valida RBAC.
   - Valida `reagendarCompromissoValidator`.
   - Verifica coerência temporal das novas datas.
   - Atualiza `dataHoraInicio`, `dataHoraFim`, ajusta status para `reagendado` (ou atualiza as datas e grava observação de reagendamento).
   - Flash success + redirect back (ou JSON 200).
6. **`cancelar({ params, request, response, auth, session }: HttpContext)`**:
   - Busca compromisso e valida RBAC.
   - Valida `cancelarCompromissoValidator`.
   - Atualiza `status = StatusCompromisso.CANCELADO` e armazena motivo nas observações/desfecho.
   - Flash success + redirect back (ou JSON 200).
7. **`concluir({ params, request, response, auth, session }: HttpContext)`**:
   - Busca compromisso e valida RBAC.
   - Valida `concluirCompromissoValidator` (`desfecho` obrigatório).
   - Executa transação Lucid `db.transaction(async (trx) => { ... })`:
     - `compromisso.useTransaction(trx)`.
     - `compromisso.status = StatusCompromisso.CONCLUIDO`.
     - `compromisso.desfecho = payload.desfecho`.
     - Salva compromisso.
     - Se `compromisso.leadId`:
       - Carrega o lead na transação.
       - Cria `InteracaoLead` com resumo informativo.
       - Atualiza `lead.ultimaInteracaoEm = DateTime.now()`.
       - Salva o lead na transação.
   - Flash success: `"Compromisso concluído com sucesso e registrado na linha do tempo do lead!"`.

### 5.6. Registro das Rotas em `start/routes.ts`

Dentro do grupo existente protegido por `middleware.auth()`:

```typescript
// ==========================================
// MÓDULO DE AGENDA (REQUISITO R2)
// ==========================================
router.get('agenda', [controllers.Agenda, 'index']).as('agenda.index')
router.post('agenda/compromissos', [controllers.Agenda, 'store']).as('agenda.compromissos.store')
router.put('agenda/compromissos/:id', [controllers.Agenda, 'update']).as('agenda.compromissos.update')
router.patch('agenda/compromissos/:id', [controllers.Agenda, 'update']).as('agenda.compromissos.patch')
router.patch('agenda/compromissos/:id/reagendar', [controllers.Agenda, 'reagendar']).as('agenda.compromissos.reagendar')
router.patch('agenda/compromissos/:id/cancelar', [controllers.Agenda, 'cancelar']).as('agenda.compromissos.cancelar')
router.patch('agenda/compromissos/:id/concluir', [controllers.Agenda, 'concluir']).as('agenda.compromissos.concluir')
```

---

## 6. Integração Operacional com o Kanban de Leads (R4)

Para atender ao Requisito R4 (exibição do badge do próximo compromisso em cada `LeadCard` e listagem de compromissos no `LeadDrawer`):

1. **Alteração em `app/controllers/leads_controller.ts`**:
   No método `index`, incluir preload dos compromissos agendados:
   ```typescript
   leadsQuery.preload('compromissos', (cQuery) => {
     cQuery
       .where('status', 'agendado')
       .preload('tipo', (tQuery) => tQuery.select('id', 'nome', 'cor', 'slug'))
       .orderBy('dataHoraInicio', 'asc')
   })
   ```
2. **DTO do Lead enviado ao Frontend**:
   Mapear `proximoCompromisso` e a lista `compromissos`:
   ```typescript
   proximoCompromisso: (() => {
     const proximo = lead.compromissos?.[0]
     if (!proximo) return null
     return {
       id: proximo.id,
       titulo: proximo.titulo,
       tipoNome: proximo.tipo?.nome || 'Compromisso',
       tipoCor: proximo.tipo?.cor || null,
       dataHoraInicio: proximo.dataHoraInicio.toISO(),
       dataHoraFim: proximo.dataHoraFim.toISO(),
       local: proximo.local,
       isHoje: proximo.dataHoraInicio.hasSame(DateTime.now(), 'day'),
       isAtrasado: proximo.dataHoraFim < DateTime.now(),
     }
   })(),
   compromissos: (lead.compromissos || []).map((c) => ({
     id: c.id,
     titulo: c.titulo,
     tipoNome: c.tipo?.nome,
     tipoCor: c.tipo?.cor,
     dataHoraInicio: c.dataHoraInicio.toISO(),
     dataHoraFim: c.dataHoraFim.toISO(),
     status: c.status,
     local: c.local,
   }))
   ```
3. Com essa estrutura, o frontend do CRM obtém os dados sem requisições adicionais, viabilizando badges de alerta azul ("Hoje") e vermelho ("Atrasado") diretamente nos cartões Kanban.
