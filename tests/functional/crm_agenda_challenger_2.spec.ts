import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User, { PerfilUsuario } from '#models/user'
import Lead, { StatusFunil } from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'
import CompromissoAgenda, { StatusCompromisso } from '#models/compromisso_agenda'

async function garantirUsuario(dados: {
  nome: string
  email: string
  perfil: PerfilUsuario
  isActive?: boolean
}) {
  const existente = await User.findBy('email', dados.email)
  if (existente) {
    if (dados.isActive !== undefined && existente.isActive !== dados.isActive) {
      existente.isActive = dados.isActive
      await existente.save()
    }
    return existente
  }

  return User.create({
    nome: dados.nome,
    email: dados.email,
    password: 'Password123!',
    perfil: dados.perfil,
    isActive: dados.isActive !== undefined ? dados.isActive : true,
    isSuperuser: false,
  })
}

test.group('Challenger 2 — Integração CRM, Linha do Tempo e Ausência de N+1', (group) => {
  const compromissosCriados: number[] = []
  const leadsCriados: number[] = []
  const tiposCriados: number[] = []
  let tipoPadraoId: number

  group.setup(async () => {
    let tipo = await TipoCompromissoCatalogo.query().where('isActive', true).first()
    if (!tipo) {
      tipo = await TipoCompromissoCatalogo.create({
        nome: 'Reunião Challenger 2',
        slug: 'reuniao_challenger_2',
        cor: '#3B82F6',
        isActive: true,
        ordem: 1,
      })
      tiposCriados.push(tipo.id)
    }
    tipoPadraoId = tipo.id
  })

  group.each.teardown(async () => {
    if (compromissosCriados.length) {
      await CompromissoAgenda.query().whereIn('id', compromissosCriados).delete()
      compromissosCriados.length = 0
    }
    if (leadsCriados.length) {
      await InteracaoLead.query().whereIn('lead_id', leadsCriados).delete()
      await Lead.query().whereIn('id', leadsCriados).delete()
      leadsCriados.length = 0
    }
  })

  group.teardown(async () => {
    if (tiposCriados.length) {
      await TipoCompromissoCatalogo.query().whereIn('id', tiposCriados).delete()
    }
  })

  // =========================================================================
  // 1. TESTE EMPÍRICO: BADGE DO LEAD CARD E URGÊNCIA CROMÁTICA
  // =========================================================================

  test('[LEADCARD-BADGE-01] Validar que o LeadCard recebe o badge do próximo compromisso com status de urgência correto (Hoje: Azul, Atrasado: Vermelho, Futuro: Neutro)', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger Badge',
      email: 'vendedor.challenger.badge@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    // Lead 1: Compromisso para HOJE
    const leadHoje = await Lead.create({
      nome: 'Lead Compromisso Hoje',
      telefone: `(11) 91${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(leadHoje.id)

    const agoraUtc = DateTime.now().toUTC()
    const inicioHoje = agoraUtc.hour >= 23 ? agoraUtc.plus({ minutes: 5 }) : agoraUtc.plus({ hours: 1 })
    const compHoje = await CompromissoAgenda.create({
      titulo: 'Visita Técnica Hoje',
      tipoId: tipoPadraoId,
      dataHoraInicio: inicioHoje,
      dataHoraFim: inicioHoje.plus({ minutes: 20 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: leadHoje.id,
    })
    compromissosCriados.push(compHoje.id)

    // Lead 2: Compromisso ATRASADO (fim já passou)
    const leadAtrasado = await Lead.create({
      nome: 'Lead Compromisso Atrasado',
      telefone: `(11) 92${Date.now().toString().slice(-7)}`,
      origem: 'site_google',
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(leadAtrasado.id)

    const compAtrasado = await CompromissoAgenda.create({
      titulo: 'Reunião Atrasada',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 3 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 2 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: leadAtrasado.id,
    })
    compromissosCriados.push(compAtrasado.id)

    // Lead 3: Compromisso FUTURO (daqui a 3 dias)
    const leadFuturo = await Lead.create({
      nome: 'Lead Compromisso Futuro',
      telefone: `(11) 93${Date.now().toString().slice(-7)}`,
      origem: 'indicacao',
      statusFunil: StatusFunil.EM_VISITA,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(leadFuturo.id)

    const compFuturo = await CompromissoAgenda.create({
      titulo: 'Apresentação Futura',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 3, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 3, hours: 3 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: leadFuturo.id,
    })
    compromissosCriados.push(compFuturo.id)

    // Consulta o CRM
    const response = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const props = response.body()

    // 1. Lead Hoje
    const lHoje = props.leads.find((l: any) => l.id === leadHoje.id)
    assert.isNotNull(lHoje)
    assert.isNotNull(lHoje.proximoCompromisso)
    assert.equal(lHoje.proximoCompromisso.id, compHoje.id)
    assert.isTrue(lHoje.proximoCompromisso.isHoje, 'Deveria ser isHoje = true')
    assert.isFalse(lHoje.proximoCompromisso.isAtrasado, 'Não deveria ser isAtrasado')
    assert.equal(lHoje.proximoCompromisso.responsavelNome, vendedor.nome)

    // 2. Lead Atrasado
    const lAtrasado = props.leads.find((l: any) => l.id === leadAtrasado.id)
    assert.isNotNull(lAtrasado)
    assert.isNotNull(lAtrasado.proximoCompromisso)
    assert.equal(lAtrasado.proximoCompromisso.id, compAtrasado.id)
    assert.isTrue(lAtrasado.proximoCompromisso.isAtrasado, 'Deveria ser isAtrasado = true')

    // 3. Lead Futuro
    const lFuturo = props.leads.find((l: any) => l.id === leadFuturo.id)
    assert.isNotNull(lFuturo)
    assert.isNotNull(lFuturo.proximoCompromisso)
    assert.equal(lFuturo.proximoCompromisso.id, compFuturo.id)
    assert.isFalse(lFuturo.proximoCompromisso.isHoje, 'Não deveria ser isHoje')
    assert.isFalse(lFuturo.proximoCompromisso.isAtrasado, 'Não deveria ser isAtrasado')
  })

  // =========================================================================
  // 2. TESTE EMPÍRICO: LEADDRAWER SEÇÃO DE COMPROMISSOS
  // =========================================================================

  test('[LEADDRAWER-01] Validar que o LeadDrawer recebe a seção de compromissos completa com status, tipo, responsável e desfecho quando concluído', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger Drawer',
      email: 'vendedor.challenger.drawer@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead com Múltiplos Compromissos',
      telefone: `(11) 94${Date.now().toString().slice(-7)}`,
      origem: 'construtora',
      statusFunil: StatusFunil.EM_PROJETO,
      vendedorId: vendedor.id,
      qualificado: true,
    })
    leadsCriados.push(lead.id)

    // Compromisso 1: Agendado
    const comp1 = await CompromissoAgenda.create({
      titulo: 'Reunião de Alinhamento 1',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 1, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 1, hours: 3 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      local: 'Showroom Principal',
      observacoes: 'Apresentar amostras de acabamento',
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp1.id)

    // Compromisso 2: Concluído com Desfecho
    const comp2 = await CompromissoAgenda.create({
      titulo: 'Briefing Inicial Concluído',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ days: 2, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ days: 2, hours: 1 }).toUTC(),
      status: StatusCompromisso.CONCLUIDO,
      desfecho: 'Cliente solicitou inclusão de área gourmet no projeto.',
      local: 'Loja',
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp2.id)

    const response = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const props = response.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)

    assert.isNotNull(leadRetornado)
    assert.equal(leadRetornado.compromissos.length, 2)

    // Encontra comp2 (concluído)
    const itemConcluido = leadRetornado.compromissos.find((c: any) => c.id === comp2.id)
    assert.isNotNull(itemConcluido)
    assert.equal(itemConcluido.status, 'concluido')
    assert.equal(itemConcluido.desfecho, 'Cliente solicitou inclusão de área gourmet no projeto.')
    assert.equal(itemConcluido.responsavelNome, vendedor.nome)
    assert.isNotNull(itemConcluido.tipo)
    assert.equal(itemConcluido.tipo.id, tipoPadraoId)

    // Encontra comp1 (agendado)
    const itemAgendado = leadRetornado.compromissos.find((c: any) => c.id === comp1.id)
    assert.isNotNull(itemAgendado)
    assert.equal(itemAgendado.status, 'agendado')
    assert.isNull(itemAgendado.desfecho)
    assert.equal(itemAgendado.local, 'Showroom Principal')
    assert.equal(itemAgendado.observacoes, 'Apresentar amostras de acabamento')
  })

  // =========================================================================
  // 3. TESTE EMPÍRICO: AGENDAMENTO A PARTIR DO LEADDRAWER
  // =========================================================================

  test('[LEADDRAWER-SCHEDULE-01] Validar que o agendamento a partir do LeadDrawer vincula o lead correto e atualiza ultimaInteracaoEm', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger Schedule',
      email: 'vendedor.challenger.schedule@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Para Agendamento Via Drawer',
      telefone: `(11) 96${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    const dataInicio = DateTime.now().plus({ days: 2, hours: 14 }).toUTC()
    const dataFim = DateTime.now().plus({ days: 2, hours: 15 }).toUTC()

    // Requisição enviada pelo ModalNovoCompromisso a partir do LeadDrawer
    const responseAgendar = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Visita Agendada Via Drawer',
        tipoId: tipoPadraoId,
        dataHoraInicio: dataInicio.toISO(),
        dataHoraFim: dataFim.toISO(),
        local: 'Obra do Cliente',
        leadId: lead.id,
        observacoes: 'Vínculo feito direto do LeadDrawer',
      })

    responseAgendar.assertStatus(201)
    const compCriadoBody = responseAgendar.body().compromisso
    assert.isNotNull(compCriadoBody)
    assert.equal(compCriadoBody.leadId, lead.id)
    compromissosCriados.push(compCriadoBody.id)

    // Verifica persistência no banco
    const compBanco = await CompromissoAgenda.findOrFail(compCriadoBody.id)
    assert.equal(compBanco.leadId, lead.id)
    assert.equal(compBanco.responsavelId, vendedor.id)

    // Verifica que Lead.ultimaInteracaoEm foi atualizado
    await lead.refresh()
    assert.isNotNull(lead.ultimaInteracaoEm)

    // Verifica que GET /crm agora reflete o compromisso no lead
    const resCrm = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    resCrm.assertStatus(200)
    const props = resCrm.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)

    assert.isNotNull(leadRetornado)
    assert.equal(leadRetornado.compromissos.length, 1)
    assert.equal(leadRetornado.compromissos[0].id, compCriadoBody.id)
    assert.equal(leadRetornado.proximoCompromisso.id, compCriadoBody.id)
  })

  // =========================================================================
  // 4. TESTE EMPÍRICO: CONCLUSÃO DE COMPROMISSO E LINHA DO TEMPO IMEDIATA
  // =========================================================================

  test('[TIMELINE-01] Validar que a conclusão de compromisso reflete imediatamente na linha do tempo do lead e atualiza o badge', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger Timeline',
      email: 'vendedor.challenger.timeline@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Teste Timeline Imediata',
      telefone: `(11) 97${Date.now().toString().slice(-7)}`,
      origem: 'showroom',
      statusFunil: StatusFunil.EM_VISITA,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    // Cria compromisso
    const comp = await CompromissoAgenda.create({
      titulo: 'Visita Showroom com Amostras',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp.id)

    // 1. Antes da conclusão: no CRM o lead tem proximoCompromisso
    const resAntes = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')
    resAntes.assertStatus(200)
    const leadAntes = resAntes.body().leads.find((l: any) => l.id === lead.id)
    assert.isNotNull(leadAntes.proximoCompromisso)
    assert.equal(leadAntes.interacoes.length, 0)

    // 2. Conclui compromisso com desfecho
    const desfechoTexto = 'Cliente escolheu acabamento MDF Carvalho e solicitou proposta formal.'
    const resConcluir = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: desfechoTexto,
      })
    resConcluir.assertStatus(200)

    // 3. Imediatamente após a conclusão: GET /crm
    const resDepois = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')
    resDepois.assertStatus(200)
    const leadDepois = resDepois.body().leads.find((l: any) => l.id === lead.id)

    // O próximo compromisso em aberto agora é null (badge desaparece do LeadCard)
    assert.isNull(leadDepois.proximoCompromisso, 'Próximo compromisso deve ser null após conclusão')

    // Na linha do tempo (interacoes do lead), a interação de reunião foi criada
    assert.equal(leadDepois.interacoes.length, 1)
    const interacao = leadDepois.interacoes[0]
    assert.equal(interacao.tipo, 'reuniao')
    assert.include(interacao.resumo, 'Visita Showroom com Amostras')
    assert.include(interacao.resumo, desfechoTexto)
    assert.equal(interacao.responsavel.id, vendedor.id)

    // Na lista de compromissos do lead, o status está concluído com o desfecho
    assert.equal(leadDepois.compromissos.length, 1)
    assert.equal(leadDepois.compromissos[0].status, 'concluido')
    assert.equal(leadDepois.compromissos[0].desfecho, desfechoTexto)
  })

  // =========================================================================
  // 5. TESTE EMPÍRICO: AUSÊNCIA DE CONSULTAS N+1 NO ENDPOINT DO CRM
  // =========================================================================

  test('[N_PLUS_ONE-01] Validar que o endpoint /crm executa um número constante de queries SQL (ausência de N+1) ao aumentar o número de leads', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger NPlusOne',
      email: 'vendedor.challenger.nplusone@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    // Cenário 1: Apenas 1 lead com compromissos e interações
    const lead1 = await Lead.create({
      nome: 'Lead N+1 Benchmark 1',
      telefone: `(11) 98${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: true,
    })
    leadsCriados.push(lead1.id)

    const c1 = await CompromissoAgenda.create({
      titulo: 'Comp 1 Lead 1',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ hours: 1 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ hours: 2 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead1.id,
    })
    compromissosCriados.push(c1.id)

    await InteracaoLead.create({
      leadId: lead1.id,
      responsavelId: vendedor.id,
      tipo: 'whatsapp',
      resumo: 'Contato inicial via WhatsApp',
    })

    // Mede queries para 1 lead
    let queriesLead1 = 0
    const queriesList1: string[] = []
    const listener1 = (q: any) => {
      queriesLead1++
      queriesList1.push(q.sql)
    }

    const knexClient = (db.connection() as any).getReadClient()
    knexClient.on('query', listener1)
    const res1 = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')
    knexClient.off('query', listener1)

    res1.assertStatus(200)
    const props1 = res1.body()
    assert.equal(props1.leads.length, 1)

    // Cenário 2: Adiciona mais 9 leads (total 10 leads), cada um com compromisso e interação
    for (let i = 2; i <= 10; i++) {
      const l = await Lead.create({
        nome: `Lead N+1 Benchmark ${i}`,
        telefone: `(11) 98${(Date.now() + i).toString().slice(-7)}`,
        origem: 'instagram',
        statusFunil: StatusFunil.NOVO_LEAD,
        vendedorId: vendedor.id,
        qualificado: true,
      })
      leadsCriados.push(l.id)

      const c = await CompromissoAgenda.create({
        titulo: `Comp Lead ${i}`,
        tipoId: tipoPadraoId,
        dataHoraInicio: DateTime.now().plus({ hours: i }).toUTC(),
        dataHoraFim: DateTime.now().plus({ hours: i + 1 }).toUTC(),
        status: StatusCompromisso.AGENDADO,
        responsavelId: vendedor.id,
        criadoPorId: vendedor.id,
        leadId: l.id,
      })
      compromissosCriados.push(c.id)

      await InteracaoLead.create({
        leadId: l.id,
        responsavelId: vendedor.id,
        tipo: 'whatsapp',
        resumo: `Interação Lead ${i}`,
      })
    }

    // Mede queries para 10 leads
    let queriesLead10 = 0
    const queriesList10: string[] = []
    const listener10 = (q: any) => {
      queriesLead10++
      queriesList10.push(q.sql)
    }

    knexClient.on('query', listener10)
    const res10 = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')
    knexClient.off('query', listener10)

    res10.assertStatus(200)
    const props10 = res10.body()
    assert.equal(props10.leads.length, 10)

    // Se houvesse N+1 queries, queriesLead10 seria muito maior do que queriesLead1:
    // Pelo menos 9 * (compromissos + tipo + responsavel + interacoes + historico) = ~45 queries adicionais.
    // Com eager loading Lucid .preload(), o número de queries é EXATAMENTE O MESMO (O(1)).
    assert.equal(
      queriesLead10,
      queriesLead1,
      `Possível N+1 detectado! Com 1 lead: ${queriesLead1} queries. Com 10 leads: ${queriesLead10} queries. Queries executadas:\n${queriesList10.join('\n')}`
    )
  })

  // =========================================================================
  // 6. TESTES ADVERSARIAIS ADICIONAIS: ORDENAÇÃO, REAGENDAMENTO E CARACTERES
  // =========================================================================

  test('[ADVERSARIAL-TIEBREAK] Prioridade cronológica: escolhe rigorosamente o compromisso mais próximo entre múltiplos agendados', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger TieBreak',
      email: 'vendedor.challenger.tiebreak@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Múltiplos Horários Hoje',
      telefone: `(11) 99${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    // Compromisso 1: Hoje às 17h (ou mais tarde hoje)
    const agoraUtc2 = DateTime.now().toUTC()
    const inicioCedo = agoraUtc2.hour >= 23 ? agoraUtc2.plus({ minutes: 5 }) : agoraUtc2.plus({ minutes: 30 })
    const inicioTarde = agoraUtc2.hour >= 23 ? agoraUtc2.plus({ minutes: 20 }) : agoraUtc2.plus({ hours: 2 })

    const cTarde = await CompromissoAgenda.create({
      titulo: 'Reunião Tarde',
      tipoId: tipoPadraoId,
      dataHoraInicio: inicioTarde,
      dataHoraFim: inicioTarde.plus({ minutes: 15 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cTarde.id)

    // Compromisso 2: Hoje às 14h (mais cedo)
    const cCedo = await CompromissoAgenda.create({
      titulo: 'Reunião Cedo',
      tipoId: tipoPadraoId,
      dataHoraInicio: inicioCedo,
      dataHoraFim: inicioCedo.plus({ minutes: 10 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cCedo.id)

    // Compromisso 3: Reagendado para amanhã
    const cAmanha = await CompromissoAgenda.create({
      titulo: 'Reunião Amanhã',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 1, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 1, hours: 3 }).toUTC(),
      status: StatusCompromisso.REAGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cAmanha.id)

    const response = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const props = response.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)

    assert.isNotNull(leadRetornado)
    assert.isNotNull(leadRetornado.proximoCompromisso)
    // O mais próximo é rigorosamente cCedo
    assert.equal(leadRetornado.proximoCompromisso.id, cCedo.id)
    assert.equal(leadRetornado.proximoCompromisso.titulo, 'Reunião Cedo')
    assert.isTrue(leadRetornado.proximoCompromisso.isHoje)
  })

  test('[ADVERSARIAL-STATUS-FILTER] Compromissos cancelados e concluídos são ignorados para proximoCompromisso, mas reagendados são considerados', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger StatusFilter',
      email: 'vendedor.challenger.statusfilter@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Status Filter Test',
      telefone: `(11) 99${Date.now().toString().slice(-7)}`,
      origem: 'site_google',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    // Cancelado (no passado)
    const cCancelado = await CompromissoAgenda.create({
      titulo: 'Comp Cancelado',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ days: 1 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ days: 1, hours: -1 }).toUTC(),
      status: StatusCompromisso.CANCELADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cCancelado.id)

    // Concluído (no passado)
    const cConcluido = await CompromissoAgenda.create({
      titulo: 'Comp Concluído',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 4 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 3 }).toUTC(),
      status: StatusCompromisso.CONCLUIDO,
      desfecho: 'Tudo certo',
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cConcluido.id)

    // Reagendado (no futuro)
    const cReagendado = await CompromissoAgenda.create({
      titulo: 'Comp Reagendado Ativo',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 2 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 2, hours: 1 }).toUTC(),
      status: StatusCompromisso.REAGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(cReagendado.id)

    const response = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const props = response.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)

    assert.isNotNull(leadRetornado)
    assert.isNotNull(leadRetornado.proximoCompromisso)
    assert.equal(leadRetornado.proximoCompromisso.id, cReagendado.id)
    assert.equal(leadRetornado.compromissos.length, 3)
  })

  test('[ADVERSARIAL-TIMELINE-RICH-TEXT] Conclusão com texto longo, quebras de linha e caracteres especiais preserva integridade na timeline', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Challenger RichText',
      email: 'vendedor.challenger.richtext@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Rich Text Test',
      telefone: `(11) 98${Date.now().toString().slice(-7)}`,
      origem: 'showroom',
      statusFunil: StatusFunil.EM_FECHAMENTO,
      vendedorId: vendedor.id,
      qualificado: true,
    })
    leadsCriados.push(lead.id)

    const comp = await CompromissoAgenda.create({
      titulo: 'Apresentação Final de Projeto (Cozinha & Suíte Master)',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp.id)

    const desfechoComplexo = `Reunião concluída com 100% de aprovação! 🎉\n- Ajustes definidos no vão da torre quente (60cm);\n- Orçamento fechado em R$ 145.000,00 com entrada de 30% + 10x sem juros;\n- Especificadora Arq. Juliana aprovou detalhamento de iluminação em LED.`

    const resConcluir = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: desfechoComplexo,
      })
    resConcluir.assertStatus(200)

    const resCrm = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')
    resCrm.assertStatus(200)
    const leadRetornado = resCrm.body().leads.find((l: any) => l.id === lead.id)

    assert.isNotNull(leadRetornado)
    assert.equal(leadRetornado.interacoes.length, 1)
    assert.include(leadRetornado.interacoes[0].resumo, 'Apresentação Final de Projeto (Cozinha & Suíte Master)')
    assert.include(leadRetornado.interacoes[0].resumo, '100% de aprovação! 🎉')
    assert.include(leadRetornado.interacoes[0].resumo, 'R$ 145.000,00')
    assert.equal(leadRetornado.compromissos[0].desfecho, desfechoComplexo)
  })

  test('[ADVERSARIAL-N_PLUS_ONE-GESTOR] Visão de Diretoria com múltiplos vendedores preserva consultas O(1) sem N+1', async ({
    client,
    assert,
  }) => {
    const diretoria = await garantirUsuario({
      nome: 'Diretoria Challenger NPlusOne',
      email: 'diretoria.challenger.nplusone@lidermoveis.com.br',
      perfil: PerfilUsuario.DIRETORIA,
    })

    const vendedorA = await garantirUsuario({
      nome: 'Vendedor Equipe A',
      email: 'vendedor.a.nplusone@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const vendedorB = await garantirUsuario({
      nome: 'Vendedor Equipe B',
      email: 'vendedor.b.nplusone@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    // Cria 3 leads para vendedor A e 3 leads para vendedor B
    for (let i = 1; i <= 3; i++) {
      const la = await Lead.create({
        nome: `Lead Gestor A-${i}`,
        telefone: `(11) 91${(Date.now() + i).toString().slice(-7)}`,
        origem: 'instagram',
        statusFunil: StatusFunil.NOVO_LEAD,
        vendedorId: vendedorA.id,
      })
      leadsCriados.push(la.id)

      const ca = await CompromissoAgenda.create({
        titulo: `Comp A-${i}`,
        tipoId: tipoPadraoId,
        dataHoraInicio: DateTime.now().plus({ hours: i }).toUTC(),
        dataHoraFim: DateTime.now().plus({ hours: i + 1 }).toUTC(),
        status: StatusCompromisso.AGENDADO,
        responsavelId: vendedorA.id,
        criadoPorId: vendedorA.id,
        leadId: la.id,
      })
      compromissosCriados.push(ca.id)

      const lb = await Lead.create({
        nome: `Lead Gestor B-${i}`,
        telefone: `(11) 92${(Date.now() + i).toString().slice(-7)}`,
        origem: 'site_google',
        statusFunil: StatusFunil.EM_PROJETO,
        vendedorId: vendedorB.id,
      })
      leadsCriados.push(lb.id)

      const cb = await CompromissoAgenda.create({
        titulo: `Comp B-${i}`,
        tipoId: tipoPadraoId,
        dataHoraInicio: DateTime.now().plus({ hours: i + 2 }).toUTC(),
        dataHoraFim: DateTime.now().plus({ hours: i + 3 }).toUTC(),
        status: StatusCompromisso.AGENDADO,
        responsavelId: vendedorB.id,
        criadoPorId: vendedorB.id,
        leadId: lb.id,
      })
      compromissosCriados.push(cb.id)
    }

    let queriesGestor = 0
    const queriesGestorList: string[] = []
    const listenerGestor = (q: any) => {
      queriesGestor++
      queriesGestorList.push(q.sql)
    }

    const knexClient = (db.connection() as any).getReadClient()
    knexClient.on('query', listenerGestor)
    const resGestor = await client
      .get('/crm')
      .loginAs(diretoria)
      .header('accept', 'application/json')
    knexClient.off('query', listenerGestor)

    resGestor.assertStatus(200)
    const props = resGestor.body()
    // Assegura que o gestor vê leads de múltiplos vendedores
    assert.isTrue(props.leads.length >= 6)
    assert.isBelow(
      queriesGestor,
      25,
      `Consultas excessivas detectadas para Gestor: ${queriesGestor} queries.`
    )
  })
})
