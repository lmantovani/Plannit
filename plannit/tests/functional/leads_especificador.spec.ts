import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'
import Arquiteto from '#models/arquiteto'

async function garantirUsuario(email: string, nome: string, perfil: PerfilUsuario) {
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome,
    email,
    password: 'Password123!',
    perfil,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('CRM — Lead com origem Especificador', (group) => {
  const telefonesCriados: string[] = []
  const especificadoresCriados: number[] = []

  // Os testes rodam no banco de desenvolvimento: remove o que foi criado aqui
  group.each.teardown(async () => {
    if (telefonesCriados.length) {
      await Lead.query().whereIn('telefone', telefonesCriados).delete()
    }
    if (especificadoresCriados.length) {
      await Arquiteto.query().whereIn('id', especificadoresCriados).delete()
    }
    telefonesCriados.length = 0
    especificadoresCriados.length = 0
  })

  test('vincula o especificador ao lead quando a origem é Especificador', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario(
      'vendedor.teste.esp@lidermoveis.com.br',
      'Vendedor Teste Esp',
      PerfilUsuario.VENDEDOR
    )
    const especificador = await Arquiteto.create({ nome: 'Arq. Teste Origem Lead', isActive: true })
    especificadoresCriados.push(especificador.id)
    const telefone = `(11) 9${Date.now().toString().slice(-8)}`
    telefonesCriados.push(telefone)

    await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .form({
        nome: 'Lead Indicado por Especificador',
        telefone,
        origem: 'arquiteto',
        arquitetoId: especificador.id,
      })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.equal(lead.arquitetoId, especificador.id)
    assert.isTrue(lead.possuiArquiteto)
  })

  test('ignora o especificador quando a origem é outra', async ({ client, assert }) => {
    const vendedor = await garantirUsuario(
      'vendedor.teste.esp@lidermoveis.com.br',
      'Vendedor Teste Esp',
      PerfilUsuario.VENDEDOR
    )
    const especificador = await Arquiteto.create({ nome: 'Arq. Teste Outra Origem', isActive: true })
    especificadoresCriados.push(especificador.id)
    const telefone = `(11) 9${Date.now().toString().slice(-8)}`
    telefonesCriados.push(telefone)

    await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .form({
        nome: 'Lead Vindo do Instagram',
        telefone,
        origem: 'instagram',
        arquitetoId: especificador.id,
      })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.isNull(lead.arquitetoId)
    assert.isFalse(lead.possuiArquiteto)
  })

  test('rejeita especificador inativo', async ({ client, assert }) => {
    const vendedor = await garantirUsuario(
      'vendedor.teste.esp@lidermoveis.com.br',
      'Vendedor Teste Esp',
      PerfilUsuario.VENDEDOR
    )
    const inativo = await Arquiteto.create({ nome: 'Arq. Teste Inativo', isActive: false })
    especificadoresCriados.push(inativo.id)
    const telefone = `(11) 9${Date.now().toString().slice(-8)}`
    telefonesCriados.push(telefone)

    const response = await client
      .post('/crm/leads')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Lead com Especificador Inativo',
        telefone,
        origem: 'arquiteto',
        arquitetoId: inativo.id,
      })

    response.assertStatus(422)
    assert.isNull(await Lead.findBy('telefone', telefone))
  })

  test('qualquer perfil pode cadastrar um especificador', async ({ client, assert }) => {
    const perfis = [PerfilUsuario.PROJETISTA, PerfilUsuario.CONFERENTE, PerfilUsuario.RECEPCAO]

    for (const perfil of perfis) {
      const usuario = await garantirUsuario(
        `${perfil}.teste.esp@lidermoveis.com.br`,
        `Usuário Teste Esp ${perfil}`,
        perfil
      )

      const response = await client
        .post('/especificadores')
        .loginAs(usuario)
        .withCsrfToken()
        .header('accept', 'application/json')
        .json({ nome: `Arq. Cadastro Rápido ${perfil}` })

      response.assertStatus(201)
      especificadoresCriados.push(response.body().id)
      assert.equal(response.body().nome, `Arq. Cadastro Rápido ${perfil}`)
    }
  })
})
