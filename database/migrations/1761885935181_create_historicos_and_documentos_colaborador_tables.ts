import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Histórico Salarial Imutável (RH-RN009)
    this.schema.createTable('historico_salarial_colaboradores', (table) => {
      table.increments('id').notNullable()
      table
        .integer('colaborador_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('colaboradores')
        .onDelete('CASCADE')
      table.decimal('salario_clt', 12, 2).notNullable()
      table.decimal('remuneracao_complementar', 12, 2).nullable()
      table.date('data_vigencia').notNullable()
      table.string('motivo', 300).notNullable()
      table
        .integer('registrado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['colaborador_id'])
      table.index(['colaborador_id', 'data_vigencia'])
    })

    // 2. Histórico de Cargos e Promoções Imutável (RH-RN009)
    this.schema.createTable('historico_cargo_colaboradores', (table) => {
      table.increments('id').notNullable()
      table
        .integer('colaborador_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('colaboradores')
        .onDelete('CASCADE')
      table
        .integer('cargo_anterior_id')
        .unsigned()
        .references('id')
        .inTable('cargos')
        .onDelete('RESTRICT')
        .nullable()
      table
        .integer('cargo_novo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('cargos')
        .onDelete('RESTRICT')
      table.date('data').notNullable()
      table
        .integer('aprovado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('justificativa', 300).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['colaborador_id'])
      table.index(['colaborador_id', 'data'])
    })

    // 3. Documentos Funcionais do Colaborador
    this.schema.createTable('documentos_colaboradores', (table) => {
      table.increments('id').notNullable()
      table
        .integer('colaborador_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('colaboradores')
        .onDelete('CASCADE')
      table.string('tipo', 50).notNullable() // 'ctps' | 'aso_admissional' | 'contrato_assinado' | 'exame_periodico' | 'certidao' | 'pis_pasep' | 'outro'
      table.string('url', 500).notNullable()
      table.date('data_vencimento').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['colaborador_id'])
    })
  }

  async down() {
    this.schema.dropTableIfExists('documentos_colaboradores')
    this.schema.dropTableIfExists('historico_cargo_colaboradores')
    this.schema.dropTableIfExists('historico_salarial_colaboradores')
  }
}
