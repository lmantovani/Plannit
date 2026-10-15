import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SessionController {
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

      await auth.use('web').login(user)
      return response.redirect().toRoute('dashboard')
    } catch {
      session.flash('error', 'E-mail ou senha incorretos.')
      return response.redirect().back()
    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
