import { AmbientesBriefingSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Briefing from '#models/briefing'

export default class AmbienteBriefing extends AmbientesBriefingSchema {
  static table = 'ambientes_briefing'

  @belongsTo(() => Briefing, {
    foreignKey: 'briefingId',
  })
  declare briefing: BelongsTo<typeof Briefing>
}
