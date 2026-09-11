import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

async function runTests() {
  console.log('==============================================================================')
  console.log(' TESTE DE BANCO & REGRAS DE NEGÓCIO: COLABORADORES & RH (RH-RN009 / RH-RN011)')
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
    // 1. Integridade de Schema e Tabelas
    console.log('\n--- 1. Validando Estrutura de Schema no PostgreSQL ---')
    const tablesRes = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN (
        'departamentos', 'cargos', 'colaboradores',
        'historico_salarial_colaboradores', 'historico_cargo_colaboradores',
        'documentos_colaboradores'
      )
    `)
    const tables = tablesRes.rows.map((r) => r.table_name)
    assert(tables.includes('departamentos'), 'Tabela "departamentos" existe no banco')
    assert(tables.includes('cargos'), 'Tabela "cargos" existe no banco')
    assert(tables.includes('colaboradores'), 'Tabela "colaboradores" existe no banco')
    assert(tables.includes('historico_salarial_colaboradores'), 'Tabela "historico_salarial_colaboradores" existe no banco')
    assert(tables.includes('historico_cargo_colaboradores'), 'Tabela "historico_cargo_colaboradores" existe no banco')
    assert(tables.includes('documentos_colaboradores'), 'Tabela "documentos_colaboradores" existe no banco')

    // 2. Colunas Críticas de Auditoria e Imutabilidade
    console.log('\n--- 2. Validando Colunas Críticas (RH-RN009 / RH-RN011) ---')
    const colsColab = (
      await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'colaboradores'
    `)
    ).rows.map((r) => r.column_name)

    assert(colsColab.includes('is_active'), 'Coluna "is_active" existe em colaboradores')
    assert(colsColab.includes('data_desligamento'), 'Coluna "data_desligamento" existe em colaboradores')
    assert(colsColab.includes('tipo_desligamento'), 'Coluna "tipo_desligamento" existe em colaboradores')
    assert(colsColab.includes('motivo_desligamento'), 'Coluna "motivo_desligamento" existe em colaboradores')
    assert(colsColab.includes('entrevista_saida'), 'Coluna "entrevista_saida" existe em colaboradores')
    assert(colsColab.includes('salario_clt'), 'Coluna "salario_clt" existe em colaboradores')
    assert(colsColab.includes('perfil_disc_primario'), 'Coluna "perfil_disc_primario" existe em colaboradores')
    assert(colsColab.includes('gestor_id'), 'Coluna "gestor_id" existe em colaboradores')

    // 3. Validação de Registros do Seeder
    console.log('\n--- 3. Validando População Inicial e Relacionamentos ---')
    const deptosCount = (await pool.query('SELECT count(*) FROM departamentos')).rows[0].count
    assert(Number(deptosCount) >= 5, `Pelo menos 5 departamentos cadastrados (encontrados: ${deptosCount})`)

    const cargosCount = (await pool.query('SELECT count(*) FROM cargos')).rows[0].count
    assert(Number(cargosCount) >= 8, `Pelo menos 8 cargos cadastrados (encontrados: ${cargosCount})`)

    const colabRes = await pool.query(`
      SELECT c.id, c.nome, c.cpf, c.regime, c.is_active, cg.nome as cargo_nome, d.nome as depto_nome
      FROM colaboradores c
      JOIN cargos cg ON cg.id = c.cargo_id
      JOIN departamentos d ON d.id = c.departamento_id
      ORDER BY c.id
    `)
    assert(colabRes.rows.length >= 5, `Pelo menos 5 colaboradores cadastrados (encontrados: ${colabRes.rows.length})`)

    const cltColabs = colabRes.rows.filter((c) => c.regime === 'clt')
    const pjColabs = colabRes.rows.filter((c) => c.regime === 'pj')
    const ativos = colabRes.rows.filter((c) => c.is_active)
    const desligados = colabRes.rows.filter((c) => !c.is_active)

    assert(cltColabs.length >= 3, 'Colaboradores em regime CLT presentes')
    assert(pjColabs.length >= 1, 'Colaborador em regime PJ presente')
    assert(ativos.length >= 4, 'Colaboradores ativos presentes')
    assert(desligados.length >= 1, 'Colaborador com desligamento formal presente para testes de purga')

    // 4. Validação de Históricos Inaugurais
    console.log('\n--- 4. Validando Históricos Inaugurais de Admissão ---')
    const hsRes = await pool.query('SELECT count(*) FROM historico_salarial_colaboradores')
    const hcRes = await pool.query('SELECT count(*) FROM historico_cargo_colaboradores')
    assert(Number(hsRes.rows[0].count) >= 3, 'Históricos salariais inaugurais registrados')
    assert(Number(hcRes.rows[0].count) >= 3, 'Históricos de cargos inaugurais registrados')

    // 5. Validação de Organograma (Gestor e Subordinado)
    console.log('\n--- 5. Validando Hierarquia e Organograma ---')
    const subordinadosRes = await pool.query('SELECT id, nome, gestor_id FROM colaboradores WHERE gestor_id IS NOT NULL')
    assert(subordinadosRes.rows.length >= 1, 'Pelo menos 1 relação de liderança direta (gestor -> liderado) configurada')
    const sub = subordinadosRes.rows[0]
    assert(sub.id !== sub.gestor_id, 'Colaborador não é gestor de si mesmo')

    console.log('\n==============================================================================')
    console.log(` TODOS OS TESTES DE BANCO PASSARAM COM SUCESSO! Total: ${totalAssertions} asserções`)
    console.log('==============================================================================\n')
  } finally {
    await pool.end()
  }
}

runTests().catch((err) => {
  console.error('\n❌ FALHA NOS TESTES DE BANCO:', err)
  process.exit(1)
})
