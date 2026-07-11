# Frontend do Módulo Arquitetos (com integração do Score) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o módulo de Arquitetos no frontend (React) — listagem, cadastro, edição, desativação, e um drawer com 3 abas (Perfil / Score / Decisores & Concorrentes) que integra os endpoints de score já existentes no backend (`GET /arquitetos/{id}/score`).

**Architecture:** Página única `ArquitetosPage.jsx` (grid de cards + modal de criação + drawer lateral), seguindo exatamente o padrão já usado em `CRMPage.jsx` (componente principal + subcomponentes no mesmo arquivo, chamadas via `axios` através de `lib/api.js`, sem gerenciador de estado global para dados de servidor). Reaproveita componentes de `components/ui/index.jsx` (`Modal`, `ConfirmDialog`, `Tabs`, `EmptyState`, `LoadingPage`, `Spinner`, `ScoreBar`).

**Tech Stack:** React 19, react-router-dom 7, axios, clsx, lucide-react, TailwindCSS 3. Sem framework de testes no frontend (confirmado: `package.json` não tem Vitest/RTL/Jest) — verificação via `npm run build`, `npm run lint`, e checagem manual no navegador.

## Global Constraints

- Spec de referência: `docs/superpowers/specs/2026-07-11-arquitetos-frontend-design.md`
- Sem gating de botões por perfil no frontend — todo usuário autenticado vê as ações; o backend retorna 403 para quem não tem permissão, e a UI mostra `err.response?.data?.detail`
- Sem view Kanban para arquitetos — grid de cards com busca
- Score, segmento e flags **não** aparecem no grid — só na aba "Score" do drawer, carregados sob demanda (1 request por arquiteto aberto, não em lote)
- `ScoreBar` ganha prop opcional `showMinimo` (default `true`) — não criar componente paralelo
- `nivel_parceria` é campo de texto livre (`input`), não `select` — o backend não define enum para esse campo
- Todo texto de UI em português do Brasil (pt-BR), consistente com o resto do projeto
- Todos os commits usam `--author="Thiago Ribeiro <thiaguim.16@gmail.com>"`, sem alterar a config global do git
- Repositório raiz para todos os comandos `git` é `C:/Users/thiagor/Documents/projeto/Plannit` (monorepo — backend e frontend compartilham o mesmo `.git`)

---

### Task 1: Cliente de API — `arquitetosApi`

**Files:**
- Modify: `frontend/src/lib/api.js:70-75` (após o bloco `usersApi`)

**Interfaces:**
- Produces: `arquitetosApi.{list,get,create,update,desativar,score,listarDecisores,criarDecisor,atualizarDecisor,removerDecisor,listarConcorrentes,criarConcorrente,atualizarConcorrente,removerConcorrente}` — todas as tasks seguintes (5, 6) consomem este objeto.

- [ ] **Step 1: Ler o arquivo atual para confirmar o bloco final**

Rode: `cat frontend/src/lib/api.js` (ou leia via ferramenta de leitura). Confirme que o arquivo termina exatamente com:

```js
export const usersApi = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  disponibilidadeProjetistas: () => api.get('/users/projetistas/disponibilidade'),
}
```

- [ ] **Step 2: Adicionar `arquitetosApi` ao final do arquivo**

Substitua o trecho acima por:

```js
export const usersApi = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  disponibilidadeProjetistas: () => api.get('/users/projetistas/disponibilidade'),
}

export const arquitetosApi = {
  list: (params) => api.get('/arquitetos/', { params }),
  get: (id) => api.get(`/arquitetos/${id}`),
  create: (data) => api.post('/arquitetos/', data),
  update: (id, data) => api.patch(`/arquitetos/${id}`, data),
  desativar: (id) => api.delete(`/arquitetos/${id}`),
  score: (id) => api.get(`/arquitetos/${id}/score`),
  listarDecisores: (id) => api.get(`/arquitetos/${id}/decisores`),
  criarDecisor: (id, data) => api.post(`/arquitetos/${id}/decisores`, data),
  atualizarDecisor: (id, decisorId, data) => api.patch(`/arquitetos/${id}/decisores/${decisorId}`, data),
  removerDecisor: (id, decisorId) => api.delete(`/arquitetos/${id}/decisores/${decisorId}`),
  listarConcorrentes: (id) => api.get(`/arquitetos/${id}/concorrentes`),
  criarConcorrente: (id, data) => api.post(`/arquitetos/${id}/concorrentes`, data),
  atualizarConcorrente: (id, concId, data) => api.patch(`/arquitetos/${id}/concorrentes/${concId}`, data),
  removerConcorrente: (id, concId) => api.delete(`/arquitetos/${id}/concorrentes/${concId}`),
}
```

- [ ] **Step 3: Verificar sintaxe**

Rode (a partir de `frontend/`): `npm run lint`
Esperado: sem erros novos relacionados a `api.js` (pode haver warnings pré-existentes em outros arquivos — ignore-os).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: add arquitetosApi client for arquitetos module"
```

---

### Task 2: Constantes — `SEGMENTO_CONFIG`, `FLAG_CONFIG`, cor `primary`

**Files:**
- Modify: `frontend/src/lib/constants.js:39-46` (adicionar chave `primary`)
- Modify: `frontend/src/lib/constants.js` (final do arquivo, após `timeAgo`)

**Interfaces:**
- Consumes: nenhuma (constantes puras)
- Produces: `STATUS_COLOR_CLASSES.primary`, `SEGMENTO_CONFIG` (chaves: `campeao`, `parceiro_fiel`, `em_ascensao`, `novo_promissor`, `ocasional`, `em_risco`, `inativo` — cada uma `{label, color}`), `FLAG_CONFIG` (chaves: `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor` — cada uma `{label, color}`). Consumido pela Task 5.

- [ ] **Step 1: Adicionar a cor `primary` em `STATUS_COLOR_CLASSES`**

Old:
```js
export const STATUS_COLOR_CLASSES = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  stone:  'bg-stone-100 text-stone-600 border-stone-200',
}
```

New:
```js
export const STATUS_COLOR_CLASSES = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  green:   'bg-green-50 text-green-700 border-green-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  red:     'bg-red-50 text-red-700 border-red-200',
  stone:   'bg-stone-100 text-stone-600 border-stone-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
}
```

(`primary-50/700/200` já existem em `frontend/tailwind.config.js:7-11` — nenhuma mudança de config necessária.)

- [ ] **Step 2: Adicionar `SEGMENTO_CONFIG` e `FLAG_CONFIG` ao final do arquivo**

Old (final do arquivo):
```js
export const timeAgo = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}
```

New:
```js
export const timeAgo = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

// Score de Arquitetos (Módulo Arquitetos)
export const SEGMENTO_CONFIG = {
  campeao:        { label: 'Campeão',        color: 'primary' },
  parceiro_fiel:  { label: 'Parceiro Fiel',  color: 'green' },
  em_ascensao:    { label: 'Em Ascensão',    color: 'blue' },
  novo_promissor: { label: 'Novo Promissor', color: 'purple' },
  ocasional:      { label: 'Ocasional',      color: 'stone' },
  em_risco:       { label: 'Em Risco',       color: 'red' },
  inativo:        { label: 'Inativo',        color: 'stone' },
}

export const FLAG_CONFIG = {
  top_indicador:        { label: 'Top Indicador',           color: 'primary' },
  em_risco_de_perda:    { label: 'Em Risco de Perda',       color: 'red' },
  alto_potencial:       { label: 'Alto Potencial',          color: 'blue' },
  indicacao_alto_valor: { label: 'Indicação de Alto Valor', color: 'green' },
}
```

- [ ] **Step 3: Verificar sintaxe**

Rode (a partir de `frontend/`): `npm run lint`
Esperado: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/constants.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: add SEGMENTO_CONFIG and FLAG_CONFIG for arquitetos score"
```

---

### Task 3: `ScoreBar` — prop `showMinimo`

**Files:**
- Modify: `frontend/src/components/ui/index.jsx:170-192`

**Interfaces:**
- Produces: `ScoreBar({ score, min = 70, label, showMinimo = true })` — comportamento padrão inalterado (usado hoje em `BriefingPage.jsx:178` e `:356` sem essa prop). Consumido pela Task 5 com `showMinimo={false}`.

- [ ] **Step 1: Confirmar uso atual (não deve mudar comportamento existente)**

Rode: `grep -n "ScoreBar" frontend/src/pages/briefing/BriefingPage.jsx`
Esperado: duas chamadas, nenhuma passando `showMinimo` — confirma que o default `true` preserva o comportamento delas.

- [ ] **Step 2: Adicionar a prop `showMinimo`**

Old:
```jsx
export function ScoreBar({ score, min = 70, label }) {
  const pct = Math.min(100, Math.max(0, score))
  const ok = score >= min
  return (
    <div>
      {label && <p className="text-xs text-stone-500 mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', ok ? 'bg-green-500' : 'bg-amber-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={clsx('text-xs font-semibold min-w-[2.5rem] text-right', ok ? 'text-green-600' : 'text-amber-600')}>
          {score.toFixed(0)}/100
        </span>
      </div>
      {score < min && (
        <p className="text-xs text-amber-600 mt-0.5">Mínimo: {min} pontos</p>
      )}
    </div>
  )
}
```

New:
```jsx
export function ScoreBar({ score, min = 70, label, showMinimo = true }) {
  const pct = Math.min(100, Math.max(0, score))
  const ok = score >= min
  return (
    <div>
      {label && <p className="text-xs text-stone-500 mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', ok ? 'bg-green-500' : 'bg-amber-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={clsx('text-xs font-semibold min-w-[2.5rem] text-right', ok ? 'text-green-600' : 'text-amber-600')}>
          {score.toFixed(0)}/100
        </span>
      </div>
      {showMinimo && score < min && (
        <p className="text-xs text-amber-600 mt-0.5">Mínimo: {min} pontos</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar sintaxe e que o Briefing não quebrou**

Rode (a partir de `frontend/`): `npm run build`
Esperado: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/index.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: add showMinimo prop to ScoreBar for non-briefing usage"
```

---

### Task 4: Roteamento e navegação

**Files:**
- Modify: `frontend/src/App.jsx:12,22,53` (import, `ROUTE_TITLES`, `<Route>`)
- Modify: `frontend/src/components/layout/Sidebar.jsx:2-6,14` (import de ícone, `NAV`)

**Interfaces:**
- Consumes: `ArquitetosPage` default export de `frontend/src/pages/arquitetos/ArquitetosPage.jsx` — **este arquivo ainda não existe** (criado na Task 5). A rota ficará quebrada (import 404) até a Task 5 rodar. Isso é aceitável dentro do plano porque as tasks são executadas em ordem; se rodando `npm run build`/`npm run dev` isoladamente após esta task, vai falhar por módulo não encontrado — não se preocupe, é esperado.
- Produces: rota `/arquitetos` navegável, item de menu "Arquitetos" na sidebar.

- [ ] **Step 1: `App.jsx` — importar `ArquitetosPage`**

Old:
```jsx
import BriefingPage from './pages/briefing/BriefingPage'
```

New:
```jsx
import BriefingPage from './pages/briefing/BriefingPage'
import ArquitetosPage from './pages/arquitetos/ArquitetosPage'
```

- [ ] **Step 2: `App.jsx` — adicionar entrada em `ROUTE_TITLES`**

Old:
```jsx
  '/briefing':      { title: 'Briefings',           subtitle: 'Formulários e score' },
```

New:
```jsx
  '/briefing':      { title: 'Briefings',           subtitle: 'Formulários e score' },
  '/arquitetos':    { title: 'Arquitetos',          subtitle: 'Parceiros e indicações' },
```

- [ ] **Step 3: `App.jsx` — adicionar a rota**

Old:
```jsx
            <Route path="/briefing"      element={<BriefingPage />} />
```

New:
```jsx
            <Route path="/briefing"      element={<BriefingPage />} />
            <Route path="/arquitetos"    element={<ArquitetosPage />} />
```

- [ ] **Step 4: `Sidebar.jsx` — importar o ícone `Compass`**

Old:
```jsx
import {
  LayoutDashboard, Users, FileText, Layers, DollarSign,
  Truck, Hammer, HeadphonesIcon, BarChart2, Settings, LogOut,
  ChevronLeft, Building2
} from 'lucide-react'
```

New:
```jsx
import {
  LayoutDashboard, Users, FileText, Layers, DollarSign,
  Truck, Hammer, HeadphonesIcon, BarChart2, Settings, LogOut,
  ChevronLeft, Building2, Compass
} from 'lucide-react'
```

- [ ] **Step 5: `Sidebar.jsx` — adicionar item de navegação**

Old:
```jsx
  { path: '/crm',        label: 'CRM / Leads',   icon: Users,           perfis: ['*'] },
  { path: '/briefing',   label: 'Briefings',     icon: FileText,        perfis: ['diretoria','gerente_comercial','vendedor','projetista'] },
```

New:
```jsx
  { path: '/crm',        label: 'CRM / Leads',   icon: Users,           perfis: ['*'] },
  { path: '/arquitetos', label: 'Arquitetos',    icon: Compass,         perfis: ['*'] },
  { path: '/briefing',   label: 'Briefings',     icon: FileText,        perfis: ['diretoria','gerente_comercial','vendedor','projetista'] },
```

- [ ] **Step 6: Commit (build vai falhar até a Task 5 — não rodar `npm run build` aqui, só `npm run lint` para checar sintaxe dos 2 arquivos tocados)**

Rode: `npm run lint 2>&1 | grep -E "App.jsx|Sidebar.jsx"`
Esperado: nenhum erro de sintaxe listado para esses dois arquivos (o `import` de `ArquitetosPage` não é pego pelo lint como erro fatal, é um erro de build — o `lint` do ESLint aqui não resolve módulos).

```bash
git add frontend/src/App.jsx frontend/src/components/layout/Sidebar.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: wire /arquitetos route and sidebar nav item"
```

---

### Task 5: `ArquitetosPage.jsx` — grid, cadastro, drawer (Perfil + Score)

**Files:**
- Create: `frontend/src/pages/arquitetos/ArquitetosPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi` (Task 1), `SEGMENTO_CONFIG`/`FLAG_CONFIG`/`STATUS_COLOR_CLASSES` (Task 2), `ScoreBar` com `showMinimo` (Task 3), `Modal`/`ConfirmDialog`/`EmptyState`/`LoadingPage`/`Spinner`/`Tabs` de `components/ui`.
- Produces: `export default function ArquitetosPage()`. Também define, no mesmo arquivo, os componentes internos `ArquitetoCard`, `ArquitetoForm`, `NovoArquitetoModal`, `DRAWER_TABS`, `ArquitetoDrawer`, `ScoreTabContent` — a **Task 6 modifica este mesmo arquivo** e depende dos nomes exatos: `DRAWER_TABS` (array), `ArquitetoDrawer` (usa `atual.id`, state `tab`), bloco `{tab === 'score' && (...)}`.

- [ ] **Step 1: Criar o diretório e o arquivo com o conteúdo completo**

Crie `frontend/src/pages/arquitetos/ArquitetosPage.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Plus, Search, Phone, Mail, Building2 } from 'lucide-react'
import { arquitetosApi } from '../../lib/api'
import { Modal, ConfirmDialog, EmptyState, LoadingPage, Spinner, Tabs, ScoreBar } from '../../components/ui'
import { STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG } from '../../lib/constants'
import clsx from 'clsx'

export default function ArquitetosPage() {
  const [arquitetos, setArquitetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchArquitetos = async () => {
    try {
      const { data } = await arquitetosApi.list()
      setArquitetos(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchArquitetos() }, [])

  const filtered = arquitetos.filter(a =>
    !search ||
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.escritorio?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar arquiteto..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Arquiteto
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum arquiteto encontrado" description="Cadastre um novo arquiteto parceiro para começar" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <ArquitetoCard key={a.id} arquiteto={a} onClick={() => setSelected(a)} />
          ))}
        </div>
      )}

      {/* Modal Novo Arquiteto */}
      <NovoArquitetoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchArquitetos() }}
      />

      {/* Drawer */}
      {selected && (
        <ArquitetoDrawer
          arquiteto={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchArquitetos}
        />
      )}
    </div>
  )
}

// === Card ===
function ArquitetoCard({ arquiteto, onClick }) {
  return (
    <div onClick={onClick} className="card-hover p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-stone-800">{arquiteto.nome}</p>
        <span className="badge badge-neutro flex-shrink-0">{arquiteto.nivel_parceria}</span>
      </div>
      {arquiteto.escritorio && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
          <Building2 size={11} />
          <span>{arquiteto.escritorio}</span>
        </div>
      )}
      {arquiteto.telefone && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Phone size={11} />
          <span>{arquiteto.telefone}</span>
        </div>
      )}
      {arquiteto.email && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
          <Mail size={11} />
          <span>{arquiteto.email}</span>
        </div>
      )}
    </div>
  )
}

// === Form compartilhado (criar/editar arquiteto) ===
function ArquitetoForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar arquiteto')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome *</label>
          <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
        </div>
        <div className="col-span-2">
          <label className="label">Escritório</label>
          <input className="input" value={form.escritorio} onChange={e => set('escritorio', e.target.value)} placeholder="Nome do escritório" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div className="col-span-2">
          <label className="label">Nível de parceria</label>
          <input className="input" value={form.nivel_parceria} onChange={e => set('nivel_parceria', e.target.value)} placeholder="parceiro" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// === Modal Novo Arquiteto ===
function NovoArquitetoModal({ open, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="Novo Arquiteto" size="md">
      <ArquitetoForm
        initial={{ nome: '', escritorio: '', telefone: '', email: '', nivel_parceria: 'parceiro' }}
        submitLabel="Cadastrar Arquiteto"
        onCancel={onClose}
        onSubmit={async (form) => {
          await arquitetosApi.create(form)
          onSaved()
        }}
      />
    </Modal>
  )
}

const DRAWER_TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'score', label: 'Score' },
]

// === Drawer ===
function ArquitetoDrawer({ arquiteto, onClose, onUpdated }) {
  const [tab, setTab] = useState('perfil')
  const [atual, setAtual] = useState(arquiteto)
  const [editing, setEditing] = useState(false)
  const [confirmDesativar, setConfirmDesativar] = useState(false)

  const [score, setScore] = useState(null)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState('')

  useEffect(() => {
    if (tab === 'score' && !score && !scoreLoading) {
      setScoreLoading(true)
      setScoreError('')
      arquitetosApi.score(atual.id)
        .then(({ data }) => setScore(data))
        .catch(() => setScoreError('Não foi possível calcular o score deste arquiteto'))
        .finally(() => setScoreLoading(false))
    }
  }, [tab, atual.id, score, scoreLoading])

  const handleEditSubmit = async (form) => {
    const { data } = await arquitetosApi.update(atual.id, form)
    setAtual(data)
    setEditing(false)
    onUpdated()
  }

  const handleDesativar = async () => {
    await arquitetosApi.desativar(atual.id)
    setConfirmDesativar(false)
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="font-semibold text-stone-800">{atual.nome}</h3>
          <p className="text-xs text-stone-400">{atual.escritorio || 'Sem escritório'}</p>
        </div>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs tabs={DRAWER_TABS} active={tab} onChange={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && (
          editing ? (
            <ArquitetoForm
              initial={{
                nome: atual.nome,
                escritorio: atual.escritorio || '',
                telefone: atual.telefone || '',
                email: atual.email || '',
                nivel_parceria: atual.nivel_parceria,
              }}
              submitLabel="Salvar alterações"
              onCancel={() => setEditing(false)}
              onSubmit={handleEditSubmit}
            />
          ) : (
            <div className="space-y-4">
              <span className="badge badge-neutro">{atual.nivel_parceria}</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-stone-400">Telefone</p>
                  <p className="font-medium text-stone-700">{atual.telefone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">E-mail</p>
                  <p className="font-medium text-stone-700">{atual.email || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Editar</button>
                <button className="btn-danger btn-sm" onClick={() => setConfirmDesativar(true)}>Desativar</button>
              </div>
            </div>
          )
        )}

        {tab === 'score' && (
          <ScoreTabContent score={score} loading={scoreLoading} error={scoreError} />
        )}
      </div>

      <ConfirmDialog
        open={confirmDesativar}
        onClose={() => setConfirmDesativar(false)}
        onConfirm={handleDesativar}
        title="Desativar arquiteto"
        message={`Tem certeza que deseja desativar ${atual.nome}? Ele deixará de aparecer na listagem.`}
        confirmLabel="Desativar"
        danger
      />
    </div>
  )
}

// === Conteúdo da aba Score ===
function ScoreTabContent({ score, loading, error }) {
  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!score) return null

  const segmentoCfg = SEGMENTO_CONFIG[score.segmento] || { label: score.segmento, color: 'stone' }

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <p className="text-3xl font-display font-semibold text-stone-800">{score.score_geral.toFixed(0)}</p>
        <p className="text-xs text-stone-400 mb-2">Score geral</p>
        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[segmentoCfg.color])}>
          {segmentoCfg.label}
        </span>
      </div>

      {score.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {score.flags.map(flag => {
            const cfg = FLAG_CONFIG[flag] || { label: flag, color: 'stone' }
            return (
              <span key={flag} className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[cfg.color])}>
                {cfg.label}
              </span>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        <ScoreBar score={score.rfv} label="RFV (Recência, Frequência, Valor)" showMinimo={false} />
        <ScoreBar score={score.potencial} label="Potencial" showMinimo={false} />
        <ScoreBar score={score.lealdade} label="Lealdade" showMinimo={false} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm border-t border-stone-100 pt-3">
        <div>
          <p className="text-xs text-stone-400">Projetos ativos</p>
          <p className="font-medium text-stone-700">{score.detalhes.projetos_ativos}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Leads ativos</p>
          <p className="font-medium text-stone-700">{score.detalhes.leads_ativos}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Dias desde último projeto</p>
          <p className="font-medium text-stone-700">{score.detalhes.dias_desde_ultimo_projeto ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Meses de parceria</p>
          <p className="font-medium text-stone-700">{score.detalhes.meses_desde_cadastro}</p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Risco de concorrência</p>
        <p className="text-sm text-stone-700 mb-2">
          Nível <strong className="capitalize">{score.concorrencia.nivel}</strong> ({score.concorrencia.risco.toFixed(0)}%)
        </p>
        {score.concorrencia.concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-1">
            {score.concorrencia.concorrentes.map(c => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-stone-600">{c.nome_concorrente}</span>
                <span className="text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que o projeto compila**

Rode (a partir de `frontend/`): `npm run build`
Esperado: `vite build` conclui com `✓ built in ...`, sem erros de módulo não encontrado nem de sintaxe.

- [ ] **Step 3: Lint**

Rode: `npm run lint`
Esperado: sem erros novos (warnings pré-existentes em outros arquivos, se houver, não bloqueiam).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: add ArquitetosPage with grid, CRUD and score tab"
```

---

### Task 6: Aba "Decisores & Concorrentes" no drawer

**Files:**
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx` (arquivo criado na Task 5)

**Interfaces:**
- Consumes: `arquitetosApi.{listarDecisores,criarDecisor,atualizarDecisor,removerDecisor,listarConcorrentes,criarConcorrente,atualizarConcorrente,removerConcorrente}` (Task 1), `ConfirmDialog`/`Spinner` (já importados na Task 5), `DRAWER_TABS` e o bloco de render de `tab` dentro de `ArquitetoDrawer` (definidos na Task 5).
- Produces: `ContatosTabContent`, `DecisorForm`, `ConcorrenteForm` — não consumidos por nenhuma task seguinte (última task de código deste plano).

- [ ] **Step 1: Adicionar a terceira aba em `DRAWER_TABS`**

Old:
```jsx
const DRAWER_TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'score', label: 'Score' },
]
```

New:
```jsx
const DRAWER_TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'score', label: 'Score' },
  { key: 'contatos', label: 'Decisores & Concorrentes' },
]
```

- [ ] **Step 2: Renderizar `ContatosTabContent` dentro do drawer**

Old:
```jsx
        {tab === 'score' && (
          <ScoreTabContent score={score} loading={scoreLoading} error={scoreError} />
        )}
      </div>

      <ConfirmDialog
        open={confirmDesativar}
```

New:
```jsx
        {tab === 'score' && (
          <ScoreTabContent score={score} loading={scoreLoading} error={scoreError} />
        )}

        {tab === 'contatos' && (
          <ContatosTabContent arquitetoId={atual.id} />
        )}
      </div>

      <ConfirmDialog
        open={confirmDesativar}
```

- [ ] **Step 3: Adicionar `ContatosTabContent`, `DecisorForm` e `ConcorrenteForm` ao final do arquivo**

Old (final do arquivo):
```jsx
        {score.concorrencia.concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-1">
            {score.concorrencia.concorrentes.map(c => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-stone-600">{c.nome_concorrente}</span>
                <span className="text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

New:
```jsx
        {score.concorrencia.concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-1">
            {score.concorrencia.concorrentes.map(c => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-stone-600">{c.nome_concorrente}</span>
                <span className="text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// === Conteúdo da aba Decisores & Concorrentes ===
function ContatosTabContent({ arquitetoId }) {
  const [decisores, setDecisores] = useState([])
  const [concorrentes, setConcorrentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingDecisor, setEditingDecisor] = useState(undefined)
  const [editingConcorrente, setEditingConcorrente] = useState(undefined)
  const [removerDecisor, setRemoverDecisor] = useState(null)
  const [removerConcorrente, setRemoverConcorrente] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, c] = await Promise.all([
        arquitetosApi.listarDecisores(arquitetoId),
        arquitetosApi.listarConcorrentes(arquitetoId),
      ])
      setDecisores(d.data)
      setConcorrentes(c.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [arquitetoId])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Decisores</p>
          {editingDecisor === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingDecisor(null)}>Adicionar</button>
          )}
        </div>

        {editingDecisor !== undefined && (
          <DecisorForm
            initial={editingDecisor || { nome: '', cargo: '', telefone: '', email: '', observacoes: '', is_principal: false }}
            onCancel={() => setEditingDecisor(undefined)}
            onSubmit={async (form) => {
              if (editingDecisor?.id) {
                await arquitetosApi.atualizarDecisor(arquitetoId, editingDecisor.id, form)
              } else {
                await arquitetosApi.criarDecisor(arquitetoId, form)
              }
              setEditingDecisor(undefined)
              fetchAll()
            }}
          />
        )}

        {decisores.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum decisor cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {decisores.map(d => (
              <li key={d.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">
                    {d.nome} {d.is_principal && <span className="badge badge-ativo ml-1">Principal</span>}
                  </p>
                  <p className="text-xs text-stone-400">{d.cargo || '—'} · {d.telefone || d.email || 'sem contato'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingDecisor(d)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverDecisor(d)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Concorrentes</p>
          {editingConcorrente === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingConcorrente(null)}>Adicionar</button>
          )}
        </div>

        {editingConcorrente !== undefined && (
          <ConcorrenteForm
            initial={editingConcorrente || { nome_concorrente: '', percentual_fechamento_estimado: 0, observacoes: '' }}
            onCancel={() => setEditingConcorrente(undefined)}
            onSubmit={async (form) => {
              const payload = { ...form, percentual_fechamento_estimado: Number(form.percentual_fechamento_estimado) }
              if (editingConcorrente?.id) {
                await arquitetosApi.atualizarConcorrente(arquitetoId, editingConcorrente.id, payload)
              } else {
                await arquitetosApi.criarConcorrente(arquitetoId, payload)
              }
              setEditingConcorrente(undefined)
              fetchAll()
            }}
          />
        )}

        {concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {concorrentes.map(c => (
              <li key={c.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">{c.nome_concorrente}</p>
                  <p className="text-xs text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}% de fechamento estimado</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingConcorrente(c)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverConcorrente(c)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!removerDecisor}
        onClose={() => setRemoverDecisor(null)}
        onConfirm={async () => {
          await arquitetosApi.removerDecisor(arquitetoId, removerDecisor.id)
          setRemoverDecisor(null)
          fetchAll()
        }}
        title="Remover decisor"
        message={`Remover ${removerDecisor?.nome} da lista de decisores?`}
        confirmLabel="Remover"
        danger
      />

      <ConfirmDialog
        open={!!removerConcorrente}
        onClose={() => setRemoverConcorrente(null)}
        onConfirm={async () => {
          await arquitetosApi.removerConcorrente(arquitetoId, removerConcorrente.id)
          setRemoverConcorrente(null)
          fetchAll()
        }}
        title="Remover concorrente"
        message={`Remover ${removerConcorrente?.nome_concorrente} da lista de concorrentes?`}
        confirmLabel="Remover"
        danger
      />
    </div>
  )
}

function DecisorForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar decisor')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome *" />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Cargo" />
        <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="Telefone" />
      </div>
      <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="E-mail" />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={form.is_principal} onChange={e => set('is_principal', e.target.checked)} />
        Contato principal
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}

function ConcorrenteForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar concorrente')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome_concorrente} onChange={e => set('nome_concorrente', e.target.value)} placeholder="Nome do concorrente *" />
      <input
        className="input" type="number" min="0" max="100" required
        value={form.percentual_fechamento_estimado}
        onChange={e => set('percentual_fechamento_estimado', e.target.value)}
        placeholder="% estimado de fechamento"
      />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Verificar que o projeto compila**

Rode (a partir de `frontend/`): `npm run build`
Esperado: `✓ built in ...`, sem erros.

- [ ] **Step 5: Lint**

Rode: `npm run lint`
Esperado: sem erros novos.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "feat: add decisores and concorrentes CRUD to arquiteto drawer"
```

---

### Task 7: Verificação manual end-to-end

**Files:** nenhum (apenas execução e observação)

**Interfaces:** N/A — task de verificação, não produz interface para outras tasks.

- [ ] **Step 1: Subir o backend local**

A partir de `backend/` (com `venv` ativado e `.env` configurado conforme `CLAUDE.md`):
```bash
uvicorn app.main:app --reload --port 8000
```
Esperado: `Uvicorn running on http://127.0.0.1:8000`.

- [ ] **Step 2: Subir o frontend local**

A partir de `frontend/`:
```bash
npm run dev
```
Esperado: Vite serve em `http://localhost:5173`.

- [ ] **Step 3: Login e navegação**

Abra `http://localhost:5173`, faça login com `admin@plannit.com.br` / `Admin@123456`. Confirme que "Arquitetos" aparece no menu lateral (seção Comercial, entre CRM/Leads e Briefings) e que clicar nele navega para `/arquitetos` sem erro no console.

- [ ] **Step 4: Cadastrar um arquiteto sem histórico**

Clique em "Novo Arquiteto", preencha nome (ex: "Ana Teste") e salve. Confirme que o card aparece no grid. Abra o drawer, vá para a aba "Score". Esperado: `score_geral` baixo/zero, segmento **Inativo** (nenhum projeto/lead associado ainda), sem flags, "Nenhum concorrente cadastrado".

- [ ] **Step 5: Gerar histórico e confirmar que o score muda**

Via CRM (`/crm`), crie um novo Lead com esse arquiteto vinculado (`arquiteto_id`) — se a tela de criação de lead não expõe esse campo, use `POST /api/v1/leads/` diretamente pelo Swagger (`http://localhost:8000/docs`) passando `arquiteto_id` do arquiteto criado no Step 4. Reabra o drawer do arquiteto e a aba Score novamente (o componente só busca uma vez por abertura do drawer — feche e reabra o drawer para forçar novo fetch). Esperado: `detalhes.leads_ativos` incrementa e o `potencial` sobe de acordo com as faixas do spec do backend.

- [ ] **Step 6: CRUD de decisor e concorrente**

Na aba "Decisores & Concorrentes", clique "Adicionar" em Decisores, preencha nome e marque "Contato principal", salve — confirme que aparece na lista com o badge "Principal". Clique "Editar", altere o cargo, salve — confirme a atualização. Clique "Remover" — confirme o `ConfirmDialog` e a remoção. Repita o mesmo fluxo para Concorrentes (nome + percentual). Volte para a aba Score e confirme que o bloco "Risco de concorrência" reflete o concorrente cadastrado (se ainda não removido).

- [ ] **Step 7: Editar e desativar arquiteto**

Na aba Perfil, clique "Editar", altere o telefone, salve — confirme que o header do drawer e os dados exibidos atualizam. Clique "Desativar", confirme no dialog — confirme que o drawer fecha e o card some do grid (backend filtra `is_active == True` na listagem).

- [ ] **Step 8: Checar erros de autorização (opcional, se houver usuário de perfil restrito)**

Login com `projetista@lidermoveis.com.br` / `Teste@123` (perfil sem permissão de escrita em arquitetos). Tente criar um arquiteto — confirme que a UI mostra a mensagem de erro do backend (403) em vez de travar silenciosamente.

- [ ] **Step 9: Relatar resultado**

Se todos os passos acima passarem sem erro no console do navegador nem no terminal do backend, a integração está validada. Se algo falhar, anotar o passo exato e o erro antes de prosseguir — não faz parte deste plano corrigir bugs não previstos aqui.
