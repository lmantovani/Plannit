import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, CalendarClock, AlertCircle, FileText } from 'lucide-react'
import { DateTime } from 'luxon'
import SeletorDataHoraDuracao from './SeletorDataHoraDuracao'
import type { Compromisso } from '../types'
import { formatarDataHora } from '../utils'

interface ModalReagendarCompromissoProps {
  isOpen: boolean
  onClose: () => void
  compromisso: Compromisso | null
  compromissosExistentes?: Compromisso[]
}

export default function ModalReagendarCompromisso({
  isOpen,
  onClose,
  compromisso,
  compromissosExistentes = [],
}: ModalReagendarCompromissoProps) {
  const [dataHoraInicio, setDataHoraInicio] = useState('')
  const [dataHoraFim, setDataHoraFim] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && compromisso) {
      const dtInicio = DateTime.fromISO(compromisso.dataHoraInicio)
      const dtFim = DateTime.fromISO(compromisso.dataHoraFim)

      setDataHoraInicio(dtInicio.isValid ? dtInicio.toFormat("yyyy-MM-dd'T'HH:mm") : '')
      setDataHoraFim(dtFim.isValid ? dtFim.toFormat("yyyy-MM-dd'T'HH:mm") : '')
      setObservacoes('')
      setErroForm(null)
    }
  }, [isOpen, compromisso])

  if (!isOpen || !compromisso) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!dataHoraInicio || !dataHoraFim) {
      setErroForm('Informe a nova data, horário de início e duração.')
      return
    }

    const dtInicio = DateTime.fromISO(dataHoraInicio)
    const dtFim = DateTime.fromISO(dataHoraFim)

    if (dtFim <= dtInicio) {
      setErroForm('A data e horário de término devem ser posteriores ao início.')
      return
    }

    setIsSubmitting(true)

    router.patch(
      `/agenda/compromissos/${compromisso.id}/reagendar`,
      {
        dataHoraInicio: dtInicio.toUTC().toISO(),
        dataHoraFim: dtFim.toUTC().toISO(),
        observacoes: observacoes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
        onError: (errors) => {
          const errorMsg = Object.values(errors)[0] as string
          setErroForm(errorMsg || 'Erro ao reagendar compromisso.')
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-xl w-full overflow-hidden animate-scale-up">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <CalendarClock size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 font-serif">
                Reagendar Compromisso
              </h2>
              <p className="text-xs text-stone-500">
                Defina uma nova data, horário e duração para este encontro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erroForm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          {/* Resumo do Compromisso */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {compromisso.tipo?.cor && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: compromisso.tipo.cor }}
                />
              )}
              <span className="font-semibold text-stone-900">{compromisso.titulo}</span>
            </div>
            <div className="text-stone-500 text-[11px]">
              Horário anterior: {formatarDataHora(compromisso.dataHoraInicio)}
            </div>
          </div>

          {/* Seletor de Data, Horário e Duração Estilo Google Agenda */}
          <SeletorDataHoraDuracao
            dataHoraInicio={dataHoraInicio}
            dataHoraFim={dataHoraFim}
            onChange={(novoInicio, novoFim) => {
              setDataHoraInicio(novoInicio)
              setDataHoraFim(novoFim)
            }}
            compromissosExistentes={compromissosExistentes}
            responsavelId={compromisso.responsavelId}
            responsavelNome={compromisso.responsavel?.nome}
            ignorarCompromissoId={compromisso.id}
          />

          {/* Motivo do Reagendamento */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-stone-400" />
              Motivo do Reagendamento (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: Cliente solicitou adiar para a próxima semana devido a compromisso profissional..."
              className="input w-full text-xs resize-none"
            />
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary text-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm bg-amber-600 hover:bg-amber-700 border-amber-700 text-white cursor-pointer"
            >
              <CalendarClock size={14} />
              <span>{isSubmitting ? 'Reagendando...' : 'Confirmar Reagendamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
