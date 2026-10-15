import { Link } from '@inertiajs/react'
import {
  Clock,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  CalendarClock,
  Edit3,
  XCircle,
  ExternalLink,
  FolderKanban,
  FileCheck,
} from 'lucide-react'
import clsx from 'clsx'
import type { Compromisso } from '../types'
import {
  formatarHora,
  calcularDuracao,
  getUrgenciaCompromisso,
  getStatusBadgeInfo,
} from '../utils'

interface CompromissoCardProps {
  compromisso: Compromisso
  onConcluir: (compromisso: Compromisso) => void
  onReagendar: (compromisso: Compromisso) => void
  onEditar: (compromisso: Compromisso) => void
  onCancelar: (compromisso: Compromisso) => void
}

export default function CompromissoCard({
  compromisso,
  onConcluir,
  onReagendar,
  onEditar,
  onCancelar,
}: CompromissoCardProps) {
  const urgencia = getUrgenciaCompromisso(compromisso)
  const statusInfo = getStatusBadgeInfo(compromisso.status)
  const duracao = calcularDuracao(compromisso.dataHoraInicio, compromisso.dataHoraFim)
  const corTipo = compromisso.tipo?.cor || '#D97706'
  const isFinalizado = compromisso.status === 'concluido' || compromisso.status === 'cancelado'

  // Iniciais do responsável
  const responsavelNome = compromisso.responsavel?.nome || 'Não atribuído'
  const iniciais = responsavelNome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

  return (
    <div
      className={clsx(
        'relative bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden',
        isFinalizado
          ? 'border-stone-200/80 opacity-90'
          : urgencia?.nivel === 'atrasado'
            ? 'border-rose-300 shadow-rose-50/50'
            : urgencia?.nivel === 'hoje'
              ? 'border-blue-300 shadow-blue-50/50'
              : 'border-stone-200 shadow-sm'
      )}
    >
      {/* Faixa lateral esquerda indicando a cor do catálogo */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: corTipo }}
        title={`Tipo: ${compromisso.tipo?.nome || 'Geral'}`}
      />

      <div className="p-4 pl-5 space-y-3">
        {/* Cabeçalho do Card: Tipo, Urgência e Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tag do Tipo com a cor customizada */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border"
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
              {compromisso.tipo?.nome || 'Compromisso'}
            </span>

            {/* Badge de Urgência */}
            {urgencia && (
              <span
                className={clsx(
                  'px-2 py-0.5 rounded text-[10px] border flex items-center gap-1',
                  urgencia.badgeClass
                )}
              >
                {urgencia.label}
              </span>
            )}
          </div>

          {/* Badge de Status */}
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-[10px] font-medium border',
              statusInfo.badgeClass
            )}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Título do Compromisso */}
        <div>
          <h3
            className={clsx(
              'text-sm font-semibold text-stone-900 leading-snug line-clamp-2',
              compromisso.status === 'cancelado' && 'line-through text-stone-400'
            )}
            title={compromisso.titulo}
          >
            {compromisso.titulo}
          </h3>
        </div>

        {/* Horário, Duração e Local */}
        <div className="space-y-1 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-stone-400 shrink-0" />
            <span className="font-medium text-stone-800">
              {formatarHora(compromisso.dataHoraInicio)} – {formatarHora(compromisso.dataHoraFim)}
            </span>
            {duracao && <span className="text-stone-400 font-normal">({duracao})</span>}
          </div>

          {compromisso.local && (
            <div className="flex items-center gap-1.5 text-stone-600 truncate" title={compromisso.local}>
              <MapPin size={13} className="text-stone-400 shrink-0" />
              <span className="truncate">{compromisso.local}</span>
            </div>
          )}
        </div>

        {/* Vínculos Operacionais (Lead ou Projeto) */}
        {(compromisso.lead || compromisso.projeto) && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2 text-xs">
            {compromisso.lead && (
              <Link
                href={`/crm?leadId=${compromisso.lead.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors text-[11px]"
                title={`Ver lead no CRM: ${compromisso.lead.nome}`}
              >
                <UserIcon size={11} className="text-amber-700" />
                <span className="font-medium truncate max-w-[140px]">{compromisso.lead.nome}</span>
                <ExternalLink size={10} className="text-amber-600 shrink-0" />
              </Link>
            )}

            {compromisso.projeto && (
              <Link
                href={`/projetos/${compromisso.projeto.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 transition-colors text-[11px]"
                title={`Ver projeto: ${compromisso.projeto.codigo}`}
              >
                <FolderKanban size={11} className="text-stone-600" />
                <span className="font-medium">{compromisso.projeto.codigo}</span>
                <ExternalLink size={10} className="text-stone-400 shrink-0" />
              </Link>
            )}
          </div>
        )}

        {/* Observações / Pauta rápida */}
        {compromisso.observacoes && (
          <p className="text-[11px] text-stone-500 line-clamp-2 italic bg-stone-50 p-1.5 rounded border border-stone-100">
            {compromisso.observacoes}
          </p>
        )}

        {/* Desfecho Registrado (para compromissos concluídos) */}
        {compromisso.desfecho && (
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded p-2 text-xs text-emerald-900 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
              <FileCheck size={12} className="text-emerald-700" />
              Desfecho Registrado
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">{compromisso.desfecho}</p>
          </div>
        )}
      </div>

      {/* Rodapé com Responsável e Botões de Ação */}
      <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
        {/* Responsável com Avatar */}
        <div className="flex items-center gap-2 min-w-0" title={`Responsável: ${responsavelNome}`}>
          <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold shrink-0">
            {iniciais || 'U'}
          </div>
          <span className="text-xs text-stone-700 font-medium truncate max-w-[110px]">
            {responsavelNome}
          </span>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          {!isFinalizado && (
            <>
              <button
                type="button"
                onClick={() => onConcluir(compromisso)}
                className="p-1 rounded text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title="Concluir compromisso e registrar desfecho"
              >
                <CheckCircle2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => onReagendar(compromisso)}
                className="p-1 rounded text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                title="Reagendar data e horário"
              >
                <CalendarClock size={15} />
              </button>
            </>
          )}

          {compromisso.status !== 'cancelado' && (
            <button
              type="button"
              onClick={() => onEditar(compromisso)}
              className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              title="Editar informações"
            >
              <Edit3 size={15} />
            </button>
          )}

          {!isFinalizado && (
            <button
              type="button"
              onClick={() => onCancelar(compromisso)}
              className="p-1 rounded text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Cancelar compromisso"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
