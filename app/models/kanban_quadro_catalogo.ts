import { KanbanQuadrosCatalogoSchema } from '#database/schema'
import { hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import KanbanEtapaCatalogo from '#models/kanban_etapa_catalogo'

export default class KanbanQuadroCatalogo extends KanbanQuadrosCatalogoSchema {
  static table = 'kanban_quadros_catalogo'

  @hasMany(() => KanbanEtapaCatalogo, {
    foreignKey: 'quadroId',
  })
  declare etapas: HasMany<typeof KanbanEtapaCatalogo>

  static ativos = scope((query) => {
    query.where('isActive', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('nome', 'asc')
  })
}

