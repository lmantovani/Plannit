import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, Edit3, Clock, MapPin, User, FileText, AlertCircle } from 'lucide-react'
import { DateTime } from 'luxon'
import type { Compromisso, TipoCompromisso, Colaborador } from '../types'

interface ModalEditarCompromissoProps {
  isOpen: boolean
  onClose: () => void
  compromisso: Compromisso | null
  tipos: TipoCompromisso[]
  colaboradores: Colaborador[]
  podeVerEquipe: boolean
}

export default function ModalEditarCompromisso({
  isOpen,
  onClose,
  compromisso,
  tipos = [],
  colaboradores = [],
  podeVerEquipe = false,
}: ModalEditarCompromissoProps) {
  const [tipoId, setTipoId] = useState<number>(0)
  const [dataHoraInicio, setDataHoraInicio] = useState('')
  const [dataHoraFim, setDataHoraFim] = useState('')
  const [local, setLocal] = useState('')
  const [responsavelId, setResponsavelId] = useState<number>(0)
  const [observacoes, setObservacoes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && compromisso) {
      setTipoId(compromisso.tipoId || tipos[0]?.id || 0)
      const dtInicio = DateTime.fromISO(compromisso.dataHoraInicio)
      const dtFim = DateTime.fromISO(compromisso.dataHoraFim)
      setDataHoraInicio(dtInicio.isValid ? dtInicio.toFormat("yyyy-MM-dd'T'HH:mm") : '')
      setDataHoraFim(dtFim.isValid ? dtFim.toFormat("yyyy-MM-dd'T'HH:mm") : '')
      setLocal(compromisso.local || '')
      setResponsavelId(compromisso.responsavelId)
      setObservacoes(compromisso.observacoes || '')
      setErroForm(null)
    }
  }, [isOpen, compromisso, tipos])

  if (!isOpen || !compromisso) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!dataHoraInicio || !dataHoraFim) {
      setErroForm('Informe a data e horário de início e término.')
      return
    }

    const dtInicio = DateTime.fromISO(dataHoraInicio)
    const dtFim = DateTime.fromISO(dataHoraFim)

    if (dtFim <= dtInicio) {
      setErroForm('A data e horário de término devem ser posteriores ao início.')
      return
    }

    setIsSubmitting(true)

    const tipoObj = tipos.find((t) => t.id === Number(tipoId))
    const tituloFinal = tipoObj ? tipoObj.nome : compromisso.titulo || 'Compromisso'

    const payload: any = {
      titulo: tituloFinal,
      tipoId: Number(tipoId),
      dataHoraInicio: dtInicio.toUTC().toISO(),
      dataHoraFim: dtFim.toUTC().toISO(),
      local: local.trim() || null,
      observacoes: observacoes.trim() || null,
    }

    if (podeVerEquipe && responsavelId) {
      payload.responsavelId = Number(responsavelId)
    }

    router.patch(`/agenda/compromissos/${compromisso.id}`, payload, {
      onSuccess: () => {
        onClose()
      },
      onError: (errors) => {
        const errorMsg = Object.values(errors)[0] as string
        setErroForm(errorMsg || 'Erro ao atualizar compromisso.')
      },
      onFinish: () => {
        setIsSubmitting(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-xl w-full overflow-hidden animate-scale-up">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 font-serif">
                Editar Compromisso
              </h2>
              <p className="text-xs text-stone-500">
                Altere informações, horários ou local
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


          {/* Tipo de Compromisso */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tipo de Compromisso
            </label>
            <select
              value={tipoId}
              onChange={(e) => setTipoId(Number(e.target.value))}
              className="input w-full text-xs"
            >
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-stone-400" />
                Data & Início <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dataHoraInicio}
                onChange={(e) => setDataHoraInicio(e.target.value)}
                className="input w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-stone-400" />
                Data & Término <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dataHoraFim}
                onChange={(e) => setDataHoraFim(e.target.value)}
                className="input w-full text-xs"
                required
              />
            </div>
          </div>

          {/* Local e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-stone-400" />
                Local
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <User size={13} className="text-stone-400" />
                Responsável
              </label>
              {podeVerEquipe ? (
                <select
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(Number(e.target.value))}
                  className="input w-full text-xs"
                >
                  {colaboradores.map((colab) => (
                    <option key={colab.id} value={colab.id}>
                      {colab.nome} ({colab.perfil})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={compromisso.responsavel?.nome || 'Você'}
                  disabled
                  className="input w-full text-xs bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-stone-400" />
              Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Edit3 size={14} />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
