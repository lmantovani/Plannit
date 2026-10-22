import { KanbanEtapasCatalogoSchema } from '#database/schema'
import { belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import KanbanQuadroCatalogo from '#models/kanban_quadro_catalogo'

export type TipoEstagioKanban = 'aberta' | 'ganho' | 'perdido' | 'desqualificado'

export default class KanbanEtapaCatalogo extends KanbanEtapasCatalogoSchema {
  static table = 'kanban_etapas_catalogo'

  @belongsTo(() => KanbanQuadroCatalogo, {
    foreignKey: 'quadroId',
  })
  declare quadro: BelongsTo<typeof KanbanQuadroCatalogo>

  static ativos = scope((query) => {
    query.where('isActive', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('nome', 'asc')
  })
}

