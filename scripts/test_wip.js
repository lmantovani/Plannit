import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/plannit',
})

async function runTests() {
  console.log('====================================================================')
  console.log('  TESTES DA FASE 4: FILA DE PROJETOS, ALOCAÇÃO & WIP LIMIT (RN003)  ')
  console.log('====================================================================')

  // 1. Valida tabelas e registros
  const { rows: configs } = await pool.query('SELECT count(*) FROM config_wip_projetistas')
  const { rows: fila } = await pool.query('SELECT count(*) FROM fila_projetos')
  const { rows: historico } = await pool.query('SELECT count(*) FROM historico_status_projeto')

  console.log(`[DB] Configurações WIP cadastradas: ${configs[0].count}`)
  console.log(`[DB] Itens na fila de projetos: ${fila[0].count}`)
  console.log(`[DB] Registros em histórico de status: ${historico[0].count}`)

  // 2. Testa projetista com capacidade ESGOTADA (André Valente: 3/3)
  const { rows: andreRows } = await pool.query(`
    SELECT u.id, u.nome, c.wip_limit,
      COUNT(f.id) FILTER (WHERE f.status IN ('alocado', 'em_andamento')) as wip_atual
    FROM users u
    JOIN config_wip_projetistas c ON c.projetista_id = u.id
    LEFT JOIN fila_projetos f ON f.projetista_id = u.id
    WHERE u.email = 'andre.valente@lidermoveis.com.br'
    GROUP BY u.id, u.nome, c.wip_limit
  `)

  const andre = andreRows[0]
  console.log(`\n[Caso 1: Capacidade Esgotada] ${andre.nome}`)
  console.log(`   WIP Atual: ${andre.wip_atual} / Limite: ${andre.wip_limit}`)
  if (Number(andre.wip_atual) < Number(andre.wip_limit)) {
    throw new Error('André Valente deveria estar com 3 projetos ativos!')
  }
  const podeAlocarAndre = Number(andre.wip_atual) < Number(andre.wip_limit)
  console.log(`   Pode receber novos projetos? ${podeAlocarAndre} (Bloqueado por RN003)`)
  if (podeAlocarAndre) {
    throw new Error('Falha na regra RN003: permitiu alocar projetista com capacidade esgotada!')
  }
  console.log('✔ Validação RN003: Bloqueio confirmado para projetista lotado (3/3).')

  // 3. Testa projetista com vagas DISPONÍVEIS (Lucas Silveira: 1/3)
  const { rows: lucasRows } = await pool.query(`
    SELECT u.id, u.nome, c.wip_limit,
      COUNT(f.id) FILTER (WHERE f.status IN ('alocado', 'em_andamento')) as wip_atual
    FROM users u
    JOIN config_wip_projetistas c ON c.projetista_id = u.id
    LEFT JOIN fila_projetos f ON f.projetista_id = u.id
    WHERE u.email = 'projetista@lidermoveis.com.br'
    GROUP BY u.id, u.nome, c.wip_limit
  `)

  const lucas = lucasRows[0]
  console.log(`\n[Caso 2: Vagas Disponíveis] ${lucas.nome}`)
  console.log(`   WIP Atual: ${lucas.wip_atual} / Limite: ${lucas.wip_limit}`)
  const podeAlocarLucas = Number(lucas.wip_atual) < Number(lucas.wip_limit)
  console.log(`   Pode receber novos projetos? ${podeAlocarLucas}`)
  if (!podeAlocarLucas) {
    throw new Error('Lucas deveria ter vagas disponíveis!')
  }
  console.log(`✔ Validação RN003: Lucas apto para receber até ${Number(lucas.wip_limit) - Number(lucas.wip_atual)} projeto(s).`)

  // 4. Testa Projetos Aguardando Alocação
  const { rows: aguardando } = await pool.query(`
    SELECT f.id, p.codigo, p.cliente_nome, f.prioridade, f.status
    FROM fila_projetos f
    JOIN projetos p ON p.id = f.projeto_id
    WHERE f.status = 'aguardando'
    ORDER BY f.prioridade ASC
  `)

  console.log(`\n[Fila de Espera] Total aguardando: ${aguardando.length} projetos`)
  for (const item of aguardando) {
    console.log(`   • ${item.codigo} (Prioridade ${item.prioridade}): ${item.cliente_nome}`)
  }
  if (aguardando.length === 0) {
    throw new Error('Deveria haver projetos aguardando alocação!')
  }

  console.log('\n✔ Testes diretos de banco da Fase 4 concluídos com sucesso!')
}

runTests()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Erro nos testes de banco:', err)
    pool.end()
    process.exit(1)
  })
