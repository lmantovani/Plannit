import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'briefings'

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

      table.string('cidade_obra', 100).nullable()
      table.string('estado_obra', 2).nullable()
      table.string('endereco_obra', 300).nullable()

      table.jsonb('ambientes').nullable()
      table.string('prazo_desejado', 100).nullable()
      table.decimal('faixa_investimento_min', 12, 2).nullable()
      table.decimal('faixa_investimento_max', 12, 2).nullable()

      table.string('estilo_preferido', 100).nullable()
      table.text('observacoes').nullable()
      table.jsonb('referencias_url').nullable()

      table.string('arquiteto_nome', 200).nullable()
      table.string('arquiteto_email', 200).nullable()
      table.string('arquiteto_telefone', 30).nullable()

      table.decimal('score', 5, 1).notNullable().defaultTo(0.0)
      table.decimal('score_minimo', 5, 1).notNullable().defaultTo(70.0)
      table.jsonb('score_detalhes').nullable()

      table.string('status', 50).notNullable().defaultTo('rascunho')
      table.timestamp('enviado_em', { useTz: true }).nullable()
      table.text('motivo_devolucao').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projeto_id'])
      table.index(['status'])
      table.index(['score'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
