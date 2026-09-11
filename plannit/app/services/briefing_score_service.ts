/**
 * Serviço de cálculo de Score do Briefing — RF009, RN002
 * O score bloqueia envio para fila de projetos se < score_minimo (padrão: 70)
 */

export interface CriterioScore {
  peso: number
  descricao: string
}

export const CRITERIOS_SCORE: Record<string, CriterioScore> = {
  // Dados obrigatórios (peso total: 40 pontos)
  cidade_obra: { peso: 8, descricao: 'Cidade da obra informada' },
  ambientes: { peso: 10, descricao: 'Ambientes selecionados' },
  prazo_desejado: { peso: 8, descricao: 'Prazo desejado informado' },
  faixa_investimento: { peso: 14, descricao: 'Faixa de investimento definida' },

  // Qualidade do levantamento (peso total: 35 pontos)
  ambientes_detalhados: { peso: 15, descricao: 'Ambientes com descrição detalhada' },
  referencias_visuais: { peso: 12, descricao: 'Referências visuais enviadas' },
  medidas_preliminares: { peso: 8, descricao: 'Medidas preliminares informadas' },

  // Informações comerciais (peso total: 25 pontos)
  estilo_preferido: { peso: 8, descricao: 'Estilo preferido informado' },
  arquiteto_vinculado: { peso: 7, descricao: 'Arquiteto/especificador vinculado' },
  observacoes: { peso: 10, descricao: 'Observações e contexto do cliente (mín. 50 caracteres)' },
}

export interface AmbienteScoreInput {
  tipo: string
  descricao?: string | null
  medidasPreliminares?: string | null
  observacoesEspecificas?: string | null
}

export interface BriefingScoreInput {
  cidadeObra?: string | null
  ambientes?: string[] | null
  prazoDesejado?: string | null
  faixaInvestimentoMin?: number | string | null
  faixaInvestimentoMax?: number | string | null
  ambientesDetalhados?: AmbienteScoreInput[] | null
  referenciasUrl?: string[] | null
  estiloPreferido?: string | null
  arquitetoNome?: string | null
  observacoes?: string | null
  scoreMinimo?: number
}

export interface BriefingScoreResult {
  score: number
  scoreMinimo: number
  aprovado: boolean
  detalhes: Record<string, boolean>
  pontosFaltantes: string[]
}

export function calcularScoreBriefing(dados: BriefingScoreInput): BriefingScoreResult {
  const detalhes: Record<string, boolean> = {}
  let pontosObtidos = 0
  const pontosFaltantes: string[] = []

  // 1. Cidade da obra
  detalhes.cidade_obra = Boolean(dados.cidadeObra && dados.cidadeObra.trim().length > 0)
  if (detalhes.cidade_obra) {
    pontosObtidos += CRITERIOS_SCORE.cidade_obra.peso
  } else {
    pontosFaltantes.push('Cidade da obra')
  }

  // 2. Ambientes
  const ambientes = Array.isArray(dados.ambientes) ? dados.ambientes : []
  detalhes.ambientes = ambientes.length > 0
  if (detalhes.ambientes) {
    pontosObtidos += CRITERIOS_SCORE.ambientes.peso
  } else {
    pontosFaltantes.push('Ambientes do projeto')
  }

  // 3. Prazo desejado
  detalhes.prazo_desejado = Boolean(dados.prazoDesejado && dados.prazoDesejado.trim().length > 0)
  if (detalhes.prazo_desejado) {
    pontosObtidos += CRITERIOS_SCORE.prazo_desejado.peso
  } else {
    pontosFaltantes.push('Prazo desejado')
  }

  // 4. Faixa de investimento (mínimo e máximo devem estar preenchidos)
  const temMin = dados.faixaInvestimentoMin !== null && dados.faixaInvestimentoMin !== undefined && dados.faixaInvestimentoMin !== ''
  const temMax = dados.faixaInvestimentoMax !== null && dados.faixaInvestimentoMax !== undefined && dados.faixaInvestimentoMax !== ''
  const temFaixa = Boolean(temMin && temMax)
  detalhes.faixa_investimento = temFaixa
  if (temFaixa) {
    pontosObtidos += CRITERIOS_SCORE.faixa_investimento.peso
  } else {
    pontosFaltantes.push('Faixa de investimento (mín. e máx.)')
  }

  // 5. Ambientes detalhados
  const ambientesDet = Array.isArray(dados.ambientesDetalhados) ? dados.ambientesDetalhados : []
  detalhes.ambientes_detalhados = ambientesDet.length > 0
  if (detalhes.ambientes_detalhados) {
    pontosObtidos += CRITERIOS_SCORE.ambientes_detalhados.peso
  } else {
    pontosFaltantes.push('Detalhamento dos ambientes')
  }

  // 6. Referências visuais
  const refs = Array.isArray(dados.referenciasUrl) ? dados.referenciasUrl.filter((r) => Boolean(r && r.trim())) : []
  detalhes.referencias_visuais = refs.length > 0
  if (detalhes.referencias_visuais) {
    pontosObtidos += CRITERIOS_SCORE.referencias_visuais.peso
  } else {
    pontosFaltantes.push('Referências visuais')
  }

  // 7. Medidas preliminares
  const temMedidas = ambientesDet.some(
    (a) => a && a.medidasPreliminares && a.medidasPreliminares.trim().length > 0
  )
  detalhes.medidas_preliminares = temMedidas
  if (temMedidas) {
    pontosObtidos += CRITERIOS_SCORE.medidas_preliminares.peso
  }

  // 8. Estilo preferido
  detalhes.estilo_preferido = Boolean(dados.estiloPreferido && dados.estiloPreferido.trim().length > 0)
  if (detalhes.estilo_preferido) {
    pontosObtidos += CRITERIOS_SCORE.estilo_preferido.peso
  }

  // 9. Arquiteto vinculado
  const temArquiteto = Boolean(dados.arquitetoNome && dados.arquitetoNome.trim().length > 0)
  detalhes.arquiteto_vinculado = temArquiteto
  if (temArquiteto) {
    pontosObtidos += CRITERIOS_SCORE.arquiteto_vinculado.peso
  }

  // 10. Observações (mínimo 50 caracteres)
  const obs = (dados.observacoes || '').trim()
  detalhes.observacoes = obs.length >= 50
  if (detalhes.observacoes) {
    pontosObtidos += CRITERIOS_SCORE.observacoes.peso
  }

  const scoreMinimo = Number(dados.scoreMinimo ?? 70)

  return {
    score: Math.round(pontosObtidos * 10) / 10,
    scoreMinimo,
    aprovado: pontosObtidos >= scoreMinimo,
    detalhes,
    pontosFaltantes,
  }
}
