import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, CheckCircle2, FileText, AlertCircle, Sparkles } from 'lucide-react'
import type { Compromisso } from '../types'
import { formatarDataHora } from '../utils'

interface ModalConcluirCompromissoProps {
  isOpen: boolean
  onClose: () => void
  compromisso: Compromisso | null
}

export default function ModalConcluirCompromisso({
  isOpen,
  onClose,
  compromisso,
}: ModalConcluirCompromissoProps) {
  const [desfecho, setDesfecho] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDesfecho(compromisso?.desfecho || '')
      setErroForm(null)
    }
  }, [isOpen, compromisso])

  if (!isOpen || !compromisso) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!desfecho.trim() || desfecho.trim().length < 3) {
      setErroForm('Informe o desfecho com pelo menos 3 caracteres.')
      return
    }

    setIsSubmitting(true)

    router.patch(
      `/agenda/compromissos/${compromisso.id}/concluir`,
      { desfecho: desfecho.trim() },
      {
        onSuccess: () => {
          onClose()
        },
        onError: (errors) => {
          const errorMsg = Object.values(errors)[0] as string
          setErroForm(errorMsg || 'Erro ao registrar desfecho do compromisso.')
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden animate-scale-up">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 font-serif">
                Concluir Compromisso
              </h2>
              <p className="text-xs text-stone-500">
                Registre os resultados e encaminhamentos desta reunião
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
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          {/* Resumo do Compromisso */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">{compromisso.titulo}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  backgroundColor: `${compromisso.tipo?.cor || '#D97706'}15`,
                  color: compromisso.tipo?.cor || '#D97706',
                }}
              >
                {compromisso.tipo?.nome || 'Geral'}
              </span>
            </div>
            <div className="text-stone-600 text-[11px]">
              Horário: {formatarDataHora(compromisso.dataHoraInicio)}
              {compromisso.local && ` • Local: ${compromisso.local}`}
            </div>
            {compromisso.lead && (
              <div className="text-stone-600 text-[11px] font-medium">
                Lead Vinculado: <span className="text-primary-800 font-semibold">{compromisso.lead.nome}</span>
              </div>
            )}
          </div>

          {/* Dica de integração com o CRM */}
          {compromisso.lead && (
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-blue-800 text-[11px] flex items-start gap-2">
              <Sparkles size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Este compromisso está vinculado a um lead. Ao salvar, uma interação com o desfecho será registrada automaticamente na linha do tempo do CRM.
              </span>
            </div>
          )}

          {/* Campo Desfecho Obrigatório */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-stone-400" />
              Desfecho da Reunião / Encontro <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={desfecho}
              onChange={(e) => setDesfecho(e.target.value)}
              placeholder="Descreva o que foi conversado, alinhamentos, pendências ou próximos passos acertados..."
              className="input w-full text-xs resize-none"
              required
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Mínimo de 3 caracteres. Seja claro quanto às decisões tomadas.
            </p>
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary text-xs"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? 'Salvando...' : 'Concluir Compromisso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
