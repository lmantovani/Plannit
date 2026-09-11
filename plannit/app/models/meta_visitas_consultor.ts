import { MetasVisitasConsultorSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class MetaVisitasConsultor extends MetasVisitasConsultorSchema {
  static table = 'metas_visitas_consultor'

  @belongsTo(() => User, { foreignKey: 'consultorId' })
  declare consultor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'configuradoPorId' })
  declare configuradoPor: BelongsTo<typeof User>
}
