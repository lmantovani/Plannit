import pg from 'pg'

const baseUrl = 'http://localhost:3333'
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

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
  return res
}

async function runHttpTests() {
  console.log('==============================================================================')
  console.log(' TESTE HTTP END-TO-END: MÓDULO DE COLABORADORES & RH (RH-RN009 / RH-RN011)')
  console.log('==============================================================================')

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
    // 1. RBAC: Vendedor tentando acessar RH (Deve ser barrado com 403)
    // ---------------------------------------------------------------------------
    console.log('\n--- 1. RBAC: Tentativa de Acesso por Usuário Não Autorizado (Vendedor) ---')
    await loginUser('vendedor@lidermoveis.com.br')
    const vendedorAcessoRes = await fetch(`${baseUrl}/colaboradores?format=json`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
      },
    })
    assert(vendedorAcessoRes.status === 403, 'Acesso de Vendedor ao RH bloqueado com HTTP 403')

    // ---------------------------------------------------------------------------
    // 2. Autenticação como Administrador / Diretoria
    // ---------------------------------------------------------------------------
    console.log('\n--- 2. Autenticação como Diretoria & Listagem Geral ---')
    const loginAdminRes = await loginUser('admin@plannit.com.br', 'Admin@123456')
    assert([200, 302].includes(loginAdminRes.status), 'Login da Diretoria efetuado com sucesso')

    // 1. Validação de rota Inertia
    const indexInertiaRes = await fetch(`${baseUrl}/colaboradores`, {
      headers: {
        'Cookie': getCookieHeader(),
        'X-Inertia': 'true',
      },
    })
    updateCookies(indexInertiaRes)
    assert([200, 409].includes(indexInertiaRes.status), 'GET /colaboradores responde com sucesso na rota Inertia (status 200/409)')

    // 2. Validação dos dados via API JSON
    const indexJsonRes = await fetch(`${baseUrl}/colaboradores?format=json`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
      },
    })
    assert(indexJsonRes.status === 200, 'GET /colaboradores?format=json responde com HTTP 200')

    const indexData = await indexJsonRes.json()
    assert(Array.isArray(indexData.colaboradores), 'Prop "colaboradores" é uma lista')
    assert(indexData.colaboradores.length >= 4, 'Pelo menos 4 colaboradores listados')
    assert(typeof indexData.kpis === 'object', 'Prop "kpis" presente no payload')
    assert(indexData.kpis.total >= 4, 'KPIs de headcount calculados corretamente')

    // ---------------------------------------------------------------------------
    // 3. Departamentos e Cargos (APIs de Apoio)
    // ---------------------------------------------------------------------------
    console.log('\n--- 3. Verificando Rotas de Apoio (Departamentos e Cargos) ---')
    const deptosRes = await fetch(`${baseUrl}/colaboradores/departamentos`, {
      headers: { 'Cookie': getCookieHeader() },
    })
    const deptos = await deptosRes.json()
    assert(deptosRes.status === 200, 'GET /colaboradores/departamentos responde HTTP 200')
    assert(Array.isArray(deptos) && deptos.length >= 5, 'Departamentos listados com sucesso')

    const cargosRes = await fetch(`${baseUrl}/colaboradores/cargos`, {
      headers: { 'Cookie': getCookieHeader() },
    })
    const cargos = await cargosRes.json()
    assert(cargosRes.status === 200, 'GET /colaboradores/cargos responde HTTP 200')
    assert(Array.isArray(cargos) && cargos.length >= 5, 'Cargos listados com sucesso')

    const deptoTeste = deptos[0]
    const cargoTeste = cargos.find((c) => c.departamentoId === deptoTeste.id) || cargos[0]

    // ---------------------------------------------------------------------------
    // 4. Cadastro de Novo Colaborador (com lançamentos inaugurais automáticos)
    // ---------------------------------------------------------------------------
    console.log('\n--- 4. Cadastro de Novo Colaborador & Admissão Automática ---')
    const uniqueCpf = `999.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-99`
    const payloadNovo = {
      nome: 'Mariana Teste E2E',
      cpf: uniqueCpf,
      rg: '11.222.333-X',
      dataAdmissao: '2025-01-10',
      departamentoId: cargoTeste.departamentoId,
      cargoId: cargoTeste.id,
      regime: 'clt',
      modalidade: 'presencial',
      salarioClt: 7500.0,
      remuneracaoComplementar: 1000.0,
      telefoneCorporativo: '(11) 98888-7777',
      emailCorporativo: `mariana.teste.${Date.now()}@lidermoveis.com.br`,
      perfilDiscPrimario: 'dominante',
      perfilDiscSecundario: 'cauteloso',
    }

    const storeRes = await fetch(`${baseUrl}/colaboradores?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify(payloadNovo),
    })
    updateCookies(storeRes)
    assert(storeRes.status === 201, 'POST /colaboradores cria colaborador com status 201')
    const novoColab = await storeRes.json()
    assert(novoColab.id > 0, `Novo colaborador criado com ID: ${novoColab.id}`)

    // ---------------------------------------------------------------------------
    // 5. Prontuário Completo e Validação de Históricos Inaugurais
    // ---------------------------------------------------------------------------
    console.log('\n--- 5. Detalhamento e Históricos Inaugurais ---')
    const showRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
      },
    })
    const showData = await showRes.json()
    assert(showRes.status === 200, 'GET /colaboradores/:id responde com HTTP 200')
    assert(showData.id === novoColab.id, 'Dados cadastrais retornados com precisão')
    assert(Array.isArray(showData.historicoSalarial), 'Histórico salarial presente no prontuário')
    assert(showData.historicoSalarial.length >= 1, 'Histórico salarial inaugural de admissão criado automaticamente')
    assert(showData.historicoSalarial[0].motivo === 'Admissão', 'Motivo do primeiro salário é "Admissão"')
    assert(showData.historicoSalarial[0].salarioClt === 7500.0, 'Salário inaugural coincide com o informado')

    assert(Array.isArray(showData.historicoCargos), 'Histórico de cargos presente no prontuário')
    assert(showData.historicoCargos.length >= 1, 'Histórico de cargo inaugural criado automaticamente')
    assert(showData.historicoCargos[0].cargoNovoId === cargoTeste.id, 'Cargo inicial coincide com o informado')

    // ---------------------------------------------------------------------------
    // 6. Guardrail RH-RN009: Bloqueio Estrito de Edição Direta de Salário ou Cargo
    // ---------------------------------------------------------------------------
    console.log('\n--- 6. Guardrail RH-RN009: Tentativa de Alteração Direta de Salário/Cargo ---')
    const updateDiretoSalarioRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({ salarioClt: 9999.0 }),
    })
    assert(updateDiretoSalarioRes.status === 400, 'RH-RN009: Alteração direta de salário via PUT é REJEITADA com HTTP 400')

    const updateDiretoCargoRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({ cargoId: 99 }),
    })
    assert(updateDiretoCargoRes.status === 400, 'RH-RN009: Alteração direta de cargo via PUT é REJEITADA com HTTP 400')

    // ---------------------------------------------------------------------------
    // 7. RH-RN009: Lançamento de Reajuste Salarial Imutável
    // ---------------------------------------------------------------------------
    console.log('\n--- 7. Lançamento no Histórico Salarial Imutável (RH-RN009) ---')
    const novoSalarioRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}/historico-salarial?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({
        salarioClt: 8800.0,
        remuneracaoComplementar: 1200.0,
        dataVigencia: '2025-06-01',
        motivo: 'Mérito / Promoção Semestral',
      }),
    })
    assert(novoSalarioRes.status === 201, 'POST /historico-salarial grava reajuste com status 201')

    // Verifica se o salário atual do colaborador foi atualizado
    const showPosSalario = await (
      await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
        headers: { 'Accept': 'application/json', 'Cookie': getCookieHeader() },
      })
    ).json()
    assert(showPosSalario.salarioClt === 8800.0, 'Salário vigente do colaborador atualizado para R$ 8.800,00')
    assert(showPosSalario.historicoSalarial.length === 2, 'Histórico salarial agora possui 2 registros auditados')

    // ---------------------------------------------------------------------------
    // 8. RH-RN009: Desligamento Formal (Soft Delete)
    // ---------------------------------------------------------------------------
    console.log('\n--- 8. Desligamento Formal (RH-RN009 Soft Delete) ---')
    const desligarRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}/desligar?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({
        dataDesligamento: '2025-12-31',
        tipoDesligamento: 'acordo_mutuo',
        motivoDesligamento: 'Acordo consensual entre partes.',
        entrevistaSaida: 'Feedback altamente positivo da experiência.',
      }),
    })
    assert(desligarRes.status === 200, 'POST /desligar processa desligamento formal com status 200')

    const colabPosDesligamento = await (
      await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
        headers: { 'Accept': 'application/json', 'Cookie': getCookieHeader() },
      })
    ).json()
    assert(colabPosDesligamento.isActive === false, 'RH-RN009: Campo is_active está estritamente false')
    assert(colabPosDesligamento.tipoDesligamento === 'acordo_mutuo', 'Tipo de desligamento registrado com precisão')

    // ---------------------------------------------------------------------------
    // 9. Guardrail RH-RN011: Purga Restrita à Diretoria e Apenas para Desligados
    // ---------------------------------------------------------------------------
    console.log('\n--- 9. Guardrail RH-RN011: Purga Administrativa ---')
    // Tentativa de purga por VENDEDOR (Deve ser bloqueada com 403)
    await loginUser('vendedor@lidermoveis.com.br')
    const purgaVendedorRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
    })
    assert(purgaVendedorRes.status === 403, 'RH-RN011: Tentativa de purga por usuário comum bloqueada com HTTP 403')

    // Login novamente como Diretoria
    await loginUser('admin@plannit.com.br', 'Admin@123456')

    // Tentativa de purga em colaborador ATIVO (deve falhar com 400)
    // Criamos um temporário ativo:
    const colabAtivoRes = await fetch(`${baseUrl}/colaboradores?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({
        nome: 'Colaborador Ativo Nao Purgavel',
        cpf: `888.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-88`,
        dataAdmissao: '2025-01-01',
        departamentoId: cargoTeste.departamentoId,
        cargoId: cargoTeste.id,
        regime: 'clt',
        salarioClt: 5000.0,
      }),
    })
    const colabAtivo = await colabAtivoRes.json()

    const purgaAtivoRes = await fetch(`${baseUrl}/colaboradores/${colabAtivo.id}?format=json`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
    })
    assert(purgaAtivoRes.status === 400, 'RH-RN011: Purga em colaborador ATIVO é BLOQUEADA com HTTP 400')

    // Purga legítima no colaborador DESLIGADO (novoColab)
    const purgaDesligadoRes = await fetch(`${baseUrl}/colaboradores/${novoColab.id}?format=json`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
    })
    assert(purgaDesligadoRes.status === 204, 'RH-RN011: Purga em colaborador DESLIGADO executada com sucesso (HTTP 204)')

    // Validação forense no PostgreSQL: registro deve ter sido removido
    const checkDb = await pool.query('SELECT count(*) FROM colaboradores WHERE id = $1', [novoColab.id])
    assert(Number(checkDb.rows[0].count) === 0, 'Registro expurgado fisicamente do banco de dados')

    // Limpa o colaborador ativo temporário pós-desligamento
    await fetch(`${baseUrl}/colaboradores/${colabAtivo.id}/desligar?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({ dataDesligamento: '2025-12-31', tipoDesligamento: 'rescisao_pj', motivoDesligamento: 'Limpeza de teste' }),
    })
    await fetch(`${baseUrl}/colaboradores/${colabAtivo.id}?format=json`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'Cookie': getCookieHeader(), 'X-XSRF-TOKEN': xsrfToken },
    })

    console.log('\n==============================================================================')
    console.log(` TODOS OS TESTES HTTP PASSARAM COM SUCESSO! Total: ${totalAssertions} asserções`)
    console.log('==============================================================================\n')
  } finally {
    await pool.end()
  }
}

runHttpTests().catch((err) => {
  console.error('\n❌ ERRO NA SUÍTE HTTP:', err)
  process.exit(1)
})
