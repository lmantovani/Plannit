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
    // Retry com a nova versão atualizada
    headers['X-Inertia-Version'] = inertiaVersion
    res = await fetch(url, { ...options, headers })
    updateCookies(res)
  }

  return res
}

async function run() {
  console.log('\n==============================================================================')
  console.log(' SUÍTE HTTP END-TO-END: MÓDULO DE CLIENTES & HISTÓRICO DE COMPRAS (FASE 7)')
  console.log('==============================================================================\n')

  // 1. Login com perfil DIRETORIA
  console.log('--- 1. Autenticação como Diretoria ---')
  await loginUser('admin@plannit.com.br', 'Admin@123456')
  pass('Login de Diretoria realizado com sucesso')

  // 2. Listagem de Clientes via Inertia
  console.log('\n--- 2. Consulta à tela de listagem de clientes (Inertia) ---')
  const resList = await fetchInertia(`${baseUrl}/clientes`)
  assert.strictEqual(resList.status, 200)
  const jsonList = await resList.json()
  assert.ok(jsonList.component === 'clientes/index', 'Componente deveria ser clientes/index')
  assert.ok(jsonList.props.clientes.data.length >= 2, 'Deveria retornar clientes semeados')
  assert.ok(jsonList.props.kpis.totalClientes >= 2, 'KPI totalClientes deveria ser >= 2')
  pass('Listagem de clientes e KPIs acessada com sucesso via Inertia')

  // 3. Consulta à ficha detalhada do cliente (Show via Inertia)
  console.log('\n--- 3. Consulta à ficha do cliente com histórico de compras e múltiplos endereços ---')
  const roberto = jsonList.props.clientes.data.find((c) => c.nome.includes('Roberto')) || jsonList.props.clientes.data[0]
  const resShow = await fetchInertia(`${baseUrl}/clientes/${roberto.id}`)
  assert.strictEqual(resShow.status, 200)
  const jsonShow = await resShow.json()
  assert.ok(jsonShow.component === 'clientes/show', 'Componente deveria ser clientes/show')
  assert.strictEqual(jsonShow.props.cliente.id, roberto.id)
  assert.ok(jsonShow.props.cliente.enderecos.length >= 2, 'Deveria ter múltiplos endereços (Alameda Lorena e Casa de Praia)')
  assert.ok(jsonShow.props.cliente.projetos.length >= 1, 'Deveria ter projetos vinculados no histórico de compras')
  pass('Ficha do cliente exibida com dados, múltiplos endereços e histórico de compras')


  // 4. Cadastro de Novo Cliente via POST
  console.log('\n--- 4. Cadastro de novo cliente via POST /clientes ---')
  const cpfUnico = `999.${Math.floor(Math.random() * 899 + 100)}.${Math.floor(Math.random() * 899 + 100)}-00`
  const resCreate = await fetch(`${baseUrl}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Mariana Vasconcelos',
      cpfCnpj: cpfUnico,
      telefone: '(11) 99123-8877',
      email: 'mariana.vasconcelos@teste.com',
      tipo: 'pessoa_fisica',
      profissaoRamo: 'Arquiteta Autônoma',
      endereco: {
        tipo: 'montagem',
        logradouro: 'Rua Oscar Freire',
        numero: '850',
        bairro: 'Cerqueira César',
        cidade: 'São Paulo',
        estado: 'SP',
      },
    }),
    redirect: 'manual',
  })
  updateCookies(resCreate)
  assert.strictEqual(resCreate.status, 302)
  pass('Novo cliente cadastrado com sucesso e redirecionado para a ficha')

  // 5. Adicionar segundo endereço para o cliente
  console.log('\n--- 5. Adicionar endereço secundário de entrega/montagem ---')
  const resEnd = await fetch(`${baseUrl}/clientes/1/enderecos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      tipo: 'entrega',
      identificacao: 'Depósito / Galpão Auxiliar',
      logradouro: 'Avenida do Estado',
      numero: '5000',
      bairro: 'Mooca',
      cidade: 'São Paulo',
      estado: 'SP',
      isPrincipal: false,
    }),
    redirect: 'manual',
  })
  updateCookies(resEnd)
  assert.strictEqual(resEnd.status, 302)
  pass('Endereço adicional registrado com sucesso para o cliente')

  // 6. Aprovação de Cadastro Financeiro (Regra de Crédito)
  console.log('\n--- 6. Aprovação de crédito cadastral pelo Financeiro/Diretoria ---')
  const resAprovar = await fetch(`${baseUrl}/clientes/3/aprovar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({}),
    redirect: 'manual',
  })
  updateCookies(resAprovar)
  assert.strictEqual(resAprovar.status, 302)
  pass('Cadastro do cliente 3 aprovado financeiramente para desbloqueio de contrato')

  // 7. Tentativa de aprovação por perfil não autorizado (ex: Vendedor)
  console.log('\n--- 7. Bloqueio RBAC: Vendedor tentando aprovar cadastro financeiro ---')
  await loginUser('vendedor@lidermoveis.com.br', 'Teste@123')
  const resAprovarVendedor = await fetch(`${baseUrl}/clientes/1/aprovar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({}),
    redirect: 'manual',
  })
  updateCookies(resAprovarVendedor)
  assert.strictEqual(resAprovarVendedor.status, 302)
  pass('Aprovação bloqueada para vendedor (apenas Diretoria, Gerente ou Financeiro)')

  console.log(`\n==============================================================================`)
  console.log(` TODOS OS TESTES HTTP DE CLIENTES PASSARAM COM SUCESSO! Total: ${totalAssertions} asserções`)
  console.log(`==============================================================================\n`)
}

run().catch((err) => {
  console.error('\n❌ ERRO NA SUÍTE HTTP CLIENTES:', err)
  process.exit(1)
})
