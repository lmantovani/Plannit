import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projetos_comerciais'

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

      table.integer('versao').notNullable().defaultTo(1)
      table.string('arquivo_url', 500).nullable()
      table.text('render_urls').nullable()
      table.text('descricao_alteracao').nullable()

      // Controle de validação — RF018, RN004
      // em_desenvolvimento | aguard_validacao_vendedor | aprovado | devolvido | em_render | finalizado
      table.string('status', 50).notNullable().defaultTo('em_desenvolvimento')

      // Aprovação/devolução pelo vendedor (antes do render) - RN004
      table.timestamp('submetido_para_validacao_em', { useTz: true }).nullable()
      table
        .integer('validado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('validado_em', { useTz: true }).nullable()
      table.text('motivo_devolucao').nullable()

      // Contagem de apresentações/reapresentações — RF022, RF023
      table.integer('numero_apresentacao').notNullable().defaultTo(0)

      table
        .integer('criado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projeto_id'])
      table.index(['status'])
      table.index(['versao'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
