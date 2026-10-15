import { EnderecosClienteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Cliente from '#models/cliente'

export enum TipoEndereco {
  MONTAGEM = 'montagem',
  ENTREGA = 'entrega',
  COBRANCA = 'cobranca',
  RESIDENCIAL = 'residencial',
  COMERCIAL = 'comercial',
}

export default class EnderecoCliente extends EnderecosClienteSchema {
  static table = 'enderecos_cliente'

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>
}