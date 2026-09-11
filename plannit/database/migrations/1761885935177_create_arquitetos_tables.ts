import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Tabela de Especificadores (Arquitetos, Designers, etc.)
    this.schema.createTable('arquitetos', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 200).notNullable()
      table.string('escritorio', 200).nullable()
      table.string('endereco_escritorio', 300).nullable()
      table.string('telefone', 30).nullable()
      table.string('email', 254).unique().nullable()
      table.string('nivel_parceria', 50).notNullable().defaultTo('parceiro')
      table.string('tipo', 50).notNullable().defaultTo('arquiteto')
      table.string('especialidade', 200).nullable()
      table
        .integer('consultor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.string('status_carteira', 50).notNullable().defaultTo('em_prospeccao')
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['consultor_id'])
      table.index(['status_carteira'])
      table.index(['tipo'])
      table.index(['is_active'])
    })

    // 2. Decisores de escritório
    this.schema.createTable('decisores_arquitetos', (table) => {
      table.increments('id').notNullable()
      table
        .integer('arquiteto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('arquitetos')
        .onDelete('CASCADE')
      table.string('nome', 200).notNullable()
      table.string('cargo', 100).nullable()
      table.string('telefone', 30).nullable()
      table.string('email', 254).nullable()
      table.text('observacoes').nullable()
      table.boolean('is_principal').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['arquiteto_id'])
      table.index(['arquiteto_id', 'is_principal'])
    })

    // 3. Monitoramento de concorrência
    this.schema.createTable('concorrentes_arquitetos', (table) => {
      table.increments('id').notNullable()
      table
        .integer('arquiteto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('arquitetos')
        .onDelete('CASCADE')
      table.string('nome_concorrente', 200).notNullable()
      table.decimal('percentual_fechamento_estimado', 5, 2).notNullable().defaultTo(0.0)
      table.text('observacoes').nullable()
      table
        .integer('registrado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['arquiteto_id'])
    })

    // 4. Histórico imutável de consultor dono (RN017)
    this.schema.createTable('historico_dono_arquitetos', (table) => {
      table.increments('id').notNullable()
      table
        .integer('arquiteto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('arquitetos')
        .onDelete('CASCADE')
      table
        .integer('consultor_anterior_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table
        .integer('consultor_novo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('alterado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.text('motivo').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['arquiteto_id'])
      table.index(['consultor_novo_id'])
    })

    // 5. Histórico cronológico de interações
    this.schema.createTable('interacoes_arquitetos', (table) => {
      table.increments('id').notNullable()
      table
        .integer('arquiteto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('arquitetos')
        .onDelete('CASCADE')
      table
        .integer('responsavel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('tipo', 50).notNullable()
      table.text('resumo').notNullable()
      table
        .integer('lead_id')
        .unsigned()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
        .nullable()
      table.timestamp('data', { useTz: true }).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['arquiteto_id'])
      table.index(['responsavel_id'])
      table.index(['data'])
      table.index(['tipo'])
    })

    // 6. Metas de visitas mensais por consultor
    this.schema.createTable('metas_visitas_consultor', (table) => {
      table.increments('id').notNullable()
      table
        .integer('consultor_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.integer('meta_visitas_mes').notNullable().defaultTo(0)
      table
        .integer('configurado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['consultor_id'])
    })
  }

  async down() {
    this.schema.dropTable('metas_visitas_consultor')
    this.schema.dropTable('interacoes_arquitetos')
    this.schema.dropTable('historico_dono_arquitetos')
    this.schema.dropTable('concorrentes_arquitetos')
    this.schema.dropTable('decisores_arquitetos')
    this.schema.dropTable('arquitetos')
  }
}
