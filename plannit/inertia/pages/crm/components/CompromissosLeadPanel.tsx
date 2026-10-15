import React, { useState } from 'react'
import { Calendar, ExternalLink, Clock } from 'lucide-react'
import { DateTime } from 'luxon'
import type { LeadItem } from '../index'
import { ModalCompromissosLead } from './ModalCompromissosLead'

interface CompromissosLeadPanelProps {
  lead: LeadItem
  onAgendarCompromisso: (lead: LeadItem) => void
  onConcluirCompromisso: (compromisso: any) => void
}

export const CompromissosLeadPanel: React.FC<CompromissosLeadPanelProps> = ({
  lead,
  onAgendarCompromisso,
  onConcluirCompromisso,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const compromissos = lead.compromissos || []
  const pendentes = compromissos.filter(
    (c) => c.status === 'agendado' || c.status === 'reagendado'
  )

  // Próximo compromisso pendente
  const proximo = lead.proximoCompromisso || pendentes[0] || null

  const formatarHorario = (iso: string) => {
    try {
      const dt = DateTime.fromISO(iso)
      if (dt.isValid) return dt.toFormat('dd/MM HH:mm')
    } catch {
      // fallback
    }
    return iso
  }

  return (
    <>
      <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3 mb-4 shadow-xs transition-all">
        {/* Cabeçalho do Card Compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-200/70 text-stone-700 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-stone-800">
                  Compromissos Agendados ({pendentes.length})
                </span>
                {pendentes.length > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-0.5"
                    title="Existem compromissos não finalizados para este lead"
                  >
                    Em aberto
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                {proximo ? (
                  <span className="flex items-center gap-1">
                    <Clock size={10} className="text-stone-400" />
                    <span>Próximo:</span>
                    <strong className="text-stone-700 tabular-nums">
                      {formatarHorario(proximo.dataHoraInicio)}
                    </strong>
                    <span className="truncate max-w-[150px]">— {proximo.tipoNome || proximo.titulo}</span>
                  </span>
                ) : (
                  'Nenhum compromisso pendente'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-200/60 transition-colors flex items-center gap-1.5 text-[11px] font-semibold border border-stone-200/80 bg-white shadow-2xs shrink-0 cursor-pointer"
            title="Abrir detalhes dos compromissos e agendar novos encontros"
          >
            <ExternalLink size={12} className="text-stone-500" />
            <span>Detalhes</span>
          </button>
        </div>
      </div>

      {/* Modal Centralizado de Compromissos do Lead */}
      <ModalCompromissosLead
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={lead}
        onAgendarCompromisso={onAgendarCompromisso}
        onConcluirCompromisso={onConcluirCompromisso}
      />
    </>
  )
}
export default CompromissosLeadPanel

