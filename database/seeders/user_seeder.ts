import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { PerfilUsuario } from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@plannit.com.br' },
      {
        nome: 'Administrador Diretoria',
        email: 'admin@plannit.com.br',
        password: 'Admin@123456',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: true,
      }
    )

    await User.updateOrCreate(
      { email: 'gerente@lidermoveis.com.br' },
      {
        nome: 'Gerente Comercial',
        email: 'gerente@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.GERENTE_COMERCIAL,
        isActive: true,
        isSuperuser: false,
      }
    )

    await User.updateOrCreate(
      { email: 'vendedor@lidermoveis.com.br' },
      {
        nome: 'Vendedor Líder',
        email: 'vendedor@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      }
    )

    await User.updateOrCreate(
      { email: 'projetista@lidermoveis.com.br' },
      {
        nome: 'Projetista Líder',
        email: 'projetista@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.PROJETISTA,
        isActive: true,
        isSuperuser: false,
      }
    )

    await User.updateOrCreate(
      { email: 'conferente@lidermoveis.com.br' },
      {
        nome: 'Conferente Técnico',
        email: 'conferente@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.CONFERENTE,
        isActive: true,
        isSuperuser: false,
      }
    )
  }
}
