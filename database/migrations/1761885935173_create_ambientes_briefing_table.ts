import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ambientes_briefing'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('briefing_id')
        .unsigned()
        .references('id')
        .inTable('briefings')
        .onDelete('CASCADE')
        .notNullable()

      table.string('tipo', 100).notNullable()
      table.text('descricao').nullable()
      table.string('medidas_preliminares', 200).nullable()
      table.text('observacoes_especificas').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['briefing_id'])
      table.index(['tipo'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
