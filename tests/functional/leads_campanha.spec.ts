import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'
import CampanhaLead from '#models/campanha_lead'

async function garantirVendedor() {
  const email = 'vendedor.teste.camp@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Teste Campanha',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('CRM — Lead com campanha do catálogo', (group) => {
  const telefonesCriados: string[] = []
  const campanhasCriadas: number[] = []

  // Os testes rodam no banco de desenvolvimento: remove o que foi criado aqui
  group.each.teardown(async () => {
    if (telefonesCriados.length) {
      await Lead.query().whereIn('telefone', telefonesCriados).delete()
    }
    if (campanhasCriadas.length) {
      await CampanhaLead.query().whereIn('id', campanhasCriadas).delete()
    }
    telefonesCriados.length = 0
    campanhasCriadas.length = 0
  })

  const novoTelefone = () => {
    const telefone = `(11) 96${Date.now().toString().slice(-7)}`
    telefonesCriados.push(telefone)
    return telefone
  }

  test('grava a campanha ativa escolhida do catálogo', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const campanha = await CampanhaLead.create({
      nome: `Campanha Teste Ativa ${Date.now()}`,
      isActive: true,
    })
    campanhasCriadas.push(campanha.id)
    const telefone = novoTelefone()

    await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .form({ nome: 'Lead com Campanha', telefone, origem: 'instagram', campanha: campanha.nome })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.equal(lead.campanha, campanha.nome)
  })

  test('rejeita campanha digitada que não está no catálogo', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    const response = await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Lead Campanha Livre',
        telefone,
        origem: 'instagram',
        campanha: 'campanha cozinha',
      })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].message, 'Selecione uma campanha ativa do catálogo.')
    assert.isNull(await Lead.findBy('telefone', telefone))
  })

  test('rejeita campanha inativa', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const campanha = await CampanhaLead.create({
      nome: `Campanha Teste Inativa ${Date.now()}`,
      isActive: false,
    })
    campanhasCriadas.push(campanha.id)
    const telefone = novoTelefone()

    const response = await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Lead Campanha Inativa',
        telefone,
        origem: 'instagram',
        campanha: campanha.nome,
      })

    response.assertStatus(422)
    assert.isNull(await Lead.findBy('telefone', telefone))
  })

  test('lead sem campanha continua permitido', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .form({ nome: 'Lead sem Campanha', telefone, origem: 'instagram', campanha: '' })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.isNull(lead.campanha)
  })
})
