import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projetos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('codigo', 30).notNullable().unique()
      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
        .nullable()
      table.string('cliente_nome', 200).notNullable()
      table
        .integer('vendedor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('projetista_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('conferente_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.string('arquiteto_nome', 200).nullable()
      table.string('status', 50).notNullable().defaultTo('em_briefing')
      table.decimal('valor_contrato', 12, 2).nullable()
      table.date('prazo_entrega_estimado').nullable()
      table.boolean('alerta_parado').notNullable().defaultTo(false)
      table.boolean('arquivado').notNullable().defaultTo(false)
      table.text('arquivado_motivo').nullable()

      table.timestamp('status_alterado_em', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['codigo'])
      table.index(['vendedor_id'])
      table.index(['projetista_id'])
      table.index(['status'])
      table.index(['arquivado'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
