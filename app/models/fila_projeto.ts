import { FilaProjetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import User from '#models/user'

export enum StatusFila {
  AGUARDANDO = 'aguardando',
  ALOCADO = 'alocado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export const STATUS_FILA_LABELS: Record<StatusFila, string> = {
  [StatusFila.AGUARDANDO]: 'Aguardando Alocação',
  [StatusFila.ALOCADO]: 'Alocado',
  [StatusFila.EM_ANDAMENTO]: 'Em Andamento',
  [StatusFila.CONCLUIDO]: 'Concluído',
  [StatusFila.CANCELADO]: 'Cancelado',
}

export default class FilaProjeto extends FilaProjetoSchema {
  static table = 'fila_projetos'

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @belongsTo(() => User, {
    foreignKey: 'projetistaId',
  })
  declare projetista: BelongsTo<typeof User>
}
