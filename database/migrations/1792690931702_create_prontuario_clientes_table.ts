import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'prontuario_clientes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('cliente_id')
        .unsigned()
        .references('id')
        .inTable('clientes')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('autor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
        .nullable()
      table.string('categoria', 50).notNullable().defaultTo('pessoal')
      table.string('titulo', 150).nullable()
      table.text('descricao').notNullable()
      table.boolean('importante').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}