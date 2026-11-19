import { AtendimentoFilaVendedoreSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export enum StatusDisponibilidadeFila {
  DISPONIVEL = 'disponivel',
  EM_ATENDIMENTO = 'em_atendimento',
  OCUPADO_INTERNO = 'ocupado_interno',
  PAUSA = 'pausa',
  AUSENTE = 'ausente',
}

export const STATUS_DISPONIBILIDADE_LABELS: Record<string, string> = {
  [StatusDisponibilidadeFila.DISPONIVEL]: 'Disponível',
  [StatusDisponibilidadeFila.EM_ATENDIMENTO]: 'Em Atendimento',
  [StatusDisponibilidadeFila.OCUPADO_INTERNO]: 'Ocupado (Orçamento/Projeto)',
  [StatusDisponibilidadeFila.PAUSA]: 'Em Pausa / Intervalo',
  [StatusDisponibilidadeFila.AUSENTE]: 'Ausente',
}

export default class AtendimentoFilaVendedor extends AtendimentoFilaVendedoreSchema {
  static table = 'atendimento_fila_vendedores'

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'adicionadoPorId',
  })
  declare adicionadoPor: BelongsTo<typeof User>
}
