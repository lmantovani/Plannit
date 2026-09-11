import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, UserX, AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaboradorId: number
  colaboradorNome: string
}

export default function DesligarModal({ isOpen, onClose, colaboradorId, colaboradorNome }: Props) {
  const [dataDesligamento, setDataDesligamento] = useState(new Date().toISOString().split('T')[0])
  const [tipoDesligamento, setTipoDesligamento] = useState('demissao_sem_justa_causa')
  const [motivoDesligamento, setMotivoDesligamento] = useState('')
  const [entrevistaSaida, setEntrevistaSaida] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    router.post(
      `/colaboradores/${colaboradorId}/desligar`,
      {
        dataDesligamento,
        tipoDesligamento,
        motivoDesligamento,
        entrevistaSaida,
      },
      {
        onSuccess: () => {
          setSubmitting(false)
          onClose()
        },
        onError: () => {
          setSubmitting(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <UserX size={20} className="text-red-600" />
            <h3 className="font-display font-semibold text-base">Formalizar Desligamento (RH-RN009)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              Você está formalizando o desligamento de <strong>{colaboradorNome}</strong>. O colaborador será marcado como inativo e o histórico funcional será preservado de forma inviolável.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Desligamento *</label>
              <input
                type="date"
                required
                className="input input-sm w-full"
                value={dataDesligamento}
                onChange={(e) => setDataDesligamento(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo de Rescisão *</label>
              <select
                required
                className="select select-sm w-full"
                value={tipoDesligamento}
                onChange={(e) => setTipoDesligamento(e.target.value)}
              >
                <option value="demissao_sem_justa_causa">Demissão sem justa causa</option>
                <option value="demissao_com_justa_causa">Demissão com justa causa</option>
                <option value="pedido_demissao">Pedido de demissão</option>
                <option value="acordo_mutuo">Acordo mútuo (Art. 484-A CLT)</option>
                <option value="termino_contrato">Término de contrato de experiência</option>
                <option value="rescisao_pj">Rescisão de contrato PJ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Motivo Detalhado *</label>
            <textarea
              rows={3}
              required
              placeholder="Descreva o contexto, motivos operacionais ou comportamentais do desligamento..."
              className="textarea textarea-sm w-full text-xs"
              value={motivoDesligamento}
              onChange={(e) => setMotivoDesligamento(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Síntese da Entrevista de Saída</label>
            <textarea
              rows={3}
              placeholder="Feedback do colaborador sobre a empresa, clima, liderança, remuneração..."
              className="textarea textarea-sm w-full text-xs"
              value={entrevistaSaida}
              onChange={(e) => setEntrevistaSaida(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-danger btn-sm flex items-center gap-1.5">
              <UserX size={14} />
              <span>{submitting ? 'Processando...' : 'Confirmar Desligamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
