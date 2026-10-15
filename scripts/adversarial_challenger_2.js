import { spawn } from 'node:child_process'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

const baseUrl = process.env.APP_URL || 'http://localhost:3333'
let serverProcess = null

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

function cleanup() {
  if (serverProcess) {
    console.log('[Cleanup] Encerrando servidor Adonis...')
    serverProcess.kill('SIGTERM')
    serverProcess = null
  }
}

process.on('exit', cleanup)
process.on('SIGINT', () => { cleanup(); process.exit(1); })
process.on('SIGTERM', () => { cleanup(); process.exit(1); })

async function ensureServerRunning() {
  try {
    const res = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(1500) })
    if (res.status) {
      console.log(`✔ Servidor Adonis já em execução na URL: ${baseUrl}`)
      return
    }
  } catch (_) {
    console.log(`[Info] Servidor não detectado em ${baseUrl}. Iniciando ace serve...`)
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
    throw new Error('Timeout aguardando inicialização do servidor Adonis')
  }
}

async function runAdversarialTests() {
  console.log('==============================================================================')
  console.log(' TESTE ADVERSARIAL EMPÍRICO: CHALLENGER 2 (API, RBAC & RN017)')
  console.log('==============================================================================')

  await ensureServerRunning()

  let totalAssertions = 0
  function assert(condition, message) {
    totalAssertions++
    if (!condition) {
      throw new Error(`[FALHA ADVERSARIAL] Asserção #${totalAssertions} falhou: ${message}`)
    }
    console.log(`  ✔ [${totalAssertions}] ${message}`)
  }

  // Obter usuários para testes
  const { rows: users } = await pool.query(
    `SELECT id, nome, email, perfil FROM users WHERE is_active = true ORDER BY id ASC`
  )
  assert(users.length >= 2, 'Pelo menos 2 usuários ativos no banco para testes de transferência')

  const vendedor = users.find((u) => u.email === 'vendedor@lidermoveis.com.br') || users[0]
  const gerente = users.find((u) => u.email === 'gerente@lidermoveis.com.br') || users[1]
  const terceiro = users.find((u) => u.id !== vendedor.id && u.id !== gerente.id) || users[0]

  console.log(`\nConsultores selecionados: Vendedor=${vendedor.id} (${vendedor.nome}), Gerente=${gerente.id} (${gerente.nome}), Terceiro=${terceiro.id}`)

  // ---------------------------------------------------------------------------
  // TESTE 0: RBAC & Proteção de Rotas Não Autenticadas
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 0: Tentativa de Acesso Não Autenticado (RBAC) ---')

  const unauthGet = await fetch(`${baseUrl}/especificadores?format=json`, {
    headers: { 'Accept': 'application/json' },
    redirect: 'manual',
  })
  // Adonis auth middleware redirects unauthenticated requests to login (302) or returns 401
  assert([302, 401].includes(unauthGet.status), `GET /especificadores sem autenticação rejeitado (status ${unauthGet.status})`)

  const unauthPost = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ nome: 'Hacker Invasor' }),
    redirect: 'manual',
  })
  assert([302, 401].includes(unauthPost.status), `POST /especificadores sem autenticação rejeitado (status ${unauthPost.status})`)

  // Autenticação oficial
  const loginPageRes = await fetch(`${baseUrl}/login`)
  updateCookies(loginPageRes)

  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      email: vendedor.email,
      password: 'Teste@123',
    }),
    redirect: 'manual',
  })
  updateCookies(loginRes)
  assert([302, 303, 200].includes(loginRes.status), `Login com ${vendedor.email} autenticado com sucesso`)

  // ---------------------------------------------------------------------------
  // TESTE 1: Tentativa de Exclusão Física vs Soft Delete (RN017)
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 1: Verificação Empírica de Soft Delete Estrito (RN017) ---')

  // Criar arquiteto para o teste 1
  const emailT1 = `adv.softdelete.${Date.now()}@teste-challenger.com.br`
  const arq1Res = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Arquiteto Teste RN017 SoftDelete',
      escritorio: 'Escritório RN017',
      email: emailT1,
      tipo: 'arquiteto',
      statusCarteira: 'ativo',
    }),
  })
  updateCookies(arq1Res)
  assert(arq1Res.status === 201, 'Arquiteto para teste RN017 criado')
  const arq1 = await arq1Res.json()
  const arq1Id = arq1.id

  // Checa no PostgreSQL que foi criado com is_active = true
  const { rows: checkBeforeDel } = await pool.query(
    `SELECT id, nome, is_active FROM arquitetos WHERE id = $1`,
    [arq1Id]
  )
  assert(checkBeforeDel.length === 1, 'Registro inserido no PostgreSQL')
  assert(checkBeforeDel[0].is_active === true, 'Registro inicial com is_active = true')

  // Executa DELETE /especificadores/:id
  const delRes = await fetch(`${baseUrl}/especificadores/${arq1Id}?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  updateCookies(delRes)
  assert(delRes.status === 200, 'DELETE /especificadores/:id responde com HTTP 200')

  // VERIFICAÇÃO EMPÍRICA FORENSE NO BANCO:
  // A linha DEVE EXISTIR na tabela arquitetos! NUNCA PODE TER SIDO DELETADA FISICAMENTE!
  const { rows: checkAfterDel } = await pool.query(
    `SELECT id, nome, is_active FROM arquitetos WHERE id = $1`,
    [arq1Id]
  )
  assert(checkAfterDel.length === 1, 'FALHA EVITADA: Registro NÃO foi removido fisicamente da tabela arquitetos!')
  assert(checkAfterDel[0].is_active === false, 'RN017 CONFIRMADA: Campo is_active está estritamente false')

  // Tentar DELETE repetido em registro já inativo (idempotência)
  const delRepeatRes = await fetch(`${baseUrl}/especificadores/${arq1Id}?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  assert(delRepeatRes.status === 200, 'DELETE repetido responde com HTTP 200 sem corromper banco')

  // Garantir que não aparece na listagem ativa padrão
  const listPadrao = await fetch(`${baseUrl}/especificadores?busca=RN017+SoftDelete`, {
    headers: {
      'Cookie': getCookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
    },
  })
  const listPadraoData = await listPadrao.json()
  const achouInativo = listPadraoData.props.especificadores.some((e) => e.id === arq1Id)
  assert(achouInativo === false, 'Especificador soft-deleted NÃO aparece na listagem ativa padrão')

  // Tentar DELETE em ID inexistente (deve responder 404)
  const del404 = await fetch(`${baseUrl}/especificadores/99999999?format=json`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
  })
  assert(del404.status === 404, `DELETE em ID inexistente retorna 404 (status ${del404.status})`)

  // ---------------------------------------------------------------------------
  // TESTE 2: Tentativa de Quebra de Unicidade de Decisor Principal
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 2: Unicidade de Decisor Principal (is_principal = true) ---')

  const emailT2 = `adv.decisor.${Date.now()}@teste-challenger.com.br`
  const arq2Res = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Escritório Multi Decisores Ltda',
      email: emailT2,
      tipo: 'arquiteto',
    }),
  })
  updateCookies(arq2Res)
  const arq2 = await arq2Res.json()
  const arq2Id = arq2.id

  // 1. Cadastra Decisor A com isPrincipal = true
  const decARes = await fetch(`${baseUrl}/especificadores/${arq2Id}/decisores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Decisor A',
      cargo: 'Sócio Fundador',
      isPrincipal: true,
    }),
  })
  assert(decARes.status === 201, 'Decisor A criado com isPrincipal = true')
  const decA = await decARes.json()

  // 2. Cadastra Decisor B TAMBÉM com isPrincipal = true (tentativa de violar unicidade)
  const decBRes = await fetch(`${baseUrl}/especificadores/${arq2Id}/decisores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Decisor B',
      cargo: 'Diretor de Projetos',
      isPrincipal: true,
    }),
  })
  assert(decBRes.status === 201, 'Decisor B criado com isPrincipal = true')
  const decB = await decBRes.json()

  // Verificação empírica via SQL direto no PostgreSQL:
  const { rows: decisoresDb1 } = await pool.query(
    `SELECT id, nome, is_principal FROM decisores_arquitetos WHERE arquiteto_id = $1 ORDER BY id ASC`,
    [arq2Id]
  )
  const principais1 = decisoresDb1.filter((d) => d.is_principal === true)
  assert(principais1.length === 1, `EXATAMENTE 1 decisor principal no banco (encontrados: ${principais1.length})`)
  assert(principais1[0].id === decB.id, 'Decisor B é o único principal ativo')
  const decADb = decisoresDb1.find((d) => d.id === decA.id)
  assert(decADb.is_principal === false, 'Decisor A foi automaticamente desmarcado para is_principal = false')

  // 3. Cadastra Decisor C com isPrincipal = false
  const decCRes = await fetch(`${baseUrl}/especificadores/${arq2Id}/decisores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Decisor C',
      cargo: 'Coordenador',
      isPrincipal: false,
    }),
  })
  assert(decCRes.status === 201, 'Decisor C criado com isPrincipal = false')
  const decC = await decCRes.json()

  // 4. Promove Decisor C para isPrincipal = true via PATCH
  const patchCRes = await fetch(`${baseUrl}/especificadores/${arq2Id}/decisores/${decC.id}?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({ isPrincipal: true }),
  })
  assert(patchCRes.status === 200, 'Decisor C promovido via PATCH')

  // Verificação empírica no PostgreSQL:
  const { rows: decisoresDb2 } = await pool.query(
    `SELECT id, nome, is_principal FROM decisores_arquitetos WHERE arquiteto_id = $1 ORDER BY id ASC`,
    [arq2Id]
  )
  const principais2 = decisoresDb2.filter((d) => d.is_principal === true)
  assert(principais2.length === 1, `EXATAMENTE 1 decisor principal no banco pós-PATCH (encontrados: ${principais2.length})`)
  assert(principais2[0].id === decC.id, 'Decisor C é o único principal agora')
  assert(decisoresDb2.find((d) => d.id === decB.id).is_principal === false, 'Decisor B foi desmarcado')

  // ---------------------------------------------------------------------------
  // TESTE 3: Transferência de Dono e Auditoria Imutável (RN017)
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 3: Transferência de Dono e Histórico Imutável (RN017) ---')

  const emailT3 = `adv.dono.${Date.now()}@teste-challenger.com.br`
  const arq3Res = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Studio Transferência Imutável',
      email: emailT3,
      tipo: 'decorador',
      consultorId: vendedor.id,
    }),
  })
  updateCookies(arq3Res)
  const arq3 = await arq3Res.json()
  const arq3Id = arq3.id

  // 1. Verifica auditoria inicial criada no cadastro
  const { rows: hist0 } = await pool.query(
    `SELECT * FROM historico_dono_arquitetos WHERE arquiteto_id = $1 ORDER BY id ASC`,
    [arq3Id]
  )
  assert(hist0.length === 1, 'Registro inicial de histórico criado na inserção')
  assert(hist0[0].consultor_anterior_id === null, 'consultor_anterior_id é NULL na atribuição inicial')
  assert(hist0[0].consultor_novo_id === vendedor.id, `consultor_novo_id gravado como ${vendedor.id}`)
  assert(hist0[0].alterado_por_id === vendedor.id, `alterado_por_id gravado como ${vendedor.id}`)

  // 2. Transferência 1: Vendedor -> Gerente
  const t1Res = await fetch(`${baseUrl}/especificadores/${arq3Id}/dono?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorNovoId: gerente.id,
      motivo: 'Motivo Transferência 1 para Gerente',
    }),
  })
  assert(t1Res.status === 200, 'Transferência 1 executada com sucesso')

  // 3. Transferência 2: Gerente -> Terceiro
  const t2Res = await fetch(`${baseUrl}/especificadores/${arq3Id}/dono?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorNovoId: terceiro.id,
      motivo: 'Motivo Transferência 2 para Terceiro',
    }),
  })
  assert(t2Res.status === 200, 'Transferência 2 executada com sucesso')

  // 4. Verificação empírica forense no PostgreSQL:
  const { rows: histAll } = await pool.query(
    `SELECT id, arquiteto_id, consultor_anterior_id, consultor_novo_id, alterado_por_id, motivo, created_at 
     FROM historico_dono_arquitetos 
     WHERE arquiteto_id = $1 
     ORDER BY id ASC`,
    [arq3Id]
  )
  assert(histAll.length === 3, `Rigorosamente 3 registros imutáveis no histórico (encontrados: ${histAll.length})`)

  // Registro 1 (Transf 1): anterior = vendedor, novo = gerente
  assert(histAll[1].consultor_anterior_id === vendedor.id, `Transf 1: consultor_anterior_id = ${vendedor.id}`)
  assert(histAll[1].consultor_novo_id === gerente.id, `Transf 1: consultor_novo_id = ${gerente.id}`)
  assert(histAll[1].motivo === 'Motivo Transferência 1 para Gerente', 'Transf 1: motivo preservado exatamente')

  // Registro 2 (Transf 2): anterior = gerente, novo = terceiro
  assert(histAll[2].consultor_anterior_id === gerente.id, `Transf 2: consultor_anterior_id = ${gerente.id}`)
  assert(histAll[2].consultor_novo_id === terceiro.id, `Transf 2: consultor_novo_id = ${terceiro.id}`)
  assert(histAll[2].motivo === 'Motivo Transferência 2 para Terceiro', 'Transf 2: motivo preservado exatamente')

  // Verifica que o registro inicial NÃO sofreu nenhuma modificação (imutabilidade estrita)
  assert(histAll[0].consultor_anterior_id === null, 'Registro 0 permaneceu inalterado (imutabilidade)')

  // 5. Teste de tentativa de transferência para consultor inexistente (deve falhar e fazer rollback)
  const tFailRes = await fetch(`${baseUrl}/especificadores/${arq3Id}/dono?format=json`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorNovoId: 999999, // usuário inexistente
      motivo: 'Tentativa inválida',
    }),
  })
  // Deve retornar erro (500 ou 422 devido à foreign key)
  assert(tFailRes.status >= 400, `Transferência com consultor inexistente rejeitada (status ${tFailRes.status})`)

  // Garantir que nenhum registro fantasma foi gravado
  const { rows: histAfterFail } = await pool.query(
    `SELECT COUNT(*) as total FROM historico_dono_arquitetos WHERE arquiteto_id = $1`,
    [arq3Id]
  )
  assert(Number(histAfterFail[0].total) === 3, 'Rollback transacional verificado: nenhum registro fantasma adicionado')

  // ---------------------------------------------------------------------------
  // TESTE 4: Concorrência e Metas de Visitas
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 4: Concorrência em Metas de Visitas e Interações ---')

  // Dispara 6 requisições CONCORRENTES de definição de metas de visitas
  const metasValores = [12, 15, 18, 20, 22, 25]
  console.log('  Disparando 6 atualizações de meta simultâneas para o mesmo consultor...')
  const concurrentMetaPromises = metasValores.map((val) =>
    fetch(`${baseUrl}/especificadores/metas-visitas?format=json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({
        consultorId: vendedor.id,
        metaVisitasMes: val,
      }),
    })
  )

  const metaResponses = await Promise.all(concurrentMetaPromises)
  for (const r of metaResponses) {
    assert(r.status === 200, `Atualização concorrente respondeu com 200 (status ${r.status})`)
  }

  // Verificar consistência no banco: NÃO pode haver linhas duplicadas para o mesmo consultor!
  const { rows: metasDb } = await pool.query(
    `SELECT id, consultor_id, meta_visitas_mes FROM metas_visitas_consultor WHERE consultor_id = $1`,
    [vendedor.id]
  )
  assert(metasDb.length === 1, `Consistência de unicidade garantida: exatamente 1 registro de meta para o consultor (encontrados: ${metasDb.length})`)
  assert(metasValores.includes(metasDb[0].meta_visitas_mes), `Valor final de meta (${metasDb[0].meta_visitas_mes}) é válido`)

  // Restaura meta original do vendedor (15)
  await pool.query(
    `UPDATE metas_visitas_consultor SET meta_visitas_mes = 15 WHERE consultor_id = $1`,
    [vendedor.id]
  )

  // Teste de concorrência em interações comerciais:
  // Dispara 5 interações SIMULTÂNEAS no arquiteto 3
  console.log('  Disparando 5 criações de interações comerciais concorrentes...')
  const tiposInteracao = ['visita_escritorio', 'visita_loja', 'reuniao', 'ligacao', 'whatsapp']
  const interactionPromises = tiposInteracao.map((tipo, idx) =>
    fetch(`${baseUrl}/especificadores/${arq3Id}/interacoes?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': getCookieHeader(),
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({
        tipo,
        resumo: `Interação concorrente #${idx + 1} - ${tipo}`,
        data: new Date().toISOString(),
      }),
    })
  )

  const interRes = await Promise.all(interactionPromises)
  for (const r of interRes) {
    assert(r.status === 201, `Criação concorrente de interação respondeu 201 (status: ${r.status})`)
  }

  // Verifica no banco se as 5 interações foram criadas sem corrupção
  const { rows: interacoesDb } = await pool.query(
    `SELECT id, tipo, resumo FROM interacoes_arquitetos WHERE arquiteto_id = $1 ORDER BY id ASC`,
    [arq3Id]
  )
  assert(interacoesDb.length === 5, `Exatamente 5 interações gravadas com sucesso no banco (encontradas: ${interacoesDb.length})`)

  // ---------------------------------------------------------------------------
  // TESTE 5: Validação Adversarial de Entradas e Casos de Borda (VineJS)
  // ---------------------------------------------------------------------------
  console.log('\n--- TESTE 5: Validação de Casos de Borda e Entradas Adversariais ---')

  // Concorrente com percentual de fechamento negativo (< 0) -> deve rejeitar 422
  const concNegRes = await fetch(`${baseUrl}/especificadores/${arq3Id}/concorrentes?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nomeConcorrente: 'Concorrente Negativo',
      percentualFechamentoEstimado: -15.0,
    }),
  })
  assert(concNegRes.status === 422, `Percentual negativo rejeitado com HTTP 422 (status ${concNegRes.status})`)

  // Concorrente com percentual de fechamento superior a 100 (> 100) -> deve rejeitar 422
  const concOverRes = await fetch(`${baseUrl}/especificadores/${arq3Id}/concorrentes?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nomeConcorrente: 'Concorrente Hiperbólico',
      percentualFechamentoEstimado: 150.0,
    }),
  })
  assert(concOverRes.status === 422, `Percentual > 100 rejeitado com HTTP 422 (status ${concOverRes.status})`)

  // Meta de visitas negativa (< 0) -> deve rejeitar 422
  const metaNegRes = await fetch(`${baseUrl}/especificadores/metas-visitas?format=json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      consultorId: vendedor.id,
      metaVisitasMes: -5,
    }),
  })
  assert(metaNegRes.status === 422, `Meta de visitas negativa rejeitada com HTTP 422 (status ${metaNegRes.status})`)

  // Tipo de especificador inválido -> deve rejeitar 422
  const tipoInvRes = await fetch(`${baseUrl}/especificadores?format=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': xsrfToken,
    },
    body: JSON.stringify({
      nome: 'Teste Tipo Inválido',
      tipo: 'tipo_inexistente_hacker',
    }),
  })
  assert(tipoInvRes.status === 422, `Tipo de especificador inválido rejeitado com HTTP 422 (status ${tipoInvRes.status})`)

  console.log('\n==============================================================================')
  console.log(` TODOS OS TESTES ADVERSARIAIS PASSARAM COM SUCESSO!`)
  console.log(` Total de asserções verificadas empíricamente: ${totalAssertions}`)
  console.log('==============================================================================')
}

runAdversarialTests()
  .then(() => {
    cleanup()
    pool.end()
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ ERRO NA SUITE ADVERSARIAL:', err)
    cleanup()
    pool.end()
    process.exit(1)
  })
