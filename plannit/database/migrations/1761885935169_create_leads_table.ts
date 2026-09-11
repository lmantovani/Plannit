import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nome', 200).notNullable()
      table.string('telefone', 30).notNullable()
      table.string('email', 254).nullable()
      table.string('cidade', 100).nullable()
      table.string('estado', 2).nullable()

      table.string('origem', 50).notNullable().defaultTo('outro')
      table.string('campanha', 200).nullable()
      table.string('status_funil', 50).notNullable().defaultTo('novo_lead')

      table
        .integer('vendedor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.integer('arquiteto_id').unsigned().nullable()

      table.boolean('qualificado').notNullable().defaultTo(false)
      table.text('motivo_perda').nullable()
      table.string('concorrente_perdido', 200).nullable()

      table.boolean('convertido_em_cliente').notNullable().defaultTo(false)
      table.integer('cliente_id').unsigned().nullable()

      table.timestamp('ultima_interacao_em', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['vendedor_id'])
      table.index(['status_funil'])
      table.index(['origem'])
      table.index(['convertido_em_cliente'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
