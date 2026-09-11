import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, Award, ShieldAlert } from 'lucide-react'
import type { CargoOption } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaboradorId: number
  cargoAtualId?: number | null
  cargoAtualNome?: string | null
  cargos: CargoOption[]
}

export default function NovoCargoModal({
  isOpen,
  onClose,
  colaboradorId,
  cargoAtualId,
  cargoAtualNome,
  cargos,
}: Props) {
  const [cargoNovoId, setCargoNovoId] = useState<number>(() => {
    const outro = cargos.find((c) => c.id !== cargoAtualId)
    return outro?.id || cargos[0]?.id || 1
  })
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [justificativa, setJustificativa] = useState('Promoção por desempenho')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    router.post(
      `/colaboradores/${colaboradorId}/historico-cargo`,
      {
        cargoNovoId: Number(cargoNovoId),
        data,
        justificativa,
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
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-stone-800">
            <Award size={20} className="text-primary-600" />
            <h3 className="font-display font-semibold text-base">Progressão de Cargo (RH-RN009)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Regra RH-RN009:</strong> A progressão funcional é registrada de forma imutável com histórico de cargo anterior e aprovação do gestor.
            </div>
          </div>

          <div className="text-xs text-stone-500">
            Cargo atual: <strong className="text-stone-800">{cargoAtualNome || 'Não informado'}</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Novo Cargo *</label>
            <select
              required
              className="select select-sm w-full"
              value={cargoNovoId}
              onChange={(e) => setCargoNovoId(Number(e.target.value))}
            >
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Data da Mudança *</label>
            <input
              type="date"
              required
              className="input input-sm w-full"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Justificativa / Motivo</label>
            <textarea
              rows={3}
              placeholder="Ex: Conclusão do período probatório, ascensão para nível Sênior..."
              className="textarea textarea-sm w-full text-xs"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Gravando...' : 'Gravar Progressão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
