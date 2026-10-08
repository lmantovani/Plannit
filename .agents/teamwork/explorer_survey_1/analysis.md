# Relatório de Análise Técnica: Subsistema de Configurações e Catálogos (Plannit)

**Resumo Executivo**: O subsistema de Configurações do Plannit implementa uma arquitetura robusta de parametrização dinâmica baseada em tabelas de apoio administráveis exclusivamente por gestores (`DIRETORIA` e `GERENTE_COMERCIAL`), com sincronização cross-tab via eventos de storage e window focus. Este relatório mapeia minuciosamente os padrões arquiteturais vigentes e fornece a especificação completa para o Requisito R1 (Catálogo Parametrizável de Tipos de Compromisso).

---

## 1. Mapeamento do Subsistema Atual: Controller e Frontend

### 1.1 `app/controllers/configuracoes_controller.ts`
- **Função Central**: Ponto único de controle administrativo para tabelas de apoio do CRM (`AmbienteCatalogo`, `OrigemLeadCatalogo`, `CampanhaLead`).
- **Padrão de Resposta Híbrido (`wantsJson`)**:
  ```ts
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = request.header('x-inertia') === 'true'
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.qs().format === 'json'
  }
  ```
  Quando a requisição não é do Inertia e requer JSON, devolve payload JSON puro com códigos HTTP adequados (`201 Created`, `200 OK`, `400 Bad Request`, `403 Forbidden`). Caso contrário, emite `session.flash('success' | 'error', ...)` e redireciona de volta (`response.redirect().back()`).
- **Autorização Interna (`isAuthorized`)**:
  ```ts
  private isAuthorized(user: User): boolean {
    if (user.isSuperuser) return true
    return user.hasRole([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])
  }
  ```
  Complementa a barreira do roteador, rejeitando requisições com status `403` se o usuário não possuir privilégio gestor.
- **Estrutura das Actions**:
  Para cada catálogo gerenciado, são implementadas 4 actions padronizadas:
  1. `store<Entidade>`: valida payload via VineJS, gera slug/trata campos e insere registro.
  2. `update<Entidade>`: busca via `findOrFail(params.id)`, valida alterações e salva.
  3. `toggle<Entidade>`: inverte o booleano `isActive` (`entidade.isActive = !entidade.isActive; await entidade.save()`).
  4. `destroy<Entidade>`: exclui o registro via `await entidade.delete()`.
- **Slugificação Padronizada**:
  Função utilitária interna `slugify(text: string)` normaliza strings removendo diacríticos (acentos), caracteres especiais e substituindo espaços/separadores por underscores `_`.

### 1.2 `inertia/pages/configuracoes/index.tsx`
- **Controle de Abas Reativo via URL**:
  O estado `activeTab` é inicializado lendo o parâmetro de busca da URL (`window.location.search` -> `?tab=ambientes|origens|campanhas`), garantindo que links profundos (como `href="/configuracoes?tab=origens"`) abram imediatamente a aba desejada.
- **Gerenciamento de Modais e Formulários**:
  Utiliza o hook `useForm` do `@inertiajs/react` para isolamento de dados de criação e edição:
  - Criação: `ambienteForm`, `origemForm`, `campanhaForm`.
  - Edição: `editingAmbiente`, `editingOrigem`, `editingCampanha` associados aos respectivos formulários `*EditForm`.
  - Exclusão Segura: estado compartilhado `deleteTarget: { type, id, nome }` que renderiza um modal com aviso de confirmação antes de disparar `router.delete(...)`.
- **Notificação e Design System**:
  - Toasts via `sonner` (`toast.success`, `toast.error`).
  - Cores institucionais Líder (`primary-600` warm-gold, `stone-900`, `stone-50`, `emerald-50/700`, `rose-600`).
  - Botões de status com ícone `Power` de ativação/desativação imediata.

---

## 2. Modelagem dos Catálogos Existentes

| Catálogo | Tabela | Model | Campos Principais | Ordenação Padrão |
| :--- | :--- | :--- | :--- | :--- |
| **Ambientes** | `ambientes_catalogo` | `AmbienteCatalogo` | `id`, `nome`, `categoria`, `is_active`, `ordem`, `created_at`, `updated_at` | `ordem ASC`, `nome ASC` |
| **Origens de Lead** | `origens_lead_catalogo` | `OrigemLeadCatalogo` | `id`, `nome`, `slug` (unique), `is_active`, `created_at`, `updated_at` | `nome ASC` |
| **Campanhas** | `campanhas_lead` | `CampanhaLead` | `id`, `nome`, `data_inicio`, `data_fim`, `is_active`, `created_at`, `updated_at` | `created_at DESC` / `nome ASC` |

### 2.1 Herança de Schema e Models
No Plannit, `database/schema.ts` é gerado automaticamente pelo AdonisJS a partir das migrações do banco. Os models estendem a classe de schema correspondente:
```ts
// Exemplo: app/models/origem_lead_catalogo.ts
import { OrigensLeadCatalogoSchema } from '#database/schema'

export default class OrigemLeadCatalogo extends OrigensLeadCatalogoSchema {
  static table = 'origens_lead_catalogo'
}
```

### 2.2 Migrações e Seed Idempotente
- **Migration**: `1790890814069_create_tabelas_apoio_configuracoes_table.ts`
  - Utiliza `this.defer(async (db) => { ... })` para popular os dados iniciais assim que as tabelas são criadas.
  - Índices explícitos em `is_active`, `ordem` e `slug`.
- **Seeder**: `database/seeders/tabelas_apoio_seeder.ts`
  - Idempotente: confere se a contagem atual é zero antes de executar o `multiInsert`, prevenindo duplicações em múltiplas execuções de `node ace db:seed`.

### 2.3 Rotas em `start/routes.ts`
As rotas de apoio são agrupadas sob dupla proteção de middleware:
```ts
router
  .group(() => {
    router.get('configuracoes', [controllers.Configuracoes, 'index']).as('configuracoes.index')

    // Rotas de Ambientes, Origens e Campanhas...
  })
  .use(middleware.role([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL]))
```
O grupo externo aplica `middleware.auth()`, garantindo que apenas usuários autenticados com cargos de gestão possam acessar os endpoints.

### 2.4 Validações VineJS (`app/validators/configuracao.ts`)
- Regras customizadas via `vine.createRule`:
  - `slugOpcionalRule`: normaliza string nula/vazia para `null` e exige no mínimo 2 caracteres se informada.
  - `isoDateOuNullRule`: valida coerência de formato ISO de data para campanhas.
- Validadores rigorosos para cada entidade (`create*Validator` e `update*Validator`).

---

## 3. Dinâmica Operacional: Abas, Ordem, Ativação e Permissões

1. **Navegação por Abas**:
   - Cada aba conta com um badge numérico exibindo o total de itens (`{ambientes.length}`, etc.).
   - Alternância rápida sem recarregar a página (SPA/React state), com o botão de criação no canto superior direito adaptado à aba ativa.
2. **Reordenação (`ordem`)**:
   - Inteiro não-negativo (`ordem >= 0`), com valores em dezenas (10, 20, 30...) para permitir inserções intermediárias fáceis pelos gestores.
   - A query do banco sempre prioriza `orderBy('ordem', 'asc')`.
3. **Ativação / Desativação (`is_active`)**:
   - Em vez de exclusão física destrutiva, os itens são desativados via rota rápida `PATCH .../toggle`.
   - Ao ser desativado, o registro permanece no banco para preservar histórico de leads/projetos legados, mas deixa de ser listado nos formulários ativos (`where('is_active', true)`).
4. **Permissões de Gestão (Defesa em Duas Camadas)**:
   - **Camada 1 (HTTP/Route)**: `middleware.role([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])`. Bloqueia na entrada com status 403 e flash error se perfil for Vendedor, Projetista, etc.
   - **Camada 2 (Controller)**: `this.isAuthorized(user)` que permite `isSuperuser` e perfis de gestão, bloqueando chamadas diretas ou testes de integração com status 403 JSON.

---

## 4. Sincronização Cross-Tab e Atalho "Configurar ↗"

### 4.1 Mecanismo de Disparo
No frontend de `inertia/pages/configuracoes/index.tsx`, após qualquer mutação bem-sucedida (criação, edição, toggle de status ou exclusão):
```ts
const notifyCatalogoUpdate = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('plannit_catalogo_updated', String(Date.now()))
  }
}
```
A gravação de um timestamp em `localStorage` dispara um evento `StorageEvent` nativo em **todas as outras abas abertas no mesmo navegador e origem**.

### 4.2 Mecanismo de Escuta nos Consumidores
Nos componentes e modais consumidores (ex.: `QualificarLeadModal.tsx`, `crm/index.tsx`, e no futuro `agenda/index.tsx` e modais de agendamento):
```tsx
useEffect(() => {
  const handleSync = () => {
    // Recarrega seletivamente apenas as props do catálogo do Inertia
    router.reload({ only: ['tiposCompromissoCatalogo'] })
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'plannit_catalogo_updated') {
      handleSync()
    }
  }

  window.addEventListener('focus', handleSync)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener('focus', handleSync)
    window.removeEventListener('storage', handleStorage)
  }
}, [])
```
- **Vantagem Crítica**: O recarregamento usa `router.reload({ only: [...] })`, o que preserva o estado do formulário aberto e evita re-renderizações destrutivas de tela.
- **Evento `focus`**: Se o usuário abriu uma nova aba pelo atalho "Configurar ↗", alterou um item e fechou a aba voltando para a anterior, o evento `window.focus` garante a atualização mesmo que o evento `storage` já tenha sido processado.

### 4.3 Atalho "Configurar ↗"
Renderizado condicionalmente ao lado do rótulo do campo caso o usuário seja gestor (`canManageConfig`):
```tsx
{canManageConfig && (
  <a
    href="/configuracoes?tab=tipos_compromisso"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline bg-primary-50/80 px-2 py-0.5 rounded-md border border-primary-200/60"
    title="Configurar tipos de compromisso em nova aba"
  >
    <span>Configurar</span>
    <ExternalLink size={10} />
  </a>
)}
```

---

## 5. Especificações Técnicas Completas para o Requisito R1

### 5.1 Modelagem e Migração (`tipos_compromisso_catalogo`)

#### Arquivo: `database/migrations/<timestamp>_create_tipos_compromisso_catalogo_table.ts`
```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tipos_compromisso_catalogo'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nome', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('cor', 20).notNullable().defaultTo('#3b82f6')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('ordem').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['ordem'])
      table.index(['slug'])
    })

    // Seed com valores padrão essenciais
    this.defer(async (db) => {
      const now = new Date()
      const tiposPadrao = [
        { nome: 'Briefing Técnico', slug: 'briefing_tecnico', cor: '#3b82f6', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita e Medição no Local', slug: 'visita_medicao', cor: '#10b981', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Apresentação de Projeto 3D', slug: 'apresentacao_3d', cor: '#8b5cf6', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita à Obra', slug: 'visita_obra', cor: '#f59e0b', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Reunião de Alinhamento na Loja', slug: 'reuniao_loja', cor: '#c8841a', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Alinhamento com Especificador / Arquiteto', slug: 'alinhamento_especificador', cor: '#06b6d4', ordem: 60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Outro', slug: 'outro', cor: '#6b7280', ordem: 70, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('tipos_compromisso_catalogo').multiInsert(tiposPadrao)
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
```

#### Arquivo: `app/models/tipo_compromisso_catalogo.ts`
```ts
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class TipoCompromissoCatalogo extends BaseModel {
  static table = 'tipos_compromisso_catalogo'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nome: string

  @column()
  declare slug: string

  @column()
  declare cor: string

  @column()
  declare isActive: boolean

  @column()
  declare ordem: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
```
*(Nota: Após rodar `migration:run`, a classe poderá estender `TiposCompromissoCatalogoSchema` gerada em `database/schema.ts`).*

### 5.2 Seeder Idempotente (`database/seeders/tabelas_apoio_seeder.ts`)
Adicionar a verificação idempotente ao seeder existente:
```ts
// 4. Tipos de Compromisso Padrão
const countTipos = await db.from('tipos_compromisso_catalogo').count('* as total')
if (Number(countTipos[0]?.total || 0) === 0) {
  const tiposPadrao = [
    { nome: 'Briefing Técnico', slug: 'briefing_tecnico', cor: '#3b82f6', ordem: 10, is_active: true, created_at: now, updated_at: now },
    { nome: 'Visita e Medição no Local', slug: 'visita_medicao', cor: '#10b981', ordem: 20, is_active: true, created_at: now, updated_at: now },
    { nome: 'Apresentação de Projeto 3D', slug: 'apresentacao_3d', cor: '#8b5cf6', ordem: 30, is_active: true, created_at: now, updated_at: now },
    { nome: 'Visita à Obra', slug: 'visita_obra', cor: '#f59e0b', ordem: 40, is_active: true, created_at: now, updated_at: now },
    { nome: 'Reunião de Alinhamento na Loja', slug: 'reuniao_loja', cor: '#c8841a', ordem: 50, is_active: true, created_at: now, updated_at: now },
    { nome: 'Alinhamento com Especificador / Arquiteto', slug: 'alinhamento_especificador', cor: '#06b6d4', ordem: 60, is_active: true, created_at: now, updated_at: now },
    { nome: 'Outro', slug: 'outro', cor: '#6b7280', ordem: 70, is_active: true, created_at: now, updated_at: now },
  ]
  await db.table('tipos_compromisso_catalogo').multiInsert(tiposPadrao)
}
```

### 5.3 Validações VineJS (`app/validators/configuracao.ts`)
Adicionar os esquemas de validação:
```ts
export const createTipoCompromissoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  cor: vine.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const updateTipoCompromissoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100).optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  cor: vine.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})
```

### 5.4 Actions no `ConfiguracoesController`
Adicionar ao `app/controllers/configuracoes_controller.ts`:
1. **No método `index`**:
   ```ts
   const tiposCompromisso = await TipoCompromissoCatalogo.query()
     .orderBy('ordem', 'asc')
     .orderBy('nome', 'asc')

   // Repassar nas props do render:
   tiposCompromisso: tiposCompromisso.map((t) => ({
     id: t.id,
     nome: t.nome,
     slug: t.slug,
     cor: t.cor,
     ordem: t.ordem,
     isActive: t.isActive,
     createdAt: t.createdAt?.toISO() || null,
     updatedAt: t.updatedAt?.toISO() || null,
   }))
   ```
2. **`storeTipoCompromisso`**:
   Validação, resolução de slug automático se não informado, verificação de duplicidade de slug e gravação com status `201`.
3. **`updateTipoCompromisso`**:
   Busca por `id`, verificação de slug em uso por outro registro, atualização de campos permitidos.
4. **`toggleTipoCompromisso`**:
   Inversão de `isActive` e persistência.
5. **`destroyTipoCompromisso`**:
   Proteção de integridade referencial: verificar se existem compromissos agendados usando este `tipo_id` em `compromissos_agenda`. Se existir, rejeitar exclusão com mensagem orientando desativação (alinhado a RN017); caso contrário, efetuar exclusão.

### 5.5 Rotas em `start/routes.ts`
Dentro do grupo existente protegido por `middleware.role([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])`:
```ts
// Tipos de Compromisso (Agenda)
router.post('configuracoes/tipos-compromisso', [controllers.Configuracoes, 'storeTipoCompromisso']).as('configuracoes.tipos_compromisso.store')
router.put('configuracoes/tipos-compromisso/:id', [controllers.Configuracoes, 'updateTipoCompromisso']).as('configuracoes.tipos_compromisso.update')
router.patch('configuracoes/tipos-compromisso/:id/toggle', [controllers.Configuracoes, 'toggleTipoCompromisso']).as('configuracoes.tipos_compromisso.toggle')
router.delete('configuracoes/tipos-compromisso/:id', [controllers.Configuracoes, 'destroyTipoCompromisso']).as('configuracoes.tipos_compromisso.destroy')
```

### 5.6 Interface em `inertia/pages/configuracoes/index.tsx`
1. **Tipo TypeScript**:
   ```ts
   export type TipoCompromissoItem = {
     id: number
     nome: string
     slug: string
     cor: string
     ordem: number
     isActive: boolean
     createdAt: string | null
     updatedAt: string | null
   }
   ```
2. **Abas e Query Params**:
   Atualizar `type TabKey = 'ambientes' | 'origens' | 'campanhas' | 'tipos_compromisso'`.
   Suporte ao parâmetro `?tab=tipos_compromisso`.
3. **Aba "Tipos de Compromisso"**:
   - Ícone: `Calendar` da biblioteca `lucide-react`.
   - Contador de cadastrados e ativos.
   - Tabela com colunas: Ordem, Nome do Tipo, Identificador (Slug), Cor / Identificação Visual, Status (Toggle), Ações (Editar, Excluir).
   - Coluna de Cor: Badge estilizado com a cor real do item (`background-color`, `border-color`, ponto indicador e código hex).
4. **Paleta Sugerida no Modal de Cadastro/Edição**:
   - Seletor de cores predefinidas em grade (Swatches rápidos):
     `#3b82f6` (Azul), `#10b981` (Esmeralda), `#8b5cf6` (Roxo), `#f59e0b` (Âmbar), `#c8841a` (Warm Gold Líder), `#06b6d4` (Ciano), `#ef4444` (Vermelho), `#ec4899` (Rosa), `#6b7280` (Cinza).
   - Campo input hex para personalização livre.
5. **Chamada de Notificação**:
   Chamar `notifyCatalogoUpdate()` em todas as operações de sucesso, sincronizando imediatamente o CRM e a Agenda.

---

## 6. Plano de Testes Automatizados (Japa)

Recomenda-se adicionar os testes funcionais em `tests/functional/configuracoes_and_qualificacao.spec.ts` ou criar suíte dedicada:
1. `bloqueia acesso de perfil vendedor e projetista a mutações em /configuracoes/tipos-compromisso com 403`.
2. `permite CRUD completo de TipoCompromissoCatalogo por Diretoria e Gerente Comercial`.
3. `rejeita criação com slug duplicado retornando 400 Bad Request`.
4. `rejeita cor em formato hexadecimal inválido retornando 422`.
5. `impede exclusão física quando houver compromissos vinculados (proteção de integridade referencial)`.
