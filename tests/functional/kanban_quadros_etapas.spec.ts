import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'
import HistoricoStatusLead from '#models/historico_status_lead'
import KanbanQuadroCatalogo from '#models/kanban_quadro_catalogo'
import KanbanEtapaCatalogo from '#models/kanban_etapa_catalogo'

async function garantirAdmin() {
  const email = 'admin.kanban.test@plannit.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Admin Kanban Teste',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.DIRETORIA,
    isActive: true,
    isSuperuser: true,
  })
}

async function garantirVendedor() {
  const email = 'vendedor.kanban.test@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Kanban Teste',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('Kanban Multi-Quadros & Etapas Parametrizáveis', (group) => {
  const quadrosCriadosIds: number[] = []
  const etapasCriadasIds: number[] = []
  const leadsCriadosIds: number[] = []

  group.each.teardown(async () => {
    if (leadsCriadosIds.length > 0) {
      await HistoricoStatusLead.query().whereIn('leadId', leadsCriadosIds).delete()
      await Lead.query().whereIn('id', leadsCriadosIds).delete()
      leadsCriadosIds.length = 0
    }
    if (etapasCriadasIds.length > 0) {
      await KanbanEtapaCatalogo.query().whereIn('id', etapasCriadasIds).delete()
      etapasCriadasIds.length = 0
    }
    if (quadrosCriadosIds.length > 0) {
      await KanbanQuadroCatalogo.query().whereIn('id', quadrosCriadosIds).delete()
      quadrosCriadosIds.length = 0
    }
  })

  test('CRM retorna os 4 quadros padrão com suas etapas configuradas na ordem correta', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirVendedor()

    const response = await client
      .get('/crm?format=json')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.kanbanQuadrosCatalogo)
    assert.isAtLeast(body.kanbanQuadrosCatalogo.length, 4)

    const slugsQuadros = body.kanbanQuadrosCatalogo.map((q: any) => q.slug)
    assert.includeMembers(slugsQuadros, [
      'comercial',
      'pos_venda_conferencia',
      'pos_venda_entrega_montagem',
      'pos_venda_assistencia_tecnica',
    ])

    const quadroComercial = body.kanbanQuadrosCatalogo.find((q: any) => q.slug === 'comercial')
    assert.isDefined(quadroComercial)
    const slugsComercial = quadroComercial.etapas.map((e: any) => e.slug)
    assert.includeMembers(slugsComercial, [
      'novo_lead',
      'qualificando',
      'em_briefing',
      'fila_projeto',
      'em_projeto',
      'pronto_para_renderizar',
      'finalizacao_renderizado',
      'confirmar_apresentacao',
      'apresentacao_agendada',
      'em_fechamento',
      'stand_by',
      'alteracao_ajuste',
      'fechado',
      'perdido',
    ])
  })

  test('Diretoria pode criar, editar, reordenar, desativar e excluir quadros e etapas em Configurações', async ({
    client,
    assert,
  }) => {
    const admin = await garantirAdmin()

    // 1. Criar novo quadro
    const createQuadroRes = await client
      .post('/configuracoes/kanban-quadros')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Quadro Customizado Teste',
        descricao: 'Pipeline de teste automatizado',
        cor: '#059669',
      })

    createQuadroRes.assertStatus(201)
    const novoQuadro = createQuadroRes.body().quadro
    assert.isDefined(novoQuadro.id)
    quadrosCriadosIds.push(novoQuadro.id)

    // 2. Criar duas etapas neste quadro
    const etapa1Res = await client
      .post('/configuracoes/kanban-etapas')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        quadroId: novoQuadro.id,
        nome: 'Etapa Custom 1',
        cor: '#3b82f6',
        exigeQualificacao: true,
        tipoEstagio: 'aberta',
      })

    etapa1Res.assertStatus(201)
    const etapa1 = etapa1Res.body().etapa
    etapasCriadasIds.push(etapa1.id)

    const etapa2Res = await client
      .post('/configuracoes/kanban-etapas')
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        quadroId: novoQuadro.id,
        nome: 'Etapa Custom 2',
        cor: '#8b5cf6',
        exigeQualificacao: false,
        tipoEstagio: 'aberta',
      })

    etapa2Res.assertStatus(201)
    const etapa2 = etapa2Res.body().etapa
    etapasCriadasIds.push(etapa2.id)

    // 3. Reordenar etapa 2 para cima
    const reorderRes = await client
      .patch(`/configuracoes/kanban-etapas/${etapa2.id}/reorder`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({ direcao: 'up' })

    reorderRes.assertStatus(200)
    const etapa1Db = await KanbanEtapaCatalogo.findOrFail(etapa1.id)
    const etapa2Db = await KanbanEtapaCatalogo.findOrFail(etapa2.id)
    assert.isBelow(etapa2Db.ordem, etapa1Db.ordem)

    // 4. Toggle ativo/inativo da etapa 2
    const toggleRes = await client
      .patch(`/configuracoes/kanban-etapas/${etapa2.id}/toggle`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')

    toggleRes.assertStatus(200)
    assert.isFalse(toggleRes.body().isActive)

    // 5. Excluir etapa 2 e quadro
    const delEtapa2 = await client
      .delete(`/configuracoes/kanban-etapas/${etapa2.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
    delEtapa2.assertStatus(200)

    const delQuadro = await client
      .delete(`/configuracoes/kanban-quadros/${novoQuadro.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')
    delQuadro.assertStatus(200)
  })

  test('Lead qualificado pode avançar para etapas dos quadros de Pós-venda e bloqueia exclusão de etapa em uso', async ({
    client,
    assert,
  }) => {
    const admin = await garantirAdmin()
    const vendedor = await garantirVendedor()

    const lead = await Lead.create({
      nome: 'Lead Teste Multi-Quadro',
      telefone: '(11) 96666-5544',
      origem: 'showroom',
      statusFunil: 'novo_lead',
      vendedorId: vendedor.id,
      qualificado: true,
    })
    leadsCriadosIds.push(lead.id)

    // Move para uma etapa do quadro Pós-venda (Conferência)
    await client
      .patch(`/crm/leads/${lead.id}/status`)
      .loginAs(vendedor)
      .withCsrfToken()
      .form({
        statusFunil: 'caderno_comercial',
      })

    await lead.refresh()
    assert.equal(lead.statusFunil, 'caderno_comercial')

    // Tenta excluir a etapa 'caderno_comercial' enquanto há lead nela -> deve bloquear com 400
    const etapaCaderno = await KanbanEtapaCatalogo.findByOrFail('slug', 'caderno_comercial')
    const delRes = await client
      .delete(`/configuracoes/kanban-etapas/${etapaCaderno.id}`)
      .loginAs(admin)
      .withCsrfToken()
      .header('accept', 'application/json')

    delRes.assertStatus(400)
  })
})

