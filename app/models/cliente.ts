import { ClienteSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import EnderecoCliente from '#models/endereco_cliente'
import Projeto from '#models/projeto'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'

export enum TipoCliente {
  PESSOA_FISICA = 'pessoa_fisica',
  PESSOA_JURIDICA = 'pessoa_juridica',
}

export default class Cliente extends ClienteSchema {
  static table = 'clientes'

  @hasMany(() => EnderecoCliente, {
    foreignKey: 'clienteId',
  })
  declare enderecos: HasMany<typeof EnderecoCliente>

  @hasMany(() => Projeto, {
    foreignKey: 'clienteId',
  })
  declare projetos: HasMany<typeof Projeto>

  @belongsTo(() => Arquiteto, {
    foreignKey: 'arquitetoId',
  })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, {
    foreignKey: 'cadastroAprovadoPor',
  })
  declare aprovadoPor: BelongsTo<typeof User>
}