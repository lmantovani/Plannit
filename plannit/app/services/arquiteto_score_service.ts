import { DateTime } from 'luxon'
import Arquiteto from '#models/arquiteto'
import Projeto, { StatusProjeto } from '#models/projeto'
import Lead, { StatusFunil } from '#models/lead'
import ConcorrenteArquiteto from '#models/concorrente_arquiteto'
import InteracaoArquiteto from '#models/interacao_arquiteto'
import MetaVisitasConsultor from '#models/meta_visitas_consultor'

export type SegmentoComportamental =
  | 'inativo'
  | 'novo_promissor'
  | 'em_risco'
  | 'campeao'
  | 'parceiro_fiel'
  | 'em_ascensao'
  | 'ocasional'

export type FlagAtiva =
  | 'top_indicador'
  | 'em_risco_de_perda'
  | 'alto_potencial'
  | 'indicacao_alto_valor'
  | 'especificador_esfriando'

export type NivelConcorrencia = 'baixo' | 'medio' | 'alto'

export const SEGMENTO_LABELS: Record<SegmentoComportamental, string> = {
  inativo: 'Inativo',
  novo_promissor: 'Novo Promissor',
  em_risco: 'Em Risco',
  campeao: 'Campeão',
  parceiro_fiel: 'Parceiro Fiel',
  em_ascensao: 'Em Ascensão',
  ocasional: 'Ocasional',
}

export const FLAG_LABELS: Record<FlagAtiva, string> = {
  top_indicador: 'Top Indicador',
  em_risco_de_perda: 'Em Risco de Perda',
  alto_potencial: 'Alto Potencial',
  indicacao_alto_valor: 'Indicação de Alto Valor',
  especificador_esfriando: 'Especificador Esfriando',
}

export interface ScoreDetalhes {
  recencia: number
  frequencia: number
  valor: number
  diasDesdeUltimoProjeto: number | null
  projetos12Meses: number
  somaValorContratos12Meses: number
  leadsAtivos: number
  projetosAtivos: number
  tempoParceria: number
  consistencia: number
  taxaConversao: number
  mesesDesdeCadastro: number
}

export interface ConcorrenteInfo {
  id: number
  nomeConcorrente: string
  percentualFechamentoEstimado: number
}

export interface ConcorrenciaResultado {
  risco: number
  nivel: NivelConcorrencia
  concorrentes: ConcorrenteInfo[]
}

export interface ArquitetoScoreResult {
  rfv: number
  potencial: number
  lealdade: number
  scoreGeral: number
  segmento: SegmentoComportamental
  flags: FlagAtiva[]
  detalhes: ScoreDetalhes
  concorrencia: ConcorrenciaResultado
}

export interface KpisCarteiraResult {
  especificadoresAtivos: number
  pctVendaMes: number
  pctVendaAno: number
  atendimentosMes: number
  visitasEscritorioMes: number
}

export interface MetaVisitasResult {
  metaVisitasMes: number
  visitasRealizadasMes: number
  percentualAtingido: number
}

// -------------------------------------------------------------
// Funções Matemáticas Puras (Determinísticas e Testáveis)
// -------------------------------------------------------------

export function pontuarRecencia(dias: number | null | undefined): number {
  if (dias === null || dias === undefined) return 0
  if (dias <= 30) return 100
  if (dias <= 90) return 70
  if (dias <= 180) return 40
  if (dias <= 365) return 20
  return 5
}

export function pontuarFrequencia(qtd: number): number {
  if (qtd <= 0) return 0
  if (qtd === 1) return 30
  if (qtd <= 3) return 60
  if (qtd <= 6) return 85
  return 100
}

export function pontuarValor(soma: number | null | undefined): number {
  if (!soma || soma <= 0) return 0
  if (soma < 50_000) return 30
  if (soma < 150_000) return 55
  if (soma < 350_000) return 75
  if (soma < 700_000) return 90
  return 100
}

export function calcularRFV(recencia: number, frequencia: number, valor: number): number {
  return Number(((recencia + frequencia + valor) / 3).toFixed(1))
}

export function pontuarPotencial(qtdAtivos: number): number {
  if (qtdAtivos <= 0) return 0
  if (qtdAtivos === 1) return 40
  if (qtdAtivos <= 3) return 65
  if (qtdAtivos <= 6) return 85
  return 100
}

export function pontuarTempoParceria(meses: number): number {
  if (meses < 3) return 20
  if (meses < 12) return 50
  if (meses < 24) return 75
  return 100
}

export function pontuarConsistencia(mesesComProjeto: number): number {
  const capado = Math.max(0, Math.min(12, mesesComProjeto))
  return Number(((capado / 12) * 100).toFixed(1))
}

export function pontuarTaxaConversao(fechados: number, perdidos: number, desqualificados: number): number {
  const total = fechados + perdidos + desqualificados
  if (total === 0) return 50.0
  return Number(((fechados / total) * 100).toFixed(1))
}

export function calcularLealdade(tempo: number, consistencia: number, conversao: number): number {
  return Number(((tempo + consistencia + conversao) / 3).toFixed(1))
}

export function calcularScoreGeral(rfv: number, potencial: number, lealdade: number): number {
  return Number(((rfv + potencial + lealdade) / 3).toFixed(1))
}

export function mesesEntre(inicio: DateTime | null | undefined, fim: DateTime): number {
  if (!inicio) return 0
  let meses = (fim.year - inicio.year) * 12 + (fim.month - inicio.month)
  if (fim.day < inicio.day) {
    meses -= 1
  }
  return Math.max(0, meses)
}

export function contarMesesDistintos(datas: (DateTime | null | undefined)[]): number {
  const chaves = new Set<string>()
  for (const d of datas) {
    if (d) {
      chaves.add(`${d.year}-${d.month}`)
    }
  }
  return chaves.size
}

export function determinarSegmento(params: {
  temHistorico: boolean
  diasDesdeCadastro: number
  emRisco: boolean
  scoreGeral: number
  rfv: number
  potencial: number
  lealdade: number
}): SegmentoComportamental {
  // Cascata estrita: a primeira condição verdadeira determina o segmento
  if (!params.temHistorico) return 'inativo'
  if (params.diasDesdeCadastro < 90) return 'novo_promissor'
  if (params.emRisco) return 'em_risco'
  if (params.scoreGeral >= 85) return 'campeao'
  if (params.lealdade >= 75 && params.rfv >= 50) return 'parceiro_fiel'
  if (params.potencial >= 70) return 'em_ascensao'
  return 'ocasional'
}

export function determinarFlags(params: {
  scoreGeral: number
  potencial: number
  valorPontos: number
  emRisco: boolean
  temDono?: boolean
  diasDesdeUltimaInteracao?: number | null
}): FlagAtiva[] {
  const flags: FlagAtiva[] = []
  if (params.scoreGeral >= 85) flags.push('top_indicador')
  if (params.emRisco) flags.push('em_risco_de_perda')
  if (params.potencial >= 70) flags.push('alto_potencial')
  if (params.valorPontos >= 90) flags.push('indicacao_alto_valor')
  if (
    params.emRisco &&
    params.temDono &&
    (params.diasDesdeUltimaInteracao === null ||
      params.diasDesdeUltimaInteracao === undefined ||
      params.diasDesdeUltimaInteracao > 30)
  ) {
    flags.push('especificador_esfriando')
  }
  return flags
}

export function calcularRiscoConcorrencia(percentuais: number[]): { risco: number; nivel: NivelConcorrencia } {
  const maior = percentuais.length > 0 ? Math.max(...percentuais) : 0
  let nivel: NivelConcorrencia = 'baixo'
  if (maior >= 30 && maior <= 60) {
    nivel = 'medio'
  } else if (maior > 60) {
    nivel = 'alto'
  }
  return { risco: Number(maior.toFixed(1)), nivel }
}

// -------------------------------------------------------------
// Funções de Consulta e Integração com Banco de Dados
// -------------------------------------------------------------

const LEADS_STATUS_TERMINAL = [
  StatusFunil.FECHADO,
  StatusFunil.PERDIDO,
  StatusFunil.DESQUALIFICADO,
]

const PROJETOS_STATUS_ENCERRADO = [
  StatusProjeto.CONCLUIDO,
  StatusProjeto.CANCELADO,
]

/**
 * Calcula sob demanda o Score Multidimensional de um especificador a partir do banco de dados.
 */
export async function calcularScoreArquiteto(
  arquitetoOuId: number | Arquiteto
): Promise<ArquitetoScoreResult> {
  const arquiteto =
    typeof arquitetoOuId === 'number'
      ? await Arquiteto.findOrFail(arquitetoOuId)
      : arquitetoOuId

  const agora = DateTime.now().toUTC()
  const limite12Meses = agora.minus({ days: 365 })

  // 1. Projetos não arquivados e não cancelados vinculados
  const rawProjetos = await Projeto.query()
    .where('arquiteto_id', arquiteto.id)
    .where('arquivado', false)
    .whereNot('status', StatusProjeto.CANCELADO)
    .orderBy('created_at', 'desc')

  const projetos = rawProjetos.filter(
    (p) => p.status !== StatusProjeto.CANCELADO && p.status !== 'cancelado'
  )

  // 2. Leads vinculados
  const leads = await Lead.query()
    .where('arquiteto_id', arquiteto.id)
    .orderBy('created_at', 'desc')

  // 3. Concorrentes cadastrados
  const concorrentes = await ConcorrenteArquiteto.query()
    .where('arquiteto_id', arquiteto.id)

  // 4. Interações registradas
  const interacoes = await InteracaoArquiteto.query()
    .where('arquiteto_id', arquiteto.id)
    .orderBy('data', 'desc')

  // Datas de projetos e recência
  const datasProjetos = projetos.map((p) => p.createdAt).filter(Boolean) as DateTime[]
  const ultimoProjetoEm = datasProjetos.length > 0 ? DateTime.max(...datasProjetos) : null
  const diasDesdeUltimoProjeto = ultimoProjetoEm
    ? Math.max(0, Math.floor(agora.diff(ultimoProjetoEm, 'days').days))
    : null

  // Projetos dos últimos 12 meses
  const projetos12m = projetos.filter((p) => p.createdAt && p.createdAt >= limite12Meses)
  const somaValor = projetos12m.reduce((acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0), 0)

  // Última atividade (maior data entre projetos e leads)
  const datasLeads = leads.map((l) => l.createdAt).filter(Boolean) as DateTime[]
  const candidatosAtividade = [...datasProjetos, ...datasLeads]
  const ultimaAtividadeEm = candidatosAtividade.length > 0 ? DateTime.max(...candidatosAtividade) : null
  const diasDesdeUltimaAtividade = ultimaAtividadeEm
    ? Math.max(0, Math.floor(agora.diff(ultimaAtividadeEm, 'days').days))
    : null

  // Última interação
  const datasInteracoes = interacoes.map((i) => i.data).filter(Boolean) as DateTime[]
  const ultimaInteracaoEm = datasInteracoes.length > 0 ? DateTime.max(...datasInteracoes) : null
  const diasDesdeUltimaInteracao = ultimaInteracaoEm
    ? Math.max(0, Math.floor(agora.diff(ultimaInteracaoEm, 'days').days))
    : null

  // Pilar 1: RFV
  const recencia = pontuarRecencia(diasDesdeUltimoProjeto)
  const frequencia = pontuarFrequencia(projetos12m.length)
  const valor = pontuarValor(somaValor)
  const rfv = calcularRFV(recencia, frequencia, valor)

  // Pilar 2: Potencial
  const leadsAtivos = leads.filter(
    (l) => !LEADS_STATUS_TERMINAL.includes(l.statusFunil as StatusFunil)
  )
  const projetosAtivos = projetos.filter(
    (p) => !PROJETOS_STATUS_ENCERRADO.includes(p.status as StatusProjeto)
  )
  const potencial = pontuarPotencial(leadsAtivos.length + projetosAtivos.length)

  // Pilar 3: Lealdade
  const mesesDesdeCadastro = mesesEntre(arquiteto.createdAt, agora)
  const tempoParceria = pontuarTempoParceria(mesesDesdeCadastro)
  const mesesComProjeto = contarMesesDistintos(projetos12m.map((p) => p.createdAt))
  const consistencia = pontuarConsistencia(mesesComProjeto)

  const leadsFechados = leads.filter((l) => l.statusFunil === StatusFunil.FECHADO).length
  const leadsPerdidos = leads.filter((l) => l.statusFunil === StatusFunil.PERDIDO).length
  const leadsDesqualificados = leads.filter(
    (l) => l.statusFunil === StatusFunil.DESQUALIFICADO
  ).length
  const taxaConversao = pontuarTaxaConversao(leadsFechados, leadsPerdidos, leadsDesqualificados)
  const lealdade = calcularLealdade(tempoParceria, consistencia, taxaConversao)

  // Score Geral
  const scoreGeral = calcularScoreGeral(rfv, potencial, lealdade)

  // Em risco: já teve projetos no histórico mas está há >180 dias sem projeto e sem lead
  const frequenciaAllTime = projetos.length
  const emRisco =
    frequenciaAllTime > 0 &&
    (diasDesdeUltimaAtividade === null || diasDesdeUltimaAtividade > 180)

  const temHistorico = projetos.length > 0 || leads.length > 0
  const diasDesdeCadastro = arquiteto.createdAt
    ? Math.max(0, Math.floor(agora.diff(arquiteto.createdAt, 'days').days))
    : 0

  const segmento = determinarSegmento({
    temHistorico,
    diasDesdeCadastro,
    emRisco,
    scoreGeral,
    rfv,
    potencial,
    lealdade,
  })

  const flags = determinarFlags({
    scoreGeral,
    potencial,
    valorPontos: valor,
    emRisco,
    temDono: arquiteto.consultorId !== null && arquiteto.consultorId !== undefined,
    diasDesdeUltimaInteracao,
  })

  const percentuaisConcorrentes = concorrentes.map((c) =>
    Number(c.percentualFechamentoEstimado) || 0
  )
  const riscoConcorrencia = calcularRiscoConcorrencia(percentuaisConcorrentes)

  const concorrencia: ConcorrenciaResultado = {
    risco: riscoConcorrencia.risco,
    nivel: riscoConcorrencia.nivel,
    concorrentes: concorrentes.map((c) => ({
      id: c.id,
      nomeConcorrente: c.nomeConcorrente,
      percentualFechamentoEstimado: Number(c.percentualFechamentoEstimado) || 0,
    })),
  }

  const detalhes: ScoreDetalhes = {
    recencia,
    frequencia,
    valor,
    diasDesdeUltimoProjeto,
    projetos12Meses: projetos12m.length,
    somaValorContratos12Meses: Number(somaValor.toFixed(2)),
    leadsAtivos: leadsAtivos.length,
    projetosAtivos: projetosAtivos.length,
    tempoParceria,
    consistencia,
    taxaConversao,
    mesesDesdeCadastro,
  }

  return {
    rfv,
    potencial,
    lealdade,
    scoreGeral,
    segmento,
    flags,
    detalhes,
    concorrencia,
  }
}

/**
 * Calcula os KPIs analíticos agregados da carteira de especificadores.
 */
export async function calcularKpisCarteira(consultorId?: number): Promise<KpisCarteiraResult> {
  const agora = DateTime.now().toUTC()
  const inicioMes = agora.startOf('month')
  const fimMes = agora.endOf('month')
  const inicioAno = agora.startOf('year')
  const fimAno = agora.endOf('year')

  // 1. Total de especificadores ativos
  const queryAtivos = Arquiteto.query().where('is_active', true)
  if (consultorId) {
    queryAtivos.where('consultor_id', consultorId)
  }
  const ativos = await queryAtivos
  const especificadoresAtivos = ativos.length

  // 2. Vendas do mês (projetos concluídos ou fechados no mês com arquiteto vs total)
  // Calculado a partir de projetos com valorContrato > 0 criados/fechados no mês
  const queryProjetosMes = Projeto.query()
    .where('arquivado', false)
    .where('created_at', '>=', inicioMes.toSQL()!)
    .where('created_at', '<=', fimMes.toSQL()!)
  if (consultorId) {
    queryProjetosMes.where('vendedor_id', consultorId)
  }
  const projetosMes = await queryProjetosMes

  const valorTotalMes = projetosMes.reduce(
    (acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0),
    0
  )
  const valorEspecificadorMes = projetosMes
    .filter((p) => p.arquitetoId !== null && p.arquitetoId !== undefined)
    .reduce((acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0), 0)

  const pctVendaMes =
    valorTotalMes > 0
      ? Number(((valorEspecificadorMes / valorTotalMes) * 100).toFixed(1))
      : 0.0

  // 3. Vendas do ano
  const queryProjetosAno = Projeto.query()
    .where('arquivado', false)
    .where('created_at', '>=', inicioAno.toSQL()!)
    .where('created_at', '<=', fimAno.toSQL()!)
  if (consultorId) {
    queryProjetosAno.where('vendedor_id', consultorId)
  }
  const projetosAno = await queryProjetosAno

  const valorTotalAno = projetosAno.reduce(
    (acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0),
    0
  )
  const valorEspecificadorAno = projetosAno
    .filter((p) => p.arquitetoId !== null && p.arquitetoId !== undefined)
    .reduce((acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0), 0)

  const pctVendaAno =
    valorTotalAno > 0
      ? Number(((valorEspecificadorAno / valorTotalAno) * 100).toFixed(1))
      : 0.0

  // 4. Atendimentos e Visitas ao Escritório no mês atual
  const queryInteracoesMes = InteracaoArquiteto.query()
    .where('data', '>=', inicioMes.toSQL()!)
    .where('data', '<=', fimMes.toSQL()!)
  if (consultorId) {
    queryInteracoesMes.where('responsavel_id', consultorId)
  }
  const interacoesMes = await queryInteracoesMes

  const visitasEscritorioMes = interacoesMes.filter(
    (i) => i.tipo === 'visita_escritorio'
  ).length

  const atendimentosMes = interacoesMes.filter(
    (i) => i.tipo !== 'visita_escritorio'
  ).length

  return {
    especificadoresAtivos,
    pctVendaMes,
    pctVendaAno,
    atendimentosMes,
    visitasEscritorioMes,
  }
}

/**
 * Retorna a meta de visitas mensais e o progresso do consultor no mês corrente.
 */
export async function obterMetaVisitasConsultor(consultorId: number): Promise<MetaVisitasResult> {
  const agora = DateTime.now().toUTC()
  const inicioMes = agora.startOf('month')
  const fimMes = agora.endOf('month')

  const metaRegistro = await MetaVisitasConsultor.query()
    .where('consultor_id', consultorId)
    .first()

  const metaVisitasMes = metaRegistro ? metaRegistro.metaVisitasMes : 0

  const visitasRealizadas = await InteracaoArquiteto.query()
    .where('responsavel_id', consultorId)
    .where('tipo', 'visita_escritorio')
    .where('data', '>=', inicioMes.toSQL()!)
    .where('data', '<=', fimMes.toSQL()!)

  const visitasRealizadasMes = visitasRealizadas.length
  const percentualAtingido =
    metaVisitasMes > 0
      ? Math.round((visitasRealizadasMes / metaVisitasMes) * 100)
      : 0

  return {
    metaVisitasMes,
    visitasRealizadasMes,
    percentualAtingido,
  }
}
