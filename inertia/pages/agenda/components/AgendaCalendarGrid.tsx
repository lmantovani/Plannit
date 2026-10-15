import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { Calendar, Plus } from 'lucide-react'
import clsx from 'clsx'
import type { Compromisso } from '../types'
import CompromissoCard from './CompromissoCard'

interface AgendaCalendarGridProps {
  compromissos: Compromisso[]
  onConcluir: (compromisso: Compromisso) => void
  onReagendar: (compromisso: Compromisso) => void
  onEditar: (compromisso: Compromisso) => void
  onCancelar: (compromisso: Compromisso) => void
  onNovoCompromisso: () => void
}

interface GrupoDia {
  dataKey: string
  labelData: string
  sublabel: string
  isHoje: boolean
  compromissos: Compromisso[]
}

export default function AgendaCalendarGrid({
  compromissos,
  onConcluir,
  onReagendar,
  onEditar,
  onCancelar,
  onNovoCompromisso,
}: AgendaCalendarGridProps) {
  // Agrupa os compromissos por dia
  const diasAgrupados = useMemo(() => {
    const grupos: Record<string, Compromisso[]> = {}
    const agora = DateTime.now()

    compromissos.forEach((comp) => {
      const dt = DateTime.fromISO(comp.dataHoraInicio)
      const dataKey = dt.isValid ? dt.toFormat('yyyy-MM-dd') : 'indefinido'
      if (!grupos[dataKey]) {
        grupos[dataKey] = []
      }
      grupos[dataKey].push(comp)
    })

    const chavesOrdenadas = Object.keys(grupos).sort()

    return chavesOrdenadas.map((dataKey): GrupoDia => {
      const dt = DateTime.fromISO(dataKey)
      let labelData = ''
      let sublabel = ''
      const isHoje = dt.isValid && dt.hasSame(agora, 'day')
      const isAmanha = dt.isValid && dt.hasSame(agora.plus({ days: 1 }), 'day')
      const isOntem = dt.isValid && dt.hasSame(agora.minus({ days: 1 }), 'day')

      if (isHoje) {
        labelData = 'Hoje'
        sublabel = dt.toFormat("dd 'de' MMMM (cccc)")
      } else if (isAmanha) {
        labelData = 'Amanhã'
        sublabel = dt.toFormat("dd 'de' MMMM (cccc)")
      } else if (isOntem) {
        labelData = 'Ontem'
        sublabel = dt.toFormat("dd 'de' MMMM (cccc)")
      } else if (dt.isValid) {
        labelData = dt.toFormat("dd 'de' MMMM")
        sublabel = dt.toFormat('cccc, yyyy')
      } else {
        labelData = 'Outros'
        sublabel = 'Sem data definida'
      }

      // Ordena os compromissos do dia por horário de início
      const compsDoDia = grupos[dataKey].sort((a, b) => {
        return (
          DateTime.fromISO(a.dataHoraInicio).toMillis() -
          DateTime.fromISO(b.dataHoraInicio).toMillis()
        )
      })

      return {
        dataKey,
        labelData,
        sublabel,
        isHoje,
        compromissos: compsDoDia,
      }
    })
  }, [compromissos])

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
    <div className="space-y-8">
      {diasAgrupados.map((grupo) => (
        <div key={grupo.dataKey} className="space-y-3">
          {/* Cabeçalho do Dia */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <div className="flex items-center gap-2.5">
              <span
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                  grupo.isHoje
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {grupo.labelData}
              </span>
              <span className="text-xs text-stone-500 capitalize">{grupo.sublabel}</span>
            </div>

            <span className="text-xs text-stone-400 font-medium">
              {grupo.compromissos.length} encontro{grupo.compromissos.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Grid de Cards do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupo.compromissos.map((comp) => (
              <CompromissoCard
                key={comp.id}
                compromisso={comp}
                onConcluir={onConcluir}
                onReagendar={onReagendar}
                onEditar={onEditar}
                onCancelar={onCancelar}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
