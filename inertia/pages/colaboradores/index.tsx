import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '~/layouts/app_layout'
import {
  Search,
  Plus,
  Building2,
  Calendar,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react'
import type {
  ColaboradorItem,
  HeadcountKpis,
  DepartamentoOption,
  CargoOption,
  GestorOption,
} from './types'
import NovoColaboradorModal from './components/NovoColaboradorModal'

interface Props {
  colaboradores: ColaboradorItem[]
  kpis: HeadcountKpis
  departamentos: DepartamentoOption[]
  cargos: CargoOption[]
  gestores: GestorOption[]
  filtros: {
    q: string
    departamentoId: string | number
    cargoId: string | number
    regime: string
    modalidade: string
    includeInactive: boolean
  }
  isDiretoria: boolean
}

export default function ColaboradoresIndex({
  colaboradores,
  kpis,
  departamentos,
  cargos,
  gestores,
  filtros,
}: Props) {
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [busca, setBusca] = useState(filtros.q || '')
  const [deptoId, setDeptoId] = useState(String(filtros.departamentoId || ''))
  const [cargoId, setCargoId] = useState(String(filtros.cargoId || ''))
  const [regime, setRegime] = useState(filtros.regime || '')
  const [modalidade, setModalidade] = useState(filtros.modalidade || '')
  const [includeInactive, setIncludeInactive] = useState(filtros.includeInactive)

  const aplicarFiltros = () => {
    router.get(
      '/colaboradores',
      {
        q: busca || undefined,
        departamentoId: deptoId || undefined,
        cargoId: cargoId || undefined,
        regime: regime || undefined,
        modalidade: modalidade || undefined,
        includeInactive: includeInactive ? 'true' : undefined,
      },
      { preserveState: true }
    )
  }

  const limparFiltros = () => {
    setBusca('')
    setDeptoId('')
    setCargoId('')
    setRegime('')
    setModalidade('')
    setIncludeInactive(false)
    router.get('/colaboradores', {}, { preserveState: true })
  }

  const getDiscBadge = (primario?: string | null, secundario?: string | null) => {
    if (!primario) return null
    const map: Record<string, { label: string; cor: string }> = {
      dominante: { label: 'D', cor: 'bg-red-100 text-red-800 border-red-200' },
      influente: { label: 'I', cor: 'bg-amber-100 text-amber-800 border-amber-200' },
      estavel: { label: 'S', cor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      cauteloso: { label: 'C', cor: 'bg-blue-100 text-blue-800 border-blue-200' },
    }
    const p = map[primario] || { label: primario.slice(0, 1).toUpperCase(), cor: 'bg-stone-100 text-stone-700' }
    const s = secundario && map[secundario] ? map[secundario].label : ''

    return (
      <span
        title={`DISC: ${primario}${secundario ? ` / ${secundario}` : ''}`}
        className={`inline-flex items-center justify-center font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${p.cor}`}
      >
        {p.label}
        {s ? `/${s}` : ''}
      </span>
    )
  }

  return (
    <AppLayout title="Colaboradores & RH" subtitle="Gestão de headcount, organograma e histórico funcional inviolável">
      <Head title="Colaboradores — Líder Móveis Planejados" />

      <div className="space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
        {/* Painel de KPIs de Headcount */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="card p-3.5 bg-white border border-stone-200/80 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Equipe</span>
            <span className="text-xl font-bold font-display text-stone-900 mt-1">{kpis.total}</span>
            <span className="text-[10px] text-stone-400 mt-0.5">Cadastros totais</span>
          </div>

          <div className="card p-3.5 bg-emerald-50/60 border border-emerald-200/60 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Ativos</span>
            <span className="text-xl font-bold font-display text-emerald-700 mt-1">{kpis.ativos}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5">Em atividade</span>
          </div>

          <div className="card p-3.5 bg-white border border-stone-200/80 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">CLT</span>
            <span className="text-xl font-bold font-display text-primary-700 mt-1">{kpis.clt}</span>
            <span className="text-[10px] text-stone-400 mt-0.5">Regime CLT</span>
          </div>

          <div className="card p-3.5 bg-white border border-stone-200/80 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">PJ</span>
            <span className="text-xl font-bold font-display text-stone-800 mt-1">{kpis.pj}</span>
            <span className="text-[10px] text-stone-400 mt-0.5">Pessoa Jurídica</span>
          </div>

          <div className="card p-3.5 bg-white border border-stone-200/80 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Presencial / Híbr.</span>
            <span className="text-xl font-bold font-display text-stone-800 mt-1">
              {kpis.presencial} / {kpis.hibrido}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5">Remoto: {kpis.remoto}</span>
          </div>

          <div className="card p-3.5 bg-stone-50 border border-stone-200/80 shadow-sm flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Desligados</span>
            <span className="text-xl font-bold font-display text-stone-600 mt-1">{kpis.desligados}</span>
            <span className="text-[10px] text-stone-400 mt-0.5">Histórico retido</span>
          </div>
        </div>

        {/* Barra de Filtros & Ação */}
        <div className="card p-4 bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou e-mail..."
                className="input input-sm pl-9 w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={aplicarFiltros}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
              >
                <Filter size={14} />
                <span>Filtrar</span>
              </button>

              <button
                type="button"
                onClick={limparFiltros}
                className="btn btn-secondary btn-sm text-stone-500"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => setModalNovoOpen(true)}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                <span>Novo Colaborador</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
            <div>
              <select
                className="select select-sm w-full text-xs"
                value={deptoId}
                onChange={(e) => setDeptoId(e.target.value)}
              >
                <option value="">Todos os Departamentos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="select select-sm w-full text-xs"
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
              >
                <option value="">Todos os Cargos</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="select select-sm w-full text-xs"
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
              >
                <option value="">Todos os Regimes</option>
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
              </select>
            </div>

            <div className="flex items-center justify-between pl-2">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                <span>Exibir desligados</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="card bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">Colaborador</th>
                  <th className="py-3 px-3 text-left font-semibold">Cargo / Departamento</th>
                  <th className="py-3 px-3 text-left font-semibold">Contrato / Regime</th>
                  <th className="py-3 px-3 text-left font-semibold">Remuneração Base</th>
                  <th className="py-3 px-3 text-center font-semibold">DISC</th>
                  <th className="py-3 px-3 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((colab) => {
                    const iniciais = colab.nome
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <tr key={colab.id} className="hover:bg-stone-50/60 transition-colors">
                        {/* Identificação */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-800 font-semibold font-display text-xs shrink-0">
                              {iniciais}
                            </div>
                            <div>
                              <Link
                                href={`/colaboradores/${colab.id}`}
                                className="font-semibold text-stone-900 hover:text-primary-700 transition-colors block text-xs"
                              >
                                {colab.nome}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                <span>CPF: {colab.cpf}</span>
                                {colab.telefoneCorporativo && (
                                  <span className="flex items-center gap-0.5 text-stone-400">
                                    <Phone size={10} />
                                    {colab.telefoneCorporativo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cargo & Departamento */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-stone-800">
                            {colab.cargo?.nome || 'Sem cargo'}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} />
                            {colab.departamento?.nome || 'Geral'}
                          </div>
                        </td>

                        {/* Contrato / Modalidade */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`badge text-[10px] font-semibold uppercase ${
                                colab.regime === 'clt'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {colab.regime.toUpperCase()}
                            </span>
                            <span className="text-[11px] text-stone-500 capitalize">
                              {colab.modalidade}
                            </span>
                          </div>
                          {colab.dataAdmissao && (
                            <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                              <Calendar size={10} />
                              Desde {colab.dataAdmissao.split('-').reverse().join('/')}
                            </div>
                          )}
                        </td>

                        {/* Remuneração */}
                        <td className="py-3 px-3">
                          {colab.regime === 'clt' ? (
                            <div>
                              <span className="font-semibold text-stone-800">
                                {colab.salarioClt !== null && colab.salarioClt !== undefined
                                  ? `R$ ${Number(colab.salarioClt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                  : '—'}
                              </span>
                              {colab.remuneracaoComplementar ? (
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  + R$ {Number(colab.remuneracaoComplementar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} compl.
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-purple-800">
                                {colab.pjValorMensal !== null && colab.pjValorMensal !== undefined
                                  ? `R$ ${Number(colab.pjValorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
                                  : '—'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* DISC */}
                        <td className="py-3 px-3 text-center">
                          {getDiscBadge(colab.perfilDiscPrimario, colab.perfilDiscSecundario) || (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {colab.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                              <XCircle size={11} />
                              Desligado
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/colaboradores/${colab.id}`}
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1 text-[11px] py-1 px-2.5"
                          >
                            <Eye size={12} />
                            <span>Prontuário</span>
                          </Link>
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

      {/* Modal Novo Colaborador */}
      <NovoColaboradorModal
        isOpen={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        departamentos={departamentos}
        cargos={cargos}
        gestores={gestores}
      />
    </AppLayout>
  )
}
