import { HistoricoDonoArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'

export default class HistoricoDonoArquiteto extends HistoricoDonoArquitetoSchema {
  static table = 'historico_dono_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'consultorAnteriorId' })
  declare consultorAnterior: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'consultorNovoId' })
  declare consultorNovo: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'alteradoPorId' })
  declare alteradoPor: BelongsTo<typeof User>
}
