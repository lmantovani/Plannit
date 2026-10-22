import { ProntuarioClienteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Cliente from '#models/cliente'
import User from '#models/user'
import Lead from '#models/lead'

export const CATEGORIAS_PRONTUARIO = [
  { slug: 'pessoal', label: 'Pessoal & Hábitos' },
  { slug: 'familia', label: 'Família & Filhos' },
  { slug: 'pet', label: 'Pets & Animais' },
  { slug: 'hobby', label: 'Hobbies & Lazer' },
  { slug: 'preferencia', label: 'Preferências & Estilo' },
  { slug: 'atendimento', label: 'Atendimento & CRM' },
] as const

export default class ProntuarioCliente extends ProntuarioClienteSchema {
  static table = 'prontuario_clientes'

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>

  @belongsTo(() => User, {
    foreignKey: 'autorId',
  })
  declare autor: BelongsTo<typeof User>

  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>
}

