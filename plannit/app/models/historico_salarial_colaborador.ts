import { HistoricoSalarialColaboradoreSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Colaborador from '#models/colaborador'
import User from '#models/user'

export default class HistoricoSalarialColaborador extends HistoricoSalarialColaboradoreSchema {
  static table = 'historico_salarial_colaboradores'

  @belongsTo(() => Colaborador, { foreignKey: 'colaboradorId' })
  declare colaborador: BelongsTo<typeof Colaborador>

  @belongsTo(() => User, { foreignKey: 'registradoPorId' })
  declare registradoPor: BelongsTo<typeof User>
}
