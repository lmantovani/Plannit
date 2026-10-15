import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User, { type PerfilUsuario } from '#models/user'

/**
 * Role middleware ensures the authenticated user has one of the required roles.
 */
export default class RoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    roles: PerfilUsuario[]
  ) {
    const user = ctx.auth.user as User | undefined

    if (!user) {
      return ctx.response.redirect().toRoute('session.create')
    }

    if (!user.hasRole(roles)) {
      ctx.session.flash('error', 'Acesso não autorizado para o seu perfil.')
      return ctx.response.status(403).redirect().toRoute('dashboard')
    }

    return next()
  }
}
