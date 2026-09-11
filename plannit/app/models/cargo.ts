import { CargoSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Departamento from '#models/departamento'
import Colaborador from '#models/colaborador'

export default class Cargo extends CargoSchema {
  static table = 'cargos'

  @belongsTo(() => Departamento, { foreignKey: 'departamentoId' })
  declare departamento: BelongsTo<typeof Departamento>

  @hasMany(() => Colaborador, { foreignKey: 'cargoId' })
  declare colaboradores: HasMany<typeof Colaborador>
}
