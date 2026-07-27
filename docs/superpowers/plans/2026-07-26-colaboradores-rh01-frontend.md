# Colaboradores RH01 — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a UI do módulo Colaboradores — RH01 Cadastro do Colaborador — conforme `docs/superpowers/specs/2026-07-26-colaboradores-rh01-design.md`. Todos os endpoints já existem (`docs/superpowers/plans/2026-07-26-colaboradores-rh01-backend.md`, deve ser implementado e mergeado antes deste plano).

**Architecture:** Nova pasta `frontend/src/pages/colaboradores/`, seguindo exatamente o padrão já usado em `pages/especificadores/`: página de listagem com toolbar de filtros, drawer lateral com abas (`Tabs` de `components/ui`) para o detalhe, sub-formulários inline por aba. `ColaboradoresPage.jsx` (listagem) e `ColaboradorDrawer.jsx` + `ColaboradorTabs.jsx` (detalhe) são arquivos próprios, mesma divisão do módulo Especificadores.

**Tech Stack:** React 19, Vite 8, TailwindCSS 3, Zustand, Axios, lucide-react, clsx. Sem framework de teste JS neste projeto (`package.json` não tem `vitest`/`jest`) — a verificação automática de cada tarefa é `npm run build` (pega erro de import/JSX) + `npm run lint`; a verificação funcional final é manual (Task 6, skill `run`).

## Global Constraints

- Módulo visível só para perfis `rh`/`diretoria` — usar um novo helper `podeGerenciarColaboradores(perfil)` em `frontend/src/store/index.js`, mesmo padrão de `podeVerTudo` (`store/index.js:65`). Não reimplementar a checagem inline em cada componente.
- Todo componente novo usa os primitivos já existentes de `frontend/src/components/ui/index.jsx` (`Modal`, `Tabs`, `EmptyState`, `LoadingPage`, `Spinner`, `ConfirmDialog`) — não criar componentes visuais paralelos.
- Padrão de erro de formulário: `extractErrorMessage(err, fallback)` — mesma função copiada no topo de `EspecificadoresPage.jsx:13` e `EspecificadorTabs.jsx:12`; copiar a mesma implementação para `ColaboradoresPage.jsx`.
- `salario_clt`, `remuneracao_complementar`, `data_vigencia_salario` e `cargo_id` NUNCA aparecem no formulário de "Editar colaborador" — só nos formulários dedicados de Remuneração/Cargo & Progressão (RH-RN001, já reforçado no backend).
- CPF é validado no client antes do submit (dígito verificador), espelhando o algoritmo do backend (`app/schemas/colaborador.py::_cpf_valido`) — mesmo padrão já usado pelo score de briefing, que espelha `briefing_score.py` no frontend.
- "Rodar o teste" nas tarefas deste plano significa `cd frontend && npm run build` seguido de `npm run lint`. Não existe suíte automatizada de comportamento.

---

## Task 1: Fundação — API, constantes, rotas, sidebar e listagem

**Files:**
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/lib/constants.js`
- Modify: `frontend/src/store/index.js`
- Modify: `frontend/src/components/layout/Sidebar.jsx`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/pages/colaboradores/ColaboradoresPage.jsx`

**Interfaces:**
- Consumes: endpoints do plano de backend (`/colaboradores/*`, `/colaboradores/departamentos`, `/colaboradores/cargos`).
- Produces:
  - `colaboradoresApi`, `departamentosApi`, `cargosApi` em `lib/api.js`
  - `REGIME_CONFIG`, `MODALIDADE_LABELS`, `TIPO_DESLIGAMENTO_LABELS`, `TIPO_DOCUMENTO_COLABORADOR_LABELS`, `validarCPF(cpf)` em `lib/constants.js`
  - `podeGerenciarColaboradores(perfil)` em `store/index.js`
  - Rota `/colaboradores` (item de sidebar "Colaboradores"), rota `/colaboradores/:id` (placeholder de navegação direta — reaproveita o drawer via query, ver Task 2)
  - `ColaboradoresPage` — listagem + filtros + modal "Departamentos & Cargos" + modal "Novo Colaborador"

- [ ] **Step 1: Adicionar os endpoints em `frontend/src/lib/api.js`**

No final do arquivo (depois de `arquitetosApi`):

```javascript
export const colaboradoresApi = {
  list: (params) => api.get('/colaboradores/', { params }),
  get: (id) => api.get(`/colaboradores/${id}`),
  create: (data) => api.post('/colaboradores/', data),
  update: (id, data) => api.put(`/colaboradores/${id}`, data),
  desligar: (id, data) => api.post(`/colaboradores/${id}/desligar`, data),
  historicoSalarial: (id) => api.get(`/colaboradores/${id}/historico-salarial`),
  lancarSalario: (id, data) => api.post(`/colaboradores/${id}/historico-salarial`, data),
  historicoCargo: (id) => api.get(`/colaboradores/${id}/historico-cargo`),
  promover: (id, data) => api.post(`/colaboradores/${id}/historico-cargo`, data),
  listarDocumentos: (id) => api.get(`/colaboradores/${id}/documentos`),
  adicionarDocumento: (id, data) => api.post(`/colaboradores/${id}/documentos`, data),
  removerDocumento: (id, documentoId) => api.delete(`/colaboradores/${id}/documentos/${documentoId}`),
}

export const departamentosApi = {
  list: () => api.get('/colaboradores/departamentos'),
  create: (data) => api.post('/colaboradores/departamentos', data),
  update: (id, data) => api.put(`/colaboradores/departamentos/${id}`, data),
}

export const cargosApi = {
  list: (params) => api.get('/colaboradores/cargos', { params }),
  create: (data) => api.post('/colaboradores/cargos', data),
  update: (id, data) => api.put(`/colaboradores/cargos/${id}`, data),
}
```

- [ ] **Step 2: Adicionar as constantes em `frontend/src/lib/constants.js`**

No final do arquivo:

```javascript
export const REGIME_CONFIG = {
  clt: { label: 'CLT', color: 'blue' },
  pj:  { label: 'PJ',  color: 'purple' },
}

export const MODALIDADE_LABELS = {
  presencial: 'Presencial',
  hibrido:    'Híbrido',
  remoto:     'Remoto',
}

export const TIPO_DESLIGAMENTO_LABELS = {
  pedido_demissao:             'Pedido de Demissão',
  dispensa_sem_justa_causa:    'Dispensa sem Justa Causa',
  dispensa_com_justa_causa:    'Dispensa com Justa Causa',
}

export const TIPO_DOCUMENTO_COLABORADOR_LABELS = {
  ctps:               'CTPS',
  aso_admissional:    'ASO Admissional',
  contrato_assinado:  'Contrato Assinado',
  exame_periodico:    'Exame Periódico',
  certidao:           'Certidão',
  pis_pasep:          'PIS/PASEP',
  outro:              'Outro',
}

// Espelha app/schemas/colaborador.py::_cpf_valido — mesmo algoritmo, mesma decisão de
// validar no client antes do submit para dar feedback imediato (a validação real é no backend).
export function validarCPF(cpf) {
  const digits = (cpf || '').replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  for (const i of [9, 10]) {
    let soma = 0
    for (let num = 0; num < i; num++) soma += Number(digits[num]) * ((i + 1) - num)
    const digito = ((soma * 10) % 11) % 10
    if (digito !== Number(digits[i])) return false
  }
  return true
}
```

- [ ] **Step 3: Adicionar o helper de perfil em `frontend/src/store/index.js`**

Logo após `export const podeVerTudo = (perfil) => ['diretoria', 'gerente_comercial'].includes(perfil)`:

```javascript
export const podeGerenciarColaboradores = (perfil) => ['rh', 'diretoria'].includes(perfil)
```

- [ ] **Step 4: Adicionar o item de sidebar em `frontend/src/components/layout/Sidebar.jsx`**

Adicionar `UserCog` ao import de `lucide-react` (linha 2-6), e um novo item ao array `NAV`, dentro da seção "Gestão" (antes de `/relatorios`):

```javascript
  { path: '/colaboradores', label: 'Colaboradores', icon: UserCog, perfis: ['diretoria','rh'] },
```

- [ ] **Step 5: Adicionar as rotas em `frontend/src/App.jsx`**

Import, junto dos demais imports de página:

```javascript
import ColaboradoresPage from './pages/colaboradores/ColaboradoresPage'
```

`ROUTE_TITLES`, adicionar entrada:

```javascript
  '/colaboradores':  { title: 'Colaboradores',      subtitle: 'Cadastro e departamento pessoal' },
```

Dentro de `<Routes>`, junto das demais rotas protegidas:

```javascript
            <Route path="/colaboradores" element={<ColaboradoresPage />} />
```

(Não é preciso rota `/colaboradores/:id` separada nesta entrega — o detalhe abre como drawer sobre a própria listagem, mesmo padrão do módulo Especificadores antes de `EspecificadorDetalhePage` existir; navegação direta por URL fica de fora do escopo.)

- [ ] **Step 6: Criar `frontend/src/pages/colaboradores/ColaboradoresPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Plus, Search, Settings } from 'lucide-react'
import { colaboradoresApi, departamentosApi, cargosApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import { REGIME_CONFIG, STATUS_COLOR_CLASSES, validarCPF } from '../../lib/constants'
import ColaboradorDrawer from './ColaboradorDrawer'
import clsx from 'clsx'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('')
  const [filtroRegime, setFiltroRegime] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('true')
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [showDeptCargoModal, setShowDeptCargoModal] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState(null)

  const carregarDepartamentosECargos = () => {
    departamentosApi.list().then(r => setDepartamentos(r.data)).catch(console.error)
    cargosApi.list().then(r => setCargos(r.data)).catch(console.error)
  }

  const fetchLista = () => {
    const params = {}
    if (busca) params.busca = busca
    if (filtroDepartamento) params.departamento_id = filtroDepartamento
    if (filtroCargo) params.cargo_id = filtroCargo
    if (filtroRegime) params.regime = filtroRegime
    if (filtroStatus) params.is_active = filtroStatus
    colaboradoresApi.list(params)
      .then(r => setColaboradores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarDepartamentosECargos() }, [])
  useEffect(() => {
    let ignore = false
    setLoading(true)
    const params = {}
    if (busca) params.busca = busca
    if (filtroDepartamento) params.departamento_id = filtroDepartamento
    if (filtroCargo) params.cargo_id = filtroCargo
    if (filtroRegime) params.regime = filtroRegime
    if (filtroStatus) params.is_active = filtroStatus
    colaboradoresApi.list(params)
      .then(r => { if (!ignore) setColaboradores(r.data) })
      .catch(console.error)
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [busca, filtroDepartamento, filtroCargo, filtroRegime, filtroStatus])

  if (loading && colaboradores.length === 0) return <LoadingPage />

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar colaborador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <select className="input w-44" value={filtroDepartamento} onChange={e => setFiltroDepartamento(e.target.value)}>
          <option value="">Todos os departamentos</option>
          {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>

        <select className="input w-40" value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}>
          <option value="">Todos os cargos</option>
          {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <select className="input w-32" value={filtroRegime} onChange={e => setFiltroRegime(e.target.value)}>
          <option value="">CLT/PJ</option>
          <option value="clt">CLT</option>
          <option value="pj">PJ</option>
        </select>

        <select className="input w-36" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="true">Ativos</option>
          <option value="false">Desligados</option>
          <option value="">Todos</option>
        </select>

        <button onClick={() => setShowDeptCargoModal(true)} className="btn-secondary btn-sm gap-1.5">
          <Settings size={13} /> Departamentos & Cargos
        </button>
        <button onClick={() => setShowNovoModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Colaborador
        </button>
      </div>

      {colaboradores.length === 0 ? (
        <EmptyState title="Nenhum colaborador encontrado" description="Tente ajustar os filtros ou cadastre um novo." />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Regime</th>
                <th>Admissão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map(c => (
                <tr key={c.id}>
                  <td>
                    <button
                      className="font-medium text-stone-800 hover:text-primary-600 transition-colors text-left"
                      onClick={() => setSelecionadoId(c.id)}
                    >
                      {c.nome}
                    </button>
                  </td>
                  <td>{c.cargo_nome || '—'}</td>
                  <td>{c.departamento_nome || '—'}</td>
                  <td>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[REGIME_CONFIG[c.regime]?.color || 'stone'])}>
                      {REGIME_CONFIG[c.regime]?.label || c.regime}
                    </span>
                  </td>
                  <td>{c.data_admissao}</td>
                  <td>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[c.is_active ? 'green' : 'stone'])}>
                      {c.is_active ? 'Ativo' : 'Desligado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DepartamentosCargosModal
        open={showDeptCargoModal}
        onClose={() => setShowDeptCargoModal(false)}
        departamentos={departamentos}
        cargos={cargos}
        onChanged={carregarDepartamentosECargos}
      />

      <NovoColaboradorModal
        open={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        departamentos={departamentos}
        cargos={cargos}
        colaboradores={colaboradores}
        onSaved={() => { setShowNovoModal(false); fetchLista() }}
      />

      {selecionadoId && (
        <ColaboradorDrawer
          colaboradorId={selecionadoId}
          onClose={() => setSelecionadoId(null)}
          onUpdated={fetchLista}
        />
      )}
    </div>
  )
}

// === Modal Departamentos & Cargos ===
function DepartamentosCargosModal({ open, onClose, departamentos, cargos, onChanged }) {
  const [novoDept, setNovoDept] = useState('')
  const [novoCargoNome, setNovoCargoNome] = useState('')
  const [novoCargoDept, setNovoCargoDept] = useState('')
  const [error, setError] = useState('')

  const criarDepartamento = async () => {
    if (!novoDept.trim()) return
    try {
      await departamentosApi.create({ nome: novoDept.trim() })
      setNovoDept('')
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao criar departamento')) }
  }

  const criarCargo = async () => {
    if (!novoCargoNome.trim() || !novoCargoDept) return
    try {
      await cargosApi.create({ nome: novoCargoNome.trim(), departamento_id: Number(novoCargoDept) })
      setNovoCargoNome('')
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao criar cargo')) }
  }

  const toggleDeptAtivo = async (dept) => {
    await departamentosApi.update(dept.id, { ativo: !dept.ativo })
    onChanged()
  }

  const toggleCargoAtivo = async (cargo) => {
    await cargosApi.update(cargo.id, { ativo: !cargo.ativo })
    onChanged()
  }

  return (
    <Modal open={open} onClose={onClose} title="Departamentos & Cargos" size="lg">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-stone-700 text-sm mb-2">Departamentos</h3>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" value={novoDept} onChange={e => setNovoDept(e.target.value)} placeholder="Nome do departamento" />
            <button className="btn-secondary btn-sm" onClick={criarDepartamento}>Adicionar</button>
          </div>
          <ul className="space-y-1">
            {departamentos.map(d => (
              <li key={d.id} className="flex items-center justify-between text-sm py-1">
                <span className={clsx(!d.ativo && 'text-stone-400 line-through')}>{d.nome}</span>
                <button className="text-xs text-primary-600" onClick={() => toggleDeptAtivo(d)}>
                  {d.ativo ? 'Inativar' : 'Reativar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-stone-700 text-sm mb-2">Cargos</h3>
          <div className="flex flex-col gap-2 mb-3">
            <input className="input" value={novoCargoNome} onChange={e => setNovoCargoNome(e.target.value)} placeholder="Nome do cargo" />
            <select className="input" value={novoCargoDept} onChange={e => setNovoCargoDept(e.target.value)}>
              <option value="">Departamento...</option>
              {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <button className="btn-secondary btn-sm" onClick={criarCargo}>Adicionar</button>
          </div>
          <ul className="space-y-1">
            {cargos.map(c => (
              <li key={c.id} className="flex items-center justify-between text-sm py-1">
                <span className={clsx(!c.ativo && 'text-stone-400 line-through')}>{c.nome} <span className="text-stone-400">— {c.departamento_nome}</span></span>
                <button className="text-xs text-primary-600" onClick={() => toggleCargoAtivo(c)}>
                  {c.ativo ? 'Inativar' : 'Reativar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </Modal>
  )
}

// === Modal Novo Colaborador ===
function NovoColaboradorModal({ open, onClose, departamentos, cargos, colaboradores, onSaved }) {
  const vazio = {
    nome: '', cpf: '', data_nascimento: '', sexo: '', estado_civil: '',
    telefone: '', email_pessoal: '', email_corporativo: '',
    endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', endereco_cep: '',
    data_admissao: '', departamento_id: '', cargo_id: '', regime: 'clt', tipo_contrato: '',
    pj_cnpj: '', pj_valor_mensal: '',
    salario_clt: '', data_vigencia_salario: '',
    carga_horaria: '', escala: '', modalidade: '',
    banco: '', agencia: '', conta: '', tipo_conta: '',
    gestor_id: '',
  }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const cargosDoDept = form.departamento_id
    ? cargos.filter(c => String(c.departamento_id) === String(form.departamento_id))
    : cargos

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarCPF(form.cpf)) {
      setError('CPF inválido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        departamento_id: Number(form.departamento_id),
        cargo_id: Number(form.cargo_id),
        gestor_id: form.gestor_id ? Number(form.gestor_id) : null,
        salario_clt: form.salario_clt ? Number(form.salario_clt) : null,
        pj_valor_mensal: form.pj_valor_mensal ? Number(form.pj_valor_mensal) : null,
        data_vigencia_salario: form.data_vigencia_salario || null,
        data_nascimento: form.data_nascimento || null,
      }
      await colaboradoresApi.create(payload)
      onSaved()
      setForm(vazio)
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Colaborador" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Identificação</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label className="label">CPF *</label>
              <input className="input" required value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input type="date" className="input" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
            </div>
            <div>
              <label className="label">Sexo</label>
              <input className="input" value={form.sexo} onChange={e => set('sexo', e.target.value)} />
            </div>
            <div>
              <label className="label">Estado civil</label>
              <input className="input" value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contato</p>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
            <input className="input" type="email" placeholder="E-mail pessoal" value={form.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} />
            <input className="input" type="email" placeholder="E-mail corporativo" value={form.email_corporativo} onChange={e => set('email_corporativo', e.target.value)} />
            <input className="input col-span-2" placeholder="Logradouro" value={form.endereco_logradouro} onChange={e => set('endereco_logradouro', e.target.value)} />
            <input className="input" placeholder="Número" value={form.endereco_numero} onChange={e => set('endereco_numero', e.target.value)} />
            <input className="input" placeholder="Bairro" value={form.endereco_bairro} onChange={e => set('endereco_bairro', e.target.value)} />
            <input className="input" placeholder="Cidade" value={form.endereco_cidade} onChange={e => set('endereco_cidade', e.target.value)} />
            <input className="input" placeholder="UF" maxLength={2} value={form.endereco_estado} onChange={e => set('endereco_estado', e.target.value.toUpperCase())} />
            <input className="input" placeholder="CEP" value={form.endereco_cep} onChange={e => set('endereco_cep', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contratação</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data de admissão *</label>
              <input type="date" className="input" required value={form.data_admissao} onChange={e => set('data_admissao', e.target.value)} />
            </div>
            <div>
              <label className="label">Departamento *</label>
              <select className="input" required value={form.departamento_id} onChange={e => { set('departamento_id', e.target.value); set('cargo_id', '') }}>
                <option value="" disabled>Selecione...</option>
                {departamentos.filter(d => d.ativo).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cargo *</label>
              <select className="input" required value={form.cargo_id} onChange={e => set('cargo_id', e.target.value)}>
                <option value="" disabled>Selecione...</option>
                {cargosDoDept.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Regime *</label>
              <select className="input" required value={form.regime} onChange={e => set('regime', e.target.value)}>
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
              </select>
            </div>
            <div>
              <label className="label">Tipo de contrato</label>
              <input className="input" value={form.tipo_contrato} onChange={e => set('tipo_contrato', e.target.value)} />
            </div>
            <div>
              <label className="label">Gestor direto</label>
              <select className="input" value={form.gestor_id} onChange={e => set('gestor_id', e.target.value)}>
                <option value="">Sem gestor</option>
                {colaboradores.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {form.regime === 'pj' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="CNPJ" value={form.pj_cnpj} onChange={e => set('pj_cnpj', e.target.value)} />
              <input className="input" type="number" step="0.01" placeholder="Valor mensal" value={form.pj_valor_mensal} onChange={e => set('pj_valor_mensal', e.target.value)} />
            </div>
          </div>
        )}

        {form.regime === 'clt' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Remuneração inicial</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" step="0.01" placeholder="Salário CLT" value={form.salario_clt} onChange={e => set('salario_clt', e.target.value)} />
              <input type="date" className="input" placeholder="Vigência" value={form.data_vigencia_salario} onChange={e => set('data_vigencia_salario', e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</p>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Carga horária" value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)} />
            <input className="input" placeholder="Escala" value={form.escala} onChange={e => set('escala', e.target.value)} />
            <select className="input" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
              <option value="">Modalidade...</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados bancários</p>
          <div className="grid grid-cols-4 gap-3">
            <input className="input" placeholder="Banco" value={form.banco} onChange={e => set('banco', e.target.value)} />
            <input className="input" placeholder="Agência" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
            <input className="input" placeholder="Conta" value={form.conta} onChange={e => set('conta', e.target.value)} />
            <select className="input" value={form.tipo_conta} onChange={e => set('tipo_conta', e.target.value)}>
              <option value="">Tipo...</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Colaborador'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

`ColaboradorDrawer` ainda não existe (Task 2) — o `import` no topo do arquivo fará o build falhar até lá. Isso é esperado dentro desta task; o `npm run build` só fecha verde ao final da Task 2.

- [ ] **Step 7: Rodar o build parcial**

Run: `cd frontend && npm run lint`
Expected: PASS (lint não depende de `ColaboradorDrawer` existir para resolver, mas se o resolver de import do ESLint acusar módulo ausente, ignorar — será resolvido na Task 2; o essencial aqui é não haver erro de sintaxe/JSX no arquivo criado).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/api.js frontend/src/lib/constants.js frontend/src/store/index.js frontend/src/components/layout/Sidebar.jsx frontend/src/App.jsx frontend/src/pages/colaboradores/ColaboradoresPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add fundacao e listagem do modulo Colaboradores

colaboradoresApi/departamentosApi/cargosApi, constantes (REGIME_CONFIG,
labels, validarCPF espelhando o backend), helper de perfil
podeGerenciarColaboradores, item de sidebar e rota /colaboradores.
ColaboradoresPage: listagem com filtros, gestao simples de
Departamentos/Cargos e modal completo de novo colaborador.

O build so fecha verde apos a Task 2 (ColaboradorDrawer, importado
aqui, ainda nao existe).
EOF
)"
```

---

## Task 2: Drawer e aba Perfil (dados, organograma, editar, desligar)

**Files:**
- Create: `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`
- Create: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi` (Task 1).
- Produces: `ColaboradorDrawer({ colaboradorId, onClose, onUpdated })`, `PerfilTab`, `EditarColaboradorModal`, `DesligarModal` (exportadas de `ColaboradorTabs.jsx`, consumidas também pelas Tasks 3-5 que adicionam as outras abas ao mesmo arquivo).

- [ ] **Step 1: Criar `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { colaboradoresApi } from '../../lib/api'
import { Tabs, Spinner } from '../../components/ui'
import { PerfilTab } from './ColaboradorTabs'

export default function ColaboradorDrawer({ colaboradorId, onClose, onUpdated }) {
  const [colaborador, setColaborador] = useState(null)
  const [tab, setTab] = useState('perfil')

  const carregar = () => {
    colaboradoresApi.get(colaboradorId).then(r => setColaborador(r.data)).catch(console.error)
  }

  useEffect(() => {
    let ignore = false
    colaboradoresApi.get(colaboradorId)
      .then(r => { if (!ignore) setColaborador(r.data) })
      .catch(err => { if (!ignore) console.error(err) })
    return () => { ignore = true }
  }, [colaboradorId])

  if (!colaborador) {
    return (
      <div className="fixed inset-y-0 right-0 w-[32rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex items-center justify-center animate-slide-in-right">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[32rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <p className="font-semibold text-stone-800">{colaborador.nome}</p>
          <p className="text-xs text-stone-400">{colaborador.cargo_nome} — {colaborador.departamento_nome}</p>
        </div>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>

      <div className="px-5 pt-4">
        <Tabs
          tabs={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'remuneracao', label: 'Remuneração' },
            { key: 'cargo', label: 'Cargo & Progressão' },
            { key: 'documentos', label: 'Documentos' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && (
          <PerfilTab
            colaborador={colaborador}
            onUpdated={() => { carregar(); onUpdated?.() }}
          />
        )}
        {tab === 'remuneracao' && <RemuneracaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'cargo' && <CargoProgressaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'documentos' && <DocumentosTab colaborador={colaborador} />}
      </div>
    </div>
  )
}

// Placeholders até as Tasks 3-5 substituírem por imports reais de ColaboradorTabs.jsx.
function RemuneracaoTab() { return null }
function CargoProgressaoTab() { return null }
function DocumentosTab() { return null }
```

- [ ] **Step 2: Criar `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`**

```jsx
import { useState } from 'react'
import { colaboradoresApi } from '../../lib/api'
import { formatDate, REGIME_CONFIG, MODALIDADE_LABELS, TIPO_DESLIGAMENTO_LABELS } from '../../lib/constants'
import { Modal } from '../../components/ui'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

// === Aba Perfil ===
export function PerfilTab({ colaborador, onUpdated }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDesligar, setShowDesligar] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        {colaborador.is_active && (
          <button className="btn-secondary btn-sm text-red-600" onClick={() => setShowDesligar(true)}>Desligar</button>
        )}
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      {!colaborador.is_active && (
        <div className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          Desligado em {formatDate(colaborador.data_desligamento)} — {TIPO_DESLIGAMENTO_LABELS[colaborador.tipo_desligamento] || colaborador.tipo_desligamento}
          {colaborador.motivo_desligamento && <p className="text-xs text-stone-400 mt-1">{colaborador.motivo_desligamento}</p>}
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Identificação</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="CPF" valor={colaborador.cpf} />
          <Campo label="Data de nascimento" valor={formatDate(colaborador.data_nascimento)} />
          <Campo label="Sexo" valor={colaborador.sexo} />
          <Campo label="Estado civil" valor={colaborador.estado_civil} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contato</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Telefone" valor={colaborador.telefone} />
          <Campo label="E-mail pessoal" valor={colaborador.email_pessoal} />
          <Campo label="E-mail corporativo" valor={colaborador.email_corporativo} />
          <Campo label="Cidade/UF" valor={colaborador.endereco_cidade ? `${colaborador.endereco_cidade}/${colaborador.endereco_estado || ''}` : null} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contratação</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Admissão" valor={formatDate(colaborador.data_admissao)} />
          <Campo label="Regime" valor={REGIME_CONFIG[colaborador.regime]?.label || colaborador.regime} />
          <Campo label="Modalidade" valor={MODALIDADE_LABELS[colaborador.modalidade]} />
          <Campo label="Carga horária" valor={colaborador.carga_horaria} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Organograma</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
          <Campo label="Gestor direto" valor={colaborador.gestor_nome} />
        </dl>
        {colaborador.subordinados_diretos?.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-1">Subordinados diretos</p>
            <ul className="space-y-1">
              {colaborador.subordinados_diretos.map(s => (
                <li key={s.id} className="text-sm text-stone-700">{s.nome} <span className="text-stone-400">— {s.cargo_nome}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <EditarColaboradorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        colaborador={colaborador}
        onSaved={() => { setShowEdit(false); onUpdated?.() }}
      />
      <DesligarModal
        open={showDesligar}
        onClose={() => setShowDesligar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowDesligar(false); onUpdated?.() }}
      />
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div>
      <dt className="text-stone-400 text-xs">{label}</dt>
      <dd className="text-stone-700">{valor || '—'}</dd>
    </div>
  )
}

// === Modal Editar (dados cadastrais — nunca salario/cargo atuais) ===
export function EditarColaboradorModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState(() => ({
    telefone: colaborador.telefone || '',
    email_pessoal: colaborador.email_pessoal || '',
    email_corporativo: colaborador.email_corporativo || '',
    endereco_logradouro: colaborador.endereco_logradouro || '',
    endereco_numero: colaborador.endereco_numero || '',
    endereco_bairro: colaborador.endereco_bairro || '',
    endereco_cidade: colaborador.endereco_cidade || '',
    endereco_estado: colaborador.endereco_estado || '',
    endereco_cep: colaborador.endereco_cep || '',
    carga_horaria: colaborador.carga_horaria || '',
    modalidade: colaborador.modalidade || '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, form)
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Colaborador" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          <input className="input" type="email" placeholder="E-mail pessoal" value={form.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} />
          <input className="input col-span-2" type="email" placeholder="E-mail corporativo" value={form.email_corporativo} onChange={e => set('email_corporativo', e.target.value)} />
          <input className="input col-span-2" placeholder="Logradouro" value={form.endereco_logradouro} onChange={e => set('endereco_logradouro', e.target.value)} />
          <input className="input" placeholder="Número" value={form.endereco_numero} onChange={e => set('endereco_numero', e.target.value)} />
          <input className="input" placeholder="Bairro" value={form.endereco_bairro} onChange={e => set('endereco_bairro', e.target.value)} />
          <input className="input" placeholder="Cidade" value={form.endereco_cidade} onChange={e => set('endereco_cidade', e.target.value)} />
          <input className="input" placeholder="UF" maxLength={2} value={form.endereco_estado} onChange={e => set('endereco_estado', e.target.value.toUpperCase())} />
          <input className="input" placeholder="CEP" value={form.endereco_cep} onChange={e => set('endereco_cep', e.target.value)} />
          <input className="input" placeholder="Carga horária" value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)} />
          <select className="input" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
            <option value="">Modalidade...</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
            <option value="remoto">Remoto</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Modal Desligar ===
export function DesligarModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ data_desligamento: '', tipo_desligamento: '', motivo_desligamento: '', entrevista_saida: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.desligar(colaborador.id, form)
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao desligar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Desligar ${colaborador.nome}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Data de desligamento *</label>
          <input type="date" className="input" required value={form.data_desligamento} onChange={e => set('data_desligamento', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input" required value={form.tipo_desligamento} onChange={e => set('tipo_desligamento', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {Object.entries(TIPO_DESLIGAMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Motivo *</label>
          <textarea className="input" required rows={3} value={form.motivo_desligamento} onChange={e => set('motivo_desligamento', e.target.value)} />
        </div>
        <div>
          <label className="label">Entrevista de saída</label>
          <textarea className="input" rows={2} value={form.entrevista_saida} onChange={e => set('entrevista_saida', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-danger" disabled={loading}>
            {loading ? 'Desligando...' : 'Confirmar desligamento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build`
Expected: PASS. Depois: `npm run lint` → PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/colaboradores/ColaboradorDrawer.jsx frontend/src/pages/colaboradores/ColaboradorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add drawer e aba Perfil do modulo Colaboradores

ColaboradorDrawer com abas (Perfil real; Remuneracao/Cargo &
Progressao/Documentos como placeholder ate as proximas tasks).
PerfilTab mostra dados cadastrais, organograma (gestor + subordinados
diretos) e acoes Editar/Desligar. EditarColaboradorModal nunca inclui
salario/cargo atuais (RH-RN001).
EOF
)"
```

---

## Task 3: Aba Remuneração

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.historicoSalarial`, `colaboradoresApi.lancarSalario` (backend Task 3).
- Produces: `RemuneracaoTab` real (substitui o placeholder da Task 2).

- [ ] **Step 1: Implementar `RemuneracaoTab` em `ColaboradorTabs.jsx`**

No topo do arquivo, trocar os três imports:

```javascript
import { useEffect, useState } from 'react'
import { formatDate, formatCurrency, REGIME_CONFIG, MODALIDADE_LABELS, TIPO_DESLIGAMENTO_LABELS } from '../../lib/constants'
import { Modal, Spinner } from '../../components/ui'
```

E adicionar no final do arquivo:

```jsx
// === Aba Remuneração ===
export function RemuneracaoTab({ colaborador, onUpdated }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLancar, setShowLancar] = useState(false)

  const carregar = () => {
    colaboradoresApi.historicoSalarial(colaborador.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-xs text-stone-400">Salário CLT atual</p>
        <p className="text-xl font-semibold text-stone-800">{formatCurrency(colaborador.salario_clt)}</p>
        {colaborador.remuneracao_complementar > 0 && (
          <p className="text-xs text-stone-500 mt-1">+ {formatCurrency(colaborador.remuneracao_complementar)} complementar</p>
        )}
        <p className="text-xs text-stone-400 mt-1">Vigente desde {formatDate(colaborador.data_vigencia_salario)}</p>
      </div>

      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowLancar(true)}>Lançar novo salário</button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
        {loading ? <Spinner size={18} /> : historico.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhum registro.</p>
        ) : (
          <ul className="space-y-2">
            {historico.map(h => (
              <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                <p className="text-stone-700 font-medium">{formatCurrency(h.salario_clt)}</p>
                <p className="text-xs text-stone-400">{formatDate(h.data_vigencia)} — {h.motivo} — {h.registrado_por_nome}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LancarSalarioModal
        open={showLancar}
        onClose={() => setShowLancar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowLancar(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}

function LancarSalarioModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ salario_clt: '', remuneracao_complementar: '', data_vigencia: '', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.lancarSalario(colaborador.id, {
        salario_clt: Number(form.salario_clt),
        remuneracao_complementar: form.remuneracao_complementar ? Number(form.remuneracao_complementar) : null,
        data_vigencia: form.data_vigencia,
        motivo: form.motivo,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao lançar salário'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar novo salário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Salário CLT *</label>
          <input type="number" step="0.01" className="input" required value={form.salario_clt} onChange={e => set('salario_clt', e.target.value)} />
        </div>
        <div>
          <label className="label">Remuneração complementar</label>
          <input type="number" step="0.01" className="input" value={form.remuneracao_complementar} onChange={e => set('remuneracao_complementar', e.target.value)} />
        </div>
        <div>
          <label className="label">Vigência *</label>
          <input type="date" className="input" required value={form.data_vigencia} onChange={e => set('data_vigencia', e.target.value)} />
        </div>
        <div>
          <label className="label">Motivo *</label>
          <input className="input" required value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Ex: Reajuste anual" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Ligar a aba real em `ColaboradorDrawer.jsx`**

Trocar o import:

```javascript
import { PerfilTab, RemuneracaoTab } from './ColaboradorTabs'
```

E remover a função `function RemuneracaoTab() { return null }` do final do arquivo (as outras duas — `CargoProgressaoTab`, `DocumentosTab` — continuam como placeholder até as próximas tasks).

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/colaboradores/ColaboradorDrawer.jsx frontend/src/pages/colaboradores/ColaboradorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add aba Remuneracao do modulo Colaboradores

Mostra salario atual + historico (somente leitura) e formulario de
novo lancamento, que atualiza o valor atual e fica registrado no
historico imutavel (backend ja garante RH-RN001).
EOF
)"
```

---

## Task 4: Aba Cargo & Progressão

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.historicoCargo`, `colaboradoresApi.promover`, `cargosApi.list` (backend Task 4).
- Produces: `CargoProgressaoTab` real.

- [ ] **Step 1: Implementar `CargoProgressaoTab` em `ColaboradorTabs.jsx`**

No topo do arquivo, trocar o import de `lib/api`:

```javascript
import { colaboradoresApi, cargosApi } from '../../lib/api'
```

E adicionar no final do arquivo:

```jsx
// === Aba Cargo & Progressão ===
export function CargoProgressaoTab({ colaborador, onUpdated }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPromover, setShowPromover] = useState(false)

  const carregar = () => {
    colaboradoresApi.historicoCargo(colaborador.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-xs text-stone-400">Cargo atual</p>
        <p className="text-lg font-semibold text-stone-800">{colaborador.cargo_nome}</p>
        <p className="text-xs text-stone-400 mt-1">{colaborador.departamento_nome}</p>
      </div>

      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowPromover(true)}>Registrar promoção</button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
        {loading ? <Spinner size={18} /> : historico.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhum registro.</p>
        ) : (
          <ul className="space-y-2">
            {historico.map(h => (
              <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                <p className="text-stone-700 font-medium">
                  {h.cargo_anterior_nome ? `${h.cargo_anterior_nome} → ${h.cargo_novo_nome}` : h.cargo_novo_nome}
                </p>
                <p className="text-xs text-stone-400">{formatDate(h.data)} — {h.justificativa || 'Sem justificativa'} — {h.aprovado_por_nome}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PromoverModal
        open={showPromover}
        onClose={() => setShowPromover(false)}
        colaborador={colaborador}
        onSaved={() => { setShowPromover(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}

function PromoverModal({ open, onClose, colaborador, onSaved }) {
  const [cargos, setCargos] = useState([])
  const [form, setForm] = useState({ cargo_novo_id: '', data: '', justificativa: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) cargosApi.list().then(r => setCargos(r.data.filter(c => c.ativo))).catch(console.error)
  }, [open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.promover(colaborador.id, {
        cargo_novo_id: Number(form.cargo_novo_id),
        data: form.data,
        justificativa: form.justificativa || null,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao registrar promoção'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar promoção" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Novo cargo *</label>
          <select className="input" required value={form.cargo_novo_id} onChange={e => set('cargo_novo_id', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {cargos.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.departamento_nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data *</label>
          <input type="date" className="input" required value={form.data} onChange={e => set('data', e.target.value)} />
        </div>
        <div>
          <label className="label">Justificativa</label>
          <textarea className="input" rows={3} value={form.justificativa} onChange={e => set('justificativa', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Ligar a aba real em `ColaboradorDrawer.jsx`**

```javascript
import { PerfilTab, RemuneracaoTab, CargoProgressaoTab } from './ColaboradorTabs'
```

Remover `function CargoProgressaoTab() { return null }` do final do arquivo (só `DocumentosTab` continua placeholder).

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/colaboradores/ColaboradorDrawer.jsx frontend/src/pages/colaboradores/ColaboradorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add aba Cargo & Progressao do modulo Colaboradores

Mostra cargo atual + historico de promocoes (somente leitura) e
formulario de nova promocao, que atualiza o cargo atual e fica
registrada no historico imutavel.
EOF
)"
```

---

## Task 5: Aba Documentos

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.listarDocumentos`, `.adicionarDocumento`, `.removerDocumento` (backend Task 6).
- Produces: `DocumentosTab` real.

- [ ] **Step 1: Implementar `DocumentosTab` em `ColaboradorTabs.jsx`**

Ampliar o import de `lib/constants`:

```javascript
import { formatDate, formatCurrency, REGIME_CONFIG, MODALIDADE_LABELS, TIPO_DESLIGAMENTO_LABELS, TIPO_DOCUMENTO_COLABORADOR_LABELS } from '../../lib/constants'
```

No final do arquivo:

```jsx
// === Aba Documentos ===
export function DocumentosTab({ colaborador }) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdicionar, setShowAdicionar] = useState(false)

  const carregar = () => {
    colaboradoresApi.listarDocumentos(colaborador.id)
      .then(r => setDocumentos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [colaborador.id])

  const remover = async (documentoId) => {
    await colaboradoresApi.removerDocumento(colaborador.id, documentoId)
    carregar()
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowAdicionar(true)}>Adicionar documento</button>
      </div>

      {loading ? <Spinner size={18} /> : documentos.length === 0 ? (
        <p className="text-sm text-stone-400">Nenhum documento cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {documentos.map(d => (
            <li key={d.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-stone-700 font-medium">{TIPO_DOCUMENTO_COLABORADOR_LABELS[d.tipo] || d.tipo}</p>
                <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">Abrir documento</a>
                {d.data_vencimento && <p className="text-xs text-stone-400">Vence em {formatDate(d.data_vencimento)}</p>}
              </div>
              <button className="text-xs text-red-600" onClick={() => remover(d.id)}>Remover</button>
            </li>
          ))}
        </ul>
      )}

      <AdicionarDocumentoModal
        open={showAdicionar}
        onClose={() => setShowAdicionar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowAdicionar(false); carregar() }}
      />
    </div>
  )
}

function AdicionarDocumentoModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ tipo: '', url: '', data_vencimento: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.adicionarDocumento(colaborador.id, {
        tipo: form.tipo,
        url: form.url,
        data_vencimento: form.data_vencimento || null,
      })
      onSaved()
      setForm({ tipo: '', url: '', data_vencimento: '' })
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao adicionar documento'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar documento" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tipo *</label>
          <select className="input" required value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {Object.entries(TIPO_DOCUMENTO_COLABORADOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">URL *</label>
          <input className="input" required type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="label">Data de vencimento</label>
          <input type="date" className="input" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Ligar a aba real em `ColaboradorDrawer.jsx`**

Trocar o import final e remover por completo o bloco de placeholders:

```javascript
import { PerfilTab, RemuneracaoTab, CargoProgressaoTab, DocumentosTab } from './ColaboradorTabs'
```

Apagar as três linhas de placeholder (`function RemuneracaoTab...`, já removida na Task 3; `function CargoProgressaoTab...`, já removida na Task 4; `function DocumentosTab() { return null }`, remover agora).

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build && npm run lint`
Expected: PASS — nenhum placeholder restante, todas as 4 abas ligadas às implementações reais.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/colaboradores/ColaboradorDrawer.jsx frontend/src/pages/colaboradores/ColaboradorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add aba Documentos do modulo Colaboradores

Lista/adiciona/remove documentos (campo de URL, sem upload real —
mesmo padrao do resto do projeto). Fecha as 4 abas do drawer de
Colaborador (Perfil, Remuneracao, Cargo & Progressao, Documentos).
EOF
)"
```

---

## Task 6: Aba Contratação

> Adicionada após a revisão final de branch das Tasks 1-5: o spec original (`docs/superpowers/specs/2026-07-26-colaboradores-rh01-design.md:243`) previa uma aba "Contratação" com regime, cargo, departamento, campos PJ, regime de trabalho e dados bancários. O plano inicial não a incluiu, e a revisão de branch confirmou que `pj_cnpj`/`pj_valor_mensal`/`pj_vigencia_*`, dados bancários e `gestor_id` ficaram write-only (só setados no cadastro, nunca visíveis nem editáveis depois). Decisão do humano: adicionar esta task antes do merge.

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorDrawer.jsx`
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.get` (já existe), `colaboradoresApi.update` (já existe — `ColaboradorUpdate` no backend já aceita `tipo_contrato`, `pj_cnpj`, `pj_contrato_url`, `pj_valor_mensal`, `pj_vigencia_inicio`, `pj_vigencia_fim`, `escala`, `jornada_especial`, `banco`, `agencia`, `conta`, `tipo_conta`, `gestor_id` — nenhum endpoint novo é necessário), `colaboradoresApi.list` (para o roster de gestor).
- Produces: `ContratacaoTab`, `EditarContratacaoModal` (não exportado, uso interno).

**Escopo desta task (o que NÃO faz parte):** `cargo_id`/`departamento_id` não são editáveis aqui — o backend não os aceita em `ColaboradorUpdate` (RH-RN001: mudança de cargo só via `POST /colaboradores/{id}/historico-cargo`, já coberto pela aba Cargo & Progressão). `carga_horaria` e `modalidade` já são editados na aba Perfil (`EditarColaboradorModal`, Task 2) — não duplicar esses dois campos aqui.

**Importante — padrão de modal a seguir:** ao contrário de `LancarSalarioModal`/`PromoverModal`/`AdicionarDocumentoModal` (Tasks 3-5, que começam com form vazio e usam `resetForm`/`handleClose`), o `EditarContratacaoModal` desta task **deriva seus valores iniciais da prop `colaborador`**, exatamente como `EditarColaboradorModal` (Task 2, mesmo arquivo). Use o MESMO padrão de `EditarColaboradorModal`: uma função `buildContratacaoForm(colaborador)` fora do componente, e dentro do componente `const [prevColaborador, setPrevColaborador] = useState(colaborador)` com a checagem `if (colaborador !== prevColaborador) { setPrevColaborador(colaborador); setForm(buildContratacaoForm(colaborador)) }` durante o render — **não** use `resetForm`/`handleClose` aqui, esse padrão é para modais de form vazio, não para modais de edição de dados existentes.

- [ ] **Step 1: Implementar `ContratacaoTab` e `EditarContratacaoModal` em `ColaboradorTabs.jsx`**

No topo do arquivo, a lista de imports de `../../lib/api` já inclui `colaboradoresApi`; adicione `cargosApi` já está lá também (usado por `PromoverModal`) — sem mudança de import necessária além de nenhuma, já que tudo que esta task usa (`colaboradoresApi.update`, `colaboradoresApi.list`) já está disponível.

No final do arquivo, adicionar:

```jsx
// === Aba Contratação ===
export function ContratacaoTab({ colaborador, onUpdated }) {
  const [showEdit, setShowEdit] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contrato</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Regime" valor={REGIME_CONFIG[colaborador.regime]?.label || colaborador.regime} />
          <Campo label="Tipo de contrato" valor={colaborador.tipo_contrato} />
        </dl>
      </section>

      {colaborador.regime === 'pj' && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo label="CNPJ" valor={colaborador.pj_cnpj} />
            <Campo label="Valor mensal" valor={colaborador.pj_valor_mensal ? formatCurrency(colaborador.pj_valor_mensal) : null} />
            <Campo label="Vigência início" valor={formatDate(colaborador.pj_vigencia_inicio)} />
            <Campo label="Vigência fim" valor={formatDate(colaborador.pj_vigencia_fim)} />
          </dl>
          {colaborador.pj_contrato_url && (
            <a href={colaborador.pj_contrato_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">Abrir contrato</a>
          )}
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Escala" valor={colaborador.escala} />
          <Campo label="Jornada especial" valor={colaborador.jornada_especial} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados bancários</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Banco" valor={colaborador.banco} />
          <Campo label="Agência" valor={colaborador.agencia} />
          <Campo label="Conta" valor={colaborador.conta} />
          <Campo label="Tipo de conta" valor={colaborador.tipo_conta === 'corrente' ? 'Corrente' : colaborador.tipo_conta === 'poupanca' ? 'Poupança' : colaborador.tipo_conta} />
        </dl>
      </section>

      <EditarContratacaoModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        colaborador={colaborador}
        onSaved={() => { setShowEdit(false); onUpdated?.() }}
      />
    </div>
  )
}

function buildContratacaoForm(colaborador) {
  return {
    tipo_contrato: colaborador.tipo_contrato || '',
    pj_cnpj: colaborador.pj_cnpj || '',
    pj_contrato_url: colaborador.pj_contrato_url || '',
    pj_valor_mensal: colaborador.pj_valor_mensal ?? '',
    pj_vigencia_inicio: colaborador.pj_vigencia_inicio || '',
    pj_vigencia_fim: colaborador.pj_vigencia_fim || '',
    escala: colaborador.escala || '',
    jornada_especial: colaborador.jornada_especial || '',
    banco: colaborador.banco || '',
    agencia: colaborador.agencia || '',
    conta: colaborador.conta || '',
    tipo_conta: colaborador.tipo_conta || '',
    gestor_id: colaborador.gestor_id || '',
  }
}

function EditarContratacaoModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState(() => buildContratacaoForm(colaborador))
  const [prevColaborador, setPrevColaborador] = useState(colaborador)
  const [gestores, setGestores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (colaborador !== prevColaborador) {
    setPrevColaborador(colaborador)
    setForm(buildContratacaoForm(colaborador))
  }

  useEffect(() => {
    if (open) {
      colaboradoresApi.list({ is_active: 'true' })
        .then(r => setGestores(r.data.filter(c => c.id !== colaborador.id)))
        .catch(console.error)
    }
  }, [open, colaborador.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, {
        ...form,
        pj_valor_mensal: form.pj_valor_mensal === '' ? null : Number(form.pj_valor_mensal),
        pj_vigencia_inicio: form.pj_vigencia_inicio || null,
        pj_vigencia_fim: form.pj_vigencia_fim || null,
        gestor_id: form.gestor_id ? Number(form.gestor_id) : null,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar contratação'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Contratação" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contrato</p>
          <input className="input" placeholder="Tipo de contrato" value={form.tipo_contrato} onChange={e => set('tipo_contrato', e.target.value)} />
        </div>

        {colaborador.regime === 'pj' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="CNPJ" value={form.pj_cnpj} onChange={e => set('pj_cnpj', e.target.value)} />
              <input className="input" type="number" step="0.01" placeholder="Valor mensal" value={form.pj_valor_mensal} onChange={e => set('pj_valor_mensal', e.target.value)} />
              <input className="input col-span-2" type="url" placeholder="URL do contrato" value={form.pj_contrato_url} onChange={e => set('pj_contrato_url', e.target.value)} />
              <div>
                <label className="label">Vigência início</label>
                <input type="date" className="input" value={form.pj_vigencia_inicio} onChange={e => set('pj_vigencia_inicio', e.target.value)} />
              </div>
              <div>
                <label className="label">Vigência fim</label>
                <input type="date" className="input" value={form.pj_vigencia_fim} onChange={e => set('pj_vigencia_fim', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Escala" value={form.escala} onChange={e => set('escala', e.target.value)} />
            <input className="input" placeholder="Jornada especial" value={form.jornada_especial} onChange={e => set('jornada_especial', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados bancários</p>
          <div className="grid grid-cols-4 gap-3">
            <input className="input" placeholder="Banco" value={form.banco} onChange={e => set('banco', e.target.value)} />
            <input className="input" placeholder="Agência" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
            <input className="input" placeholder="Conta" value={form.conta} onChange={e => set('conta', e.target.value)} />
            <select className="input" value={form.tipo_conta} onChange={e => set('tipo_conta', e.target.value)}>
              <option value="">Tipo...</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Organograma</p>
          <select className="input" value={form.gestor_id} onChange={e => set('gestor_id', e.target.value)}>
            <option value="">Sem gestor</option>
            {gestores.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Ligar a aba real em `ColaboradorDrawer.jsx`**

Atualizar o import:

```javascript
import { PerfilTab, ContratacaoTab, RemuneracaoTab, CargoProgressaoTab, DocumentosTab } from './ColaboradorTabs'
```

Adicionar a aba na lista de `tabs` do componente `Tabs` (entre 'perfil' e 'remuneracao', seguindo a ordem do spec — Perfil, Contratação, Remuneração, Cargo & Progressão, Documentos):

```javascript
          tabs={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'contratacao', label: 'Contratação' },
            { key: 'remuneracao', label: 'Remuneração' },
            { key: 'cargo', label: 'Cargo & Progressão' },
            { key: 'documentos', label: 'Documentos' },
          ]}
```

E adicionar a renderização condicional, junto das demais:

```javascript
        {tab === 'contratacao' && <ContratacaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
```

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build && npm run lint`
Expected: PASS (ignorar os 13 erros de lint pré-existentes em arquivos não relacionados a este módulo — `Header.jsx`, `BriefingPage.jsx`, `CRMPage.jsx`, `DashboardPage.jsx`, `frontend/src/store/index.js` — confirme só que `ColaboradorDrawer.jsx`/`ColaboradorTabs.jsx` continuam sem novos erros).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/colaboradores/ColaboradorDrawer.jsx frontend/src/pages/colaboradores/ColaboradorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add aba Contratacao do modulo Colaboradores

Nova 5a aba do drawer (Contratacao) expondo em modo leitura+edicao os
campos que ficavam write-only desde o cadastro: tipo de contrato,
dados PJ (condicional a regime=pj), regime de trabalho (escala,
jornada especial), dados bancarios e reatribuicao de gestor direto.
cargo_id/departamento_id continuam fora do escopo de edicao aqui
(RH-RN001, ja cobertos pela aba Cargo & Progressao); carga_horaria e
modalidade continuam editados via aba Perfil (Task 2), sem duplicacao.
EOF
)"
```

---

## Task 7: Verificação manual end-to-end

**Files:** nenhum (só verificação).

- [ ] **Step 1: Subir backend e frontend localmente**

Seguir a seção "Como Rodar Localmente" do `CLAUDE.md` (`uvicorn app.main:app --reload --port 8000` e `npm run dev`). Logar como `admin@plannit.com.br` (perfil `diretoria`, já tem acesso ao módulo).

- [ ] **Step 2: Checklist funcional**

- [ ] Item "Colaboradores" aparece na sidebar (seção Gestão) e a página carrega vazia (sem colaboradores ainda).
- [ ] Modal "Departamentos & Cargos" cria um departamento e um cargo vinculado a ele; inativar/reativar funciona.
- [ ] Modal "Novo Colaborador" cadastra um colaborador CLT completo (identificação, contato, contratação, remuneração inicial, regime de trabalho, dados bancários); CPF inválido bloqueia o submit no client antes de chamar a API.
- [ ] Cadastrar um colaborador CLT **sem preencher o campo "Modalidade"** — deve salvar normalmente, sem erro 422 (achado Critical da revisão final, corrigido antes desta task).
- [ ] Cadastrar um segundo colaborador CLT com o campo "Regime" = PJ — campos de CNPJ/valor mensal aparecem condicionalmente; depois de salvo, abrir a aba "Contratação" e confirmar que CNPJ/valor mensal/vigência aparecem corretamente.
- [ ] Cadastrar um terceiro colaborador escolhendo o primeiro como "Gestor direto".
- [ ] Abrir o drawer do gestor — aba Perfil mostra o subordinado na lista de "Subordinados diretos"; abrir o drawer do subordinado mostra o "Gestor direto" preenchido.
- [ ] Aba Contratação: editar tipo de contrato, dados bancários e reatribuir o gestor direto de um colaborador CLT já existente — salvar e confirmar que os valores persistem ao reabrir o drawer.
- [ ] Editar (aba Perfil, botão "Editar") um colaborador que não tem `modalidade` preenchida (ex.: um cadastrado antes deste módulo existir, se houver, ou o que foi cadastrado sem modalidade acima) — deve salvar sem erro 422.
- [ ] Cadastrar um colaborador com data de admissão `01/08/2026` — a aba Perfil deve mostrar "01/08/2026", nunca "31/07/2026" (achado Critical da segunda revisão final — `formatDate` com off-by-one de fuso horário, corrigido antes desta task).
- [ ] Aba Remuneração: lançar um novo salário atualiza o valor atual mostrado no topo e aparece no histórico; abrir "Lançar novo salário", digitar algo e clicar Cancelar, reabrir — campos devem estar vazios (achado Important da revisão final, corrigido antes desta task).
- [ ] Abrir a aba Remuneração de um colaborador **PJ** (não CLT) — não deve oferecer "Lançar novo salário CLT"; deve mostrar o valor mensal PJ (ou apontar para a aba Contratação) (achado Important da segunda revisão final, corrigido antes desta task).
- [ ] Aba Cargo & Progressão: registrar uma promoção atualiza o cargo atual e aparece no histórico.
- [ ] Aba Documentos: adicionar um documento com e sem data de vencimento; remover um documento (deve pedir confirmação antes de remover, achado Important da revisão final).
- [ ] Botão "Desligar" no Perfil: preencher o formulário, confirmar — colaborador passa a aparecer como "Desligado" na listagem (filtro "Todos" ou "Desligados") e o botão "Desligar" some do drawer.
- [ ] Logar com um usuário de perfil `vendedor` (`vendedor@lidermoveis.com.br`) — item "Colaboradores" não aparece na sidebar, e acessar `/colaboradores` diretamente pela URL mostra um estado de acesso negado tratado (achado Important da revisão final — gate client-side de `podeGerenciarColaboradores`, corrigido antes desta task), não a listagem vazia com botões clicáveis.

- [ ] **Step 3: Reportar resultado**

Se todos os itens passarem, o RH01 está funcionalmente completo. Qualquer item que falhar deve ser corrigido antes de considerar o plano concluído — não commitar workarounds silenciosos.
