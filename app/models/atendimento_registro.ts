import { AtendimentoRegistroSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lead from '#models/lead'
import Cliente from '#models/cliente'
import Arquiteto from '#models/arquiteto'

export enum TipoAtendimentoPorta {
  PORTA_NOVO = 'porta_novo',
  RETORNO_CARTEIRA = 'retorno_carteira',
  INDICACAO_ESPECIFICADOR = 'indicacao_especificador',
  AGENDADO = 'agendado',
  OUTRO = 'outro',
}

export const TIPO_ATENDIMENTO_LABELS: Record<string, string> = {
  [TipoAtendimentoPorta.PORTA_NOVO]: 'Cliente Novo (Porta / Showroom)',
  [TipoAtendimentoPorta.RETORNO_CARTEIRA]: 'Retorno de Carteira Própria',
  [TipoAtendimentoPorta.INDICACAO_ESPECIFICADOR]: 'Indicação de Especificador / Arquiteto',
  [TipoAtendimentoPorta.AGENDADO]: 'Atendimento Agendado',
  [TipoAtendimentoPorta.OUTRO]: 'Outro',
}

export enum MotivoPuloFila {
  CLIENTE_PROCUROU_VENDEDOR = 'cliente_procurou_vendedor',
  PARCEIRO_ESPECIFICADOR = 'parceiro_especificador',
  VENDEDOR_RECUSOU = 'vendedor_recusou',
  VENDEDOR_OCUPADO_BRIEFING = 'vendedor_ocupado_briefing',
  OUTRO = 'outro',
}

export const MOTIVO_PULO_LABELS: Record<string, string> = {
  [MotivoPuloFila.CLIENTE_PROCUROU_VENDEDOR]: 'Cliente já pertence à carteira / procurou este vendedor',
  [MotivoPuloFila.PARCEIRO_ESPECIFICADOR]: 'Cliente trazido por arquiteto/especificador do vendedor',
  [MotivoPuloFila.VENDEDOR_RECUSOU]: 'Vendedor da vez recusou o atendimento',
  [MotivoPuloFila.VENDEDOR_OCUPADO_BRIEFING]: 'Vendedor da vez ocupado com orçamento/briefing',
  [MotivoPuloFila.OUTRO]: 'Outro motivo',
}

export enum StatusAtendimentoRegistro {
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export const STATUS_ATENDIMENTO_LABELS: Record<string, string> = {
  [StatusAtendimentoRegistro.EM_ANDAMENTO]: 'Em Andamento',
  [StatusAtendimentoRegistro.CONCLUIDO]: 'Concluído',
  [StatusAtendimentoRegistro.CANCELADO]: 'Cancelado',
}

export enum DesfechoAtendimento {
  GEROU_ORCAMENTO = 'gerou_orcamento',
  GEROU_LEAD = 'gerou_lead',
  RETORNO_AGENDADO = 'retorno_agendado',
  NAO_EVOLUIU = 'nao_evoluiu',
  OUTRO = 'outro',
}

export const DESFECHO_ATENDIMENTO_LABELS: Record<string, string> = {
  [DesfechoAtendimento.GEROU_ORCAMENTO]: 'Gerou Orçamento / Projeto',
  [DesfechoAtendimento.GEROU_LEAD]: 'Cadastrado como Novo Lead no CRM',
  [DesfechoAtendimento.RETORNO_AGENDADO]: 'Retorno Agendado',
  [DesfechoAtendimento.NAO_EVOLUIU]: 'Atendimento Não Evoluiu',
  [DesfechoAtendimento.OUTRO]: 'Outro Desfecho',
}

export default class AtendimentoRegistro extends AtendimentoRegistroSchema {
  static table = 'atendimento_registros'

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'iniciadoPorId',
  })
  declare iniciadoPor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'vendedorPuladoId',
  })
  declare vendedorPulado: BelongsTo<typeof User>

  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>

  @belongsTo(() => Arquiteto, {
    foreignKey: 'arquitetoId',
  })
  declare arquiteto: BelongsTo<typeof Arquiteto>
}
