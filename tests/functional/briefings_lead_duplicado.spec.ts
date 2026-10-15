import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead, { StatusFunil } from '#models/lead'
import Projeto from '#models/projeto'
import Cliente from '#models/cliente'

async function garantirVendedor() {
  const email = 'vendedor.teste.brief@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Teste Briefing',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('Briefings — iniciar briefing de um lead', (group) => {
  const leadsCriados: Lead[] = []

  // Os testes rodam no banco de desenvolvimento: remove projetos (o briefing e o histórico vão
  // em cascata), o lead e o cliente criados aqui
  group.each.teardown(async () => {
    for (const lead of leadsCriados) {
      await Projeto.query().where('lead_id', lead.id).delete()
      await Lead.query().where('id', lead.id).delete()
      await Cliente.query().where('nome', lead.nome).delete()
    }
    leadsCriados.length = 0
  })

  async function criarLeadQualificado(vendedorId: number) {
    const sufixo = Date.now().toString().slice(-7)
    const lead = await Lead.create({
      nome: `Lead Briefing Duplicado ${sufixo}`,
      telefone: `(11) 92${sufixo}`,
      origem: 'instagram',
      statusFunil: StatusFunil.EM_VISITA,
      qualificado: true,
      vendedorId,
    })
    leadsCriados.push(lead)
    return lead
  }

  test('iniciar duas vezes reaproveita o mesmo projeto e o mesmo briefing', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirVendedor()
    const lead = await criarLeadQualificado(vendedor.id)

    const iniciar = () =>
      client
        .post('/briefings')
        .loginAs(vendedor)
        .withCsrfToken()
        .header('accept', 'application/json')
        .json({ leadId: lead.id })

    const primeiro = await iniciar()
    primeiro.assertStatus(201)
    assert.isFalse(primeiro.body().reaproveitado)

    const segundo = await iniciar()
    segundo.assertStatus(200)
    assert.isTrue(segundo.body().reaproveitado)
    assert.equal(segundo.body().projeto.id, primeiro.body().projeto.id)
    assert.equal(segundo.body().briefing.id, primeiro.body().briefing.id)

    const projetos = await Projeto.query().where('lead_id', lead.id)
    assert.lengthOf(projetos, 1)
  })

  test('com o projeto anterior arquivado, cria um projeto novo', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const lead = await criarLeadQualificado(vendedor.id)

    const iniciar = () =>
      client
        .post('/briefings')
        .loginAs(vendedor)
        .withCsrfToken()
        .header('accept', 'application/json')
        .json({ leadId: lead.id })

    const primeiro = await iniciar()
    const projetoAnterior = await Projeto.findOrFail(primeiro.body().projeto.id)
    projetoAnterior.arquivado = true
    await projetoAnterior.save()

    const segundo = await iniciar()
    segundo.assertStatus(201)
    assert.notEqual(segundo.body().projeto.id, projetoAnterior.id)
  })
})
