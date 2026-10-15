import React, { useEffect, useState, useMemo } from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Plus,
  CalendarDays,
} from 'lucide-react'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import type { LeadItem } from '../index'

interface ModalCompromissosLeadProps {
  isOpen: boolean
  onClose: () => void
  lead: LeadItem
  onAgendarCompromisso: (lead: LeadItem) => void
  onConcluirCompromisso: (compromisso: any) => void
}

export const ModalCompromissosLead: React.FC<ModalCompromissosLeadProps> = ({
  isOpen,
  onClose,
  lead,
  onAgendarCompromisso,
  onConcluirCompromisso,
}) => {
  const [filtroAba, setFiltroAba] = useState<'todos' | 'pendentes' | 'concluidos'>('todos')

  // Fechar com a tecla ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const compromissos = lead.compromissos || []

  const { pendentes, concluidos } = useMemo(() => {
    const p = compromissos.filter(
      (c) => c.status === 'agendado' || c.status === 'reagendado'
    )
    const c = compromissos.filter((c) => c.status === 'concluido')
    return { pendentes: p, concluidos: c }
  }, [compromissos])

  const compromissosFiltrados = useMemo(() => {
    if (filtroAba === 'pendentes') return pendentes
    if (filtroAba === 'concluidos') return concluidos
    return compromissos
  }, [filtroAba, pendentes, concluidos, compromissos])

  if (!isOpen) return null

  const formatarHorario = (iso: string) => {
    try {
      const dt = DateTime.fromISO(iso)
      if (dt.isValid) return dt.toFormat('dd/MM/yyyy HH:mm')
    } catch {
      // fallback
    }
    return iso
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/80 w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shadow-xs">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base leading-snug">
                Compromissos Agendados
              </h3>
              <p className="text-xs text-stone-500">
                Lead: <strong className="text-stone-700">{lead.nome}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onAgendarCompromisso(lead)
              }}
              className="btn btn-primary btn-sm gap-1.5 text-xs py-1.5 px-3 font-semibold shadow-xs"
            >
              <Plus size={13} />
              <span>Novo Compromisso</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo com Rolagem */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Métricas Resumidas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
              <span className="text-[11px] font-medium text-stone-500">Em Aberto</span>
              <p className="text-base font-semibold text-stone-900 mt-0.5 tabular-nums">
                {pendentes.length}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
              <span className="text-[11px] font-medium text-stone-500">Concluídos</span>
              <p className="text-base font-semibold text-stone-900 mt-0.5 tabular-nums">
                {concluidos.length}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
              <span className="text-[11px] font-medium text-stone-500">Total Histórico</span>
              <p className="text-base font-semibold text-stone-900 mt-0.5 tabular-nums">
                {compromissos.length}
              </p>
            </div>
          </div>

          {/* Abas de Filtro */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroAba('todos')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  filtroAba === 'todos'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Todos ({compromissos.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAba('pendentes')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  filtroAba === 'pendentes'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Em Aberto ({pendentes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAba('concluidos')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  filtroAba === 'concluidos'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Concluídos ({concluidos.length})
              </button>
            </div>

            <a
              href={`/agenda?leadId=${lead.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 hover:underline"
              title="Abrir a Agenda completa com este lead filtrado"
            >
              <span>Ver na Agenda</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Lista de Cards de Compromisso */}
          {compromissosFiltrados.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
              <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-500 mx-auto flex items-center justify-center">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-700">
                  {filtroAba === 'pendentes'
                    ? 'Nenhum compromisso pendente no momento'
                    : filtroAba === 'concluidos'
                    ? 'Nenhum compromisso concluído ainda'
                    : 'Nenhum compromisso cadastrado para este lead'}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Agende visitas técnicas, reuniões ou apresentações para manter o lead engajado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onAgendarCompromisso(lead)
                }}
                className="btn btn-primary btn-xs gap-1.5 mx-auto font-semibold"
              >
                <Plus size={12} />
                <span>Agendar Encontro Agora</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {compromissosFiltrados.map((comp) => {
                const isPendente = comp.status === 'agendado' || comp.status === 'reagendado'
                const isConcluido = comp.status === 'concluido'
                const isCancelado = comp.status === 'cancelado'

                return (
                  <div
                    key={comp.id}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-stone-300 transition-all"
                  >
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: comp.tipoCor || '#3B82F6' }}
                          />
                          <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                            {comp.tipoNome || comp.titulo}
                          </h4>
                          <span
                            className={clsx(
                              'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                              isConcluido && 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                              isCancelado && 'bg-rose-50 text-rose-800 border border-rose-200 line-through',
                              isPendente && 'bg-blue-50 text-blue-800 border border-blue-200'
                            )}
                          >
                            {comp.status === 'agendado'
                              ? 'Agendado'
                              : comp.status === 'reagendado'
                              ? 'Reagendado'
                              : comp.status === 'concluido'
                              ? 'Concluído'
                              : 'Cancelado'}
                          </span>
                        </div>

                      {/* Botão de Ação Imediata se Pendente */}
                      {isPendente && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onConcluirCompromisso({
                              ...comp,
                              lead: {
                                id: lead.id,
                                nome: lead.nome,
                                telefone: lead.telefone,
                                cidade: lead.cidade,
                              },
                            })
                          }}
                          className="btn btn-primary btn-xs gap-1 py-1 px-3 text-[11px] font-semibold shrink-0 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>Concluir</span>
                        </button>
                      )}
                    </div>

                    {/* Dados de Horário, Responsável e Local */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-stone-400 shrink-0" />
                        <span className="tabular-nums font-medium">
                          {formatarHorario(comp.dataHoraInicio)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User size={13} className="text-stone-400 shrink-0" />
                        <span className="truncate font-medium">{comp.responsavelNome}</span>
                      </div>

                      {comp.local && (
                        <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-stone-500">
                          <MapPin size={13} className="text-stone-400 shrink-0" />
                          <span className="truncate">{comp.local}</span>
                        </div>
                      )}
                    </div>

                    {/* Desfecho Registrado (Destaque) */}
                    {isConcluido && comp.desfecho && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-lg text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Desfecho Registrado:</span>
                        </div>
                        <p className="text-emerald-950 leading-relaxed pl-5 text-[11px]">
                          {comp.desfecho}
                        </p>
                      </div>
                    )}

                    {/* Observações Opcionais */}
                    {comp.observacoes && (
                      <div className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-lg text-xs text-stone-600 space-y-0.5">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                          Observações:
                        </span>
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {comp.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {pendentes.length > 0
              ? `${pendentes.length} compromisso(s) pendente(s)`
              : 'Nenhum compromisso pendente'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs py-1.5 px-4 font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
export default ModalCompromissosLead
