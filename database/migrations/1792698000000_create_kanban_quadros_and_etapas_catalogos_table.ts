import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected quadrosTable = 'kanban_quadros_catalogo'
  protected etapasTable = 'kanban_etapas_catalogo'

  async up() {
    this.schema.createTable(this.quadrosTable, (table) => {
      table.increments('id').notNullable()
      table.string('nome', 120).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('descricao', 255).nullable()
      table.string('cor', 50).notNullable().defaultTo('#b45309')
      table.integer('ordem').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_sistema').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable(this.etapasTable, (table) => {
      table.increments('id').notNullable()
      table
        .integer('quadro_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(this.quadrosTable)
        .onDelete('CASCADE')
      table.string('nome', 120).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('cor', 50).notNullable().defaultTo('#3b82f6')
      table.integer('ordem').notNullable().defaultTo(0)
      table.boolean('exige_qualificacao').notNullable().defaultTo(false)
      table.boolean('exige_motivo_perda').notNullable().defaultTo(false)
      table.string('tipo_estagio', 30).notNullable().defaultTo('aberta')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_sistema').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['quadro_id', 'ordem'])
    })

    this.defer(async (db) => {
      const quadrosPadrao = [
        {
          nome: 'Kanban Comercial',
          slug: 'comercial',
          descricao: 'Funil comercial de qualificação, briefing, projeto 3D, apresentação e fechamento',
          cor: '#b45309',
          ordem: 1,
          is_active: true,
          is_sistema: true,
          etapas: [
            { nome: 'Novo Lead', slug: 'novo_lead', cor: '#3b82f6', ordem: 1, exige_qualificacao: false, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Qualificação', slug: 'qualificando', cor: '#8b5cf6', ordem: 2, exige_qualificacao: false, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Briefing', slug: 'em_briefing', cor: '#a66a12', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Fila de Projeto', slug: 'fila_projeto', cor: '#f59e0b', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Em Projeto', slug: 'em_projeto', cor: '#6366f1', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Pronto para Renderizar', slug: 'pronto_para_renderizar', cor: '#06b6d4', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalização / Renderizado', slug: 'finalizacao_renderizado', cor: '#0ea5e9', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Confirmar Apresentação', slug: 'confirmar_apresentacao', cor: '#ec4899', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Apresentação Agendada', slug: 'apresentacao_agendada', cor: '#d946ef', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Aberto / Em Negociação / Apresentado', slug: 'em_fechamento', cor: '#eab308', ordem: 10, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Stand-by', slug: 'stand_by', cor: '#64748b', ordem: 11, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Alteração / Modificação / Ajuste', slug: 'alteracao_ajuste', cor: '#f97316', ordem: 12, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fechado / Vendido', slug: 'fechado', cor: '#16a34a', ordem: 13, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'ganho', is_sistema: true },
            { nome: 'Perdido', slug: 'perdido', cor: '#dc2626', ordem: 14, exige_qualificacao: false, exige_motivo_perda: true, tipo_estagio: 'perdido', is_sistema: true },
          ],
        },
        {
          nome: 'Pós-venda (Conferência)',
          slug: 'pos_venda_conferencia',
          descricao: 'Acompanhamento de caderno comercial, obra, medição técnica, pré-executivo e codificação',
          cor: '#0284c7',
          ordem: 2,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Caderno Comercial', slug: 'caderno_comercial', cor: '#0284c7', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Aguardando Obra', slug: 'aguardando_obra', cor: '#64748b', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Medição Técnica', slug: 'fila_medicao_tecnica', cor: '#f59e0b', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Pasta Técnica', slug: 'fila_pasta_tecnica', cor: '#eab308', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Adequação de Obra', slug: 'em_adequacao_obra', cor: '#f97316', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Medição Técnica', slug: 'medicao_tecnica', cor: '#06b6d4', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Medição Final', slug: 'fila_medicao_final', cor: '#3b82f6', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Medição Final', slug: 'medicao_final', cor: '#6366f1', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pré-executivo', slug: 'pre_executivo', cor: '#8b5cf6', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Projeto Executivo', slug: 'fila_projeto_executivo', cor: '#a855f7', ordem: 10, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Adequação', slug: 'adequacao', cor: '#ec4899', ordem: 11, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Auditoria Projeto', slug: 'auditoria_projeto', cor: '#14b8a6', ordem: 12, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Assinatura Executiva', slug: 'assinatura_executiva', cor: '#10b981', ordem: 13, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Codificação', slug: 'em_codificacao', cor: '#0ea5e9', ordem: 14, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Postagem', slug: 'postagem', cor: '#16a34a', ordem: 15, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
          ],
        },
        {
          nome: 'Pós-venda - Entrega e Montagem',
          slug: 'pos_venda_entrega_montagem',
          descricao: 'Produção industrial, vistoria, entrega, montagem e relatório final de obra',
          cor: '#059669',
          ordem: 3,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Aguardando Produção', slug: 'aguardando_producao', cor: '#f59e0b', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pronto pra Indústria', slug: 'pronto_industria', cor: '#0284c7', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Vistoria para Montagem', slug: 'vistoria_montagem', cor: '#6366f1', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Entrega Agendada', slug: 'entrega_agendada', cor: '#8b5cf6', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Montagem', slug: 'em_montagem', cor: '#06b6d4', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Checklist Final', slug: 'checklist_final', cor: '#14b8a6', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Montagem Finalizada', slug: 'montagem_finalizada', cor: '#10b981', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalizada com Pendência', slug: 'finalizada_com_pendencia', cor: '#f97316', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Relatório de Obra', slug: 'relatorio_obra', cor: '#16a34a', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
          ],
        },
        {
          nome: 'Pós-venda - Assistência Técnica',
          slug: 'pos_venda_assistencia_tecnica',
          descricao: 'Acompanhamento de solicitações de Assistência Técnica (AT) e pós-venda concluído',
          cor: '#7c3aed',
          ordem: 4,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Aguardando Abertura de AT', slug: 'aguardando_abertura_at', cor: '#f59e0b', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'AT Aberta', slug: 'at_aberta', cor: '#ef4444', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalizada', slug: 'at_finalizada', cor: '#10b981', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pós-venda', slug: 'pos_venda_concluido', cor: '#16a34a', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'ganho', is_sistema: false },
          ],
        },
      ]

      for (const q of quadrosPadrao) {
        const [insertedQuadro] = await db
          .table(this.quadrosTable)
          .insert({
            nome: q.nome,
            slug: q.slug,
            descricao: q.descricao,
            cor: q.cor,
            ordem: q.ordem,
            is_active: q.is_active,
            is_sistema: q.is_sistema,
          })
          .returning('id')

        const quadroId = typeof insertedQuadro === 'object' ? insertedQuadro.id : insertedQuadro

        for (const e of q.etapas) {
          await db.table(this.etapasTable).insert({
            quadro_id: quadroId,
            nome: e.nome,
            slug: e.slug,
            cor: e.cor,
            ordem: e.ordem,
            exige_qualificacao: e.exige_qualificacao,
            exige_motivo_perda: e.exige_motivo_perda,
            tipo_estagio: e.tipo_estagio,
            is_active: true,
            is_sistema: e.is_sistema,
          })
        }
      }
    })
  }

  async down() {
    this.schema.dropTable(this.etapasTable)
    this.schema.dropTable(this.quadrosTable)
  }
}

