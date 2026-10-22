import { useState, useMemo } from 'react'
import { Clock, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { DateTime } from 'luxon'
import clsx from 'clsx'
import type { Compromisso } from '../types'

export interface OpcaoDuracaoRapida {
  minutos: number
  label: string
  labelCurto: string
}

export const DURACOES_RAPIDAS: OpcaoDuracaoRapida[] = [
  { minutos: 15, label: '15 min', labelCurto: '15 min' },
  { minutos: 30, label: '30 min', labelCurto: '30 min' },
  { minutos: 45, label: '45 min', labelCurto: '45 min' },
  { minutos: 60, label: '1 hora', labelCurto: '1 h' },
  { minutos: 90, label: '1h30', labelCurto: '1,5 h' },
  { minutos: 120, label: '2 horas', labelCurto: '2 h' },
  { minutos: 180, label: '3 horas', labelCurto: '3 h' },
]

export const LOCAIS_SUGERIDOS = [
  { label: '🏪 Showroom / Loja', valor: 'Showroom Líder Móveis' },
  { label: '🏗️ Obra / Imóvel', valor: 'Imóvel / Obra do Cliente' },
  { label: '📐 Escritório Especificador', valor: 'Escritório do Especificador' },
  { label: '💻 Reunião Online', valor: 'Reunião Online (Vídeo)' },
]

export function formatarRotuloDuracaoGoogle(minutos: number): string {
  if (minutos <= 0) return '0 min'
  if (minutos < 60) return `${minutos} min`
  const horas = minutos / 60
  if (Number.isInteger(horas)) {
    return `${horas} h`
  }
  const horasInt = Math.floor(minutos / 60)
  const restoMin = minutos % 60
  if (restoMin === 30) {
    return `${horasInt},5 h`
  }
  return `${horasInt}h${restoMin}min`
}

export function encontrarConflitosAgenda(
  compromissos: Compromisso[],
  responsavelId: number,
  dataHoraInicio: string,
  dataHoraFim: string,
  ignorarCompromissoId?: number
): Compromisso[] {
  if (!compromissos?.length || !responsavelId || !dataHoraInicio || !dataHoraFim) {
    return []
  }

  const dtInicio = DateTime.fromISO(dataHoraInicio)
  const dtFim = DateTime.fromISO(dataHoraFim)
  if (!dtInicio.isValid || !dtFim.isValid || dtFim <= dtInicio) {
    return []
  }

  return compromissos.filter((comp) => {
    if (ignorarCompromissoId && comp.id === ignorarCompromissoId) return false
    if (comp.status === 'cancelado' || comp.status === 'concluido') return false
    if (Number(comp.responsavelId) !== Number(responsavelId)) return false

    const compInicio = DateTime.fromISO(comp.dataHoraInicio)
    const compFim = DateTime.fromISO(comp.dataHoraFim)
    if (!compInicio.isValid || !compFim.isValid) return false

    // Sobreposição de intervalos: [inicioA < fimB] e [fimA > inicioB]
    return dtInicio < compFim && dtFim > compInicio
  })
}

interface SeletorDataHoraDuracaoProps {
  dataHoraInicio: string
  dataHoraFim: string
  onChange: (novoInicio: string, novoFim: string) => void
  compromissosExistentes?: Compromisso[]
  responsavelId?: number
  responsavelNome?: string
  ignorarCompromissoId?: number
}

// Gera todos os horários do dia em intervalos de 15 minutos (06:00 às 22:45 + madrugada)
const HORARIOS_DIA: string[] = []
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 15, 30, 45]) {
    HORARIOS_DIA.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}
for (let h = 0; h < 6; h++) {
  for (const m of [0, 30]) {
    HORARIOS_DIA.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}
for (const m of [0, 30]) {
  HORARIOS_DIA.push(`23:${String(m).padStart(2, '0')}`)
}

// Opções de duração em minutos para o dropdown de horário de término (estilo Google Calendar)
const DURACOES_DROPDOWN_MINUTOS = [
  15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360, 420, 480, 540, 600,
]

export default function SeletorDataHoraDuracao({
  dataHoraInicio,
  dataHoraFim,
  onChange,
  compromissosExistentes = [],
  responsavelId,
  responsavelNome,
  ignorarCompromissoId,
}: SeletorDataHoraDuracaoProps) {
  const dtInicio = useMemo(() => {
    const parsed = DateTime.fromISO(dataHoraInicio)
    return parsed.isValid ? parsed : DateTime.now().plus({ hours: 1 }).startOf('hour')
  }, [dataHoraInicio])

  const dtFim = useMemo(() => {
    const parsed = DateTime.fromISO(dataHoraFim)
    if (parsed.isValid && parsed > dtInicio) return parsed
    return dtInicio.plus({ minutes: 60 })
  }, [dataHoraFim, dtInicio])

  const duracaoMinutos = useMemo(() => {
    const diff = Math.round(dtFim.diff(dtInicio, 'minutes').minutes)
    return diff > 0 ? diff : 60
  }, [dtInicio, dtFim])

  const dataStr = dtInicio.toFormat('yyyy-MM-dd')
  const horaInicioStr = dtInicio.toFormat('HH:mm')
  const horaFimStr = dtFim.toFormat('HH:mm')

  // Estado "Dia inteiro" (08:00 às 18:00 = 600 min)
  const [modoDiaInteiro, setModoDiaInteiro] = useState(false)
  const isDiaInteiro =
    modoDiaInteiro || (horaInicioStr === '08:00' && horaFimStr === '18:00' && duracaoMinutos === 600)

  // Data formatada amigável estilo Google Calendar ("Qui., 22 de out.")
  const dataAmigavel = useMemo(() => {
    return dtInicio.setLocale('pt-BR').toFormat("ccc, dd 'de' LLL")
  }, [dtInicio])

  // Muda a data mantendo a hora de início e a duração atual
  const handleDataChange = (novaData: string) => {
    if (!novaData) return
    const [ano, mes, dia] = novaData.split('-').map(Number)
    if (!ano || !mes || !dia) return

    const novoDtInicio = dtInicio.set({ year: ano, month: mes, day: dia })
    const novoDtFim = novoDtInicio.plus({ minutes: duracaoMinutos })

    onChange(
      novoDtInicio.toFormat("yyyy-MM-dd'T'HH:mm"),
      novoDtFim.toFormat("yyyy-MM-dd'T'HH:mm")
    )
  }

  // Muda a hora de início e desloca automaticamente o término preservando a duração!
  const handleHoraInicioChange = (novaHora: string) => {
    if (!novaHora) return
    const [hora, minuto] = novaHora.split(':').map(Number)
    if (Number.isNaN(hora) || Number.isNaN(minuto)) return

    setModoDiaInteiro(false)
    const novoDtInicio = dtInicio.set({ hour: hora, minute: minuto })
    const duracaoParaManter = isDiaInteiro ? 60 : duracaoMinutos
    const novoDtFim = novoDtInicio.plus({ minutes: duracaoParaManter })

    onChange(
      novoDtInicio.toFormat("yyyy-MM-dd'T'HH:mm"),
      novoDtFim.toFormat("yyyy-MM-dd'T'HH:mm")
    )
  }

  // Muda a duração (via dropdown de término ou via pílulas rápidas)
  const handleDuracaoChange = (novosMinutos: number) => {
    setModoDiaInteiro(false)
    const novoDtFim = dtInicio.plus({ minutes: novosMinutos })
    onChange(
      dtInicio.toFormat("yyyy-MM-dd'T'HH:mm"),
      novoDtFim.toFormat("yyyy-MM-dd'T'HH:mm")
    )
  }

  // Alterna o checkbox "Dia inteiro" (08:00 às 18:00)
  const handleToggleDiaInteiro = (checked: boolean) => {
    setModoDiaInteiro(checked)
    if (checked) {
      const inicioDia = dtInicio.set({ hour: 8, minute: 0 })
      const fimDia = dtInicio.set({ hour: 18, minute: 0 })
      onChange(
        inicioDia.toFormat("yyyy-MM-dd'T'HH:mm"),
        fimDia.toFormat("yyyy-MM-dd'T'HH:mm")
      )
    } else {
      const inicioPadrao = dtInicio.set({ hour: 9, minute: 0 })
      const fimPadrao = inicioPadrao.plus({ minutes: 60 })
      onChange(
        inicioPadrao.toFormat("yyyy-MM-dd'T'HH:mm"),
        fimPadrao.toFormat("yyyy-MM-dd'T'HH:mm")
      )
    }
  }

  // Atalhos rápidos de data (Hoje / Amanhã)
  const handleAtalhoData = (diasOffset: number) => {
    const alvo = DateTime.now().plus({ days: diasOffset })
    handleDataChange(alvo.toFormat('yyyy-MM-dd'))
  }

  // Opções de hora de início (garantindo que o valor atual esteja presente)
  const opcoesHoraInicio = useMemo(() => {
    if (HORARIOS_DIA.includes(horaInicioStr)) return HORARIOS_DIA
    return [horaInicioStr, ...HORARIOS_DIA]
  }, [horaInicioStr])

  // Opções de hora de término com duração entre parênteses (ex.: "13:00 (1 h)")
  const opcoesHoraFim = useMemo(() => {
    const listaMinutos = DURACOES_DROPDOWN_MINUTOS.includes(duracaoMinutos)
      ? DURACOES_DROPDOWN_MINUTOS
      : [...DURACOES_DROPDOWN_MINUTOS, duracaoMinutos].sort((a, b) => a - b)

    return listaMinutos.map((min) => {
      const fimCalculado = dtInicio.plus({ minutes: min })
      const mudouDia = !fimCalculado.hasSame(dtInicio, 'day')
      const horaFormatada = fimCalculado.toFormat('HH:mm')
      const rotuloDuracao = formatarRotuloDuracaoGoogle(min)
      return {
        minutos: min,
        hora: horaFormatada,
        label: `${horaFormatada}${mudouDia ? ' (+1d)' : ''} (${rotuloDuracao})`,
      }
    })
  }, [dtInicio, duracaoMinutos])

  // Conflitos de horário em tempo real para o responsável selecionado
  const conflitos = useMemo(() => {
    if (!responsavelId || !compromissosExistentes.length) return []
    return encontrarConflitosAgenda(
      compromissosExistentes,
      responsavelId,
      dataHoraInicio,
      dataHoraFim,
      ignorarCompromissoId
    )
  }, [compromissosExistentes, responsavelId, dataHoraInicio, dataHoraFim, ignorarCompromissoId])

  const isHojeSelecionado = dtInicio.hasSame(DateTime.now(), 'day')
  const isAmanhaSelecionado = dtInicio.hasSame(DateTime.now().plus({ days: 1 }), 'day')

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-3">
      {/* Cabeçalho da seção: Ícone Relógio + Atalhos de Dia + Toggle Dia Inteiro */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white border border-stone-200/80 flex items-center justify-center text-stone-600 shadow-2xs">
            <Clock size={13} />
          </div>
          <span className="text-xs font-semibold text-stone-800">
            Data, Horário e Duração <span className="text-rose-500">*</span>
          </span>
          <span className="text-[11px] font-medium text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded-full capitalize">
            {dataAmigavel} • {isDiaInteiro ? 'Dia inteiro' : formatarRotuloDuracaoGoogle(duracaoMinutos)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Atalhos rápidos Hoje / Amanhã */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAtalhoData(0)}
              className={clsx(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                isHojeSelecionado
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              )}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleAtalhoData(1)}
              className={clsx(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                isAmanhaSelecionado
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              )}
            >
              Amanhã
            </button>
          </div>

          <span className="text-stone-300">|</span>

          {/* Checkbox Dia Inteiro estilo Google Agenda */}
          <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDiaInteiro}
              onChange={(e) => handleToggleDiaInteiro(e.target.checked)}
              className="rounded border-stone-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Dia inteiro</span>
          </label>
        </div>
      </div>

      {/* Linha Principal Estilo Google Calendar: [Data] [Hora Início] – [Hora Fim (Duração)] */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        {/* Coluna 1: Data Única */}
        <div className={clsx(isDiaInteiro ? 'sm:col-span-12' : 'sm:col-span-5', 'relative')}>
          <div className="relative flex items-center">
            <CalendarIcon
              size={13}
              className="absolute left-3 text-stone-400 pointer-events-none"
            />
            <input
              type="date"
              value={dataStr}
              onChange={(e) => handleDataChange(e.target.value)}
              className="input w-full pl-8 pr-2.5 py-2 text-xs bg-white font-medium text-stone-800"
              required
              aria-label="Data do compromisso"
            />
          </div>
        </div>

        {/* Coluna 2 e 3: Horário de Início até Horário de Término (com Duração) */}
        {!isDiaInteiro ? (
          <div className="sm:col-span-7 flex items-center gap-2">
            {/* Select Hora de Início */}
            <div className="w-[105px] shrink-0">
              <select
                value={horaInicioStr}
                onChange={(e) => handleHoraInicioChange(e.target.value)}
                className="input w-full py-2 px-2.5 text-xs bg-white font-semibold text-stone-800 cursor-pointer"
                aria-label="Horário de início"
              >
                {opcoesHoraInicio.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-stone-400 font-medium text-xs shrink-0">até</span>

            {/* Select Hora de Término + Duração estilo Google Agenda */}
            <div className="flex-1 min-w-0">
              <select
                value={duracaoMinutos}
                onChange={(e) => handleDuracaoChange(Number(e.target.value))}
                className="input w-full py-2 px-2.5 text-xs bg-white font-semibold text-stone-800 cursor-pointer"
                aria-label="Horário de término e duração"
              >
                {opcoesHoraFim.map((opt) => (
                  <option key={opt.minutos} value={opt.minutos}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="sm:col-span-12 text-[11px] text-stone-600 bg-white border border-stone-200/80 rounded-lg px-3 py-2 flex items-center justify-between">
            <span>Compromisso marcado para o período comercial completo</span>
            <span className="font-mono font-semibold text-stone-800">08:00 – 18:00 (10 h)</span>
          </div>
        )}
      </div>

      {/* Pílulas Rápidas de Duração (1 clique) */}
      {!isDiaInteiro && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-stone-500 mr-1 flex items-center gap-1">
            <Sparkles size={11} className="text-primary-600" />
            Duração rápida:
          </span>
          {DURACOES_RAPIDAS.map((d) => {
            const ativo = duracaoMinutos === d.minutos
            return (
              <button
                key={d.minutos}
                type="button"
                onClick={() => handleDuracaoChange(d.minutos)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                  ativo
                    ? 'bg-primary-600 text-white shadow-2xs font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200/90 hover:border-stone-300 hover:bg-stone-100/70'
                )}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Indicador de Disponibilidade na Agenda (Estilo "Encontrar um horário" do Google Agenda) */}
      {compromissosExistentes.length > 0 && responsavelId ? (
        <div
          className={clsx(
            'rounded-lg px-3 py-2 text-[11px] flex items-start gap-2 border transition-colors',
            conflitos.length > 0
              ? 'bg-amber-50/90 border-amber-200 text-amber-900'
              : 'bg-emerald-50/60 border-emerald-200/70 text-emerald-800'
          )}
        >
          {conflitos.length > 0 ? (
            <>
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">
                  Conflito de horário na agenda{responsavelNome ? ` de ${responsavelNome}` : ''}:
                </p>
                {conflitos.slice(0, 2).map((c) => {
                  const ini = DateTime.fromISO(c.dataHoraInicio).toFormat('HH:mm')
                  const fim = DateTime.fromISO(c.dataHoraFim).toFormat('HH:mm')
                  return (
                    <p key={c.id} className="text-amber-800">
                      • <strong>{c.titulo}</strong> ({ini} – {fim})
                      {c.lead?.nome ? ` com ${c.lead.nome}` : ''}
                    </p>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Horário disponível na agenda{responsavelNome ? ` de ${responsavelNome}` : ''} ({horaInicioStr} – {horaFimStr})
              </span>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
