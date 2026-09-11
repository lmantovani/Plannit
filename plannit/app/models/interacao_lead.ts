import { InteracoesLeadSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lead from '#models/lead'

export type TipoInteracao = 'whatsapp' | 'ligacao' | 'email' | 'visita' | 'reuniao'

export default class InteracaoLead extends InteracoesLeadSchema {
  static table = 'interacoes_lead'

  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>

  @belongsTo(() => User, {
    foreignKey: 'responsavelId',
  })
  declare responsavel: BelongsTo<typeof User>
}
