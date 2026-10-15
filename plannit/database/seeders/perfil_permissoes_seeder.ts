import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DEFINICOES_PERMISSOES } from '#models/perfil_permissao'
import { PerfilUsuario } from '#models/user'

export default class PerfilPermissoesSeeder extends BaseSeeder {
  async run() {
    const now = new Date()

    const PERFIS = Object.values(PerfilUsuario)

    const permissoesIniciais: Record<string, string[]> = {
      [PerfilUsuario.DIRETORIA]: DEFINICOES_PERMISSOES.map((p) => p.codigo),
      [PerfilUsuario.GERENTE_COMERCIAL]: DEFINICOES_PERMISSOES.map((p) => p.codigo).filter(
        (c) => c !== 'configuracoes.gerenciar_permissoes'
      ),
      [PerfilUsuario.VENDEDOR]: [
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
      [PerfilUsuario.PROJETISTA]: [
        'briefings.visualizar',
        'fila.visualizar',
        'projetos.visualizar',
        'projetos.gerenciar_etapas',
        'agenda.visualizar',
        'agenda.gerenciar',
      ],
      [PerfilUsuario.CONFERENTE]: [
        'projetos.visualizar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.RECEPCAO]: [
        'crm.visualizar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.SUPERVISOR_MONTAGEM]: [
        'projetos.visualizar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.GESTOR_LOGISTICA]: [
        'projetos.visualizar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.SAC]: [
        'clientes.visualizar',
        'projetos.visualizar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.FINANCEIRO]: [
        'clientes.visualizar',
        'clientes.aprovar',
        'projetos.visualizar',
        'projetos.fechamento',
        'agenda.visualizar',
      ],
      [PerfilUsuario.MONTADOR_PROPRIO]: [
        'agenda.visualizar',
      ],
      [PerfilUsuario.MONTADOR_TERCEIRO]: [
        'agenda.visualizar',
      ],
      [PerfilUsuario.ARQUITETO]: [
        'especificadores.visualizar',
      ],
      [PerfilUsuario.RH]: [
        'colaboradores.visualizar',
        'colaboradores.gerenciar',
        'agenda.visualizar',
      ],
      [PerfilUsuario.CLIENTE]: [],
    }

    for (const perfil of PERFIS) {
      const permitidas = permissoesIniciais[perfil] || []

      for (const perm of DEFINICOES_PERMISSOES) {
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
            concedido: permitidas.includes(perm.codigo),
            created_at: now,
            updated_at: now,
          })
        }
      }
    }
  }
}

