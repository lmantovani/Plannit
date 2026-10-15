import React, { useState } from 'react'
import { Clock, History, ExternalLink } from 'lucide-react'
import {
  calcularTempoPorColuna,
  formatarDuracaoDetalhada,
  type HistoricoTransicaoStatus,
} from '../../../lib/tempo_colunas'
import { ModalDetalhesTempoFunil } from './ModalDetalhesTempoFunil'

interface TempoColunasPanelProps {
  statusAtual: string
  historicoStatus?: HistoricoTransicaoStatus[]
  statusAlteradoEm?: string | null
  leadCreatedAt?: string | null
  leadNome?: string
}

export const TempoColunasPanel: React.FC<TempoColunasPanelProps> = ({
  statusAtual,
  historicoStatus,
  statusAlteradoEm,
  leadCreatedAt,
  leadNome,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const detalhes = calcularTempoPorColuna(
    statusAtual,
    historicoStatus,
    statusAlteradoEm,
    leadCreatedAt
  )

  if (detalhes.colunas.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3 mb-4 shadow-xs transition-all">
        {/* Cabeçalho do Card Compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-200/70 text-stone-700 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-stone-800">
                  Tempo por Etapa do Funil
                </span>
                {detalhes.temRetornos && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5"
                    title="Este lead retornou a etapas anteriores e os tempos foram somados"
                  >
                    <History size={10} />
                    Retornos somados
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Total no funil: <strong className="text-stone-700 font-semibold tabular-nums">{formatarDuracaoDetalhada(detalhes.tempoTotalLeadSegundos)}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-200/60 transition-colors flex items-center gap-1.5 text-[11px] font-semibold border border-stone-200/80 bg-white shadow-2xs shrink-0 cursor-pointer"
            title="Abrir análise detalhada com somas acumuladas por etapa"
          >
            <ExternalLink size={12} className="text-stone-500" />
            <span>Detalhes</span>
          </button>
        </div>

        {/* Barra de Progresso Visual Segmentada */}
        <div className="mt-2.5">
          <div className="h-2 w-full bg-stone-200/60 rounded-full overflow-hidden flex" title="Distribuição do tempo em cada etapa">
            {detalhes.colunas.map((col) => {
              if (col.tempoTotalSegundos <= 0) return null
              return (
                <div
                  key={col.status}
                  style={{
                    width: `${Math.max(col.percentual, 3)}%`,
                    backgroundColor: col.cor,
                  }}
                  className="h-full transition-all relative group"
                  title={`${col.label}: ${formatarDuracaoDetalhada(col.tempoTotalSegundos)} (${col.percentualFormatado})`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Dedicado para Leitura Confortável e Completa */}
      <ModalDetalhesTempoFunil
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadNome={leadNome || 'Lead'}
        detalhes={detalhes}
        historicoStatus={historicoStatus}
      />
    </>
  )
}
export default TempoColunasPanel

