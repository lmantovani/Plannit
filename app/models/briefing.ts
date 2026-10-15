import { BriefingSchema } from '#database/schema'
import { belongsTo, hasMany, column } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import AmbienteBriefing from '#models/ambiente_briefing'

export enum StatusBriefing {
  RASCUNHO = 'rascunho',
  ENVIADO = 'enviado',
  APROVADO = 'aprovado',
  DEVOLVIDO = 'devolvido',
}

export const STATUS_BRIEFING_LABELS: Record<StatusBriefing, string> = {
  [StatusBriefing.RASCUNHO]: 'Rascunho',
  [StatusBriefing.ENVIADO]: 'Enviado para Fila',
  [StatusBriefing.APROVADO]: 'Aprovado',
  [StatusBriefing.DEVOLVIDO]: 'Devolvido',
}

const jsonPrepareConsume = {
  prepare: (value: any) => (value !== null && value !== undefined ? JSON.stringify(value) : null),
  consume: (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  },
}

export default class Briefing extends BriefingSchema {
  static table = 'briefings'

  @column(jsonPrepareConsume)
  declare ambientes: any | null

  @column(jsonPrepareConsume)
  declare referenciasUrl: any | null

  @column(jsonPrepareConsume)
  declare scoreDetalhes: any | null

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @hasMany(() => AmbienteBriefing, {
    foreignKey: 'briefingId',
  })
  declare ambientesDetalhados: HasMany<typeof AmbienteBriefing>
}
