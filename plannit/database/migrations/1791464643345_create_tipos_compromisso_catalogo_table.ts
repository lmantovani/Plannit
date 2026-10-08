import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tipos_compromisso_catalogo'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nome', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('cor', 20).notNullable().defaultTo('#3B82F6')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('ordem').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['ordem'])
      table.index(['slug'])
    })

    // Seed idempotente inicial com os 7 tipos padrão
    this.defer(async (db) => {
      const now = new Date()
      const tiposPadrao = [
        { nome: 'Briefing Técnico', slug: 'briefing_tecnico', cor: '#3B82F6', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita e Medição no Local', slug: 'visita_medicao', cor: '#10B981', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Apresentação de Projeto 3D', slug: 'apresentacao_3d', cor: '#8B5CF6', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita à Obra', slug: 'visita_obra', cor: '#F59E0B', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Reunião de Alinhamento na Loja', slug: 'reuniao_loja', cor: '#EC4899', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Alinhamento com Especificador / Arquiteto', slug: 'alinhamento_especificador', cor: '#6366F1', ordem: 60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Outro', slug: 'outro', cor: '#6B7280', ordem: 70, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table(this.tableName).multiInsert(tiposPadrao)
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}