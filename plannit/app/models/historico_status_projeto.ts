import { HistoricoStatusProjetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import User from '#models/user'

export default class HistoricoStatusProjeto extends HistoricoStatusProjetoSchema {
  static table = 'historico_status_projeto'

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @belongsTo(() => User, {
    foreignKey: 'alteradoPorId',
  })
  declare alteradoPor: BelongsTo<typeof User>
}
