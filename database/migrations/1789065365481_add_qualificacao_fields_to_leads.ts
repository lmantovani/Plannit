import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leads'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('orcamento_estimado', 12, 2).nullable()
      table.string('faixa_orcamento', 50).nullable()
      table.string('prazo_obra', 50).nullable()
      table.string('tipo_imovel', 50).nullable()
      table.json('ambientes_interesse').nullable()
      table.boolean('possui_arquiteto').notNullable().defaultTo(false)
      table.boolean('decisor_presente').notNullable().defaultTo(true)
      table.timestamp('qualificado_em', { useTz: true }).nullable()
      table
        .integer('qualificado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.text('motivo_desqualificacao').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('orcamento_estimado')
      table.dropColumn('faixa_orcamento')
      table.dropColumn('prazo_obra')
      table.dropColumn('tipo_imovel')
      table.dropColumn('ambientes_interesse')
      table.dropColumn('possui_arquiteto')
      table.dropColumn('decisor_presente')
      table.dropColumn('qualificado_em')
      table.dropColumn('qualificado_por_id')
      table.dropColumn('motivo_desqualificacao')
    })
  }
}
