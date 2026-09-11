import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('colaboradores', (table) => {
      table.increments('id').notNullable()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      // Identificação
      table.string('nome', 200).notNullable()
      table.string('cpf', 14).notNullable().unique()
      table.string('rg', 20).nullable()
      table.date('data_nascimento').nullable()
      table.string('sexo', 20).nullable()
      table.string('estado_civil', 30).nullable()
      table.string('foto_url', 500).nullable()

      // Perfil DISC e observações
      table.string('perfil_disc_primario', 20).nullable()
      table.string('perfil_disc_secundario', 20).nullable()
      table.text('observacoes_comportamentais').nullable()

      // Contato
      table.string('telefone_pessoal', 20).nullable()
      table.string('telefone_corporativo', 20).nullable()
      table.string('email_pessoal', 200).nullable()
      table.string('email_corporativo', 200).nullable()

      // Endereço
      table.string('endereco_logradouro', 300).nullable()
      table.string('endereco_numero', 20).nullable()
      table.string('endereco_complemento', 100).nullable()
      table.string('endereco_bairro', 100).nullable()
      table.string('endereco_cidade', 100).nullable()
      table.string('endereco_estado', 2).nullable()
      table.string('endereco_cep', 10).nullable()

      // Contratação
      table.date('data_admissao').notNullable()
      table
        .integer('cargo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('cargos')
        .onDelete('RESTRICT')
      table
        .integer('departamento_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('departamentos')
        .onDelete('RESTRICT')
      table.string('regime', 20).notNullable().defaultTo('clt') // 'clt' | 'pj'
      table.string('tipo_contrato', 100).nullable()

      // PJ
      table.string('pj_cnpj', 20).nullable()
      table.string('pj_contrato_url', 500).nullable()
      table.decimal('pj_valor_mensal', 12, 2).nullable()
      table.date('pj_vigencia_inicio').nullable()
      table.date('pj_vigencia_fim').nullable()

      // Remuneração atual denormalizada
      table.decimal('salario_clt', 12, 2).nullable()
      table.decimal('remuneracao_complementar', 12, 2).nullable()
      table.date('data_vigencia_salario').nullable()

      // Regime de trabalho
      table.string('carga_horaria', 50).nullable()
      table.string('escala', 100).nullable()
      table.string('modalidade', 20).nullable().defaultTo('presencial') // 'presencial' | 'hibrido' | 'remoto'
      table.string('jornada_especial', 200).nullable()

      // Dados bancários
      table.string('banco', 100).nullable()
      table.string('agencia', 20).nullable()
      table.string('conta', 20).nullable()
      table.string('tipo_conta', 20).nullable()

      // Organograma
      table
        .integer('gestor_id')
        .unsigned()
        .references('id')
        .inTable('colaboradores')
        .onDelete('SET NULL')
        .nullable()

      // Desligamento & Status (RH-RN009)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.date('data_desligamento').nullable()
      table.string('tipo_desligamento', 50).nullable()
      table.text('motivo_desligamento').nullable()
      table.text('entrevista_saida').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['cpf'])
      table.index(['cargo_id'])
      table.index(['departamento_id'])
      table.index(['gestor_id'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTableIfExists('colaboradores')
  }
}
