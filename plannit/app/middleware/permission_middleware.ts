import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import PermissionService from '#services/permission_service'

export default class PermissionMiddleware {
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

  async handle(
    ctx: HttpContext,
    next: NextFn,
    permissaoCodigo: string | string[]
  ) {
    const user = ctx.auth.user as User | undefined

    if (!user) {
      if (this.wantsJson(ctx.request)) {
        return ctx.response.status(401).json({ message: 'Não autenticado' })
      }
      return ctx.response.redirect().toRoute('session.create')
    }

    const codigos = Array.isArray(permissaoCodigo) ? permissaoCodigo : [permissaoCodigo]
    let autorizado = false

    for (const codigo of codigos) {
      if (await PermissionService.hasPermission(user, codigo)) {
        autorizado = true
        break
      }
    }

    if (!autorizado) {
      if (this.wantsJson(ctx.request)) {
        return ctx.response.status(403).json({ message: 'Acesso não autorizado para o seu perfil.' })
      }
      ctx.session.flash('error', 'Acesso não autorizado para o seu perfil.')
      return ctx.response.status(403).redirect().toRoute('dashboard')
    }

    return next()
  }
}
