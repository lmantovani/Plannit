/**
 * Suíte de Testes Empíricos e Adversariais — Challenger 1
 * Saneamento R2: RN001 (Qualificação), RN017 (Auditoria Imutável) e R2 (Integridade de Clientes)
 */
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

const baseUrl = process.env.APP_URL || 'http://localhost:3333'

let cookieJar = new Map()
let xsrfToken = ''
let totalAssertions = 0

function updateCookies(res) {
  const rawSetCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')]
  for (const sc of rawSetCookies) {
    if (!sc) continue
    const [nameVal] = sc.split(';')
    const [name, ...valParts] = nameVal.split('=')
    const val = valParts.join('=')
    cookieJar.set(name.trim(), val.trim())
    if (name.trim() === 'XSRF-TOKEN') {
      xsrfToken = decodeURIComponent(val.trim())
    }
  }
}

function getCookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

function assert(condition, message) {
  totalAssertions++
  if (!condition) {
    throw new Error(`[FALHA DE DESAFIO] Asserção #${totalAssertions} falhou: ${message}`)
  }
  console.log(`  ✔ [${totalAssertions}] ${message}`)
}

async function loginUser(email, password = 'Teste@123') {
  cookieJar.clear()
  xsrfToken = ''

  const loginPageRes = await fetch(`${baseUrl}/login`)
  updateCookies(loginPageRes)
  assert(loginPageRes.status === 200, 'GET /login responde com 200 OK')
  assert(xsrfToken.length > 0, 'XSRF-TOKEN capturado no handshake inicial')

  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  })
  updateCookies(res)
  assert([302, 303, 200].includes(res.status), `Login de ${email} autenticado (status ${res.status})`)
}

async function cleanupTestData() {
  console.log('\n[Limpeza] Removendo dados de teste de execuções anteriores...')
  await pool.query(`DELETE FROM historico_status_projeto WHERE observacao LIKE '%(RN017)%' AND projeto_id IN (SELECT id FROM projetos WHERE codigo LIKE 'PRJ-CHALL%')`)
  await pool.query(`DELETE FROM fila_projetos WHERE projeto_id IN (SELECT id FROM projetos WHERE codigo LIKE 'PRJ-CHALL%')`)
  await pool.query(`DELETE FROM ambientes_briefing WHERE briefing_id IN (SELECT b.id FROM briefings b JOIN projetos p ON p.id = b.projeto_id WHERE p.codigo LIKE 'PRJ-CHALL%')`)
  await pool.query(`DELETE FROM briefings WHERE projeto_id IN (SELECT id FROM projetos WHERE codigo LIKE 'PRJ-CHALL%')`)
  await pool.query(`DELETE FROM projetos WHERE codigo LIKE 'PRJ-CHALL%'`)
  await pool.query(`DELETE FROM enderecos_cliente WHERE cliente_id IN (SELECT id FROM clientes WHERE email LIKE '%@challenger-teste.com%')`)
  await pool.query(`DELETE FROM clientes WHERE email LIKE '%@challenger-teste.com%'`)
  await pool.query(`DELETE FROM leads WHERE email LIKE '%@challenger-teste.com%'`)
  console.log('[Limpeza] Base de dados saneada para o teste.')
}

async function runChallengerSuite() {
  console.log('==============================================================================')
  console.log(' SUÍTE DE TESTES EMPÍRICOS — CHALLENGER 1 (SANEAMENTO R2) ')
  console.log(' Escopo: RN001 (Qualificação), RN017 (Auditoria Imutável), R2 (Clientes/Projetos)')
  console.log('==============================================================================')

  await cleanupTestData()

  // Usuário Vendedor para as ações
  const { rows: userRows } = await pool.query(`SELECT id, nome, email, perfil FROM users WHERE email = 'vendedor@lidermoveis.com.br'`)
  assert(userRows.length > 0, 'Usuário vendedor@lidermoveis.com.br existe no banco')
  const vendedor = userRows[0]

  await loginUser('vendedor@lidermoveis.com.br', 'Teste@123')

  // ---------------------------------------------------------------------------
  // TESTE 1: RN001 — Rejeição de criação de briefing/projeto com lead NÃO qualificado
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 1: RN001 — Tentativa de Criar Briefing com Lead Não Qualificado ---')
  
  const { rows: [leadNaoQualificado] } = await pool.query(`
    INSERT INTO leads (nome, email, telefone, origem, status_funil, qualificado, vendedor_id, created_at, updated_at)
    VALUES ('Lead Não Qualificado RN001', 'lead.naoqualif@challenger-teste.com', '(11) 97777-1111', 'instagram', 'qualificando', false, $1, NOW(), NOW())
    RETURNING id, nome, qualificado
  `, [vendedor.id])
  assert(!leadNaoQualificado.qualificado, 'Lead de teste 1 criado com qualificado = false')

  const resStoreNaoQualif = await fetch(`${baseUrl}/briefings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      leadId: leadNaoQualificado.id,
    }),
  })
  updateCookies(resStoreNaoQualif)

  assert(resStoreNaoQualif.status === 400, `POST /briefings rejeitado com HTTP 400 (retornou ${resStoreNaoQualif.status})`)
  const bodyStoreNaoQualif = await resStoreNaoQualif.json()
  assert(bodyStoreNaoQualif.code === 'RN001_LEAD_NAO_QUALIFICADO', `Código de erro retornado é RN001_LEAD_NAO_QUALIFICADO (retornou: ${bodyStoreNaoQualif.code})`)
  assert(bodyStoreNaoQualif.message.includes('RN001'), `Mensagem de erro referencia explicitamente RN001`)

  // Verifica no banco que nenhum projeto nem briefing foi gerado
  const { rows: prjNaoCriado } = await pool.query(`SELECT id FROM projetos WHERE lead_id = $1`, [leadNaoQualificado.id])
  assert(prjNaoCriado.length === 0, 'Nenhum projeto foi inserido no banco para o lead não qualificado')

  // Borda: Lead inexistente
  const resLeadInexistente = await fetch(`${baseUrl}/briefings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      leadId: 99999999,
    }),
  })
  assert(resLeadInexistente.status === 400, 'POST /briefings com leadId inexistente retorna HTTP 400')
  const bodyInexistente = await resLeadInexistente.json()
  assert(bodyInexistente.code === 'LEAD_NOT_FOUND', 'Código LEAD_NOT_FOUND retornado corretamente')

  // ---------------------------------------------------------------------------
  // TESTE 2: RN001 — Rejeição de conversão de lead NÃO qualificado
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 2: RN001 — Tentativa de Converter Lead Não Qualificado em Cliente ---')

  const resConverterNaoQualif = await fetch(`${baseUrl}/clientes/converter-lead/${leadNaoQualificado.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Tentativa Cliente Invalido',
      email: 'tentativa.invalida@challenger-teste.com',
      telefone: '(11) 99999-0000',
      tipo: 'pessoa_fisica',
    }),
  })
  updateCookies(resConverterNaoQualif)

  assert(resConverterNaoQualif.status === 400, `POST /clientes/converter-lead com lead não qualificado retorna HTTP 400 (retornou ${resConverterNaoQualif.status})`)
  const bodyConverterNaoQualif = await resConverterNaoQualif.json()
  assert(bodyConverterNaoQualif.code === 'RN001_LEAD_NAO_QUALIFICADO', `Código RN001_LEAD_NAO_QUALIFICADO retornado`)
  assert(bodyConverterNaoQualif.message.includes('RN001: Lead não pode ser convertido sem qualificação registrada'), 'Mensagem informativa RN001 validada')

  // Verifica no banco que lead NÃO foi marcado como convertido
  const { rows: [leadCheck] } = await pool.query(`SELECT convertido_em_cliente, cliente_id, status_funil FROM leads WHERE id = $1`, [leadNaoQualificado.id])
  assert(!leadCheck.convertido_em_cliente, 'Lead permaneceu com convertido_em_cliente = false')
  assert(leadCheck.cliente_id === null, 'Lead permaneceu com cliente_id = null')
  assert(leadCheck.status_funil !== 'fechado', 'Lead não teve seu status de funil alterado para fechado')

  // ---------------------------------------------------------------------------
  // TESTE 3: R2 — Integridade Relacional na Conversão de Lead com Projetos Associados
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 3: R2 — Conversão de Lead Qualificado e Vinculação em Massa de Projetos ---')

  const { rows: [leadQualificado] } = await pool.query(`
    INSERT INTO leads (nome, email, telefone, origem, status_funil, qualificado, vendedor_id, created_at, updated_at)
    VALUES ('Lead Qualificado R2 Teste', 'lead.qualificado.r2@challenger-teste.com', '(11) 98888-2222', 'indicacao', 'em_briefing', true, $1, NOW(), NOW())
    RETURNING id, nome, qualificado
  `, [vendedor.id])
  assert(leadQualificado.qualificado === true, 'Lead de teste 3 criado com qualificado = true')

  // Cria 2 projetos pré-existentes associados ao lead, sem cliente_id
  const { rows: [proj1] } = await pool.query(`
    INSERT INTO projetos (codigo, cliente_nome, status, lead_id, cliente_id, vendedor_id, created_at, updated_at)
    VALUES ('PRJ-CHALL-001', 'Lead Qualificado R2 Teste', 'em_briefing', $1, NULL, $2, NOW(), NOW())
    RETURNING id, codigo, cliente_id
  `, [leadQualificado.id, vendedor.id])

  const { rows: [proj2] } = await pool.query(`
    INSERT INTO projetos (codigo, cliente_nome, status, lead_id, cliente_id, vendedor_id, created_at, updated_at)
    VALUES ('PRJ-CHALL-002', 'Lead Qualificado R2 Teste', 'em_briefing', $1, NULL, $2, NOW(), NOW())
    RETURNING id, codigo, cliente_id
  `, [leadQualificado.id, vendedor.id])

  assert(proj1.cliente_id === null && proj2.cliente_id === null, 'Projetos associados inicialmente sem cliente_id')

  // Converte o lead qualificado em cliente
  const resConverterSucesso = await fetch(`${baseUrl}/clientes/converter-lead/${leadQualificado.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Cliente Convertido R2 Oficial',
      email: 'cliente.convertido.r2@challenger-teste.com',
      telefone: '(11) 98888-2222',
      tipo: 'pessoa_fisica',
      cpfCnpj: '12345678901',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
      },
    }),
  })
  updateCookies(resConverterSucesso)

  assert(resConverterSucesso.status === 201, `Conversão de lead qualificado retornou HTTP 201 (retornou ${resConverterSucesso.status})`)
  const bodyConverterSucesso = await resConverterSucesso.json()
  const novoClienteId = bodyConverterSucesso.cliente?.id
  assert(Number(novoClienteId) > 0, `Cliente criado com ID ${novoClienteId}`)

  // R2 Validação no banco de dados: Projetos do lead DEVEM ter cliente_id atualizado para novoClienteId
  const { rows: projetosAtualizados } = await pool.query(`
    SELECT id, codigo, lead_id, cliente_id FROM projetos WHERE lead_id = $1 ORDER BY id ASC
  `, [leadQualificado.id])

  assert(projetosAtualizados.length === 2, '2 projetos associados encontrados no banco')
  for (const prj of projetosAtualizados) {
    assert(
      prj.cliente_id === novoClienteId,
      `Projeto ${prj.codigo} (ID ${prj.id}) atualizado com cliente_id = ${novoClienteId} (atual: ${prj.cliente_id})`
    )
  }

  // Verifica atualização do Lead no banco
  const { rows: [leadConvertidoCheck] } = await pool.query(`
    SELECT convertido_em_cliente, cliente_id, status_funil FROM leads WHERE id = $1
  `, [leadQualificado.id])
  assert(leadConvertidoCheck.convertido_em_cliente === true, 'Lead atualizado com convertido_em_cliente = true')
  assert(leadConvertidoCheck.cliente_id === novoClienteId, `Lead associado ao novo clienteId ${novoClienteId}`)
  assert(leadConvertidoCheck.status_funil === 'fechado', 'Status de funil do lead atualizado para "fechado"')

  // ---------------------------------------------------------------------------
  // TESTE 4: R2 — Criação de Briefing a partir de Lead Qualificado sem Cliente Prévio
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 4: R2 — Criação de Briefing/Projeto via POST /briefings com Resolução de Cliente ---')

  const { rows: [leadNovoQualif] } = await pool.query(`
    INSERT INTO leads (nome, email, telefone, origem, status_funil, qualificado, vendedor_id, created_at, updated_at)
    VALUES ('Lead Qualificado Novo PRJ', 'lead.novo.prj@challenger-teste.com', '(11) 97777-3333', 'showroom', 'em_briefing', true, $1, NOW(), NOW())
    RETURNING id, nome, qualificado
  `, [vendedor.id])

  const resStoreLeadQualif = await fetch(`${baseUrl}/briefings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      leadId: leadNovoQualif.id,
    }),
    redirect: 'manual',
  })
  updateCookies(resStoreLeadQualif)
  assert([302, 303, 200, 201].includes(resStoreLeadQualif.status), `POST /briefings com lead qualificado processado com sucesso (status ${resStoreLeadQualif.status})`)

  // Verifica no banco se Projeto foi criado com cliente_id preenchido e vinculado ao lead
  const { rows: prjCriadoRows } = await pool.query(`
    SELECT p.id, p.codigo, p.cliente_id, p.lead_id, c.nome as cliente_nome
    FROM projetos p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE p.lead_id = $1
  `, [leadNovoQualif.id])

  assert(prjCriadoRows.length === 1, '1 Projeto gerado a partir do lead qualificado')
  const prjLeadNovo = prjCriadoRows[0]
  assert(Number(prjLeadNovo.cliente_id) > 0, `Projeto ${prjLeadNovo.codigo} associado ao cliente relacional ID ${prjLeadNovo.cliente_id}`)
  assert(prjLeadNovo.cliente_nome === 'Lead Qualificado Novo PRJ', 'Cliente criado automaticamente com o nome do lead')

  // ---------------------------------------------------------------------------
  // TESTE 5: RN017 — Auditoria Imutável no Envio de Briefing à Fila de Projetos
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 5: RN017 — Auditoria Imutável em HistoricoStatusProjeto no Envio para a Fila ---')

  // Cria um projeto no status "em_briefing"
  const { rows: [projetoBriefing] } = await pool.query(`
    INSERT INTO projetos (codigo, cliente_nome, status, vendedor_id, cliente_id, created_at, updated_at)
    VALUES ('PRJ-CHALL-BRIEFING', 'Cliente Briefing RN017', 'em_briefing', $1, $2, NOW(), NOW())
    RETURNING id, codigo, status
  `, [vendedor.id, novoClienteId])

  // Cria briefing completo associado ao projeto com pontuação suficiente para aprovação (score >= 70)
  const { rows: [briefingCriado] } = await pool.query(`
    INSERT INTO briefings (
      projeto_id, status, cidade_obra, estado_obra, prazo_desejado,
      faixa_investimento_min, faixa_investimento_max, estilo_preferido,
      ambientes, score, score_minimo, created_at, updated_at
    )
    VALUES (
      $1, 'rascunho', 'São Paulo', 'SP', '2026-12-31',
      80000, 150000, 'Contemporâneo',
      $2, '0', 70, NOW(), NOW()
    )
    RETURNING id, projeto_id, status
  `, [projetoBriefing.id, JSON.stringify(['cozinha', 'dormitorio'])])

  // Adiciona 2 ambientes detalhados com medidas preliminares para garantir aprovação no cálculo de score
  await pool.query(`
    INSERT INTO ambientes_briefing (briefing_id, tipo, descricao, medidas_preliminares, created_at, updated_at)
    VALUES 
      ($1, 'Cozinha Gourmet', 'Bancada em ilha com torre quente', '4.50m x 3.20m', NOW(), NOW()),
      ($1, 'Suíte Master', 'Armários com portas em vidro reflecta', '5.00m x 4.00m', NOW(), NOW())
  `, [briefingCriado.id])

  // Checa quantidade prévia de histórico para este projeto
  const { rows: historicoAntes } = await pool.query(`
    SELECT count(*) FROM historico_status_projeto WHERE projeto_id = $1
  `, [projetoBriefing.id])
  assert(Number(historicoAntes[0].count) === 0, 'Zero registros prévios em historico_status_projeto para o projeto novo')

  // Executa o envio para a fila via HTTP POST
  const resEnviarFila = await fetch(`${baseUrl}/briefings/${briefingCriado.id}/enviar-para-fila`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    redirect: 'manual',
  })
  updateCookies(resEnviarFila)

  assert([200, 302, 303].includes(resEnviarFila.status), `POST /briefings/:id/enviar-para-fila responde com sucesso (status ${resEnviarFila.status})`)

  // Validação no banco de dados: Briefing enviado e Projeto na fila
  const { rows: [briefingAtualizado] } = await pool.query(`
    SELECT id, status, score, enviado_em FROM briefings WHERE id = $1
  `, [briefingCriado.id])
  assert(briefingAtualizado.status === 'enviado', `Briefing atualizado para status "enviado" (atual: ${briefingAtualizado.status})`)
  assert(Number(briefingAtualizado.score) >= 70, `Score calculado e aprovado: ${briefingAtualizado.score} >= 70 pts`)
  assert(briefingAtualizado.enviado_em !== null, 'Campo enviado_em preenchido com timestamp')

  const { rows: [projetoAtualizado] } = await pool.query(`
    SELECT id, status FROM projetos WHERE id = $1
  `, [projetoBriefing.id])
  assert(projetoAtualizado.status === 'na_fila', `Projeto atualizado para status "na_fila" (atual: ${projetoAtualizado.status})`)

  const { rows: filaRows } = await pool.query(`
    SELECT id, projeto_id, status FROM fila_projetos WHERE projeto_id = $1
  `, [projetoBriefing.id])
  assert(filaRows.length === 1, 'Entrada gerada com sucesso na tabela fila_projetos')
  assert(filaRows[0].status === 'aguardando', 'Fila de projetos com status "aguardando"')

  // RN017 Check: Registro compulsório e imutável em HistoricoStatusProjeto
  const { rows: historicoDepois } = await pool.query(`
    SELECT id, projeto_id, status_de, status_para, alterado_por_id, observacao, created_at
    FROM historico_status_projeto
    WHERE projeto_id = $1
    ORDER BY id DESC
  `, [projetoBriefing.id])

  assert(historicoDepois.length === 1, 'Exatamente 1 registro de auditoria gravado em historico_status_projeto (RN017)')
  const hist = historicoDepois[0]
  assert(hist.status_de === 'em_briefing', `status_de registrado como "em_briefing" (atual: ${hist.status_de})`)
  assert(hist.status_para === 'na_fila', `status_para registrado como "na_fila" (atual: ${hist.status_para})`)
  assert(Number(hist.alterado_por_id) === Number(vendedor.id), `alterado_por_id registrado com ID do usuário logado (${vendedor.id})`)
  assert(hist.observacao.includes('(RN017)'), `observacao referencia explicitamente o guardrail RN017: "${hist.observacao}"`)
  assert(hist.created_at !== null, 'created_at gravado com timestamp imutável')

  // Teste de idempotência / tentativa de reenvio: não deve duplicar histórico nem permitir avanço
  const resReenviar = await fetch(`${baseUrl}/briefings/${briefingCriado.id}/enviar-para-fila`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    redirect: 'manual',
  })
  assert(resReenviar.status === 400, `Tentativa de reenvio de briefing já enviado é bloqueada com HTTP 400 (retornou ${resReenviar.status})`)

  const { rows: historicoNaoDuplicado } = await pool.query(`
    SELECT count(*) FROM historico_status_projeto WHERE projeto_id = $1
  `, [projetoBriefing.id])
  assert(Number(historicoNaoDuplicado[0].count) === 1, 'Histórico permaneceu estritamente imutável com 1 registro sem duplicidade')

  console.log('\n==============================================================================')
  console.log(` TODOS OS ${totalAssertions} TESTES EMPÍRICOS PASSARAM COM 100% DE SUCESSO! `)
  console.log(' Veredito Challenger: APPROVE')
  console.log('==============================================================================\n')
}

runChallengerSuite()
  .then(() => {
    cleanupTestData().then(() => {
      pool.end()
      process.exit(0)
    })
  })
  .catch((err) => {
    console.error('\n❌ ERRO NA EXECUÇÃO DA SUÍTE DE TESTES:', err)
    cleanupTestData().finally(() => {
      pool.end()
      process.exit(1)
    })
  })
