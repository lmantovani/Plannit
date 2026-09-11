import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, Trash2, ShieldAlert } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaboradorId: number
  colaboradorNome: string
  isActive: boolean
}

export default function PurgaModal({ isOpen, onClose, colaboradorId, colaboradorNome, isActive }: Props) {
  const [confirmacaoTexto, setConfirmacaoTexto] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const podePurgar = !isActive && confirmacaoTexto === colaboradorNome

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault()
    if (!podePurgar) return

    setSubmitting(true)
    router.delete(`/colaboradores/${colaboradorId}`, {
      onSuccess: () => {
        setSubmitting(false)
        onClose()
      },
      onError: () => {
        setSubmitting(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <ShieldAlert size={20} className="text-red-600" />
            <h3 className="font-display font-semibold text-base">Purga Administrativa (RH-RN011)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-2">
            <p>
              <strong>ATENÇÃO — EXCLUSÃO DEFINITIVA:</strong> Esta ação é irreversível e removerá permanentemente o colaborador <strong>{colaboradorNome}</strong>, todo o histórico salarial, histórico de cargos e documentos associados do banco de dados.
            </p>
            <p className="text-red-700">
              Esta função é uma <strong>exceção restrita à Diretoria</strong>, permitida exclusivamente para cadastros inseridos com erro.
            </p>
          </div>

          {isActive ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-semibold">
              ⚠️ Operação bloqueada pela regra RH-RN011: O colaborador ainda está ATIVO. Você deve formalizar o desligamento antes de purgar o cadastro.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Digite exatamente o nome do colaborador para confirmar:
              </label>
              <input
                type="text"
                placeholder={colaboradorNome}
                className="input input-sm w-full font-mono text-xs border-red-300 focus:border-red-500"
                value={confirmacaoTexto}
                onChange={(e) => setConfirmacaoTexto(e.target.value)}
              />
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podePurgar || submitting}
              className="btn btn-danger btn-sm flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>{submitting ? 'Expurgando...' : 'Excluir Definitivamente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
