import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { RoteiroBriefingAmbienteSchema } from '#database/schema'
import RoteiroBriefing from '#models/roteiro_briefing'

export default class RoteiroBriefingAmbiente extends RoteiroBriefingAmbienteSchema {
  static table = 'roteiro_briefing_ambientes'

  @belongsTo(() => RoteiroBriefing, { foreignKey: 'roteiroId' })
  declare roteiro: BelongsTo<typeof RoteiroBriefing>
}
