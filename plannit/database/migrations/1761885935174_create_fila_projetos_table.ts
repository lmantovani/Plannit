import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fila_projetos'

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
        .unique()

      table
        .integer('projetista_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.integer('prioridade').notNullable().defaultTo(5)
      table.string('status', 30).notNullable().defaultTo('aguardando')
      table.timestamp('data_entrada_fila', { useTz: true }).notNullable()
      table.timestamp('data_alocacao', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projeto_id'])
      table.index(['projetista_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
