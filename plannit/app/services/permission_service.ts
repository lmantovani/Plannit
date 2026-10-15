import User, { PerfilUsuario } from '#models/user'
import PerfilPermissao, {
  DEFINICOES_PERMISSOES,
  PERMISSAO_MESTRE,
} from '#models/perfil_permissao'

export default class PermissionService {
  /**
   * Verifica se o usuário tem uma permissão específica.
   * Diretoria e Superuser possuem bypass garantido em qualquer checagem.
   */
  static async hasPermission(user: User, permissaoCodigo: string): Promise<boolean> {
    if (!user) return false

    // Salvaguarda irrevogável para Diretoria e Superusuários
    if (user.isSuperuser || user.perfil === PerfilUsuario.DIRETORIA) {
      return true
    }

    const registro = await PerfilPermissao.query()
      .where('perfil', user.perfil)
      .where('permissao_codigo', permissaoCodigo)
      .first()

    return registro ? registro.concedido : false
  }

  /**
   * Retorna a lista de todos os códigos de permissões ativos para o usuário.
   */
  static async getPermissions(user: User): Promise<string[]> {
    if (!user) return []

    if (user.isSuperuser || user.perfil === PerfilUsuario.DIRETORIA) {
      return DEFINICOES_PERMISSOES.map((d) => d.codigo)
    }

    return PerfilPermissao.obterCodigosConcedidos(user.perfil)
  }

  /**
   * Verifica se o usuário pode visualizar e gerenciar a matriz de permissões.
   * Inicialmente apenas Diretoria, mas ela pode conceder essa permissão para outros perfis.
   */
  static async podeGerenciarPermissoes(user: User): Promise<boolean> {
    return this.hasPermission(user, PERMISSAO_MESTRE)
  }

  /**
   * Altera o status concedido de uma permissão para um determinado perfil.
   */
  static async togglePermission(
    executante: User,
    perfilAlvo: string,
    permissaoCodigo: string,
    concedido: boolean
  ): Promise<{ success: boolean; message?: string }> {
    const autorizado = await this.podeGerenciarPermissoes(executante)
    if (!autorizado) {
      return { success: false, message: 'Você não tem autorização para alterar permissões de perfis.' }
    }

    // Trava de segurança: Diretoria nunca pode ter permissões revogadas
    if (perfilAlvo === PerfilUsuario.DIRETORIA && !concedido) {
      return {
        success: false,
        message: 'O perfil Diretoria possui acesso integral obrigatório para garantir a integridade do sistema.',
      }
    }

    const definicao = DEFINICOES_PERMISSOES.find((d) => d.codigo === permissaoCodigo)
    const descricao = definicao ? definicao.descricao : permissaoCodigo
    const modulo = definicao ? definicao.modulo : 'geral'

    const registro = await PerfilPermissao.query()
      .where('perfil', perfilAlvo)
      .where('permissao_codigo', permissaoCodigo)
      .first()

    if (registro) {
      registro.concedido = concedido
      await registro.save()
    } else {
      await PerfilPermissao.create({
        perfil: perfilAlvo,
        modulo,
        permissaoCodigo,
        descricao,
        concedido,
      })
    }

    return { success: true }
  }
}

