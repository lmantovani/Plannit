import { DepartamentoSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Cargo from '#models/cargo'
import Colaborador from '#models/colaborador'

export default class Departamento extends DepartamentoSchema {
  static table = 'departamentos'

  @hasMany(() => Cargo, { foreignKey: 'departamentoId' })
  declare cargos: HasMany<typeof Cargo>

  @hasMany(() => Colaborador, { foreignKey: 'departamentoId' })
  declare colaboradores: HasMany<typeof Colaborador>
}
