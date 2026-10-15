import { PerfisCatalogoSchema } from '#database/schema'

export default class PerfilCatalogo extends PerfisCatalogoSchema {
  static table = 'perfis_catalogo'

  static async listarTodos() {
    return this.query().orderBy('ordem', 'asc').orderBy('nome', 'asc')
  }

  static async listarAtivos() {
    return this.query().where('isActive', true).orderBy('ordem', 'asc').orderBy('nome', 'asc')
  }
}
