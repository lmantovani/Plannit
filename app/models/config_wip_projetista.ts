import { ConfigWipProjetistaSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class ConfigWipProjetista extends ConfigWipProjetistaSchema {
  static table = 'config_wip_projetistas'

  @belongsTo(() => User, {
    foreignKey: 'projetistaId',
  })
  declare projetista: BelongsTo<typeof User>
}
