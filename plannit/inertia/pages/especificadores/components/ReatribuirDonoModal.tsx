import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, UserCheck, ShieldAlert, ArrowRight, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { EspecificadorListItem, ConsultorOption } from '../types'

interface ReatribuirDonoModalProps {
  open: boolean
  onClose: () => void
  arquiteto: EspecificadorListItem | null
  consultores: ConsultorOption[]
}

export const ReatribuirDonoModal: React.FC<ReatribuirDonoModalProps> = ({
  open,
  onClose,
  arquiteto,
  consultores,
}) => {
  const [novoConsultorId, setNovoConsultorId] = useState<number | ''>('')
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  if (!open || !arquiteto) return null

  const consultorAtual = arquiteto.consultor

  const handleTransferir = (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoConsultorId) {
      toast.error('Selecione o novo consultor responsável.')
      return
    }

    if (Number(novoConsultorId) === arquiteto.consultorId) {
      toast.error('O consultor selecionado já é o responsável atual pela carteira.')
      return
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      toast.error('A justificativa da transferência é obrigatória (mínimo 3 caracteres).')
      return
    }

    setSalvando(true)
    router.patch(
      `/especificadores/${arquiteto.id}/dono`,
      {
        consultorNovoId: Number(novoConsultorId),
        motivo: motivo.trim(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Carteira reatribuída com sucesso! Auditoria imutável registrada.')
          setSalvando(false)
          setMotivo('')
          setNovoConsultorId('')
          onClose()
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao reatribuir dono da carteira'
          toast.error(String(first))
          setSalvando(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 font-display">
                Reatribuir Dono de Carteira
              </h3>
              <p className="text-xs text-stone-500">
                Transferência comercial de {arquiteto.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTransferir} className="p-6 space-y-4 overflow-y-auto">
          {/* Card RN017 Aviso */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Guardrail RN017 — Auditoria Imutável</p>
              <p className="text-amber-800 text-2xs mt-0.5 leading-relaxed">
                Toda alteração de titularidade grava um registro perpétuo contendo o consultor
                anterior, novo consultor, usuário autor, carimbo de data/hora UTC e a justificativa fornecida.
              </p>
            </div>
          </div>

          {/* Comparativo de Titularidade */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 border border-stone-200/70 rounded-lg text-xs">
            <div>
              <span className="text-2xs text-stone-400 uppercase font-semibold">Consultor Atual</span>
              <p className="font-medium text-stone-800 mt-0.5">
                {consultorAtual ? consultorAtual.nome : 'Sem consultor (Não atribuído)'}
              </p>
            </div>
            <div>
              <span className="text-2xs text-stone-400 uppercase font-semibold">Novo Responsável</span>
              <p className="font-medium text-primary-700 mt-0.5 flex items-center gap-1">
                <ArrowRight size={13} />
                {consultores.find((c) => c.id === Number(novoConsultorId))?.nome || 'A definir...'}
              </p>
            </div>
          </div>

          {/* Seleção do Novo Consultor */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
              Novo Consultor Comercial <span className="text-rose-500">*</span>
            </label>
            <select
              value={novoConsultorId}
              onChange={(e) => setNovoConsultorId(Number(e.target.value) || '')}
              className="input w-full text-sm"
              required
            >
              <option value="">Selecione um vendedor / consultor...</option>
              {consultores.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === arquiteto.consultorId}>
                  {c.nome} {c.id === arquiteto.consultorId ? '(Atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Justificativa Obrigatória */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
              Motivo da Transferência <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="input w-full text-sm resize-none"
              placeholder="Ex: Redistribuição de carteira regional após término de licença do consultor anterior..."
            />
            <p className="text-2xs text-stone-400 mt-1">
              Forneça uma justificativa clara para o histórico de auditoria e compliance da loja.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="btn btn-secondary btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !novoConsultorId || !motivo.trim()}
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Save size={14} />
              {salvando ? 'Transferindo...' : 'Confirmar Reatribuição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReatribuirDonoModal
