import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('departamentos', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 150).notNullable().unique()
      table.boolean('ativo').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('cargos', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 150).notNullable()
      table
        .integer('departamento_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('departamentos')
        .onDelete('RESTRICT')
      table.boolean('ativo').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['departamento_id'])
    })
  }

  async down() {
    this.schema.dropTableIfExists('cargos')
    this.schema.dropTableIfExists('departamentos')
  }
}
