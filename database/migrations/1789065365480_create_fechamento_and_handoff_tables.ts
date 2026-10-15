import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Tabela Fechamentos (RF024-RF028)
    this.schema.createTable('fechamentos', (table) => {
      table.increments('id').notNullable()

      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      // Checklist pré-fechamento e aprovação financeira
      table.text('checklist_json').nullable()
      table.boolean('checklist_completo').notNullable().defaultTo(false)

      table.boolean('cadastro_aprovado').notNullable().defaultTo(false)
      table
        .integer('cadastro_aprovado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      // Datas
      table.timestamp('data_fechamento', { useTz: true }).nullable()
      table.date('data_limite_assinatura').nullable()
      table.timestamp('contrato_assinado_em', { useTz: true }).nullable()

      // Documentos
      table.string('contrato_url', 500).nullable()
      table.string('caderno_comercial_url', 500).nullable()
      table.decimal('valor_total_fechamento', 12, 2).nullable()

      // Onboarding do cliente — RF028
      table.boolean('onboarding_disparado').notNullable().defaultTo(false)
      table.timestamp('onboarding_disparado_em', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projeto_id'])
      table.index(['checklist_completo'])
      table.index(['cadastro_aprovado'])
    })

    // 2. Tabela Parcelas Financeiras (RF025, Plano de Pagamento)
    this.schema.createTable('parcelas', (table) => {
      table.increments('id').notNullable()

      table
        .integer('fechamento_id')
        .unsigned()
        .references('id')
        .inTable('fechamentos')
        .onDelete('CASCADE')
        .notNullable()

      table.integer('numero').notNullable()
      table.decimal('valor', 12, 2).notNullable()
      table.date('vencimento').notNullable()

      // status: pendente | pago | vencido | cancelado
      table.string('status', 30).notNullable().defaultTo('pendente')

      table.date('data_pagamento').nullable()
      table.string('forma_pagamento', 50).nullable()
      table.string('comprovante_url', 500).nullable()
      table.text('observacoes').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['fechamento_id'])
      table.index(['status'])
      table.index(['vencimento'])
    })

    // 3. Tabela Handoffs Técnicos com Checklist de 8 Itens Obrigatórios (RF029-RF031, RN006)
    this.schema.createTable('handoffs', (table) => {
      table.increments('id').notNullable()

      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      // Checklist com 8 itens obrigatórios — RN006:
      // contrato_assinado, caderno_comercial, plantas_arquitetonicas, fotos_ambiente,
      // briefing_completo, aprovacao_financeira, pedido_gerado, dados_obra
      table.text('checklist_json').notNullable()
      table.boolean('checklist_completo').notNullable().defaultTo(false)

      // Liberação técnica
      table
        .integer('liberado_por_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('liberado_em', { useTz: true }).nullable()
      table.text('observacoes').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['projeto_id'])
      table.index(['checklist_completo'])
    })
  }

  async down() {
    this.schema.dropTable('handoffs')
    this.schema.dropTable('parcelas')
    this.schema.dropTable('fechamentos')
  }
}
