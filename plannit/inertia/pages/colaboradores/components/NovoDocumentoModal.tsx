import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, FileUp } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaboradorId: number
}

export default function NovoDocumentoModal({ isOpen, onClose, colaboradorId }: Props) {
  const [tipo, setTipo] = useState('contrato_assinado')
  const [url, setUrl] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    router.post(
      `/colaboradores/${colaboradorId}/documentos`,
      {
        tipo,
        url,
        dataVencimento: dataVencimento || null,
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
            <FileUp size={20} className="text-primary-600" />
            <h3 className="font-display font-semibold text-base">Anexar Documento Funcional</h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo de Documento *</label>
            <select
              required
              className="select select-sm w-full"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="contrato_assinado">Contrato de Trabalho Assinado</option>
              <option value="aso_admissional">ASO Admissional / Periódico</option>
              <option value="ctps">Carteira de Trabalho (CTPS)</option>
              <option value="exame_periodico">Exame Periódico / Toxicológico</option>
              <option value="certidao">Certidão / Comprovante</option>
              <option value="pis_pasep">Comprovante PIS / PASEP</option>
              <option value="outro">Outro Documento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">URL / Link do Arquivo *</label>
            <input
              type="url"
              required
              placeholder="https://storage.lidermoveis.com.br/docs/..."
              className="input input-sm w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Vencimento (se aplicável)</label>
            <input
              type="date"
              className="input input-sm w-full"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Anexando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
