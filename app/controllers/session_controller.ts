import User, { PERFIL_LABELS, PerfilUsuario } from '#models/user'
import PerfilCatalogo from '#models/perfil_catalogo'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SessionController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = request.header('x-inertia') === 'true'
    if (isInertia) return false
    const accept = request.header('accept') || ''
    const contentType = request.header('content-type') || ''
    return (
      accept.includes('application/json') ||
      contentType.includes('application/json') ||
      request.qs().format === 'json'
    )
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)

      if (!user.isActive) {
        session.flash('error', 'Usuário inativo. Entre em contato com a administração.')
        return response.redirect().back()
      }

      user.ultimoLogin = DateTime.now()
      await user.save()

      session.forget('impersonate_perfil')
      session.forget('impersonate_perfil_label')

      await auth.use('web').login(user)
      return response.redirect().toRoute('dashboard')
    } catch {
      session.flash('error', 'E-mail ou senha incorretos.')
      return response.redirect().back()
    }
  }

  async destroy({ auth, response, session }: HttpContext) {
    session.forget('impersonate_perfil')
    session.forget('impersonate_perfil_label')
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }

  /**
   * Alterna ou restaura a simulação de perfil ("Ver como...") para usuários da Diretoria.
   */
  async simularPerfil({ request, auth, response, session }: HttpContext) {
    const user = auth.user

    if (!user || !user.canImpersonate) {
      const msg = 'Apenas a Diretoria possui permissão para simular a visão de outros perfis.'
      if (this.wantsJson(request)) {
        return response.status(403).json({ message: msg, error: msg })
      }
      session.flash('error', msg)
      return response.status(403).redirect().toRoute('dashboard')
    }

    const { perfil } = request.only(['perfil'])
    const slugAlvo = perfil ? String(perfil).trim().toLowerCase() : ''
    const perfilReal = user.perfilOriginal ?? user.perfil

    // Restaurar visão original de Diretoria
    if (!slugAlvo || slugAlvo === perfilReal) {
      session.forget('impersonate_perfil')
      session.forget('impersonate_perfil_label')
      user.applyImpersonation(null, null)

      if (this.wantsJson(request)) {
        return response.json({
          success: true,
          isImpersonating: false,
          perfil: user.perfil,
          perfilLabel: user.perfilLabel,
        })
      }

      session.flash('success', `Visão original de ${user.perfilLabel} restaurada.`)
      return response.redirect().back()
    }

    // Validar perfil alvo no catálogo ou no enum padrão
    let nomeLabel: string | null = null
    try {
      const perfilCat = await PerfilCatalogo.query().where('slug', slugAlvo).first()
      if (perfilCat) {
        if (!perfilCat.isActive) {
          const msg = `O perfil "${perfilCat.nome}" está inativo e não pode ser simulado.`
          if (this.wantsJson(request)) {
            return response.status(400).json({ message: msg, error: msg })
          }
          session.flash('error', msg)
          return response.redirect().back()
        }
        nomeLabel = perfilCat.nome
      }
    } catch {
      // Fallback para o mapa estático caso a tabela não exista no momento
    }

    if (!nomeLabel) {
      if ((PERFIL_LABELS as Record<string, string>)[slugAlvo]) {
        nomeLabel = (PERFIL_LABELS as Record<string, string>)[slugAlvo]
      } else {
        const msg = 'Perfil informado é inválido para simulação.'
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: msg, error: msg })
        }
        session.flash('error', msg)
        return response.redirect().back()
      }
    }

    session.put('impersonate_perfil', slugAlvo)
    session.put('impersonate_perfil_label', nomeLabel)
    user.applyImpersonation(slugAlvo, nomeLabel)

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        isImpersonating: true,
        perfil: slugAlvo,
        perfilLabel: nomeLabel,
      })
    }

    session.flash('info', `Modo de simulação ativo: visualizando o sistema como ${nomeLabel}.`)

    const referer = request.header('referer') || ''
    if (
      referer.includes('/colaboradores') &&
      slugAlvo !== PerfilUsuario.RH &&
      slugAlvo !== PerfilUsuario.DIRETORIA
    ) {
      return response.redirect().toRoute('dashboard')
    }

    if (referer.includes('/configuracoes')) {
      const temConfig =
        (await user.can('configuracoes.visualizar')) ||
        (await user.can('configuracoes.gerenciar_permissoes'))
      if (!temConfig) {
        return response.redirect().toRoute('dashboard')
      }
    }

    return response.redirect().back()
  }
}
