import { DecisoresArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'

export default class DecisorArquiteto extends DecisoresArquitetoSchema {
  static table = 'decisores_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>
}
