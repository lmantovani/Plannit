async function testHttpFila() {
  console.log('==================================================================')
  console.log(' TESTE HTTP END-TO-END: FILA DE PROJETOS & LIMITE WIP (RN003) ')
  console.log('==================================================================')
  const baseUrl = 'http://localhost:3333'

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
    return Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  // 1. Obter cookie inicial e CSRF Token via GET /login
  const getLoginRes = await fetch(`${baseUrl}/login`)
  updateCookies(getLoginRes)
  console.log('✔ Sessão inicial e token CSRF obtidos')

  // 2. Login como Gerente Comercial
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      email: 'gerente@lidermoveis.com.br',
      password: 'Teste@123',
    }),
    redirect: 'manual',
  })
  updateCookies(loginRes)
  console.log(`✔ Login do Gerente Comercial efetuado (Redirecionado para ${loginRes.headers.get('location')})`)

  // 3. GET /fila via Inertia
  const filaRes = await fetch(`${baseUrl}/fila`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  updateCookies(filaRes)
  console.log(`✔ GET /fila status: ${filaRes.status}`)

  const filaData = await filaRes.json()
  console.log(`✔ Componente Inertia: ${filaData.component}`)
  console.log(`✔ Total de itens na fila: ${filaData.props.fila?.length}`)
  console.log(`✔ Métricas da Fila:`, filaData.props.stats)
  console.log(`✔ Monitor WIP - Projetistas carregados: ${filaData.props.projetistas?.length}`)

  const andre = filaData.props.projetistas.find(p => p.email === 'andre.valente@lidermoveis.com.br')
  const mariana = filaData.props.projetistas.find(p => p.email === 'mariana.duarte@lidermoveis.com.br')
  const itemAguardando = filaData.props.fila.find(f => f.status === 'aguardando')

  if (!andre || !mariana || !itemAguardando) {
    throw new Error('Projetistas ou itens aguardando não encontrados!')
  }

  console.log(`\n• André Valente: WIP ${andre.wipAtual}/${andre.wipLimit} (Pode alocar: ${andre.pode})`)
  console.log(`• Mariana Duarte: WIP ${mariana.wipAtual}/${mariana.wipLimit} (Pode alocar: ${mariana.pode})`)
  console.log(`• Projeto para Teste: ${itemAguardando.projeto?.codigo} — ${itemAguardando.projeto?.clienteNome} (Status: ${itemAguardando.status})`)

  // 4. Teste RN003: Tentar alocar para André Valente (capacidade 3/3 lotada)
  console.log('\n--- Validando RN003: Tentativa de Alocação em Projetista Lotado ---')
  const alocarLotadoRes = await fetch(`${baseUrl}/fila/${itemAguardando.id}/alocar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    body: JSON.stringify({
      projetistaId: andre.id,
      prioridade: 2,
    }),
    redirect: 'manual',
  })
  updateCookies(alocarLotadoRes)
  console.log(`✔ Tentativa de alocar projetista lotado redirecionou: Status ${alocarLotadoRes.status}`)

  // Verifica que o projeto NÃO foi alocado
  const checkRes1 = await fetch(`${baseUrl}/fila`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkData1 = await checkRes1.json()
  const itemCheck1 = checkData1.props.fila.find(f => f.id === itemAguardando.id)
  if (itemCheck1.status !== 'aguardando' || itemCheck1.projetistaId !== null) {
    throw new Error('Falha na regra RN003: projetista lotado foi indevidamente alocado!')
  }
  console.log('✔ RN003 Validada com Sucesso: Alocação BLOQUEADA e projeto permanece "aguardando"!')

  // 5. Alocação Bem-Sucedida para Projetista Disponível (Mariana Duarte)
  console.log('\n--- Alocando Projeto para Projetista Disponível (Mariana Duarte) ---')
  const alocarLivreRes = await fetch(`${baseUrl}/fila/${itemAguardando.id}/alocar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    body: JSON.stringify({
      projetistaId: mariana.id,
      prioridade: 1,
      observacao: 'Alocação com alta prioridade para Mariana Duarte',
    }),
    redirect: 'manual',
  })
  updateCookies(alocarLivreRes)
  console.log(`✔ Alocação realizada: Status ${alocarLivreRes.status}`)

  // Verifica atualização no banco
  const checkRes2 = await fetch(`${baseUrl}/fila`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkData2 = await checkRes2.json()
  const itemCheck2 = checkData2.props.fila.find(f => f.id === itemAguardando.id)
  console.log(`✔ Status do item na fila: "${itemCheck2.status}"`)
  console.log(`✔ Projetista vinculado: ${itemCheck2.projetista?.nome}`)
  console.log(`✔ Status do projeto vinculado: "${itemCheck2.projeto?.status}"`)

  if (itemCheck2.status !== 'alocado' || itemCheck2.projeto?.status !== 'em_projeto' || itemCheck2.projetistaId !== mariana.id) {
    throw new Error('Falha na alocação do projeto!')
  }
  console.log('✔ Alocação confirmada: Projeto avançou para "em_projeto" e item para "alocado"!')

  // 6. Iniciar Execução Técnica (3D)
  console.log('\n--- Iniciando Modelagem Técnica 3D ---')
  const iniciarRes = await fetch(`${baseUrl}/fila/${itemAguardando.id}/iniciar`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    redirect: 'manual',
  })
  updateCookies(iniciarRes)
  console.log(`✔ Início de execução: Status ${iniciarRes.status}`)

  // 7. Configuração Gerencial de Limite WIP
  console.log('\n--- Testando Ajuste de Limite WIP pela Gestão ---')
  const configWipRes = await fetch(`${baseUrl}/wip/configuracoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    body: JSON.stringify({
      projetistaId: mariana.id,
      wipLimit: 4,
    }),
    redirect: 'manual',
  })
  updateCookies(configWipRes)
  console.log(`✔ Limite WIP atualizado: Status ${configWipRes.status}`)

  const checkRes3 = await fetch(`${baseUrl}/fila`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkData3 = await checkRes3.json()
  const marianaAtualizada = checkData3.props.projetistas.find(p => p.id === mariana.id)
  console.log(`✔ Novo limite de Mariana: ${marianaAtualizada.wipLimit} projetos simultâneos (WIP Atual: ${marianaAtualizada.wipAtual})`)
  if (marianaAtualizada.wipLimit !== 4) {
    throw new Error('Limite WIP não foi atualizado corretamente!')
  }

  // 8. Desalocação
  console.log('\n--- Testando Desalocação e Retorno à Fila ---')
  const desalocarRes = await fetch(`${baseUrl}/fila/${itemAguardando.id}/desalocar`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    redirect: 'manual',
  })
  updateCookies(desalocarRes)
  console.log(`✔ Desalocação efetuada: Status ${desalocarRes.status}`)

  const checkRes4 = await fetch(`${baseUrl}/fila`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkData4 = await checkRes4.json()
  const itemCheck4 = checkData4.props.fila.find(f => f.id === itemAguardando.id)
  console.log(`✔ Item retornado: status = "${itemCheck4.status}", projeto = "${itemCheck4.projeto?.status}"`)
  if (itemCheck4.status !== 'aguardando' || itemCheck4.projeto?.status !== 'na_fila') {
    throw new Error('Falha na desalocação!')
  }

  console.log('\n===============================================================')
  console.log(' TODOS OS TESTES HTTP DA FILA & RN003 PASSARAM COM SUCESSO!   ')
  console.log('===============================================================')
}

testHttpFila().catch(err => {
  console.error('Erro nos testes HTTP da fila:', err)
  process.exit(1)
})
