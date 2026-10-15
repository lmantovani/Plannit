import { Link } from '@inertiajs/react'
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  CalendarClock,
  Edit3,
  XCircle,
  ExternalLink,
  FolderKanban,
  Plus,
} from 'lucide-react'
import clsx from 'clsx'
import type { Compromisso } from '../types'
import {
  formatarData,
  formatarHora,
  calcularDuracao,
  getUrgenciaCompromisso,
  getStatusBadgeInfo,
} from '../utils'

interface AgendaListViewProps {
  compromissos: Compromisso[]
  onConcluir: (compromisso: Compromisso) => void
  onReagendar: (compromisso: Compromisso) => void
  onEditar: (compromisso: Compromisso) => void
  onCancelar: (compromisso: Compromisso) => void
  onNovoCompromisso: () => void
}

export default function AgendaListView({
  compromissos,
  onConcluir,
  onReagendar,
  onEditar,
  onCancelar,
  onNovoCompromisso,
}: AgendaListViewProps) {
  if (compromissos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400 mb-4">
          <Calendar size={28} />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Nenhum compromisso encontrado
        </h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
          Não há encontros agendados com os filtros atuais selecionados.
        </p>
        <button
          type="button"
          onClick={onNovoCompromisso}
          className="btn btn-primary text-xs inline-flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>Agendar Novo Compromisso</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Data & Horário</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Título / Assunto</th>
              <th className="py-3 px-4">Local</th>
              <th className="py-3 px-4">Responsável</th>
              <th className="py-3 px-4">Status & Urgência</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {compromissos.map((comp) => {
              const urgencia = getUrgenciaCompromisso(comp)
              const statusInfo = getStatusBadgeInfo(comp.status)
              const duracao = calcularDuracao(comp.dataHoraInicio, comp.dataHoraFim)
              const corTipo = comp.tipo?.cor || '#D97706'
              const isFinalizado = comp.status === 'concluido' || comp.status === 'cancelado'

              return (
                <tr
                  key={comp.id}
                  className={clsx(
                    'hover:bg-stone-50/70 transition-colors',
                    isFinalizado && 'opacity-85'
                  )}
                >
                  {/* Data & Horário */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-stone-900">
                      {formatarData(comp.dataHoraInicio)}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-stone-400" />
                      <span>
                        {formatarHora(comp.dataHoraInicio)} - {formatarHora(comp.dataHoraFim)}
                      </span>
                      {duracao && <span className="text-stone-400">({duracao})</span>}
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border"
                      style={{
                        backgroundColor: `${corTipo}15`,
                        borderColor: `${corTipo}40`,
                        color: corTipo,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: corTipo }}
                      />
                      {comp.tipo?.nome || 'Geral'}
                    </span>
                  </td>

                  {/* Título e Vínculos */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div
                      className={clsx(
                        'font-medium text-stone-900 truncate',
                        comp.status === 'cancelado' && 'line-through text-stone-400'
                      )}
                      title={comp.titulo}
                    >
                      {comp.titulo}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                      {comp.lead && (
                        <Link
                          href={`/crm?leadId=${comp.lead.id}`}
                          className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"
                          title={`Lead: ${comp.lead.nome}`}
                        >
                          <UserIcon size={10} className="text-amber-700" />
                          <span className="truncate max-w-[120px]">{comp.lead.nome}</span>
                          <ExternalLink size={9} className="text-amber-600" />
                        </Link>
                      )}

                      {comp.projeto && (
                        <Link
                          href={`/projetos/${comp.projeto.id}`}
                          className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200"
                          title={`Projeto: ${comp.projeto.codigo}`}
                        >
                          <FolderKanban size={10} className="text-stone-500" />
                          <span>{comp.projeto.codigo}</span>
                        </Link>
                      )}
                    </div>
                  </td>

                  {/* Local */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                    {comp.local ? (
                      <div className="flex items-center gap-1 max-w-[150px] truncate" title={comp.local}>
                        <MapPin size={12} className="text-stone-400 shrink-0" />
                        <span className="truncate">{comp.local}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Não informado</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-stone-800 font-medium">
                      {comp.responsavel?.nome || 'Não atribuído'}
                    </span>
                  </td>

                  {/* Status & Urgência */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          statusInfo.badgeClass
                        )}
                      >
                        {statusInfo.label}
                      </span>

                      {urgencia && (
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[10px] border',
                            urgencia.badgeClass
                          )}
                        >
                          {urgencia.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      {!isFinalizado && (
                        <>
                          <button
                            type="button"
                            onClick={() => onConcluir(comp)}
                            className="p-1.5 rounded text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Concluir e registrar desfecho"
                          >
                            <CheckCircle2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onReagendar(comp)}
                            className="p-1.5 rounded text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Reagendar"
                          >
                            <CalendarClock size={15} />
                          </button>
                        </>
                      )}

                      {comp.status !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={() => onEditar(comp)}
                          className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}

                      {!isFinalizado && (
                        <button
                          type="button"
                          onClick={() => onCancelar(comp)}
                          className="p-1.5 rounded text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Cancelar"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
