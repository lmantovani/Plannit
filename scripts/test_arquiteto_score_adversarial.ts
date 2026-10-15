import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'
import { DateTime } from 'luxon'

const APP_ROOT = new URL('../', import.meta.url)
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER })
const app = ignitor.createApp('console')
await app.init()
await app.boot()

await app.start(async () => {
  const {
    pontuarRecencia,
    pontuarFrequencia,
    pontuarValor,
    pontuarTaxaConversao,
    determinarSegmento,
    determinarFlags,
    calcularRiscoConcorrencia,
    mesesEntre,
    contarMesesDistintos,
    calcularScoreArquiteto,
  } = await import('#services/arquiteto_score_service')

  const Arquiteto = (await import('#models/arquiteto')).default
  const Projeto = (await import('#models/projeto')).default
  const { StatusProjeto } = await import('#models/projeto')

  console.log('================================================================================')
  console.log(' TESTE ADVERSARIAL EMPÍRICO: MOTOR ANALÍTICO DE SCORE DE ESPECIFICADORES')
  console.log('================================================================================')

  let passCount = 0
  let failCount = 0
  const failures: string[] = []

  function check(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passCount++
      console.log(`  ✔ [PASS ${passCount}] ${testName}`)
    } else {
      failCount++
      const msg = `  ❌ [FAIL ${failCount}] ${testName}${detail ? ' -> ' + detail : ''}`
      console.error(msg)
      failures.push(msg)
    }
  }

  // ===========================================================================
  // 1. LIMITES EXATOS DE FAIXAS E VALORES DE BORDA (RFV & PILARES)
  // ===========================================================================
  console.log('\n--- 1. Limites Exatos de Faixas de Recência ---')
  check(pontuarRecencia(null) === 0, 'Recência: null deve ser 0')
  check(pontuarRecencia(undefined) === 0, 'Recência: undefined deve ser 0')
  check(pontuarRecencia(0) === 100, 'Recência: 0 dias deve ser 100')
  check(pontuarRecencia(30) === 100, 'Recência: limite 30 dias deve ser 100')
  check(pontuarRecencia(31) === 70, 'Recência: limite 31 dias deve ser 70')
  check(pontuarRecencia(90) === 70, 'Recência: limite 90 dias deve ser 70')
  check(pontuarRecencia(91) === 40, 'Recência: limite 91 dias deve ser 40')
  check(pontuarRecencia(180) === 40, 'Recência: limite 180 dias deve ser 40')
  check(pontuarRecencia(181) === 20, 'Recência: limite 181 dias deve ser 20')
  check(pontuarRecencia(365) === 20, 'Recência: limite 365 dias deve ser 20')
  check(pontuarRecencia(366) === 5, 'Recência: limite 366 dias deve ser 5')
  check(pontuarRecencia(1000) === 5, 'Recência: 1000 dias deve ser 5')
  check(pontuarRecencia(-10) === 100, 'Recência: dias negativos (futuro) pontua 100 (<=30)')

  console.log('\n--- 2. Limites Exatos de Frequência ---')
  check(pontuarFrequencia(-5) === 0, 'Frequência: negativo deve ser 0')
  check(pontuarFrequencia(0) === 0, 'Frequência: 0 projetos deve ser 0')
  check(pontuarFrequencia(1) === 30, 'Frequência: 1 projeto deve ser 30')
  check(pontuarFrequencia(2) === 60, 'Frequência: 2 projetos deve ser 60')
  check(pontuarFrequencia(3) === 60, 'Frequência: limite 3 projetos deve ser 60')
  check(pontuarFrequencia(4) === 85, 'Frequência: limite 4 projetos deve ser 85')
  check(pontuarFrequencia(5) === 85, 'Frequência: 5 projetos deve ser 85')
  check(pontuarFrequencia(6) === 85, 'Frequência: limite 6 projetos deve ser 85')
  check(pontuarFrequencia(7) === 100, 'Frequência: limite 7 projetos deve ser 100')
  check(pontuarFrequencia(50) === 100, 'Frequência: 50 projetos deve ser 100')

  console.log('\n--- 3. Limites Exatos de Valor (Decimais e Nulos) ---')
  check(pontuarValor(null) === 0, 'Valor: null deve ser 0')
  check(pontuarValor(undefined) === 0, 'Valor: undefined deve ser 0')
  check(pontuarValor(0) === 0, 'Valor: 0 deve ser 0')
  check(pontuarValor(-100) === 0, 'Valor: negativo deve ser 0')
  check(pontuarValor(49999.00) === 30, 'Valor: R$ 49.999,00 deve ser 30')
  check(pontuarValor(49999.99) === 30, 'Valor: R$ 49.999,99 deve ser 30')
  check(pontuarValor(50000.00) === 55, 'Valor: R$ 50.000,00 deve ser 55')
  check(pontuarValor(50000.01) === 55, 'Valor: R$ 50.000,01 deve ser 55')
  check(pontuarValor(149999.00) === 55, 'Valor: R$ 149.999,00 deve ser 55')
  check(pontuarValor(149999.99) === 55, 'Valor: R$ 149.999,99 deve ser 55')
  check(pontuarValor(150000.00) === 75, 'Valor: R$ 150.000,00 deve ser 75')
  check(pontuarValor(150000.01) === 75, 'Valor: R$ 150.000,01 deve ser 75')
  check(pontuarValor(349999.00) === 75, 'Valor: R$ 349.999,00 deve ser 75')
  check(pontuarValor(349999.99) === 75, 'Valor: R$ 349.999,99 deve ser 75')
  check(pontuarValor(350000.00) === 90, 'Valor: R$ 350.000,00 deve ser 90')
  check(pontuarValor(350000.01) === 90, 'Valor: R$ 350.000,01 deve ser 90')
  check(pontuarValor(699999.00) === 90, 'Valor: R$ 699.999,00 deve ser 90')
  check(pontuarValor(699999.99) === 90, 'Valor: R$ 699.999,99 deve ser 90')
  check(pontuarValor(700000.00) === 100, 'Valor: R$ 700.000,00 deve ser 100')
  check(pontuarValor(700000.01) === 100, 'Valor: R$ 700.000,01 deve ser 100')

  console.log('\n--- 4. Divisão por Zero em Taxa de Conversão e Lealdade ---')
  check(pontuarTaxaConversao(0, 0, 0) === 50.0, 'Conversão: 0 fechados, 0 perdidos, 0 desqualificados -> 50.0 neutro')
  check(pontuarTaxaConversao(1, 0, 0) === 100.0, 'Conversão: 1/1 fechados -> 100.0')
  check(pontuarTaxaConversao(0, 1, 0) === 0.0, 'Conversão: 0/1 fechados -> 0.0')
  check(pontuarTaxaConversao(0, 0, 1) === 0.0, 'Conversão: 0/1 (1 desqualificado) -> 0.0')
  check(pontuarTaxaConversao(3, 1, 2) === 50.0, 'Conversão: 3 / (3+1+2) = 50.0%')

  console.log('\n--- 5. Anos Bissextos e Cálculos Temporais (Luxon) ---')
  // Ano bissexto: 2024 (29 dias em fevereiro)
  const dtBissextoIni = DateTime.fromISO('2024-02-29T12:00:00Z')
  const dtBissextoFim1 = DateTime.fromISO('2025-02-28T12:00:00Z')
  const dtBissextoFim2 = DateTime.fromISO('2025-03-01T12:00:00Z')
  const m1 = mesesEntre(dtBissextoIni, dtBissextoFim1)
  const m2 = mesesEntre(dtBissextoIni, dtBissextoFim2)
  check(m1 === 11, `Bissexto: 2024-02-29 até 2025-02-28 deve ser 11 meses (dia 28 < 29) -> ${m1}`)
  check(m2 === 12, `Bissexto: 2024-02-29 até 2025-03-01 deve ser 12 meses -> ${m2}`)

  const dtFuturo = DateTime.now().toUTC().plus({ days: 30 })
  const dtAgora = DateTime.now().toUTC()
  const mFuturo = mesesEntre(dtFuturo, dtAgora)
  check(mFuturo === 0, `Data futura: início no futuro clampado para 0 meses -> ${mFuturo}`)

  const mesesDistintos = contarMesesDistintos([
    DateTime.fromISO('2024-02-15T00:00:00Z'),
    DateTime.fromISO('2024-02-29T00:00:00Z'), // mesmo mês em ano bissexto
    DateTime.fromISO('2024-03-01T00:00:00Z'),
  ])
  check(mesesDistintos === 2, `Meses distintos: fev/2024 (duas datas) + mar/2024 deve ser 2 -> ${mesesDistintos}`)

  // ===========================================================================
  // 2. CASCATA ESTRITA DOS 7 SEGMENTOS (SHORT-CIRCUIT INVIOLÁVEL)
  // ===========================================================================
  console.log('\n--- 6. Cascata Estrita dos 7 Segmentos (Precedência e Short-Circuit) ---')

  // Regra 1: !temHistorico -> SEMPRE inativo, mesmo com scoreGeral alto ou cadastro recente
  const seg1 = determinarSegmento({
    temHistorico: false,
    diasDesdeCadastro: 10,
    emRisco: true,
    scoreGeral: 95.0,
    rfv: 90.0,
    potencial: 90.0,
    lealdade: 90.0,
  })
  check(seg1 === 'inativo', 'Cascata R1: sem histórico sempre retorna "inativo"', `Obtido: ${seg1}`)

  // Regra 2: temHistorico && diasDesdeCadastro < 90 -> SEMPRE novo_promissor (mesmo se emRisco ou scoreGeral >= 85)
  const seg2 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 89,
    emRisco: true,
    scoreGeral: 95.0,
    rfv: 90.0,
    potencial: 90.0,
    lealdade: 90.0,
  })
  check(seg2 === 'novo_promissor', 'Cascata R2: diasDesdeCadastro < 90 sempre retorna "novo_promissor"', `Obtido: ${seg2}`)

  // Regra 3: temHistorico && diasDesdeCadastro >= 90 && emRisco -> SEMPRE em_risco (mesmo com scoreGeral >= 85)
  const seg3 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 100,
    emRisco: true,
    scoreGeral: 95.0,
    rfv: 90.0,
    potencial: 90.0,
    lealdade: 90.0,
  })
  check(seg3 === 'em_risco', 'Cascata R3: emRisco sobrepõe scoreGeral >= 85 -> "em_risco"', `Obtido: ${seg3}`)

  // Regra 4: !emRisco && scoreGeral >= 85 -> SEMPRE campeao
  const seg4 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 100,
    emRisco: false,
    scoreGeral: 85.0,
    rfv: 85.0,
    potencial: 85.0,
    lealdade: 85.0,
  })
  check(seg4 === 'campeao', 'Cascata R4: scoreGeral >= 85 retorna "campeao"', `Obtido: ${seg4}`)

  // Regra 5: scoreGeral < 85 && lealdade >= 75 && rfv >= 50 -> SEMPRE parceiro_fiel (mesmo com potencial >= 70)
  const seg5 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 100,
    emRisco: false,
    scoreGeral: 70.0,
    rfv: 50.0,
    potencial: 85.0, // potencial alto
    lealdade: 75.0,
  })
  check(seg5 === 'parceiro_fiel', 'Cascata R5: lealdade >= 75 e rfv >= 50 sobrepõe potencial alto -> "parceiro_fiel"', `Obtido: ${seg5}`)

  // Regra 6: potencial >= 70 -> em_ascensao
  const seg6 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 100,
    emRisco: false,
    scoreGeral: 60.0,
    rfv: 40.0, // rfv < 50, não é parceiro fiel
    potencial: 70.0,
    lealdade: 80.0,
  })
  check(seg6 === 'em_ascensao', 'Cascata R6: potencial >= 70 quando não é parceiro fiel -> "em_ascensao"', `Obtido: ${seg6}`)

  // Regra 7: fallback -> ocasional
  const seg7 = determinarSegmento({
    temHistorico: true,
    diasDesdeCadastro: 100,
    emRisco: false,
    scoreGeral: 40.0,
    rfv: 40.0,
    potencial: 50.0,
    lealdade: 50.0,
  })
  check(seg7 === 'ocasional', 'Cascata R7: caso padrão retorna "ocasional"', `Obtido: ${seg7}`)

  // ===========================================================================
  // 3. COEXISTÊNCIA DAS 5 FLAGS E RISCO DE CONCORRÊNCIA
  // ===========================================================================
  console.log('\n--- 7. Coexistência Simultânea das 5 Flags Ativas ---')

  // Cenário extremo: todas as 5 condições são satisfeitas simultaneamente:
  // - scoreGeral >= 85 -> top_indicador
  // - emRisco -> em_risco_de_perda
  // - potencial >= 70 -> alto_potencial
  // - valorPontos >= 90 -> indicacao_alto_valor
  // - emRisco && temDono && diasSemInteracao > 30 -> especificador_esfriando
  const todasFlags = determinarFlags({
    scoreGeral: 86.0,
    potencial: 75,
    valorPontos: 90,
    emRisco: true,
    temDono: true,
    diasDesdeUltimaInteracao: 45,
  })

  check(todasFlags.length === 5, '5 flags: todas as 5 flags podem coexistir simultaneamente', `Obtido: ${todasFlags.join(', ')}`)
  check(todasFlags.includes('top_indicador'), 'Flag top_indicador presente')
  check(todasFlags.includes('em_risco_de_perda'), 'Flag em_risco_de_perda presente')
  check(todasFlags.includes('alto_potencial'), 'Flag alto_potencial presente')
  check(todasFlags.includes('indicacao_alto_valor'), 'Flag indicacao_alto_valor presente')
  check(todasFlags.includes('especificador_esfriando'), 'Flag especificador_esfriando presente')

  console.log('\n--- 8. Isolamento Estrito do Risco de Concorrência ---')
  const c1 = calcularRiscoConcorrencia([])
  const c2 = calcularRiscoConcorrencia([29.9])
  const c3 = calcularRiscoConcorrencia([30.0])
  const c4 = calcularRiscoConcorrencia([60.0])
  const c5 = calcularRiscoConcorrencia([60.1])
  check(c1.nivel === 'baixo' && c1.risco === 0, 'Concorrência vazia -> risco 0 (baixo)')
  check(c2.nivel === 'baixo' && c2.risco === 29.9, 'Concorrência 29.9% -> nível baixo')
  check(c3.nivel === 'medio' && c3.risco === 30.0, 'Concorrência 30.0% -> nível medio')
  check(c4.nivel === 'medio' && c4.risco === 60.0, 'Concorrência 60.0% -> nível medio')
  check(c5.nivel === 'alto' && c5.risco === 60.1, 'Concorrência 60.1% -> nível alto')

  // ===========================================================================
  // 4. TESTES EMPÍRICOS DE BANCO DE DADOS: PROJETOS CANCELADOS E ARQUIVADOS NO RFV
  // ===========================================================================
  console.log('\n--- 9. Teste Empírico no Banco: Projetos Arquivados vs Cancelados no RFV ---')

  // Criar especificador temporário para teste no banco
  const agoraDb = DateTime.now().toUTC()
  const arqTeste = await Arquiteto.create({
    nome: 'Teste Adversarial RFV Cancelado',
    tipo: 'arquiteto',
    statusCarteira: 'ativo',
    isActive: true,
  })

  // Criar 1 projeto ARQUIVADO (arquivado = true) com valor R$ 800.000 e 5 dias atrás
  const projArquivado = await Projeto.create({
    codigo: 'PROJ-TEST-ARQUIVADO',
    clienteNome: 'Cliente Teste Arquivado',
    arquitetoId: arqTeste.id,
    status: StatusProjeto.CONCLUIDO,
    valorContrato: '800000',
    arquivado: true,
    createdAt: agoraDb.minus({ days: 5 }),
  })

  // Calcular score com apenas projeto arquivado
  const scoreComArquivado = await calcularScoreArquiteto(arqTeste.id)
  check(
    scoreComArquivado.detalhes.projetos12Meses === 0,
    'Projetos arquivados (arquivado=true) são IGNORADOS no RFV (frequência = 0)',
    `Obtido: ${scoreComArquivado.detalhes.projetos12Meses}`
  )
  check(
    scoreComArquivado.detalhes.somaValorContratos12Meses === 0,
    'Projetos arquivados (arquivado=true) são IGNORADOS no RFV (valor = 0)',
    `Obtido: ${scoreComArquivado.detalhes.somaValorContratos12Meses}`
  )
  check(
    scoreComArquivado.detalhes.recencia === 0,
    'Projetos arquivados (arquivado=true) são IGNORADOS na recência (recencia = 0)',
    `Obtido: ${scoreComArquivado.detalhes.recencia}`
  )

  // Agora criar 1 projeto NÃO ARQUIVADO porém CANCELADO (status = 'cancelado', arquivado = false)
  // Valor R$ 500.000 e 10 dias atrás
  const projCancelado = await Projeto.create({
    codigo: 'PROJ-TEST-CANCELADO',
    clienteNome: 'Cliente Teste Cancelado',
    arquitetoId: arqTeste.id,
    status: StatusProjeto.CANCELADO,
    valorContrato: '500000',
    arquivado: false,
    createdAt: agoraDb.minus({ days: 10 }),
  })

  const scoreComCancelado = await calcularScoreArquiteto(arqTeste.id)

  console.log(`\n  [Diagnóstico Empírico de Projeto Cancelado]`)
  console.log(`  Projetos12m: ${scoreComCancelado.detalhes.projetos12Meses}`)
  console.log(`  SomaValor12m: ${scoreComCancelado.detalhes.somaValorContratos12Meses}`)
  console.log(`  Recência pts: ${scoreComCancelado.detalhes.recencia}`)
  console.log(`  RFV: ${scoreComCancelado.rfv}`)
  console.log(`  Projetos Ativos (Potencial): ${scoreComCancelado.detalhes.projetosAtivos}`)

  // O requisito diz: "projetos cancelados/arquivados (devem ser ignorados no RFV)"
  // Vamos verificar se o motor atual IGNORA projetos cancelados no RFV:
  const ignoraCanceladoNoRfv = (
    scoreComCancelado.detalhes.projetos12Meses === 0 &&
    scoreComCancelado.detalhes.somaValorContratos12Meses === 0 &&
    scoreComCancelado.detalhes.recencia === 0
  )

  check(
    ignoraCanceladoNoRfv,
    'Projetos cancelados (status="cancelado") devem ser ignorados no RFV',
    `Frequência: ${scoreComCancelado.detalhes.projetos12Meses}, Valor: ${scoreComCancelado.detalhes.somaValorContratos12Meses}, Recência: ${scoreComCancelado.detalhes.recencia}`
  )

  // Limpeza dos dados temporários criados no banco
  await projCancelado.delete()
  await projArquivado.delete()
  await arqTeste.delete()

  console.log('\n================================================================================')
  console.log(` RESULTADO FINAL DO HARNESS ADVERSARIAL:`)
  console.log(` PASSOU: ${passCount} | FALHOU: ${failCount}`)
  if (failures.length > 0) {
    console.log('\n RESUMO DE FALHAS ENCONTRADAS:')
    failures.forEach((f) => console.log(f))
  }
  console.log('================================================================================')

  if (failCount > 0) {
    process.exitCode = 1
  }
})

await app.terminate()
