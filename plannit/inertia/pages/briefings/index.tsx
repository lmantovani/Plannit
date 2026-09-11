import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  User,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { STATUS_BRIEFING_MAP } from '../../lib/briefing_constants'

type BriefingItem = {
  id: number
  projetoId: number
  cidadeObra: string | null
  estadoObra: string | null
  ambientes: string[]
  prazoDesejado: string | null
  faixaInvestimentoMin: number | null
  faixaInvestimentoMax: number | null
  estiloPreferido: string | null
  arquitetoNome: string | null
  score: number
  scoreMinimo: number
  status: string
  aprovado: boolean
  enviadoEm: string | null
  updatedAt: string | null
  projeto: {
    id: number
    codigo: string
    clienteNome: string
    status: string
    vendedor: { id: number; nome: string } | null
  } | null
  qtdAmbientesDetalhados: number
}

type PageProps = {
  briefings: BriefingItem[]
  stats: {
    total: number
    rascunhos: number
    aptosEnvio: number
    enviadosNaFila: number
  }
  projetosSemBriefing: Array<{
    id: number
    codigo: string
    clienteNome: string
  }>
  filters: {
    q: string
    status: string
    scoreAprovado: string
  }
}

const BriefingsIndex: React.FC<PageProps> = ({
  briefings,
  stats,
  projetosSemBriefing,
  filters,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.q || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || '')
  const [scoreFilter, setScoreFilter] = useState(filters.scoreAprovado || '')
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [selectedProjetoId, setSelectedProjetoId] = useState<number | ''>('')
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFilter = (updates: { q?: string; status?: string; scoreAprovado?: string }) => {
    const q = updates.q !== undefined ? updates.q : searchTerm
    const status = updates.status !== undefined ? updates.status : statusFilter
    const scoreAprovado = updates.scoreAprovado !== undefined ? updates.scoreAprovado : scoreFilter

    router.get(
      '/briefings',
      {
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(scoreAprovado ? { scoreAprovado } : {}),
      },
      { preserveState: true, replace: true }
    )
  }

  const handleCreateBriefing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjetoId && !novoClienteNome.trim()) {
      return
    }

    setIsSubmitting(true)
    router.post(
      '/briefings',
      {
        projetoId: selectedProjetoId || undefined,
        clienteNome: !selectedProjetoId ? novoClienteNome : undefined,
      },
      {
        onFinish: () => {
          setIsSubmitting(false)
          setModalNovoOpen(false)
        },
      }
    )
  }

  const handleEnviarFila = (briefingId: number, score: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (score < 70) {
      alert(`Bloqueio RN002: Score atual (${score} pts) é inferior ao mínimo exigido (70 pts). Complete o briefing antes de enviar.`)
      return
    }

    if (confirm('Deseja enviar este briefing para a Fila de Projetos? O projeto avançará para a etapa "Na Fila".')) {
      router.post(`/briefings/${briefingId}/enviar-para-fila`)
    }
  }

  return (
    <AppLayout
      title="Briefings & Score Inteligente"
      subtitle="Qualificação prévia com validação automática de completude (RN002) e envio para a fila"
    >
      <Head title="Briefings — Plannit Líder" />

      <div className="space-y-6">
        {/* Banner Informativo RN002 */}
        <div className="bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-amber-500/5 border border-primary-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20 text-primary-700 mt-0.5 sm:mt-0">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                RN002 — Trava de Qualidade & Score Mínimo
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full">
                  Corte: 70 Pts
                </span>
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Projetos só podem ingressar na fila de desenvolvimento após atingir pelo menos 70 pontos nos 10 critérios
                de qualidade (dados da obra, escopo, detalhes executivos e referências).
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalNovoOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-primary-400" />
            Novo Briefing
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Total de Briefings</span>
              <FileText className="w-4 h-4 text-stone-400" />
            </div>
            <p className="text-2xl font-bold text-stone-900 mt-2 font-display">{stats.total}</p>
            <div className="text-[11px] text-stone-500 mt-1">Registrados na base</div>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Rascunhos</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2 font-display">{stats.rascunhos}</p>
            <div className="text-[11px] text-stone-500 mt-1">Em coleta pelo vendedor</div>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Aptos para Fila (≥ 70 pts)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2 font-display">{stats.aptosEnvio}</p>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Prontos para despachar</div>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Enviados para Fila</span>
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2 font-display">{stats.enviadosNaFila}</p>
            <div className="text-[11px] text-stone-500 mt-1">Aguardando/em projeto</div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, código do projeto, cidade ou arquiteto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter({ q: searchTerm })}
                className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-stone-50/50"
              />
            </div>

            {/* Filtros Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  handleFilter({ status: e.target.value })
                }}
                className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Status</option>
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado para Fila</option>
                <option value="aprovado">Aprovado</option>
                <option value="devolvido">Devolvido</option>
              </select>

              {/* Botão de limpar filtros se houver */}
              {(searchTerm || statusFilter || scoreFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('')
                    setScoreFilter('')
                    router.get('/briefings', {}, { replace: true })
                  }}
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
                  title="Limpar filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Abas de Score */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Score RN002:
            </span>
            <button
              onClick={() => {
                setScoreFilter('')
                handleFilter({ scoreAprovado: '' })
              }}
              className={clsx(
                'px-3 py-1 text-xs rounded-full transition-colors font-medium',
                scoreFilter === ''
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => {
                setScoreFilter('aprovado')
                handleFilter({ scoreAprovado: 'aprovado' })
              }}
              className={clsx(
                'px-3 py-1 text-xs rounded-full transition-colors font-medium flex items-center gap-1.5',
                scoreFilter === 'aprovado'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aptos ≥ 70 pts
            </button>
            <button
              onClick={() => {
                setScoreFilter('reprovado')
                handleFilter({ scoreAprovado: 'reprovado' })
              }}
              className={clsx(
                'px-3 py-1 text-xs rounded-full transition-colors font-medium flex items-center gap-1.5',
                scoreFilter === 'reprovado'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Incompletos &lt; 70 pts
            </button>
          </div>
        </div>

        {/* Tabela de Briefings */}
        <div className="bg-white border border-stone-200/80 rounded-xl shadow-sm overflow-hidden">
          {briefings.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-700">Nenhum briefing encontrado</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Não há registros com os filtros aplicados. Tente limpar os filtros ou inicie um novo briefing.
              </p>
              <button
                onClick={() => setModalNovoOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-stone-900 font-semibold text-xs rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Briefing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/75 text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    <th className="py-3 px-4">Projeto & Cliente</th>
                    <th className="py-3 px-4">Localização & Estilo</th>
                    <th className="py-3 px-4">Ambientes</th>
                    <th className="py-3 px-4">Score de Qualidade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {briefings.map((b) => {
                    const statusConfig = STATUS_BRIEFING_MAP[b.status] || STATUS_BRIEFING_MAP.rascunho
                    const isScoreAprovado = b.score >= b.scoreMinimo

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                        onClick={() => router.get(`/briefings/${b.id}/edit`)}
                      >
                        {/* Projeto e Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-900 text-sm group-hover:text-primary-600 transition-colors">
                            {b.projeto?.clienteNome || 'Cliente não identificado'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            <span className="font-mono font-medium text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              {b.projeto?.codigo || `BRIEF-#${b.id}`}
                            </span>
                            {b.projeto?.vendedor && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-stone-400" />
                                {b.projeto.vendedor.nome}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Localização e Estilo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-stone-800">
                            <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            {b.cidadeObra ? `${b.cidadeObra}${b.estadoObra ? ` - ${b.estadoObra}` : ''}` : 'Não informada'}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {b.estiloPreferido || 'Estilo não definido'}
                          </div>
                        </td>

                        {/* Ambientes */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {b.ambientes && b.ambientes.length > 0 ? (
                              b.ambientes.slice(0, 3).map((amb) => (
                                <span
                                  key={amb}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-stone-100 text-stone-700 rounded-md border border-stone-200 capitalize"
                                >
                                  {amb.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">Nenhum</span>
                            )}
                            {b.ambientes && b.ambientes.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-stone-500 bg-stone-50 rounded">
                                +{b.ambientes.length - 3}
                              </span>
                            )}
                          </div>
                          {b.qtdAmbientesDetalhados > 0 && (
                            <div className="text-[10px] text-primary-700 font-medium mt-1">
                              {b.qtdAmbientesDetalhados} ambiente(s) detalhado(s)
                            </div>
                          )}
                        </td>

                        {/* Score de Qualidade */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 w-28 bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                              <div
                                className={clsx(
                                  'h-full rounded-full transition-all duration-500',
                                  b.score >= 70
                                    ? 'bg-emerald-500'
                                    : b.score >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                )}
                                style={{ width: `${Math.min(100, Math.max(0, b.score))}%` }}
                              />
                            </div>
                            <span
                              className={clsx(
                                'text-xs font-bold font-mono',
                                b.score >= 70
                                  ? 'text-emerald-700'
                                  : b.score >= 50
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                              )}
                            >
                              {b.score.toFixed(0)} pts
                            </span>
                          </div>
                          <div className="text-[10px] mt-1">
                            {isScoreAprovado ? (
                              <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Apto p/ Fila
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium inline-flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3" /> Faltam {Math.ceil(70 - b.score)} pts
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                              statusConfig.badge
                            )}
                          >
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {b.status === 'rascunho' && (
                              <button
                                onClick={(e) => handleEnviarFila(b.id, b.score, e)}
                                disabled={!isScoreAprovado}
                                title={
                                  isScoreAprovado
                                    ? 'Enviar diretamente para a Fila de Projetos'
                                    : 'Bloqueado por RN002: Score mínimo de 70 pts não atingido'
                                }
                                className={clsx(
                                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shadow-sm',
                                  isScoreAprovado
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                )}
                              >
                                <Send className="w-3 h-3" />
                                Enviar p/ Fila
                              </button>
                            )}

                            <Link
                              href={`/briefings/${b.id}/edit`}
                              className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors inline-flex items-center"
                              title="Editar Briefing"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Briefing */}
      {modalNovoOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-display font-semibold text-lg text-stone-900">Iniciar Novo Briefing</h3>
              <button
                onClick={() => setModalNovoOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBriefing} className="mt-4 space-y-4">
              {projetosSemBriefing.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Vincular a Projeto Existente:
                  </label>
                  <select
                    value={selectedProjetoId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : ''
                      setSelectedProjetoId(val)
                      if (val) setNovoClienteNome('')
                    }}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Selecione ou crie um novo abaixo --</option>
                    {projetosSemBriefing.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} — {p.clienteNome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                  ou criar novo projeto
                </span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome Completo do Cliente:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Fernando Silveira"
                  value={novoClienteNome}
                  disabled={Boolean(selectedProjetoId)}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-stone-100 disabled:text-stone-400"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Um código sequencial de projeto (ex: PRJ-2026-00X) será gerado automaticamente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalNovoOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={(!selectedProjetoId && !novoClienteNome.trim()) || isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-stone-900 bg-primary-500 hover:bg-primary-400 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Iniciando...' : 'Iniciar Briefing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default BriefingsIndex
