import React, { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  FolderKanban,
  Search,
  SlidersHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Palette,
  Plus,
  X,
} from 'lucide-react'

import clsx from 'clsx'

interface ProjetoItem {
  id: number
  codigo: string
  clienteNome: string
  clienteId: number | null
  vendedorId: number | null
  vendedorNome: string
  projetistaId: number | null
  projetistaNome: string
  arquitetoNome: string | null
  status: string
  statusLabel: string
  valorContrato: number | null
  prazoEntregaEstimado: string | null
  diasParado: number
  alertaParado: boolean
  arquivado: boolean
  arquivadoMotivo: string | null
  totalVersoes3D: number
  statusVersao3D: string | null
  statusVersao3DLabel: string
  temRenderAprovado: boolean
  briefingScore: number | null
  updatedAt: string | null
  statusAlteradoEm: string | null
}

interface Props {
  projetos: ProjetoItem[]
  stats: {
    total: number
    emProjeto: number
    aguardandoValidacao: number
    emRender: number
    aguardandoApresentacao: number
    estagnados: number
  }
  filters: {
    q: string
    status: string
    arquivado: boolean
    estagnados?: boolean
  }
  statusOptions: Array<{ value: string; label: string }>
}

export default function ProjetosIndex({ projetos, stats, filters, statusOptions }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.q || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || '')
  const [mostrarArquivados, setMostrarArquivados] = useState(filters.arquivado || false)
  const [apenasEstagnados, setApenasEstagnados] = useState(Boolean(filters.estagnados))
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [clienteNome, setClienteNome] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setApenasEstagnados(Boolean(filters.estagnados))
  }, [filters.estagnados])

  const toggleEstagnados = () => {
    const nextVal = !apenasEstagnados
    setApenasEstagnados(nextVal)
    aplicarFiltros({ estagnados: nextVal })
  }

  const handleCriarProjeto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteNome.trim()) return

    setIsSubmitting(true)
    router.post(
      '/briefings',
      { clienteNome },
      {
        onFinish: () => {
          setIsSubmitting(false)
          setModalNovoOpen(false)
        },
      }
    )
  }

  const aplicarFiltros = (novosFiltros: { q?: string; status?: string; arquivado?: boolean; estagnados?: boolean }) => {
    const estVal = novosFiltros.estagnados !== undefined ? novosFiltros.estagnados : apenasEstagnados
    router.get(
      '/projetos',
      {
        q: novosFiltros.q !== undefined ? novosFiltros.q : searchTerm,
        status: novosFiltros.status !== undefined ? novosFiltros.status : statusFilter,
        arquivado: novosFiltros.arquivado !== undefined ? novosFiltros.arquivado : mostrarArquivados,
        ...(estVal ? { estagnados: 'true' } : {}),
      },
      { preserveState: true }
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    aplicarFiltros({ q: searchTerm })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_projeto':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'aguard_validacao':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
      case 'em_render':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'aguard_apresentacao':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'em_ajuste':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'em_fechamento':
      case 'aguard_assinatura':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'concluido':
        return 'bg-stone-100 text-stone-700 border-stone-300'
      case 'cancelado':
        return 'bg-red-50 text-red-600 border-red-200 line-through'
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200'
    }
  }

  const getStatus3DColor = (status: string | null) => {
    switch (status) {
      case 'aguard_validacao_vendedor':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'aprovado':
      case 'finalizado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'devolvido':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'em_render':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-stone-100 text-stone-500 border-stone-200'
    }
  }

  return (
    <AppLayout
      title="Projetos & Validação de Render"
      subtitle="Sala de controle do desenvolvimento 3D, aprovações de maquetes e governança"
    >
      <Head title="Projetos & Render | Líder Móveis" />

      <div className="space-y-6">
        {/* Top Header com Badges das RNs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <FolderKanban size={22} />
              </div>
              <div>
                <h1 className="text-xl font-display font-semibold text-stone-900">
                  Carteira Operacional de Projetos
                </h1>
                <p className="text-xs text-stone-500">
                  Gestão integrada de maquetes 3D, renderizações fotorrealistas e linha do tempo
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalNovoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Plus size={14} className="text-primary-400" />
              <span>Novo Projeto</span>
            </button>

            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200"
              title="RN004: Renderização só avança com aprovação formal do vendedor responsável"
            >
              <ShieldCheck size={14} /> RN004: Validação Vendedor
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="RN005: Apresentação ao cliente estritamente bloqueada sem render aprovado e concluído"
            >
              <CheckCircle2 size={14} /> RN005: Trava de Apresentação
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200"
              title="RN017: Preservação de histórico imutável e soft delete permanente"
            >
              <Clock size={14} /> RN017: Histórico Imutável
            </span>
          </div>
        </div>

        {/* Alerta de Estagnação RN016 se houver projetos parados > 5 dias */}
        {stats.estagnados > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-950 flex items-center gap-2">
                  Alerta de Governança RN016 — {stats.estagnados} Projeto(s) Estagnado(s)
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Existem projetos na carteira sem movimentação há mais de 5 dias na mesma etapa.
                  Acesse a Sala de Controle dos projetos destacados para atualizar o status ou
                  solicitar ações à equipe comercial/técnica.
                </p>
              </div>
            </div>
            <button
              onClick={toggleEstagnados}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0',
                apenasEstagnados
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              )}
            >
              {apenasEstagnados ? (
                <>
                  <X size={14} /> Exibir Todos os Projetos
                </>
              ) : (
                <>
                  <AlertTriangle size={14} /> Filtrar Apenas Estagnados ({stats.estagnados})
                </>
              )}
            </button>
          </div>
        )}

        {/* KPIs de Topo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
              Total Ativos
            </span>
            <span className="text-2xl font-bold font-display text-stone-900 mt-1 block">
              {stats.total}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block">
              Em Projeto
            </span>
            <span className="text-2xl font-bold font-display text-blue-700 mt-1 block">
              {stats.emProjeto}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block">
              Aguard. Validação
            </span>
            <span className="text-2xl font-bold font-display text-amber-700 mt-1 block">
              {stats.aguardandoValidacao}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-medium text-purple-600 uppercase tracking-wider block">
              Em Render
            </span>
            <span className="text-2xl font-bold font-display text-purple-700 mt-1 block">
              {stats.emRender}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">
              Para Apresentação
            </span>
            <span className="text-2xl font-bold font-display text-emerald-700 mt-1 block">
              {stats.aguardandoApresentacao}
            </span>
          </div>

          <div
            onClick={toggleEstagnados}
            className={clsx(
              'p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:scale-[1.02] select-none',
              apenasEstagnados
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                : 'bg-white border-stone-200 hover:border-rose-300'
            )}
            title="Clique para alternar o filtro de projetos estagnados (>5 dias)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block">
                Estagnados (&gt;5d)
              </span>
              {apenasEstagnados && (
                <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.2 rounded">
                  Filtrado
                </span>
              )}
            </div>
            <span className="text-2xl font-bold font-display text-rose-700 mt-1 block">
              {stats.estagnados}
            </span>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por código ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  aplicarFiltros({ status: e.target.value })
                }}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Todas as Etapas</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleEstagnados}
              className={clsx(
                'flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors select-none font-medium',
                apenasEstagnados
                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              )}
            >
              <AlertTriangle size={13} className={apenasEstagnados ? 'text-rose-600' : 'text-stone-400'} />
              <span>Estagnados ({stats.estagnados})</span>
              {apenasEstagnados && <X size={13} className="ml-0.5 text-rose-600" />}
            </button>

            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
              <input
                type="checkbox"
                checked={mostrarArquivados}
                onChange={(e) => {
                  setMostrarArquivados(e.target.checked)
                  aplicarFiltros({ arquivado: e.target.checked })
                }}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Mostrar Arquivados (RN017)
            </label>
          </div>
        </div>

        {/* Banner de Filtro Ativo */}
        {apenasEstagnados && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-rose-900 shadow-2xs">
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-600 flex-shrink-0" />
              <span>
                Filtro ativo: Exibindo <strong>{projetos.length}</strong> projeto(s) estagnado(s) há mais de 5 dias (Regra RN016).
              </span>
            </span>
            <button
              onClick={toggleEstagnados}
              className="text-rose-700 hover:text-rose-950 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Limpar filtro
            </button>
          </div>
        )}

        {/* Tabela de Projetos */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {projetos.length === 0 ? (
            <div className="p-12 text-center">
              <FolderKanban size={40} className="mx-auto text-stone-300 mb-3" />
              <h3 className="text-base font-semibold text-stone-800">Nenhum projeto encontrado</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tente ajustar seus termos de busca ou filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Código / Projeto</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Equipe Responsável</th>
                    <th className="py-3.5 px-4">Status da Maquete 3D</th>
                    <th className="py-3.5 px-4">Etapa do Fluxo</th>
                    <th className="py-3.5 px-4 text-center">SLA / Parado</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {projetos.map((proj) => (
                    <tr
                      key={proj.id}
                      className={clsx(
                        'hover:bg-stone-50/60 transition-colors',
                        proj.alertaParado && 'bg-amber-50/20'
                      )}
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {proj.codigo}
                          </span>
                          {proj.valorContrato && (
                            <span className="text-[11px] text-stone-500 mt-0.5">
                              R$ {proj.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {proj.briefingScore && (
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              Briefing Score: <strong className="text-stone-600">{proj.briefingScore}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-stone-900">{proj.clienteNome}</span>
                          {proj.arquitetoNome && (
                            <span className="text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200/50 mt-1 inline-block w-fit">
                              Esp: {proj.arquitetoNome}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Equipe */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-stone-700 text-xs">
                            <span className="text-stone-400 text-[10px] uppercase">Vend:</span>{' '}
                            <strong>{proj.vendedorNome}</strong>
                          </div>
                          <div className="text-stone-600 text-xs">
                            <span className="text-stone-400 text-[10px] uppercase">Proj:</span>{' '}
                            {proj.projetistaNome}
                          </div>
                        </div>
                      </td>

                      {/* Status Maquete 3D & Render */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                              getStatus3DColor(proj.statusVersao3D)
                            )}
                          >
                            <Palette size={12} />
                            {proj.statusVersao3DLabel}
                          </span>
                          {proj.totalVersoes3D > 0 && (
                            <span className="text-[10px] text-stone-400 block">
                              {proj.totalVersoes3D} versão(ões) desenvolvida(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Etapa do Fluxo Líder */}
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                            getStatusColor(proj.status)
                          )}
                        >
                          {proj.statusLabel}
                        </span>
                      </td>

                      {/* SLA / Alerta RN016 */}
                      <td className="py-3.5 px-4 text-center">
                        {proj.alertaParado ? (
                          <div
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 shadow-xs"
                            title="Projeto estagnado há mais de 5 dias na mesma fase (RN016)"
                          >
                            <AlertTriangle size={13} /> {proj.diasParado} dias
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[11px] inline-flex items-center gap-1">
                            <Clock size={12} className="text-stone-400" /> {proj.diasParado} d
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/projetos/${proj.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
                        >
                          <Eye size={13} /> Sala de Controle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Projeto / Briefing */}
      {modalNovoOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  <FolderKanban size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Iniciar Novo Projeto</h3>
                  <p className="text-[11px] text-stone-500">Cria a ficha oficial do projeto e o briefing técnico</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCriarProjeto} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nome do Cliente ou Obra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Mariana Vasconcelos — Apto Jardins"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-stone-50/50"
                  autoFocus
                />
                <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
                  O sistema gerará um código oficial (ex: <code>PRJ-2026-XXX</code>) e abrirá imediatamente o Briefing Inteligente para inserção de cômodos e acabamentos.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalNovoOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clienteNome.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Iniciando...' : 'Criar & Abrir Briefing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
