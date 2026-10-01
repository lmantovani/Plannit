import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'historico_status_leads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('lead_id').unsigned().references('id').inTable('leads').onDelete('CASCADE').notNullable()
      table.integer('alterado_por_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      
      table.string('status_de', 50).nullable()
      table.string('status_para', 50).notNullable()
      table.integer('tempo_permanencia_segundos').unsigned().nullable() // Tempo que ficou no status anterior
      table.text('observacao').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}