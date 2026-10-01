import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead, { StatusFunil, FAIXA_ORCAMENTO_LABELS, PRAZO_OBRA_LABELS } from '#models/lead'
import AmbienteCatalogo from '#models/ambiente_catalogo'
import OrigemLeadCatalogo from '#models/origem_lead_catalogo'
import CampanhaLead from '#models/campanha_lead'

test.group('Configurações & Parametrização CRM', () => {
  test('bloqueia acesso a usuários não autenticados em /configuracoes', async ({ client }) => {
    const response = await client.get('/configuracoes')
    response.assertRedirectsTo('/login')
  })

  test('bloqueia acesso de perfil vendedor em /configuracoes com 403', async ({ client }) => {
    let vendedor = await User.findBy('email', 'vendedor.teste.cfg@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Cfg',
        email: 'vendedor.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    const response = await client.get('/configuracoes').loginAs(vendedor)
    response.assertStatus(403)
  })

  test('permite acesso de perfil diretoria e gerente comercial em /configuracoes', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const response = await client.get('/configuracoes').loginAs(diretoria)
    response.assertStatus(200)

    let gerente = await User.findBy('email', 'gerente.teste.cfg@lidermoveis.com.br')
    if (!gerente) {
      gerente = await User.create({
        nome: 'Gerente Teste Cfg',
        email: 'gerente.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.GERENTE_COMERCIAL,
        isActive: true,
        isSuperuser: false,
      })
    }

    const responseGerente = await client.get('/configuracoes').loginAs(gerente)
    responseGerente.assertStatus(200)
  })

  test('CRUD completo de Ambientes de catálogo', async ({ client, assert }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Criar ambiente
    const createRes = await client
      .post('/configuracoes/ambientes')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Espaço Adega Subterrânea',
        categoria: 'Área Social',
        ordem: 150,
        isActive: true,
      })
    createRes.assertStatus(201)
    const ambienteId = createRes.body().id
    assert.exists(ambienteId)

    // 2. Toggle status
    const toggleRes = await client
      .patch(`/configuracoes/ambientes/${ambienteId}/toggle`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    toggleRes.assertStatus(200)
    assert.isFalse(toggleRes.body().isActive)

    // 3. Update ambiente
    const updateRes = await client
      .put(`/configuracoes/ambientes/${ambienteId}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Espaço Adega & Degustação',
        ordem: 160,
        isActive: true,
      })
    updateRes.assertStatus(200)
    assert.equal(updateRes.body().nome, 'Espaço Adega & Degustação')

    // 4. Delete ambiente
    const deleteRes = await client
      .delete(`/configuracoes/ambientes/${ambienteId}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    deleteRes.assertStatus(200)

    const findDeleted = await AmbienteCatalogo.find(ambienteId)
    assert.isNull(findDeleted)
  })

  test('CRUD completo de Origens de Lead de catálogo e rejeição de slug duplicado', async ({ client, assert }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Criar origem com geração automática de slug
    const createRes = await client
      .post('/configuracoes/origens')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Feira Casa Cor 2026',
      })
    createRes.assertStatus(201)
    const origemId = createRes.body().id
    assert.equal(createRes.body().slug, 'feira_casa_cor_2026')

    // 2. Tentar criar duplicata do mesmo slug
    const duplicateRes = await client
      .post('/configuracoes/origens')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Feira Casa Cor 2026',
        slug: 'feira_casa_cor_2026',
      })
    duplicateRes.assertStatus(400)

    // 3. Toggle status
    const toggleRes = await client
      .patch(`/configuracoes/origens/${origemId}/toggle`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    toggleRes.assertStatus(200)
    assert.isFalse(toggleRes.body().isActive)

    // 4. Excluir origem
    const deleteRes = await client
      .delete(`/configuracoes/origens/${origemId}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    deleteRes.assertStatus(200)

    const findDeleted = await OrigemLeadCatalogo.find(origemId)
    assert.isNull(findDeleted)
  })

  test('CRUD completo de Campanhas de Lead', async ({ client, assert }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Criar campanha
    const createRes = await client
      .post('/configuracoes/campanhas')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Campanha de Primavera Teste',
        dataInicio: '2026-09-01',
        dataFim: '2026-11-30',
        isActive: true,
      })
    createRes.assertStatus(201)
    const campanhaId = createRes.body().id

    // 2. Toggle status
    const toggleRes = await client
      .patch(`/configuracoes/campanhas/${campanhaId}/toggle`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    toggleRes.assertStatus(200)
    assert.isFalse(toggleRes.body().isActive)

    // 3. Excluir campanha
    const deleteRes = await client
      .delete(`/configuracoes/campanhas/${campanhaId}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
    deleteRes.assertStatus(200)

    const findDeleted = await CampanhaLead.find(campanhaId)
    assert.isNull(findDeleted)
  })

  test('Qualificação de lead com novas faixas de investimento, prazo venda futura e ambiente Outro', async ({
    client,
    assert,
  }) => {
    let vendedor = await User.findBy('email', 'vendedor.teste.cfg@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Cfg',
        email: 'vendedor.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    // Cria lead preliminar
    const lead = await Lead.create({
      nome: 'Cliente Qualificação R2 R3',
      telefone: '(11) 98888-7777',
      email: 'cliente.teste.r2r3@gmail.com',
      cidade: 'São Paulo',
      estado: 'SP',
      origem: 'instagram',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })

    // Submete qualificação com faixa 300k_500k, venda_futura_18m e ambiente personalizado Outro
    await client
      .post(`/crm/leads/${lead.id}/qualificar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .form({
        faixaOrcamento: '300k_500k',
        prazoObra: 'venda_futura_18m',
        tipoImovel: 'apartamento',
        ambientesInteresse: ['Cozinha', 'Living', 'Home Theater', 'Outro: Adega Climatizada'],
        orcamentoEstimado: 450000,
        decisorPresente: true,
        observacoes: 'Apartamento duplex comprado na planta.',
      })

    await lead.refresh()
    assert.isTrue(lead.qualificado)
    assert.equal(lead.faixaOrcamento, '300k_500k')
    assert.equal(lead.prazoObra, 'venda_futura_18m')
    assert.equal(lead.statusFunil, StatusFunil.EM_VISITA)

    // Verifica compatibilidade dos labels
    assert.equal(FAIXA_ORCAMENTO_LABELS['300k_500k'], 'R$ 300.000 a R$ 500.000')
    assert.equal(PRAZO_OBRA_LABELS['venda_futura_18m'], 'Venda futura (acima de 18 meses)')

    // Verifica ambientes contendo o texto descritivo de "Outro"
    const ambientes = Array.isArray(lead.ambientesInteresse)
      ? lead.ambientesInteresse
      : JSON.parse(lead.ambientesInteresse)
    assert.include(ambientes, 'Outro: Adega Climatizada')
    assert.include(ambientes, 'Home Theater')
    assert.include(ambientes, 'Living')

    // Cleanup
    await lead.delete()
  })

  test('Mantém compatibilidade reversa com chaves legadas de orçamento e prazo', async ({ assert }) => {
    // Chaves legadas existentes no banco
    assert.equal(FAIXA_ORCAMENTO_LABELS['ate_40k'], 'Até R$ 40.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['40k_80k'], 'R$ 40.000 a R$ 80.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['acima_300k'], 'Acima de R$ 300.000 (Alto Padrão)')

    // Novas chaves R2
    assert.equal(FAIXA_ORCAMENTO_LABELS['ate_80k'], 'Até R$ 80.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['80k_150k'], 'R$ 80.000 a R$ 150.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['150k_300k'], 'R$ 150.000 a R$ 300.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['300k_500k'], 'R$ 300.000 a R$ 500.000')
    assert.equal(FAIXA_ORCAMENTO_LABELS['acima_500k'], 'Acima de R$ 500.000')

    // Prazos
    assert.equal(PRAZO_OBRA_LABELS['pronto_imediato'], 'Imóvel pronto / Início imediato')
    assert.equal(PRAZO_OBRA_LABELS['ate_3_meses'], 'Entrega em até 3 meses')
    assert.equal(PRAZO_OBRA_LABELS['ate_6_meses'], 'Entrega em 3 a 6 meses')
    assert.equal(PRAZO_OBRA_LABELS['mais_12_meses'], 'Entrega em mais de 12 meses')
    assert.equal(PRAZO_OBRA_LABELS['venda_futura_18m'], 'Venda futura (acima de 18 meses)')
  })

  test('Validação impede qualificação com lista de ambientes vazia', async ({ client, assert }) => {
    let vendedor = await User.findBy('email', 'vendedor.teste.cfg@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Cfg',
        email: 'vendedor.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    const lead = await Lead.create({
      nome: 'Lead Ambientes Vazios',
      telefone: '(11) 97777-6666',
      origem: 'outro',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })

    await client
      .post(`/crm/leads/${lead.id}/qualificar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .form({
        faixaOrcamento: '80k_150k',
        prazoObra: 'ate_3_meses',
        tipoImovel: 'apartamento',
        ambientesInteresse: [],
      })

    await lead.refresh()
    // Não deve qualificar
    assert.isFalse(lead.qualificado)

    await lead.delete()
  })

  test('Validação estrita rejeita opção Outro sem descrição textual obrigatória (R3)', async ({
    client,
    assert,
  }) => {
    let vendedor = await User.findBy('email', 'vendedor.teste.cfg@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Cfg',
        email: 'vendedor.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    const lead = await Lead.create({
      nome: 'Lead Outro Sem Descricao',
      telefone: '(11) 96666-5555',
      origem: 'outro',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })

    // 1. Tentar qualificar enviando apenas "Outro"
    const resOutroPuro = await client
      .post(`/crm/leads/${lead.id}/qualificar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        faixaOrcamento: '80k_150k',
        prazoObra: 'ate_3_meses',
        tipoImovel: 'apartamento',
        ambientesInteresse: ['Cozinha', 'Outro'],
        decisorPresente: true,
      })
    resOutroPuro.assertStatus(422)

    // 2. Tentar qualificar enviando "Outro: " com descrição em branco
    const resOutroEspaco = await client
      .post(`/crm/leads/${lead.id}/qualificar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        faixaOrcamento: '80k_150k',
        prazoObra: 'ate_3_meses',
        tipoImovel: 'apartamento',
        ambientesInteresse: ['Cozinha', 'Outro:   '],
        decisorPresente: true,
      })
    resOutroEspaco.assertStatus(422)

    await lead.refresh()
    assert.isFalse(lead.qualificado)

    await lead.delete()
  })

  test('Validação estrita rejeita ambiente em branco ou com menos de 2 caracteres', async ({
    client,
    assert,
  }) => {
    let vendedor = await User.findBy('email', 'vendedor.teste.cfg@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Cfg',
        email: 'vendedor.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    const lead = await Lead.create({
      nome: 'Lead Ambiente Invalido',
      telefone: '(11) 95555-4444',
      origem: 'outro',
      statusFunil: StatusFunil.NOVO_LEAD,
      vendedorId: vendedor.id,
      qualificado: false,
    })

    const response = await client
      .post(`/crm/leads/${lead.id}/qualificar`)
      .loginAs(vendedor)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        faixaOrcamento: '80k_150k',
        prazoObra: 'ate_3_meses',
        tipoImovel: 'apartamento',
        ambientesInteresse: [' '],
        decisorPresente: true,
      })
    response.assertStatus(422)

    await lead.refresh()
    assert.isFalse(lead.qualificado)

    await lead.delete()
  })

  test('Rejeição de origem com caracteres inválidos que produzem slug vazio', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const response = await client
      .post('/configuracoes/origens')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: '???---',
      })
    response.assertStatus(400)
  })

  test('Validação de campanhas rejeita data inválida e término anterior ao início', async ({
    client,
  }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Data inválida (não formato ISO)
    const resInvalida = await client
      .post('/configuracoes/campanhas')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Campanha Data Invalida',
        dataInicio: 'data-invalida',
      })
    resInvalida.assertStatus(422)

    // 2. Data fim anterior à data início
    const resInvertida = await client
      .post('/configuracoes/campanhas')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Campanha Datas Invertidas',
        dataInicio: '2026-10-01',
        dataFim: '2026-09-01',
      })
    resInvertida.assertStatus(400)
  })

  test('Edição completa (PUT) de campanhas com coerência cronológica', async ({ client, assert }) => {
    let diretoria = await User.findBy('email', 'diretoria.teste.cfg@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Cfg',
        email: 'diretoria.teste.cfg@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const campanha = await CampanhaLead.create({
      nome: 'Campanha Edição Teste',
      isActive: true,
    })

    // Edição válida com novas datas
    const updateRes = await client
      .put(`/configuracoes/campanhas/${campanha.id}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        nome: 'Campanha Edição Atualizada',
        dataInicio: '2026-10-01',
        dataFim: '2026-12-31',
      })
    updateRes.assertStatus(200)

    await campanha.refresh()
    assert.equal(campanha.nome, 'Campanha Edição Atualizada')
    assert.isNotNull(campanha.dataInicio)
    assert.isNotNull(campanha.dataFim)

    // Tentativa de edição com datas invertidas
    const failRes = await client
      .put(`/configuracoes/campanhas/${campanha.id}`)
      .loginAs(diretoria)
      .withCsrfToken()
      .header('accept', 'application/json')
      .json({
        dataInicio: '2026-12-31',
        dataFim: '2026-10-01',
      })
    failRes.assertStatus(400)

    await campanha.delete()
  })
})
