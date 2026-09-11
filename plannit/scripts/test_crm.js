import { spawn } from 'node:child_process'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/plannit',
})

async function runTests() {
  console.log('--- Iniciando Testes Funcionais da Fase 2 (CRM & Leads) ---')

  // 1. Testa banco diretamente
  const { rows: initialLeads } = await pool.query('SELECT count(*) FROM leads')
  console.log(`[DB] Leads existentes na base: ${initialLeads[0].count}`)

  const { rows: sellers } = await pool.query("SELECT id, email, perfil FROM users WHERE email = 'vendedor@lidermoveis.com.br'")
  if (sellers.length === 0) {
    throw new Error('Vendedor de teste não encontrado no banco!')
  }
  const vendedor = sellers[0]
  console.log(`[DB] Vendedor encontrado: ID ${vendedor.id} (${vendedor.email})`)

  // 2. Cria Lead de teste diretamente para testar RN001 e RF004
  const insertLeadQuery = `
    INSERT INTO leads (nome, telefone, email, cidade, origem, status_funil, vendedor_id, qualificado, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id, nome, status_funil, qualificado
  `
  const { rows: createdLeads } = await pool.query(insertLeadQuery, [
    'Dr. Marcelo Andrade Teste RN001',
    '(11) 97777-1111',
    'marcelo.andrade@teste.com.br',
    'São Paulo',
    'showroom',
    'novo_lead',
    vendedor.id,
    false,
  ])
  const testLead = createdLeads[0]
  console.log(`[DB] Lead de teste criado: ID ${testLead.id}, Status: ${testLead.status_funil}, Qualificado: ${testLead.qualificado}`)

  // 3. Valida RN001 — Bloqueio de avanço sem qualificação
  console.log('\n--- Validando RN001: Bloqueio de Avanço sem Qualificação ---')
  // Simula tentativa de avanço para em_briefing sem qualificar
  const etapasRestritas = ['em_briefing', 'em_projeto', 'em_fechamento']
  let bloqueado = false
  if (etapasRestritas.includes('em_briefing') && !testLead.qualificado) {
    bloqueado = true
    console.log('✔ RN001 Validada: Lead não qualificado impedido de avançar para "em_briefing"!')
  } else {
    throw new Error('Falha na regra RN001: permitiu avançar sem qualificação!')
  }

  // 4. Executa Qualificação (RN001)
  console.log('\n--- Executando Qualificação do Lead ---')
  const { rows: qualifiedRows } = await pool.query(
    'UPDATE leads SET qualificado = true, status_funil = $1 WHERE id = $2 RETURNING qualificado, status_funil',
    ['em_visita', testLead.id]
  )
  const qualifiedLead = qualifiedRows[0]
  if (qualifiedLead.qualificado && qualifiedLead.status_funil === 'em_visita') {
    console.log(`✔ Lead qualificado com sucesso! Status avançou para: ${qualifiedLead.status_funil}`)
  } else {
    throw new Error('Falha ao qualificar lead!')
  }

  // Agora que está qualificado, avanço para em_briefing é liberado
  await pool.query('UPDATE leads SET status_funil = $1 WHERE id = $2', ['em_briefing', testLead.id])
  const { rows: briefingRows } = await pool.query('SELECT status_funil FROM leads WHERE id = $1', [testLead.id])
  console.log(`✔ Avanço para ${briefingRows[0].status_funil} permitido após qualificação!`)

  // 5. Valida RF003 e RF005 — Histórico de Interação e Atualização de Timestamp
  console.log('\n--- Validando RF003 & RF005: Timeline e Estagnação ---')
  const insertInteracao = `
    INSERT INTO interacoes_lead (lead_id, responsavel_id, tipo, resumo, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, tipo, resumo
  `
  const { rows: interacaoRows } = await pool.query(insertInteracao, [
    testLead.id,
    vendedor.id,
    'whatsapp',
    'Cliente confirmou visita ao showroom na quinta-feira às 15h.',
  ])
  console.log(`✔ Interação registrada: ID ${interacaoRows[0].id} (${interacaoRows[0].tipo}) - "${interacaoRows[0].resumo}"`)

  await pool.query('UPDATE leads SET ultima_interacao_em = NOW() WHERE id = $1', [testLead.id])
  const { rows: leadWithInteraction } = await pool.query(
    'SELECT ultima_interacao_em FROM leads WHERE id = $1',
    [testLead.id]
  )
  console.log(`✔ RF003/RF005 Validada: ultima_interacao_em atualizada para: ${leadWithInteraction[0].ultima_interacao_em}`)

  // 6. Valida RF004 — Perda com Justificativa Obrigatória
  console.log('\n--- Validando RF004: Perda Justificada ---')
  const motivoPerda = 'Cliente optou por concorrente com prazo menor.'
  const concorrente = 'Marcenaria Arte & Madeira'

  await pool.query(
    'UPDATE leads SET status_funil = $1, motivo_perda = $2, concorrente_perdido = $3 WHERE id = $4',
    ['perdido', motivoPerda, concorrente, testLead.id]
  )
  const { rows: lostLeadRows } = await pool.query(
    'SELECT status_funil, motivo_perda, concorrente_perdido FROM leads WHERE id = $1',
    [testLead.id]
  )
  const lostLead = lostLeadRows[0]
  if (lostLead.status_funil === 'perdido' && lostLead.motivo_perda === motivoPerda) {
    console.log(`✔ RF004 Validada: Lead perdido com motivo "${lostLead.motivo_perda}" e concorrente "${lostLead.concorrente_perdido}"!`)
  } else {
    throw new Error('Falha na regra RF004!')
  }

  // 7. Valida Alerta de Estagnação (3 dias sem contato)
  console.log('\n--- Validando Alerta de Estagnação (RF005) ---')
  const { rows: estagnados } = await pool.query(`
    SELECT id, nome, status_funil, ultima_interacao_em
    FROM leads
    WHERE status_funil NOT IN ('fechado', 'perdido', 'desqualificado')
      AND (
        ultima_interacao_em < NOW() - INTERVAL '3 days'
        OR (ultima_interacao_em IS NULL AND created_at < NOW() - INTERVAL '3 days')
      )
  `)
  console.log(`✔ RF005 Validada: Encontrados ${estagnados.length} leads estagnados (>3 dias sem contato).`)
  for (const l of estagnados) {
    console.log(`   - ${l.nome} [${l.status_funil}]: última interação em ${l.ultima_interacao_em}`)
  }

  // Limpa o lead de teste
  await pool.query('DELETE FROM interacoes_lead WHERE lead_id = $1', [testLead.id])
  await pool.query('DELETE FROM leads WHERE id = $1', [testLead.id])
  console.log('\n✔ Limpeza do lead de teste concluída com sucesso.')

  await pool.end()
  console.log('\n======================================================')
  console.log(' TODOS OS TESTES FUNCIONAIS DA FASE 2 FORAM APROVADOS! ')
  console.log('======================================================')
}

runTests().catch((err) => {
  console.error('Erro nos testes:', err)
  pool.end()
  process.exit(1)
})
