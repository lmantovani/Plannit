import { CompromissosAgendumSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Lead from '#models/lead'
import Cliente from '#models/cliente'
import Projeto from '#models/projeto'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'

export enum StatusCompromisso {
  AGENDADO = 'agendado',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
  REAGENDADO = 'reagendado',
}

export const STATUS_COMPROMISSO_LABELS: Record<StatusCompromisso, string> = {
  [StatusCompromisso.AGENDADO]: 'Agendado',
  [StatusCompromisso.CONCLUIDO]: 'Concluído',
  [StatusCompromisso.CANCELADO]: 'Cancelado',
  [StatusCompromisso.REAGENDADO]: 'Reagendado',
}

export default class CompromissoAgenda extends CompromissosAgendumSchema {
  static table = 'compromissos_agenda'

  @column()
  declare status: StatusCompromisso

  @belongsTo(() => TipoCompromissoCatalogo, { foreignKey: 'tipoId' })
  declare tipo: BelongsTo<typeof TipoCompromissoCatalogo>

  @belongsTo(() => User, { foreignKey: 'responsavelId' })
  declare responsavel: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'criadoPorId' })
  declare criadoPor: BelongsTo<typeof User>

  @belongsTo(() => Lead, { foreignKey: 'leadId' })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => Cliente, { foreignKey: 'clienteId' })
  declare cliente: BelongsTo<typeof Cliente>

  @belongsTo(() => Projeto, { foreignKey: 'projetoId' })
  declare projeto: BelongsTo<typeof Projeto>

  get isAtrasado(): boolean {
    if (this.status !== StatusCompromisso.AGENDADO) return false
    return this.dataHoraFim < DateTime.now()
  }

  get isHoje(): boolean {
    return this.dataHoraInicio.hasSame(DateTime.now(), 'day')
  }

  get statusLabel(): string {
    return STATUS_COMPROMISSO_LABELS[this.status] || this.status
  }
}
