import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leads'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Texto livre de quando a origem é "Outro", para analisar se vale criar uma nova origem no catálogo
      table.string('origem_descricao', 200).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('origem_descricao')
    })
  }
}
