import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { PerfilUsuario } from '#models/user'
import Projeto, { StatusProjeto } from '#models/projeto'
import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import ConfigWipProjetista from '#models/config_wip_projetista'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const vendedor = await User.findBy('email', 'vendedor@lidermoveis.com.br')
    if (!vendedor) {
      console.log('Vendedor não encontrado. Execute o UserSeeder primeiro.')
      return
    }

    // 1. Garante os 3 Projetistas no banco com senhas padrão
    const projetista1 = await User.updateOrCreate(
      { email: 'projetista@lidermoveis.com.br' },
      {
        nome: 'Lucas Silveira (Projetista Líder)',
        email: 'projetista@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.PROJETISTA,
        isActive: true,
        isSuperuser: false,
      }
    )

    const projetista2 = await User.updateOrCreate(
      { email: 'andre.valente@lidermoveis.com.br' },
      {
        nome: 'André Valente (Projetista Sênior)',
        email: 'andre.valente@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.PROJETISTA,
        isActive: true,
        isSuperuser: false,
      }
    )

    const projetista3 = await User.updateOrCreate(
      { email: 'mariana.duarte@lidermoveis.com.br' },
      {
        nome: 'Mariana Duarte (Projetista Júnior)',
        email: 'mariana.duarte@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.PROJETISTA,
        isActive: true,
        isSuperuser: false,
      }
    )

    // 2. Configura limites WIP
    await ConfigWipProjetista.updateOrCreate(
      { projetistaId: projetista1.id },
      { projetistaId: projetista1.id, wipLimit: 3, ativo: true }
    )

    await ConfigWipProjetista.updateOrCreate(
      { projetistaId: projetista2.id },
      { projetistaId: projetista2.id, wipLimit: 3, ativo: true }
    )

    await ConfigWipProjetista.updateOrCreate(
      { projetistaId: projetista3.id },
      { projetistaId: projetista3.id, wipLimit: 2, ativo: true }
    )

    // Limpa projetos da fila anteriores específicos de demonstração
    await FilaProjeto.query().whereHas('projeto', (q) => {
      q.whereILike('codigo', 'PRJ-2026-0%')
    }).delete()

    await Projeto.query().whereILike('codigo', 'PRJ-2026-0%').delete()

    // 3. Ocupa o Projetista 2 com 3 projetos (3/3 = 100% LOTADO para testar RN003)
    for (let i = 1; i <= 3; i++) {
      const pLotado = await Projeto.create({
        codigo: `PRJ-2026-01${i}`,
        clienteNome: `Cliente Ocupação #${i} (André)`,
        vendedorId: vendedor.id,
        projetistaId: projetista2.id,
        status: StatusProjeto.EM_PROJETO,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: i }),
        createdAt: DateTime.now().minus({ days: i + 1 }),
      })

      await FilaProjeto.create({
        projetoId: pLotado.id,
        projetistaId: projetista2.id,
        status: i === 1 ? StatusFila.EM_ANDAMENTO : StatusFila.ALOCADO,
        prioridade: 4,
        dataEntradaFila: DateTime.now().minus({ days: i + 2 }),
        dataAlocacao: DateTime.now().minus({ days: i }),
      })

      await HistoricoStatusProjeto.create({
        projetoId: pLotado.id,
        statusDe: StatusProjeto.NA_FILA,
        statusPara: StatusProjeto.EM_PROJETO,
        alteradoPorId: vendedor.id,
        observacao: `Alocado para André Valente. Projeto ${i}/3 em execução.`,
        createdAt: DateTime.now().minus({ days: i }),
      })
    }

    // 4. Ocupa o Projetista 1 com 1 projeto (1/3 = DISPONÍVEL para mais 2 projetos)
    const pParcial = await Projeto.create({
      codigo: 'PRJ-2026-014',
      clienteNome: 'Dr. Paulo Sampaio (Lucas)',
      vendedorId: vendedor.id,
      projetistaId: projetista1.id,
      status: StatusProjeto.EM_PROJETO,
      arquivado: false,
      statusAlteradoEm: DateTime.now().minus({ days: 1 }),
      createdAt: DateTime.now().minus({ days: 2 }),
    })

    await FilaProjeto.create({
      projetoId: pParcial.id,
      projetistaId: projetista1.id,
      status: StatusFila.ALOCADO,
      prioridade: 3,
      dataEntradaFila: DateTime.now().minus({ days: 3 }),
      dataAlocacao: DateTime.now().minus({ days: 1 }),
    })

    // 5. Projetista 3 fica com 0 projetos (0/2 = 100% LIVRE)

    // 6. Cria Projetos AGUARDANDO na Fila de Espera (Prioridades variadas)
    const projetosAguardando = [
      {
        codigo: 'PRJ-2026-020',
        cliente: 'Helena Vasconcelos (Cobertura Jardins)',
        prioridade: 1, // Urgente
        diasAtras: 4,
      },
      {
        codigo: 'PRJ-2026-021',
        cliente: 'Dr. Otávio Ramos (Mansão Tamboré)',
        prioridade: 3, // Alta
        diasAtras: 2,
      },
      {
        codigo: 'PRJ-2026-022',
        cliente: 'Beatriz Mendonça (Apartamento Moema)',
        prioridade: 5, // Normal
        diasAtras: 1,
      },
    ]

    for (const item of projetosAguardando) {
      const pNovo = await Projeto.create({
        codigo: item.codigo,
        clienteNome: item.cliente,
        vendedorId: vendedor.id,
        projetistaId: null,
        status: StatusProjeto.NA_FILA,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: item.diasAtras }),
        createdAt: DateTime.now().minus({ days: item.diasAtras }),
      })

      await FilaProjeto.create({
        projetoId: pNovo.id,
        projetistaId: null,
        status: StatusFila.AGUARDANDO,
        prioridade: item.prioridade,
        dataEntradaFila: DateTime.now().minus({ days: item.diasAtras }),
      })
    }

    console.log('FilaSeeder executado com sucesso: 3 projetistas configurados (1 lotado, 1 parcial, 1 livre) e 3 projetos aguardando alocação!')
  }
}
