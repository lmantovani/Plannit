import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, XCircle, AlertTriangle, FileText } from 'lucide-react'
import type { Compromisso } from '../types'
import { formatarDataHora } from '../utils'

interface ModalCancelarCompromissoProps {
  isOpen: boolean
  onClose: () => void
  compromisso: Compromisso | null
}

export default function ModalCancelarCompromisso({
  isOpen,
  onClose,
  compromisso,
}: ModalCancelarCompromissoProps) {
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMotivo('')
      setErroForm(null)
    }
  }, [isOpen])

  if (!isOpen || !compromisso) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    setIsSubmitting(true)

    router.patch(
      `/agenda/compromissos/${compromisso.id}/cancelar`,
      {
        motivo: motivo.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
        onError: (errors) => {
          const errorMsg = Object.values(errors)[0] as string
          setErroForm(errorMsg || 'Erro ao cancelar compromisso.')
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-up">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 font-serif">
                Cancelar Compromisso
              </h2>
              <p className="text-xs text-stone-500">
                Confirmar cancelamento do agendamento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erroForm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <XCircle size={15} className="text-rose-600 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          <p className="text-xs text-stone-600">
            Tem certeza de que deseja cancelar o compromisso{' '}
            <strong className="text-stone-900 font-semibold">"{compromisso.titulo}"</strong> agendado para{' '}
            {formatarDataHora(compromisso.dataHoraInicio)}?
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-stone-400" />
              Motivo do Cancelamento (Opcional)
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Imprevisto informado pelo cliente, reagendado verbalmente ou cancelado sem previsão..."
              className="input w-full text-xs resize-none"
            />
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary text-xs"
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-danger text-xs flex items-center gap-1.5 shadow-sm"
            >
              <XCircle size={14} />
              <span>{isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
