import { DateTime } from 'luxon'
import type { Compromisso, StatusCompromissoType } from './types'

export function formatarDataHora(isoString: string): string {
  const dt = DateTime.fromISO(isoString)
  if (!dt.isValid) return ''
  return dt.toFormat('dd/MM/yyyy HH:mm')
}

export function formatarData(isoString: string): string {
  const dt = DateTime.fromISO(isoString)
  if (!dt.isValid) return ''
  return dt.toFormat('dd/MM/yyyy')
}

export function formatarHora(isoString: string): string {
  const dt = DateTime.fromISO(isoString)
  if (!dt.isValid) return ''
  return dt.toFormat('HH:mm')
}

export function calcularDuracao(inicioIso: string, fimIso: string): string {
  const inicio = DateTime.fromISO(inicioIso)
  const fim = DateTime.fromISO(fimIso)
  if (!inicio.isValid || !fim.isValid) return ''

  const diffMinutos = Math.max(0, Math.round(fim.diff(inicio, 'minutes').minutes))
  if (diffMinutos < 60) {
    return `${diffMinutos}min`
  }

  const horas = Math.floor(diffMinutos / 60)
  const minutosRestantes = diffMinutos % 60
  if (minutosRestantes === 0) {
    return `${horas}h`
  }
  return `${horas}h ${minutosRestantes}min`
}

export interface UrgenciaInfo {
  nivel: 'atrasado' | 'hoje' | 'futuro'
  label: string
  badgeClass: string
  iconClass: string
}

export function getUrgenciaCompromisso(compromisso: Compromisso): UrgenciaInfo | null {
  if (compromisso.status === 'concluido' || compromisso.status === 'cancelado') {
    return null
  }

  const agora = DateTime.now()
  const fim = DateTime.fromISO(compromisso.dataHoraFim)
  const inicio = DateTime.fromISO(compromisso.dataHoraInicio)

  // Se o término ou início já passou e o compromisso não foi concluído
  if (fim < agora || inicio < agora.minus({ hours: 1 })) {
    return {
      nivel: 'atrasado',
      label: 'Atrasado',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90 font-medium',
      iconClass: 'text-rose-600',
    }
  }

  if (inicio.hasSame(agora, 'day')) {
    return {
      nivel: 'hoje',
      label: 'Hoje',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/90 font-semibold',
      iconClass: 'text-blue-600',
    }
  }

  return {
    nivel: 'futuro',
    label: 'Futuro',
    badgeClass: 'bg-stone-50 text-stone-600 border-stone-200/80',
    iconClass: 'text-stone-400',
  }
}

export function getStatusBadgeInfo(status: StatusCompromissoType): {
  label: string
  badgeClass: string
} {
  switch (status) {
    case 'agendado':
      return {
        label: 'Agendado',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    case 'reagendado':
      return {
        label: 'Reagendado',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    case 'concluido':
      return {
        label: 'Concluído',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      }
    case 'cancelado':
      return {
        label: 'Cancelado',
        badgeClass: 'bg-stone-50 text-stone-400 border-stone-200 line-through',
      }
    default:
      return {
        label: status,
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      }
  }
}
