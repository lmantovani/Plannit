import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'

async function garantirVendedor() {
  const email = 'vendedor.teste.outro@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Teste Origem Outro',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('CRM — Lead com origem "Outro"', (group) => {
  const telefonesCriados: string[] = []

  // Os testes rodam no banco de desenvolvimento: remove o que foi criado aqui
  group.each.teardown(async () => {
    if (telefonesCriados.length) {
      await Lead.query().whereIn('telefone', telefonesCriados).delete()
    }
    telefonesCriados.length = 0
  })

  const novoTelefone = () => {
    const telefone = `(11) 94${Date.now().toString().slice(-7)}`
    telefonesCriados.push(telefone)
    return telefone
  }

  test('grava a descrição quando a origem é Outro', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    await client.post('/crm/leads').loginAs(vendedor).withCsrfToken().form({
      nome: 'Lead Origem Outro',
      telefone,
      origem: 'outro',
      origemDescricao: 'Feira de decoração do shopping',
    })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.equal(lead.origem, 'outro')
    assert.equal(lead.origemDescricao, 'Feira de decoração do shopping')
  })

  test('exige a descrição quando a origem é Outro', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    const response = await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ nome: 'Lead Outro sem Descrição', telefone, origem: 'outro' })

    response.assertStatus(422)
    assert.equal(response.body().errors[0].message, 'Informe qual é a origem do lead.')
    assert.isNull(await Lead.findBy('telefone', telefone))
  })

  test('ignora a descrição quando a origem não é Outro', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    await client.post('/crm/leads').loginAs(vendedor).withCsrfToken().form({
      nome: 'Lead Instagram com Descrição',
      telefone,
      origem: 'instagram',
      origemDescricao: 'não deveria ser gravado',
    })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.isNull(lead.origemDescricao)
  })
})
