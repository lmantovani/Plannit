import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'config_wip_projetistas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('projetista_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      table.integer('wip_limit').notNullable().defaultTo(3)
      table.boolean('ativo').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projetista_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
