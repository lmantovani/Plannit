import { InteracoesArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'
import Lead from '#models/lead'

export enum TipoInteracaoArquiteto {
  LIGACAO = 'ligacao',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  VISITA_ESCRITORIO = 'visita_escritorio',
  VISITA_LOJA = 'visita_loja',
  REUNIAO = 'reuniao',
  EVENTO = 'evento',
  VIAGEM = 'viagem',
  ENVIO_BRINDE = 'envio_brinde',
}

export const TIPO_INTERACAO_ARQUITETO_LABELS: Record<TipoInteracaoArquiteto, string> = {
  [TipoInteracaoArquiteto.LIGACAO]: 'Ligação',
  [TipoInteracaoArquiteto.WHATSAPP]: 'WhatsApp',
  [TipoInteracaoArquiteto.EMAIL]: 'E-mail',
  [TipoInteracaoArquiteto.VISITA_ESCRITORIO]: 'Visita ao Escritório',
  [TipoInteracaoArquiteto.VISITA_LOJA]: 'Visita à Loja',
  [TipoInteracaoArquiteto.REUNIAO]: 'Reunião',
  [TipoInteracaoArquiteto.EVENTO]: 'Evento',
  [TipoInteracaoArquiteto.VIAGEM]: 'Viagem',
  [TipoInteracaoArquiteto.ENVIO_BRINDE]: 'Envio de Brinde',
}

export default class InteracaoArquiteto extends InteracoesArquitetoSchema {
  static table = 'interacoes_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'responsavelId' })
  declare responsavel: BelongsTo<typeof User>

  @belongsTo(() => Lead, { foreignKey: 'leadId' })
  declare lead: BelongsTo<typeof Lead>
}
