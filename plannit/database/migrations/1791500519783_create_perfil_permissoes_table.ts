import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('perfil_permissoes', (table) => {
      table.increments('id').notNullable()
      table.string('perfil', 50).notNullable()
      table.string('modulo', 50).notNullable()
      table.string('permissao_codigo', 100).notNullable()
      table.string('descricao', 255).notNullable()
      table.boolean('concedido').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['perfil', 'permissao_codigo'])
      table.index(['perfil'])
      table.index(['permissao_codigo'])
      table.index(['modulo'])
    })

    this.defer(async (db) => {
      const now = new Date()

      const PERMISSOES = [
        // CRM
        { codigo: 'crm.visualizar', modulo: 'crm', descricao: 'Visualizar CRM e Kanban de leads' },
        { codigo: 'crm.ver_todos', modulo: 'crm', descricao: 'Ver leads de toda a equipe' },
        { codigo: 'crm.gerenciar', modulo: 'crm', descricao: 'Criar, qualificar e mover leads' },

        // Clientes
        { codigo: 'clientes.visualizar', modulo: 'clientes', descricao: 'Visualizar lista e fichas de clientes' },
        { codigo: 'clientes.gerenciar', modulo: 'clientes', descricao: 'Cadastrar e editar clientes' },
        { codigo: 'clientes.aprovar', modulo: 'clientes', descricao: 'Aprovar cadastro de clientes' },

        // Briefings
        { codigo: 'briefings.visualizar', modulo: 'briefings', descricao: 'Visualizar briefings e scores' },
        { codigo: 'briefings.gerenciar', modulo: 'briefings', descricao: 'Preencher briefings e enviar para a fila' },

        // Fila
        { codigo: 'fila.visualizar', modulo: 'fila', descricao: 'Visualizar fila de projetos e WIP' },
        { codigo: 'fila.alocar', modulo: 'fila', descricao: 'Alocar e desalocar projetistas' },
        { codigo: 'fila.configurar_wip', modulo: 'fila', descricao: 'Configurar limites de WIP' },

        // Projetos & Render
        { codigo: 'projetos.visualizar', modulo: 'projetos', descricao: 'Visualizar projetos e maquetes 3D' },
        { codigo: 'projetos.ver_todos', modulo: 'projetos', descricao: 'Ver projetos de toda a equipe' },
        { codigo: 'projetos.gerenciar_etapas', modulo: 'projetos', descricao: 'Alterar status e etapas de projetos' },
        { codigo: 'projetos.avaliar_render', modulo: 'projetos', descricao: 'Aprovar ou devolver versões 3D' },
        { codigo: 'projetos.fechamento', modulo: 'projetos', descricao: 'Fechamento comercial e handoff' },

        // Especificadores
        { codigo: 'especificadores.visualizar', modulo: 'especificadores', descricao: 'Visualizar carteira de parceiros' },
        { codigo: 'especificadores.gerenciar', modulo: 'especificadores', descricao: 'Cadastrar e editar parceiros' },
        { codigo: 'especificadores.reatribuir_dono', modulo: 'especificadores', descricao: 'Reatribuir dono de especificador' },
        { codigo: 'especificadores.metas', modulo: 'especificadores', descricao: 'Definir metas de visitas da equipe' },

        // Agenda
        { codigo: 'agenda.visualizar', modulo: 'agenda', descricao: 'Visualizar agenda de compromissos' },
        { codigo: 'agenda.ver_equipe', modulo: 'agenda', descricao: 'Ver compromissos de toda a equipe' },
        { codigo: 'agenda.gerenciar', modulo: 'agenda', descricao: 'Criar, reagendar e concluir compromissos' },

        // Colaboradores / RH
        { codigo: 'colaboradores.visualizar', modulo: 'colaboradores', descricao: 'Visualizar colaboradores e cargos' },
        { codigo: 'colaboradores.gerenciar', modulo: 'colaboradores', descricao: 'Cadastrar, alterar cargos e desligar' },

        // Configurações
        { codigo: 'configuracoes.visualizar', modulo: 'configuracoes', descricao: 'Acessar página de configurações' },
        { codigo: 'configuracoes.gerenciar_catalogos', modulo: 'configuracoes', descricao: 'Gerenciar ambientes, origens e campanhas' },
        { codigo: 'configuracoes.gerenciar_permissoes', modulo: 'configuracoes', descricao: 'Gerenciar matriz de permissões dos perfis (Mestre)' },
      ]

      const PERFIS = [
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

      // Mapa de permissões iniciais concedidas por perfil
      const permissoesIniciais: Record<string, string[]> = {
        diretoria: PERMISSOES.map((p) => p.codigo), // Acesso total
        gerente_comercial: PERMISSOES.map((p) => p.codigo).filter((c) => c !== 'configuracoes.gerenciar_permissoes'), // Quase tudo, exceto gerenciar permissões inicialmente
        vendedor: [
          'crm.visualizar',
          'crm.gerenciar',
          'clientes.visualizar',
          'clientes.gerenciar',
          'briefings.visualizar',
          'briefings.gerenciar',
          'projetos.visualizar',
          'especificadores.visualizar',
          'especificadores.gerenciar',
          'agenda.visualizar',
          'agenda.gerenciar',
        ],
        projetista: [
          'briefings.visualizar',
          'fila.visualizar',
          'projetos.visualizar',
          'projetos.gerenciar_etapas',
          'agenda.visualizar',
          'agenda.gerenciar',
        ],
        conferente: [
          'projetos.visualizar',
          'agenda.visualizar',
        ],
        recepcao: [
          'crm.visualizar',
          'agenda.visualizar',
        ],
        supervisor_montagem: [
          'projetos.visualizar',
          'agenda.visualizar',
        ],
        gestor_logistica: [
          'projetos.visualizar',
          'agenda.visualizar',
        ],
        sac: [
          'clientes.visualizar',
          'projetos.visualizar',
          'agenda.visualizar',
        ],
        financeiro: [
          'clientes.visualizar',
          'clientes.aprovar',
          'projetos.visualizar',
          'projetos.fechamento',
          'agenda.visualizar',
        ],
        montador_proprio: [
          'agenda.visualizar',
        ],
        montador_terceiro: [
          'agenda.visualizar',
        ],
        arquiteto: [
          'especificadores.visualizar',
        ],
        rh: [
          'colaboradores.visualizar',
          'colaboradores.gerenciar',
          'agenda.visualizar',
        ],
        cliente: [],
      }

      const rows: Array<{
        perfil: string
        modulo: string
        permissao_codigo: string
        descricao: string
        concedido: boolean
        created_at: Date
        updated_at: Date
      }> = []

      for (const perfil of PERFIS) {
        const permitidas = permissoesIniciais[perfil] || []
        for (const perm of PERMISSOES) {
          rows.push({
            perfil,
            modulo: perm.modulo,
            permissao_codigo: perm.codigo,
            descricao: perm.descricao,
            concedido: permitidas.includes(perm.codigo),
            created_at: now,
            updated_at: now,
          })
        }
      }

      await db.table('perfil_permissoes').multiInsert(rows)
    })
  }

  async down() {
    this.schema.dropTable('perfil_permissoes')
  }
}

