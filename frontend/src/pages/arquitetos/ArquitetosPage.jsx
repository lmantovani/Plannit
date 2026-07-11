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
