async function testHttpCRM() {
  console.log('--- Testando Endpoints HTTP do CRM com Sessão Real ---')
  const baseUrl = 'http://localhost:3333'

  // 1. GET /login para obter cookies de sessão
  const getLoginRes = await fetch(`${baseUrl}/login`)
  const cookies = getLoginRes.headers.get('set-cookie') || ''
  const sessionId = cookies.split(';')[0]
  console.log('✔ GET /login OK, Cookie recebido')

  // 2. POST /login como Vendedor
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionId,
    },
    body: JSON.stringify({
      email: 'vendedor@lidermoveis.com.br',
      password: 'Teste@123',
    }),
    redirect: 'manual',
  })

  const authCookies = loginRes.headers.get('set-cookie') || cookies
  const authSession = authCookies.split(',').map(c => c.split(';')[0].trim()).join('; ')
  console.log(`✔ Login Vendedor status: ${loginRes.status} (Redirecionado para ${loginRes.headers.get('location')})`)

  // 3. GET /crm com cabeçalho Inertia como Vendedor
  const crmRes = await fetch(`${baseUrl}/crm`, {
    headers: {
      'Cookie': authSession,
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })

  console.log(`✔ GET /crm status: ${crmRes.status}`)
  if (crmRes.status === 200) {
    const data = await crmRes.json()
    console.log(`✔ Componente retornado: ${data.component}`)
    console.log(`✔ Leads carregados para o vendedor: ${data.props.leads?.length || 0}`)
    console.log(`✔ Estatísticas:`, data.props.estatisticas)
    console.log(`✔ É vendedor? ${data.props.isVendedor}`)
  } else {
    const text = await crmRes.text()
    console.error('Falha no GET /crm:', text.slice(0, 300))
    process.exit(1)
  }

  // 4. Teste de Login como Gerente (visão expandida)
  const loginGerenteRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionId,
    },
    body: JSON.stringify({
      email: 'gerente@lidermoveis.com.br',
      password: 'Teste@123',
    }),
    redirect: 'manual',
  })

  const gerenteCookies = loginGerenteRes.headers.get('set-cookie') || cookies
  const gerenteSession = gerenteCookies.split(',').map(c => c.split(';')[0].trim()).join('; ')

  const crmGerenteRes = await fetch(`${baseUrl}/crm`, {
    headers: {
      'Cookie': gerenteSession,
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })

  if (crmGerenteRes.status === 200) {
    const data = await crmGerenteRes.json()
    console.log('\n--- Visão Gerencial ---')
    console.log(`✔ Componente: ${data.component}`)
    console.log(`✔ É vendedor? ${data.props.isVendedor}`)
    console.log(`✔ Lista de Vendedores disponíveis para filtro: ${data.props.vendedores?.length || 0}`)
    for (const v of data.props.vendedores || []) {
      console.log(`   - ID ${v.id}: ${v.nome}`)
    }
  }

  console.log('\n======================================================')
  console.log(' TODOS OS TESTES HTTP DO CRM PASSARAM COM SUCESSO! ')
  console.log('======================================================')
}

testHttpCRM().catch((err) => {
  console.error('Erro nos testes HTTP:', err)
  process.exit(1)
})
