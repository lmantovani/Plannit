async function testHttpBriefings() {
  console.log('==================================================================')
  console.log(' TESTE HTTP END-TO-END: BRIEFINGS & SCORE INTELIGENTE (RN002) ')
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

  // 2. Login como Vendedor
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
  console.log(`✔ Login efetuado com sucesso (Redirecionado para ${loginRes.headers.get('location')})`)

  // 3. GET /briefings via Inertia
  const briefingsRes = await fetch(`${baseUrl}/briefings`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  updateCookies(briefingsRes)
  console.log(`✔ GET /briefings status: ${briefingsRes.status}`)

  const briefingsData = await briefingsRes.json()
  console.log(`✔ Componente Inertia: ${briefingsData.component}`)
  console.log(`✔ Total de briefings listados: ${briefingsData.props.briefings?.length}`)
  console.log(`✔ Métricas de Score no Dashboard:`, briefingsData.props.stats)

  const b1 = briefingsData.props.briefings.find(b => b.projeto?.codigo === 'PRJ-2026-001')
  const b2 = briefingsData.props.briefings.find(b => b.projeto?.codigo === 'PRJ-2026-002')

  if (!b1 || !b2) {
    throw new Error('Briefings de teste b1 e b2 não localizados!')
  }

  console.log(`\n• Briefing 1 (Incompleto): ID ${b1.id}, Score: ${b1.score} pts, Apto: ${b1.aprovado}`)
  console.log(`• Briefing 2 (Completo): ID ${b2.id}, Score: ${b2.score} pts, Apto: ${b2.aprovado}`)

  // 4. GET /briefings/:id/edit via Inertia
  const editRes = await fetch(`${baseUrl}/briefings/${b2.id}/edit`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  updateCookies(editRes)
  console.log(`\n✔ GET /briefings/${b2.id}/edit status: ${editRes.status}`)
  const editData = await editRes.json()
  console.log(`✔ Componente formulário: ${editData.component}`)
  console.log(`✔ Cliente em edição: ${editData.props.briefing.projeto?.clienteNome}`)
  console.log(`✔ Score Breakdown no formulário: ${editData.props.scoreBreakdown.score} pts (Aprovado: ${editData.props.scoreBreakdown.aprovado})`)
  console.log(`✔ Ambientes detalhados no formulário: ${editData.props.briefing.ambientesDetalhados.length}`)

  // 5. POST /briefings/calcular-score (Endpoint AJAX de feedback em tempo real)
  console.log('\n--- Testando Endpoint AJAX de Prévia do Score ---')
  const calcRes = await fetch(`${baseUrl}/briefings/calcular-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      cidadeObra: 'Belo Horizonte',
      ambientes: ['cozinha', 'dormitorio'],
      prazoDesejado: '2026-12-01',
      faixaInvestimentoMin: 50000,
      faixaInvestimentoMax: 90000,
    }),
  })
  const calcData = await calcRes.json()
  console.log(`✔ Prévia calculada pelo backend: Score ${calcData.score}/${calcData.scoreMinimo} pts (Aprovado: ${calcData.aprovado})`)
  console.log(`✔ Critérios faltantes listados:`, calcData.pontosFaltantes)

  // 6. Teste da Regra RN002 — Tentar enviar briefing incompleto para fila (deve ser bloqueado)
  console.log('\n--- Validando RN002: Bloqueio Estrito no Envio de Briefing Incompleto (< 70 pts) ---')
  const enviarIncompletoRes = await fetch(`${baseUrl}/briefings/${b1.id}/enviar-para-fila`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    redirect: 'manual',
  })
  updateCookies(enviarIncompletoRes)
  console.log(`✔ Requisição de envio do Briefing Incompleto (${b1.score} pts) redirecionou: Status ${enviarIncompletoRes.status}`)

  // Verifica que o status permaneceu "rascunho"
  const checkB1Res = await fetch(`${baseUrl}/briefings`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkB1Data = await checkB1Res.json()
  const b1Atualizado = checkB1Data.props.briefings.find(b => b.id === b1.id)
  if (b1Atualizado.status !== 'rascunho') {
    throw new Error('Falha na regra RN002: briefing incompleto teve o status indevidamente alterado!')
  }
  console.log('✔ RN002 Validada com Sucesso: Briefing 1 foi BLOQUEADO e permanece com status "rascunho"!')

  // 7. Teste de Envio de Briefing Completo (>= 70 pts) para a Fila
  console.log('\n--- Enviando Briefing Completo (>= 70 pts) para a Fila de Projetos ---')
  const enviarCompletoRes = await fetch(`${baseUrl}/briefings/${b2.id}/enviar-para-fila`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
      'X-Inertia': 'true',
    },
    redirect: 'manual',
  })
  updateCookies(enviarCompletoRes)
  console.log(`✔ Envio do Briefing Completo (${b2.score} pts): Status ${enviarCompletoRes.status}`)

  // Verifica no banco via GET /briefings
  const checkB2Res = await fetch(`${baseUrl}/briefings`, {
    headers: { 'Cookie': getCookieHeader(), 'X-Inertia': 'true', 'X-Inertia-Version': '1' },
  })
  const checkB2Data = await checkB2Res.json()
  const b2Atualizado = checkB2Data.props.briefings.find(b => b.id === b2.id)
  console.log(`✔ Briefing 2 atualizado no banco: Status = "${b2Atualizado.status}"`)
  console.log(`✔ Projeto vinculado atualizado: Status = "${b2Atualizado.projeto?.status}"`)

  if (b2Atualizado.status !== 'enviado' || b2Atualizado.projeto?.status !== 'na_fila') {
    throw new Error('Falha no fluxo de envio do briefing aprovado para a fila!')
  }
  console.log('✔ Fluxo RN002 e Transição de Projeto Aprovados com Sucesso!')

  console.log('\n===============================================================')
  console.log(' TODOS OS TESTES HTTP DE BRIEFINGS & RN002 PASSARAM COM SUCESSO! ')
  console.log('===============================================================')
}

testHttpBriefings().catch(err => {
  console.error('Erro nos testes HTTP:', err)
  process.exit(1)
})
