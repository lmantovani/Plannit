import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Cliente from '#models/cliente'
import Lead, { StatusFunil } from '#models/lead'
import ProntuarioCliente from '#models/prontuario_cliente'
import CategoriaProntuarioCatalogo from '#models/categoria_prontuario_catalogo'

async function garantirDiretoria() {
  const email = 'diretoria.teste.prontuario@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Diretoria Teste Prontuário',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.DIRETORIA,
    isActive: true,
    isSuperuser: false,
  })
}

async function garantirUsuario() {
  const email = 'vendedor.teste.prontuario@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Teste Prontuário',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('Clientes — Prontuário de Relacionamento', (group) => {
  const clientesCriados: number[] = []

  group.each.teardown(async () => {
    if (clientesCriados.length) {
      await Cliente.query().whereIn('id', clientesCriados).delete()
    }
    clientesCriados.length = 0
  })

  test('adiciona e exclui anotação no prontuário do cliente', async ({ client, assert }) => {
    const user = await garantirUsuario()

    const cliente = await Cliente.create({
      nome: `Cliente Teste Prontuario ${Date.now()}`,
      telefone: `(11) 98${Date.now().toString().slice(-7)}`,
      tipo: 'pessoa_fisica',
      isActive: true,
    })
    clientesCriados.push(cliente.id)

    // Adiciona anotação
    const responseAdd = await client
      .post(`/clientes/${cliente.id}/prontuario`)
      .loginAs(user)
      .withCsrfToken()
      .form({
        categoria: 'familia',
        titulo: 'Filhos e Pets',
        descricao: 'Tem um casal de filhos (Pedro e Laura) e um cachorro Golden chamado Bob.',
        importante: true,
      })

    responseAdd.assertStatus(200)

    const salvo = await ProntuarioCliente.query()
      .where('clienteId', cliente.id)
      .where('categoria', 'familia')
      .first()

    assert.isNotNull(salvo)
    assert.equal(salvo!.titulo, 'Filhos e Pets')
    assert.isTrue(salvo!.importante)
    assert.equal(salvo!.autorId, user.id)

    // Exclui anotação
    const responseDel = await client
      .delete(`/clientes/${cliente.id}/prontuario/${salvo!.id}`)
      .loginAs(user)
      .withCsrfToken()

    responseDel.assertStatus(200)

    const apagado = await ProntuarioCliente.find(salvo!.id)
    assert.isNull(apagado)
  })

  test('adiciona anotação ao prontuário a partir de interação no CRM', async ({ client, assert }) => {
    const user = await garantirUsuario()

    const cliente = await Cliente.create({
      nome: `Cliente CRM Prontuario ${Date.now()}`,
      telefone: `(11) 97${Date.now().toString().slice(-7)}`,
      tipo: 'pessoa_fisica',
      isActive: true,
    })
    clientesCriados.push(cliente.id)

    const lead = await Lead.create({
      nome: cliente.nome,
      telefone: cliente.telefone,
      clienteId: cliente.id,
      statusFunil: StatusFunil.NOVO_LEAD,
      qualificado: false,
    })

    const response = await client
      .post(`/crm/leads/${lead.id}/interacoes`)
      .loginAs(user)
      .withCsrfToken()
      .form({
        tipo: 'whatsapp',
        resumo: 'Cliente mencionou que viaja muito a trabalho e gosta de vinhos.',
        adicionarAoProntuario: true,
        categoriaProntuario: 'hobby',
      })

    response.assertStatus(200)

    const salvo = await ProntuarioCliente.query()
      .where('clienteId', cliente.id)
      .where('categoria', 'hobby')
      .first()

    assert.isNotNull(salvo)
    assert.include(salvo!.descricao, 'gosta de vinhos')
    assert.equal(salvo!.leadId, lead.id)

    await lead.delete()
  })

  test('CRUD completo de categorias de prontuário em Configurações e proteção de integridade', async ({ client, assert }) => {
    const admin = await garantirDiretoria()
    const nomeCategoria = `Restrições Teste ${Date.now()}`

    // 1. Cria nova categoria personalizada
    const responseCreate = await client
      .post('/configuracoes/categorias-prontuario')
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')
      .json({
        nome: nomeCategoria,
        cor: '#EF4444',
        icone: 'AlertTriangle',
        ordem: 99,
        isActive: true,
      })

    responseCreate.assertStatus(201)

    const catCriada = await CategoriaProntuarioCatalogo.query()
      .where('nome', nomeCategoria)
      .first()

    assert.isNotNull(catCriada)
    assert.equal(catCriada!.cor, '#EF4444')
    assert.isTrue(catCriada!.isActive)

    // 2. Atualiza a categoria
    const responseUpdate = await client
      .put(`/configuracoes/categorias-prontuario/${catCriada!.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')
      .json({
        nome: `${nomeCategoria} Atualizada`,
        cor: '#10B981',
        ordem: 50,
        isActive: true,
      })

    responseUpdate.assertStatus(200)
    await catCriada!.refresh()
    assert.equal(catCriada!.nome, `${nomeCategoria} Atualizada`)
    assert.equal(catCriada!.cor, '#10B981')

    // 3. Alterna status (toggle)
    const responseToggle = await client
      .patch(`/configuracoes/categorias-prontuario/${catCriada!.id}/toggle`)
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')

    responseToggle.assertStatus(200)
    await catCriada!.refresh()
    assert.isFalse(catCriada!.isActive)

    // Reativa para testar uso
    await client
      .patch(`/configuracoes/categorias-prontuario/${catCriada!.id}/toggle`)
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')

    // 4. Cria anotação de prontuário usando a nova categoria personalizada
    const cliente = await Cliente.create({
      nome: `Cliente Categoria Custom ${Date.now()}`,
      telefone: `(11) 96${Date.now().toString().slice(-7)}`,
      tipo: 'pessoa_fisica',
      isActive: true,
    })
    clientesCriados.push(cliente.id)

    const responseAddProntuario = await client
      .post(`/clientes/${cliente.id}/prontuario`)
      .loginAs(admin)
      .withCsrfToken()
      .form({
        categoria: catCriada!.slug,
        descricao: 'Cliente possui restrição alimentar severa a glúten e lactose.',
        importante: true,
      })

    responseAddProntuario.assertStatus(200)

    const anotação = await ProntuarioCliente.query()
      .where('clienteId', cliente.id)
      .where('categoria', catCriada!.slug)
      .first()
    assert.isNotNull(anotação)

    // 5. Tenta excluir categoria em uso -> deve ser bloqueado por integridade
    const responseDeleteInUse = await client
      .delete(`/configuracoes/categorias-prontuario/${catCriada!.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')

    responseDeleteInUse.assertStatus(400)
    const bodyError = responseDeleteInUse.body()
    const msg = (bodyError.message || bodyError.error || '').toLowerCase()
    assert.include(msg, 'não é possível excluir')

    // 6. Remove a anotação e exclui a categoria com sucesso
    await anotação!.delete()

    const responseDeleteOk = await client
      .delete(`/configuracoes/categorias-prontuario/${catCriada!.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('Accept', 'application/json')

    responseDeleteOk.assertStatus(200)

    const catExcluida = await CategoriaProntuarioCatalogo.find(catCriada!.id)
    assert.isNull(catExcluida)
  })
})
