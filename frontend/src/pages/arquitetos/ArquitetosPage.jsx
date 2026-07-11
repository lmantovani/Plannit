import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Phone, Mail, Building2 } from 'lucide-react'
import { arquitetosApi } from '../../lib/api'
import { Modal, ConfirmDialog, EmptyState, LoadingPage, Spinner, Tabs, ScoreBar, AlertBanner } from '../../components/ui'
import { STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG } from '../../lib/constants'
import clsx from 'clsx'

// Extrai uma mensagem exibível de um erro de API. `detail` do FastAPI pode ser
// uma string (erro de negócio) ou um array de {loc,msg,type} (erro de validação
// Pydantic, ex: e-mail vazio) — renderizar o array direto quebraria o React.
function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

// Campos opcionais em branco viram null (não undefined) antes de enviar.
// null continua no JSON e o backend trata como "limpar o campo"
// (Pydantic exclude_unset=True considera o campo como enviado); já undefined
// seria omitido do corpo da requisição e o PATCH manteria o valor antigo.
// Evita também o 422 de EmailStr em string vazia, já que None é aceito por
// Optional[EmailStr].
function sanitizeForm(form) {
  return Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]))
}

export default function ArquitetosPage() {
  const [arquitetos, setArquitetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [listError, setListError] = useState('')

  const fetchArquitetos = async () => {
    try {
      const { data } = await arquitetosApi.list()
      setArquitetos(data)
      setListError('')
    } catch (e) {
      console.error(e)
      setListError('Não foi possível carregar a lista de arquitetos.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchArquitetos() }, [])

  const filtered = arquitetos.filter(a =>
    !search ||
    (a.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    a.escritorio?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="p-6">
      {listError && (
        <div className="mb-4">
          <AlertBanner type="error" message={listError} onDismiss={() => setListError('')} />
        </div>
      )}

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
          key={selected.id}
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
      await onSubmit(sanitizeForm(form))
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar arquiteto'))
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
  { key: 'contatos', label: 'Decisores & Concorrentes' },
]

// === Drawer ===
function ArquitetoDrawer({ arquiteto, onClose, onUpdated }) {
  const [tab, setTab] = useState('perfil')
  const [atual, setAtual] = useState(arquiteto)
  const [editing, setEditing] = useState(false)
  const [confirmDesativar, setConfirmDesativar] = useState(false)
  const [desativarError, setDesativarError] = useState('')

  const [score, setScore] = useState(null)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState('')
  const scoreFetchStarted = useRef(false)

  useEffect(() => {
    if (tab === 'score' && !scoreFetchStarted.current) {
      scoreFetchStarted.current = true
      setScoreLoading(true)
      setScoreError('')
      arquitetosApi.score(atual.id)
        .then(({ data }) => setScore(data))
        .catch(() => {
          scoreFetchStarted.current = false // permite tentar de novo ao revisitar a aba
          setScoreError('Não foi possível calcular o score deste arquiteto')
        })
        .finally(() => setScoreLoading(false))
    }
  }, [tab, atual.id])

  const [contatos, setContatos] = useState(null)
  const [contatosLoading, setContatosLoading] = useState(false)
  const [contatosError, setContatosError] = useState('')
  const contatosFetchStarted = useRef(false)

  const fetchContatos = async () => {
    setContatosLoading(true)
    setContatosError('')
    try {
      const [d, c] = await Promise.all([
        arquitetosApi.listarDecisores(atual.id),
        arquitetosApi.listarConcorrentes(atual.id),
      ])
      setContatos({ decisores: d.data, concorrentes: c.data })
    } catch (e) {
      console.error(e)
      contatosFetchStarted.current = false // permite tentar de novo ao revisitar a aba
      setContatosError('Não foi possível carregar decisores e concorrentes.')
    } finally {
      setContatosLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'contatos' && !contatosFetchStarted.current) {
      contatosFetchStarted.current = true
      fetchContatos()
    }
  }, [tab, fetchContatos])

  const handleEditSubmit = async (form) => {
    const { data } = await arquitetosApi.update(atual.id, form)
    setAtual(data)
    setEditing(false)
    onUpdated()
  }

  const handleDesativar = async () => {
    try {
      await arquitetosApi.desativar(atual.id)
      setConfirmDesativar(false)
      onUpdated()
      onClose()
    } catch (err) {
      setConfirmDesativar(false)
      setDesativarError(extractErrorMessage(err, 'Erro ao desativar arquiteto'))
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40" onClick={onClose} />
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
                {desativarError && (
                  <AlertBanner type="error" message={desativarError} onDismiss={() => setDesativarError('')} />
                )}
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

          {tab === 'contatos' && (
            <ContatosTabContent
              arquitetoId={atual.id}
              contatos={contatos}
              loading={contatosLoading}
              error={contatosError}
              onRefetch={fetchContatos}
            />
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
    </>
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

// === Conteúdo da aba Decisores & Concorrentes ===
// Dados vêm do drawer pai (ArquitetoDrawer), que busca uma única vez por
// abertura de drawer e mantém em cache entre trocas de aba — mesmo padrão do
// score, para não refazer a requisição toda vez que o usuário volta à aba.
function ContatosTabContent({ arquitetoId, contatos, loading, error, onRefetch }) {
  const [editingDecisor, setEditingDecisor] = useState(undefined)
  const [editingConcorrente, setEditingConcorrente] = useState(undefined)
  const [removerDecisor, setRemoverDecisor] = useState(null)
  const [removerConcorrente, setRemoverConcorrente] = useState(null)
  const [removeError, setRemoveError] = useState('')

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!contatos) return null

  const decisores = contatos.decisores
  const concorrentes = contatos.concorrentes

  return (
    <div className="space-y-6">
      {removeError && (
        <AlertBanner type="error" message={removeError} onDismiss={() => setRemoveError('')} />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Decisores</p>
          {editingDecisor === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingDecisor(null)}>Adicionar</button>
          )}
        </div>

        {editingDecisor !== undefined && (
          <DecisorForm
            initial={editingDecisor ? {
              nome: editingDecisor.nome,
              cargo: editingDecisor.cargo || '',
              telefone: editingDecisor.telefone || '',
              email: editingDecisor.email || '',
              observacoes: editingDecisor.observacoes || '',
              is_principal: editingDecisor.is_principal,
            } : { nome: '', cargo: '', telefone: '', email: '', observacoes: '', is_principal: false }}
            onCancel={() => setEditingDecisor(undefined)}
            onSubmit={async (form) => {
              const payload = sanitizeForm(form)
              if (editingDecisor?.id) {
                await arquitetosApi.atualizarDecisor(arquitetoId, editingDecisor.id, payload)
              } else {
                await arquitetosApi.criarDecisor(arquitetoId, payload)
              }
              setEditingDecisor(undefined)
              onRefetch()
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
            initial={editingConcorrente ? {
              nome_concorrente: editingConcorrente.nome_concorrente,
              percentual_fechamento_estimado: editingConcorrente.percentual_fechamento_estimado,
              observacoes: editingConcorrente.observacoes || '',
            } : { nome_concorrente: '', percentual_fechamento_estimado: 0, observacoes: '' }}
            onCancel={() => setEditingConcorrente(undefined)}
            onSubmit={async (form) => {
              const payload = sanitizeForm({ ...form, percentual_fechamento_estimado: Number(form.percentual_fechamento_estimado) })
              if (editingConcorrente?.id) {
                await arquitetosApi.atualizarConcorrente(arquitetoId, editingConcorrente.id, payload)
              } else {
                await arquitetosApi.criarConcorrente(arquitetoId, payload)
              }
              setEditingConcorrente(undefined)
              onRefetch()
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
          try {
            await arquitetosApi.removerDecisor(arquitetoId, removerDecisor.id)
            setRemoverDecisor(null)
            onRefetch()
          } catch (err) {
            setRemoverDecisor(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover decisor'))
          }
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
          try {
            await arquitetosApi.removerConcorrente(arquitetoId, removerConcorrente.id)
            setRemoverConcorrente(null)
            onRefetch()
          } catch (err) {
            setRemoverConcorrente(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover concorrente'))
          }
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
      setError(extractErrorMessage(err, 'Erro ao salvar decisor'))
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
      setError(extractErrorMessage(err, 'Erro ao salvar concorrente'))
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
