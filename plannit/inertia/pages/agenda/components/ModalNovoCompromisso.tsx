import React, { useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import {
  X,
  Calendar,
  ExternalLink,
  RotateCw,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  AlertCircle,
  Lock,
} from 'lucide-react'
import { DateTime } from 'luxon'
import { toast } from 'sonner'
import BuscaAutocomplete from '../../../components/ui/BuscaAutocomplete'
import type { TipoCompromisso, Colaborador, LeadResumo } from '../types'

interface ModalNovoCompromissoProps {
  isOpen: boolean
  onClose: () => void
  tipos: TipoCompromisso[]
  colaboradores: Colaborador[]
  leads?: LeadResumo[]
  podeVerEquipe: boolean
  defaultLeadId?: number | null
  travarLead?: boolean
}

export default function ModalNovoCompromisso({
  isOpen,
  onClose,
  tipos = [],
  colaboradores = [],
  leads = [],
  podeVerEquipe = false,
  defaultLeadId = null,
  travarLead = false,
}: ModalNovoCompromissoProps) {
  const { props } = usePage<any>()
  const currentUser = props.user

  // Form states
  const [tipoId, setTipoId] = useState<number>(tipos[0]?.id || 0)
  const [dataHoraInicio, setDataHoraInicio] = useState('')
  const [dataHoraFim, setDataHoraFim] = useState('')
  const [local, setLocal] = useState('')
  const [responsavelId, setResponsavelId] = useState<number>(currentUser?.id || 0)
  const [leadId, setLeadId] = useState<string>(defaultLeadId ? String(defaultLeadId) : '')
  const [observacoes, setObservacoes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshingTipos, setIsRefreshingTipos] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  // Inicializa horários sugeridos (início na próxima hora cheia, duração de 1 hora)
  useEffect(() => {
    if (isOpen) {
      const agora = DateTime.now().plus({ hours: 1 }).startOf('hour')
      const inicioPadrao = agora.toFormat("yyyy-MM-dd'T'HH:mm")
      const fimPadrao = agora.plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm")

      setDataHoraInicio(inicioPadrao)
      setDataHoraFim(fimPadrao)
      setLocal('')
      setObservacoes('')
      setErroForm(null)
      if (tipos.length > 0 && !tipoId) {
        setTipoId(tipos[0].id)
      }
      if (defaultLeadId) {
        setLeadId(String(defaultLeadId))
      }
      if (!podeVerEquipe && currentUser?.id) {
        setResponsavelId(currentUser.id)
      } else if (colaboradores.length > 0 && !responsavelId) {
        setResponsavelId(currentUser?.id || colaboradores[0].id)
      }
    }
  }, [isOpen, tipos, defaultLeadId, podeVerEquipe, currentUser, colaboradores])

  // Sincronização em tempo real do catálogo de tipos (storage + window.focus)
  useEffect(() => {
    const handleSync = () => {
      setIsRefreshingTipos(true)
      router.reload({
        only: ['tipos'],
        onFinish: () => setIsRefreshingTipos(false),
      })
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'plannit_catalogo_updated') {
        handleSync()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleSync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleSync)
    }
  }, [])

  if (!isOpen) return null

  // Atualizar tipoId caso a lista de tipos mude e o selecionado não exista
  const tipoSelecionado = tipos.find((t) => t.id === tipoId) || tipos[0]
  const leadSelecionado = leads.find((l) => String(l.id) === String(leadId))

  const handleRefreshTipos = () => {
    setIsRefreshingTipos(true)
    router.reload({
      only: ['tipos'],
      onFinish: () => {
        setIsRefreshingTipos(false)
        toast.info('Catálogo de tipos atualizado.')
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!tipoId && !tipoSelecionado?.id) {
      setErroForm('Selecione um tipo de compromisso.')
      return
    }
    if (!dataHoraInicio || !dataHoraFim) {
      setErroForm('Informe a data e horário de início e término.')
      return
    }

    const dtInicio = DateTime.fromISO(dataHoraInicio)
    const dtFim = DateTime.fromISO(dataHoraFim)

    if (dtFim <= dtInicio) {
      setErroForm('O horário de término deve ser posterior ao início.')
      return
    }

    setIsSubmitting(true)

    const tipoNomeFinal = tipoSelecionado?.nome || 'Compromisso'

    const payload = {
      titulo: tipoNomeFinal,
      tipoId: tipoId || tipoSelecionado.id,
      dataHoraInicio: dtInicio.toUTC().toISO(),
      dataHoraFim: dtFim.toUTC().toISO(),
      local: local.trim() || null,
      responsavelId: podeVerEquipe ? Number(responsavelId) : currentUser.id,
      leadId: leadId ? Number(leadId) : null,
      observacoes: observacoes.trim() || null,
    }

    router.post('/agenda/compromissos', payload, {
      onSuccess: () => {
        onClose()
      },
      onError: (errors) => {
        const errorMsg = Object.values(errors)[0] as string
        setErroForm(errorMsg || 'Erro ao agendar compromisso.')
      },
      onFinish: () => {
        setIsSubmitting(false)
      },
    })
  }

  // Prepara opções de Lead para o BuscaAutocomplete
  const opcoesLeads = leads.map((l) => ({
    value: String(l.id),
    label: l.nome,
    descricao: [l.telefone, l.cidade].filter(Boolean).join(' • ') || 'Lead sem contato extra',
  }))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full overflow-hidden animate-scale-up">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 font-serif">
                Novo Compromisso
              </h2>
              <p className="text-xs text-stone-500">
                Agende visitas, medições técnicas, reuniões ou apresentações
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {erroForm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}


          {/* Tipo de Compromisso com Catálogo e Atalho */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Tipo de Compromisso <span className="text-rose-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshTipos}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                  title="Atualizar tipos do catálogo"
                >
                  <RotateCw size={12} className={isRefreshingTipos ? 'animate-spin' : ''} />
                </button>

                {podeVerEquipe && (
                  <a
                    href="/configuracoes?tab=tipos_compromisso"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline bg-primary-50/80 px-2 py-0.5 rounded-md border border-primary-200/60"
                    title="Gerenciar tipos de compromisso em Configurações"
                  >
                    <span>Configurar</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {/* Grid de Seleção Visual dos Tipos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tipos.map((tipo) => {
                const isSelected = (tipoId || tipoSelecionado?.id) === tipo.id
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setTipoId(tipo.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 shadow-2xs font-medium text-stone-900'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: tipo.cor }}
                    />
                    <span className="truncate">{tipo.nome}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horários: Início e Fim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-stone-400" />
                Data & Hora de Início <span className="text-rose-500">*</span>
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
                Data & Hora de Término <span className="text-rose-500">*</span>
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
                Local do Encontro
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex.: Showroom Loja / Obra do Cliente / Online"
                className="input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <User size={13} className="text-stone-400" />
                Colaborador Responsável
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
                  value={currentUser?.nome || 'Você'}
                  disabled
                  className="input w-full text-xs bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Vínculo com Lead via Autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Users size={13} className="text-stone-400" />
              Vincular a um Lead (Opcional)
            </label>
            {travarLead && leadSelecionado ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {leadSelecionado.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">{leadSelecionado.nome}</p>
                    {(leadSelecionado.telefone || leadSelecionado.cidade) && (
                      <p className="text-[11px] text-stone-500">
                        {[leadSelecionado.telefone, leadSelecionado.cidade].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded">
                  <Lock size={10} className="text-stone-500" />
                  <span>Lead Vinculado</span>
                </div>
              </div>
            ) : (
              <BuscaAutocomplete
                opcoes={opcoesLeads}
                value={leadId}
                onChange={(val) => setLeadId(val)}
                placeholder="Digite o nome, telefone ou cidade do lead..."
                tituloLimpar="Remover vínculo com lead"
                textoVazio={(busca) =>
                  busca ? `Nenhum lead encontrado para "${busca}".` : 'Nenhum lead cadastrado.'
                }
              />
            )}
          </div>

          {/* Observações / Pauta */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-stone-400" />
              Observações / Pauta Prévia
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções adicionais, pauta da reunião ou detalhes de acesso ao local..."
              className="input w-full text-xs resize-none"
            />
          </div>

          {/* Rodapé com Ações */}
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
              <Calendar size={14} />
              <span>{isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
