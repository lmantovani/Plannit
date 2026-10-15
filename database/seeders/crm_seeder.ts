import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Lead, { OrigemLead, StatusFunil } from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const vendedor = await User.findBy('email', 'vendedor@lidermoveis.com.br')
    const gerente = await User.findBy('email', 'gerente@lidermoveis.com.br')

    if (!vendedor) {
      console.log('Vendedor padrão não encontrado. Rode o UserSeeder primeiro.')
      return
    }

    const vendedorId = vendedor.id
    const gerenteId = gerente ? gerente.id : vendedorId

    // Limpa leads anteriores para evitar duplicatas em seed repetido
    await InteracaoLead.query().delete()
    await Lead.query().delete()

    // 1. Lead Novo (sem interação recente - alerta!)
    const lead1 = await Lead.create({
      nome: 'Dra. Camila Vasconcelos',
      telefone: '(11) 98765-4321',
      email: 'camila.vasconcelos@hospitalalfa.com.br',
      cidade: 'São Paulo',
      estado: 'SP',
      origem: OrigemLead.INSTAGRAM,
      campanha: 'Campanha Cozinhas Gourmet Outono',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedorId,
      qualificado: false,
      ultimaInteracaoEm: DateTime.now().minus({ days: 4 }), // > 3 dias -> estagnado!
      createdAt: DateTime.now().minus({ days: 5 }),
    })

    await InteracaoLead.create({
      leadId: lead1.id,
      responsavelId: vendedorId,
      tipo: 'whatsapp',
      resumo: 'Lead enviou direct no Instagram interessada em reforma completa de apartamento em Moema (180m²). Enviado catálogo.',
      createdAt: DateTime.now().minus({ days: 4 }),
    })

    // 2. Lead Qualificando
    const lead2 = await Lead.create({
      nome: 'Marcelo Pires Nogueira',
      telefone: '(11) 97123-8899',
      email: 'marcelo.pires@nogueiraeng.com.br',
      cidade: 'Barueri',
      estado: 'SP',
      origem: OrigemLead.CONSTRUTORA,
      campanha: 'Parceria Alphaville AlphaZero',
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedorId,
      qualificado: false,
      ultimaInteracaoEm: DateTime.now().minus({ hours: 6 }),
      createdAt: DateTime.now().minus({ days: 2 }),
    })

    await InteracaoLead.create({
      leadId: lead2.id,
      responsavelId: vendedorId,
      tipo: 'ligacao',
      resumo: 'Contato telefônico: cliente comprou casa em Alphaville Residencial 2. Previsão de entrega das chaves em 60 dias. Verificando orçamento estimado (R$ 150k a R$ 200k).',
      createdAt: DateTime.now().minus({ hours: 6 }),
    })

    // 3. Lead Em Visita (Qualificado)
    const lead3 = await Lead.create({
      nome: 'Beatriz Albuquerque & Roberto',
      telefone: '(11) 99881-2233',
      email: 'beatriz.arq@estudioalbuquerque.com.br',
      cidade: 'São Paulo',
      estado: 'SP',
      origem: OrigemLead.ARQUITETO,
      campanha: 'Especificação Arq. Beatriz',
      statusFunil: StatusFunil.EM_VISITA,
      vendedorId: vendedorId,
      qualificado: true,
      ultimaInteracaoEm: DateTime.now().minus({ days: 1 }),
      createdAt: DateTime.now().minus({ days: 7 }),
    })

    await InteracaoLead.create({
      leadId: lead3.id,
      responsavelId: vendedorId,
      tipo: 'visita',
      resumo: 'Visita ao showroom da Líder realizada com os clientes e o arquiteto. Encantados com acabamento em lâmina natural e iluminação embutida.',
      createdAt: DateTime.now().minus({ days: 1 }),
    })

    // 4. Lead Em Briefing (Qualificado)
    const lead4 = await Lead.create({
      nome: 'Eng. Fernando Siqueira',
      telefone: '(11) 98234-5678',
      email: 'fsiqueira@techinvest.com.br',
      cidade: 'Campinas',
      estado: 'SP',
      origem: OrigemLead.INDICACAO,
      campanha: 'Indicação Dr. Carlos',
      statusFunil: StatusFunil.EM_BRIEFING,
      vendedorId: vendedorId,
      qualificado: true,
      ultimaInteracaoEm: DateTime.now().minus({ hours: 14 }),
      createdAt: DateTime.now().minus({ days: 10 }),
    })

    await InteracaoLead.create({
      leadId: lead4.id,
      responsavelId: vendedorId,
      tipo: 'reuniao',
      resumo: 'Reunião de alinhamento para preenchimento de briefing técnico. Ambientes: Cozinha, Closet Master e Home Theater.',
      createdAt: DateTime.now().minus({ hours: 14 }),
    })

    // 5. Lead Fechado
    const lead5 = await Lead.create({
      nome: 'Helena Montenegro',
      telefone: '(11) 97654-3210',
      email: 'helena.montenegro@advogados.com.br',
      cidade: 'São Paulo',
      estado: 'SP',
      origem: OrigemLead.SHOWROOM,
      campanha: 'Walk-in Showroom Jardins',
      statusFunil: StatusFunil.FECHADO,
      vendedorId: vendedorId,
      qualificado: true,
      ultimaInteracaoEm: DateTime.now().minus({ days: 2 }),
      createdAt: DateTime.now().minus({ days: 20 }),
    })

    await InteracaoLead.create({
      leadId: lead5.id,
      responsavelId: vendedorId,
      tipo: 'reuniao',
      resumo: 'Contrato assinado e entrada confirmada no financeiro! Projeto avançou para medição técnica.',
      createdAt: DateTime.now().minus({ days: 2 }),
    })

    // 6. Lead Perdido (RF004 com motivo)
    const lead6 = await Lead.create({
      nome: 'Ricardo Mendonça',
      telefone: '(11) 96543-2109',
      email: 'ricardo.mendonca@gmail.com',
      cidade: 'Santo André',
      estado: 'SP',
      origem: OrigemLead.SITE_GOOGLE,
      campanha: 'Google Ads - Móveis Planejados SP',
      statusFunil: StatusFunil.PERDIDO,
      motivoPerda: 'Optou por marcenaria local de bairro por motivo de prazo emergencial (precisava em 15 dias).',
      concorrentePerdido: 'Marcenaria Artesanal ABC',
      vendedorId: vendedorId,
      qualificado: true,
      ultimaInteracaoEm: DateTime.now().minus({ days: 8 }),
      createdAt: DateTime.now().minus({ days: 15 }),
    })

    await InteracaoLead.create({
      leadId: lead6.id,
      responsavelId: gerenteId,
      tipo: 'ligacao',
      resumo: 'Ligação de encerramento. Cliente agradeceu o atendimento mas tinha urgência imediata inegociável.',
      createdAt: DateTime.now().minus({ days: 8 }),
    })

    console.log('[Seeder] Leads e Interações de teste inseridos com sucesso!')
  }
}
