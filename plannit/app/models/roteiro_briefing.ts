import { column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { RoteirosBriefingSchema } from '#database/schema'
import RoteiroBriefingAmbiente from '#models/roteiro_briefing_ambiente'

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

export default class RoteiroBriefing extends RoteirosBriefingSchema {
  static table = 'roteiros_briefings'

  @column(jsonPrepareConsume)
  declare secoes: any

  @hasMany(() => RoteiroBriefingAmbiente, { foreignKey: 'roteiroId' })
  declare ambientes: HasMany<typeof RoteiroBriefingAmbiente>

  static ativos = scope((query) => {
    query.where('is_active', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('titulo', 'asc')
  })
}
