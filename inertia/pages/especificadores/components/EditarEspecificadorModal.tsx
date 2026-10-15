import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, Edit2, Save, Building, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type {
  EspecificadorListItem,
  TipoEspecificador,
  NivelParceria,
  StatusCarteira,
} from '../types'
import {
  TIPO_ESPECIFICADOR_LABELS,
  NIVEL_PARCERIA_LABELS,
  STATUS_CARTEIRA_CONFIG,
  type StatusCarteiraConfig,
} from '../../../lib/constants'

interface EditarEspecificadorModalProps {
  open: boolean
  onClose: () => void
  arquiteto: EspecificadorListItem | null
}

export const EditarEspecificadorModal: React.FC<EditarEspecificadorModalProps> = ({
  open,
  onClose,
  arquiteto,
}) => {
  const [nome, setNome] = useState('')
  const [escritorio, setEscritorio] = useState('')
  const [enderecoEscritorio, setEnderecoEscritorio] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<TipoEspecificador>('arquiteto')
  const [nivelParceria, setNivelParceria] = useState<NivelParceria>('parceiro')
  const [especialidade, setEspecialidade] = useState('')
  const [statusCarteira, setStatusCarteira] = useState<StatusCarteira>('ativo')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (arquiteto && open) {
      setNome(arquiteto.nome || '')
      setEscritorio(arquiteto.escritorio || '')
      setEnderecoEscritorio(arquiteto.enderecoEscritorio || '')
      setTelefone(arquiteto.telefone || '')
      setEmail(arquiteto.email || '')
      setTipo(arquiteto.tipo || 'arquiteto')
      setNivelParceria(arquiteto.nivelParceria || 'parceiro')
      setEspecialidade(arquiteto.especialidade || '')
      setStatusCarteira(arquiteto.statusCarteira || 'ativo')
    }
  }, [arquiteto, open])

  if (!open || !arquiteto) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || nome.trim().length < 2) {
      toast.error('O nome do especificador é obrigatório (mínimo 2 caracteres).')
      return
    }

    setSalvando(true)
    router.patch(
      `/especificadores/${arquiteto.id}`,
      {
        nome: nome.trim(),
        escritorio: escritorio.trim() || null,
        enderecoEscritorio: enderecoEscritorio.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        tipo,
        nivelParceria,
        especialidade: especialidade.trim() || null,
        statusCarteira,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Cadastro atualizado com sucesso!')
          setSalvando(false)
          onClose()
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao atualizar dados cadastrais'
          toast.error(String(first))
          setSalvando(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Edit2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 font-display">
                Editar Especificador
              </h3>
              <p className="text-xs text-stone-500">
                Atualize os dados cadastrais e o status da parceria
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Escritório / Razão Social
              </label>
              <div className="relative">
                <Building
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={escritorio}
                  onChange={(e) => setEscritorio(e.target.value)}
                  className="input pl-9 w-full text-sm"
                  placeholder="Nome do escritório"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Tipo de Profissional
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEspecificador)}
                className="input w-full text-sm"
              >
                {(Object.entries(TIPO_ESPECIFICADOR_LABELS) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="input pl-9 w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9 w-full text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Endereço do Escritório
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={enderecoEscritorio}
                  onChange={(e) => setEnderecoEscritorio(e.target.value)}
                  className="input pl-9 w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Nível de Parceria
              </label>
              <select
                value={nivelParceria}
                onChange={(e) => setNivelParceria(e.target.value as NivelParceria)}
                className="input w-full text-sm"
              >
                {(Object.entries(NIVEL_PARCERIA_LABELS) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Status na Carteira
              </label>
              <select
                value={statusCarteira}
                onChange={(e) => setStatusCarteira(e.target.value as StatusCarteira)}
                className="input w-full text-sm"
              >
                {(Object.entries(STATUS_CARTEIRA_CONFIG) as [string, StatusCarteiraConfig][]).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">
                Especialidade / Foco de Atuação
              </label>
              <input
                type="text"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
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
              disabled={salvando || !nome.trim()}
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Save size={14} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarEspecificadorModal
