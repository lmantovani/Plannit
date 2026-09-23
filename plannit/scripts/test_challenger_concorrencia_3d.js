import assert from 'node:assert'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

const baseUrl = process.env.APP_URL || 'http://localhost:3333'
let totalAssertions = 0
let testsPassed = 0
let testsFailed = 0

function pass(msg) {
  totalAssertions++
  testsPassed++
  console.log(`  ✓ [PASS #${totalAssertions}] ${msg}`)
}

function fail(msg, err) {
  totalAssertions++
  testsFailed++
  console.error(`  ✗ [FAIL #${totalAssertions}] ${msg}`)
  if (err) console.error(err)
}

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
  assert.ok(
    res.status === 302 || res.status === 200,
    `Login deveria retornar 302 ou 200 (retornou ${res.status})`
  )
}

async function apiRequest(url, method = 'GET', body = null, extraHeaders = {}) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cookie': getCookieHeader(),
    'X-XSRF-TOKEN': xsrfToken,
    ...extraHeaders,
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
    redirect: 'manual',
  })

  updateCookies(res)
  const contentType = res.headers.get('content-type') || ''
  let data = null
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null)
  } else {
    data = await res.text().catch(() => '')
  }
  return { status: res.status, data, headers: res.headers }
}

async function runEmpiricalStressTests() {
  console.log('================================================================================')
  console.log(' TESTE ADVERSARIAL DE ESTRESSE & CONCORRÊNCIA — CHALLENGER 2 (SANEAMENTO R2)   ')
  console.log('================================================================================\n')

  const client = await pool.connect()

  try {
    // -------------------------------------------------------------------------
    // ETAPA 0: AUTENTICAÇÃO
    // -------------------------------------------------------------------------
    console.log('ETAPA 0: Autenticação no Plannit...')
    await loginUser('admin@plannit.com.br', 'Admin@123456')
    pass('Autenticação administrativa (Diretoria) realizada com sucesso')

    // -------------------------------------------------------------------------
    // TESTE 1: R1 — POST /especificadores com Accept: application/json
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 1: R1 — Cadastro Rápido de Especificador (AJAX / JSON) ---')
    const timestamp = Date.now()
    const arqPayload = {
      nome: `Arq. Challenger ${timestamp}`,
      tipo: 'arquiteto',
      escritorio: `Studio Challenger ${timestamp}`,
      telefone: '11999998888',
      email: `challenger_${timestamp}@plannit.test`,
      nivelParceria: 'premium',
      statusCarteira: 'ativo',
    }

    // Requisição SEM query param format=json, dependendo estritamente do header Accept: application/json
    const postArqRes = await apiRequest(`${baseUrl}/especificadores`, 'POST', arqPayload, {
      'Accept': 'application/json',
    })

    assert.strictEqual(
      postArqRes.status,
      201,
      `POST /especificadores com Accept: application/json deve responder 201 Created (retornou ${postArqRes.status})`
    )
    assert.ok(
      postArqRes.data && typeof postArqRes.data === 'object',
      'Resposta deve ser um objeto JSON com os dados do arquiteto'
    )
    assert.ok(postArqRes.data.id, 'Objeto JSON retornado deve conter o ID do arquiteto')
    assert.strictEqual(postArqRes.data.nome, arqPayload.nome, 'Nome retornado confere com o cadastrado')
    pass(`POST /especificadores respondeu HTTP 201 com JSON válido (ID: ${postArqRes.data.id})`)

    const novoArquitetoId = postArqRes.data.id

    // Verificação no banco de dados via PostgreSQL
    const arqDbRes = await client.query('SELECT * FROM arquitetos WHERE id = $1', [novoArquitetoId])
    assert.strictEqual(arqDbRes.rows.length, 1, 'Registro do arquiteto deve existir na tabela arquitetos')
    assert.strictEqual(arqDbRes.rows[0].is_active, true, 'Novo arquiteto deve estar ativo (is_active = true)')
    assert.strictEqual(arqDbRes.rows[0].escritorio, arqPayload.escritorio)
    pass('Persistência física do especificador validada no PostgreSQL')

    // -------------------------------------------------------------------------
    // TESTE 2: R1 — Sincronização de Parceiro no Briefing e Projetos
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: R1 — Sincronização e Preservação de arquiteto_id em Briefings & Projetos ---')

    // 2.1 Criar projeto e briefing dedicados para o teste de isolamento
    const projCode = `PRJ-CHALL-${timestamp}`
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', ['admin@plannit.com.br'])
    const adminUserId = userRes.rows[0].id

    const insertProjRes = await client.query(
      `INSERT INTO projetos (codigo, cliente_nome, status, vendedor_id, arquivado, alerta_parado, status_alterado_em, created_at, updated_at)
       VALUES ($1, $2, 'em_briefing', $3, false, false, NOW(), NOW(), NOW())
       RETURNING id`,
      [projCode, `Cliente Teste R1 ${timestamp}`, adminUserId]
    )
    const testProjectId = insertProjRes.rows[0].id

    const insertBriefingRes = await client.query(
      `INSERT INTO briefings (projeto_id, status, score, score_minimo, ambientes, referencias_url, created_at, updated_at)
       VALUES ($1, 'rascunho', '0', '70', '[]'::jsonb, '[]'::jsonb, NOW(), NOW())
       RETURNING id`,
      [testProjectId]
    )
    const testBriefingId = insertBriefingRes.rows[0].id
    pass(`Projeto de teste (ID: ${testProjectId}, Código: ${projCode}) e Briefing (ID: ${testBriefingId}) criados`)

    // 2.2 Salvar rascunho de briefing COM arquitetoId preenchido (PUT /briefings/:id)
    console.log('2.2 Salvando briefing com arquitetoId informado...')
    const updateBriefing1 = await apiRequest(`${baseUrl}/briefings/${testBriefingId}`, 'PUT', {
      arquitetoId: novoArquitetoId,
      arquitetoNome: arqPayload.nome,
      arquitetoEmail: arqPayload.email,
      arquitetoTelefone: arqPayload.telefone,
      cidadeObra: 'Curitiba',
      estadoObra: 'PR',
      ambientes: ['cozinha', 'suite_master'],
      observacoes: 'Briefing associado ao Arquiteto Challenger via R1',
    })

    assert.ok(
      [200, 302].includes(updateBriefing1.status),
      `PUT /briefings/:id deve aceitar atualização (status ${updateBriefing1.status})`
    )

    // Verificar no PostgreSQL se projetos.arquiteto_id foi sincronizado
    const projCheck1 = await client.query('SELECT arquiteto_id, arquiteto_nome FROM projetos WHERE id = $1', [testProjectId])
    assert.strictEqual(
      projCheck1.rows[0].arquiteto_id,
      novoArquitetoId,
      `projetos.arquiteto_id deve ser sincronizado com ${novoArquitetoId} (atual: ${projCheck1.rows[0].arquiteto_id})`
    )
    assert.strictEqual(projCheck1.rows[0].arquiteto_nome, arqPayload.nome)
    pass(`R1: projetos.arquiteto_id sincronizado com sucesso no projeto (arquiteto_id = ${novoArquitetoId})`)

    // 2.3 Salvar rascunho de briefing SEM arquitetoId no payload (atualização parcial)
    console.log('2.3 Salvando rascunho subsequente OMITINDO arquitetoId no payload...')
    const updateBriefing2 = await apiRequest(`${baseUrl}/briefings/${testBriefingId}`, 'PUT', {
      cidadeObra: 'Curitiba - Centro',
      observacoes: 'Atualização apenas de cidade e observações, arquitetoId OMITIDO',
      ambientes: ['cozinha', 'suite_master', 'closet'],
    })

    assert.ok([200, 302].includes(updateBriefing2.status))

    // Verificar no PostgreSQL que projetos.arquiteto_id FOI PRESERVADO e NÃO foi anulado!
    const projCheck2 = await client.query('SELECT arquiteto_id, arquiteto_nome FROM projetos WHERE id = $1', [testProjectId])
    assert.strictEqual(
      projCheck2.rows[0].arquiteto_id,
      novoArquitetoId,
      `projetos.arquiteto_id NÃO PODE ser anulado por salvamento parcial (esperado: ${novoArquitetoId}, obtido: ${projCheck2.rows[0].arquiteto_id})`
    )
    assert.strictEqual(
      projCheck2.rows[0].arquiteto_nome,
      arqPayload.nome,
      'projetos.arquiteto_nome deve permanecer preservado'
    )
    pass('R1: Defensividade comprovada — vínculo com projetos.arquiteto_id foi preservado intacto sem exclusão silenciosa')

    // 2.4 Testar desvinculação intencional (arquitetoId explicitamente null)
    console.log('2.4 Testando desvinculação intencional (arquitetoId: null)...')
    const updateBriefing3 = await apiRequest(`${baseUrl}/briefings/${testBriefingId}`, 'PUT', {
      arquitetoId: null,
      arquitetoNome: null,
      ambientes: ['cozinha'],
      observacoes: 'Desvinculação explícita de parceiro',
    })
    assert.ok([200, 302].includes(updateBriefing3.status))

    const projCheck3 = await client.query('SELECT arquiteto_id, arquiteto_nome FROM projetos WHERE id = $1', [testProjectId])
    assert.strictEqual(projCheck3.rows[0].arquiteto_id, null, 'projetos.arquiteto_id deve ser null após desvinculação voluntária')
    pass('R1: Desvinculação explícita (arquitetoId = null) tratada corretamente')

    // -------------------------------------------------------------------------
    // TESTE 3: R4 — CONCORRÊNCIA E ESTRESSE MASSIVO EM submeterVersao3D
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: R4 — Teste de Estresse de Concorrência Simultânea em submeterVersao3D ---')

    // Criar um projeto dedicado em status "em_projeto"
    const projStressCode = `PRJ-3D-STRESS-${timestamp}`
    const insertProjStress = await client.query(
      `INSERT INTO projetos (codigo, cliente_nome, status, vendedor_id, arquivado, alerta_parado, status_alterado_em, created_at, updated_at)
       VALUES ($1, $2, 'em_projeto', $3, false, false, NOW(), NOW(), NOW())
       RETURNING id`,
      [projStressCode, `Cliente Concorrência 3D ${timestamp}`, adminUserId]
    )
    const stressProjectId = insertProjStress.rows[0].id
    pass(`Projeto para estresse de concorrência criado (ID: ${stressProjectId}, Código: ${projStressCode})`)

    // Verificar que não há versões 3D preliminares
    const versoesAntesRes = await client.query(
      'SELECT COUNT(*) FROM projetos_comerciais WHERE projeto_id = $1',
      [stressProjectId]
    )
    assert.strictEqual(Number(versoesAntesRes.rows[0].count), 0, 'Projeto deve iniciar sem versões comerciais')

    // Disparar 10 requisições simultâneas em paralelo estrito via Promise.all
    const CONCURRENT_REQUESTS = 10
    console.log(`Disparando ${CONCURRENT_REQUESTS} requisições simultâneas via Promise.all para POST /projetos/${stressProjectId}/versoes-3d...`)

    const startTime = Date.now()
    const concurrentPromises = []

    for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
      const p = apiRequest(`${baseUrl}/projetos/${stressProjectId}/versoes-3d`, 'POST', {
        arquivoUrl: `https://storage.lidermoveis.com.br/projetos/stress_${i}_${timestamp}.skp`,
        descricaoAlteracao: `Carga concorrente de estresse #${i} [Worker thread ${i}]`,
      }).then((res) => ({
        index: i,
        status: res.status,
        data: res.data,
      }))
      concurrentPromises.push(p)
    }

    const concurrentResults = await Promise.all(concurrentPromises)
    const durationMs = Date.now() - startTime
    console.log(`⏱ ${CONCURRENT_REQUESTS} requisições concluídas em ${durationMs}ms (média: ${(durationMs / CONCURRENT_REQUESTS).toFixed(1)}ms/req)`)

    // Validar status HTTP de todas as requisições
    let okCount = 0
    const returnedVersions = []

    for (const res of concurrentResults) {
      if (res.status === 201) {
        okCount++
        const v = res.data?.versao?.versao
        if (v !== undefined) {
          returnedVersions.push(v)
        }
      } else {
        console.error(`  Requisição #${res.index} falhou com status ${res.status}:`, res.data)
      }
    }

    assert.strictEqual(
      okCount,
      CONCURRENT_REQUESTS,
      `Todas as ${CONCURRENT_REQUESTS} requisições paralelas devem responder HTTP 201 Created (aprovadas: ${okCount})`
    )
    pass(`Todas as ${CONCURRENT_REQUESTS} requisições paralelas foram aceitas com HTTP 201 Created`)

    // Inspecionar o banco de dados PostgreSQL
    const dbVersoesRes = await client.query(
      `SELECT id, versao, arquivo_url, descricao_alteracao, status, created_at
       FROM projetos_comerciais
       WHERE projeto_id = $1
       ORDER BY versao ASC`,
      [stressProjectId]
    )

    const rows = dbVersoesRes.rows
    assert.strictEqual(
      rows.length,
      CONCURRENT_REQUESTS,
      `O banco deve conter exatamente ${CONCURRENT_REQUESTS} versões registradas (encontradas: ${rows.length})`
    )
    pass(`Exatamente ${CONCURRENT_REQUESTS} tuplas gravadas em projetos_comerciais`)

    // Verificar unicidade e sequência estrita: 1, 2, 3, ..., 10
    const versoesGravadas = rows.map((r) => Number(r.versao))
    const versoesUnicas = new Set(versoesGravadas)

    console.log('Versões gravadas no banco em ordem crescente:', versoesGravadas.join(', '))

    assert.strictEqual(
      versoesUnicas.size,
      CONCURRENT_REQUESTS,
      `Não deve haver colisões ou versões duplicadas! (únicas: ${versoesUnicas.size}/${CONCURRENT_REQUESTS})`
    )
    pass(`Zero duplicidades de versão detectadas (unicidade de 100% sob concorrência)`)

    for (let expected = 1; expected <= CONCURRENT_REQUESTS; expected++) {
      assert.strictEqual(
        versoesGravadas[expected - 1],
        expected,
        `Versão na posição ${expected} deve ser estritamente ${expected} (obtido: ${versoesGravadas[expected - 1]})`
      )
    }
    pass(`Sequência perfeitamente estrita e sem gaps comprovada: [${versoesGravadas.join(', ')}]`)

    // Teste de duplicidade via SQL agregador
    const dupCheck = await client.query(
      `SELECT versao, COUNT(*) as qtd
       FROM projetos_comerciais
       WHERE projeto_id = $1
       GROUP BY versao
       HAVING COUNT(*) > 1`,
      [stressProjectId]
    )
    assert.strictEqual(dupCheck.rows.length, 0, 'Consulta SQL de duplicidade deve retornar zero registros')
    pass('SQL GROUP BY versao HAVING count(*) > 1 retornou 0 tuplas')

    // Verificar transição de status do projeto no banco
    const projFinalRes = await client.query(
      'SELECT status, status_alterado_em, alerta_parado FROM projetos WHERE id = $1',
      [stressProjectId]
    )
    assert.strictEqual(
      projFinalRes.rows[0].status,
      'aguard_validacao',
      'Status do projeto deve ter transicionado para aguard_validacao'
    )
    pass('Status do projeto transicionou corretamente para "aguard_validacao"')

    // Verificar registros de auditoria em historico_status_projeto
    const histRes = await client.query(
      `SELECT * FROM historico_status_projeto
       WHERE projeto_id = $1
       ORDER BY created_at ASC`,
      [stressProjectId]
    )
    assert.ok(
      histRes.rows.length >= 1,
      'Deve haver ao menos um registro imutável em historico_status_projeto'
    )
    pass(`Auditoria RN017: ${histRes.rows.length} transição(ões) registrada(s) em historico_status_projeto`)

    // -------------------------------------------------------------------------
    // TESTE 4: R4 — Segunda rodada de concorrência incremental (11 a 15)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: R4 — Bateria Incremental Subsequente (5 novas requisições concorrentes) ---')
    const INCREMENTAL_REQUESTS = 5
    const secondWavePromises = []

    for (let i = 1; i <= INCREMENTAL_REQUESTS; i++) {
      const p = apiRequest(`${baseUrl}/projetos/${stressProjectId}/versoes-3d`, 'POST', {
        arquivoUrl: `https://storage.lidermoveis.com.br/projetos/wave2_${i}_${timestamp}.skp`,
        descricaoAlteracao: `Segunda onda concorrente #${i}`,
      }).then((res) => ({ index: i, status: res.status, data: res.data }))
      secondWavePromises.push(p)
    }

    const secondWaveResults = await Promise.all(secondWavePromises)
    for (const res of secondWaveResults) {
      assert.strictEqual(res.status, 201, `Segunda onda: requisição #${res.index} deve responder 201`)
    }
    pass(`Segunda onda de ${INCREMENTAL_REQUESTS} requisições concluída com HTTP 201 em todas`)

    const dbTotalVersoesRes = await client.query(
      `SELECT versao FROM projetos_comerciais WHERE projeto_id = $1 ORDER BY versao ASC`,
      [stressProjectId]
    )
    const todasVersoes = dbTotalVersoesRes.rows.map((r) => Number(r.versao))
    const totalEsperado = CONCURRENT_REQUESTS + INCREMENTAL_REQUESTS // 15
    assert.strictEqual(todasVersoes.length, totalEsperado, `Total de versões deve ser ${totalEsperado}`)

    for (let expected = 1; expected <= totalEsperado; expected++) {
      assert.strictEqual(
        todasVersoes[expected - 1],
        expected,
        `Versão sequencial incremental ${expected} inválida (obtido: ${todasVersoes[expected - 1]})`
      )
    }
    pass(`Sequência pós-onda incremental comprovada de 1 até ${totalEsperado}: [${todasVersoes.join(', ')}]`)

    // -------------------------------------------------------------------------
    // TESTE 5: R4 — Casos de Borda Adversariais em submeterVersao3D
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: R4 — Casos de Borda Adversariais (Arquivamento, IDs Inválidos) ---')

    // 5.1 Projeto Inexistente (ID 999999)
    const nonExistentRes = await apiRequest(`${baseUrl}/projetos/999999/versoes-3d`, 'POST', {
      descricaoAlteracao: 'Tentativa em projeto inexistente',
    })
    assert.strictEqual(nonExistentRes.status, 404, 'Deve retornar HTTP 404 para projeto inexistente')
    pass('Projeto inexistente rejeitado com HTTP 404 Not Found')

    // 5.2 Projeto Arquivado
    await client.query('UPDATE projetos SET arquivado = true WHERE id = $1', [stressProjectId])
    const archivedRes = await apiRequest(`${baseUrl}/projetos/${stressProjectId}/versoes-3d`, 'POST', {
      descricaoAlteracao: 'Tentativa em projeto arquivado',
    })
    assert.strictEqual(archivedRes.status, 400, 'Deve retornar HTTP 400 para projeto arquivado')
    assert.ok(
      archivedRes.data?.message?.includes('arquivado'),
      'Mensagem deve indicar que projeto arquivado não aceita novas versões'
    )
    pass('Projeto arquivado rejeitado com HTTP 400 Bad Request')

    // -------------------------------------------------------------------------
    // TESTE 6: R4 — Mega Estresse com 20 Requisições Simultâneas
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 6: R4 — Mega Estresse Concorrente (20 requisições simultâneas) ---')
    const megaStressCode = `PRJ-3D-MEGA-${timestamp}`
    const insertMegaRes = await client.query(
      `INSERT INTO projetos (codigo, cliente_nome, status, vendedor_id, arquivado, alerta_parado, status_alterado_em, created_at, updated_at)
       VALUES ($1, $2, 'em_projeto', $3, false, false, NOW(), NOW(), NOW())
       RETURNING id`,
      [megaStressCode, `Cliente Mega Estresse ${timestamp}`, adminUserId]
    )
    const megaProjectId = insertMegaRes.rows[0].id

    const MEGA_CONCURRENT = 20
    const megaPromises = []
    const megaStart = Date.now()
    for (let i = 1; i <= MEGA_CONCURRENT; i++) {
      const p = apiRequest(`${baseUrl}/projetos/${megaProjectId}/versoes-3d`, 'POST', {
        arquivoUrl: `https://storage.lidermoveis.com.br/projetos/mega_${i}.skp`,
        descricaoAlteracao: `Mega estresse paralelo #${i}`,
      }).then((res) => ({ index: i, status: res.status, data: res.data }))
      megaPromises.push(p)
    }

    const megaResults = await Promise.all(megaPromises)
    const megaDuration = Date.now() - megaStart
    console.log(`⏱ ${MEGA_CONCURRENT} requisições simultâneas concluídas em ${megaDuration}ms (média: ${(megaDuration / MEGA_CONCURRENT).toFixed(1)}ms/req)`)

    const megaOkCount = megaResults.filter((r) => r.status === 201).length
    assert.strictEqual(megaOkCount, MEGA_CONCURRENT, `Todas as ${MEGA_CONCURRENT} requisições devem retornar 201`)
    pass(`Mega estresse: 100% de sucesso (${MEGA_CONCURRENT}/${MEGA_CONCURRENT} HTTP 201)`)

    const megaDbRes = await client.query(
      'SELECT versao FROM projetos_comerciais WHERE projeto_id = $1 ORDER BY versao ASC',
      [megaProjectId]
    )
    const megaVersoes = megaDbRes.rows.map((r) => Number(r.versao))
    assert.strictEqual(megaVersoes.length, MEGA_CONCURRENT)
    const megaSet = new Set(megaVersoes)
    assert.strictEqual(megaSet.size, MEGA_CONCURRENT, 'Zero colisões em 20 requisições simultâneas')

    for (let exp = 1; exp <= MEGA_CONCURRENT; exp++) {
      assert.strictEqual(megaVersoes[exp - 1], exp, `Versão mega ${exp} esperada`)
    }
    pass(`Sequência mega estresse comprovada perfeitamente de 1 até 20: [${megaVersoes.join(', ')}]`)

    // -------------------------------------------------------------------------
    // SUCESSO TOTAL
    // -------------------------------------------------------------------------
    console.log('\n================================================================================')
    console.log(` RESULTADO FINAL: ${testsPassed} ASSERTIONS PASSARAM COM SUCESSO (0 FALHAS)`)
    console.log(' R1 e R4 APROVADOS COM BLINDAGEM COMPROVADA CONTRA CONCORRÊNCIA E DATA LOSS!    ')
    console.log('================================================================================\n')
  } catch (err) {
    fail('Exceção capturada durante execução da suíte adversarial', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

runEmpiricalStressTests()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error('Falha nos testes:', e)
    process.exit(1)
  })
