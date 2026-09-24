import React, { useState, useRef } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  FUNIL_ETAPAS,
  ORIGEM_LABELS,
  timeAgo,
  formatDate,
  formatDateTime,
} from '../../lib/constants'
import {
  Search,
  Plus,
  Kanban as KanbanIcon,
  List as ListIcon,
  Phone,
  Mail,
  Building2,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Calendar,
  X,
  Send,
  Sparkles,
  FileText,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import QualificarLeadModal, { ArquitetoOption } from '../../components/crm/QualificarLeadModal'

export type LeadInteracao = {
  id: number
  leadId: number
  tipo: string
  resumo: string
  createdAt: string | null
  responsavel: { id: number; nome: string } | null
}

export type LeadItem = {
  id: number
  nome: string
  telefone: string
  email: string | null
  cidade: string | null
  estado: string | null
  origem: string
  campanha: string | null
  statusFunil: string
  qualificado: boolean
  orcamentoEstimado: number | null
  faixaOrcamento: string | null
  faixaOrcamentoLabel: string | null
  prazoObra: string | null
  prazoObraLabel: string | null
  tipoImovel: string | null
  tipoImovelLabel: string | null
  ambientesInteresse: string[]
  possuiArquiteto: boolean
  arquitetoId: number | null
  arquiteto: { id: number; nome: string; escritorio: string | null } | null
  decisorPresente: boolean
  qualificadoEm: string | null
  qualificadoPorId: number | null
  qualificadoPor: { id: number; nome: string } | null
  motivoDesqualificacao: string | null
  motivoPerda: string | null
  concorrentePerdido: string | null
  convertidoEmCliente: boolean
  ultimaInteracaoEm: string | null
  createdAt: string | null
  updatedAt: string | null
  vendedorId: number | null
  diasSemInteracao: number
  precisaAtencao: boolean
  vendedor: { id: number; nome: string; email: string } | null
  interacoes: LeadInteracao[]
}

export type Estatisticas = {
  total: number
  ativos: number
  fechados: number
  perdidos: number
  estagnados: number
}

export type VendedorOption = {
  id: number
  nome: string
}

export type PageProps = {
  leads: LeadItem[]
  estatisticas: Estatisticas
  vendedores: VendedorOption[]
  arquitetos: ArquitetoOption[]
  filtros: {
    q: string
    statusFunil: string
    origem: string
    vendedorId: number | string
  }
  isVendedor: boolean
}

const CRMIndex: React.FC<PageProps> = ({
  leads,
  estatisticas,
  vendedores,
  arquitetos,
  filtros,
  isVendedor,
}) => {
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [search, setSearch] = useState(filtros.q || '')
  const [origemFiltro, setOrigemFiltro] = useState(filtros.origem || '')
  const [vendedorFiltro, setVendedorFiltro] = useState<string>(
    filtros.vendedorId ? String(filtros.vendedorId) : ''
  )

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [leadParaPerder, setLeadParaPerder] = useState<LeadItem | null>(null)
  const [leadParaQualificar, setLeadParaQualificar] = useState<LeadItem | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const draggedLeadId = useRef<number | null>(null)

  // Encontra lead selecionado sempre atualizado
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null

  // Filtro local em tempo real
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      (l.telefone && l.telefone.includes(search)) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.cidade && l.cidade.toLowerCase().includes(search.toLowerCase()))

    const matchOrigem = !origemFiltro || l.origem === origemFiltro
    const matchVendedor = !vendedorFiltro || String(l.vendedorId) === vendedorFiltro

    return matchSearch && matchOrigem && matchVendedor
  })

  // Agrupa leads por coluna para o Kanban
  const leadsPorStatus = FUNIL_ETAPAS.reduce(
    (acc, etapa) => {
      acc[etapa.key] = filteredLeads.filter((l) => l.statusFunil === etapa.key)
      return acc
    },
    {} as Record<string, LeadItem[]>
  )

  // Handlers de Drag and Drop
  const handleDragStart = (leadId: number) => {
    draggedLeadId.current = leadId
  }

  const handleDrop = (targetStatus: string) => {
    const leadId = draggedLeadId.current
    setDragOverCol(null)
    draggedLeadId.current = null

    if (!leadId) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.statusFunil === targetStatus) return

    // Se estiver movendo para 'perdido', abre o modal com motivo obrigatório (RF004)
    if (targetStatus === 'perdido') {
      setLeadParaPerder(lead)
      return
    }

    // RN001: Bloqueio de avanço para briefing/projeto sem qualificação
    const etapasRestritas = ['em_briefing', 'em_projeto', 'em_fechamento']
    if (etapasRestritas.includes(targetStatus) && !lead.qualificado) {
      toast.error('RN001 — O lead precisa ser qualificado antes de avançar para etapas de Briefing ou Projeto.')
      setSelectedLeadId(lead.id)
      setLeadParaQualificar(lead)
      return
    }

    // Envia atualização de status para o backend
    router.patch(
      `/crm/leads/${leadId}/status`,
      { statusFunil: targetStatus },
      {
        preserveScroll: true,
        onError: (errors) => {
          toast.error(errors.statusFunil || 'Erro ao atualizar status do lead')
        },
      }
    )
  }

  // Qualificar lead (RN001) - Abre o modal com critérios estruturados
  const handleAbrirQualificacao = (lead: LeadItem) => {
    setLeadParaQualificar(lead)
  }

  // Iniciar Briefing Técnico para o Lead Qualificado
  const handleIniciarBriefing = (leadId: number) => {
    router.post(
      '/briefings',
      { leadId },
      {
        onError: (err) => {
          toast.error(err.erro || 'Erro ao iniciar briefing para este lead')
        },
      }
    )
  }

  return (
    <AppLayout
      title="CRM & Pipeline Comercial"
      subtitle="Acompanhamento do funil de vendas, qualificação e histórico de interações"
    >
      <Head title="CRM & Pipeline Comercial — Líder Móveis Planejados" />

      <div className="flex flex-col flex-1 gap-4 max-w-full">
        {/* Painel de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-3 sm:p-4 border-l-4 border-l-stone-600 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Total Leads</p>
              <p className="text-xl font-bold text-stone-800 mt-0.5">{estatisticas.total}</p>
            </div>
            <User className="text-stone-300" size={24} />
          </div>

          <div className="card p-3 sm:p-4 border-l-4 border-l-primary-500 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Em Andamento</p>
              <p className="text-xl font-bold text-primary-700 mt-0.5">{estatisticas.ativos}</p>
            </div>
            <Clock className="text-primary-300" size={24} />
          </div>

          <div className="card p-3 sm:p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                Estagnados (&gt;3d)
              </p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{estatisticas.estagnados}</p>
            </div>
            <AlertTriangle className="text-amber-400" size={24} />
          </div>

          <div className="card p-3 sm:p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Fechados</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{estatisticas.fechados}</p>
            </div>
            <CheckCircle2 className="text-emerald-300" size={24} />
          </div>

          <div className="card p-3 sm:p-4 border-l-4 border-l-rose-500 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Perdidos</p>
              <p className="text-xl font-bold text-rose-600 mt-0.5">{estatisticas.perdidos}</p>
            </div>
            <XCircle className="text-rose-300" size={24} />
          </div>
        </div>

        {/* Toolbar de Ações & Filtros */}
        <div className="card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Input de Busca */}
            <div className="relative flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone, cidade..."
                className="input pl-9 py-1.5 text-xs w-full"
              />
            </div>

            {/* Filtro de Origem */}
            <select
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value)}
              className="input py-1.5 text-xs w-36"
            >
              <option value="">Todas Origens</option>
              {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            {/* Filtro de Vendedor (Gestores) */}
            {vendedores && vendedores.length > 0 && (
              <select
                value={vendedorFiltro}
                onChange={(e) => setVendedorFiltro(e.target.value)}
                className="input py-1.5 text-xs w-44"
              >
                <option value="">Todos os Vendedores</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Visualização */}
            <div className="bg-stone-100 p-0.5 rounded-lg flex items-center border border-stone-200">
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  view === 'kanban'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                )}
                title="Visualização em Kanban"
              >
                <KanbanIcon size={14} />
                <span className="hidden sm:inline">Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setView('lista')}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  view === 'lista'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                )}
                title="Visualização em Lista"
              >
                <ListIcon size={14} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            {/* Botão Novo Lead */}
            <button
              type="button"
              onClick={() => setShowNovoModal(true)}
              className="btn btn-primary btn-sm gap-1.5 text-xs shadow-sm"
            >
              <Plus size={15} />
              <span>Novo Lead</span>
            </button>
          </div>
        </div>

        {/* Visualização: Kanban vs Lista */}
        {view === 'kanban' ? (
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-[1300px] h-[calc(100vh-270px)]">
              {FUNIL_ETAPAS.map((etapa) => {
                const columnLeads = leadsPorStatus[etapa.key] || []
                const isOver = dragOverCol === etapa.key

                return (
                  <div
                    key={etapa.key}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dragOverCol !== etapa.key) setDragOverCol(etapa.key)
                    }}
                    onDragLeave={() => {
                      if (dragOverCol === etapa.key) setDragOverCol(null)
                    }}
                    onDrop={() => handleDrop(etapa.key)}
                    className={clsx(
                      'flex-1 flex flex-col rounded-xl bg-stone-50/80 border transition-all min-w-[200px]',
                      isOver
                        ? 'border-primary-400 bg-primary-50/30 ring-2 ring-primary-300 ring-inset'
                        : 'border-stone-200/90'
                    )}
                  >
                    {/* Cabeçalho da Coluna */}
                    <div className="p-3 border-b border-stone-200/80 flex items-center justify-between bg-white rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: etapa.cor }}
                        />
                        <span className="text-xs font-bold text-stone-700 tracking-tight">
                          {etapa.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        {columnLeads.length}
                      </span>
                    </div>

                    {/* Lista de Cards da Coluna */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                      {columnLeads.length === 0 ? (
                        <div
                          className={clsx(
                            'h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-xs transition-colors',
                            isOver
                              ? 'border-primary-300 text-primary-600 bg-primary-50/50'
                              : 'border-stone-200 text-stone-400'
                          )}
                        >
                          <span>{isOver ? 'Solte para mover' : 'Nenhum lead nesta etapa'}</span>
                        </div>
                      ) : (
                        columnLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => setSelectedLeadId(lead.id)}
                            onDragStart={() => handleDragStart(lead.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="table-base w-full text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Nome do Lead</th>
                    <th className="py-2.5 px-3 text-left">Contato</th>
                    <th className="py-2.5 px-3 text-left">Cidade</th>
                    <th className="py-2.5 px-3 text-left">Origem</th>
                    <th className="py-2.5 px-3 text-left">Status</th>
                    <th className="py-2.5 px-3 text-left">Qualificação</th>
                    <th className="py-2.5 px-3 text-left">Vendedor</th>
                    <th className="py-2.5 px-3 text-left">Último Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        Nenhum lead encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLeadId(l.id)}
                        className="hover:bg-stone-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-stone-800">
                          <div className="flex items-center gap-2">
                            {l.precisaAtencao && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                                title="Mais de 3 dias sem contato!"
                              />
                            )}
                            <span>{l.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          <div>{l.telefone}</div>
                          {l.email && (
                            <div className="text-[11px] text-stone-400 truncate max-w-[160px]">
                              {l.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-600">{l.cidade || '—'}</td>
                        <td className="py-3 px-3">
                          <span className="badge badge-neutro text-[10px]">
                            {ORIGEM_LABELS[l.origem] || l.origem}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700">
                            {FUNIL_ETAPAS.find((e) => e.key === l.statusFunil)?.label ||
                              l.statusFunil}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {l.qualificado ? (
                            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              Qualificado
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-stone-400">
                              Não qualificado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          {l.vendedor?.nome || 'Não atribuído'}
                        </td>
                        <td className="py-3 px-3 text-stone-400">
                          {timeAgo(l.ultimaInteracaoEm)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Lateral de Detalhes & Interações */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onQualificar={() => handleAbrirQualificacao(selectedLead)}
          onIniciarBriefing={() => handleIniciarBriefing(selectedLead.id)}
          onMarcarPerdido={() => {
            setLeadParaPerder(selectedLead)
          }}
        />
      )}

      {/* Modal de Qualificação Estruturada de Lead (RN001) */}
      {leadParaQualificar && (
        <QualificarLeadModal
          lead={leadParaQualificar}
          arquitetos={arquitetos || []}
          onClose={() => setLeadParaQualificar(null)}
        />
      )}

      {/* Modal Novo Lead */}
      {showNovoModal && (
        <NovoLeadModal
          onClose={() => setShowNovoModal(false)}
          vendedores={vendedores}
          isVendedor={isVendedor}
        />
      )}

      {/* Modal Perda de Lead (RF004) */}
      {leadParaPerder && (
        <PerderLeadModal
          lead={leadParaPerder}
          onClose={() => setLeadParaPerder(null)}
        />
      )}
    </AppLayout>
  )
}

export default CRMIndex

// === Componente: Card do Lead no Kanban ===
function LeadCard({
  lead,
  onClick,
  onDragStart,
}: {
  lead: LeadItem
  onClick: () => void
  onDragStart: () => void
}) {
  return (
    <div
      draggable
      onDragStart={() => {
        onDragStart()
      }}
      onClick={onClick}
      className={clsx(
        'card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group bg-white border relative',
        lead.precisaAtencao
          ? 'border-amber-400/90 bg-amber-50/10'
          : 'border-stone-200/90 hover:border-primary-300'
      )}
    >
      {/* Alerta de Estagnação (RF005) */}
      {lead.precisaAtencao && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded mb-2 border border-amber-200/60">
          <AlertTriangle size={11} className="text-amber-600 flex-shrink-0" />
          <span>{lead.diasSemInteracao} dias sem interação!</span>
        </div>
      )}

      {/* Nome e Indicador de Qualificação */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <h4 className="font-semibold text-xs text-stone-900 group-hover:text-primary-700 leading-snug">
          {lead.nome}
        </h4>
        {lead.qualificado ? (
          <span
            title="Lead com critérios de qualificação validados (RN001)"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex-shrink-0"
          >
            <CheckCircle2 size={9} /> Qualificado
          </span>
        ) : lead.statusFunil === 'desqualificado' ? (
          <span
            title="Lead desqualificado"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold flex-shrink-0"
          >
            Desqualificado
          </span>
        ) : null}
      </div>

      {/* Informações Rápidas */}
      <div className="space-y-1 text-[11px] text-stone-500">
        <div className="flex items-center gap-1.5">
          <Phone size={11} className="text-stone-400" />
          <span className="truncate">{lead.telefone}</span>
        </div>

        {lead.cidade && (
          <div className="flex items-center gap-1.5">
            <Building2 size={11} className="text-stone-400" />
            <span className="truncate">{lead.cidade}</span>
          </div>
        )}

        {lead.qualificado && lead.ambientesInteresse && lead.ambientesInteresse.length > 0 && (
          <div className="text-[10px] text-amber-900 bg-amber-50/70 border border-amber-200/50 rounded px-1.5 py-0.5 truncate mt-1">
            ✨ {lead.ambientesInteresse.slice(0, 2).join(', ')}
            {lead.ambientesInteresse.length > 2 && ` +${lead.ambientesInteresse.length - 2}`}
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[10px]">
        <span className="badge badge-neutro text-[9px] py-0 px-1.5">
          {ORIGEM_LABELS[lead.origem] || lead.origem}
        </span>

        <span
          className={clsx(
            'flex items-center gap-1 font-medium',
            lead.precisaAtencao ? 'text-amber-600' : 'text-stone-400'
          )}
          title="Última interação registrada"
        >
          <Clock size={10} />
          {timeAgo(lead.ultimaInteracaoEm)}
        </span>
      </div>
    </div>
  )
}

// === Componente: Drawer Lateral de Detalhes e Interações ===
function LeadDrawer({
  lead,
  onClose,
  onQualificar,
  onIniciarBriefing,
  onMarcarPerdido,
}: {
  lead: LeadItem
  onClose: () => void
  onQualificar: () => void
  onIniciarBriefing: () => void
  onMarcarPerdido: () => void
}) {
  const [tipo, setTipo] = useState('whatsapp')
  const [resumo, setResumo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEnviarInteracao = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumo.trim()) return

    setLoading(true)
    router.post(
      `/crm/leads/${lead.id}/interacoes`,
      { tipo, resumo },
      {
        preserveScroll: true,
        onSuccess: () => {
          setResumo('')
          setLoading(false)
          toast.success('Interação adicionada com sucesso!')
        },
        onError: () => setLoading(false),
      }
    )
  }

  const getTipoIcon = (t: string) => {
    switch (t) {
      case 'whatsapp':
        return <MessageSquare size={13} className="text-emerald-500" />
      case 'ligacao':
        return <Phone size={13} className="text-blue-500" />
      case 'email':
        return <Mail size={13} className="text-purple-500" />
      case 'visita':
        return <Building2 size={13} className="text-amber-500" />
      case 'reuniao':
        return <Calendar size={13} className="text-indigo-500" />
      default:
        return <Clock size={13} className="text-stone-400" />
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header do Drawer */}
      <div className="p-4 border-b border-stone-100 flex items-start justify-between bg-stone-50/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-stone-900 text-base leading-snug">
              {lead.nome}
            </h3>
            {lead.qualificado ? (
              <span className="badge badge-sucesso text-[10px] flex items-center gap-1">
                <CheckCircle2 size={10} /> Qualificado
              </span>
            ) : (
              <span className="badge badge-neutro text-[10px]">Não Qualificado</span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">{lead.telefone}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Ações Rápidas (RN001 & RF004) */}
      <div className="p-3 bg-stone-100/70 border-b border-stone-200/80 flex items-center justify-between gap-2 text-xs">
        {!lead.qualificado && lead.statusFunil !== 'perdido' && (
          <button
            onClick={onQualificar}
            className="btn btn-primary btn-sm flex-1 gap-1.5 text-xs shadow-sm"
          >
            <Sparkles size={13} />
            <span>Qualificar Lead (RN001)</span>
          </button>
        )}

        {lead.qualificado && lead.statusFunil !== 'perdido' && (
          <button
            onClick={onIniciarBriefing}
            className="btn btn-sm flex-1 gap-1.5 text-xs shadow-sm bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-all"
            title="Cria o projeto no sistema e abre o Briefing Inteligente"
          >
            <FileText size={13} className="text-primary-400" />
            <span>Iniciar Briefing Técnico</span>
          </button>
        )}

        {lead.statusFunil !== 'perdido' && (
          <button
            onClick={onMarcarPerdido}
            className="btn btn-secondary btn-sm text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
          >
            <XCircle size={13} />
            <span>Marcar como Perdido</span>
          </button>
        )}
      </div>

      {/* Informações Cadastrais */}
      <div className="p-4 border-b border-stone-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase">Origem</p>
          <p className="font-medium text-stone-700 mt-0.5">
            {ORIGEM_LABELS[lead.origem] || lead.origem}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase">Cidade / Estado</p>
          <p className="font-medium text-stone-700 mt-0.5">
            {lead.cidade ? `${lead.cidade}${lead.estado ? ` - ${lead.estado}` : ''}` : '—'}
          </p>
        </div>

        {lead.email && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-stone-400 uppercase">E-mail</p>
            <p className="font-medium text-stone-700 mt-0.5 truncate">{lead.email}</p>
          </div>
        )}

        {lead.campanha && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-stone-400 uppercase">Campanha</p>
            <p className="font-medium text-stone-600 mt-0.5 text-[11px]">{lead.campanha}</p>
          </div>
        )}

        {lead.motivoPerda && (
          <div className="col-span-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-[10px] font-semibold text-rose-700 uppercase">Motivo da Perda</p>
            <p className="text-xs text-rose-800 mt-0.5">{lead.motivoPerda}</p>
            {lead.concorrentePerdido && (
              <p className="text-[11px] text-rose-600 mt-1">
                Concorrente: <strong>{lead.concorrentePerdido}</strong>
              </p>
            )}
          </div>
        )}

        {lead.statusFunil === 'desqualificado' && lead.motivoDesqualificacao && (
          <div className="col-span-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-[11px]">
              <XCircle size={13} className="text-rose-600" />
              <span>Lead Desqualificado (RN001)</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">{lead.motivoDesqualificacao}</p>
          </div>
        )}

        {/* Ficha de Qualificação Estruturada (RN001) */}
        {lead.qualificado && (
          <div className="col-span-2 p-3 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-stone-50 border border-amber-200/80 rounded-xl space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-950">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Qualificação Validada (RN001)</span>
              </span>
              <button
                type="button"
                onClick={onQualificar}
                className="text-[10px] text-amber-800 hover:text-amber-950 underline font-medium cursor-pointer"
              >
                Revisar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-amber-200/50">
              <div>
                <span className="text-[10px] text-stone-500 block uppercase font-medium">Orçamento / Imóvel</span>
                <span className="font-semibold text-stone-800 leading-tight block">
                  {lead.faixaOrcamentoLabel || (lead.orcamentoEstimado ? `R$ ${lead.orcamentoEstimado.toLocaleString('pt-BR')}` : 'A definir')}
                </span>
                <span className="text-[10px] text-stone-600">{lead.tipoImovelLabel || 'Imóvel'}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block uppercase font-medium">Previsão da Obra</span>
                <span className="font-semibold text-stone-800 leading-tight block">
                  {lead.prazoObraLabel || 'Prazo padrão'}
                </span>
              </div>

              {lead.ambientesInteresse && lead.ambientesInteresse.length > 0 && (
                <div className="col-span-2 pt-1 border-t border-amber-200/30">
                  <span className="text-[10px] text-stone-500 block uppercase font-medium mb-1">
                    Ambientes Pretendidos ({lead.ambientesInteresse.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {lead.ambientesInteresse.map((amb) => (
                      <span
                        key={amb}
                        className="px-2 py-0.5 bg-white text-stone-800 border border-stone-200/80 rounded-md text-[10px] font-medium shadow-3xs"
                      >
                        {amb}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lead.arquiteto && (
                <div className="col-span-2 pt-1 border-t border-amber-200/30">
                  <span className="text-[10px] text-stone-500 block uppercase font-medium">Especificador Parceiro</span>
                  <span className="font-semibold text-primary-800 text-[11px]">
                    {lead.arquiteto.nome} {lead.arquiteto.escritorio ? `(${lead.arquiteto.escritorio})` : ''}
                  </span>
                </div>
              )}

              <div className="col-span-2 text-[10px] text-stone-400 pt-1 border-t border-amber-200/30 flex items-center justify-between">
                <span>Por: {lead.qualificadoPor?.nome || 'Vendedor'}</span>
                <span>{lead.qualificadoEm ? formatDate(lead.qualificadoEm) : 'Auditado'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Linha do Tempo de Interações (RF003) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Linha do Tempo ({lead.interacoes?.length || 0})
          </p>
          <span className="text-[10px] text-stone-400">
            Último: {timeAgo(lead.ultimaInteracaoEm)}
          </span>
        </div>

        {!lead.interacoes || lead.interacoes.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Nenhuma interação registrada ainda.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {lead.interacoes.map((i) => (
              <div key={i.id} className="relative group">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                </div>

                <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium text-stone-700 capitalize">
                      {getTipoIcon(i.tipo)}
                      <span>{i.tipo}</span>
                    </div>
                    <span className="text-stone-400 text-[10px]">
                      {timeAgo(i.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{i.resumo}</p>

                  <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-200/50 flex items-center justify-between">
                    <span>Por: {i.responsavel?.nome || 'Sistema'}</span>
                    <span>{formatDateTime(i.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de Nova Interação */}
      <form onSubmit={handleEnviarInteracao} className="p-3 border-t border-stone-200 bg-white space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="input py-1 text-xs w-32"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="ligacao">Ligação</option>
            <option value="email">E-mail</option>
            <option value="visita">Visita</option>
            <option value="reuniao">Reunião</option>
          </select>
          <span className="text-[11px] text-stone-400">Nova Interação</span>
        </div>

        <textarea
          rows={2}
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          placeholder="Descreva o que foi conversado com o cliente..."
          className="input py-1.5 text-xs resize-none w-full"
          required
        />

        <button
          type="submit"
          disabled={loading || !resumo.trim()}
          className="btn btn-primary btn-sm w-full gap-1.5 justify-center text-xs"
        >
          <Send size={13} />
          <span>{loading ? 'Salvando...' : 'Registrar Interação'}</span>
        </button>
      </form>
    </div>
  )
}

// === Componente: Modal Novo Lead ===
function NovoLeadModal({
  onClose,
  vendedores,
  isVendedor,
}: {
  onClose: () => void
  vendedores: VendedorOption[]
  isVendedor: boolean
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    nome: '',
    telefone: '',
    email: '',
    cidade: '',
    estado: 'SP',
    origem: 'outro',
    campanha: '',
    vendedorId: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/crm/leads', {
      onSuccess: () => {
        toast.success('Lead cadastrado com sucesso!')
        reset()
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-scale-in">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-stone-900 text-base">
            Cadastrar Novo Lead
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome Completo *</label>
              <input
                type="text"
                required
                value={data.nome}
                onChange={(e) => setData('nome', e.target.value)}
                placeholder="Ex: Dra. Juliana Silveira"
                className="input text-xs"
              />
              {errors.nome && <p className="text-red-500 text-[11px] mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="label">Telefone / WhatsApp *</label>
              <input
                type="text"
                required
                value={data.telefone}
                onChange={(e) => setData('telefone', e.target.value)}
                placeholder="(11) 99999-8888"
                className="input text-xs"
              />
              {errors.telefone && (
                <p className="text-red-500 text-[11px] mt-1">{errors.telefone}</p>
              )}
            </div>

            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="juliana@exemplo.com.br"
                className="input text-xs"
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Cidade</label>
              <input
                type="text"
                value={data.cidade}
                onChange={(e) => setData('cidade', e.target.value)}
                placeholder="São Paulo"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="label">Origem do Lead</label>
              <select
                value={data.origem}
                onChange={(e) => setData('origem', e.target.value)}
                className="input text-xs"
              >
                {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Campanha / Referência</label>
              <input
                type="text"
                value={data.campanha}
                onChange={(e) => setData('campanha', e.target.value)}
                placeholder="Ex: Instagram Cozinhas Premium / Indicação Arq. Bruno"
                className="input text-xs"
              />
            </div>

            {!isVendedor && vendedores && vendedores.length > 0 && (
              <div className="col-span-2">
                <label className="label">Atribuir Vendedor Responsável</label>
                <select
                  value={data.vendedorId}
                  onChange={(e) => setData('vendedorId', e.target.value)}
                  className="input text-xs"
                >
                  <option value="">Auto-atribuir ao criador</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary btn-sm text-xs gap-1.5"
            >
              <span>{processing ? 'Salvando...' : 'Cadastrar Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// === Componente: Modal Perda Justificada (RF004) ===
function PerderLeadModal({
  lead,
  onClose,
}: {
  lead: LeadItem
  onClose: () => void
}) {
  const { data, setData, post, processing, errors } = useForm({
    motivoPerda: '',
    concorrentePerdido: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/crm/leads/${lead.id}/perder`, {
      onSuccess: () => {
        toast.success(`Lead "${lead.nome}" arquivado como perdido.`)
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 animate-scale-in">
        <div className="p-4 border-b border-stone-100 bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700">
            <XCircle size={18} />
            <h3 className="font-semibold text-stone-900 text-sm">
              Marcar Lead como Perdido (RF004)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-stone-600 leading-relaxed">
            Conforme regra <strong>RF004 / RN001</strong>, é obrigatório registrar o motivo
            pelo qual o lead <strong>{lead.nome}</strong> não prosseguiu na compra.
          </p>

          <div>
            <label className="label">Motivo da Perda *</label>
            <textarea
              required
              rows={3}
              value={data.motivoPerda}
              onChange={(e) => setData('motivoPerda', e.target.value)}
              placeholder="Ex: Optou por marcenaria por questão de prazo emergencial / Orçamento acima do limite..."
              className="input text-xs resize-none w-full"
            />
            {errors.motivoPerda && (
              <p className="text-red-500 text-[11px] mt-1">{errors.motivoPerda}</p>
            )}
          </div>

          <div>
            <label className="label">Concorrente Escolhido (Opcional)</label>
            <input
              type="text"
              value={data.concorrentePerdido}
              onChange={(e) => setData('concorrentePerdido', e.target.value)}
              placeholder="Ex: Florense, Dell Anno, Marcenaria de bairro..."
              className="input text-xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing || !data.motivoPerda.trim()}
              className="btn btn-danger btn-sm text-xs gap-1.5"
            >
              <span>{processing ? 'Salvando...' : 'Confirmar Perda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
