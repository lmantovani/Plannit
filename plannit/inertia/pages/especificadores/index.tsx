import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  Compass,
  Search,
  SlidersHorizontal,
  Plus,
  ExternalLink,
  Edit2,
  UserCheck,
  Phone,
  Mail,
  ChevronRight,
  FilterX,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  EspecificadorListItem,
  KpisCarteira,
  MinhaMetaVisitas,
  ConsultorOption,
} from './types'
import {
  TIPO_ESPECIFICADOR_LABELS,
  TIPO_ESPECIFICADOR_COLORS,
  STATUS_CARTEIRA_CONFIG,
  SEGMENTO_CONFIG,
  FLAG_CONFIG,
} from '../../lib/constants'
import { EspecificadoresKpiPanel } from './components/EspecificadoresKpiPanel'
import { EspecificadorDrawer } from './components/EspecificadorDrawer'
import { NovoEspecificadorModal } from './components/NovoEspecificadorModal'
import { EditarEspecificadorModal } from './components/EditarEspecificadorModal'
import { ReatribuirDonoModal } from './components/ReatribuirDonoModal'
import { MetasVisitasModal } from './components/MetasVisitasModal'

interface IndexProps {
  especificadores: EspecificadorListItem[]
  kpis: KpisCarteira
  minhaMeta: MinhaMetaVisitas | null
  consultores: ConsultorOption[]
  filtros: {
    busca: string
    tipo: string
    statusCarteira: string
    consultorId: string
  }
}

export default function EspecificadoresIndex({
  especificadores = [],
  kpis,
  minhaMeta,
  consultores = [],
  filtros,
}: IndexProps) {
  // Filtros locais
  const [busca, setBusca] = useState(filtros.busca || '')
  const [tipo, setTipo] = useState(filtros.tipo || '')
  const [statusCarteira, setStatusCarteira] = useState(filtros.statusCarteira || '')
  const [consultorId, setConsultorId] = useState(filtros.consultorId || '')

  // Modais e Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedArquitetoId, setSelectedArquitetoId] = useState<number | null>(null)
  const [selectedArquiteto, setSelectedArquiteto] = useState<EspecificadorListItem | null>(null)

  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [arquitetoParaEditar, setArquitetoParaEditar] = useState<EspecificadorListItem | null>(null)

  const [modalReatribuirOpen, setModalReatribuirOpen] = useState(false)
  const [arquitetoParaReatribuir, setArquitetoParaReatribuir] = useState<EspecificadorListItem | null>(null)

  const [modalMetasOpen, setModalMetasOpen] = useState(false)

  // Dispara consulta filtrada via Inertia
  const aplicarFiltros = (novosFiltros?: Partial<typeof filtros>) => {
    const params: Record<string, string> = {}
    const b = novosFiltros?.busca !== undefined ? novosFiltros.busca : busca
    const t = novosFiltros?.tipo !== undefined ? novosFiltros.tipo : tipo
    const s = novosFiltros?.statusCarteira !== undefined ? novosFiltros.statusCarteira : statusCarteira
    const c = novosFiltros?.consultorId !== undefined ? novosFiltros.consultorId : consultorId

    if (b.trim()) params.busca = b.trim()
    if (t) params.tipo = t
    if (s) params.statusCarteira = s
    if (c) params.consultorId = c

    router.get('/especificadores', params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    })
  }

  const limparFiltros = () => {
    setBusca('')
    setTipo('')
    setStatusCarteira('')
    setConsultorId('')
    router.get('/especificadores', {}, { preserveState: true, replace: true })
  }

  const temFiltroAtivo = Boolean(busca || tipo || statusCarteira || consultorId)

  const handleOpenDrawer = (item: EspecificadorListItem) => {
    setSelectedArquitetoId(item.id)
    setSelectedArquiteto(item)
    setDrawerOpen(true)
  }

  const handleOpenEditar = (item: EspecificadorListItem) => {
    setArquitetoParaEditar(item)
    setModalEditarOpen(true)
  }

  const handleOpenReatribuir = (item: EspecificadorListItem) => {
    setArquitetoParaReatribuir(item)
    setModalReatribuirOpen(true)
  }

  return (
    <AppLayout
      title="Especificadores & Arquitetos"
      subtitle="Gestão de carteira comercial, pontuação multidimensional RFV e relacionamento"
    >
      <Head title="Especificadores — Plannit" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Header com Botão de Cadastro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display text-stone-900 flex items-center gap-2.5">
              <Compass size={24} className="text-primary-600" />
              Gestão de Especificadores
            </h1>
            <p className="text-xs text-stone-500">
              Acompanhe o engajamento de arquitetos e designers de interiores parceiros da Líder Móveis
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoOpen(true)}
            className="btn btn-primary btn-sm gap-2 shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            Novo Especificador
          </button>
        </div>

        {/* Painel Superior de KPIs de Carteira */}
        {kpis && (
          <EspecificadoresKpiPanel
            kpis={kpis}
            minhaMeta={minhaMeta}
            onOpenMetasModal={() => setModalMetasOpen(true)}
          />
        )}

        {/* Toolbar de Filtros Combinados e Busca */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Campo de Busca Textual */}
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros({ busca })}
                placeholder="Buscar por nome, escritório, telefone ou e-mail..."
                className="input pl-10 w-full text-xs"
              />
            </div>

            {/* Filtros em Linha */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro Tipo */}
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                  aplicarFiltros({ tipo: e.target.value })
                }}
                className="input text-xs w-full sm:w-auto min-w-[140px]"
              >
                <option value="">Todos os Tipos</option>
                {Object.entries(TIPO_ESPECIFICADOR_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Filtro Status Carteira */}
              <select
                value={statusCarteira}
                onChange={(e) => {
                  setStatusCarteira(e.target.value)
                  aplicarFiltros({ statusCarteira: e.target.value })
                }}
                className="input text-xs w-full sm:w-auto min-w-[140px]"
              >
                <option value="">Todos os Status</option>
                {Object.entries(STATUS_CARTEIRA_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              {/* Filtro Consultor */}
              <select
                value={consultorId}
                onChange={(e) => {
                  setConsultorId(e.target.value)
                  aplicarFiltros({ consultorId: e.target.value })
                }}
                className="input text-xs w-full sm:w-auto min-w-[150px]"
              >
                <option value="">Todos os Consultores</option>
                {consultores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              {/* Botão Aplicar Busca */}
              <button
                type="button"
                onClick={() => aplicarFiltros()}
                className="btn btn-secondary btn-sm text-xs gap-1"
              >
                <SlidersHorizontal size={13} />
                Filtrar
              </button>

              {/* Botão Limpar Filtros */}
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  title="Limpar todos os filtros"
                  className="btn btn-ghost btn-sm text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
                >
                  <FilterX size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Especificadores */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-3xs font-semibold">
                  <th className="py-3 px-4">Especificador / Escritório</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Consultor Dono</th>
                  <th className="py-3 px-4">Segmento & Score</th>
                  <th className="py-3 px-4">Flags Ativas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {especificadores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <Compass size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium text-sm text-stone-600">
                        Nenhum parceiro encontrado
                      </p>
                      <p className="text-2xs text-stone-400 mt-0.5">
                        Tente ajustar os filtros de busca ou cadastre um novo especificador.
                      </p>
                      {temFiltroAtivo && (
                        <button
                          type="button"
                          onClick={limparFiltros}
                          className="btn btn-secondary btn-sm mt-3 text-xs"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  especificadores.map((esp) => {
                    const statusCfg = STATUS_CARTEIRA_CONFIG[esp.statusCarteira] || {
                      label: esp.statusCarteira,
                      bg: 'bg-stone-100',
                      text: 'text-stone-700',
                      border: 'border-stone-200',
                    }

                    const segmentoCfg = esp.score?.segmento
                      ? SEGMENTO_CONFIG[esp.score.segmento] || {
                          label: esp.score.segmento,
                          bg: 'bg-stone-100',
                          text: 'text-stone-700',
                          border: 'border-stone-200',
                        }
                      : null

                    const flags = esp.score?.flags || []

                    return (
                      <tr
                        key={esp.id}
                        className="hover:bg-amber-50/20 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDrawer(esp)}
                      >
                        {/* Coluna 1: Nome, Escritório e Tipo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-display font-semibold text-stone-700 text-sm flex-shrink-0 group-hover:border-primary-300 group-hover:bg-primary-50 transition-colors">
                              {esp.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-stone-900 group-hover:text-primary-700 transition-colors truncate">
                                {esp.nome}
                              </div>
                              <div className="text-2xs text-stone-500 truncate">
                                {esp.escritorio || 'Autônomo'}
                              </div>
                              <div className="mt-1">
                                <span
                                  className={clsx(
                                    'inline-flex items-center px-1.5 py-0.2 rounded text-3xs font-medium border',
                                    TIPO_ESPECIFICADOR_COLORS[esp.tipo] ||
                                      'bg-stone-50 text-stone-600 border-stone-200'
                                  )}
                                >
                                  {TIPO_ESPECIFICADOR_LABELS[esp.tipo] || esp.tipo}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Coluna 2: Contato */}
                        <td className="py-3.5 px-4 text-stone-600" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            {esp.telefone ? (
                              <a
                                href={`tel:${esp.telefone}`}
                                className="flex items-center gap-1.5 hover:text-primary-600 transition-colors text-2xs"
                              >
                                <Phone size={12} className="text-stone-400 flex-shrink-0" />
                                <span>{esp.telefone}</span>
                              </a>
                            ) : (
                              <span className="text-stone-300 text-2xs">Sem telefone</span>
                            )}
                            {esp.email && (
                              <a
                                href={`mailto:${esp.email}`}
                                className="flex items-center gap-1.5 hover:text-primary-600 transition-colors text-2xs truncate max-w-[180px]"
                              >
                                <Mail size={12} className="text-stone-400 flex-shrink-0" />
                                <span className="truncate">{esp.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Coluna 3: Consultor Dono */}
                        <td className="py-3.5 px-4 text-stone-700">
                          {esp.consultor ? (
                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-stone-400" />
                              <span className="font-medium text-2xs">{esp.consultor.nome}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 text-2xs italic">Não atribuído</span>
                          )}
                        </td>

                        {/* Coluna 4: Segmento & Score */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-display text-stone-900 font-mono">
                                {esp.score ? esp.score.scoreGeral.toFixed(0) : '—'}
                              </span>
                              <span className="text-3xs text-stone-400">/100</span>
                            </div>
                            {segmentoCfg && (
                              <div>
                                <span
                                  className={clsx(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold border',
                                    segmentoCfg.bg,
                                    segmentoCfg.text,
                                    segmentoCfg.border
                                  )}
                                >
                                  {segmentoCfg.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Coluna 5: Flags Ativas */}
                        <td className="py-3.5 px-4">
                          {flags.length === 0 ? (
                            <span className="text-stone-300 text-3xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {flags.map((flag) => {
                                const cfg = FLAG_CONFIG[flag] || {
                                  label: flag,
                                  bg: 'bg-stone-100',
                                  text: 'text-stone-700',
                                  border: 'border-stone-200',
                                }
                                return (
                                  <span
                                    key={flag}
                                    className={clsx(
                                      'inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-medium border',
                                      cfg.bg,
                                      cfg.text,
                                      cfg.border
                                    )}
                                  >
                                    {cfg.label}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>

                        {/* Coluna 6: Status da Carteira */}
                        <td className="py-3.5 px-4">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold border uppercase',
                              statusCfg.bg,
                              statusCfg.text,
                              statusCfg.border
                            )}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Coluna 7: Ações */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditar(esp)}
                              title="Editar cadastro"
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReatribuir(esp)}
                              title="Reatribuir dono da carteira (RN017)"
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <UserCheck size={14} />
                            </button>
                            <a
                              href={`/especificadores/${esp.id}`}
                              title="Abrir página completa"
                              className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(esp)}
                              title="Ver painel lateral"
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer Lateral */}
      <EspecificadorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        arquitetoId={selectedArquitetoId}
        initialData={selectedArquiteto}
        consultores={consultores}
        onEditar={(arq) => handleOpenEditar(arq)}
        onReatribuir={(arq) => handleOpenReatribuir(arq)}
      />

      {/* Modal Novo Especificador */}
      <NovoEspecificadorModal
        open={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        consultores={consultores}
      />

      {/* Modal Editar Especificador */}
      <EditarEspecificadorModal
        open={modalEditarOpen}
        onClose={() => {
          setModalEditarOpen(false)
          setArquitetoParaEditar(null)
        }}
        arquiteto={arquitetoParaEditar}
      />

      {/* Modal Reatribuir Dono (RN017) */}
      <ReatribuirDonoModal
        open={modalReatribuirOpen}
        onClose={() => {
          setModalReatribuirOpen(false)
          setArquitetoParaReatribuir(null)
        }}
        arquiteto={arquitetoParaReatribuir}
        consultores={consultores}
      />

      {/* Modal Metas de Visitas */}
      <MetasVisitasModal
        open={modalMetasOpen}
        onClose={() => setModalMetasOpen(false)}
        consultores={consultores}
      />
    </AppLayout>
  )
}
