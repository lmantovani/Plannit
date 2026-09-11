import React from 'react'
import {
  Compass,
  TrendingUp,
  Target,
  MessageSquare,
  Building2,
  Settings,
  CheckCircle2,
} from 'lucide-react'
import clsx from 'clsx'
import type { KpisCarteira, MinhaMetaVisitas } from '../types'

interface EspecificadoresKpiPanelProps {
  kpis: KpisCarteira
  minhaMeta: MinhaMetaVisitas | null
  onOpenMetasModal?: () => void
}

export const EspecificadoresKpiPanel: React.FC<EspecificadoresKpiPanelProps> = ({
  kpis,
  minhaMeta,
  onOpenMetasModal,
}) => {
  return (
    <div className="space-y-4">
      {/* Cabeçalho do Painel com Ação de Configuração */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Indicadores de Performance da Carteira
        </h3>
        {onOpenMetasModal && (
          <button
            type="button"
            onClick={onOpenMetasModal}
            className="btn btn-ghost btn-sm text-xs gap-1.5 text-stone-600 hover:text-stone-900"
          >
            <Settings size={13} />
            Configurar Metas de Visitas
          </button>
        )}
      </div>

      {/* Grid com os 5 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Especificadores Ativos */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-2xs font-semibold uppercase tracking-wide">
              Especificadores Ativos
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Compass size={15} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-stone-900">
              {kpis.especificadoresAtivos}
            </span>
            <p className="text-3xs text-stone-400 mt-0.5">Parceiros em carteira ativa</p>
          </div>
        </div>

        {/* KPI 2: % Venda com Especificador (mês) */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-2xs font-semibold uppercase tracking-wide">
              % Venda c/ Arq (Mês)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-emerald-700">
              {kpis.pctVendaMes.toFixed(1)}%
            </span>
            <p className="text-3xs text-stone-400 mt-0.5">Do faturamento do mês</p>
          </div>
        </div>

        {/* KPI 3: % Venda com Especificador (ano) */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-2xs font-semibold uppercase tracking-wide">
              % Venda c/ Arq (Ano)
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Target size={15} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-blue-700">
              {kpis.pctVendaAno.toFixed(1)}%
            </span>
            <p className="text-3xs text-stone-400 mt-0.5">Consolidado no ano vigente</p>
          </div>
        </div>

        {/* KPI 4: Atendimentos no Mês */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-2xs font-semibold uppercase tracking-wide">
              Atendimentos no Mês
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <MessageSquare size={15} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-stone-900">
              {kpis.atendimentosMes}
            </span>
            <p className="text-3xs text-stone-400 mt-0.5">Contatos e alinhamentos</p>
          </div>
        </div>

        {/* KPI 5: Visitas ao Escritório */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-2xs font-semibold uppercase tracking-wide">
              Visitas a Escritórios
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center">
              <Building2 size={15} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-primary-800">
              {kpis.visitasEscritorioMes}
            </span>
            <p className="text-3xs text-stone-400 mt-0.5">Presenciais no mês</p>
          </div>
        </div>
      </div>

      {/* Meta Individual de Visitas do Vendedor */}
      {minhaMeta && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-xl p-4 shadow-sm border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-primary-400" />
              <span className="text-xs font-semibold text-stone-200 uppercase tracking-wide">
                Sua Meta Individual de Visitas no Mês
              </span>
              {minhaMeta.percentualAtingido >= 100 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={11} /> Meta Batida!
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              Progresso atual:{' '}
              <strong className="text-white font-mono">
                {minhaMeta.visitasRealizadasMes}
              </strong>{' '}
              de{' '}
              <strong className="text-white font-mono">
                {minhaMeta.metaVisitasMes}
              </strong>{' '}
              visitas comerciais agendadas/executadas.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:min-w-[240px]">
            <div className="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-700">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  minhaMeta.percentualAtingido >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-primary-500 to-amber-400'
                )}
                style={{ width: `${Math.min(100, minhaMeta.percentualAtingido)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-primary-400 min-w-[3rem] text-right">
              {minhaMeta.percentualAtingido.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EspecificadoresKpiPanel
