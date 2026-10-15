import assert from 'node:assert'
import { execSync } from 'node:child_process'

const baseUrl = 'http://localhost:3333'
let totalAssertions = 0

function pass(msg) {
  totalAssertions++
  console.log(`  ✓ [${totalAssertions}] ${msg}`)
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
  assert.ok(res.status === 302 || res.status === 200, `Login deveria retornar 302 ou 200 (retornou ${res.status})`)
}

async function apiRequest(url, method = 'GET', body = null) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cookie': getCookieHeader(),
    'X-XSRF-TOKEN': xsrfToken,
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  updateCookies(res)
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function runTests() {
  console.log('================================================================================')
  console.log('--- INICIANDO TESTES HTTP DA FASE 10: FECHAMENTO, PARCELAS & HANDOFF (RN006) ---')
  console.log('================================================================================\n')

  try {
    execSync('node ace db:seed --files database/seeders/fechamento_handoff_seeder.ts', {
      cwd: process.cwd().endsWith('plannit') ? '.' : './plannit',
      stdio: 'pipe',
    })
    console.log('Seeder de Fechamento e Handoff executado com sucesso.\n')
  } catch (e) {
    console.warn('Aviso ao executar seeder:', e.message)
  }

  // 1. Login como Vendedor Responsável
  console.log('1. Autenticação do Vendedor...')
  await loginUser('vendedor@lidermoveis.com.br', 'Teste@123')
  pass('Login do Vendedor efetuado com sucesso')

  // 2. Localizar projetos semeados na carteira
  console.log('\n2. Localizando Projetos de Teste...')
  const carteiraRes = await apiRequest(`${baseUrl}/projetos`)
  assert.strictEqual(carteiraRes.status, 200, 'Deveria listar projetos')
  const projetos = carteiraRes.data.projetos || []

  const projFechamento = projetos.find((p) => p.codigo === 'PROJ-2026-FECHAMENTO-PEND')
  const projLiberado = projetos.find((p) => p.codigo === 'PROJ-2026-HANDOFF-LIBERADO')

  assert.ok(projFechamento, 'Projeto PROJ-2026-FECHAMENTO-PEND deve existir')
  assert.ok(projLiberado, 'Projeto PROJ-2026-HANDOFF-LIBERADO deve existir')
  pass(`Projeto em fechamento localizado: ID ${projFechamento.id} (Status: ${projFechamento.status})`)
  pass(`Projeto com handoff liberado localizado: ID ${projLiberado.id} (Status: ${projLiberado.status})`)

  // 3. Consulta da Sala de Fechamento (GET /projetos/:id/fechamento)
  console.log('\n3. Consultando Sala de Fechamento & Handoff...')
  const fechamentoShowRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/fechamento`)
  assert.strictEqual(fechamentoShowRes.status, 200, 'Deveria retornar dados da sala de fechamento')
  assert.strictEqual(fechamentoShowRes.data.codigo, 'PROJ-2026-FECHAMENTO-PEND')
  assert.ok(fechamentoShowRes.data.fechamento, 'Deveria conter objeto fechamento')
  assert.strictEqual(fechamentoShowRes.data.handoff.itensObrigatorios.length, 8, 'Deveria listar os 8 itens obrigatórios da RN006')
  pass('Sala de Fechamento consultada com sucesso com os 8 itens obrigatórios parametrizados')

  // 4. Teste do Guardrail Inegociável RN006: Bloqueio estrito de avanço para etapa técnica com handoff incompleto
  console.log('\n4. Testando Guardrail Inegociável RN006 (Bloqueio Estrito de Handoff Incompleto)...')
  const avancoBloqueadoRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/status`, 'POST', {
    status: 'contato_conf',
    observacao: 'Tentativa indevida de avançar para conferência com handoff incompleto',
  })

  assert.strictEqual(avancoBloqueadoRes.status, 400, 'Deveria retornar HTTP 400 Bad Request por violação da RN006')
  assert.strictEqual(avancoBloqueadoRes.data.code, 'RN006_HANDOFF_INCOMPLETO')
  assert.ok(
    avancoBloqueadoRes.data.message.includes('RN006'),
    'Mensagem de erro deve citar explicitamente a Regra de Negócio RN006'
  )
  assert.ok(
    avancoBloqueadoRes.data.itensPendentes.length > 0,
    'Deve listar os itens obrigatórios pendentes'
  )
  pass(`RN006 validada: Tentativa de avanço para 'contato_conf' estritamente bloqueada com HTTP 400. Itens pendentes: ${avancoBloqueadoRes.data.itensPendentes.join(', ')}`)

  // 5. Teste de Fechamento Comercial & Plano de Pagamento (RF024–RF028)
  console.log('\n5. Atualizando Fechamento Comercial, Contrato & Gerando Parcelas (RF024-RF028)...')
  const salvarFechamentoRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/fechamento`, 'POST', {
    valorTotalFechamento: 105000.0,
    contratoUrl: 'https://docs.lidermoveis.com.br/contratos/ct-105000-assinado.pdf',
    cadernoComercialUrl: 'https://docs.lidermoveis.com.br/cadernos/cc-105000.pdf',
    dataLimiteAssinatura: '2026-10-30',
    contratoAssinado: true,
    parcelas: [
      { numero: 1, valor: 35000.0, vencimento: '2026-10-01', formaPagamento: 'pix' },
      { numero: 2, valor: 35000.0, vencimento: '2026-11-01', formaPagamento: 'boleto' },
      { numero: 3, valor: 35000.0, vencimento: '2026-12-01', formaPagamento: 'boleto' },
    ],
  })

  assert.strictEqual(salvarFechamentoRes.status, 200, 'Deveria salvar fechamento comercial')
  assert.strictEqual(salvarFechamentoRes.data.fechamento.onboardingDisparado, true, 'RF028: Onboarding deve ser disparado após assinatura')
  assert.ok(salvarFechamentoRes.data.fechamento.contratoAssinadoEm, 'Data de assinatura do contrato deve ser gravada')
  pass('Fechamento comercial atualizado com sucesso: Onboarding disparado (RF028) e 3 parcelas geradas')

  // 6. Teste de Liquidação Financeira de Parcela
  console.log('\n6. Liquidando Parcela Financeira Pendente...')
  const consultaAtualizada = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/fechamento`)
  const parcelas = consultaAtualizada.data.fechamento.parcelas
  assert.ok(parcelas.length >= 3, 'Deveriam existir pelo menos 3 parcelas')
  const pPendente = parcelas.find((p) => p.status === 'pendente')
  assert.ok(pPendente, 'Deveria encontrar parcela pendente para liquidar')

  const liquidarRes = await apiRequest(
    `${baseUrl}/projetos/${projFechamento.id}/fechamento/parcelas/${pPendente.id}/pagar`,
    'POST',
    {
      formaPagamento: 'pix',
      dataPagamento: '2026-10-01',
      comprovanteUrl: 'https://comprovantes.lidermoveis.com.br/comp_pix_35k.pdf',
      observacoes: 'Recebimento de entrada via PIX validado pelo financeiro.',
    }
  )

  assert.strictEqual(liquidarRes.status, 200, 'Deveria liquidar parcela com sucesso')
  assert.strictEqual(liquidarRes.data.parcela.status, 'pago', 'Status da parcela deve ser pago')
  assert.strictEqual(liquidarRes.data.parcela.formaPagamento, 'pix')
  pass(`Parcela #${pPendente.numero} de R$ ${pPendente.valor} quitada e baixada com sucesso`)

  // 7. Teste de Atualização Parcial do Handoff (Ainda Incompleto)
  console.log('\n7. Testando Salvamento Parcial do Checklist de Handoff (7/8 itens)...')
  const checklist7de8 = {
    contrato_assinado: true,
    caderno_comercial: true,
    plantas_arquitetonicas: true,
    fotos_ambiente: true,
    briefing_completo: true,
    aprovacao_financeira: true,
    pedido_gerado: true,
    dados_obra: false, // Faltando 1 item obrigatório
  }

  const handoffParcialRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/handoff`, 'POST', {
    checklist: checklist7de8,
    observacoes: 'Falta apenas a confirmação final dos dados de acesso à obra.',
  })

  assert.strictEqual(handoffParcialRes.status, 200, 'Deveria aceitar salvar checklist parcial')
  assert.strictEqual(handoffParcialRes.data.liberado, false, 'Handoff não pode ser liberado com item faltando')
  pass('Checklist parcial salvo (7/8 itens). Liberação formal permaneceu bloqueada como esperado')

  // Tentativa de avanço ainda deve falhar
  const reTentativaBloqueio = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/status`, 'POST', {
    status: 'contato_conf',
    observacao: 'Tentativa com 7 de 8 itens',
  })
  assert.strictEqual(reTentativaBloqueio.status, 400, 'Avanço ainda deve ser rejeitado por faltar dados_obra')
  assert.ok(reTentativaBloqueio.data.itensPendentes.includes('dados_obra'))
  pass('Bloqueio RN006 persistido: restando apenas dados_obra')

  // 8. Teste de Liberação Formal com 100% dos 8 Itens Obrigatórios (RN006 Cumprida)
  console.log('\n8. Cumprindo 100% dos 8 Itens Obrigatórios da RN006...')
  const checklistCompleto = {
    ...checklist7de8,
    dados_obra: true, // Agora todos os 8 itens estão conferidos!
  }

  const handoffTotalRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/handoff`, 'POST', {
    checklist: checklistCompleto,
    observacoes: 'Todos os 8 requisitos conferidos e aprovados. Projeto liberado para conferência de obra.',
  })

  assert.strictEqual(handoffTotalRes.status, 200, 'Deveria salvar handoff completo')
  assert.strictEqual(handoffTotalRes.data.liberado, true, 'Handoff deve ser liberado formalmente')
  assert.ok(handoffTotalRes.data.handoff.liberadoEm, 'Data de liberação deve estar preenchida')
  pass('RN006 Cumprida com sucesso: Handoff 100% aprovado e projeto transicionado para contato_conf')

  // 9. Validação de Transição de Status Desbloqueada para Etapas Técnicas
  console.log('\n9. Testando Transição Técnica Desbloqueada...')
  const avancoPermitidoRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}/status`, 'POST', {
    status: 'validando_obra',
    observacao: 'Conferente iniciou a validação física e técnica das condições da obra.',
  })

  assert.strictEqual(avancoPermitidoRes.status, 200, 'Deveria autorizar transição agora que a RN006 foi cumprida')
  assert.strictEqual(avancoPermitidoRes.data.status, 'validando_obra')
  pass('Transição para etapa técnica validando_obra autorizada com sucesso após cumprimento da RN006')

  // 10. Auditoria Imutável (RN017)
  console.log('\n10. Validando Registro Imutável de Histórico (RN017)...')
  const detalheFinalRes = await apiRequest(`${baseUrl}/projetos/${projFechamento.id}`)
  assert.strictEqual(detalheFinalRes.status, 200)
  const historicos = detalheFinalRes.data.projeto.historico || []

  const temHistFechamento = historicos.some((h) => h.observacao?.includes('[FECHAMENTO COMERCIAL]'))
  const temHistFinanceiro = historicos.some((h) => h.observacao?.includes('[FINANCEIRO]'))
  const temHistHandoffRN006 = historicos.some((h) => h.observacao?.includes('[RN006 - HANDOFF TÉCNICO COMPLETO]'))

  assert.ok(temHistFechamento, 'Histórico deve registrar eventos do fechamento comercial')
  assert.ok(temHistFinanceiro, 'Histórico deve registrar baixa financeira da parcela')
  assert.ok(temHistHandoffRN006, 'Histórico deve registrar passagem formal da RN006')
  pass('Auditoria imutável RN017 validada: eventos comerciais, financeiros e de handoff registrados')

  console.log('\n================================================================================')
  console.log(`✅ TODOS OS ${totalAssertions} TESTES DA FASE 10 FORAM CONCLUÍDOS COM SUCESSO!`)
  console.log('================================================================================')
}

runTests().catch((err) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES:', err)
  process.exit(1)
})
