import { AtendimentoHistoricoEventoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import AtendimentoRegistro from '#models/atendimento_registro'

export enum TipoEventoFila {
  CHEGADA_FILA = 'chegada_fila',
  MUDANCA_STATUS = 'mudanca_status',
  INICIO_ATENDIMENTO = 'inicio_atendimento',
  PULO_DE_VEZ = 'pulo_de_vez',
  CONCLUSAO_ATENDIMENTO = 'conclusao_atendimento',
  REORDENACAO_MANUAL = 'reordenacao_manual',
  REMOCAO_FILA = 'remocao_fila',
}

export const TIPO_EVENTO_FILA_LABELS: Record<string, string> = {
  [TipoEventoFila.CHEGADA_FILA]: 'Entrada na Fila',
  [TipoEventoFila.MUDANCA_STATUS]: 'Alteração de Disponibilidade',
  [TipoEventoFila.INICIO_ATENDIMENTO]: 'Início de Atendimento',
  [TipoEventoFila.PULO_DE_VEZ]: 'Pulo de Vez Registrado',
  [TipoEventoFila.CONCLUSAO_ATENDIMENTO]: 'Conclusão / Fim da Fila',
  [TipoEventoFila.REORDENACAO_MANUAL]: 'Reordenação Manual da Fila',
  [TipoEventoFila.REMOCAO_FILA]: 'Saída da Fila',
}

export default class AtendimentoHistoricoEvento extends AtendimentoHistoricoEventoSchema {
  static table = 'atendimento_historico_eventos'

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'executadoPorId',
  })
  declare executadoPor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'vendedorPuladoId',
  })
  declare vendedorPulado: BelongsTo<typeof User>

  @belongsTo(() => AtendimentoRegistro, {
    foreignKey: 'atendimentoRegistroId',
  })
  declare atendimentoRegistro: BelongsTo<typeof AtendimentoRegistro>
}
