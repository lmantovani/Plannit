import { TiposCompromissoCatalogoSchema } from '#database/schema'
import { scope } from '@adonisjs/lucid/orm'

export default class TipoCompromissoCatalogo extends TiposCompromissoCatalogoSchema {
  static table = 'tipos_compromisso_catalogo'

  static ativos = scope((query) => {
    query.where('isActive', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('nome', 'asc')
  })
}
