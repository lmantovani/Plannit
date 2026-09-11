export interface CriterioDef {
  key: string
  peso: number
  descricao: string
  categoria: 'obrigatorio' | 'levantamento' | 'comercial'
}

export const CRITERIOS_SCORE: CriterioDef[] = [
  // Dados obrigatórios (peso total: 40 pontos)
  { key: 'cidade_obra', peso: 8, descricao: 'Cidade da obra informada', categoria: 'obrigatorio' },
  { key: 'ambientes', peso: 10, descricao: 'Ambientes selecionados', categoria: 'obrigatorio' },
  { key: 'prazo_desejado', peso: 8, descricao: 'Prazo desejado informado', categoria: 'obrigatorio' },
  { key: 'faixa_investimento', peso: 14, descricao: 'Faixa de investimento (mín. e máx.) definida', categoria: 'obrigatorio' },

  // Qualidade do levantamento (peso total: 35 pontos)
  { key: 'ambientes_detalhados', peso: 15, descricao: 'Ambientes com descrição detalhada', categoria: 'levantamento' },
  { key: 'referencias_visuais', peso: 12, descricao: 'Referências visuais enviadas', categoria: 'levantamento' },
  { key: 'medidas_preliminares', peso: 8, descricao: 'Medidas preliminares informadas', categoria: 'levantamento' },

  // Informações comerciais (peso total: 25 pontos)
  { key: 'estilo_preferido', peso: 8, descricao: 'Estilo preferido informado', categoria: 'comercial' },
  { key: 'arquiteto_vinculado', peso: 7, descricao: 'Arquiteto/especificador vinculado', categoria: 'comercial' },
  { key: 'observacoes', peso: 10, descricao: 'Observações e contexto do cliente (mín. 50 caracteres)', categoria: 'comercial' },
]

export const TIPO_AMBIENTE_OPTIONS = [
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'closet', label: 'Closet' },
  { value: 'dormitorio', label: 'Dormitório' },
  { value: 'sala', label: 'Sala de Estar / Jantar' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'lavabo', label: 'Lavabo' },
  { value: 'home_office', label: 'Home Office' },
  { value: 'gourmet', label: 'Espaço Gourmet / Varanda' },
  { value: 'area_servico', label: 'Área de Serviço' },
  { value: 'outro', label: 'Outro Ambiente' },
]

export const ESTILOS_PREFERIDOS_OPTIONS = [
  'Contemporâneo Minimalista',
  'Moderno Nobre',
  'Clássico Elegante',
  'Industrial Chic',
  'Escandinavo Aconchegante',
  'Rústico Sofisticado',
  'Neoclássico',
  'Orgânico / Biofílico',
  'Outro',
]

export const STATUS_BRIEFING_MAP: Record<string, { label: string; color: string; badge: string }> = {
  rascunho: {
    label: 'Rascunho',
    color: 'stone',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  enviado: {
    label: 'Enviado para Fila',
    color: 'blue',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  aprovado: {
    label: 'Aprovado',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  devolvido: {
    label: 'Devolvido',
    color: 'amber',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
}

export interface LiveScoreCalculationInput {
  cidadeObra?: string
  ambientes?: string[]
  prazoDesejado?: string
  faixaInvestimentoMin?: number | string | null
  faixaInvestimentoMax?: number | string | null
  ambientesDetalhados?: Array<{
    tipo: string
    descricao?: string
    medidasPreliminares?: string
    observacoesEspecificas?: string
  }>
  referenciasUrl?: string[]
  estiloPreferido?: string
  arquitetoNome?: string
  observacoes?: string
  scoreMinimo?: number
}

export function calcularScoreBriefingClient(dados: LiveScoreCalculationInput) {
  const detalhes: Record<string, boolean> = {}
  let pontosObtidos = 0
  const pontosFaltantes: string[] = []

  // 1. Cidade da obra (8 pts)
  detalhes.cidade_obra = Boolean(dados.cidadeObra && dados.cidadeObra.trim().length > 0)
  if (detalhes.cidade_obra) {
    pontosObtidos += 8
  } else {
    pontosFaltantes.push('Cidade da obra')
  }

  // 2. Ambientes (10 pts)
  const ambientes = Array.isArray(dados.ambientes) ? dados.ambientes : []
  detalhes.ambientes = ambientes.length > 0
  if (detalhes.ambientes) {
    pontosObtidos += 10
  } else {
    pontosFaltantes.push('Ambientes do projeto')
  }

  // 3. Prazo desejado (8 pts)
  detalhes.prazo_desejado = Boolean(dados.prazoDesejado && dados.prazoDesejado.trim().length > 0)
  if (detalhes.prazo_desejado) {
    pontosObtidos += 8
  } else {
    pontosFaltantes.push('Prazo desejado')
  }

  // 4. Faixa de investimento (14 pts)
  const temMin = dados.faixaInvestimentoMin !== null && dados.faixaInvestimentoMin !== undefined && dados.faixaInvestimentoMin !== ''
  const temMax = dados.faixaInvestimentoMax !== null && dados.faixaInvestimentoMax !== undefined && dados.faixaInvestimentoMax !== ''
  const temFaixa = Boolean(temMin && temMax)
  detalhes.faixa_investimento = temFaixa
  if (temFaixa) {
    pontosObtidos += 14
  } else {
    pontosFaltantes.push('Faixa de investimento (mín. e máx.)')
  }

  // 5. Ambientes detalhados (15 pts)
  const ambientesDet = Array.isArray(dados.ambientesDetalhados) ? dados.ambientesDetalhados : []
  detalhes.ambientes_detalhados = ambientesDet.length > 0
  if (detalhes.ambientes_detalhados) {
    pontosObtidos += 15
  } else {
    pontosFaltantes.push('Detalhamento dos ambientes')
  }

  // 6. Referências visuais (12 pts)
  const refs = Array.isArray(dados.referenciasUrl) ? dados.referenciasUrl.filter((r) => Boolean(r && r.trim())) : []
  detalhes.referencias_visuais = refs.length > 0
  if (detalhes.referencias_visuais) {
    pontosObtidos += 12
  } else {
    pontosFaltantes.push('Referências visuais')
  }

  // 7. Medidas preliminares (8 pts)
  const temMedidas = ambientesDet.some(
    (a) => a && a.medidasPreliminares && a.medidasPreliminares.trim().length > 0
  )
  detalhes.medidas_preliminares = temMedidas
  if (temMedidas) {
    pontosObtidos += 8
  }

  // 8. Estilo preferido (8 pts)
  detalhes.estilo_preferido = Boolean(dados.estiloPreferido && dados.estiloPreferido.trim().length > 0)
  if (detalhes.estilo_preferido) {
    pontosObtidos += 8
  }

  // 9. Arquiteto vinculado (7 pts)
  const temArquiteto = Boolean(dados.arquitetoNome && dados.arquitetoNome.trim().length > 0)
  detalhes.arquiteto_vinculado = temArquiteto
  if (temArquiteto) {
    pontosObtidos += 7
  }

  // 10. Observações (10 pts)
  const obs = (dados.observacoes || '').trim()
  detalhes.observacoes = obs.length >= 50
  if (detalhes.observacoes) {
    pontosObtidos += 10
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
