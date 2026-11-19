import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'
import Cliente from '#models/cliente'
import AtendimentoFilaVendedor, { StatusDisponibilidadeFila } from '#models/atendimento_fila_vendedor'
import AtendimentoRegistro, {
  TipoAtendimentoPorta,
  StatusAtendimentoRegistro,
} from '#models/atendimento_registro'
import AtendimentoHistoricoEvento, { TipoEventoFila } from '#models/atendimento_historico_evento'

function getDataHojeLoja(): string {
  return DateTime.now().setZone('America/Sao_Paulo').toISODate()!
}

test.group('Atendimentos — Fila de Atendimento dos Vendedores (/atendimentos/fila)', (group) => {
  const usuariosCriadosIds: number[] = []
  const leadsCriadosIds: number[] = []
  const clientesCriadosIds: number[] = []

  async function criarUsuarioTeste(perfil: PerfilUsuario, nomePrefixo: string): Promise<User> {
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`
    const user = await User.create({
      nome: `${nomePrefixo} ${suffix}`,
      email: `fila_${perfil}_${suffix}@lidermoveis.com.br`,
      password: 'Password123!',
      perfil,
      isActive: true,
      isSuperuser: false,
    })
    usuariosCriadosIds.push(user.id)
    return user
  }

  group.each.teardown(async () => {
    if (leadsCriadosIds.length > 0) {
      await Lead.query().whereIn('id', leadsCriadosIds).delete()
      leadsCriadosIds.length = 0
    }
    if (clientesCriadosIds.length > 0) {
      await Cliente.query().whereIn('id', clientesCriadosIds).delete()
      clientesCriadosIds.length = 0
    }
    if (usuariosCriadosIds.length > 0) {
      await AtendimentoHistoricoEvento.query().whereIn('vendedor_id', usuariosCriadosIds).delete()
      await AtendimentoRegistro.query().whereIn('vendedor_id', usuariosCriadosIds).delete()
      await AtendimentoFilaVendedor.query().whereIn('vendedor_id', usuariosCriadosIds).delete()
      await User.query().whereIn('id', usuariosCriadosIds).delete()
      usuariosCriadosIds.length = 0

      const remanescentes = await AtendimentoFilaVendedor.query()
        .where('data', getDataHojeLoja())
        .orderBy('posicao', 'asc')
      for (let i = 0; i < remanescentes.length; i++) {
        if (remanescentes[i].posicao !== i + 1) {
          remanescentes[i].posicao = i + 1
          await remanescentes[i].save()
        }
      }
    }
  })

  test('bloqueia acesso sem autenticação (/atendimentos/fila redireciona para /login)', async ({
    client,
  }) => {
    const response = await client.get('/atendimentos/fila')
    response.assertRedirectsTo('/login')
  })

  test('vendedor entra na fila pelo botão Cheguei na Loja, alterna disponibilidade e não pode incluir terceiro', async ({
    client,
    assert,
  }) => {
    const vendedor1 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Um')
    const vendedor2 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Dois')

    // 1. Vendedor 1 entra na fila (sem vendedorId)
    const resEntrar = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})

    resEntrar.assertStatus(201)
    const itemId = resEntrar.body().item.id

    // 2. Tentativa duplicada no mesmo dia é bloqueada
    const resDuplicado = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})

    resDuplicado.assertStatus(400)
    assert.equal(resDuplicado.body().code, 'RN_JA_NA_FILA')

    // 3. Vendedor 1 altera disponibilidade para ocupado_interno
    const resStatus = await client
      .patch(`/atendimentos/fila/${itemId}/status`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        status: StatusDisponibilidadeFila.OCUPADO_INTERNO,
        motivoIndisponibilidade: 'Fazendo orçamento',
      })

    resStatus.assertStatus(200)
    const itemDb = await AtendimentoFilaVendedor.findOrFail(itemId)
    assert.equal(itemDb.status, StatusDisponibilidadeFila.OCUPADO_INTERNO)
    assert.equal(itemDb.motivoIndisponibilidade, 'Fazendo orçamento')

    // 4. Vendedor comum não pode adicionar outro vendedor
    const resTerceiro = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor2.id })

    resTerceiro.assertStatus(403)
    assert.equal(resTerceiro.body().code, 'FORBIDDEN_ADICIONAR_TERCEIRO')
  })

  test('recepção, gerente comercial e diretoria podem incluir vendedores e reordenar a fila; vendedor comum recebe 403', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Teste')
    const gerente = await criarUsuarioTeste(PerfilUsuario.GERENTE_COMERCIAL, 'Gerente Teste')
    const diretoria = await criarUsuarioTeste(PerfilUsuario.DIRETORIA, 'Diretor Teste')
    const vendedor1 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor A')
    const vendedor2 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor B')

    // Recepção inclui Vendedor A e Vendedor B
    const resAdd1 = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor1.id })
    resAdd1.assertStatus(201)
    const item1Id = resAdd1.body().item.id

    const resAdd2 = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor2.id })
    resAdd2.assertStatus(201)
    const item2Id = resAdd2.body().item.id

    // Vendedor comum tenta reordenar -> 403
    const resVendedorReord = await client
      .patch(`/atendimentos/fila/${item2Id}/reordenar`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'up' })
    resVendedorReord.assertStatus(403)
    assert.equal(resVendedorReord.body().code, 'FORBIDDEN_REORDENAR_FILA')

    // Recepção sobe Vendedor B para o topo
    const resRecReord = await client
      .patch(`/atendimentos/fila/${item2Id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top', motivo: 'Ajuste recepção' })
    resRecReord.assertStatus(200)
    assert.equal((await AtendimentoFilaVendedor.findOrFail(item2Id)).posicao, 1)

    // Gerente Comercial sobe Vendedor A para o topo
    const resGerReord = await client
      .patch(`/atendimentos/fila/${item1Id}/reordenar`)
      .loginAs(gerente)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })
    resGerReord.assertStatus(200)
    assert.equal((await AtendimentoFilaVendedor.findOrFail(item1Id)).posicao, 1)

    // Diretoria sobe Vendedor B para o topo
    const resDirReord = await client
      .patch(`/atendimentos/fila/${item2Id}/reordenar`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })
    resDirReord.assertStatus(200)
    assert.equal((await AtendimentoFilaVendedor.findOrFail(item2Id)).posicao, 1)

    // Verifica registro de auditoria
    const eventoReord = await AtendimentoHistoricoEvento.query()
      .where('vendedor_id', vendedor2.id)
      .where('tipo_evento', TipoEventoFila.REORDENACAO_MANUAL)
      .first()
    assert.isNotNull(eventoReord)
  })

  test('exige justificativa de pulo de vez para cliente novo de porta e registra auditoria quando justificado', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Pulo')
    const vendedor1 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Primeiro')
    const vendedor2 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Segundo')

    const r1 = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor1.id })
    const item1Id = r1.body().item.id

    await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor2.id })

    // Garante Vendedor 1 no topo da fila para ser o próximo da vez
    await client
      .patch(`/atendimentos/fila/${item1Id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    // Tenta iniciar atendimento de porta novo com Vendedor 2 SEM informar motivoPulo -> 400
    const resSemMotivo = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor2.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: 'Cliente Sem Justificativa',
      })

    resSemMotivo.assertStatus(400)
    assert.equal(resSemMotivo.body().code, 'RN_JUSTIFICATIVA_PULO_OBRIGATORIA')

    // Agora informa motivoPulo e justificativaPulo -> 201 + auditoria
    const resComMotivo = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor2.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: 'Cliente Com Justificativa',
        motivoPulo: 'vendedor_recusou',
        justificativaPulo: 'Vendedor 1 recusou atender no balcão',
      })

    resComMotivo.assertStatus(201)
    const reg = resComMotivo.body().registro
    if (reg.clienteId) clientesCriadosIds.push(reg.clienteId)
    assert.isTrue(reg.foiPuloDeVez)
    assert.equal(reg.vendedorPuladoId, vendedor1.id)

    const eventoPulo = await AtendimentoHistoricoEvento.query()
      .where('atendimento_registro_id', reg.id)
      .where('tipo_evento', TipoEventoFila.PULO_DE_VEZ)
      .first()
    assert.isNotNull(eventoPulo)
    assert.equal(eventoPulo!.vendedorPuladoId, vendedor1.id)
  })

  test('concluir qualquer atendimento (porta, carteira própria ou especificador) envia o vendedor para o final da fila', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Rotacao')
    const vendedor1 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Rot 1')
    const vendedor2 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Rot 2')

    const r1 = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor1.id })
    const item1Id = r1.body().item.id

    const r2 = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor2.id })
    const item2Id = r2.body().item.id

    // Coloca Vendedor 1 em 1º lugar
    await client
      .patch(`/atendimentos/fila/${item1Id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    // Caso 1: Atendimento de porta novo por Vendedor 1 + criação automática de Lead no CRM
    const resIni1 = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor1.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: `Lead Porta Teste ${Date.now()}`,
        clienteTelefone: '(11) 99123-4567',
      })
    resIni1.assertStatus(201)
    const reg1Id = resIni1.body().registro.id

    // Enquanto em atendimento, não pode mudar status manualmente nem ser removido
    const resBloqStatus = await client
      .patch(`/atendimentos/fila/${item1Id}/status`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ status: StatusDisponibilidadeFila.PAUSA })
    resBloqStatus.assertStatus(400)
    assert.equal(resBloqStatus.body().code, 'RN_EM_ATENDIMENTO_ATIVO')

    const resConc1 = await client
      .post(`/atendimentos/fila/atendimentos/${reg1Id}/concluir`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: 'gerou_lead',
        criarLeadNoCrm: true,
        observacao: 'Cliente interessado em cozinha planejada',
      })
    resConc1.assertStatus(200)

    const reg1Atualizado = await AtendimentoRegistro.findOrFail(reg1Id)
    assert.equal(reg1Atualizado.status, StatusAtendimentoRegistro.CONCLUIDO)
    assert.isNotNull(reg1Atualizado.leadId)
    if (reg1Atualizado.leadId) leadsCriadosIds.push(reg1Atualizado.leadId)
    if (reg1Atualizado.clienteId) clientesCriadosIds.push(reg1Atualizado.clienteId)

    const dataHoje = getDataHojeLoja()
    const totalNaFila = await AtendimentoFilaVendedor.query().where('data', dataHoje)
    const item1PosApos = await AtendimentoFilaVendedor.findOrFail(item1Id)
    const item2PosApos = await AtendimentoFilaVendedor.findOrFail(item2Id)

    // Vendedor 1 foi para a última posição e ficou atrás do Vendedor 2
    assert.equal(item1PosApos.posicao, totalNaFila.length)
    assert.isAbove(item1PosApos.posicao, item2PosApos.posicao)
    assert.equal(item1PosApos.atendimentosHoje, 1)
    assert.equal(item1PosApos.status, StatusDisponibilidadeFila.DISPONIVEL)

    // Caso 2: Vendedor 2 (no topo/frente do Vendedor 1) realiza atendimento de RETORNO DE CARTEIRA
    // Coloca Vendedor 2 em 1º para confirmar rotação até o último lugar
    await client
      .patch(`/atendimentos/fila/${item2Id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    const resIni2 = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor2.id,
        tipoAtendimento: TipoAtendimentoPorta.RETORNO_CARTEIRA,
        clienteNome: `Cliente Retorno Carteira ${Date.now()}`,
      })
    resIni2.assertStatus(201)
    if (resIni2.body().registro.clienteId) clientesCriadosIds.push(resIni2.body().registro.clienteId)
    const reg2Id = resIni2.body().registro.id

    const resConc2 = await client
      .post(`/atendimentos/fila/atendimentos/${reg2Id}/concluir`)
      .loginAs(vendedor2)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: 'gerou_orcamento',
      })
    resConc2.assertStatus(200)

    const item2Final = await AtendimentoFilaVendedor.findOrFail(item2Id)
    const item1Final = await AtendimentoFilaVendedor.findOrFail(item1Id)

    // Regra validada: mesmo em retorno de carteira, Vendedor 2 foi para o final da fila!
    assert.equal(item2Final.posicao, totalNaFila.length)
    assert.isAbove(item2Final.posicao, item1Final.posicao)

    // Caso 3: Indicação de Especificador também rotaciona para o final da fila ao concluir
    await client
      .patch(`/atendimentos/fila/${item1Id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    const resIni3 = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor1.id,
        tipoAtendimento: TipoAtendimentoPorta.INDICACAO_ESPECIFICADOR,
        clienteNome: `Cliente Especificador ${Date.now()}`,
      })
    resIni3.assertStatus(201)
    if (resIni3.body().registro.clienteId) clientesCriadosIds.push(resIni3.body().registro.clienteId)

    const resConc3 = await client
      .post(`/atendimentos/fila/atendimentos/${resIni3.body().registro.id}/concluir`)
      .loginAs(vendedor1)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        desfecho: 'retorno_agendado',
      })
    resConc3.assertStatus(200)

    const item1AposSpec = await AtendimentoFilaVendedor.findOrFail(item1Id)
    const item2AposSpec = await AtendimentoFilaVendedor.findOrFail(item2Id)
    assert.equal(item1AposSpec.posicao, totalNaFila.length)
    assert.isAbove(item1AposSpec.posicao, item2AposSpec.posicao)
  })

  test('fluxo redirect/flash, renderização da página Inertia e métricas mensais por vendedor', async ({
    client,
    assert,
  }) => {
    const vendedor = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Inertia')
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Inertia')

    // 1. Renderização da página Inertia (HTML)
    const resPage = await client.get('/atendimentos/fila').loginAs(vendedor)
    resPage.assertStatus(200)
    assert.include(resPage.text(), 'data-page=')
    assert.isTrue(
      resPage.text().includes('atendimentos/fila') ||
        resPage.text().includes('atendimentos\\/fila')
    )

    // 2. Fluxo padrão de form POST (redirect 302 + flash success)
    const resEntrar = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(vendedor)
      .withCsrfToken()
      .redirects(0)
      .form({})

    resEntrar.assertStatus(302)
    resEntrar.assertFlashMessage('success')
    assert.include(resEntrar.flashMessage('success'), 'entrou na fila de atendimento')

    // Garante que este vendedor esteja no topo da fila (caso haja outros itens de dev no banco)
    const itemVendedor = await AtendimentoFilaVendedor.query()
      .where('data', getDataHojeLoja())
      .where('vendedor_id', vendedor.id)
      .firstOrFail()

    await client
      .patch(`/atendimentos/fila/${itemVendedor.id}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    // 3. Inicia e conclui atendimento para validar métricas mensais em JSON
    const resIni = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: `Cliente Métrica ${Date.now()}`,
      })
    resIni.assertStatus(201)
    if (resIni.body().registro.clienteId) clientesCriadosIds.push(resIni.body().registro.clienteId)

    const resConc = await client
      .post(`/atendimentos/fila/atendimentos/${resIni.body().registro.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .redirects(0)
      .form({
        desfecho: 'gerou_orcamento',
      })
    resConc.assertStatus(302)
    resConc.assertFlashMessage('success')
    assert.include(resConc.flashMessage('success'), 'final da fila')

    const resJson = await client.get('/atendimentos/fila?format=json').loginAs(vendedor)
    resJson.assertStatus(200)
    resJson.assertBodyContains({ dataHoje: getDataHojeLoja() })
    const metrica = resJson
      .body()
      .metricasMes.find((m: any) => m.vendedorId === vendedor.id)
    assert.isDefined(metrica)
    assert.equal(metrica.totalAtendimentos, 1)
    assert.equal(metrica.portaNovo, 1)
    assert.equal(metrica.conversoes, 1)
  })

  test('proximoDaVez sempre consta em todosVendedores na ordem da fila (inclusive Diretoria)', async ({
    client,
    assert,
  }) => {
    const diretoria = await criarUsuarioTeste(PerfilUsuario.DIRETORIA, 'Diretor Fila')
    const vendedor = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Fila')

    const resDir = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({})
    resDir.assertStatus(201)
    const itemDirId = resDir.body().item.id

    await client
      .post('/atendimentos/fila/entrar')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor.id })

    await client
      .patch(`/atendimentos/fila/${itemDirId}/reordenar`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    const resJson = await client.get('/atendimentos/fila?format=json').loginAs(diretoria)
    resJson.assertStatus(200)
    const body = resJson.body()

    assert.isNotNull(body.proximoDaVez)
    assert.equal(body.proximoDaVez.vendedorId, diretoria.id)
    assert.isTrue(
      body.todosVendedores.some((v: any) => v.id === diretoria.id),
      'proximoDaVez precisa constar em todosVendedores para pré-seleção no modal'
    )
    assert.equal(body.todosVendedores[0].id, diretoria.id)
  })

  test('iniciar atendimento vinculando cliente existente preenche clienteId, clienteNome e clienteTelefone', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Cliente Exist')
    const vendedor = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Cliente Exist')

    const cliente = await Cliente.create({
      nome: `Cliente Carteira ${Date.now()}`,
      telefone: `(11) 97${Date.now().toString().slice(-7)}`,
      tipo: 'pessoa_fisica',
      isActive: true,
    })
    clientesCriadosIds.push(cliente.id)

    const rEntrar = await client
      .post('/atendimentos/fila/entrar')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ vendedorId: vendedor.id })
    const itemId = rEntrar.body().item.id

    await client
      .patch(`/atendimentos/fila/${itemId}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    const resJsonList = await client.get('/atendimentos/fila?format=json').loginAs(recepcao)
    resJsonList.assertStatus(200)
    const clienteNaLista = resJsonList
      .body()
      .clientesCatalogo.find((c: any) => c.id === cliente.id)
    assert.isDefined(clienteNaLista)
    assert.equal(clienteNaLista.nome, cliente.nome)

    const resIni = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor.id,
        tipoAtendimento: TipoAtendimentoPorta.RETORNO_CARTEIRA,
        clienteId: cliente.id,
      })

    resIni.assertStatus(201)
    const reg = resIni.body().registro
    assert.equal(reg.clienteId, cliente.id)
    assert.equal(reg.clienteNome, cliente.nome)
    assert.equal(reg.clienteTelefone, cliente.telefone)

    // Também testa cadastrar novo cliente automaticamente quando não informado clienteId
    const nomeNovo = `Cliente Novo Fila ${Date.now()}`
    const telNovo = `(11) 96${Date.now().toString().slice(-7)}`
    const resNovo = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: nomeNovo,
        clienteTelefone: telNovo,
      })

    // Vendedor já está em atendimento ativo, então espera 400 RN_VENDEDOR_JA_EM_ATENDIMENTO — conclui o primeiro antes
    resNovo.assertStatus(400)
    await client
      .post(`/atendimentos/fila/atendimentos/${reg.id}/concluir`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ desfecho: 'retorno_agendado' })

    // Após concluir, vendedor foi para o fim da fila; recoloca no topo caso haja fila ativa no banco dev
    await client
      .patch(`/atendimentos/fila/${itemId}/reordenar`)
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'top' })

    const resNovoOk = await client
      .post('/atendimentos/fila/iniciar-atendimento')
      .loginAs(recepcao)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        vendedorId: vendedor.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        clienteNome: nomeNovo,
        clienteTelefone: telNovo,
      })

    resNovoOk.assertStatus(201)
    const regNovo = resNovoOk.body().registro
    assert.isNotNull(regNovo.clienteId)
    clientesCriadosIds.push(regNovo.clienteId)
    const clienteCriadoDb = await Cliente.findOrFail(regNovo.clienteId)
    assert.equal(clienteCriadoDb.nome, nomeNovo)
    assert.equal(clienteCriadoDb.telefone, telNovo)
  })

  test('filtra métricas e auditoria por vendedor e período (dia, semana, quinzena, mês)', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Filtro')
    const vendedor1 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Filtro 1')
    const vendedor2 = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Filtro 2')

    const agoraLoja = DateTime.now().setZone('America/Sao_Paulo')
    const dataHoje = agoraLoja.toISODate()!
    const diaOutraQuinzena = agoraLoja.day <= 15 ? 20 : 5
    const dataOutraQuinzenaDT = agoraLoja.set({ day: diaOutraQuinzena })
    const dataOutraQuinzena = dataOutraQuinzenaDT.toISODate()!

    await AtendimentoRegistro.create({
      data: DateTime.fromISO(dataHoje, { zone: 'utc' }),
      vendedorId: vendedor1.id,
      iniciadoPorId: recepcao.id,
      tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
      foiPuloDeVez: false,
      status: StatusAtendimentoRegistro.CONCLUIDO,
      desfecho: 'gerou_lead',
      iniciadoEm: DateTime.now().toUTC(),
      concluidoEm: DateTime.now().toUTC(),
    })

    await AtendimentoRegistro.create({
      data: DateTime.fromISO(dataOutraQuinzena, { zone: 'utc' }),
      vendedorId: vendedor1.id,
      iniciadoPorId: recepcao.id,
      tipoAtendimento: TipoAtendimentoPorta.RETORNO_CARTEIRA,
      foiPuloDeVez: false,
      status: StatusAtendimentoRegistro.CONCLUIDO,
      desfecho: 'gerou_orcamento',
      iniciadoEm: DateTime.now().toUTC(),
      concluidoEm: DateTime.now().toUTC(),
    })

    await AtendimentoHistoricoEvento.create({
      data: DateTime.fromISO(dataHoje, { zone: 'utc' }),
      tipoEvento: TipoEventoFila.CHEGADA_FILA,
      vendedorId: vendedor1.id,
      executadoPorId: recepcao.id,
      detalhes: 'Evento filtro vendedor 1',
    })

    // 1. Filtro por Dia + Vendedor 1 -> apenas 1 atendimento
    const resDia = await client
      .get(`/atendimentos/fila?format=json&periodo=dia&dataRef=${dataHoje}&vendedorId=${vendedor1.id}`)
      .loginAs(recepcao)
    resDia.assertStatus(200)
    assert.equal(resDia.body().filtrosPainel.periodo, 'dia')
    assert.equal(resDia.body().filtrosPainel.dataInicio, dataHoje)
    assert.equal(resDia.body().filtrosPainel.dataFim, dataHoje)
    assert.equal(resDia.body().metricasMes.length, 1)
    assert.equal(resDia.body().metricasMes[0].vendedorId, vendedor1.id)
    assert.equal(resDia.body().metricasMes[0].totalAtendimentos, 1)

    // 2. Filtro por Quinzena -> apenas 1 atendimento da quinzena atual
    const resQuinzena = await client
      .get(
        `/atendimentos/fila?format=json&periodo=quinzena&dataRef=${dataHoje}&vendedorId=${vendedor1.id}`
      )
      .loginAs(recepcao)
    resQuinzena.assertStatus(200)
    assert.equal(resQuinzena.body().filtrosPainel.periodo, 'quinzena')
    assert.equal(resQuinzena.body().metricasMes[0].totalAtendimentos, 1)

    // 3. Filtro por Semana -> retorna intervalo semanal válido
    const resSemana = await client
      .get(`/atendimentos/fila?format=json&periodo=semana&dataRef=${dataHoje}`)
      .loginAs(recepcao)
    resSemana.assertStatus(200)
    assert.equal(resSemana.body().filtrosPainel.periodo, 'semana')
    assert.equal(
      resSemana.body().filtrosPainel.dataInicio,
      agoraLoja.startOf('week').toISODate()
    )
    assert.equal(
      resSemana.body().filtrosPainel.dataFim,
      agoraLoja.endOf('week').toISODate()
    )

    // 4. Filtro por Mês + Vendedor 1 -> soma ambas as quinzenas (2 atendimentos)
    const resMesV1 = await client
      .get(`/atendimentos/fila?format=json&periodo=mes&dataRef=${dataHoje}&vendedorId=${vendedor1.id}`)
      .loginAs(recepcao)
    resMesV1.assertStatus(200)
    assert.equal(resMesV1.body().metricasMes.length, 1)
    assert.equal(resMesV1.body().metricasMes[0].totalAtendimentos, 2)
    assert.isTrue(
      resMesV1.body().historicoEventos.every((ev: any) => ev.vendedorId === vendedor1.id || ev.vendedorPuladoId === vendedor1.id)
    )

    // 5. Filtro por Mês + Vendedor 2 -> apenas vendedor 2 com 0 atendimentos
    const resMesV2 = await client
      .get(`/atendimentos/fila?format=json&periodo=mes&dataRef=${dataHoje}&vendedorId=${vendedor2.id}`)
      .loginAs(recepcao)
    resMesV2.assertStatus(200)
    assert.equal(resMesV2.body().metricasMes.length, 1)
    assert.equal(resMesV2.body().metricasMes[0].vendedorId, vendedor2.id)
    assert.equal(resMesV2.body().metricasMes[0].totalAtendimentos, 0)
  })

  test('filtra métricas e auditoria por intervalo aberto dataInicio e dataFim (nenhum obrigatório)', async ({
    client,
    assert,
  }) => {
    const recepcao = await criarUsuarioTeste(PerfilUsuario.RECEPCAO, 'Recepcao Intervalo')
    const vendedor = await criarUsuarioTeste(PerfilUsuario.VENDEDOR, 'Vendedor Intervalo')

    const datas = ['2026-10-25', '2026-11-01', '2026-11-05', '2026-11-10']
    for (const d of datas) {
      await AtendimentoRegistro.create({
        data: DateTime.fromISO(d, { zone: 'utc' }),
        vendedorId: vendedor.id,
        iniciadoPorId: recepcao.id,
        tipoAtendimento: TipoAtendimentoPorta.PORTA_NOVO,
        foiPuloDeVez: false,
        status: StatusAtendimentoRegistro.CONCLUIDO,
        desfecho: 'gerou_lead',
        iniciadoEm: DateTime.now().toUTC(),
        concluidoEm: DateTime.now().toUTC(),
      })

      await AtendimentoHistoricoEvento.create({
        data: DateTime.fromISO(d, { zone: 'utc' }),
        tipoEvento: TipoEventoFila.CHEGADA_FILA,
        vendedorId: vendedor.id,
        executadoPorId: recepcao.id,
        detalhes: `Evento ${d}`,
      })
    }

    // 1. Apenas dataInicio=2026-11-01 -> 3 registros (01/11, 05/11, 10/11)
    const resSoInicio = await client
      .get(`/atendimentos/fila?format=json&dataInicio=2026-11-01&vendedorId=${vendedor.id}`)
      .loginAs(recepcao)
    resSoInicio.assertStatus(200)
    assert.equal(resSoInicio.body().filtrosPainel.periodo, 'personalizado')
    assert.equal(resSoInicio.body().filtrosPainel.dataInicio, '2026-11-01')
    assert.equal(resSoInicio.body().filtrosPainel.dataFim, '')
    assert.equal(resSoInicio.body().filtrosPainel.periodoLabel, 'A partir de 01/11/2026')
    assert.equal(resSoInicio.body().metricasMes[0].totalAtendimentos, 3)
    assert.equal(resSoInicio.body().historicoEventos.length, 3)

    // 2. Apenas dataFim=2026-11-05 -> 3 registros (25/10, 01/11, 05/11)
    const resSoFim = await client
      .get(`/atendimentos/fila?format=json&dataFim=2026-11-05&vendedorId=${vendedor.id}`)
      .loginAs(recepcao)
    resSoFim.assertStatus(200)
    assert.equal(resSoFim.body().filtrosPainel.periodo, 'personalizado')
    assert.equal(resSoFim.body().filtrosPainel.dataInicio, '')
    assert.equal(resSoFim.body().filtrosPainel.dataFim, '2026-11-05')
    assert.equal(resSoFim.body().filtrosPainel.periodoLabel, 'Até 05/11/2026')
    assert.equal(resSoFim.body().metricasMes[0].totalAtendimentos, 3)
    assert.equal(resSoFim.body().historicoEventos.length, 3)

    // 3. Ambos dataInicio=2026-11-01 e dataFim=2026-11-05 -> 2 registros (01/11, 05/11)
    const resIntervalo = await client
      .get(
        `/atendimentos/fila?format=json&periodo=personalizado&dataInicio=2026-11-01&dataFim=2026-11-05&vendedorId=${vendedor.id}`
      )
      .loginAs(recepcao)
    resIntervalo.assertStatus(200)
    assert.equal(resIntervalo.body().filtrosPainel.periodoLabel, '01/11/2026 a 05/11/2026')
    assert.equal(resIntervalo.body().metricasMes[0].totalAtendimentos, 2)
    assert.equal(resIntervalo.body().historicoEventos.length, 2)

    // 4. Nenhum dos dois (intervalo aberto completo) -> todos os 4 registros
    const resTodoPeriodo = await client
      .get(
        `/atendimentos/fila?format=json&periodo=personalizado&dataInicio=&dataFim=&vendedorId=${vendedor.id}`
      )
      .loginAs(recepcao)
    resTodoPeriodo.assertStatus(200)
    assert.equal(resTodoPeriodo.body().filtrosPainel.dataInicio, '')
    assert.equal(resTodoPeriodo.body().filtrosPainel.dataFim, '')
    assert.equal(resTodoPeriodo.body().filtrosPainel.periodoLabel, 'Todo o período')
    assert.equal(resTodoPeriodo.body().metricasMes[0].totalAtendimentos, 4)
    assert.equal(resTodoPeriodo.body().historicoEventos.length, 4)
  })
})
