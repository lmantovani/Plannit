import { FUNIL_ETAPAS, type FunilEtapa } from './constants'

export { FUNIL_ETAPAS, type FunilEtapa }

export interface HistoricoTransicaoStatus {
  id: number
  leadId?: number
  statusDe: string | null
  statusDeLabel?: string | null
  statusPara: string
  statusParaLabel?: string | null
  tempoPermanenciaSegundos: number | null
  observacao?: string | null
  createdAt: string | null
  alteradoPor?: { id: number; nome: string } | null
}

export interface ResumoTempoColuna {
  status: string
  label: string
  cor: string
  bg: string
  text: string
  border: string
  tempoTotalSegundos: number
  passagens: number
  isAtual: boolean
  tempoPassagemAtualSegundos: number
  percentual: number
  percentualFormatado: string
}

export interface DetalhesTempoLead {
  tempoTotalLeadSegundos: number
  colunas: ResumoTempoColuna[]
  temRetornos: boolean // indica se o lead retornou para alguma coluna mais de 1 vez
  colunaMaisDemorada: ResumoTempoColuna | null
}

/**
 * Formata duração em segundos de forma humanizada e detalhada.
 * Exemplo:
 * - 45 -> "45s"
 * - 300 -> "5min"
 * - 3720 -> "1h 2min"
 * - 90000 -> "1d 1h"
 */
export function formatarDuracaoDetalhada(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined || segundos <= 0) {
    return '0s'
  }

  const s = Math.floor(segundos)
  if (s < 60) return `${s}s`

  const mins = Math.floor(s / 60)
  if (mins < 60) {
    const restoSeg = s % 60
    return restoSeg > 0 ? `${mins}m ${restoSeg}s` : `${mins}min`
  }

  const horas = Math.floor(mins / 60)
  const restoMin = mins % 60
  if (horas < 24) {
    return restoMin > 0 ? `${horas}h ${restoMin}m` : `${horas}h`
  }

  const dias = Math.floor(horas / 24)
  const restoHoras = horas % 24
  if (restoHoras > 0) {
    return `${dias}d ${restoHoras}h`
  }
  return `${dias}d`
}

/**
 * Mapeamento das propriedades visuais das etapas do funil
 */
function getEtapaConfig(
  statusKey: string,
  etapasCatalogo?: FunilEtapa[],
  historicoLabels?: Record<string, string>
): FunilEtapa {
  if (etapasCatalogo && etapasCatalogo.length > 0) {
    const custom = etapasCatalogo.find((e) => e.key === statusKey)
    if (custom) return custom
  }

  const encontrada = FUNIL_ETAPAS.find((e) => e.key === statusKey)
  if (encontrada) return encontrada

  const labelHistorico = historicoLabels?.[statusKey]
  return {
    key: statusKey,
    label: labelHistorico || statusKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    cor: '#78716c',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
    text: 'text-stone-700',
  }
}

/**
 * Calcula o tempo acumulado por coluna do funil para um lead,
 * somando todas as passagens passadas e adicionando o tempo em andamento na coluna atual.
 */
export function calcularTempoPorColuna(
  statusAtual: string,
  historicoStatus: HistoricoTransicaoStatus[] | undefined,
  statusAlteradoEm: string | null | undefined,
  leadCreatedAt: string | null | undefined,
  nowMs: number = Date.now(),
  etapasCatalogo?: FunilEtapa[]
): DetalhesTempoLead {
  const mapaSoma: Record<
    string,
    {
      tempoPassadoSegundos: number
      passagensPassadas: number
    }
  > = {}
  const historicoLabels: Record<string, string> = {}

  // 1. Processar todas as saídas registradas no histórico
  if (historicoStatus && historicoStatus.length > 0) {
    for (const h of historicoStatus) {
      if (h.statusDe && h.statusDeLabel) {
        historicoLabels[h.statusDe] = h.statusDeLabel
      }
      if (h.statusPara && h.statusParaLabel) {
        historicoLabels[h.statusPara] = h.statusParaLabel
      }
      if (h.statusDe) {
        if (!mapaSoma[h.statusDe]) {
          mapaSoma[h.statusDe] = { tempoPassadoSegundos: 0, passagensPassadas: 0 }
        }
        mapaSoma[h.statusDe].tempoPassadoSegundos += Math.max(0, h.tempoPermanenciaSegundos || 0)
        mapaSoma[h.statusDe].passagensPassadas += 1
      }
    }
  }

  // 2. Calcular tempo decorrido na coluna atual
  const refDateStr = statusAlteradoEm || leadCreatedAt
  let tempoPassagemAtualSegundos = 0
  if (refDateStr) {
    const refMs = new Date(refDateStr).getTime()
    if (!Number.isNaN(refMs) && refMs <= nowMs) {
      tempoPassagemAtualSegundos = Math.max(0, Math.floor((nowMs - refMs) / 1000))
    }
  }

  // 3. Montar a lista consolidada de todas as colunas pelas quais o lead passou ou está
  const colunasChaves = new Set<string>()
  Object.keys(mapaSoma).forEach((k) => colunasChaves.add(k))
  if (statusAtual) {
    colunasChaves.add(statusAtual)
  }

  // Ordenar conforme a ordem do catálogo ou FUNIL_ETAPAS
  const ordemFunil: Record<string, number> = {}
  const baseEtapas = etapasCatalogo && etapasCatalogo.length > 0 ? etapasCatalogo : FUNIL_ETAPAS
  baseEtapas.forEach((e, idx) => {
    ordemFunil[e.key] = idx
  })
  FUNIL_ETAPAS.forEach((e, idx) => {
    if (ordemFunil[e.key] === undefined) {
      ordemFunil[e.key] = 100 + idx
    }
  })

  const chavesOrdenadas = Array.from(colunasChaves).sort((a, b) => {
    const ordA = ordemFunil[a] ?? 999
    const ordB = ordemFunil[b] ?? 999
    return ordA - ordB
  })

  let tempoTotalLeadSegundos = 0
  let temRetornos = false

  const colunasCalculadas: ResumoTempoColuna[] = chavesOrdenadas.map((key) => {
    const config = getEtapaConfig(key, etapasCatalogo, historicoLabels)
    const dadosPassados = mapaSoma[key] || { tempoPassadoSegundos: 0, passagensPassadas: 0 }
    const isAtual = key === statusAtual

    const passagens = dadosPassados.passagensPassadas + (isAtual ? 1 : 0)
    const tempoTotalSegundos = dadosPassados.tempoPassadoSegundos + (isAtual ? tempoPassagemAtualSegundos : 0)

    tempoTotalLeadSegundos += tempoTotalSegundos

    if (passagens > 1) {
      temRetornos = true
    }

    return {
      status: key,
      label: config.label,
      cor: config.cor,
      bg: config.bg,
      text: config.text,
      border: config.border,
      tempoTotalSegundos,
      passagens,
      isAtual,
      tempoPassagemAtualSegundos: isAtual ? tempoPassagemAtualSegundos : 0,
      percentual: 0,
      percentualFormatado: '0%',
    }
  })

  // 4. Calcular percentuais e identificar a coluna mais demorada
  let colunaMaisDemorada: ResumoTempoColuna | null = null

  colunasCalculadas.forEach((col) => {
    if (tempoTotalLeadSegundos <= 0 || col.tempoTotalSegundos <= 0) {
      col.percentual = 0
      col.percentualFormatado = '0%'
    } else if (col.tempoTotalSegundos === tempoTotalLeadSegundos) {
      col.percentual = 100
      col.percentualFormatado = '100%'
    } else {
      const pct = (col.tempoTotalSegundos / tempoTotalLeadSegundos) * 100
      col.percentual = Math.round(pct)
      if (pct < 1) {
        col.percentualFormatado = '< 1%'
      } else if (pct > 99) {
        col.percentualFormatado = '> 99%'
      } else {
        col.percentualFormatado = `${Math.round(pct)}%`
      }
    }

    if (!colunaMaisDemorada || col.tempoTotalSegundos > colunaMaisDemorada.tempoTotalSegundos) {
      colunaMaisDemorada = col
    }
  })

  return {
    tempoTotalLeadSegundos,
    colunas: colunasCalculadas,
    temRetornos,
    colunaMaisDemorada,
  }
}

