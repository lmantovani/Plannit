import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import { TIPO_ARQUITETO_LABELS, TIPO_ARQUITETO_COLORS, STATUS_COLOR_CLASSES } from '../../lib/constants'
import { useAuthStore, podeVerTudo } from '../../store'
import EspecificadorDrawer from './EspecificadorDrawer'
import clsx from 'clsx'

export function TipoBadge({ tipo }) {
  if (!tipo) return <span className="text-stone-300 text-xs">—</span>
  const color = TIPO_ARQUITETO_COLORS[tipo] || 'stone'
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[color])}>
      {TIPO_ARQUITETO_LABELS[tipo] || tipo}
    </span>
  )
}

export default function EspecificadoresPage() {
  const { user } = useAuthStore()
  const [especificadores, setEspecificadores] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState(null)

  const podeGerenciarVendedores = podeVerTudo(user?.perfil)

  const fetchLista = async () => {
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroVendedor) params.vendedor_id = filtroVendedor
      const { data } = await arquitetosApi.list(params)
      setEspecificadores(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLista() }, [filtroTipo, filtroVendedor])

  useEffect(() => {
    if (podeGerenciarVendedores) {
      usersApi.list().then(r => setVendedores(r.data.filter(u => u.perfil === 'vendedor'))).catch(console.error)
    }
  }, [podeGerenciarVendedores])

  const filtrados = especificadores
    .filter(a => !search || a.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  if (loading) return <LoadingPage />

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar especificador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <select className="input w-40" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {podeGerenciarVendedores && (
          <select className="input w-48" value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}

        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum especificador encontrado" description="Tente ajustar os filtros ou cadastre um novo." />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Escritório</th>
                <th>Telefone</th>
                <th>Nível de parceria</th>
                <th>Vendedor vinculado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a => (
                <tr key={a.id}>
                  <td>
                    <button
                      className="font-medium text-stone-800 hover:text-primary-600 transition-colors text-left"
                      onClick={() => setSelecionadoId(a.id)}
                    >
                      {a.nome}
                    </button>
                  </td>
                  <td><TipoBadge tipo={a.tipo} /></td>
                  <td>{a.escritorio || '—'}</td>
                  <td>{a.telefone || '—'}</td>
                  <td className="capitalize">{a.nivel_parceria}</td>
                  <td>{a.vendedor_nome || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NovoEspecificadorModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchLista() }}
      />

      {selecionadoId && (
        <EspecificadorDrawer
          arquitetoId={selecionadoId}
          onClose={() => setSelecionadoId(null)}
          onUpdated={fetchLista}
        />
      )}
    </div>
  )
}

// === Modal Novo Especificador ===
function NovoEspecificadorModal({ open, onClose, onSaved }) {
  const vazio = { nome: '', tipo: '', escritorio: '', telefone: '', email: '', nivel_parceria: 'parceiro' }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, email: form.email.trim() || null }
      await arquitetosApi.create(payload)
      onSaved()
      setForm(vazio)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar especificador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Especificador" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input" required value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="" disabled>Selecione...</option>
              {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nível de parceria</label>
            <select className="input" value={form.nivel_parceria} onChange={e => set('nivel_parceria', e.target.value)}>
              <option value="parceiro">Parceiro</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="label">Escritório</label>
            <input className="input" value={form.escritorio} onChange={e => set('escritorio', e.target.value)} placeholder="Nome do escritório" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div className="col-span-2">
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Especificador'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
