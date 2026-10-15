import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/plannit',
})

async function runDirectTests() {
  console.log('=================================================================')
  console.log('  TESTES DA FASE 3: BRIEFINGS & SCORE INTELIGENTE (RN002)')
  console.log('=================================================================')

  // 1. Valida integridade do banco de dados
  const { rows: projetos } = await pool.query('SELECT count(*) FROM projetos')
  const { rows: briefings } = await pool.query('SELECT count(*) FROM briefings')
  const { rows: ambientes } = await pool.query('SELECT count(*) FROM ambientes_briefing')
  const { rows: fila } = await pool.query('SELECT count(*) FROM fila_projetos')

  console.log(`[DB] Projetos cadastrados: ${projetos[0].count}`)
  console.log(`[DB] Briefings cadastrados: ${briefings[0].count}`)
  console.log(`[DB] Ambientes detalhados: ${ambientes[0].count}`)
  console.log(`[DB] Entradas na fila de projetos: ${fila[0].count}`)

  if (Number(projetos[0].count) < 3 || Number(briefings[0].count) < 3) {
    throw new Error('Banco não possui a quantidade esperada de briefings de teste!')
  }

  // 2. Testa os registros do seeder e a trava RN002
  const { rows: briefingIncompleto } = await pool.query(`
    SELECT b.id, b.score, b.score_minimo, b.status, p.codigo, p.status as projeto_status
    FROM briefings b
    JOIN projetos p ON p.id = b.projeto_id
    WHERE p.codigo = 'PRJ-2026-001'
  `)
  const b1 = briefingIncompleto[0]
  console.log(`\n[Caso 1: Incompleto] Projeto ${b1.codigo} — Score: ${b1.score}/${b1.score_minimo} pts, Status Briefing: ${b1.status}`)
  if (Number(b1.score) >= 70) {
    throw new Error('O briefing incompleto deveria ter score < 70!')
  }
  console.log('✔ Validação RN002: Briefing possui score insuficiente para ingressar na fila.')

  const { rows: briefingCompleto } = await pool.query(`
    SELECT b.id, b.score, b.score_minimo, b.status, p.codigo, p.status as projeto_status
    FROM briefings b
    JOIN projetos p ON p.id = b.projeto_id
    WHERE p.codigo = 'PRJ-2026-002'
  `)
  const b2 = briefingCompleto[0]
  console.log(`\n[Caso 2: Apto para Fila] Projeto ${b2.codigo} — Score: ${b2.score}/${b2.score_minimo} pts, Status Briefing: ${b2.status}`)
  if (Number(b2.score) < 70) {
    throw new Error('O briefing completo deveria ter score >= 70!')
  }
  console.log('✔ Validação RN002: Briefing atinge pontuação para envio à fila.')

  const { rows: briefingEnviado } = await pool.query(`
    SELECT b.id, b.score, b.status, b.enviado_em, p.codigo, p.status as projeto_status, f.status as fila_status
    FROM briefings b
    JOIN projetos p ON p.id = b.projeto_id
    LEFT JOIN fila_projetos f ON f.projeto_id = p.id
    WHERE p.codigo = 'PRJ-2026-003'
  `)
  const b3 = briefingEnviado[0]
  console.log(`\n[Caso 3: Já Enviado] Projeto ${b3.codigo} — Score: ${b3.score} pts, Status Briefing: ${b3.status}, Status Projeto: ${b3.projeto_status}, Status Fila: ${b3.fila_status}`)
  if (b3.status !== 'enviado' || b3.projeto_status !== 'na_fila' || !b3.fila_status) {
    throw new Error('Inconsistência nos estados do briefing enviado ou projeto na fila!')
  }
  console.log('✔ Fluxo Completo: Briefing enviado gera transição para "na_fila" e alocação na tabela fila_projetos.')

  console.log('\n✔ Testes diretos de banco concluídos com sucesso!')
}

runDirectTests()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Erro nos testes de banco:', err)
    pool.end()
    process.exit(1)
  })
