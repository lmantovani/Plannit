import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Tabela de Catálogo de Ambientes
    this.schema.createTable('ambientes_catalogo', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 100).notNullable()
      table.string('categoria', 100).notNullable().defaultTo('Geral')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('ordem').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['ordem'])
    })

    // 2. Tabela de Catálogo de Origens de Lead
    this.schema.createTable('origens_lead_catalogo', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['slug'])
    })

    // 3. Tabela de Campanhas de Lead
    this.schema.createTable('campanhas_lead', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 150).notNullable()
      table.timestamp('data_inicio', { useTz: true }).nullable()
      table.timestamp('data_fim', { useTz: true }).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
    })

    // Seed com opções padrão para garantir funcionamento imediato
    this.defer(async (db) => {
      const now = new Date()

      // Ambientes padrão (R3 - padronização e desmembramento)
      const ambientesPadrao = [
        { nome: 'Living', categoria: 'Área Social', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Home Theater', categoria: 'Área Social', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Suíte Master', categoria: 'Área Íntima', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto do Filho', categoria: 'Área Íntima', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto da Filha', categoria: 'Área Íntima', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto de Visita', categoria: 'Área Íntima', ordem: 60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Closet', categoria: 'Área Íntima', ordem: 70, is_active: true, created_at: now, updated_at: now },
        { nome: 'Cozinha', categoria: 'Área Social', ordem: 80, is_active: true, created_at: now, updated_at: now },
        { nome: 'Espaço Gourmet', categoria: 'Área Social', ordem: 90, is_active: true, created_at: now, updated_at: now },
        { nome: 'Varanda', categoria: 'Área Social', ordem: 100, is_active: true, created_at: now, updated_at: now },
        { nome: 'Banheiro', categoria: 'Área Íntima', ordem: 110, is_active: true, created_at: now, updated_at: now },
        { nome: 'Lavabo', categoria: 'Área Social', ordem: 120, is_active: true, created_at: now, updated_at: now },
        { nome: 'Home Office', categoria: 'Área Social', ordem: 130, is_active: true, created_at: now, updated_at: now },
        { nome: 'Área de Serviço', categoria: 'Serviço', ordem: 140, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('ambientes_catalogo').multiInsert(ambientesPadrao)

      // Origens padrão
      const origensPadrao = [
        { nome: 'Instagram', slug: 'instagram', is_active: true, created_at: now, updated_at: now },
        { nome: 'Indicação', slug: 'indicacao', is_active: true, created_at: now, updated_at: now },
        { nome: 'Site / Google', slug: 'site_google', is_active: true, created_at: now, updated_at: now },
        { nome: 'Construtora', slug: 'construtora', is_active: true, created_at: now, updated_at: now },
        { nome: 'Showroom', slug: 'showroom', is_active: true, created_at: now, updated_at: now },
        { nome: 'Especificador', slug: 'arquiteto', is_active: true, created_at: now, updated_at: now },
        { nome: 'Outro', slug: 'outro', is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('origens_lead_catalogo').multiInsert(origensPadrao)

      // Campanhas padrão
      const dataFim30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const dataFim60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      const dataFim90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

      const campanhasPadrao = [
        { nome: 'Campanha Cozinhas & Gourmet', data_inicio: now, data_fim: dataFim60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Parceria Mostra Casa Decor', data_inicio: now, data_fim: dataFim90, is_active: true, created_at: now, updated_at: now },
        { nome: 'Ação Venda Futura / Na Planta', data_inicio: now, data_fim: dataFim30, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('campanhas_lead').multiInsert(campanhasPadrao)
    })
  }

  async down() {
    this.schema.dropTableIfExists('campanhas_lead')
    this.schema.dropTableIfExists('origens_lead_catalogo')
    this.schema.dropTableIfExists('ambientes_catalogo')
  }
}