import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'compromissos_agenda'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('titulo', 150).notNullable()
      table
        .integer('tipo_id')
        .unsigned()
        .references('id')
        .inTable('tipos_compromisso_catalogo')
        .onDelete('RESTRICT')
        .notNullable()

      table.timestamp('data_hora_inicio', { useTz: true }).notNullable()
      table.timestamp('data_hora_fim', { useTz: true }).notNullable()
      table.string('local', 255).nullable()
      table.string('status', 20).notNullable().defaultTo('agendado')
      table.text('observacoes').nullable()
      table.text('desfecho').nullable()

      table
        .integer('responsavel_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('criado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('cliente_id')
        .unsigned()
        .references('id')
        .inTable('clientes')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['responsavel_id', 'data_hora_inicio'])
      table.index(['status', 'data_hora_inicio'])
      table.index(['tipo_id'])
      table.index(['lead_id'])
      table.index(['cliente_id'])
      table.index(['projeto_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
