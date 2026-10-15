import { HistoricoStatusLeadSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Lead from '#models/lead'
import User from '#models/user'

export default class HistoricoStatusLead extends HistoricoStatusLeadSchema {
  static table = 'historico_status_leads'

  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => User, {
    foreignKey: 'alteradoPorId',
  })
  declare alteradoPor: BelongsTo<typeof User>
}