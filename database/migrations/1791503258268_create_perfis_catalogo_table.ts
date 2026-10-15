import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('perfis_catalogo', (table) => {
      table.increments('id').notNullable()
      table.string('nome', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('descricao', 255).nullable()
      table.boolean('is_sistema').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('ordem').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['ordem'])
      table.index(['slug'])
    })

    this.defer(async (db) => {
      // 1. Converte users.perfil de enum nativo para varchar(100) para permitir perfis criados dinamicamente
      await db.rawQuery(
        'ALTER TABLE users ALTER COLUMN perfil TYPE varchar(100) USING perfil::varchar(100)'
      )

      // 2. Popula os perfis padrão no catálogo
      const now = new Date()
      const perfisIniciais = [
        {
          nome: 'Diretoria',
          slug: 'diretoria',
          descricao: 'Acesso pleno e governança mestre do sistema',
          is_sistema: true,
          is_active: true,
          ordem: 10,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Gerente Comercial',
          slug: 'gerente_comercial',
          descricao: 'Gestão da equipe de vendas e aprovações comerciais',
          is_sistema: true,
          is_active: true,
          ordem: 20,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Vendedor',
          slug: 'vendedor',
          descricao: 'Atendimento comercial, qualificação e captação de clientes',
          is_sistema: true,
          is_active: true,
          ordem: 30,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Projetista',
          slug: 'projetista',
          descricao: 'Elaboração técnica de maquetes 3D e renderização',
          is_sistema: true,
          is_active: true,
          ordem: 40,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Conferente Técnico',
          slug: 'conferente',
          descricao: 'Conferência técnica no local e validação de medidas',
          is_sistema: true,
          is_active: true,
          ordem: 50,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Recepção',
          slug: 'recepcao',
          descricao: 'Recepção de clientes e primeiro contato no showroom',
          is_sistema: false,
          is_active: true,
          ordem: 60,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Supervisor de Montagem',
          slug: 'supervisor_montagem',
          descricao: 'Coordenação e vistoria das equipes de montagem',
          is_sistema: false,
          is_active: true,
          ordem: 70,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Logística',
          slug: 'gestor_logistica',
          descricao: 'Controle de entregas e expedição de pedidos',
          is_sistema: false,
          is_active: true,
          ordem: 80,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'SAC / Pós-Venda',
          slug: 'sac',
          descricao: 'Atendimento a ocorrências e satisfação pós-instalação',
          is_sistema: false,
          is_active: true,
          ordem: 90,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Financeiro',
          slug: 'financeiro',
          descricao: 'Aprovação de crédito, fechamentos e conciliação',
          is_sistema: false,
          is_active: true,
          ordem: 100,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Montador',
          slug: 'montador_proprio',
          descricao: 'Instalação de móveis na obra do cliente',
          is_sistema: false,
          is_active: true,
          ordem: 110,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Montador Terceiro',
          slug: 'montador_terceiro',
          descricao: 'Prestador de serviços externo de montagem',
          is_sistema: false,
          is_active: true,
          ordem: 120,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Arquiteto',
          slug: 'arquiteto',
          descricao: 'Parceiro especificador com acesso externo',
          is_sistema: false,
          is_active: true,
          ordem: 130,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'RH',
          slug: 'rh',
          descricao: 'Departamento de Recursos Humanos e gestão funcional',
          is_sistema: false,
          is_active: true,
          ordem: 140,
          created_at: now,
          updated_at: now,
        },
        {
          nome: 'Cliente',
          slug: 'cliente',
          descricao: 'Acesso externo para acompanhamento de projeto',
          is_sistema: false,
          is_active: true,
          ordem: 150,
          created_at: now,
          updated_at: now,
        },
      ]

      await db.table('perfis_catalogo').multiInsert(perfisIniciais)
    })
  }

  async down() {
    this.schema.dropTable('perfis_catalogo')
  }
}
