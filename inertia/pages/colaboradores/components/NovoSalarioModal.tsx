import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, DollarSign, ShieldAlert } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaboradorId: number
  salarioAtual?: number | null
}

export default function NovoSalarioModal({ isOpen, onClose, colaboradorId, salarioAtual }: Props) {
  const [salarioClt, setSalarioClt] = useState('')
  const [remuneracaoComplementar, setRemuneracaoComplementar] = useState('')
  const [dataVigencia, setDataVigencia] = useState(new Date().toISOString().split('T')[0])
  const [motivo, setMotivo] = useState('Mérito / Promoção')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    router.post(
      `/colaboradores/${colaboradorId}/historico-salarial`,
      {
        salarioClt: Number(salarioClt),
        remuneracaoComplementar: remuneracaoComplementar ? Number(remuneracaoComplementar) : null,
        dataVigencia,
        motivo,
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
            <DollarSign size={20} className="text-emerald-600" />
            <h3 className="font-display font-semibold text-base">Novo Reajuste Salarial (RH-RN009)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Regra RH-RN009:</strong> Este lançamento é estritamente imutável e fará parte da trilha de auditoria oficial do colaborador.
            </div>
          </div>

          {salarioAtual !== undefined && salarioAtual !== null && (
            <div className="text-xs text-stone-500">
              Salário CLT atual: <strong className="text-stone-800">R$ {Number(salarioAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Novo Salário CLT (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 6200.00"
              className="input input-sm w-full"
              value={salarioClt}
              onChange={(e) => setSalarioClt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Remuneração Complementar (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 1200.00"
              className="input input-sm w-full"
              value={remuneracaoComplementar}
              onChange={(e) => setRemuneracaoComplementar(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Vigência *</label>
            <input
              type="date"
              required
              className="input input-sm w-full"
              value={dataVigencia}
              onChange={(e) => setDataVigencia(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Motivo do Reajuste *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dissídio Coletivo, Mérito, Promoção de Nível"
              className="input input-sm w-full"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Gravando...' : 'Gravar Histórico Salarial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
