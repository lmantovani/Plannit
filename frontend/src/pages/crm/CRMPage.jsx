import { useEffect, useState, useRef } from 'react'
import { Plus, Phone, Mail, Building2, Clock, User, Search, Filter } from 'lucide-react'
import { leadsApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage, StatusBadge } from '../../components/ui'
import { FUNIL_ETAPAS, ORIGEM_LABELS, timeAgo } from '../../lib/constants'
import clsx from 'clsx'

const COLUNAS_MVP = ['novo_lead', 'qualificando', 'em_visita', 'em_briefing', 'em_fechamento', 'fechado', 'perdido']

export default function CRMPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const draggedId = useRef(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const fetchLeads = async () => {
    try {
      const { data } = await leadsApi.list()
      setLeads(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLeads() }, [])

  const filtered = leads.filter(l =>
    !search || l.nome.toLowerCase().includes(search.toLowerCase()) ||
    l.telefone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase())
  )

  const byStatus = COLUNAS_MVP.reduce((acc, s) => {
    acc[s] = filtered.filter(l => l.status_funil === s)
    return acc
  }, {})

  const moveLead = async (leadId, novoStatus) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.status_funil === novoStatus) return
    // Atualiza otimisticamente
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status_funil: novoStatus } : l))
    try {
      await leadsApi.update(leadId, { status_funil: novoStatus })
    } catch (e) {
      console.error(e)
      fetchLeads() // reverte em caso de erro
    }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-stone-200 flex-shrink-0">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          {[['kanban', 'Kanban'], ['lista', 'Lista']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                view === v ? 'bg-white shadow-card text-stone-800' : 'text-stone-500'
              )}
            >{l}</button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button className="btn-secondary btn-sm gap-1.5">
            <Filter size={13} /> Filtrar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5">
            <Plus size={13} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="flex gap-4 px-6 py-2 bg-white border-b border-stone-100 text-xs text-stone-500 flex-shrink-0">
        <span><strong className="text-stone-700">{filtered.length}</strong> leads</span>
        <span><strong className="text-green-600">{byStatus['fechado']?.length || 0}</strong> fechados</span>
        <span><strong className="text-red-500">{byStatus['perdido']?.length || 0}</strong> perdidos</span>
      </div>

      {/* Views */}
      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 h-full min-w-max">
            {COLUNAS_MVP.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                leads={byStatus[status] || []}
                onCardClick={setSelectedLead}
                dragOverCol={dragOverCol}
                onDragStart={(id) => { draggedId.current = id }}
                onDragEnter={() => setDragOverCol(status)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => {
                  if (draggedId.current) moveLead(draggedId.current, status)
                  draggedId.current = null
                  setDragOverCol(null)
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <LeadTable leads={filtered} onRowClick={setSelectedLead} />
        </div>
      )}

      {/* Modal Novo Lead */}
      <NovoLeadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchLeads() }}
      />

      {/* Drawer Lead */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={fetchLeads}
        />
      )}
    </div>
  )
}

// === Coluna Kanban ===
function KanbanColumn({ status, leads, onCardClick, dragOverCol, onDragStart, onDragEnter, onDragLeave, onDrop }) {
  const etapa = FUNIL_ETAPAS.find(e => e.key === status)
  const label = etapa?.label || status
  const cor = etapa?.cor || '#888'
  const isOver = dragOverCol === status

  return (
    <div
      className={clsx('kanban-col transition-colors', isOver && 'bg-primary-50 ring-2 ring-primary-200 ring-inset')}
      onDragOver={e => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Cabeçalho da coluna */}
      <div className="flex items-center justify-between px-2 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs text-stone-400 font-medium">{leads.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-2 pr-1">
        {leads.length === 0 ? (
          <div className={clsx('text-center py-6 text-xs', isOver ? 'text-primary-400' : 'text-stone-300')}>
            {isOver ? 'Soltar aqui' : 'Vazio'}
          </div>
        ) : (
          leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  )
}

// === Card do Lead ===
function LeadCard({ lead, onClick, onDragStart }) {
  const semInteracao = lead.ultima_interacao_em
    ? (Date.now() - new Date(lead.ultima_interacao_em).getTime()) > (3 * 24 * 60 * 60 * 1000)
    : true

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(lead.id) }}
      onClick={onClick}
      className={clsx('kanban-card group cursor-grab active:cursor-grabbing active:opacity-60', semInteracao && 'border-l-2 border-l-amber-400')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-stone-800 leading-tight">{lead.nome}</p>
        {semInteracao && (
          <span className="badge badge-alerta flex-shrink-0 text-2xs">!</span>
        )}
      </div>

      <div className="space-y-1">
        {lead.telefone && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Phone size={11} />
            <span>{lead.telefone}</span>
          </div>
        )}
        {lead.cidade && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Building2 size={11} />
            <span>{lead.cidade}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
        <span className="text-2xs text-stone-300">{ORIGEM_LABELS[lead.origem] || lead.origem}</span>
        <span className="text-2xs text-stone-400 flex items-center gap-1">
          <Clock size={10} />
          {lead.ultima_interacao_em ? timeAgo(lead.ultima_interacao_em) : 'Sem contato'}
        </span>
      </div>
    </div>
  )
}

// === Tabela de leads ===
function LeadTable({ leads, onRowClick }) {
  if (leads.length === 0) {
    return <EmptyState title="Nenhum lead encontrado" description="Tente ajustar os filtros de busca" />
  }
  return (
    <div className="card overflow-hidden">
      <table className="table-base">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>Origem</th>
            <th>Status</th>
            <th>Última interação</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id} className="cursor-pointer" onClick={() => onRowClick(l)}>
              <td className="font-medium text-stone-800">{l.nome}</td>
              <td>{l.telefone}</td>
              <td>{l.cidade || '—'}</td>
              <td>{ORIGEM_LABELS[l.origem] || l.origem}</td>
              <td><StatusBadge status={l.status_funil} /></td>
              <td className="text-stone-400 text-xs">{timeAgo(l.ultima_interacao_em)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// === Modal Novo Lead ===
function NovoLeadModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cidade: '', origem: 'outro' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await leadsApi.create(form)
      onSaved()
      setForm({ nome: '', telefone: '', email: '', cidade: '', origem: 'outro' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Lead" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Telefone *</label>
            <input className="input" required value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="São Paulo" />
          </div>
          <div>
            <label className="label">Origem</label>
            <select className="input" value={form.origem} onChange={e => set('origem', e.target.value)}>
              {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Lead'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Drawer do Lead ===
function LeadDrawer({ lead, onClose, onUpdated }) {
  const [interacoes, setInteracoes] = useState([])
  const [novaInteracao, setNovaInteracao] = useState('')
  const [tipo, setTipo] = useState('whatsapp')
  const [loadingInt, setLoadingInt] = useState(false)

  useEffect(() => {
    leadsApi.listarInteracoes(lead.id)
      .then(r => setInteracoes(r.data))
      .catch(console.error)
  }, [lead.id])

  const registrar = async () => {
    if (!novaInteracao.trim()) return
    setLoadingInt(true)
    try {
      await leadsApi.registrarInteracao(lead.id, { tipo, resumo: novaInteracao })
      setNovaInteracao('')
      const { data } = await leadsApi.listarInteracoes(lead.id)
      setInteracoes(data)
      onUpdated()
    } catch (e) { console.error(e) }
    finally { setLoadingInt(false) }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="font-semibold text-stone-800">{lead.nome}</h3>
          <p className="text-xs text-stone-400">{lead.telefone}</p>
        </div>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>

      {/* Dados */}
      <div className="px-5 py-4 border-b border-stone-100 space-y-3">
        <StatusBadge status={lead.status_funil} />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-stone-400">Origem</p>
            <p className="font-medium text-stone-700">{ORIGEM_LABELS[lead.origem] || lead.origem}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Cidade</p>
            <p className="font-medium text-stone-700">{lead.cidade || '—'}</p>
          </div>
        </div>
      </div>

      {/* Interações */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Histórico</p>
        {interacoes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhuma interação registrada</p>
        ) : (
          interacoes.map(i => (
            <div key={i.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                <User size={13} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-stone-600 capitalize">{i.tipo}</span>
                  <span className="text-2xs text-stone-300">{timeAgo(i.data)}</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">{i.resumo}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nova interação */}
      <div className="px-5 py-4 border-t border-stone-100 space-y-2">
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="input text-xs py-1.5 w-28"
          >
            {['whatsapp','ligacao','email','visita','reuniao'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <textarea
          value={novaInteracao}
          onChange={e => setNovaInteracao(e.target.value)}
          placeholder="Resumo do contato..."
          className="input resize-none h-20 text-sm"
        />
        <button
          onClick={registrar}
          disabled={loadingInt || !novaInteracao.trim()}
          className="btn-primary w-full justify-center"
        >
          {loadingInt ? 'Registrando...' : 'Registrar interação'}
        </button>
      </div>
    </div>
  )
}
