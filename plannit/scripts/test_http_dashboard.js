import assert from 'node:assert'

const baseUrl = 'http://localhost:3333'
let totalAssertions = 0

function pass(msg) {
  totalAssertions++
  console.log(`  ✓ [${totalAssertions}] ${msg}`)
}

let cookieJar = new Map()
let xsrfToken = ''
let inertiaVersion = ''

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

  const versionHeader = res.headers.get('x-inertia-version')
  if (versionHeader) {
    inertiaVersion = versionHeader
  }
}

function getCookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function loginUser(email, password = 'Teste@123') {
  cookieJar.clear()
  xsrfToken = ''

  const loginPageRes = await fetch(`${baseUrl}/login`)
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
  assert.ok(res.status === 302 || res.status === 200, `Login deveria retornar 302 ou 200 (retornou ${res.status})`)
}

async function fetchInertia(url, options = {}) {
  const headers = {
    Cookie: getCookieHeader(),
    'X-Inertia': 'true',
    ...(inertiaVersion ? { 'X-Inertia-Version': inertiaVersion } : {}),
    ...(options.headers || {}),
  }

  let res = await fetch(url, { ...options, headers })
  updateCookies(res)

  if (res.status === 409) {
    headers['X-Inertia-Version'] = inertiaVersion
    res = await fetch(url, { ...options, headers })
    updateCookies(res)
  }

  return res
}

async function run() {
  console.log('\n==============================================================================')
  console.log(' SUÍTE HTTP END-TO-END: DASHBOARD GERENCIAL & ESTAGNAÇÃO RN016 (FASE 8)')
  console.log('==============================================================================\n')

  // 1. Autenticação
  console.log('--- 1. Autenticação como Diretoria ---')
  await loginUser('admin@plannit.com.br', 'Admin@123456')
  pass('Login de Diretoria efetuado com sucesso')

  // 2. Consulta à rota GET /dashboard via Inertia
  console.log('\n--- 2. Carregamento do Painel Consolidado (Inertia) ---')
  const resDash = await fetchInertia(`${baseUrl}/dashboard`)
  assert.strictEqual(resDash.status, 200, 'GET /dashboard deve responder HTTP 200')
  const data = await resDash.json()
  assert.strictEqual(data.component, 'dashboard', 'Componente Inertia deve ser "dashboard"')
  pass('Dashboard acessado e renderizado via Inertia')

  // 3. Validação dos KPIs Executivos do Resumo
  console.log('\n--- 3. Validação dos Indicadores Agregados (Resumo) ---')
  const resumo = data.props.resumo
  assert.ok(typeof resumo === 'object', 'Objeto resumo deve estar presente')
  assert.ok(resumo.projetosAtivos >= 1, 'Projetos ativos deve ser >= 1')
  assert.ok(typeof resumo.taxaConversaoPct === 'number', 'Taxa de conversão deve ser numérica')
  assert.ok(resumo.totalClientes >= 2, 'Total de clientes cadastrados deve ser >= 2')
  assert.ok(resumo.totalEspecificadores >= 1, 'Total de especificadores cadastrados deve ser >= 1')
  assert.ok(resumo.totalColaboradores >= 1, 'Headcount de colaboradores deve ser >= 1')
  pass('KPIs de Projetos, CRM, Clientes, Especificadores e RH consolidados com sucesso')

  // 4. Validação da Regra RN016 — Alerta de Estagnação (> 5 dias sem avanço)
  console.log('\n--- 4. Validação Estrita do Alerta de Estagnação RN016 ---')
  const alertas = data.props.alertasRn016
  assert.ok(Array.isArray(alertas), 'Prop alertasRn016 deve ser um array')
  assert.ok(alertas.length >= 1, 'Deve detectar pelo menos 1 projeto estagnado (> 5 dias)')
  const alertaAlvo = alertas.find((a) => a.codigo === 'PROJ-2026-ALERTA')
  assert.ok(!!alertaAlvo, 'Projeto estagnado "PROJ-2026-ALERTA" deve constar no alerta')
  assert.ok(alertaAlvo.diasParado >= 7, 'Dias parado deve ser >= 7 (projeto criado com 8 dias de atraso)')
  pass('Regra RN016 validada: projeto estagnado há mais de 5 dias identificado com precisão')

  // 5. Validação do Monitor de Ocupação WIP dos Projetistas (RN003)
  console.log('\n--- 5. Validação da Capacidade Operacional da Equipe 3D (WIP) ---')
  const projetistasWip = data.props.projetistasWip
  assert.ok(Array.isArray(projetistasWip), 'Prop projetistasWip deve ser um array')
  assert.ok(projetistasWip.length >= 1, 'Deve listar projetistas com capacidade mapeada')
  const primeiroProjetista = projetistasWip[0]
  assert.ok(typeof primeiroProjetista.wipAtual === 'number', 'wipAtual deve ser numérico')
  assert.ok(typeof primeiroProjetista.wipLimit === 'number', 'wipLimit deve ser numérico')
  assert.ok(typeof primeiroProjetista.pode === 'boolean', 'pode (autorização de nova alocação) deve ser booleano')
  pass('Capacidade da equipe de modelagem 3D (WIP) integrada ao Dashboard')

  // 6. Validação da Lista Operacional de Projetos Recentes
  console.log('\n--- 6. Validação da Tabela Operacional de Projetos ---')
  const projetosRecentes = data.props.projetosRecentes
  assert.ok(Array.isArray(projetosRecentes), 'projetosRecentes deve ser uma lista')
  assert.ok(projetosRecentes.length >= 1, 'Deve retornar projetos em andamento')
  const projetoComAlerta = projetosRecentes.find((p) => p.codigo === 'PROJ-2026-ALERTA')
  assert.ok(!!projetoComAlerta, 'Projeto estagnado deve constar na tabela operacional')
  assert.strictEqual(projetoComAlerta.alertaParado, true, 'alertaParado deve ser true para o projeto com mais de 5 dias')
  pass('Tabela operacional destaca projetos em dia e projetos com alerta RN016')

  console.log(`\n==============================================================================`)
  console.log(` TODOS OS TESTES HTTP DO DASHBOARD (RN016) PASSARAM! Total: ${totalAssertions} asserções`)
  console.log(`==============================================================================\n`)
}

run().catch((err) => {
  console.error('\n❌ ERRO NA SUÍTE HTTP DASHBOARD:', err)
  process.exit(1)
})
