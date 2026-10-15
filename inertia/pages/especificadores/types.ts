export type TipoEspecificador =
  | 'arquiteto'
  | 'designer_interiores'
  | 'decorador'
  | 'engenheiro'
  | 'corretor'
  | 'outro'

export type NivelParceria = 'parceiro' | 'premium' | 'vip'

export type StatusCarteira = 'ativo' | 'em_prospeccao' | 'inativo'

export type SegmentoEspecificador =
  | 'inativo'
  | 'novo_promissor'
  | 'em_risco'
  | 'campeao'
  | 'parceiro_fiel'
  | 'em_ascensao'
  | 'ocasional'

export type FlagEspecificador =
  | 'top_indicador'
  | 'em_risco_de_perda'
  | 'alto_potencial'
  | 'indicacao_alto_valor'
  | 'especificador_esfriando'

export type TipoInteracao =
  | 'ligacao'
  | 'whatsapp'
  | 'email'
  | 'visita_escritorio'
  | 'visita_loja'
  | 'reuniao'
  | 'evento'
  | 'viagem'
  | 'envio_brinde'

export type NivelConcorrencia = 'baixo' | 'medio' | 'alto'

export interface ConsultorOption {
  id: number
  nome: string
  email: string
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

export interface ScoreConcorrenciaItem {
  id: number
  nomeConcorrente: string
  percentualFechamentoEstimado: number
}

export interface ScoreConcorrencia {
  nivel: NivelConcorrencia
  risco: number
  concorrentes: ScoreConcorrenciaItem[]
}

export interface ArquitetoScore {
  rfv: number
  potencial: number
  lealdade: number
  scoreGeral: number
  segmento: SegmentoEspecificador
  flags: FlagEspecificador[]
  detalhes: ScoreDetalhes
  concorrencia: ScoreConcorrencia
}

export interface DecisorItem {
  id: number
  arquitetoId: number
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  observacoes: string | null
  isPrincipal: boolean
  createdAt: string | null
}

export interface ConcorrenteItem {
  id: number
  arquitetoId: number
  nomeConcorrente: string
  percentualFechamentoEstimado: number
  observacoes: string | null
  registradoPor: { id: number; nome: string } | null
}

export interface HistoricoDonoItem {
  id: number
  arquitetoId: number
  consultorAnteriorId: number | null
  consultorNovoId: number
  alteradoPorId: number
  motivo: string | null
  createdAt: string | null
  consultorAnterior: { id: number; nome: string } | null
  consultorNovo: { id: number; nome: string } | null
  alteradoPor: { id: number; nome: string } | null
}

export interface InteracaoItem {
  id: number
  arquitetoId: number
  responsavelId: number
  tipo: TipoInteracao
  resumo: string
  leadId: number | null
  data: string | null
  createdAt: string | null
  responsavel: { id: number; nome: string } | null
  lead: { id: number; nome: string } | null
}

export interface EspecificadorListItem {
  id: number
  nome: string
  escritorio: string | null
  enderecoEscritorio: string | null
  telefone: string | null
  email: string | null
  nivelParceria: NivelParceria
  tipo: TipoEspecificador
  especialidade: string | null
  consultorId: number | null
  statusCarteira: StatusCarteira
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  consultor: ConsultorOption | null
  score: ArquitetoScore
}

export interface EspecificadorDetalhado extends EspecificadorListItem {
  decisores: DecisorItem[]
  concorrentes: ConcorrenteItem[]
  historicoDono: HistoricoDonoItem[]
  interacoes: InteracaoItem[]
}

export interface KpisCarteira {
  especificadoresAtivos: number
  pctVendaMes: number
  pctVendaAno: number
  atendimentosMes: number
  visitasEscritorioMes: number
}

export interface MinhaMetaVisitas {
  consultorId: number
  metaVisitasMes: number
  visitasRealizadasMes: number
  percentualAtingido: number
}

export interface MetaConsultorItem {
  id: number
  consultorId: number
  metaVisitasMes: number
  visitasRealizadasMes: number
  percentualAtingido: number
  consultor: ConsultorOption
  configuradoPor: { id: number; nome: string } | null
}

export interface EspecificadoresIndexProps {
  especificadores: EspecificadorListItem[]
  kpis: KpisCarteira
  minhaMeta: MinhaMetaVisitas | null
  consultores: ConsultorOption[]
  filtros: {
    busca: string
    tipo: string
    statusCarteira: string
    consultorId: string
  }
}

export interface EspecificadoresShowProps {
  arquiteto: EspecificadorDetalhado
  score: ArquitetoScore
}
