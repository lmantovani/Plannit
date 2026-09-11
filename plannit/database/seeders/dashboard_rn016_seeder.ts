import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Projeto from '#models/projeto'
import Cliente from '#models/cliente'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const cliente = await Cliente.first()
    const vendedor = await User.query().where('perfil', 'vendedor').first()
    const projetista = await User.query().where('perfil', 'projetista').first()

    // Criar um projeto estagnado propositalmente há 8 dias para acionar o alerta RN016
    await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-ALERTA' },
      {
        codigo: 'PROJ-2026-ALERTA',
        clienteId: cliente?.id || null,
        clienteNome: 'Mansão Morumbi (Estagnado)',
        vendedorId: vendedor?.id || null,
        projetistaId: projetista?.id || null,
        status: 'em_projeto',
        valorContrato: '185000.00',
        alertaParado: true,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: 8 }),
      }
    )
  }
}
