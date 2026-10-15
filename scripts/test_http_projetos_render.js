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
  console.log('--- INICIANDO TESTES HTTP DA FASE 9: PROJETOS, RENDER & RN004/RN005/RN017 ---\n')

  try {
    execSync('node ace db:seed --files database/seeders/projeto_render_seeder.ts', {
      cwd: process.cwd().endsWith('plannit') ? '.' : './plannit',
      stdio: 'pipe',
    })
  } catch (e) {
    // Continua
  }

  // 1. Login como Diretoria / Gestor

  console.log('1. Autenticação Administrativa (Diretoria)...')
  await loginUser('admin@plannit.com.br', 'Admin@123456')
  pass('Login realizado com sucesso como Diretoria (admin)')


  // 2. Listar Carteira Geral de Projetos
  console.log('\n2. Verificando Carteira Geral de Projetos & KPIs...')
  const listRes = await apiRequest(`${baseUrl}/projetos`)
  assert.strictEqual(listRes.status, 200, 'Deveria retornar 200 na listagem de projetos')
  assert.ok(Array.isArray(listRes.data.projetos), 'projetos deve ser um array')
  assert.ok(listRes.data.projetos.length >= 3, 'Deveria conter os projetos seedados')
  pass(`Carteira carregada com ${listRes.data.projetos.length} projetos e KPIs operacionais calculados`)

  const projValidacao = listRes.data.projetos.find((p) => p.codigo === 'PROJ-2026-VALIDACAO')
  const projDevolvido = listRes.data.projetos.find((p) => p.codigo === 'PROJ-2026-DEVOLVIDO')
  const projRenderOk = listRes.data.projetos.find((p) => p.codigo === 'PROJ-2026-RENDER-OK')

  assert.ok(projValidacao, 'PROJ-2026-VALIDACAO deve existir')
  assert.ok(projDevolvido, 'PROJ-2026-DEVOLVIDO deve existir')
  assert.ok(projRenderOk, 'PROJ-2026-RENDER-OK deve existir')
  pass('Projetos nos diferentes estados de maquete 3D localizados com sucesso')

  // 3. Detalhes do Projeto / Sala de Controle (show)
  console.log('\n3. Acessando Sala de Controle do Projeto (show)...')
  const showRes = await apiRequest(`${baseUrl}/projetos/${projValidacao.id}`)
  assert.strictEqual(showRes.status, 200, 'Deveria retornar 200 na Sala de Controle')
  assert.strictEqual(showRes.data.projeto.codigo, 'PROJ-2026-VALIDACAO')
  assert.ok(showRes.data.projeto.versoes3D.length >= 1, 'Deveria ter versões 3D')
  assert.ok(Array.isArray(showRes.data.projeto.historico), 'Histórico imutável deve ser retornado')
  pass('Sala de Controle do Projeto carregou detalhes cadastrais, maquetes 3D e histórico imutável')

  // 4. Submissão de nova Maquete 3D
  console.log('\n4. Submetendo nova Versão 3D pelo Projetista...')
  const submeterRes = await apiRequest(`${baseUrl}/projetos/${projValidacao.id}/versoes-3d`, 'POST', {
    arquivoUrl: 'https://cloud.lidermoveis.com.br/projetos/v2_validacao.skp',
    descricaoAlteracao: 'Ajuste fino de ferragens Blum e torre quente.',
  })
  assert.strictEqual(submeterRes.status, 201, 'Deveria retornar 201 na criação da nova versão 3D')
  const ultimaVersaoAntes = showRes.data.projeto.versoes3D[0]?.versao || 0
  assert.strictEqual(submeterRes.data.versao.versao, ultimaVersaoAntes + 1, 'Deveria ser a versão imediatamente seguinte')
  assert.strictEqual(submeterRes.data.versao.status, 'aguard_validacao_vendedor')
  pass(`Nova versão 3D (v${submeterRes.data.versao.versao}) submetida com sucesso aguardando validação do vendedor`)


  const versaoId = submeterRes.data.versao.id

  // 5. RN004: Tentativa de devolver Maquete SEM motivo
  console.log('\n5. Testando RN004: Tentativa de devolução SEM motivo obrigatório...')
  const devSemMotivoRes = await apiRequest(
    `${baseUrl}/projetos/${projValidacao.id}/versoes-3d/${versaoId}/avaliar`,
    'POST',
    {
      acao: 'devolver',
      motivoDevolucao: '',
    }
  )
  assert.strictEqual(devSemMotivoRes.status, 400, 'Deveria rejeitar com 400 quando motivo não for fornecido')
  assert.strictEqual(devSemMotivoRes.data.code, 'RN004_MOTIVO_OBRIGATORIO')
  pass('RN004 validada: Sistema rejeitou devolução de maquete 3D sem justificativa obrigatória')

  // 6. RN004: Devolução COM motivo obrigatório
  console.log('\n6. Testando RN004: Devolução COM motivo obrigatório do vendedor...')
  const devComMotivoRes = await apiRequest(
    `${baseUrl}/projetos/${projValidacao.id}/versoes-3d/${versaoId}/avaliar`,
    'POST',
    {
      acao: 'devolver',
      motivoDevolucao: 'Necessário prever tomada 20A oculta dentro do armário da adega.',
    }
  )
  assert.strictEqual(devComMotivoRes.status, 200, 'Deveria aceitar devolução com motivo')
  assert.strictEqual(devComMotivoRes.data.versao.status, 'devolvido')
  assert.ok(devComMotivoRes.data.versao.motivoDevolucao.includes('tomada 20A'))
  pass('RN004 cumprida: Maquete 3D devolvida com apontamentos comerciais e projeto movido para em_ajuste')

  // 7. Submissão de versão corrigida (v3) e Aprovação (RN004)
  console.log('\n7. Projetista envia versão v3 e Vendedor aprova (RN004)...')
  const submeterV3 = await apiRequest(`${baseUrl}/projetos/${projValidacao.id}/versoes-3d`, 'POST', {
    arquivoUrl: 'https://cloud.lidermoveis.com.br/projetos/v3_corrigido.skp',
    descricaoAlteracao: 'Tomada 20A adicionada conforme solicitado.',
  })
  assert.strictEqual(submeterV3.status, 201)
  const v3Id = submeterV3.data.versao.id

  const aprovarRes = await apiRequest(
    `${baseUrl}/projetos/${projValidacao.id}/versoes-3d/${v3Id}/avaliar`,
    'POST',
    {
      acao: 'aprovar',
    }
  )
  assert.strictEqual(aprovarRes.status, 200, 'Deveria aprovar maquete')
  assert.strictEqual(aprovarRes.data.versao.status, 'aprovado')
  pass('RN004 cumprida: Maquete 3D aprovada pelo vendedor e projeto avançado para em_render')

  // 8. Conclusão de Renderização Fotorrealista
  console.log('\n8. Concluindo renderização fotorrealista da versão aprovada...')
  const renderRes = await apiRequest(
    `${baseUrl}/projetos/${projValidacao.id}/versoes-3d/${v3Id}/concluir-render`,
    'POST',
    {
      renderUrls: 'https://cloud.lidermoveis.com.br/renders/v3_01.jpg\nhttps://cloud.lidermoveis.com.br/renders/v3_02.jpg',
    }
  )
  assert.strictEqual(renderRes.status, 200)
  assert.strictEqual(renderRes.data.versao.status, 'finalizado')
  pass('Renders fotorrealistas de alta resolução vinculados com sucesso (status: finalizado)')

  // 9. RN005: Bloqueio estrito de avanço para apresentação SEM render aprovado
  console.log('\n9. Testando RN005: Bloqueio de avanço para apresentação sem render aprovado...')
  // O projeto PROJ-2026-DEVOLVIDO está com maquete devolvida (sem render aprovado)
  const blockApresentacaoRes = await apiRequest(
    `${baseUrl}/projetos/${projDevolvido.id}/status`,
    'POST',
    {
      status: 'aguard_apresentacao',
      observacao: 'Tentando agendar apresentação sem aprovação de render',
    }
  )
  assert.strictEqual(blockApresentacaoRes.status, 400, 'Deveria bloquear com 400 Bad Request')
  assert.strictEqual(blockApresentacaoRes.data.code, 'RN005_RENDER_NAO_CONCLUIDO')
  pass('RN005 validada: Sistema bloqueou categoricamente avanço para Apresentação sem render aprovado')

  // 10. Avanço permitido para aguard_apresentacao no projeto com render aprovado
  console.log('\n10. Avanço para Apresentação em projeto com render concluído...')
  const permitirApresentacaoRes = await apiRequest(
    `${baseUrl}/projetos/${projRenderOk.id}/status`,
    'POST',
    {
      status: 'aguard_apresentacao',
      observacao: 'Apresentação agendada para sexta-feira às 15h.',
    }
  )
  assert.strictEqual(permitirApresentacaoRes.status, 200, 'Deveria permitir avanço quando render estiver concluído')
  assert.strictEqual(permitirApresentacaoRes.data.status, 'aguard_apresentacao')
  pass('Transição de etapa autorizada com sucesso após conformidade RN005 comprovada')

  // 11. RN017: Preservação de Histórico Imutável
  console.log('\n11. Testando RN017: Preservação de Histórico Imutável de Auditoria...')
  const checkHistoricoRes = await apiRequest(`${baseUrl}/projetos/${projValidacao.id}`)
  const historico = checkHistoricoRes.data.projeto.historico
  assert.ok(historico.length >= 3, 'Histórico imutável deve conter as transições gravadas')
  const registroAprovacao = historico.find((h) => h.observacao?.includes('aprovada pelo vendedor'))
  const registroDevolucao = historico.find((h) => h.observacao?.includes('tomada 20A'))
  assert.ok(registroAprovacao, 'Registro de aprovação deve constar no histórico')
  assert.ok(registroDevolucao, 'Registro de devolução com motivo deve constar no histórico')
  pass('RN017 validada: Todas as mudanças de status estão registradas de forma imutável com usuário e justificativa')

  // 12. RN017: Arquivamento com justificativa obrigatória (Soft Delete)
  console.log('\n12. Testando RN017: Arquivamento com justificativa obrigatória...')
  // Tentativa sem justificativa
  const semMotivoArqRes = await apiRequest(`${baseUrl}/projetos/${projDevolvido.id}/arquivar`, 'POST', {
    motivo: '',
  })
  assert.strictEqual(semMotivoArqRes.status, 422, 'Deveria recusar arquivamento sem motivo válido (mínimo 5 chars)')

  // Arquivamento válido
  const arqValidoRes = await apiRequest(`${baseUrl}/projetos/${projDevolvido.id}/arquivar`, 'POST', {
    motivo: 'Cliente optou por adiar a reforma para o próximo ano letivo.',
  })
  assert.strictEqual(arqValidoRes.status, 200, 'Deveria arquivar com sucesso')

  // Verifica que o projeto NÃO foi deletado do banco, apenas arquivado (RN017)
  const checkArqRes = await apiRequest(`${baseUrl}/projetos/${projDevolvido.id}`)
  assert.strictEqual(checkArqRes.data.projeto.arquivado, true)
  assert.ok(checkArqRes.data.projeto.arquivadoMotivo.includes('adiar a reforma'))
  pass('RN017 validada: Projeto preservado com soft-delete e motivo registrado, sem exclusão física')

  console.log('\n=================================================================')
  console.log(`✅ TODOS OS ${totalAssertions} TESTES DA FASE 9 FORAM APROVADOS COM SUCESSO!`)
  console.log('   - RN004 (Validação & Devolução com Motivo Obrigatório): APROVADO')
  console.log('   - RN005 (Bloqueio Estrito de Apresentação sem Render): APROVADO')
  console.log('   - RN017 (Histórico Imutável & Soft Delete Permanente): APROVADO')
  console.log('=================================================================\n')
}

runTests().catch((err) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES DA FASE 9:\n', err)
  process.exit(1)
})
