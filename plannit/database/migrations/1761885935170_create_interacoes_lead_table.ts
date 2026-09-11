import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'interacoes_lead'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('responsavel_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table.string('tipo', 50).notNullable()
      table.text('resumo').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['lead_id'])
      table.index(['responsavel_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
