import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Lead from '#models/lead'
import Projeto, { StatusProjeto } from '#models/projeto'
import Briefing, { StatusBriefing } from '#models/briefing'
import AmbienteBriefing from '#models/ambiente_briefing'
import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import { calcularScoreBriefing } from '#services/briefing_score_service'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const vendedor = await User.findBy('email', 'vendedor@lidermoveis.com.br')
    const projetista = await User.findBy('email', 'projetista@lidermoveis.com.br')

    if (!vendedor) {
      console.log('Vendedor padrão não encontrado. Execute o UserSeeder primeiro.')
      return
    }

    const leadBriefing = await Lead.findBy('nome', 'Juliana Mendes')

    // Limpa dados de briefings e fila anteriores
    await FilaProjeto.query().delete()
    await AmbienteBriefing.query().delete()
    await Briefing.query().delete()
    await Projeto.query().delete()

    // ----------------------------------------------------
    // 1. Projeto com Briefing RASCUNHO Incompleto (Score < 70 - RN002 Bloqueado)
    // ----------------------------------------------------
    const p1 = await Projeto.create({
      codigo: 'PRJ-2026-001',
      clienteNome: 'Juliana & Rogério Mendes',
      vendedorId: vendedor.id,
      leadId: leadBriefing ? leadBriefing.id : null,
      status: StatusProjeto.EM_BRIEFING,
      arquivado: false,
      alertaParado: false,
      statusAlteradoEm: DateTime.now().minus({ days: 2 }),
      createdAt: DateTime.now().minus({ days: 2 }),
    })

    const b1Score = calcularScoreBriefing({
      cidadeObra: 'São Paulo',
      ambientes: ['cozinha', 'sala'],
      // Sem faixa de investimento, sem ambientes detalhados, sem referências
      scoreMinimo: 70,
    })

    await Briefing.create({
      projetoId: p1.id,
      cidadeObra: 'São Paulo',
      estadoObra: 'SP',
      enderecoObra: 'Rua Bela Cintra, 1420 - Jardins',
      ambientes: ['cozinha', 'sala'],
      status: StatusBriefing.RASCUNHO,
      score: String(b1Score.score),
      scoreMinimo: '70',
      scoreDetalhes: b1Score.detalhes,
      referenciasUrl: [],
      createdAt: DateTime.now().minus({ days: 2 }),
    })

    // ----------------------------------------------------
    // 2. Projeto com Briefing RASCUNHO Completo (Score >= 70 - Apto para Envio)
    // ----------------------------------------------------
    const p2 = await Projeto.create({
      codigo: 'PRJ-2026-002',
      clienteNome: 'Roberto Calheiros',
      vendedorId: vendedor.id,
      status: StatusProjeto.EM_BRIEFING,
      arquivado: false,
      alertaParado: false,
      statusAlteradoEm: DateTime.now().minus({ days: 1 }),
      createdAt: DateTime.now().minus({ days: 3 }),
    })

    const b2AmbientesDetalhados = [
      {
        tipo: 'cozinha',
        descricao: 'Cozinha gourmet com ilha central em lâmina de carvalho e bancada em granito São Gabriel escovado.',
        medidasPreliminares: '4.80m x 3.20m, pé direito 2.70m',
        observacoesEspecificas: 'Prever nicho para forno elétrico de embutir 90cm e cooktop indução.',
      },
      {
        tipo: 'closet',
        descricao: 'Closet master com iluminação LED embutida nas prateleiras e portas em vidro reflecta bronze.',
        medidasPreliminares: '3.60m x 2.40m, pé direito 2.70m',
        observacoesEspecificas: 'Gaveteiros com divisores aveludados para relógios e joias.',
      },
    ]

    const b2Score = calcularScoreBriefing({
      cidadeObra: 'Campinas',
      ambientes: ['cozinha', 'closet', 'dormitorio'],
      prazoDesejado: '2026-11-30',
      faixaInvestimentoMin: 80000,
      faixaInvestimentoMax: 140000,
      estiloPreferido: 'Contemporâneo Minimalista',
      arquitetoNome: 'Studio Arquitetura & Design',
      observacoes: 'Cliente busca acabamentos de altíssimo padrão, linha warm-gold, ferragens Blum com amortecimento e portas sem puxador com cava usinada.',
      referenciasUrl: ['https://br.pinterest.com/pin/exemplo-cozinha-moderna-luxo/'],
      ambientesDetalhados: b2AmbientesDetalhados,
      scoreMinimo: 70,
    })

    const b2 = await Briefing.create({
      projetoId: p2.id,
      cidadeObra: 'Campinas',
      estadoObra: 'SP',
      enderecoObra: 'Condomínio Alphaville Campinas, Lote 45',
      ambientes: ['cozinha', 'closet', 'dormitorio'],
      prazoDesejado: '2026-11-30',
      faixaInvestimentoMin: '80000',
      faixaInvestimentoMax: '140000',
      estiloPreferido: 'Contemporâneo Minimalista',
      arquitetoNome: 'Studio Arquitetura & Design',
      arquitetoEmail: 'contato@studioarq.com.br',
      arquitetoTelefone: '(19) 99887-1122',
      observacoes: 'Cliente busca acabamentos de altíssimo padrão, linha warm-gold, ferragens Blum com amortecimento e portas sem puxador com cava usinada.',
      referenciasUrl: ['https://br.pinterest.com/pin/exemplo-cozinha-moderna-luxo/'],
      status: StatusBriefing.RASCUNHO,
      score: String(b2Score.score),
      scoreMinimo: '70',
      scoreDetalhes: b2Score.detalhes,
      createdAt: DateTime.now().minus({ days: 3 }),
    })

    for (const amb of b2AmbientesDetalhados) {
      await AmbienteBriefing.create({
        briefingId: b2.id,
        ...amb,
      })
    }

    // ----------------------------------------------------
    // 3. Projeto com Briefing ENVIADO PARA FILA (Score >= 70, na Fila de Projetos)
    // ----------------------------------------------------
    const p3 = await Projeto.create({
      codigo: 'PRJ-2026-003',
      clienteNome: 'Fabrícia Alencar',
      vendedorId: vendedor.id,
      projetistaId: projetista ? projetista.id : null,
      status: StatusProjeto.NA_FILA,
      arquivado: false,
      alertaParado: false,
      statusAlteradoEm: DateTime.now().minus({ hours: 12 }),
      createdAt: DateTime.now().minus({ days: 5 }),
    })

    const b3Ambientes = [
      {
        tipo: 'gourmet',
        descricao: 'Varanda gourmet integrada à sala com cristaleira iluminada e churrasqueira revestida.',
        medidasPreliminares: '5.20m x 2.80m',
        observacoesEspecificas: 'Portas ripadas em tauari natural.',
      },
      {
        tipo: 'home_office',
        descricao: 'Escritório executivo para duas pessoas com estante piso-teto e painel ripado acústico.',
        medidasPreliminares: '3.10m x 2.90m',
        observacoesEspecificas: 'Passagem oculta de cabos elétricos e rede.',
      },
    ]

    const b3Score = calcularScoreBriefing({
      cidadeObra: 'São Paulo',
      ambientes: ['gourmet', 'home_office'],
      prazoDesejado: '2026-10-15',
      faixaInvestimentoMin: 120000,
      faixaInvestimentoMax: 180000,
      estiloPreferido: 'Moderno Nobre',
      arquitetoNome: 'Arq. Renata Vasquez',
      observacoes: 'Projeto prioritário com previsão de início imediato assim que alocado. Cliente possui urgência na entrega.',
      referenciasUrl: ['https://instagram.com/p/exemplo-briefing-gourmet'],
      ambientesDetalhados: b3Ambientes,
      scoreMinimo: 70,
    })

    const b3 = await Briefing.create({
      projetoId: p3.id,
      cidadeObra: 'São Paulo',
      estadoObra: 'SP',
      enderecoObra: 'Av. República do Líbano, 890 - Ibirapuera',
      ambientes: ['gourmet', 'home_office'],
      prazoDesejado: '2026-10-15',
      faixaInvestimentoMin: '120000',
      faixaInvestimentoMax: '180000',
      estiloPreferido: 'Moderno Nobre',
      arquitetoNome: 'Arq. Renata Vasquez',
      arquitetoEmail: 'renata@vasquezarq.com.br',
      arquitetoTelefone: '(11) 98123-4567',
      observacoes: 'Projeto prioritário com previsão de início imediato assim que alocado. Cliente possui urgência na entrega.',
      referenciasUrl: ['https://instagram.com/p/exemplo-briefing-gourmet'],
      status: StatusBriefing.ENVIADO,
      score: String(b3Score.score),
      scoreMinimo: '70',
      scoreDetalhes: b3Score.detalhes,
      enviadoEm: DateTime.now().minus({ hours: 12 }),
      createdAt: DateTime.now().minus({ days: 5 }),
    })

    for (const amb of b3Ambientes) {
      await AmbienteBriefing.create({
        briefingId: b3.id,
        ...amb,
      })
    }

    await FilaProjeto.create({
      projetoId: p3.id,
      status: StatusFila.AGUARDANDO,
      prioridade: 5,
      dataEntradaFila: DateTime.now().minus({ hours: 12 }),
    })

    // ----------------------------------------------------
    // 4. Projeto sem briefing criado (para testar criação)
    // ----------------------------------------------------
    await Projeto.create({
      codigo: 'PRJ-2026-004',
      clienteNome: 'Carlos Eduardo Silveira',
      vendedorId: vendedor.id,
      status: StatusProjeto.EM_BRIEFING,
      arquivado: false,
      alertaParado: false,
      statusAlteradoEm: DateTime.now(),
      createdAt: DateTime.now(),
    })

    console.log('BriefingSeeder executado com sucesso: 4 projetos, 3 briefings (incompleto, pronto, enviado)!')
  }
}
