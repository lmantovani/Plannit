import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected filaTable = 'atendimento_fila_vendedores'
  protected registrosTable = 'atendimento_registros'
  protected historicoTable = 'atendimento_historico_eventos'

  async up() {
    this.schema.createTable(this.filaTable, (table) => {
      table.increments('id').notNullable()
      table.date('data').notNullable()
      table
        .integer('vendedor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('adicionado_por_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.integer('posicao').notNullable().defaultTo(1)
      table.string('status', 40).notNullable().defaultTo('disponivel')
      table.string('motivo_indisponibilidade', 255).nullable()
      table.timestamp('hora_chegada', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('ultimo_atendimento_em', { useTz: true }).nullable()
      table.integer('atendimentos_hoje').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['data', 'vendedor_id'])
      table.index(['data', 'posicao'])
    })

    this.schema.createTable(this.registrosTable, (table) => {
      table.increments('id').notNullable()
      table.date('data').notNullable()
      table
        .integer('vendedor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('iniciado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('tipo_atendimento', 50).notNullable().defaultTo('porta_novo')
      table.string('cliente_nome', 180).nullable()
      table.string('cliente_telefone', 40).nullable()
      table
        .integer('lead_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('leads')
        .onDelete('SET NULL')
      table
        .integer('cliente_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('clientes')
        .onDelete('SET NULL')
      table
        .integer('arquiteto_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('arquitetos')
        .onDelete('SET NULL')
      table.boolean('foi_pulo_de_vez').notNullable().defaultTo(false)
      table
        .integer('vendedor_pulado_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('motivo_pulo', 80).nullable()
      table.text('justificativa_pulo').nullable()
      table.string('status', 40).notNullable().defaultTo('em_andamento')
      table.string('desfecho', 80).nullable()
      table.text('observacao').nullable()
      table.timestamp('iniciado_em', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('concluido_em', { useTz: true }).nullable()
      table.integer('duracao_minutos').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['data', 'vendedor_id'])
      table.index(['status'])
    })

    this.schema.createTable(this.historicoTable, (table) => {
      table.increments('id').notNullable()
      table.date('data').notNullable()
      table.string('tipo_evento', 60).notNullable()
      table
        .integer('vendedor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('executado_por_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('atendimento_registro_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(this.registrosTable)
        .onDelete('SET NULL')
      table
        .integer('vendedor_pulado_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.integer('posicao_anterior').nullable()
      table.integer('posicao_nova').nullable()
      table.string('motivo', 120).nullable()
      table.text('detalhes').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['data', 'created_at'])
    })

    this.defer(async (db) => {
      const now = new Date()

      const permissoesNovas = [
        {
          codigo: 'atendimentos.visualizar_fila',
          modulo: 'atendimentos',
          descricao: 'Permite acessar a tela da fila de atendimento da recepção e acompanhar a vez.',
          perfisConcedidos: ['diretoria', 'gerente_comercial', 'recepcao', 'vendedor'],
        },
        {
          codigo: 'atendimentos.operar_fila',
          modulo: 'atendimentos',
          descricao: 'Permite entrar na fila, alternar disponibilidade e iniciar/concluir atendimentos.',
          perfisConcedidos: ['diretoria', 'gerente_comercial', 'recepcao', 'vendedor'],
        },
        {
          codigo: 'atendimentos.reordenar_fila',
          modulo: 'atendimentos',
          descricao: 'Permite alterar manualmente a ordem da fila e incluir/remover outros vendedores.',
          perfisConcedidos: ['diretoria', 'gerente_comercial', 'recepcao'],
        },
      ]

      const basePerfis = [
        'diretoria',
        'gerente_comercial',
        'vendedor',
        'projetista',
        'conferente',
        'recepcao',
        'supervisor_montagem',
        'gestor_logistica',
        'sac',
        'financeiro',
        'montador_proprio',
        'montador_terceiro',
        'arquiteto',
        'rh',
        'cliente',
      ]

      let perfisCatalogo: string[] = []
      try {
        const rows = await db.from('perfis_catalogo').select('slug')
        perfisCatalogo = rows.map((r: { slug: string }) => r.slug)
      } catch {
        perfisCatalogo = []
      }

      const todosPerfis = Array.from(new Set([...basePerfis, ...perfisCatalogo]))

      for (const perfil of todosPerfis) {
        for (const perm of permissoesNovas) {
          const existe = await db
            .from('perfil_permissoes')
            .where('perfil', perfil)
            .where('permissao_codigo', perm.codigo)
            .first()

          if (!existe) {
            await db.table('perfil_permissoes').insert({
              perfil,
              modulo: perm.modulo,
              permissao_codigo: perm.codigo,
              descricao: perm.descricao,
              concedido: perm.perfisConcedidos.includes(perfil),
              created_at: now,
              updated_at: now,
            })
          }
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      await db
        .from('perfil_permissoes')
        .whereIn('permissao_codigo', [
          'atendimentos.visualizar_fila',
          'atendimentos.operar_fila',
          'atendimentos.reordenar_fila',
        ])
        .delete()
    })

    this.schema.dropTableIfExists(this.historicoTable)
    this.schema.dropTableIfExists(this.registrosTable)
    this.schema.dropTableIfExists(this.filaTable)
  }
}
