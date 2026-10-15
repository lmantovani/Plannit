import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Tabela Clientes
    this.schema.createTable('clientes', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 200).notNullable()
      table.string('cpf_cnpj', 30).unique().nullable().index()
      table.string('telefone', 30).notNullable()
      table.string('email', 200).nullable()
      table.string('tipo', 30).notNullable().defaultTo('pessoa_fisica') // pessoa_fisica, pessoa_juridica
      table.string('rg_ie', 30).nullable() // RG ou Inscrição Estadual
      table.string('profissao_ramo', 150).nullable()
      table.text('observacoes').nullable()

      // Vínculo opcional com Arquiteto/Especificador parceiro
      table
        .integer('arquiteto_id')
        .unsigned()
        .references('id')
        .inTable('arquitetos')
        .onDelete('SET NULL')
        .nullable()

      // Aprovação cadastral financeira
      table.boolean('cadastro_aprovado').notNullable().defaultTo(false)
      table
        .integer('cadastro_aprovado_por')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.timestamp('cadastro_aprovado_em', { useTz: true }).nullable()

      // Soft delete e auditoria
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['nome'])
      table.index(['cadastro_aprovado'])
      table.index(['is_active'])
    })

    // 2. Tabela Endereços de Clientes (múltiplos endereços de entrega/montagem/cobrança)
    this.schema.createTable('enderecos_cliente', (table) => {
      table.increments('id').notNullable()
      table
        .integer('cliente_id')
        .unsigned()
        .references('id')
        .inTable('clientes')
        .onDelete('CASCADE')
        .notNullable()

      table.string('tipo', 50).notNullable().defaultTo('montagem') // cobranca, montagem, entrega, comercial, residencial
      table.string('identificacao', 100).nullable() // Ex: "Apto Jardins", "Casa de Praia", "Sede Alphaville"
      table.string('cep', 15).nullable()
      table.string('logradouro', 255).notNullable()
      table.string('numero', 50).notNullable()
      table.string('complemento', 150).nullable()
      table.string('bairro', 100).nullable()
      table.string('cidade', 100).notNullable()
      table.string('estado', 2).notNullable().defaultTo('SP')
      table.text('ponto_referencia').nullable()
      table.boolean('is_principal').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['cliente_id'])
      table.index(['tipo'])
    })

    // 3. Adicionar cliente_id na tabela projetos
    this.schema.alterTable('projetos', (table) => {
      table
        .integer('cliente_id')
        .unsigned()
        .references('id')
        .inTable('clientes')
        .onDelete('SET NULL')
        .nullable()

      table.index(['cliente_id'])
    })
  }

  async down() {
    this.schema.alterTable('projetos', (table) => {
      table.dropIndex(['cliente_id'])
      table.dropColumn('cliente_id')
    })

    this.schema.dropTable('enderecos_cliente')
    this.schema.dropTable('clientes')
  }
}