import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import RoteiroBriefing from '#models/roteiro_briefing'
import RoteiroBriefingAmbiente from '#models/roteiro_briefing_ambiente'
import Briefing from '#models/briefing'
import Projeto, { StatusProjeto } from '#models/projeto'

test.group('Roteiros de Apoio ao Briefing & Catálogo de Configurações', (group) => {
  let diretoria: User
  let vendedor: User

  group.setup(async () => {
    // Garante usuários para teste
    diretoria =
      (await User.findBy('email', 'admin@plannit.com.br')) ||
      (await User.create({
        nome: 'Admin Teste',
        email: 'admin@plannit.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: true,
      }))

    vendedor =
      (await User.findBy('email', 'vendedor.teste.roteiro@lidermoveis.com.br')) ||
      (await User.create({
        nome: 'Vendedor Teste Roteiro',
        email: 'vendedor.teste.roteiro@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      }))
  })

  test('bloqueia criação de roteiro por perfil vendedor com 403', async ({ client }) => {
    const response = await client
      .post('/configuracoes/roteiros')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Roteiro Não Autorizado',
        ambientes: ['Living'],
        secoes: [{ titulo: 'Seção 1', itens: ['Pergunta 1'] }],
      })

    response.assertStatus(403)
  })

  test('diretoria lista roteiros de apoio em /configuracoes', async ({ client, assert }) => {
    const response = await client
      .get('/configuracoes?format=json')
      .loginAs(diretoria)

    response.assertStatus(200)
    const data = response.body()
    assert.isTrue(Array.isArray(data.roteiros), 'roteiros deve ser um array')
    assert.isTrue(data.roteiros.length > 0, 'deve conter roteiros cadastrados')
  })

  test('diretoria cria novo roteiro com múltiplos ambientes vinculados e seções', async ({ client, assert }) => {
    const tituloUnico = `Espaço Cinema e Lazer ${Date.now()}`
    const ambientesTeste = ['Home Theater', 'Cinema VIP', 'Sala de Jogos']

    const response = await client
      .post('/configuracoes/roteiros')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: tituloUnico,
        subtitulo: 'Acústica, poltronas reclináveis, projeção 4K e automação de iluminação',
        ordem: 50,
        ambientes: ambientesTeste,
        secoes: [
          {
            id: 'secao_acustica',
            titulo: '1. Acústica e Isolamento Sonoro',
            itens: [
              'Qual o nível de tratamento acústico desejado?',
              'Haverá caixas de som embutidas no teto ou painéis acústicos ripados?',
            ],
            perguntasDestaque: [
              {
                tipo: 'estrategica',
                rotulo: 'Pergunta Chave',
                pergunta: 'Qual o nível de tratamento acústico desejado?',
              },
            ],
          },
          {
            id: 'secao_equipamentos',
            titulo: '2. Equipamentos e Projeção',
            itens: [
              'Projetor a laser com tela retrátil ou TV de grande porte (85+ polegadas)?',
              'Quais consoles e receivers precisam de ventilação dedicada?',
            ],
          },
        ],
      })

    response.assertStatus(200)

    // Verifica persistência no banco
    const roteiroDb = await RoteiroBriefing.query()
      .where('titulo', tituloUnico)
      .preload('ambientes')
      .first()

    assert.isNotNull(roteiroDb)
    assert.equal(roteiroDb!.titulo, tituloUnico)
    assert.isTrue(roteiroDb!.isActive)
    assert.equal(roteiroDb!.ambientes.length, 3)

    const nomesAmbientes = roteiroDb!.ambientes.map((a) => a.ambienteNome)
    assert.includeMembers(nomesAmbientes, ambientesTeste)

    // Valida estrutura das seções gravadas em JSONB
    assert.isArray(roteiroDb!.secoes)
    assert.equal(roteiroDb!.secoes.length, 2)
    assert.equal(roteiroDb!.secoes[0].titulo, '1. Acústica e Isolamento Sonoro')
  })

  test('diretoria atualiza roteiro, alterando seções e ambientes vinculados', async ({ client, assert }) => {
    const roteiro = await RoteiroBriefing.create({
      slug: `teste_update_${Date.now()}`,
      titulo: 'Roteiro Antes da Edição',
      subtitulo: 'Subtítulo Antigo',
      secoes: [{ id: 'sec_1', titulo: 'Seção Antiga', itens: ['Item Antigo'] }],
      isActive: true,
      ordem: 10,
    })

    await RoteiroBriefingAmbiente.create({
      roteiroId: roteiro.id,
      ambienteNome: 'Ambiente Antigo',
    })

    const novosAmbientes = ['Quarto do Filho', 'Quarto da Filha', 'Dormitório']

    const response = await client
      .put(`/configuracoes/roteiros/${roteiro.id}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        titulo: 'Roteiro Editado pela Diretoria',
        subtitulo: 'Novo subtítulo técnico aperfeiçoado',
        ordem: 15,
        ambientes: novosAmbientes,
        secoes: [
          {
            id: 'sec_estudo',
            titulo: '1. Bancada de Estudos e Iluminação',
            itens: ['Altura da bancada e quantidade de tomadas USB?'],
          },
        ],
      })

    response.assertStatus(200)

    await roteiro.refresh()
    assert.equal(roteiro.titulo, 'Roteiro Editado pela Diretoria')
    assert.equal(roteiro.subtitulo, 'Novo subtítulo técnico aperfeiçoado')

    const ambientesAtualizados = await RoteiroBriefingAmbiente.query().where('roteiro_id', roteiro.id)
    assert.equal(ambientesAtualizados.length, 3)
    const nomes = ambientesAtualizados.map((a) => a.ambienteNome)
    assert.includeMembers(nomes, novosAmbientes)
    assert.notInclude(nomes, 'Ambiente Antigo')
  })

  test('diretoria alterna status ativo/inativo via toggle', async ({ client, assert }) => {
    const roteiro = await RoteiroBriefing.create({
      slug: `teste_toggle_${Date.now()}`,
      titulo: 'Roteiro para Toggle',
      secoes: [],
      isActive: true,
      ordem: 99,
    })

    // Desativa
    const respDesativar = await client
      .patch(`/configuracoes/roteiros/${roteiro.id}/toggle`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')

    respDesativar.assertStatus(200)
    await roteiro.refresh()
    assert.isFalse(roteiro.isActive)

    // Reativa
    const respReativar = await client
      .patch(`/configuracoes/roteiros/${roteiro.id}/toggle`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')

    respReativar.assertStatus(200)
    await roteiro.refresh()
    assert.isTrue(roteiro.isActive)
  })

  test('diretoria exclui roteiro com remoção em cascata dos ambientes', async ({ client, assert }) => {
    const roteiro = await RoteiroBriefing.create({
      slug: `teste_delete_${Date.now()}`,
      titulo: 'Roteiro para Exclusão',
      secoes: [],
      isActive: true,
      ordem: 100,
    })

    await RoteiroBriefingAmbiente.create({
      roteiroId: roteiro.id,
      ambienteNome: 'Ambiente Teste Exclusão',
    })

    const response = await client
      .delete(`/configuracoes/roteiros/${roteiro.id}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')

    response.assertStatus(200)

    const roteiroDeletado = await RoteiroBriefing.find(roteiro.id)
    assert.isNull(roteiroDeletado)

    const ambientesRestantes = await RoteiroBriefingAmbiente.query().where('roteiro_id', roteiro.id)
    assert.equal(ambientesRestantes.length, 0)
  })

  test('tela de edição de briefing entrega roteirosCatalogo com seus ambientes', async ({ client, assert }) => {
    // Busca ou cria projeto e briefing para teste
    let projeto = await Projeto.query().first()
    if (!projeto) {
      projeto = await Projeto.create({
        codigo: `PRJ-TEST-${Date.now()}`,
        clienteNome: 'Cliente Teste Briefing',
        status: StatusProjeto.EM_BRIEFING,
      })
    }

    let briefing = await Briefing.findBy('projeto_id', projeto.id)
    if (!briefing) {
      briefing = await Briefing.create({
        projetoId: projeto.id,
        ambientes: ['Living', 'Cozinha'],
      })
    }

    const response = await client
      .get(`/briefings/${briefing.id}/edit`)
      .loginAs(diretoria)

    response.assertStatus(200)
    const html = response.text()
    assert.include(html, 'roteirosCatalogo')
  })
})

