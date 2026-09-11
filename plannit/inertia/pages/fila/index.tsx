import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  Search,
  SlidersHorizontal,
  Clock,
  Play,
  CheckCircle2,
  UserCheck,
  UserX,
  X,
  Kanban as KanbanIcon,
  List as ListIcon,
  ShieldAlert,
  Settings2,
  RotateCcw,
} from 'lucide-react'
import clsx from 'clsx'

type FilaItem = {
  id: number
  projetoId: number
  projetistaId: number | null
  prioridade: number
  status: string
  dataEntradaFila: string | null
  dataAlocacao: string | null
  diasNaFila: number
  projeto: {
    id: number
    codigo: string
    clienteNome: string
    status: string
    arquivado: boolean
    vendedor: { id: number; nome: string } | null
    briefing: {
      id: number
      score: number
      scoreMinimo: number
      status: string
    } | null
  } | null
  projetista: {
    id: number
    nome: string
    email: string
    telefone: string | null
  } | null
}

type ProjetistaCapacidade = {
  id: number
  nome: string
  email: string
  telefone: string | null
  initials: string
  pode: boolean
  wipAtual: number
  wipLimit: number
  vagasDisponiveis: number
  porcentagemOcupacao: number
  mensagem: string
}

type PageProps = {
  fila: FilaItem[]
  projetistas: ProjetistaCapacidade[]
  stats: {
    total: number
    aguardando: number
    alocados: number
    emAndamento: number
    concluidos: number
    capacidadeTotalEquipe: number
    ocupacaoTotalEquipe: number
    taxaOcupacaoGeral: number
  }
  isGestor: boolean
  filters: {
    q: string
    status: string
    projetistaId: string | number
  }
}

const STATUS_FILA_COLUNAS = [
  { key: 'aguardando', label: 'Aguardando Alocação', bg: 'bg-amber-50/50', border: 'border-amber-200' },
  { key: 'alocado', label: 'Alocado (Aguard. Início)', bg: 'bg-blue-50/50', border: 'border-blue-200' },
  { key: 'em_andamento', label: 'Em Andamento (3D)', bg: 'bg-indigo-50/50', border: 'border-indigo-200' },
  { key: 'concluido', label: 'Concluído', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
]

const FilaIndex: React.FC<PageProps> = ({
  fila,
  projetistas,
  stats,
  isGestor,
  filters,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchTerm, setSearchTerm] = useState(filters.q || '')
  const [projetistaFilter, setProjetistaFilter] = useState(String(filters.projetistaId || ''))
  const [statusFilter, setStatusFilter] = useState(filters.status || '')

  // Modais
  const [alocarModalItem, setAlocarModalItem] = useState<FilaItem | null>(null)
  const [selectedProjetistaId, setSelectedProjetistaId] = useState<number | ''>('')
  const [prioridadeAlocacao, setPrioridadeAlocacao] = useState(5)
  const [observacaoAlocacao, setObservacaoAlocacao] = useState('')
  const [isSubmittingAlocacao, setIsSubmittingAlocacao] = useState(false)

  const [wipModalProjetista, setWipModalProjetista] = useState<ProjetistaCapacidade | null>(null)
  const [novoWipLimit, setNovoWipLimit] = useState(3)
  const [isSubmittingWip, setIsSubmittingWip] = useState(false)

  const handleFilter = (updates: { q?: string; status?: string; projetistaId?: string }) => {
    const q = updates.q !== undefined ? updates.q : searchTerm
    const status = updates.status !== undefined ? updates.status : statusFilter
    const pId = updates.projetistaId !== undefined ? updates.projetistaId : projetistaFilter

    router.get(
      '/fila',
      {
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(pId ? { projetistaId: pId } : {}),
      },
      { preserveState: true, replace: true }
    )
  }

  const handleOpenAlocar = (item: FilaItem) => {
    setAlocarModalItem(item)
    // Pré-seleciona o primeiro projetista disponível se houver
    const disponivel = projetistas.find((p) => p.pode)
    setSelectedProjetistaId(disponivel ? disponivel.id : '')
    setPrioridadeAlocacao(item.prioridade || 5)
    setObservacaoAlocacao('')
  }

  const handleConfirmAlocar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alocarModalItem || !selectedProjetistaId) return

    const projetistaEscolhido = projetistas.find((p) => p.id === selectedProjetistaId)
    if (projetistaEscolhido && !projetistaEscolhido.pode) {
      alert(`Bloqueio RN003: O projetista ${projetistaEscolhido.nome} atingiu o limite de ${projetistaEscolhido.wipLimit} projetos ativos.`)
      return
    }

    setIsSubmittingAlocacao(true)
    router.post(
      `/fila/${alocarModalItem.id}/alocar`,
      {
        projetistaId: selectedProjetistaId,
        prioridade: prioridadeAlocacao,
        observacao: observacaoAlocacao || undefined,
      },
      {
        onFinish: () => {
          setIsSubmittingAlocacao(false)
          setAlocarModalItem(null)
        },
      }
    )
  }

  const handleDesalocar = (filaId: number) => {
    if (confirm('Deseja desalocar o projetista e retornar o projeto para a fila de espera?')) {
      router.post(`/fila/${filaId}/desalocar`)
    }
  }

  const handleIniciarExecucao = (filaId: number) => {
    router.post(`/fila/${filaId}/iniciar`)
  }

  const handleSalvarWip = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wipModalProjetista) return

    setIsSubmittingWip(true)
    router.post(
      '/wip/configuracoes',
      {
        projetistaId: wipModalProjetista.id,
        wipLimit: novoWipLimit,
      },
      {
        onFinish: () => {
          setIsSubmittingWip(false)
          setWipModalProjetista(null)
        },
      }
    )
  }

  return (
    <AppLayout
      title="Fila de Projetos & Limite WIP (RN003)"
      subtitle="Distribuição técnica equilibrada com bloqueio de sobrecarga por capacidade individual"
    >
      <Head title="Fila de Projetos — Plannit Líder" />

      <div className="space-y-6">
        {/* Banner Informativo RN003 */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-700">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  RN003 — Controle Rigoroso de WIP (Work In Progress)
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary-500 text-stone-900 rounded-full font-mono">
                  Padrão: 3 Projetos
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
                Nenhum projetista pode ser alocado acima de sua capacidade máxima simultânea configurada. O sistema bloqueia novas
                atribuições caso o profissional já possua projetos em andamento, garantindo velocidade no SLA e excelência na entrega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                Ocupação da Equipe
              </span>
              <span className="text-lg font-display font-bold text-primary-400">
                {stats.ocupacaoTotalEquipe} / {stats.capacidadeTotalEquipe} projetos ({stats.taxaOcupacaoGeral}%)
              </span>
            </div>
          </div>
        </div>

        {/* Monitor de Capacidade dos Projetistas (WIP Monitor) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-sm text-stone-900">
                Monitor de Capacidade da Equipe Técnica
              </h3>
              <span className="text-xs text-stone-500">
                ({projetistas.length} projetistas ativos)
              </span>
            </div>
            {isGestor && (
              <span className="text-[11px] text-stone-400">
                Diretoria/Gerência: clique no ícone de engrenagem para customizar limites
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projetistas.map((p) => {
              const isLotado = !p.pode
              return (
                <div
                  key={p.id}
                  className={clsx(
                    'p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative',
                    isLotado
                      ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                      : p.porcentagemOcupacao >= 70
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-stone-50/50 border-stone-200'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={clsx(
                          'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm',
                          isLotado
                            ? 'bg-rose-600 text-white'
                            : 'bg-primary-500 text-stone-900'
                        )}
                      >
                        {p.initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 truncate max-w-[160px]">
                          {p.nome}
                        </h4>
                        <span className="text-[11px] text-stone-500 truncate block">
                          {p.email}
                        </span>
                      </div>
                    </div>

                    {isGestor && (
                      <button
                        onClick={() => {
                          setWipModalProjetista(p)
                          setNovoWipLimit(p.wipLimit)
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
                        title="Ajustar limite WIP deste projetista"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Barra de Progresso do WIP */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                      <span className="text-stone-600">Carga Operacional:</span>
                      <span
                        className={clsx(
                          'font-mono font-bold',
                          isLotado
                            ? 'text-rose-700'
                            : p.porcentagemOcupacao >= 70
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        )}
                      >
                        {p.wipAtual} / {p.wipLimit} projetos ({p.porcentagemOcupacao}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-300',
                          isLotado
                            ? 'bg-rose-600'
                            : p.porcentagemOcupacao >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, p.porcentagemOcupacao))}%` }}
                      />
                    </div>
                  </div>

                  {/* Badge de Disponibilidade */}
                  <div className="flex items-center justify-between pt-1">
                    {p.pode ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Disponível ({p.vagasDisponiveis} vaga{p.vagasDisponiveis > 1 ? 's' : ''})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                        <UserX className="w-3 h-3 text-rose-600" />
                        Lotado (RN003)
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const newFilter = projetistaFilter === String(p.id) ? '' : String(p.id)
                        setProjetistaFilter(newFilter)
                        handleFilter({ projetistaId: newFilter })
                      }}
                      className={clsx(
                        'text-[10px] font-semibold px-2 py-0.5 rounded transition-colors',
                        projetistaFilter === String(p.id)
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                      )}
                    >
                      {projetistaFilter === String(p.id) ? 'Filtro Ativo' : 'Ver Projetos'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Barra de Filtros e Alternador Kanban / Lista */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente ou código do projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter({ q: searchTerm })}
                className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-stone-50/50"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                handleFilter({ status: e.target.value })
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os Status da Fila</option>
              <option value="aguardando">Aguardando Alocação</option>
              <option value="alocado">Alocado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>

            {(searchTerm || statusFilter || projetistaFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setProjetistaFilter('')
                  router.get('/fila', {}, { replace: true })
                }}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Limpar filtros"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Alternador Kanban / Lista */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                viewMode === 'kanban'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              )}
            >
              <KanbanIcon className="w-3.5 h-3.5 text-primary-600" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              )}
            >
              <ListIcon className="w-3.5 h-3.5 text-primary-600" />
              Lista
            </button>
          </div>
        </div>

        {/* Visão 1: Quadro Kanban da Fila */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {STATUS_FILA_COLUNAS.map((col) => {
              const itemsDaColuna = fila.filter((f) => f.status === col.key)

              return (
                <div
                  key={col.key}
                  className={clsx(
                    'rounded-2xl border p-3 flex flex-col space-y-3 min-h-[480px]',
                    col.bg,
                    col.border
                  )}
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                    <span className="font-semibold text-xs text-stone-800 flex items-center gap-1.5">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-white text-stone-700 rounded-full border border-stone-200 shadow-sm">
                      {itemsDaColuna.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="space-y-3 flex-1">
                    {itemsDaColuna.length === 0 ? (
                      <div className="p-8 text-center text-xs text-stone-400 italic">
                        Nenhum projeto nesta etapa
                      </div>
                    ) : (
                      itemsDaColuna.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200">
                              {item.projeto?.codigo || `PRJ-${item.id}`}
                            </span>
                            <span
                              className={clsx(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full font-mono',
                                item.prioridade <= 2
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : item.prioridade <= 4
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-stone-100 text-stone-600'
                              )}
                            >
                              P{item.prioridade} {item.prioridade <= 2 ? 'Urgente' : ''}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-semibold text-xs text-stone-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                              {item.projeto?.clienteNome}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                              <span>Vend: {item.projeto?.vendedor?.nome || 'N/A'}</span>
                              {item.projeto?.briefing && (
                                <span className="font-semibold text-emerald-600">
                                  Score: {item.projeto.briefing.score} pts
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Projetista Responsável ou Alerta de Espera */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                            {item.projetista ? (
                              <div className="flex items-center gap-1.5 truncate text-stone-700">
                                <UserCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                  {item.projetista.nome}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{item.diasNaFila}d na fila</span>
                              </div>
                            )}
                          </div>

                          {/* Ações Rápidas por Coluna */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-1.5">
                            {item.status === 'aguardando' && (
                              <button
                                onClick={() => handleOpenAlocar(item)}
                                className="w-full py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-primary-400" />
                                Alocar Projetista (RN003)
                              </button>
                            )}

                            {item.status === 'alocado' && (
                              <div className="flex items-center gap-1 w-full">
                                <button
                                  onClick={() => handleIniciarExecucao(item.id)}
                                  className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  Iniciar 3D
                                </button>
                                <button
                                  onClick={() => handleDesalocar(item.id)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors"
                                  title="Desalocar projetista e devolver à fila"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {item.status === 'em_andamento' && (
                              <button
                                onClick={() => router.post(`/fila/${item.id}/alocar`, { prioridade: item.prioridade })}
                                className="text-[11px] text-indigo-700 font-medium hover:underline flex items-center gap-1"
                              >
                                Em Modelagem 3D
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Visão 2: Lista / Tabela */
          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/75 text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    <th className="py-3 px-4">Projeto & Cliente</th>
                    <th className="py-3 px-4">Prioridade</th>
                    <th className="py-3 px-4">Status da Fila</th>
                    <th className="py-3 px-4">Projetista Alocado</th>
                    <th className="py-3 px-4">Tempo na Fila</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {fila.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 text-sm">
                          {item.projeto?.clienteNome}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                          <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                            {item.projeto?.codigo}
                          </span>
                          <span>Vend: {item.projeto?.vendedor?.nome || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full font-mono',
                            item.prioridade <= 2
                              ? 'bg-rose-100 text-rose-700'
                              : item.prioridade <= 4
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-600'
                          )}
                        >
                          Prioridade {item.prioridade}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.projetista ? (
                          <div className="flex items-center gap-1.5 font-medium text-stone-900">
                            <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                            {item.projetista.nome}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Não alocado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-stone-500">
                        {item.diasNaFila} dia(s)
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'aguardando' ? (
                          <button
                            onClick={() => handleOpenAlocar(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <UserCheck className="w-3 h-3 text-primary-400" />
                            Alocar
                          </button>
                        ) : item.status === 'alocado' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleIniciarExecucao(item.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            >
                              Iniciar
                            </button>
                            <button
                              onClick={() => handleDesalocar(item.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded"
                              title="Desalocar"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">Em andamento</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alocação de Projetista (RN003) */}
      {alocarModalItem && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-lg text-stone-900">
                  Alocar Projetista Técnico
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Projeto: {alocarModalItem.projeto?.codigo} — {alocarModalItem.projeto?.clienteNome}
                </p>
              </div>
              <button
                onClick={() => setAlocarModalItem(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAlocar} className="mt-4 space-y-4">
              {/* Seleção com Verificação Visual de Capacidade (RN003) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Selecione o Projetista (Validação RN003 em Tempo Real):
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {projetistas.map((p) => {
                    const isSelected = selectedProjetistaId === p.id
                    const isLotado = !p.pode

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (p.pode) {
                            setSelectedProjetistaId(p.id)
                          }
                        }}
                        className={clsx(
                          'p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer',
                          isLotado
                            ? 'bg-rose-50/50 border-rose-200 opacity-75 cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
                              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                              isLotado
                                ? 'bg-rose-200 text-rose-800'
                                : isSelected
                                  ? 'bg-primary-500 text-stone-900'
                                  : 'bg-stone-200 text-stone-700'
                            )}
                          >
                            {p.initials}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-stone-900 block">
                              {p.nome}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {p.wipAtual} de {p.wipLimit} projetos em andamento
                            </span>
                          </div>
                        </div>

                        <div>
                          {p.pode ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {p.vagasDisponiveis} vaga{p.vagasDisponiveis > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                              Lotado (RN003)
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Prioridade */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Prioridade na Fila (1=Urgente, 10=Baixa):
                  </label>
                  <select
                    value={prioridadeAlocacao}
                    onChange={(e) => setPrioridadeAlocacao(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>1 - Crítica / Urgente</option>
                    <option value={2}>2 - Muito Alta</option>
                    <option value={3}>3 - Alta</option>
                    <option value={4}>4 - Média-Alta</option>
                    <option value={5}>5 - Padrão / Normal</option>
                    <option value={7}>7 - Secundária</option>
                    <option value={10}>10 - Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Observação Técnica:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cliente com urgência na entrega..."
                    value={observacaoAlocacao}
                    onChange={(e) => setObservacaoAlocacao(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAlocarModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedProjetistaId || isSubmittingAlocacao}
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-primary-400" />
                  {isSubmittingAlocacao ? 'Alocando...' : 'Confirmar Alocação (RN003)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuração de WIP Limit (Gestão) */}
      {wipModalProjetista && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display font-semibold text-base text-stone-900">
                Ajustar Limite WIP (RN003)
              </h3>
              <button
                onClick={() => setWipModalProjetista(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarWip} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-stone-600">
                  Defina a capacidade máxima de projetos simultâneos para <strong>{wipModalProjetista.nome}</strong>:
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={novoWipLimit}
                    onChange={(e) => setNovoWipLimit(Number(e.target.value))}
                    className="w-24 text-center font-bold text-sm border border-stone-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-stone-500">projetos simultâneos</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Projetos ativos atuais: {wipModalProjetista.wipAtual}. O padrão recomendado pelo SRS v3.0 é 3.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setWipModalProjetista(null)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWip}
                  className="px-4 py-1.5 text-xs font-semibold text-stone-900 bg-primary-500 hover:bg-primary-400 rounded-lg shadow"
                >
                  {isSubmittingWip ? 'Salvando...' : 'Salvar Limite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default FilaIndex
