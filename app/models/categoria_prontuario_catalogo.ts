import { CategoriasProntuarioCatalogoSchema } from '#database/schema'
import { scope } from '@adonisjs/lucid/orm'

export default class CategoriaProntuarioCatalogo extends CategoriasProntuarioCatalogoSchema {
  static table = 'categorias_prontuario_catalogo'

  static ativos = scope((query) => {
    query.where('isActive', true)
  })

  static ordenados = scope((query) => {
    query.orderBy('ordem', 'asc').orderBy('nome', 'asc')
  })
}

