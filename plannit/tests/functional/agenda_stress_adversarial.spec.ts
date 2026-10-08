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

test.group('Challenger 1 — Agenda RBAC, Concurrency & Adversarial Stress', (group) => {
  const compromissosCriados: number[] = []
  const leadsCriados: number[] = []
  const tiposCriados: number[] = []
  let tipoPadraoId: number
  let tipoInativoId: number

  group.setup(async () => {
    let tipo = await TipoCompromissoCatalogo.query().where('isActive', true).first()
    if (!tipo) {
      tipo = await TipoCompromissoCatalogo.create({
        nome: 'Reunião Padrão Adversarial',
        slug: 'reuniao_padrao_adv',
        cor: '#3B82F6',
        isActive: true,
        ordem: 1,
      })
      tiposCriados.push(tipo.id)
    }
    tipoPadraoId = tipo.id

    const tipoInativo = await TipoCompromissoCatalogo.create({
      nome: 'Tipo Desativado Adversarial',
      slug: `tipo_inativo_adv_${Date.now()}`,
      cor: '#94A3B8',
      isActive: false,
      ordem: 99,
    })
    tipoInativoId = tipoInativo.id
    tiposCriados.push(tipoInativo.id)
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
  // 1. TENTATIVAS DE SPOOFING DE RESPONSÁVEL POR PERFIL VENDEDOR
  // =========================================================================

  test('[SPOOFING-01] Vendedor tenta injetar responsavelId de outro vendedor no POST /agenda/compromissos', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 1, hours: 10 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 1, hours: 11 }).toUTC().toISO()

    const res = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Tentativa de Spoofing Alpha -> Beta',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        responsavelId: vendedor2.id, // Injeção de spoofing
      })

    res.assertStatus(201)
    const body = res.body()
    // Backend deve neutralizar o spoofing e atribuir ao próprio autor
    assert.equal(body.compromisso.responsavelId, vendedor1.id)
    assert.notEqual(body.compromisso.responsavelId, vendedor2.id)
    assert.equal(body.compromisso.criadoPorId, vendedor1.id)
    compromissosCriados.push(body.compromisso.id)
  })

  test('[SPOOFING-02] Vendedor tenta injetar responsavelId de Gestor no POST /agenda/compromissos', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const diretoria = await garantirUsuario({
      nome: 'Diretoria Adv',
      email: 'diretoria.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.DIRETORIA,
    })

    const inicio = DateTime.now().plus({ days: 1, hours: 14 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 1, hours: 15 }).toUTC().toISO()

    const res = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Tentativa de Spoofing Vendedor -> Diretoria',
        tipoId: tipoPadraoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        responsavelId: diretoria.id,
      })

    res.assertStatus(201)
    const body = res.body()
    assert.equal(body.compromisso.responsavelId, vendedor.id)
    assert.notEqual(body.compromisso.responsavelId, diretoria.id)
    compromissosCriados.push(body.compromisso.id)
  })

  test('[SPOOFING-03] Vendedor tenta alterar responsavelId no PUT /agenda/compromissos/:id', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Original Alpha',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 2, hours: 9 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 2, hours: 10 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor1.id,
      criadoPorId: vendedor1.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .put(`/agenda/compromissos/${comp.id}`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Tentativa Reatribuição PUT',
        responsavelId: vendedor2.id,
      })

    res.assertStatus(200)
    await comp.refresh()
    // Backend deve ignorar o responsavelId enviado por não-gestor
    assert.equal(comp.responsavelId, vendedor1.id)
    assert.notEqual(comp.responsavelId, vendedor2.id)
  })

  // =========================================================================
  // 2. CONCLUSÃO SEM DESFECHO, VAZIO OU COM CARACTERES INSUFICIENTES
  // =========================================================================

  test('[DESFECHO-01] Rejeita conclusão sem campo desfecho no payload', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Sem Desfecho',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})

    res.assertStatus(422)
  })

  test('[DESFECHO-02] Rejeita conclusão com desfecho string vazia ""', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Desfecho Vazio',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ desfecho: '' })

    res.assertStatus(422)
  })

  test('[DESFECHO-03] Rejeita conclusão com desfecho contendo apenas espaços em branco "   "', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Desfecho Espaços',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ desfecho: '     ' })

    res.assertStatus(422)
  })

  test('[DESFECHO-04] Rejeita conclusão com desfecho menor que 3 caracteres ("oi")', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Desfecho 2 Caracteres',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ desfecho: 'oi' })

    res.assertStatus(422)
  })

  // =========================================================================
  // 3. REAGENDAMENTOS COM DATAS INVÁLIDAS / INCONSISTENTES
  // =========================================================================

  test('[DATAS-01] Rejeita reagendamento com data final estritamente anterior à data inicial', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso para Reagendamento Inválido',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 3, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 3, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const novoInicio = DateTime.now().plus({ days: 4, hours: 16 }).toUTC().toISO()
    const novoFim = DateTime.now().plus({ days: 4, hours: 15 }).toUTC().toISO() // 1h antes do início

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/reagendar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: novoInicio,
        dataHoraFim: novoFim,
      })

    res.assertStatus(400)
    assert.include(
      res.body().message,
      'A nova data e horário de término devem ser posteriores ao início'
    )
  })

  test('[DATAS-02] Rejeita reagendamento com data final igual à data inicial (duração 0)', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Duração Zero',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 3, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 3, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const mesmoHorario = DateTime.now().plus({ days: 4, hours: 10 }).toUTC().toISO()

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/reagendar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: mesmoHorario,
        dataHoraFim: mesmoHorario,
      })

    res.assertStatus(400)
    assert.include(
      res.body().message,
      'A nova data e horário de término devem ser posteriores ao início'
    )
  })

  test('[DATAS-03] Rejeita reagendamento com string ISO inválida (ex.: data malformatada)', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Data Malformatada',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 3, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 3, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    const res = await client
      .patch(`/agenda/compromissos/${comp.id}/reagendar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: '2026-99-99T99:99:99Z',
        dataHoraFim: 'data_invalida',
      })

    res.assertStatus(422)
  })

  test('[DATAS-04] Rejeita PUT que atualiza apenas dataHoraInicio para além da dataHoraFim existente', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    // Compromisso de 10h às 11h
    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Update Parcial Data',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 5, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 5, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
    })
    compromissosCriados.push(comp.id)

    // Atualiza apenas o início para 12h (depois do fim existente de 11h)
    const novoInicio = DateTime.now().plus({ days: 5, hours: 12 }).toUTC().toISO()

    const res = await client
      .put(`/agenda/compromissos/${comp.id}`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: novoInicio,
      })

    res.assertStatus(400)
    assert.include(
      res.body().message,
      'A data e horário de término devem ser posteriores ao início'
    )
  })

  // =========================================================================
  // 4. TESTE DE ACESSO NÃO AUTENTICADO EM TODOS OS ENDPOINTS DA AGENDA
  // =========================================================================

  test('[AUTH-01] Todos os endpoints da Agenda bloqueiam acessos anônimos', async ({
    client,
  }) => {
    const idFake = 999999

    // 1. GET /agenda
    const resGet = await client.get('/agenda').header('accept', 'application/json')
    resGet.assertStatus(401)

    // 2. POST /agenda/compromissos
    const resPost = await client
      .post('/agenda/compromissos')
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ titulo: 'Anon', tipoId: tipoPadraoId })
    resPost.assertStatus(401)

    // 3. PUT /agenda/compromissos/:id
    const resPut = await client
      .put(`/agenda/compromissos/${idFake}`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ titulo: 'Anon' })
    resPut.assertStatus(401)

    // 4. PATCH /agenda/compromissos/:id
    const resPatch = await client
      .patch(`/agenda/compromissos/${idFake}`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ titulo: 'Anon' })
    resPatch.assertStatus(401)

    // 5. PATCH /agenda/compromissos/:id/reagendar
    const resReagendar = await client
      .patch(`/agenda/compromissos/${idFake}/reagendar`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})
    resReagendar.assertStatus(401)

    // 6. PATCH /agenda/compromissos/:id/cancelar
    const resCancelar = await client
      .patch(`/agenda/compromissos/${idFake}/cancelar`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})
    resCancelar.assertStatus(401)

    // 7. PATCH /agenda/compromissos/:id/concluir
    const resConcluir = await client
      .patch(`/agenda/compromissos/${idFake}/concluir`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})
    resConcluir.assertStatus(401)

    // 8. Endpoints de catálogo de compromisso em /configuracoes
    const resConfigPost = await client
      .post('/configuracoes/tipos-compromisso')
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ nome: 'Tentativa Anon' })
    resConfigPost.assertStatus(401)
  })

  // =========================================================================
  // 5. ISOLAMENTO HORIZONTAL E PROTEÇÃO CONTRA VAZAMENTO DE DADOS
  // =========================================================================

  test('[ISOLAMENTO-01] Vendedor A é bloqueado com 403 ao tentar reagendar compromisso do Vendedor B', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const compB = await CompromissoAgenda.create({
      titulo: 'Compromisso Privado Beta',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 5, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 5, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor2.id,
      criadoPorId: vendedor2.id,
    })
    compromissosCriados.push(compB.id)

    const res = await client
      .patch(`/agenda/compromissos/${compB.id}/reagendar`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataHoraInicio: DateTime.now().plus({ days: 6, hours: 10 }).toUTC().toISO(),
        dataHoraFim: DateTime.now().plus({ days: 6, hours: 11 }).toUTC().toISO(),
      })

    res.assertStatus(403)
    assert.include(res.body().message, 'Você não tem permissão para reagendar este compromisso')
  })

  test('[ISOLAMENTO-02] Vendedor A é bloqueado com 403 ao tentar cancelar compromisso do Vendedor B', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const compB = await CompromissoAgenda.create({
      titulo: 'Compromisso Privado Beta Cancelamento',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 5, hours: 14 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 5, hours: 15 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor2.id,
      criadoPorId: vendedor2.id,
    })
    compromissosCriados.push(compB.id)

    const res = await client
      .patch(`/agenda/compromissos/${compB.id}/cancelar`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ motivo: 'Ataque horizontal cancelamento' })

    res.assertStatus(403)
    assert.include(res.body().message, 'Você não tem permissão para cancelar este compromisso')
  })

  test('[ISOLAMENTO-03] Vendedor A é bloqueado com 403 ao tentar concluir compromisso do Vendedor B', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const compB = await CompromissoAgenda.create({
      titulo: 'Compromisso Privado Beta Conclusão',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor2.id,
      criadoPorId: vendedor2.id,
    })
    compromissosCriados.push(compB.id)

    const res = await client
      .patch(`/agenda/compromissos/${compB.id}/concluir`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ desfecho: 'Ataque horizontal de conclusão indevida' })

    res.assertStatus(403)
    assert.include(res.body().message, 'Você não tem permissão para concluir este compromisso')
  })

  test('[ISOLAMENTO-04] Vendedor não recebe lista de colaboradores nem compromissos alheios em GET /agenda', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })
    const vendedor2 = await garantirUsuario({
      nome: 'Vendedor Beta',
      email: 'vendedor.beta.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const compB = await CompromissoAgenda.create({
      titulo: 'Compromisso Privado Beta Lista',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().plus({ days: 7, hours: 10 }).toUTC(),
      dataHoraFim: DateTime.now().plus({ days: 7, hours: 11 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor2.id,
      criadoPorId: vendedor2.id,
    })
    compromissosCriados.push(compB.id)

    // Vendedor 1 tenta forçar filtros de equipe
    const res = await client
      .get(`/agenda?visao=equipe&responsavelId=${vendedor2.id}`)
      .loginAs(vendedor1)
      .header('accept', 'application/json')

    res.assertStatus(200)
    const body = res.body()

    // 1. Não pode ver equipe
    assert.isFalse(body.podeVerEquipe)
    // 2. Colaboradores deve ser vazio para perfil vendedor
    assert.deepEqual(body.colaboradores, [])
    // 3. O compromisso do Vendedor 2 NÃO deve vazar
    const ids = body.compromissos.map((c: any) => c.id)
    assert.notInclude(ids, compB.id)
  })

  test('[ISOLAMENTO-05] Vendedor tem acesso bloqueado (403) na gestão do catálogo em /configuracoes/tipos-compromisso', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const res = await client
      .post('/configuracoes/tipos-compromisso')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Tipo Invasor',
        cor: '#EF4444',
      })

    res.assertStatus(403)
  })

  // =========================================================================
  // 6. VALIDAÇÃO DE CATÁLOGO INATIVO E REGRAS DE INTEGRIDADE
  // =========================================================================

  test('[CATALOGO-01] Rejeita agendamento com tipo de compromisso inativo', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const inicio = DateTime.now().plus({ days: 1, hours: 10 }).toUTC().toISO()
    const fim = DateTime.now().plus({ days: 1, hours: 11 }).toUTC().toISO()

    const res = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Agendamento com Tipo Inativo',
        tipoId: tipoInativoId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
      })

    res.assertStatus(422)
  })

  test('[CATALOGO-02] Rejeita agendamento com tipoId inexistente', async ({
    client,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const res = await client
      .post('/agenda/compromissos')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Agendamento com Tipo Inexistente',
        tipoId: 9999999,
        dataHoraInicio: DateTime.now().plus({ days: 1, hours: 10 }).toUTC().toISO(),
        dataHoraFim: DateTime.now().plus({ days: 1, hours: 11 }).toUTC().toISO(),
      })

    res.assertStatus(422)
  })

  // =========================================================================
  // 7. CONCORRÊNCIA E TRANSAÇÃO NA CONCLUSÃO DO COMPROMISSO
  // =========================================================================

  test('[CONCORRENCIA-01] Chamadas de conclusão simultâneas preservam integridade transacional', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario({
      nome: 'Vendedor Alpha',
      email: 'vendedor.alpha.adv@lidermoveis.com.br',
      perfil: PerfilUsuario.VENDEDOR,
    })

    const lead = await Lead.create({
      nome: 'Lead Concorrente Teste',
      telefone: `(11) 96${Date.now().toString().slice(-7)}`,
      origem: 'instagram',
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedor.id,
      qualificado: false,
    })
    leadsCriados.push(lead.id)

    const comp = await CompromissoAgenda.create({
      titulo: 'Compromisso Teste Concorrência',
      tipoId: tipoPadraoId,
      dataHoraInicio: DateTime.now().minus({ hours: 2 }).toUTC(),
      dataHoraFim: DateTime.now().minus({ hours: 1 }).toUTC(),
      status: StatusCompromisso.AGENDADO,
      responsavelId: vendedor.id,
      criadoPorId: vendedor.id,
      leadId: lead.id,
    })
    compromissosCriados.push(comp.id)

    // Dispara duas conclusões quase simultâneas
    const [res1, res2] = await Promise.all([
      client
        .patch(`/agenda/compromissos/${comp.id}/concluir`)
        .loginAs(vendedor)
        .withCsrfToken()
        .header('accept', 'application/json')
        .json({ desfecho: 'Desfecho simultâneo A' }),
      client
        .patch(`/agenda/compromissos/${comp.id}/concluir`)
        .loginAs(vendedor)
        .withCsrfToken()
        .header('accept', 'application/json')
        .json({ desfecho: 'Desfecho simultâneo B' }),
    ])

    // Ambas executam dentro de transação no Postgres
    assert.isTrue(res1.status() === 200 || res1.status() === 422)
    assert.isTrue(res2.status() === 200 || res2.status() === 422)

    await comp.refresh()
    assert.equal(comp.status, StatusCompromisso.CONCLUIDO)
    assert.isNotNull(comp.desfecho)

    // Verifica que o lead tem pelo menos 1 interação registrada
    const interacoes = await InteracaoLead.query().where('lead_id', lead.id)
    assert.isAbove(interacoes.length, 0)
  })
})
