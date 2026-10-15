# Exemplos de código — sincronização de catálogos

Trechos tirados do código do Plannit (`plannit/`). Os caminhos são relativos a `plannit/`.

## Índice
1. Model do catálogo com scopes
2. Controller da tela consumidora
3. Validator contra o catálogo ativo
4. Hook de sincronização (`inertia/lib/catalogos.ts`)
5. Usando o hook no componente
6. Atalhos para gestores: "Sincronizar" e "Configurar ↗"
7. Lista combinada: catálogo + itens criados na hora
8. Manter visíveis os valores já gravados
9. Cadastro rápido de item do catálogo
10. Produtor: tela de Configurações
11. Teste Japa

---

## 1. Model do catálogo com scopes

Padrão de `app/models/tipo_compromisso_catalogo.ts`. A classe base vem de `database/schema.ts`,
gerado pelo `node ace migration:run`.

```ts
import { TiposCompromissoCatalogoSchema } from '#database/schema'
import { scope } from '@adonisjs/lucid/orm'

export default class TipoCompromissoCatalogo extends TiposCompromissoCatalogoSchema {
  static table = 'tipos_compromisso_catalogo'

  static ativos = scope((query) => {
    query.where('isActive', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('nome', 'asc')
  })
}
```

## 2. Controller da tela consumidora

Entregue só os itens ativos e só os campos usados. O nome da prop é o mesmo que o `only` do reload
vai citar.

```ts
const campanhasCatalogo = await CampanhaLead.query().where('isActive', true).orderBy('nome', 'asc')
// com scopes: await TipoCompromissoCatalogo.query().withScopes((s) => s.ativos()).withScopes((s) => s.ordenados())

return inertia.render('crm/index', {
  // ...
  campanhasCatalogo: campanhasCatalogo.map((c) => ({ id: c.id, nome: c.nome })),
})
```

## 3. Validator contra o catálogo ativo

De `app/validators/lead.ts`. O `filter` precisa retornar `void` (use chaves no corpo da função).
A regra do Lucid se chama `database.exists`, e é essa a chave da mensagem.

```ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createLeadValidator = vine.create({
  // ...
  campanha: vine
    .string()
    .trim()
    .maxLength(200)
    .exists({
      table: 'campanhas_lead',
      column: 'nome',
      filter: (db) => {
        db.where('is_active', true)
      },
    })
    .optional(),
})

createLeadValidator.messagesProvider = new SimpleMessagesProvider({
  'campanha.database.exists': 'Selecione uma campanha ativa do catálogo.',
})
```

Quando o registro grava o `id` do item, troque `column: 'nome'` por `column: 'id'` e use
`vine.number().positive()`.

## 4. Hook de sincronização (`inertia/lib/catalogos.ts`)

Já existe no projeto, com este conteúdo; importe dele em vez de copiar o efeito. Três componentes
mais antigos ainda têm cópias do efeito (ver item 7 do checklist A no `SKILL.md`).

```ts
import { useEffect } from 'react'
import { router } from '@inertiajs/react'

// Chave do localStorage usada como sinal entre abas
export const SINAL_CATALOGO = 'plannit_catalogo_updated'

/** Produtor: avisa as outras abas que um catálogo mudou (chame no onSuccess de toda mutação). */
export function notificarCatalogoAtualizado(chave: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SINAL_CATALOGO, `${chave}:${Date.now()}`)
}

/** Recarrega agora só as props de catálogo informadas (botão "Sincronizar"). */
export function recarregarCatalogos(props: string[], onFinish?: () => void) {
  router.reload({ only: props, onFinish })
}

/**
 * Consumidor: recarrega as props de catálogo quando outra aba avisa (storage)
 * ou quando o usuário volta para esta aba (focus).
 */
export function useSincronizarCatalogos(props: string[]) {
  const chave = props.join(',')
  useEffect(() => {
    const only = chave.split(',')
    const recarregar = () => router.reload({ only })
    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === SINAL_CATALOGO) recarregar()
    }
    window.addEventListener('focus', recarregar)
    window.addEventListener('storage', aoMudarStorage)
    return () => {
      window.removeEventListener('focus', recarregar)
      window.removeEventListener('storage', aoMudarStorage)
    }
  }, [chave])
}
```

O hook usa `props.join(',')` como dependência para não recriar os listeners a cada render quando o
componente passa um array literal.

## 5. Usando o hook no componente

Chame o hook antes de qualquer `return` antecipado (por exemplo `if (!isOpen) return null`), como
toda regra de hooks do React exige.

```tsx
import { useSincronizarCatalogos } from '~/lib/catalogos'

function NovoLeadModal(/* ... */) {
  useSincronizarCatalogos(['origensCatalogo', 'campanhasCatalogo'])
  // ...
}
```

## 6. Atalhos para gestores: "Sincronizar" e "Configurar ↗"

Adaptado de `NovoLeadModal` (`pages/crm/index.tsx`), já usando o helper do item 4 — o código atual
chama `router.reload` direto. Só Diretoria, Gerente Comercial e superusuário veem os atalhos.

```tsx
const user = usePage<{ user?: { perfil?: string; isSuperuser?: boolean } }>().props.user
const canManageConfig = Boolean(
  user?.isSuperuser || user?.perfil === 'diretoria' || user?.perfil === 'gerente_comercial'
)
const [isRefreshing, setIsRefreshing] = useState(false)

const handleRefreshCatalogs = (e?: React.MouseEvent) => {
  e?.preventDefault()
  setIsRefreshing(true)
  recarregarCatalogos(['origensCatalogo', 'campanhasCatalogo'], () => {
    setIsRefreshing(false)
    toast.success('Catálogos sincronizados!')
  })
}

// Ao lado do rótulo do campo:
<div className="flex items-center justify-between mb-1">
  <label className="label mb-0">Origem do Lead</label>
  {canManageConfig && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRefreshCatalogs}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 hover:text-stone-700"
        title="Sincronizar catálogos"
      >
        <RotateCw size={9} className={isRefreshing ? 'animate-spin' : ''} />
        <span>Sincronizar</span>
      </button>
      <a
        href="/configuracoes?tab=origens"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 hover:text-primary-800 hover:underline"
        title="Configurar origens em nova aba"
      >
        <span>Configurar</span>
        <ExternalLink size={9} />
      </a>
    </div>
  )}
</div>
```

## 7. Lista combinada: catálogo + itens criados na hora

De `components/crm/CampanhaAutocomplete.tsx`. A lista é recalculada a cada render a partir da prop,
então os reloads da sincronização continuam valendo.

```tsx
const [criadas, setCriadas] = useState<CampanhaOpcao[]>([])

const lista = useMemo(() => {
  const ids = new Set(campanhas.map((c) => c.id))
  return [...campanhas, ...criadas.filter((c) => !ids.has(c.id))].sort((a, b) =>
    a.nome.localeCompare(b.nome)
  )
}, [campanhas, criadas])
```

Evite `const [lista, setLista] = useState(props.catalogo)`: essa cópia é feita uma vez e ignora
todos os reloads seguintes.

## 8. Manter visíveis os valores já gravados

De `pages/briefings/edit.tsx`: chips do catálogo ativo + valores já escolhidos que não estão mais
nele (item desativado ou valor antigo).

```tsx
const opcoesAmbientes = useMemo(
  () => [
    ...ambientesCatalogo,
    ...formData.ambientes.filter((a) => !ambientesCatalogo.includes(a)),
  ],
  [ambientesCatalogo, formData.ambientes]
)
```

## 9. Cadastro rápido de item do catálogo

De `components/crm/CampanhaAutocomplete.tsx`, simplificado. Ofereça só a quem pode cadastrar no
catálogo (as rotas de Configurações recusam outros perfis com 403).

```tsx
import { getXsrfToken } from '~/lib/http'

const cadastrar = async (nome: string) => {
  const response = await fetch('/configuracoes/campanhas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getXsrfToken(),
    },
    body: JSON.stringify({ nome }),
  })
  if (!response.ok) {
    const erro = await response.json().catch(() => null)
    toast.error(erro?.errors?.[0]?.message || erro?.message || 'Erro ao cadastrar.')
    return
  }
  const nova = await response.json() // 201 com o item criado
  setCriadas((prev) => [...prev, { id: nova.id, nome: nova.nome }])
  onChange(nova.nome) // seleciona o item criado
  notificarCatalogoAtualizado('campanhas') // avisa as outras abas
}
```

## 10. Produtor: tela de Configurações

Em `inertia/pages/configuracoes/index.tsx`, toda mutação bem-sucedida avisa as outras abas:

```tsx
campanhaForm.post('/configuracoes/campanhas', {
  onSuccess: () => {
    toast.success('Campanha cadastrada!')
    notifyCatalogoUpdate('campanhas') // ou notificarCatalogoAtualizado, depois do hook comum
  },
})
```

E a aba nova precisa entrar no tipo `TabKey` e na lista aceita pelo `?tab=` no estado inicial:

```tsx
const [activeTab, setActiveTab] = useState<TabKey>(() => {
  // O projeto tem SSR (inertia/ssr.tsx): no servidor não existe window
  if (typeof window !== 'undefined') {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'ambientes' || tab === 'origens' || tab === 'campanhas' || tab === 'tipos_compromisso') {
      return tab
    }
  }
  return 'ambientes'
})
```

## 11. Teste Japa

De `tests/functional/leads_campanha.spec.ts`. Os testes rodam no banco de desenvolvimento, então
apague no teardown o que criar.

```ts
test.group('CRM — Lead com campanha do catálogo', (group) => {
  const campanhasCriadas: number[] = []

  group.each.teardown(async () => {
    await CampanhaLead.query().whereIn('id', campanhasCriadas).delete()
    campanhasCriadas.length = 0
  })

  test('rejeita campanha inativa', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const campanha = await CampanhaLead.create({ nome: `Teste Inativa ${Date.now()}`, isActive: false })
    campanhasCriadas.push(campanha.id)

    const response = await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ nome: 'Lead', telefone: '(11) 90000-0000', origem: 'instagram', campanha: campanha.nome })

    response.assertStatus(422)
  })
})
```
