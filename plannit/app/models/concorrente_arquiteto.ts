import { ConcorrentesArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'

export default class ConcorrenteArquiteto extends ConcorrentesArquitetoSchema {
  static table = 'concorrentes_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'registradoPorId' })
  declare registradoPor: BelongsTo<typeof User>
}
