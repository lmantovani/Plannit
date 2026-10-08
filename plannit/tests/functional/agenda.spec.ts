import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User, { PerfilUsuario } from '#models/user'
import Lead, { StatusFunil } from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'
import CompromissoAgenda, { StatusCompromisso } from '#models/compromisso_agenda'

async function garantirUsuario(dados: {
  nome: string
  email: string
  perfil: PerfilUsuario
}) {
  const existente = await User.findBy('email', dados.email)
  if (existente) return existente

  return User.create({
    nome: dados.nome,
    email: dados.email,
    password: 'Password123!',
    perfil: dados.perfil,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('Módulo de Agenda — Backend & RBAC', (group) => {
  const compromissosCriados: number[] = []
  const leadsCriados: number[] = []
  let tipoPadraoId: number

  group.setup(async () => {
    // Garante que haja ao menos um tipo de compromisso ativo no catálogo
    let tipo = await TipoCompromissoCatalogo.query().where('isActive', true).first()
    if (!tipo) {
      tipo = await TipoCompromissoCatalogo.create({
        nome: 'Reunião de Teste',
        slug: 'reuniao_teste_agenda',
        cor: '#3B82F6',
        isActive: true,
        ordem: 1,
      })
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

  test('bloqueia acesso não autenticado na rota /agenda', async ({ client }) => {
    const response = await client.get('/agenda')
    response.assertRedirectsTo('/login')
  })

  test('bloqueia criação de compromisso sem autenticação (redireciona em form e 401 em JSON)', async ({
    client,
  }) => {
    const resForm = await client
      .post('/agenda/compromissos')
      .withCsrfToken()
      .form({
        titulo: 'Reunião Não Autenticada',
        tipoId: tipoPadraoId,
      })
    resForm.assertRedirectsTo('/login')

    const resJson = await client
      .post('/agenda/compromissos')
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Reunião Não Autenticada',
        tipoId: tipoPadraoId,
        dataHoraInicio: DateTime.now().plus({ hours: 1 }).toISO(),
        dataHoraFim: DateTime.now().plus({ hours: 2 }).toISO(),
      })
    resJson.assertStatus(401)
  })

  test('vendedor cria compromisso com sucesso e responsavelId é fixado no seu ID', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 1, hours: 10 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 1, hours: 11 }).toUTC().toISO()

    const response = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Visita Técnica no Local',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        local: 'Av. Paulista, 1000 - Apto 51',
        observacoes: 'Levar trena a laser e amostras de acabamento.',
      })

    response.assertStatus(201)
    const body = response.body()
    assert.isNotNull(body.compromisso)
    assert.equal(body.compromisso.titulo, 'Visita Técnica no Local')
    assert.equal(body.compromisso.responsavelId, vendedor.id)
    assert.equal(body.compromisso.criadoPorId, vendedor.id)
    assert.equal(body.compromisso.status, StatusCompromisso.AGENDADO)

    compromissosCriados.push(body.compromisso.id)
  })

  test('vendedor não consegue forçar responsavelId de outro colaborador', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor 2 Agenda',
      email: 'vendedor2.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 2, hours: 14 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 2, hours: 15 }).toUTC().toISO()

    const response = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Reunião Tentativa Spoofing',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        responsavelId: vendedor2.id, // Vendedor 1 tentando atribuir a outro
      })

    response.assertStatus(201)
    const body = response.body()
    // O backend forçou para vendedor1.id
    assert.equal(body.compromisso.responsavelId, vendedor1.id)
    compromissosCriados.push(body.compromisso.id)
  })

  test('gestor (Diretoria) consegue agendar compromisso atribuído a outro colaborador', async ({
    client,
    assert,
  }) => {
    const diretoria = await garantirUsuario({
      nome: 'Diretoria Agenda',
      email: 'diretoria.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.DIRETORIA,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor 2 Agenda',
      email: 'vendedor2.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 3, hours: 9 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 3, hours: 10 }).toUTC().toISO()

    const response = await client
      .post('/agenda/compromissos')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Apresentação Comercial Designada',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        responsavelId: vendedor2.id,
      })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.compromisso.responsavelId, vendedor2.id)
    assert.equal(body.compromisso.criadoPorId, diretoria.id)
    compromissosCriados.push(body.compromisso.id)
  })

  test('rejeita agendamento com data/hora de término anterior ou igual ao início', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 1, hours: 15 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 1, hours: 14 }).toUTC().toISO() // Término antes do início

    const response = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Reunião Horário Inválido',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
      })

    response.assertStatus(400)
    assert.include(
      response.body().message,
      'A data e horário de término devem ser posteriores ao início'
    )
  })

  test('isolamento por perfil na listagem: vendedor vê apenas seus compromissos, gestão vê de todos', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor 2 Agenda',
      email: 'vendedor2.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const diretoria = await garantirUsuario({
      nome: 'Diretoria Agenda',
      email: 'diretoria.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.DIRETORIA,
    })

    const comp1 = await CompromissoAgenda.create({
      titulo: 'Compromisso Exclusivo Vendedor 1',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 4, hours: 10 }),
      dataHoraFim: DateTime.now().plus({ days: 4, hours: 11 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp1.id)

    const comp2 = await CompromissoAgenda.create({
      titulo: 'Compromisso Exclusivo Vendedor 2',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 4, hours: 14 }),
      dataHoraFim: DateTime.now().plus({ days: 4, hours: 15 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor2.id,
      criadoPorId: vendedor2.id,
    })
    compromissosCriados.push(comp2.id)

    // Vendedor 1 requisita a listagem
    const resV1 = await client
      .get('/agenda')
      .loginAs(vendedor1)
      .header('accept', 'application/json')
    resV1.assertStatus(200)
    const idsV1 = resV1.body().compromissos.map((c: any) => c.id)
    assert.include(idsV1, comp1.id)
    assert.notInclude(idsV1, comp2.id)
    assert.isFalse(resV1.body().podeVerEquipe)

    // Vendedor 2 requisita a listagem
    const resV2 = await client
      .get('/agenda')
      .loginAs(vendedor2)
      .header('accept', 'application/json')
    resV2.assertStatus(200)
    const idsV2 = resV2.body().compromissos.map((c: any) => c.id)
    assert.include(idsV2, comp2.id)
    assert.notInclude(idsV2, comp1.id)

    // Gestor (Diretoria) requisita na visão equipe
    const resGestor = await client
      .get('/agenda?visao=equipe')
      .loginAs(diretoria)
      .header('accept', 'application/json')
    resGestor.assertStatus(200)
    const idsGestor = resGestor.body().compromissos.map((c: any) => c.id)
    assert.include(idsGestor, comp1.id)
    assert.include(idsGestor, comp2.id)
    assert.isTrue(resGestor.body().podeVerEquipe)

    // Gestor filtra especificamente por Vendedor 1
    const resFiltro = await client
      .get(`/agenda?visao=equipe&responsavelId=${vendedor1.id}`)
      .loginAs(diretoria)
      .header('accept', 'application/json')
    resFiltro.assertStatus(200)
    const idsFiltro = resFiltro.body().compromissos.map((c: any) => c.id)
    assert.include(idsFiltro, comp1.id)
    assert.notInclude(idsFiltro, comp2.id)
  })

  test('atualização de compromisso: bloqueia com 403 se outro vendedor tentar editar', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor 2 Agenda',
      email: 'vendedor2.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Original',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 5, hours: 10 }),
      dataHoraFim: DateTime.now().plus({ days: 5, hours: 11 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp.id)

    // Vendedor 2 tenta alterar o compromisso do Vendedor 1
    const resV2 = await client
      .put(`/agenda/compromissos/${comp.id}`)
      .loginAs(vendedor2)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ titulo: 'Tentativa Hacker de Edição' })

    resV2.assertStatus(403)
    assert.include(resV2.body().message, 'Você não tem permissão para editar este compromisso')

    // Vendedor 1 altera seu próprio compromisso
    const resV1 = await client
      .put(`/agenda/compromissos/${comp.id}`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ titulo: 'Título Atualizado pelo Dono' })

    resV1.assertStatus(200)
    await comp.refresh()
    assert.equal(comp.titulo, 'Título Atualizado pelo Dono')
  })

  test('reagendamento altera status para reagendado e atualiza horários', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso para Reagendamento',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 6, hours: 9 }),
      dataHoraFim: DateTime.now().plus({ days: 6, hours: 10 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp.id)

    const novoInicio = DateTime.now().plus({ days: 7, hours: 14 }).toUTC().toISO()
    const novoFim = DateTime.now().plus({ days: 7, hours: 15 }).toUTC().toISO()

    const response = await client
      .patch(`/agenda/compromissos/${comp.id}/reagendar`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: novoInicio,
        dataHoraFim: novoFim,
        observacoes: 'Cliente pediu para adiar para o dia seguinte',
      })

    response.assertStatus(200)
    await comp.refresh()
    assert.equal(comp.status, StatusCompromisso.REAGENDADO)
    assert.include(comp.observacoes || '', '[Reagendado]: Cliente pediu para adiar')
  })

  test('cancelamento altera status para cancelado e registra motivo', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso para Cancelar',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 8, hours: 11 }),
      dataHoraFim: DateTime.now().plus({ days: 8, hours: 12 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp.id)

    const response = await client
      .patch(`/agenda/compromissos/${comp.id}/cancelar`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        motivo: 'Cliente viajou a trabalho e desmarcou.',
      })

    response.assertStatus(200)
    await comp.refresh()
    assert.equal(comp.status, StatusCompromisso.CANCELADO)
    assert.include(comp.observacoes || '', '[Cancelado]: Cliente viajou a trabalho')
  })

  test('conclusão de compromisso vinculado a Lead grava desfecho e insere interação atômica na timeline', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Cliente Lead Timeline Teste',
      telefone: `(11) 98${Date.now().toString().slice(-7)}`,
      email: `lead.timeline.${Date.now()}@teste.com`,
      origem: 'instagram',
      statusFunil: StatusFunil.EM_VISITA,
      vendedorId: vendedor1.id,
      qualificado: true,
      faixaOrcamento: '80k_150k',
      prazoObra: 'ate_3_meses',
      tipoImovel: 'apartamento',
      ambientesInteresse: ['cozinha', 'suite'],
    })
    leadsCriados.push(lead.id)

    const comp = await CompromissoAgenda.create({
      titulo: 'Medição Técnica do Apto',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }),
      dataHoraFim: DateTime.now().minus({ hours: 1 }),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp.id)

    const desfechoTexto =
      'Medição realizada com sucesso. Vão da cozinha possui 3,45m e pé-direito de 2,60m. Cliente aprovou disposição.'

    const response = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: desfechoTexto,
      })

    response.assertStatus(200)

    // Verifica que o compromisso foi concluído com desfecho
    await comp.refresh()
    assert.equal(comp.status, StatusCompromisso.CONCLUIDO)
    assert.equal(comp.desfecho, desfechoTexto)

    // Verifica se a interação na timeline do lead foi criada
    const interacao = await InteracaoLead.query()
      .where('lead_id', lead.id)
      .orderBy('id', 'desc')
      .first()

    assert.isNotNull(interacao)
    assert.equal(interacao!.tipo, 'reuniao')
    assert.equal(interacao!.responsavelId, vendedor1.id)
    assert.include(interacao!.resumo, 'Medição Técnica do Apto')
    assert.include(interacao!.resumo, desfechoTexto)

    // Verifica atualização de ultimaInteracaoEm no Lead
    await lead.refresh()
    assert.isNotNull(lead.ultimaInteracaoEm)
  })

  test('rejeita conclusão de compromisso sem desfecho ou desfecho insuficiente', async ({
    client,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor 1 Agenda',
      email: 'vendedor1.agenda.teste@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Desfecho Inválido',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 1 }),
      dataHoraFim: DateTime.now(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp.id)

    const response = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: 'ok', // menos de 3 caracteres
      })

    response.assertStatus(422)
  })

  test('integração com CRM: carrega leads com eager loading de compromissos, cálculo de urgência e catálogo de tipos', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor CRM Agenda Teste',
      email: 'vendedor.crm.agenda@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead com Compromissos Teste',
      telefone: `(11) 98${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    // 1. Compromisso futuro (amanhã)
    const compFuturo = await CompromissoAgenda.create({
      titulo: 'Apresentação Futura',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 1, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 1, hours: 3 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(compFuturo.id)

    // 2. Compromisso para HOJE mais cedo que o futuro
    const compHoje = await CompromissoAgenda.create({
      titulo: 'Visita Técnica Hoje',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ minutes: 30 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ hours: 1, minutes: 30 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(compHoje.id)

    // Requisição JSON para o CRM
    const resCrm = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    resCrm.assertStatus(200)
    const props = resCrm.body()
    assert.isDefined(props.leads)
    assert.isDefined(props.tiposCompromissoCatalogo)

    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)
    assert.isNotNull(leadRetornado)
    assert.equal(leadRetornado.compromissos.length, 2)

    // O mais próximo é compHoje (já que a query ordena por data_hora_inicio ASC)
    assert.isNotNull(leadRetornado.proximoCompromisso)
    assert.equal(leadRetornado.proximoCompromisso.id, compHoje.id)
    assert.isTrue(leadRetornado.proximoCompromisso.isHoje)
    assert.isFalse(leadRetornado.proximoCompromisso.isAtrasado)
    assert.equal(leadRetornado.proximoCompromisso.responsavelNome, vendedor.nome)

    // Valida também que a requisição de página HTML padrão responde 200
    const resHtml = await client.get('/crm').loginAs(vendedor)
    resHtml.assertStatus(200)
  })

  test('integração com CRM: identifica compromisso atrasado quando o horário final já expirou', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor CRM Agenda Teste',
      email: 'vendedor.crm.agenda@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Atrasado Teste',
      telefone: `(11) 97${Date.now().toString().slice(-7)}`,
      origem: 'site_google',
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    // Compromisso cujo fim já passou
    const compAtrasado = await CompromissoAgenda.create({
      titulo: 'Medição Atrasada',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 3 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 2 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(compAtrasado.id)

    const resCrm = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    resCrm.assertStatus(200)
    const props = resCrm.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)
    assert.isNotNull(leadRetornado)
    assert.isNotNull(leadRetornado.proximoCompromisso)
    assert.isTrue(leadRetornado.proximoCompromisso.isAtrasado)
  })

  test('integração com CRM: compromisso concluído exibe desfecho e não é selecionado como próximo compromisso', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor CRM Agenda Teste',
      email: 'vendedor.crm.agenda@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Concluído Teste',
      telefone: `(11) 95${Date.now().toString().slice(-7)}`,
      origem: 'showroom',
      statusFunil: StatusFunil.EM_VISITA,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    const compConcluido = await CompromissoAgenda.create({
      titulo: 'Reunião Showroom Realizada',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ days: 1, hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ days: 1, hours: 1 }).toUTC(),
      status: StatusCompromisso.CONCLUIDO,
      desfecho: 'Cliente aprovou proposta inicial de briefing.',
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(compConcluido.id)

    const resCrm = await client
      .get('/crm')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    resCrm.assertStatus(200)
    const props = resCrm.body()
    const leadRetornado = props.leads.find((l: any) => l.id === lead.id)
    assert.isNotNull(leadRetornado)
    assert.isNull(leadRetornado.proximoCompromisso) // Não há compromisso pendente
    assert.equal(leadRetornado.compromissos.length, 1)
    assert.equal(leadRetornado.compromissos[0].status, 'concluido')
    assert.equal(leadRetornado.compromissos[0].desfecho, 'Cliente aprovou proposta inicial de briefing.')
  })
})
