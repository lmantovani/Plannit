import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Adiciona coluna arquiteto_id em projetos com FK e índice
    this.schema.alterTable('projetos', (table) => {
      table
        .integer('arquiteto_id')
        .unsigned()
        .references('id')
        .inTable('arquitetos')
        .onDelete('SET NULL')
        .nullable()

      table.index(['arquiteto_id'])
    })

    // 2. Formaliza FK e índice em leads.arquiteto_id (coluna já existente no schema inicial)
    this.schema.alterTable('leads', (table) => {
      table
        .foreign('arquiteto_id', 'fk_leads_arquiteto')
        .references('id')
        .inTable('arquitetos')
        .onDelete('SET NULL')

      table.index(['arquiteto_id'])
    })
  }

  async down() {
    this.schema.alterTable('leads', (table) => {
      table.dropForeign(['arquiteto_id'], 'fk_leads_arquiteto')
      table.dropIndex(['arquiteto_id'])
    })

    this.schema.alterTable('projetos', (table) => {
      table.dropForeign(['arquiteto_id'])
      table.dropIndex(['arquiteto_id'])
      table.dropColumn('arquiteto_id')
    })
  }
}
