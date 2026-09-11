import { spawn } from 'node:child_process'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

const baseUrl = process.env.APP_URL || 'http://localhost:3333'
let serverProcess = null

// Gerenciador de Cookies e Sessão
let cookieJar = new Map()
let xsrfToken = ''

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

async function loginUser(email, password = 'Teste@123') {
  if (cookieJar.size > 0 && xsrfToken) {
    try {
      const logoutRes = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Cookie': getCookieHeader(),
          'X-XSRF-TOKEN': xsrfToken,
        },
        redirect: 'manual',
      })
      updateCookies(logoutRes)
    } catch (_) {}
  }

  const loginPageRes = await fetch(`${baseUrl}/login`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  updateCookies(loginPageRes)

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
  return res
}

function cleanup() {
  if (serverProcess) {
    console.log('[Cleanup] Encerrando servidor Adonis iniciado automaticamente...')
    serverProcess.kill('SIGTERM')
    serverProcess = null
  }
}

process.on('exit', cleanup)
process.on('SIGINT', () => {
  cleanup()
  process.exit(1)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(1)
})

async function ensureServerRunning() {
  try {
    const res = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(1500) })
    if (res.status) {
      console.log(`✔ Servidor Adonis já em execução na URL: ${baseUrl}`)
      return
    }
  } catch (_) {
    console.log(`[Info] Servidor não detectado em ${baseUrl}. Iniciando servidor Adonis via ace serve...`)
    serverProcess = spawn('node', ['ace', 'serve'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      detached: false,
    })

    const startTime = Date.now()
    while (Date.now() - startTime < 30000) {
      await new Promise((r) => setTimeout(r, 1000))
      try {
        const check = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(1000) })
        if (check.status) {
          console.log(`✔ Servidor Adonis iniciado com sucesso na porta 3333!`)
          return
        }
      } catch (_) {}
    }
    throw new Error('Timeout aguardando inicialização do servidor Adonis na porta 3333')
  }
}

async function runHttpTests() {
  console.log('==============================================================================')
  console.log(' TESTE HTTP END-TO-END: MÓDULO DE ESPECIFICADORES (R1 A R4 & RN017)')
  console.log('==============================================================================')

  await ensureServerRunning()

  // Limpa preventivamente especificadores de teste de execuções anteriores para garantir idempotência
  await pool.query(`DELETE FROM arquitetos WHERE email LIKE '%@e2e-teste.com.br'`)

  let totalAssertions = 0
  function assert(condition, message) {
    totalAssertions++
    if (!condition) {
      throw new Error(`[FALHA] Asserção #${totalAssertions} falhou: ${message}`)
    }
    console.log(`  ✔ [${totalAssertions}] ${message}`)
  }

  try {
    // ---------------------------------------------------------------------------
    // 1. Handshake Inicial e Autenticação
    // ---------------------------------------------------------------------------
    console.log('\n--- 1. Autenticação e Sessão Real (Vendedor Líder) ---')

  const loginPageRes = await fetch(`${baseUrl}/login`)
  updateCookies(loginPageRes)
  assert(loginPageRes.status === 200, 'GET /login responde com HTTP 200')
  assert(xsrfToken.length > 0, 'CSRF token capturado com sucesso no handshake')

  // Login como Vendedor
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      email: 'vendedor@lidermoveis.com.br',
      password: 'Teste@123',
    }),
    redirect: 'manual',
  })
  updateCookies(loginRes)
  assert([302, 303, 200].includes(loginRes.status), `POST /login autentica com sucesso (status ${loginRes.status})`)

  // ---------------------------------------------------------------------------
  // 2. GET /especificadores via Inertia (Props, KPIs e Metas)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Listagem de Especificadores (GET /especificadores com X-Inertia) ---')

  const indexInertiaRes = await fetch(`${baseUrl}/especificadores`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  updateCookies(indexInertiaRes)
  assert([200, 409].includes(indexInertiaRes.status), 'GET /especificadores responde com sucesso (status 200/409 Inertia)')

  const indexData = await indexInertiaRes.json()
  assert(indexData.component === 'especificadores/index', 'Componente Inertia é "especificadores/index"')
  assert(Array.isArray(indexData.props.especificadores), 'Prop "especificadores" é uma lista')
  assert(indexData.props.especificadores.length >= 8, 'Pelo menos 8 especificadores ativos listados')
  assert(typeof indexData.props.kpis === 'object', 'Prop "kpis" está presente')
  assert(typeof indexData.props.minhaMeta === 'object', 'Prop "minhaMeta" está presente')
  assert(Array.isArray(indexData.props.consultores), 'Prop "consultores" está presente')

  // Validação dos dados de um arquiteto na listagem
  const campeao = indexData.props.especificadores.find((e) => e.nome === 'Sofia Valente Arquitetura Campeã')
  assert(!!campeao, 'Sofia Valente Campeã encontrada na listagem')
  assert(campeao.score.segmento === 'campeao', 'Sofia Valente possui segmento "campeao"')
  assert(campeao.score.scoreGeral >= 85, 'Sofia Valente possui scoreGeral >= 85')
  assert(campeao.score.flags.includes('top_indicador'), 'Sofia Valente possui flag "top_indicador"')

  // Teste de busca textual
  const buscaRes = await fetch(`${baseUrl}/especificadores?busca=Sofia`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  const buscaData = await buscaRes.json()
  assert(buscaData.props.especificadores.length >= 1, 'Busca textual por "Sofia" retorna resultados')
  assert(buscaData.props.especificadores.every((e) => e.nome.includes('Sofia')), 'Todos os resultados contêm "Sofia"')

  // ---------------------------------------------------------------------------
  // 3. Criação de Novo Especificador (POST /especificadores)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Cadastro de Novo Especificador (POST /especificadores) ---')

  const uniqueEmail = `beta.design.${Date.now()}.${Math.floor(Math.random() * 10000)}@e2e-teste.com.br`
  const payloadNovoArq = {
    nome: 'Estúdio Design Beta E2E',
    escritorio: 'Beta Design Interiores',
    enderecoEscritorio: 'Rua Augusta, 2200 - Consolação, São Paulo - SP',
    telefone: '(11) 98888-7766',
    email: uniqueEmail,
    nivelParceria: 'parceiro',
    tipo: 'designer_interiores',
    especialidade: 'Iluminação & Marcenaria',
    statusCarteira: 'em_prospeccao',
  }

  const storeRes = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify(payloadNovoArq),
  })
  updateCookies(storeRes)
  assert(storeRes.status === 201, `POST /especificadores cria especificador com status 201`)

  const arqCriado = await storeRes.json()
  assert(arqCriado.id > 0, `Novo especificador ID gerado: ${arqCriado.id}`)
  assert(arqCriado.nome === payloadNovoArq.nome, 'Nome do especificador persistido corretamente')
  const novoArqId = arqCriado.id

  // ---------------------------------------------------------------------------
  // 4. Detalhamento e Score Analítico (GET /especificadores/:id & :id/score)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Detalhamento e Score Analítico ---')

  const showRes = await fetch(`${baseUrl}/especificadores/${novoArqId}?format=json`, {
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
    },
  })
  assert(showRes.status === 200, `GET /especificadores/${novoArqId} responde com HTTP 200`)
  const showData = await showRes.json()
  assert(showData.arquiteto.id === novoArqId, 'Dados cadastrais retornados no endpoint show')
  assert(typeof showData.score === 'object', 'Payload de score analítico incluído no show')
  assert(showData.score.segmento === 'inativo', 'Novo especificador sem projetos inicia como "inativo"')

  // Endpoint dedicado de score
  const scoreRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/score`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  assert(scoreRes.status === 200, 'GET /especificadores/:id/score responde com HTTP 200')
  const scoreData = await scoreRes.json()
  assert(typeof scoreData.rfv === 'number', 'Score RFV retornado')
  assert(typeof scoreData.potencial === 'number', 'Score Potencial retornado')
  assert(typeof scoreData.lealdade === 'number', 'Score Lealdade retornado')

  // ---------------------------------------------------------------------------
  // 5. Reatribuição de Dono de Carteira e Histórico Imutável (RN017 & RBAC)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Reatribuição de Dono e Auditoria Imutável (RN017 & RBAC) ---')

  // Obtém ID do Gerente Comercial
  const { rows: gerenteRows } = await pool.query(
    `SELECT id, nome FROM users WHERE email = 'gerente@lidermoveis.com.br'`
  )
  const gerenteId = gerenteRows[0].id

  // 5.1 Teste RBAC: Vendedor não possui autorização para transferir carteira (deve retornar 403)
  const reatribuirVendedorRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/dono?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorNovoId: gerenteId,
      motivo: 'Tentativa indevida de transferência por vendedor',
    }),
  })
  assert(reatribuirVendedorRes.status === 403, 'PATCH /especificadores/:id/dono por VENDEDOR é rejeitado com HTTP 403 (RBAC)')

  // 5.2 Autentica como Gerente Comercial para executar operações de gestão
  const loginGerenteRes = await loginUser('gerente@lidermoveis.com.br', 'Teste@123')
  assert([302, 303, 200].includes(loginGerenteRes.status), 'POST /login autentica com sucesso como Gerente Comercial')

  const reatribuirRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/dono?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorNovoId: gerenteId,
      motivo: 'Transferência de carteira comercial para validação RN017 em script automatizado',
    }),
  })
  updateCookies(reatribuirRes)
  assert(reatribuirRes.status === 200, 'PATCH /especificadores/:id/dono como GESTOR responde com HTTP 200')

  // Consulta histórico imutável via API
  const historicoRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/historico-dono`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  assert(historicoRes.status === 200, 'GET /especificadores/:id/historico-dono responde com HTTP 200')
  const historicoList = await historicoRes.json()
  assert(historicoList.length >= 1, 'Registro de histórico imutável gravado com sucesso')
  const ultimoHistorico = historicoList[0]
  assert(ultimoHistorico.consultorNovoId === gerenteId, 'Novo consultor gravado com precisão no histórico')
  assert(
    ultimoHistorico.motivo.includes('validação RN017'),
    'Motivo da transferência registrado imutavelmente'
  )

  // ---------------------------------------------------------------------------
  // 6. Sub-recurso: Interações Comerciais (POST & GET)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Gestão de Interações Comerciais ---')

  const criarInteracaoRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/interacoes?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      tipo: 'visita_escritorio',
      resumo: 'Visita presencial ao escritório para entrega do novo mostruário Líder 2026.',
      data: new Date().toISOString(),
    }),
  })
  updateCookies(criarInteracaoRes)
  assert(criarInteracaoRes.status === 201, 'POST /especificadores/:id/interacoes cria interação (status 201)')

  const interacoesListRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/interacoes`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  const interacoesList = await interacoesListRes.json()
  assert(interacoesList.length >= 1, 'Interação listada no histórico do especificador')
  assert(interacoesList[0].tipo === 'visita_escritorio', 'Tipo da interação coincide com o cadastrado')

  // ---------------------------------------------------------------------------
  // 7. Sub-recurso: Decisores do Escritório (CRUD e Unicidade de Principal)
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Gestão de Decisores (CRUD e Unicidade de Decisor Principal) ---')

  // Decisor 1 (Principal)
  const d1Res = await fetch(`${baseUrl}/especificadores/${novoArqId}/decisores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Renata Lemos',
      cargo: 'Sócia-Diretora',
      telefone: '(11) 98765-4321',
      email: 'renata@betadesign.com.br',
      isPrincipal: true,
    }),
  })
  assert(d1Res.status === 201, 'Decisor 1 criado com isPrincipal = true')
  const d1 = await d1Res.json()

  // Decisor 2 (Secundário)
  const d2Res = await fetch(`${baseUrl}/especificadores/${novoArqId}/decisores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Felipe Santana',
      cargo: 'Arquiteto de Interiores',
      telefone: '(11) 98765-1122',
      email: 'felipe@betadesign.com.br',
      isPrincipal: false,
    }),
  })
  assert(d2Res.status === 201, 'Decisor 2 criado com isPrincipal = false')
  const d2 = await d2Res.json()

  // Promove Decisor 2 a Principal (deve resetar o Decisor 1)
  const promoRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/decisores/${d2.id}?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      isPrincipal: true,
    }),
  })
  assert(promoRes.status === 200, 'Decisor 2 promovido para isPrincipal = true')

  const decisoresCheckRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/decisores`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  const decisoresList = await decisoresCheckRes.json()
  const d1Atualizado = decisoresList.find((d) => d.id === d1.id)
  const d2Atualizado = decisoresList.find((d) => d.id === d2.id)
  assert(d2Atualizado.isPrincipal === true, 'Decisor 2 é agora o principal')
  assert(d1Atualizado.isPrincipal === false, 'Decisor 1 foi resetado para isPrincipal = false (garantia de unicidade)')

  // Remove Decisor 2
  const delDecisorRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/decisores/${d2.id}?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  assert(delDecisorRes.status === 200, 'DELETE decisor responde com HTTP 200')

  // ---------------------------------------------------------------------------
  // 8. Sub-recurso: Concorrentes e Risco (CRUD)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Monitoramento de Concorrência ---')

  const concRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/concorrentes?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nomeConcorrente: 'Artefacto Planejados',
      percentualFechamentoEstimado: 55.0,
      observacoes: 'Forte presença em dormitórios de luxo.',
    }),
  })
  assert(concRes.status === 201, 'POST concorrente cria registro (status 201)')
  const conc = await concRes.json()

  // Atualiza percentual do concorrente para 65% (eleva risco para "alto")
  const concPatchRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/concorrentes/${conc.id}?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      percentualFechamentoEstimado: 65.0,
    }),
  })
  assert(concPatchRes.status === 200, 'PATCH concorrente atualiza percentual')

  const concListRes = await fetch(`${baseUrl}/especificadores/${novoArqId}/concorrentes`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  const concList = await concListRes.json()
  assert(concList.length >= 1, 'Concorrente listado no especificador')
  assert(Number(concList[0].percentualFechamentoEstimado) === 65.0, 'Percentual atualizado para 65%')

  // ---------------------------------------------------------------------------
  // 9. Metas de Visitas Comerciais por Consultor (RBAC)
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Metas de Visitas Comerciais por Consultor (RBAC) ---')

  const { rows: vendedorRows } = await pool.query(
    `SELECT id FROM users WHERE email = 'vendedor@lidermoveis.com.br'`
  )
  const vendedorId = vendedorRows[0].id

  // 9.1 Gerente altera meta do consultor vendedor para 18 visitas
  const metaPutRes = await fetch(`${baseUrl}/especificadores/metas-visitas?format=json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorId: vendedorId,
      metaVisitasMes: 18,
    }),
  })
  assert(metaPutRes.status === 200, 'PUT /especificadores/metas-visitas atualiza meta (Gerente definindo para Vendedor)')

  // 9.2 Autentica como Vendedor para validar endpoint /me e testar restrição RBAC
  const loginVendedor2Res = await loginUser('vendedor@lidermoveis.com.br', 'Teste@123')
  assert([302, 303, 200].includes(loginVendedor2Res.status), 'POST /login autentica novamente como Vendedor')

  const metaMeRes = await fetch(`${baseUrl}/especificadores/metas-visitas/me`, {
    headers: { 'Cookie': getCookieHeader() },
  })
  assert(metaMeRes.status === 200, 'GET /especificadores/metas-visitas/me responde com HTTP 200')
  const metaMeData = await metaMeRes.json()
  assert(metaMeData.metaVisitasMes === 18, 'Meta individual retornada reflete a atualização (18 visitas)')

  // 9.3 Vendedor tentando alterar a meta de outro consultor é bloqueado com 403 Forbidden (RBAC)
  const metaPutVendedorBloqueadoRes = await fetch(`${baseUrl}/especificadores/metas-visitas?format=json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorId: gerenteId,
      metaVisitasMes: 25,
    }),
  })
  assert(metaPutVendedorBloqueadoRes.status === 403, 'PUT /metas-visitas de outro consultor por VENDEDOR é rejeitado com HTTP 403 Forbidden')

  // Restaura meta do vendedor para 15 imediatamente
  await pool.query(
    `UPDATE metas_visitas_consultor SET meta_visitas_mes = 15 WHERE consultor_id = $1`,
    [vendedorId]
  )

  // ---------------------------------------------------------------------------
  // 10. Soft Delete e Guardrail RN017 (DELETE /especificadores/:id)
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Validação de Soft Delete Estrito e RBAC (RN017) ---')

  // 10.1 Vendedor comum (não gestor e não dono deste especificador) tenta inativar -> 403 Forbidden
  const deleteVendedorBloqueadoRes = await fetch(`${baseUrl}/especificadores/${novoArqId}?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  assert(deleteVendedorBloqueadoRes.status === 403, 'DELETE /especificadores/:id por consultor não-dono é rejeitado com HTTP 403 (RBAC)')

  // 10.2 Autentica novamente como Gerente Comercial (gestor e dono atual) para exclusão lógica
  const loginGerente2Res = await loginUser('gerente@lidermoveis.com.br', 'Teste@123')
  assert([302, 303, 200].includes(loginGerente2Res.status), 'POST /login autentica novamente como Gerente Comercial')

  const deleteRes = await fetch(`${baseUrl}/especificadores/${novoArqId}?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  assert(deleteRes.status === 200, 'DELETE /especificadores/:id por GESTOR responde com HTTP 200')

  // 1. Verifica no banco que o registro NUNCA foi removido fisicamente
  const { rows: dbRows } = await pool.query(
    `SELECT id, nome, is_active FROM arquitetos WHERE id = $1`,
    [novoArqId]
  )
  assert(dbRows.length === 1, 'Registro ainda existe fisicamente no banco de dados')
  assert(dbRows[0].is_active === false, 'Campo is_active está estritamente false (RN017 cumprida)')

  // 2. Verifica que ele NÃO aparece na listagem ativa padrão
  const indexPosDeleteRes = await fetch(`${baseUrl}/especificadores`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  const indexPosDeleteData = await indexPosDeleteRes.json()
  const encontrado = indexPosDeleteData.props.especificadores.some((e) => e.id === novoArqId)
  assert(encontrado === false, 'Especificador desativado não aparece na listagem ativa padrão')

  console.log('\n==============================================================================')
  console.log(` TODOS OS TESTES HTTP E2E PASSARAM COM SUCESSO! Total de asserções: ${totalAssertions}`)
  console.log('==============================================================================')
  } finally {
    console.log('\n[Teardown] Executando limpeza no PostgreSQL para garantir isolamento e idempotência...')
    try {
      await pool.query(`DELETE FROM arquitetos WHERE email LIKE '%@e2e-teste.com.br'`)
      const { rows: vRows } = await pool.query(
        `SELECT id FROM users WHERE email = 'vendedor@lidermoveis.com.br'`
      )
      if (vRows.length > 0) {
        await pool.query(
          `UPDATE metas_visitas_consultor SET meta_visitas_mes = 15 WHERE consultor_id = $1`,
          [vRows[0].id]
        )
      }
      console.log('✔ Teardown concluído: dados temporários removidos e meta restaurada para 15.')
    } catch (cleanErr) {
      console.error('Erro durante teardown no banco:', cleanErr)
    }
  }
}

runHttpTests()
  .then(() => {
    cleanup()
    pool.end()
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ ERRO NA SUITE DE TESTES HTTP:', err)
    cleanup()
    pool.end()
    process.exit(1)
  })
