import { ParcelaSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Fechamento from '#models/fechamento'

export enum StatusParcela {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  VENCIDO = 'vencido',
  CANCELADO = 'cancelado',
}

export const STATUS_PARCELA_LABELS: Record<StatusParcela, string> = {
  [StatusParcela.PENDENTE]: 'Pendente',
  [StatusParcela.PAGO]: 'Pago',
  [StatusParcela.VENCIDO]: 'Vencido',
  [StatusParcela.CANCELADO]: 'Cancelado',
}

export default class Parcela extends ParcelaSchema {
  static table = 'parcelas'

  @belongsTo(() => Fechamento, {
    foreignKey: 'fechamentoId',
  })
  declare fechamento: BelongsTo<typeof Fechamento>
}
