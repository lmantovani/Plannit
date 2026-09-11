import { HistoricoCargoColaboradoreSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Colaborador from '#models/colaborador'
import Cargo from '#models/cargo'
import User from '#models/user'

export default class HistoricoCargoColaborador extends HistoricoCargoColaboradoreSchema {
  static table = 'historico_cargo_colaboradores'

  @belongsTo(() => Colaborador, { foreignKey: 'colaboradorId' })
  declare colaborador: BelongsTo<typeof Colaborador>

  @belongsTo(() => Cargo, { foreignKey: 'cargoAnteriorId' })
  declare cargoAnterior: BelongsTo<typeof Cargo>

  @belongsTo(() => Cargo, { foreignKey: 'cargoNovoId' })
  declare cargoNovo: BelongsTo<typeof Cargo>

  @belongsTo(() => User, { foreignKey: 'aprovadoPorId' })
  declare aprovadoPor: BelongsTo<typeof User>
}
