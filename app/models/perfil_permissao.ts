import { PerfilPermissoeSchema } from '#database/schema'
import { PerfilUsuario } from '#models/user'

export interface DefinicaoPermissao {
  codigo: string
  modulo: string
  moduloLabel: string
  nome: string
  descricao: string
}

export const MODULOS_SISTEMA: Array<{ key: string; label: string; ordem: number }> = [
  { key: 'crm', label: 'CRM / Leads', ordem: 1 },
  { key: 'clientes', label: 'Clientes', ordem: 2 },
  { key: 'briefings', label: 'Briefings', ordem: 3 },
  { key: 'fila', label: 'Fila de Projetos', ordem: 4 },
  { key: 'projetos', label: 'Projetos & Render', ordem: 5 },
  { key: 'especificadores', label: 'Especificadores', ordem: 6 },
  { key: 'agenda', label: 'Agenda', ordem: 7 },
  { key: 'colaboradores', label: 'Colaboradores / RH', ordem: 8 },
  { key: 'configuracoes', label: 'Configurações', ordem: 9 },
]

export const DEFINICOES_PERMISSOES: DefinicaoPermissao[] = [
  // CRM / Leads
  {
    codigo: 'crm.visualizar',
    modulo: 'crm',
    moduloLabel: 'CRM / Leads',
    nome: 'Visualizar CRM',
    descricao: 'Permite acessar a tela do CRM e visualizar o Kanban de leads.',
  },
  {
    codigo: 'crm.ver_todos',
    modulo: 'crm',
    moduloLabel: 'CRM / Leads',
    nome: 'Ver Leads da Equipe',
    descricao: 'Permite visualizar leads de todos os consultores e vendedores.',
  },
  {
    codigo: 'crm.gerenciar',
    modulo: 'crm',
    moduloLabel: 'CRM / Leads',
    nome: 'Gerenciar Leads',
    descricao: 'Permite criar novos leads, alterar etapas do funil e qualificar leads.',
  },

  // Clientes
  {
    codigo: 'clientes.visualizar',
    modulo: 'clientes',
    moduloLabel: 'Clientes',
    nome: 'Visualizar Clientes',
    descricao: 'Permite acessar a lista e fichas completas de clientes.',
  },
  {
    codigo: 'clientes.gerenciar',
    modulo: 'clientes',
    moduloLabel: 'Clientes',
    nome: 'Cadastrar e Editar Clientes',
    descricao: 'Permite cadastrar clientes e atualizar endereços e contatos.',
  },
  {
    codigo: 'clientes.aprovar',
    modulo: 'clientes',
    moduloLabel: 'Clientes',
    nome: 'Aprovar Cadastro',
    descricao: 'Permite aprovar cadastros comerciais e financeiros de clientes.',
  },

  // Briefings
  {
    codigo: 'briefings.visualizar',
    modulo: 'briefings',
    moduloLabel: 'Briefings',
    nome: 'Visualizar Briefings',
    descricao: 'Permite acessar a listagem de briefings e acompanhar scores.',
  },
  {
    codigo: 'briefings.gerenciar',
    modulo: 'briefings',
    moduloLabel: 'Briefings',
    nome: 'Editar e Enviar à Fila',
    descricao: 'Permite preencher briefings, calcular score e despachar para a fila técnica.',
  },

  // Fila de Projetos & WIP
  {
    codigo: 'fila.visualizar',
    modulo: 'fila',
    moduloLabel: 'Fila de Projetos',
    nome: 'Visualizar Fila & WIP',
    descricao: 'Permite acompanhar os projetos na fila técnica e monitorar limites de WIP.',
  },
  {
    codigo: 'fila.alocar',
    modulo: 'fila',
    moduloLabel: 'Fila de Projetos',
    nome: 'Alocar e Iniciar Projetos',
    descricao: 'Permite alocar/desalocar projetistas e iniciar a execução técnica.',
  },
  {
    codigo: 'fila.configurar_wip',
    modulo: 'fila',
    moduloLabel: 'Fila de Projetos',
    nome: 'Configurar Limites WIP',
    descricao: 'Permite alterar a quantidade máxima de projetos simultâneos por projetista.',
  },

  // Projetos & Render
  {
    codigo: 'projetos.visualizar',
    modulo: 'projetos',
    moduloLabel: 'Projetos & Render',
    nome: 'Visualizar Projetos',
    descricao: 'Permite visualizar os detalhes dos projetos em andamento.',
  },
  {
    codigo: 'projetos.ver_todos',
    modulo: 'projetos',
    moduloLabel: 'Projetos & Render',
    nome: 'Ver Projetos da Equipe',
    descricao: 'Permite visualizar projetos de toda a equipe e outros projetistas.',
  },
  {
    codigo: 'projetos.gerenciar_etapas',
    modulo: 'projetos',
    moduloLabel: 'Projetos & Render',
    nome: 'Mudar Status e Etapas',
    descricao: 'Permite avançar as 32 etapas do fluxo operacional ou arquivar projetos.',
  },
  {
    codigo: 'projetos.avaliar_render',
    modulo: 'projetos',
    moduloLabel: 'Projetos & Render',
    nome: 'Aprovar Versões 3D / Render',
    descricao: 'Permite aprovar maquetes 3D comerciais ou solicitar ajustes com motivo.',
  },
  {
    codigo: 'projetos.fechamento',
    modulo: 'projetos',
    moduloLabel: 'Projetos & Render',
    nome: 'Fechamento & Handoff',
    descricao: 'Permite preencher contrato, liquidar parcelas e checklist de handoff técnico.',
  },

  // Especificadores
  {
    codigo: 'especificadores.visualizar',
    modulo: 'especificadores',
    moduloLabel: 'Especificadores',
    nome: 'Visualizar Parceiros',
    descricao: 'Permite visualizar a carteira de arquitetos e designers.',
  },
  {
    codigo: 'especificadores.gerenciar',
    modulo: 'especificadores',
    moduloLabel: 'Especificadores',
    nome: 'Cadastrar e Interagir',
    descricao: 'Permite cadastrar parceiros, registrar interações, concorrentes e decisores.',
  },
  {
    codigo: 'especificadores.reatribuir_dono',
    modulo: 'especificadores',
    moduloLabel: 'Especificadores',
    nome: 'Reatribuir Dono de Carteira',
    descricao: 'Permite transferir a responsabilidade de um especificador para outro consultor.',
  },
  {
    codigo: 'especificadores.metas',
    modulo: 'especificadores',
    moduloLabel: 'Especificadores',
    nome: 'Definir Metas Comerciais',
    descricao: 'Permite estipular metas mensais de visitas para a equipe comercial.',
  },

  // Agenda
  {
    codigo: 'agenda.visualizar',
    modulo: 'agenda',
    moduloLabel: 'Agenda',
    nome: 'Visualizar Agenda',
    descricao: 'Permite acessar o módulo de agenda e visualizar compromissos.',
  },
  {
    codigo: 'agenda.ver_equipe',
    modulo: 'agenda',
    moduloLabel: 'Agenda',
    nome: 'Ver Agenda da Equipe',
    descricao: 'Permite alternar para a visão de toda a equipe e filtrar por qualquer colaborador.',
  },
  {
    codigo: 'agenda.gerenciar',
    modulo: 'agenda',
    moduloLabel: 'Agenda',
    nome: 'Gerenciar Compromissos',
    descricao: 'Permite agendar novos compromissos, reagendar, cancelar e registrar desfechos.',
  },

  // Colaboradores / RH
  {
    codigo: 'colaboradores.visualizar',
    modulo: 'colaboradores',
    moduloLabel: 'Colaboradores / RH',
    nome: 'Visualizar RH',
    descricao: 'Permite acessar a lista de colaboradores, cargos e departamentos.',
  },
  {
    codigo: 'colaboradores.gerenciar',
    modulo: 'colaboradores',
    moduloLabel: 'Colaboradores / RH',
    nome: 'Gerenciar RH & Cargos',
    descricao: 'Permite cadastrar novos colaboradores, lançar histórico salarial e desligar.',
  },

  // Configurações
  {
    codigo: 'configuracoes.visualizar',
    modulo: 'configuracoes',
    moduloLabel: 'Configurações',
    nome: 'Acessar Configurações',
    descricao: 'Permite abrir o painel de configurações e tabelas de apoio.',
  },
  {
    codigo: 'configuracoes.gerenciar_catalogos',
    modulo: 'configuracoes',
    moduloLabel: 'Configurações',
    nome: 'Gerenciar Catálogos',
    descricao: 'Permite cadastrar, editar e ativar/desativar ambientes, origens, campanhas e tipos de agenda.',
  },
  {
    codigo: 'configuracoes.gerenciar_permissoes',
    modulo: 'configuracoes',
    moduloLabel: 'Configurações',
    nome: 'Gerenciar Matriz de Permissões (Mestre)',
    descricao: 'Permite visualizar e alterar permissões de todos os perfis do sistema.',
  },
]

export const PERMISSAO_MESTRE = 'configuracoes.gerenciar_permissoes'

export default class PerfilPermissao extends PerfilPermissoeSchema {
  static table = 'perfil_permissoes'

  static async obterCodigosConcedidos(perfil: PerfilUsuario | string): Promise<string[]> {
    const rows = await PerfilPermissao.query()
      .where('perfil', perfil)
      .where('concedido', true)
      .select('permissao_codigo')

    return rows.map((r) => r.permissaoCodigo)
  }
}

