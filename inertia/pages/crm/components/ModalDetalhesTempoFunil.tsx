import React, { useEffect } from 'react'
import { X, Clock, History, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import {
  formatarDuracaoDetalhada,
  type DetalhesTempoLead,
  type HistoricoTransicaoStatus,
} from '../../../lib/tempo_colunas'
import { formatDateTime } from '../../../lib/constants'

interface ModalDetalhesTempoFunilProps {
  isOpen: boolean
  onClose: () => void
  leadNome: string
  detalhes: DetalhesTempoLead
  historicoStatus?: HistoricoTransicaoStatus[]
}

export const ModalDetalhesTempoFunil: React.FC<ModalDetalhesTempoFunilProps> = ({
  isOpen,
  onClose,
  leadNome,
  detalhes,
  historicoStatus,
}) => {
  // Fechar com a tecla ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Agrupar as passagens individuais por status de origem para detalhamento minucioso
  const passagensPorStatus: Record<string, HistoricoTransicaoStatus[]> = {}
  if (historicoStatus) {
    historicoStatus.forEach((h) => {
      if (h.statusDe) {
        if (!passagensPorStatus[h.statusDe]) {
          passagensPorStatus[h.statusDe] = []
        }
        passagensPorStatus[h.statusDe].push(h)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/80 w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shadow-xs">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base leading-snug">
                Histórico de Permanência por Etapa
              </h3>
              <p className="text-xs text-stone-500">
                Lead: <strong className="text-stone-700">{leadNome}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal (com rolagem) */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Métricas Resumidas em Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
              <span className="text-[11px] font-medium text-stone-500">Tempo Total no Funil</span>
              <p className="text-base font-semibold text-stone-900 mt-0.5 tabular-nums">
                {formatarDuracaoDetalhada(detalhes.tempoTotalLeadSegundos)}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
              <span className="text-[11px] font-medium text-stone-500">Etapas Percorridas</span>
              <p className="text-base font-bold text-stone-900 mt-0.5">
                {detalhes.colunas.length} etapa{detalhes.colunas.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-stone-500">Retornos a Etapas</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {detalhes.temRetornos ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <History size={11} />
                    Sim (Soma Ativa)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} />
                    Avanço Linear
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de Distribuição Visual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Distribuição do Tempo na Jornada</span>
              <span className="text-stone-400 text-[11px]">Proporção em cada etapa</span>
            </div>
            <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex border border-stone-200/60 shadow-xs">
              {detalhes.colunas.map((col) => {
                if (col.tempoTotalSegundos <= 0) return null
                return (
                  <div
                    key={col.status}
                    style={{
                      width: `${Math.max(col.percentual, 4)}%`,
                      backgroundColor: col.cor,
                    }}
                    className="h-full transition-all relative group"
                    title={`${col.label}: ${formatarDuracaoDetalhada(col.tempoTotalSegundos)} (${col.percentualFormatado})`}
                  />
                )
              })}
            </div>
          </div>

          {/* Tabela Detalhada por Coluna */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Detalhamento Consolidado por Coluna
            </h4>

            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
              {detalhes.colunas.map((col) => {
                const passagensIndividuais = passagensPorStatus[col.status] || []

                return (
                  <div
                    key={col.status}
                    className={`p-3.5 transition-colors ${
                      col.isAtual ? 'bg-primary-50/30' : 'bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    {/* Linha Principal da Coluna */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 mt-0.5 ring-2 ring-white shadow-xs"
                          style={{ backgroundColor: col.cor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm">
                              {col.label}
                            </span>
                            {col.isAtual && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                                Etapa Atual
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                            <span>
                              Passagens:{' '}
                              <strong className={col.passagens > 1 ? 'text-amber-800 font-bold' : 'text-stone-700'}>
                                {col.passagens} {col.passagens > 1 ? '(Retornou)' : 'vez'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="tabular-nums">{col.percentualFormatado} do funil</span>
                          </div>
                        </div>
                      </div>

                      {/* Tempo Total Acumulado */}
                      <div className="text-right shrink-0">
                        <div className="font-sans font-semibold text-stone-900 text-sm tracking-tight tabular-nums">
                          {formatarDuracaoDetalhada(col.tempoTotalSegundos)}
                        </div>
                        {col.isAtual && col.tempoPassagemAtualSegundos > 0 && (
                          <span className="text-[11px] font-medium text-emerald-700 block mt-0.5 tabular-nums">
                            +{formatarDuracaoDetalhada(col.tempoPassagemAtualSegundos)} correndo agora
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detalhamento das Passagens Individuais quando houve mais de 1 */}
                    {passagensIndividuais.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-stone-100 pl-5 space-y-1">
                        <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">
                          Histórico de saídas desta etapa:
                        </p>
                        {passagensIndividuais.map((p, idx) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-[11px] text-stone-600 bg-stone-50/80 px-2.5 py-1 rounded-md"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-stone-400 font-medium">#{idx + 1}</span>
                              <ArrowRight size={10} className="text-stone-400" />
                              <span>Para: <strong className="text-stone-700">{p.statusParaLabel || p.statusPara}</strong></span>
                              {p.createdAt && (
                                <span className="text-stone-400 text-[10px]">
                                  ({formatDateTime(p.createdAt)})
                                </span>
                              )}
                            </span>
                            <span className="font-semibold text-stone-800 text-[11px] tabular-nums">
                              Ficou {formatarDuracaoDetalhada(p.tempoPermanenciaSegundos)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Destaque da Maior Retenção */}
          {detalhes.colunaMaisDemorada && detalhes.colunaMaisDemorada.tempoTotalSegundos > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ponto de maior retenção da jornada:</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  O cliente passou a maior parte do tempo na etapa{' '}
                  <strong>{detalhes.colunaMaisDemorada.label}</strong> totalizando{' '}
                  <strong>{formatarDuracaoDetalhada(detalhes.colunaMaisDemorada.tempoTotalSegundos)}</strong> (
                  {detalhes.colunaMaisDemorada.percentualFormatado} de todo o ciclo de negociação).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs py-1.5 px-4 font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
export default ModalDetalhesTempoFunil

