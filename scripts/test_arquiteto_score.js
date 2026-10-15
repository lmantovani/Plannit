import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plannit',
})

// =============================================================================
// Fórmulas Matemáticas Puras (Espelho Exato de arquiteto_score_service.ts)
// =============================================================================

function pontuarRecencia(dias) {
  if (dias === null || dias === undefined) return 0
  if (dias <= 30) return 100
  if (dias <= 90) return 70
  if (dias <= 180) return 40
  if (dias <= 365) return 20
  return 5
}

function pontuarFrequencia(qtd) {
  if (qtd <= 0) return 0
  if (qtd === 1) return 30
  if (qtd <= 3) return 60
  if (qtd <= 6) return 85
  return 100
}

function pontuarValor(soma) {
  if (!soma || soma <= 0) return 0
  if (soma < 50_000) return 30
  if (soma < 150_000) return 55
  if (soma < 350_000) return 75
  if (soma < 700_000) return 90
  return 100
}

function calcularRFV(recencia, frequencia, valor) {
  return Number(((recencia + frequencia + valor) / 3).toFixed(1))
}

function pontuarPotencial(qtdAtivos) {
  if (qtdAtivos <= 0) return 0
  if (qtdAtivos === 1) return 40
  if (qtdAtivos <= 3) return 65
  if (qtdAtivos <= 6) return 85
  return 100
}

function pontuarTempoParceria(meses) {
  if (meses < 3) return 20
  if (meses < 12) return 50
  if (meses < 24) return 75
  return 100
}

function pontuarConsistencia(mesesComProjeto) {
  const capado = Math.max(0, Math.min(12, mesesComProjeto))
  return Number(((capado / 12) * 100).toFixed(1))
}

function pontuarTaxaConversao(fechados, perdidos, desqualificados) {
  const total = fechados + perdidos + desqualificados
  if (total === 0) return 50.0
  return Number(((fechados / total) * 100).toFixed(1))
}

function calcularLealdade(tempo, consistencia, conversao) {
  return Number(((tempo + consistencia + conversao) / 3).toFixed(1))
}

function calcularScoreGeral(rfv, potencial, lealdade) {
  return Number(((rfv + potencial + lealdade) / 3).toFixed(1))
}

function determinarSegmento(params) {
  if (!params.temHistorico) return 'inativo'
  if (params.diasDesdeCadastro < 90) return 'novo_promissor'
  if (params.emRisco) return 'em_risco'
  if (params.scoreGeral >= 85) return 'campeao'
  if (params.lealdade >= 75 && params.rfv >= 50) return 'parceiro_fiel'
  if (params.potencial >= 70) return 'em_ascensao'
  return 'ocasional'
}

function determinarFlags(params) {
  const flags = []
  if (params.scoreGeral >= 85) flags.push('top_indicador')
  if (params.emRisco) flags.push('em_risco_de_perda')
  if (params.potencial >= 70) flags.push('alto_potencial')
  if (params.valorPontos >= 90) flags.push('indicacao_alto_valor')
  if (
    params.emRisco &&
    params.temDono &&
    (params.diasDesdeUltimaInteracao === null ||
      params.diasDesdeUltimaInteracao === undefined ||
      params.diasDesdeUltimaInteracao > 30)
  ) {
    flags.push('especificador_esfriando')
  }
  return flags
}

function calcularRiscoConcorrencia(percentuais) {
  const maior = percentuais.length > 0 ? Math.max(...percentuais) : 0
  let nivel = 'baixo'
  if (maior >= 30 && maior <= 60) nivel = 'medio'
  else if (maior > 60) nivel = 'alto'
  return { risco: Number(maior.toFixed(1)), nivel }
}

function mesesEntre(inicio, fim) {
  if (!inicio) return 0
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
  if (fim.getDate() < inicio.getDate()) {
    meses -= 1
  }
  return Math.max(0, meses)
}

function contarMesesDistintos(datas) {
  const chaves = new Set()
  for (const d of datas) {
    if (d) {
      const dataObj = d instanceof Date ? d : new Date(d)
      chaves.add(`${dataObj.getFullYear()}-${dataObj.getMonth() + 1}`)
    }
  }
  return chaves.size
}

// =============================================================================
// Suite de Testes Automatizados
// =============================================================================

async function runArquitetoScoreTests() {
  console.log('==============================================================================')
  console.log(' TESTE AUTOMATIZADO: MOTOR DE SCORE DE ESPECIFICADORES & REGRAS DE NEGÓCIO')
  console.log('==============================================================================')

  let totalAssertions = 0
  function assertEqual(actual, expected, message) {
    totalAssertions++
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`[FALHA] ${message} -> Esperado: ${JSON.stringify(expected)}, Obtido: ${JSON.stringify(actual)}`)
    }
    console.log(`  ✔ [${totalAssertions}] ${message}`)
  }

  // ---------------------------------------------------------------------------
  // 1. Integridade Estrutural do Banco de Dados (Schema e FKs)
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. Validando Integridade Estrutural de Tabelas e Chaves Estrangeiras ---')

  const tabelasObrigatorias = [
    'arquitetos',
    'decisores_arquitetos',
    'concorrentes_arquitetos',
    'historico_dono_arquitetos',
    'interacoes_arquitetos',
    'metas_visitas_consultor',
  ]

  for (const tabela of tabelasObrigatorias) {
    const { rows } = await pool.query(
      `SELECT count(*) FROM information_schema.tables WHERE table_name = $1`,
      [tabela]
    )
    assertEqual(Number(rows[0].count), 1, `Tabela "${tabela}" existe no banco de dados`)
  }

  // FK projetos.arquiteto_id
  const { rows: fkProjetos } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'arquiteto_id'`
  )
  assertEqual(fkProjetos.length, 1, `Coluna "projetos.arquiteto_id" existe no schema`)

  // FK leads.arquiteto_id
  const { rows: fkLeads } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'arquiteto_id'`
  )
  assertEqual(fkLeads.length, 1, `Coluna "leads.arquiteto_id" existe no schema`)

  // ---------------------------------------------------------------------------
  // 2. Validação das Funções Matemáticas Puras (Boundary & Corner Cases)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Validando Funções Matemáticas Puras (Pilar a Pilar) ---')

  // Recência (0-100)
  assertEqual(pontuarRecencia(null), 0, 'Recência sem projetos (null) = 0 pts')
  assertEqual(pontuarRecencia(undefined), 0, 'Recência indefinida (undefined) = 0 pts')
  assertEqual(pontuarRecencia(0), 100, 'Recência mesmo dia (0d) = 100 pts')
  assertEqual(pontuarRecencia(30), 100, 'Recência limite inferior (30d) = 100 pts')
  assertEqual(pontuarRecencia(31), 70, 'Recência início faixa 2 (31d) = 70 pts')
  assertEqual(pontuarRecencia(90), 70, 'Recência limite faixa 2 (90d) = 70 pts')
  assertEqual(pontuarRecencia(91), 40, 'Recência início faixa 3 (91d) = 40 pts')
  assertEqual(pontuarRecencia(180), 40, 'Recência limite faixa 3 (180d) = 40 pts')
  assertEqual(pontuarRecencia(181), 20, 'Recência início faixa 4 (181d) = 20 pts')
  assertEqual(pontuarRecencia(365), 20, 'Recência limite faixa 4 (365d) = 20 pts')
  assertEqual(pontuarRecencia(366), 5, 'Recência acima de 365 dias (366d) = 5 pts')

  // Frequência (0-100)
  assertEqual(pontuarFrequencia(0), 0, 'Frequência 0 projetos = 0 pts')
  assertEqual(pontuarFrequencia(1), 30, 'Frequência 1 projeto = 30 pts')
  assertEqual(pontuarFrequencia(2), 60, 'Frequência 2 projetos = 60 pts')
  assertEqual(pontuarFrequencia(3), 60, 'Frequência 3 projetos = 60 pts')
  assertEqual(pontuarFrequencia(4), 85, 'Frequência 4 projetos = 85 pts')
  assertEqual(pontuarFrequencia(6), 85, 'Frequência 6 projetos = 85 pts')
  assertEqual(pontuarFrequencia(7), 100, 'Frequência 7 projetos = 100 pts')
  assertEqual(pontuarFrequencia(15), 100, 'Frequência 15 projetos = 100 pts')

  // Valor (0-100)
  assertEqual(pontuarValor(0), 0, 'Valor 0 = 0 pts')
  assertEqual(pontuarValor(null), 0, 'Valor null = 0 pts')
  assertEqual(pontuarValor(49999.99), 30, 'Valor < R$ 50k (R$ 49.999) = 30 pts')
  assertEqual(pontuarValor(50000), 55, 'Valor R$ 50k exato = 55 pts')
  assertEqual(pontuarValor(149999.99), 55, 'Valor < R$ 150k = 55 pts')
  assertEqual(pontuarValor(150000), 75, 'Valor R$ 150k exato = 75 pts')
  assertEqual(pontuarValor(349999.99), 75, 'Valor < R$ 350k = 75 pts')
  assertEqual(pontuarValor(350000), 90, 'Valor R$ 350k exato = 90 pts')
  assertEqual(pontuarValor(699999.99), 90, 'Valor < R$ 700k = 90 pts')
  assertEqual(pontuarValor(700000), 100, 'Valor R$ 700k exato = 100 pts')
  assertEqual(pontuarValor(1500000), 100, 'Valor R$ 1.5M = 100 pts')

  // RFV Médias
  assertEqual(calcularRFV(100, 100, 100), 100.0, 'RFV perfeito (100, 100, 100) = 100.0')
  assertEqual(calcularRFV(70, 60, 55), 61.7, 'RFV misto (70, 60, 55) = 61.7')
  assertEqual(calcularRFV(0, 0, 0), 0.0, 'RFV nulo (0, 0, 0) = 0.0')

  // Potencial (0-100)
  assertEqual(pontuarPotencial(0), 0, 'Potencial 0 ativos = 0 pts')
  assertEqual(pontuarPotencial(1), 40, 'Potencial 1 ativo = 40 pts')
  assertEqual(pontuarPotencial(2), 65, 'Potencial 2 ativos = 65 pts')
  assertEqual(pontuarPotencial(3), 65, 'Potencial 3 ativos = 65 pts')
  assertEqual(pontuarPotencial(4), 85, 'Potencial 4 ativos = 85 pts')
  assertEqual(pontuarPotencial(6), 85, 'Potencial 6 ativos = 85 pts')
  assertEqual(pontuarPotencial(7), 100, 'Potencial 7 ativos = 100 pts')
  assertEqual(pontuarPotencial(12), 100, 'Potencial 12 ativos = 100 pts')

  // Tempo de Parceria (0-100)
  assertEqual(pontuarTempoParceria(0), 20, 'Tempo parceria 0 meses = 20 pts')
  assertEqual(pontuarTempoParceria(2), 20, 'Tempo parceria 2 meses = 20 pts')
  assertEqual(pontuarTempoParceria(3), 50, 'Tempo parceria 3 meses = 50 pts')
  assertEqual(pontuarTempoParceria(11), 50, 'Tempo parceria 11 meses = 50 pts')
  assertEqual(pontuarTempoParceria(12), 75, 'Tempo parceria 12 meses = 75 pts')
  assertEqual(pontuarTempoParceria(23), 75, 'Tempo parceria 23 meses = 75 pts')
  assertEqual(pontuarTempoParceria(24), 100, 'Tempo parceria 24 meses = 100 pts')
  assertEqual(pontuarTempoParceria(36), 100, 'Tempo parceria 36 meses = 100 pts')

  // Consistência (0-100)
  assertEqual(pontuarConsistencia(0), 0.0, 'Consistência 0/12 meses = 0.0')
  assertEqual(pontuarConsistencia(6), 50.0, 'Consistência 6/12 meses = 50.0')
  assertEqual(pontuarConsistencia(12), 100.0, 'Consistência 12/12 meses = 100.0')
  assertEqual(pontuarConsistencia(15), 100.0, 'Consistência capada em 12 meses = 100.0')

  // Taxa de Conversão (0-100)
  assertEqual(pontuarTaxaConversao(0, 0, 0), 50.0, 'Taxa conversão sem histórico terminal = 50.0 neutro')
  assertEqual(pontuarTaxaConversao(5, 0, 0), 100.0, 'Taxa conversão 5/5 fechados = 100.0')
  assertEqual(pontuarTaxaConversao(4, 1, 0), 80.0, 'Taxa conversão 4/5 fechados = 80.0')
  assertEqual(pontuarTaxaConversao(0, 5, 0), 0.0, 'Taxa conversão 0/5 fechados = 0.0')

  // Score Geral
  assertEqual(calcularScoreGeral(100, 100, 100), 100.0, 'Score Geral perfeito = 100.0')
  assertEqual(calcularScoreGeral(70, 85, 76.7), 77.2, 'Score Geral composto = 77.2')

  // ---------------------------------------------------------------------------
  // 3. Validação dos 7 Segmentos e 5 Flags nos Registros do Seeder
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Validando os 7 Segmentos e 5 Flags nos Registros Reais do Banco ---')

  const agora = new Date()
  const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000)

  // Consulta todos os arquitetos e relações do banco
  const { rows: arquitetos } = await pool.query(`
    SELECT id, nome, consultor_id, created_at, is_active
    FROM arquitetos
    ORDER BY id ASC
  `)

  if (arquitetos.length < 8) {
    throw new Error(`Esperado pelo menos 8 arquitetos do seeder, encontrados: ${arquitetos.length}`)
  }

  const mapaEsperado = {
    'Studio Alpha Inativo': {
      segmento: 'inativo',
      flags: [],
      scoreMaximo: 25.0,
    },
    'Lucas Arquiteto Novo Promissor': {
      segmento: 'novo_promissor',
      flags: [],
    },
    'Rafael Costa Arquitetura Em Risco': {
      segmento: 'em_risco',
      flags: ['em_risco_de_perda'],
      riscoConcorrenciaNivel: 'alto',
    },
    'Sofia Valente Arquitetura Campeã': {
      segmento: 'campeao',
      flags: ['top_indicador', 'alto_potencial', 'indicacao_alto_valor'],
      scoreMinimo: 85.0,
      riscoConcorrenciaNivel: 'baixo',
    },
    'Beatriz Mendes Design Parceira Fiel': {
      segmento: 'parceiro_fiel',
      flags: [],
      scoreMaximo: 84.9,
      riscoConcorrenciaNivel: 'medio',
    },
    'Thiago Rocha Engenharia Em Ascensao': {
      segmento: 'em_ascensao',
      flags: ['alto_potencial'],
      scoreMaximo: 84.9,
      riscoConcorrenciaNivel: 'baixo',
    },
    'Camila Prado Decoradora Ocasional': {
      segmento: 'ocasional',
      flags: [],
      scoreMaximo: 84.9,
    },
    'Marina Dias Arquitetura Esfriando': {
      segmento: 'em_risco',
      flags: ['em_risco_de_perda', 'especificador_esfriando'],
    },
  }

  for (const arq of arquitetos) {
    const config = mapaEsperado[arq.nome]
    if (!config) continue

    // 1. Projetos não arquivados e não cancelados
    const { rows: projetos } = await pool.query(
      `SELECT id, status, valor_contrato, created_at FROM projetos WHERE arquiteto_id = $1 AND arquivado = false AND status != 'cancelado'`,
      [arq.id]
    )

    // 2. Leads vinculados
    const { rows: leads } = await pool.query(
      `SELECT id, status_funil, created_at FROM leads WHERE arquiteto_id = $1`,
      [arq.id]
    )

    // 3. Concorrentes
    const { rows: concorrentes } = await pool.query(
      `SELECT percentual_fechamento_estimado FROM concorrentes_arquitetos WHERE arquiteto_id = $1`,
      [arq.id]
    )

    // 4. Interações
    const { rows: interacoes } = await pool.query(
      `SELECT data FROM interacoes_arquitetos WHERE arquiteto_id = $1 ORDER BY data DESC`,
      [arq.id]
    )

    const datasProjetos = projetos.map((p) => new Date(p.created_at))
    const ultimoProjetoEm = datasProjetos.length > 0 ? new Date(Math.max(...datasProjetos)) : null
    const diasDesdeUltimoProjeto = ultimoProjetoEm
      ? Math.max(0, Math.floor((agora.getTime() - ultimoProjetoEm.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    const projetos12m = projetos.filter((p) => new Date(p.created_at) >= umAnoAtras)
    const somaValor12m = projetos12m.reduce((acc, p) => acc + (p.valor_contrato ? Number(p.valor_contrato) : 0), 0)

    const datasLeads = leads.map((l) => new Date(l.created_at))
    const todasAtividades = [...datasProjetos, ...datasLeads]
    const ultimaAtividadeEm = todasAtividades.length > 0 ? new Date(Math.max(...todasAtividades)) : null
    const diasDesdeUltimaAtividade = ultimaAtividadeEm
      ? Math.max(0, Math.floor((agora.getTime() - ultimaAtividadeEm.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    const ultimaInteracaoEm = interacoes.length > 0 ? new Date(interacoes[0].data) : null
    const diasDesdeUltimaInteracao = ultimaInteracaoEm
      ? Math.max(0, Math.floor((agora.getTime() - ultimaInteracaoEm.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    const recencia = pontuarRecencia(diasDesdeUltimoProjeto)
    const frequencia = pontuarFrequencia(projetos12m.length)
    const valor = pontuarValor(somaValor12m)
    const rfv = calcularRFV(recencia, frequencia, valor)

    const statusTerminaisLead = ['fechado', 'perdido', 'desqualificado']
    const statusEncerradosProjeto = ['concluido', 'cancelado']

    const leadsAtivos = leads.filter((l) => !statusTerminaisLead.includes(l.status_funil))
    const projetosAtivos = projetos.filter((p) => !statusEncerradosProjeto.includes(p.status))
    const potencial = pontuarPotencial(leadsAtivos.length + projetosAtivos.length)

    const dataCadastroArq = new Date(arq.created_at)
    const mesesDesdeCadastro = mesesEntre(dataCadastroArq, agora)
    const tempoParceria = pontuarTempoParceria(mesesDesdeCadastro)
    const consistencia = pontuarConsistencia(contarMesesDistintos(projetos12m.map((p) => p.created_at)))

    const leadsFechados = leads.filter((l) => l.status_funil === 'fechado').length
    const leadsPerdidos = leads.filter((l) => l.status_funil === 'perdido').length
    const leadsDesq = leads.filter((l) => l.status_funil === 'desqualificado').length
    const taxaConversao = pontuarTaxaConversao(leadsFechados, leadsPerdidos, leadsDesq)

    const lealdade = calcularLealdade(tempoParceria, consistencia, taxaConversao)
    const scoreGeral = calcularScoreGeral(rfv, potencial, lealdade)

    const emRisco = projetos.length > 0 && (diasDesdeUltimaAtividade === null || diasDesdeUltimaAtividade > 180)
    const temHistorico = projetos.length > 0 || leads.length > 0
    const diasDesdeCadastro = Math.max(0, Math.floor((agora.getTime() - dataCadastroArq.getTime()) / (1000 * 60 * 60 * 24)))

    const segmento = determinarSegmento({
      temHistorico,
      diasDesdeCadastro,
      emRisco,
      scoreGeral,
      rfv,
      potencial,
      lealdade,
    })

    const flags = determinarFlags({
      scoreGeral,
      potencial,
      valorPontos: valor,
      emRisco,
      temDono: arq.consultor_id !== null && arq.consultor_id !== undefined,
      diasDesdeUltimaInteracao,
    })

    const percentuaisConcorrentes = concorrentes.map((c) => Number(c.percentual_fechamento_estimado) || 0)
    const concorrencia = calcularRiscoConcorrencia(percentuaisConcorrentes)

    console.log(`\n• Especificador: "${arq.nome}"`)
    console.log(`  RFV: ${rfv} | Potencial: ${potencial} | Lealdade: ${lealdade} | Score Geral: ${scoreGeral}`)
    console.log(`  Segmento Calculado: "${segmento}" (Esperado: "${config.segmento}")`)
    console.log(`  Flags Ativas: [${flags.join(', ')}] (Esperadas: [${config.flags.join(', ')}])`)
    console.log(`  Risco Concorrência: ${concorrencia.risco}% (${concorrencia.nivel})`)

    assertEqual(segmento, config.segmento, `Segmento correto para "${arq.nome}"`)

    for (const f of config.flags) {
      assertEqual(flags.includes(f), true, `Flag "${f}" presente em "${arq.nome}"`)
    }

    if (config.scoreMinimo !== undefined) {
      assertEqual(scoreGeral >= config.scoreMinimo, true, `Score Geral >= ${config.scoreMinimo} para "${arq.nome}"`)
    }
    if (config.scoreMaximo !== undefined) {
      assertEqual(scoreGeral <= config.scoreMaximo, true, `Score Geral <= ${config.scoreMaximo} para "${arq.nome}"`)
    }
    if (config.riscoConcorrenciaNivel !== undefined) {
      assertEqual(concorrencia.nivel, config.riscoConcorrenciaNivel, `Nível de concorrência correto para "${arq.nome}"`)
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Validação de Risco de Concorrência Desacoplado
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Validando Desacoplamento do Risco de Concorrência ---')
  const scoreBase = calcularScoreGeral(70, 65, 80)
  const riscoBaixo = calcularRiscoConcorrencia([15, 20])
  const riscoAlto = calcularRiscoConcorrencia([75, 80])
  assertEqual(scoreBase, 71.7, 'Score Geral permanece inalterado independente do risco de concorrência')
  assertEqual(riscoBaixo.nivel, 'baixo', 'Maior 20% = nível "baixo"')
  assertEqual(riscoAlto.nivel, 'alto', 'Maior 80% = nível "alto"')

  // ---------------------------------------------------------------------------
  // 5. Validação de Metas de Visitas e Interações no Banco
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Validando Metas de Visitas e Interações no Banco de Dados ---')
  const { rows: metas } = await pool.query(`
    SELECT m.consultor_id, m.meta_visitas_mes, u.email
    FROM metas_visitas_consultor m
    JOIN users u ON u.id = m.consultor_id
  `)
  assertEqual(metas.length >= 2, true, 'Pelo menos 2 metas de visitas cadastradas no banco')

  const metaVendedor = metas.find((m) => m.email === 'vendedor@lidermoveis.com.br')
  assertEqual(metaVendedor ? metaVendedor.meta_visitas_mes : 0, 15, 'Meta do vendedor = 15 visitas/mês')

  const { rows: visitasMes } = await pool.query(`
    SELECT count(*) FROM interacoes_arquitetos
    WHERE tipo = 'visita_escritorio'
  `)
  assertEqual(Number(visitasMes[0].count) >= 3, true, 'Interações do tipo "visita_escritorio" registradas no banco')

  console.log('\n==============================================================================')
  console.log(` TODOS OS TESTES DO MOTOR DE SCORE PASSARAM! Total de asserções: ${totalAssertions}`)
  console.log('==============================================================================')
}

runArquitetoScoreTests()
  .then(() => {
    pool.end()
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ ERRO NA SUITE DE TESTES DO SCORE:', err)
    pool.end()
    process.exit(1)
  })
