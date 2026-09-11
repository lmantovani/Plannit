import { FechamentoSchema } from '#database/schema'
import { belongsTo, hasMany, column } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import Parcela from '#models/parcela'
import User from '#models/user'

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

export default class Fechamento extends FechamentoSchema {
  static table = 'fechamentos'

  @column(jsonPrepareConsume)
  declare checklistJson: any | null

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @hasMany(() => Parcela, {
    foreignKey: 'fechamentoId',
  })
  declare parcelas: HasMany<typeof Parcela>

  @belongsTo(() => User, {
    foreignKey: 'cadastroAprovadoPorId',
  })
  declare cadastroAprovadoPor: BelongsTo<typeof User>
}
