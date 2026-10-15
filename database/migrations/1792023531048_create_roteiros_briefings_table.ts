import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roteiros_briefings'
  protected ambientesTableName = 'roteiro_briefing_ambientes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('slug', 100).notNullable().unique()
      table.string('titulo', 150).notNullable()
      table.text('subtitulo').nullable()
      table.jsonb('secoes').notNullable().defaultTo('[]')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('ordem').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable(this.ambientesTableName, (table) => {
      table.increments('id').primary()
      table
        .integer('roteiro_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('CASCADE')
      table.string('ambiente_nome', 100).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.unique(['roteiro_id', 'ambiente_nome'])
      table.index(['ambiente_nome'])
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.ambientesTableName)
    this.schema.dropTableIfExists(this.tableName)
  }
}