import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'historico_status_projeto'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('CASCADE')
        .notNullable()

      table.string('status_de', 50).nullable()
      table.string('status_para', 50).notNullable()

      table
        .integer('alterado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.text('observacao').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['projeto_id'])
      table.index(['alterado_por_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
