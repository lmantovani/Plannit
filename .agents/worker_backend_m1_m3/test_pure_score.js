import assert from 'node:assert/strict'

// Import pure functions directly from the service
// Since it's TS, we can test the exact mathematical logic implemented
import {
  pontuarRecencia,
  pontuarFrequencia,
  pontuarValor,
  calcularRFV,
  pontuarPotencial,
  pontuarTempoParceria,
  pontuarConsistencia,
  pontuarTaxaConversao,
  calcularLealdade,
  calcularScoreGeral,
  determinarSegmento,
  determinarFlags,
  calcularRiscoConcorrencia,
} from '../../plannit/app/services/arquiteto_score_service.ts'

console.log('Testing pure scoring functions...')

// 1. Recência
assert.equal(pontuarRecencia(null), 0)
assert.equal(pontuarRecencia(undefined), 0)
assert.equal(pontuarRecencia(0), 100)
assert.equal(pontuarRecencia(30), 100)
assert.equal(pontuarRecencia(31), 70)
assert.equal(pontuarRecencia(90), 70)
assert.equal(pontuarRecencia(91), 40)
assert.equal(pontuarRecencia(180), 40)
assert.equal(pontuarRecencia(181), 20)
assert.equal(pontuarRecencia(365), 20)
assert.equal(pontuarRecencia(366), 5)
console.log('✓ pontuarRecencia passed')

// 2. Frequência
assert.equal(pontuarFrequencia(0), 0)
assert.equal(pontuarFrequencia(-1), 0)
assert.equal(pontuarFrequencia(1), 30)
assert.equal(pontuarFrequencia(2), 60)
assert.equal(pontuarFrequencia(3), 60)
assert.equal(pontuarFrequencia(4), 85)
assert.equal(pontuarFrequencia(6), 85)
assert.equal(pontuarFrequencia(7), 100)
assert.equal(pontuarFrequencia(10), 100)
console.log('✓ pontuarFrequencia passed')

// 3. Valor
assert.equal(pontuarValor(0), 0)
assert.equal(pontuarValor(null), 0)
assert.equal(pontuarValor(undefined), 0)
assert.equal(pontuarValor(49_999), 30)
assert.equal(pontuarValor(50_000), 55)
assert.equal(pontuarValor(149_999), 55)
assert.equal(pontuarValor(150_000), 75)
assert.equal(pontuarValor(349_999), 75)
assert.equal(pontuarValor(350_000), 90)
assert.equal(pontuarValor(699_999), 90)
assert.equal(pontuarValor(700_000), 100)
assert.equal(pontuarValor(1_000_000), 100)
console.log('✓ pontuarValor passed')

// 4. RFV
assert.equal(calcularRFV(100, 60, 30), 63.3)
assert.equal(calcularRFV(100, 100, 100), 100.0)
assert.equal(calcularRFV(0, 0, 0), 0.0)
console.log('✓ calcularRFV passed')

// 5. Potencial
assert.equal(pontuarPotencial(0), 0)
assert.equal(pontuarPotencial(1), 40)
assert.equal(pontuarPotencial(2), 65)
assert.equal(pontuarPotencial(3), 65)
assert.equal(pontuarPotencial(4), 85)
assert.equal(pontuarPotencial(6), 85)
assert.equal(pontuarPotencial(7), 100)
assert.equal(pontuarPotencial(15), 100)
console.log('✓ pontuarPotencial passed')

// 6. Tempo de parceria
assert.equal(pontuarTempoParceria(0), 20)
assert.equal(pontuarTempoParceria(2), 20)
assert.equal(pontuarTempoParceria(3), 50)
assert.equal(pontuarTempoParceria(11), 50)
assert.equal(pontuarTempoParceria(12), 75)
assert.equal(pontuarTempoParceria(23), 75)
assert.equal(pontuarTempoParceria(24), 100)
assert.equal(pontuarTempoParceria(50), 100)
console.log('✓ pontuarTempoParceria passed')

// 7. Consistência
assert.equal(pontuarConsistencia(0), 0.0)
assert.equal(pontuarConsistencia(6), 50.0)
assert.equal(pontuarConsistencia(12), 100.0)
assert.equal(pontuarConsistencia(15), 100.0)
console.log('✓ pontuarConsistencia passed')

// 8. Taxa de conversão
assert.equal(pontuarTaxaConversao(0, 0, 0), 50.0)
assert.equal(pontuarTaxaConversao(8, 2, 0), 80.0)
assert.equal(pontuarTaxaConversao(0, 5, 0), 0.0)
console.log('✓ pontuarTaxaConversao passed')

// 9. Lealdade e Score Geral
assert.equal(calcularLealdade(50, 50, 50), 50.0)
assert.equal(calcularScoreGeral(90, 80, 70), 80.0)
console.log('✓ calcularLealdade e calcularScoreGeral passed')

// 10. Segmentos
const baseParams = {
  temHistorico: true,
  diasDesdeCadastro: 400,
  emRisco: false,
  scoreGeral: 50,
  rfv: 50,
  potencial: 50,
  lealdade: 50,
}

assert.equal(determinarSegmento({ ...baseParams, temHistorico: false }), 'inativo')
assert.equal(determinarSegmento({ ...baseParams, diasDesdeCadastro: 10 }), 'novo_promissor')
assert.equal(determinarSegmento({ ...baseParams, diasDesdeCadastro: 10, scoreGeral: 95 }), 'novo_promissor')
assert.equal(determinarSegmento({ ...baseParams, emRisco: true }), 'em_risco')
assert.equal(determinarSegmento({ ...baseParams, scoreGeral: 90 }), 'campeao')
assert.equal(determinarSegmento({ ...baseParams, lealdade: 80, rfv: 60, scoreGeral: 60 }), 'parceiro_fiel')
assert.equal(determinarSegmento({ ...baseParams, potencial: 75, lealdade: 30, rfv: 30, scoreGeral: 45 }), 'em_ascensao')
assert.equal(determinarSegmento({ ...baseParams, scoreGeral: 40, rfv: 40, potencial: 40, lealdade: 40 }), 'ocasional')
console.log('✓ determinarSegmento passed (7 segmentos e ordem de cascata)')

// 11. Flags
assert.deepEqual(
  determinarFlags({ scoreGeral: 90, potencial: 10, valorPontos: 10, emRisco: false }),
  ['top_indicador']
)
assert.deepEqual(
  determinarFlags({ scoreGeral: 10, potencial: 10, valorPontos: 10, emRisco: true }),
  ['em_risco_de_perda']
)
assert.deepEqual(
  determinarFlags({ scoreGeral: 10, potencial: 80, valorPontos: 10, emRisco: false }),
  ['alto_potencial']
)
assert.deepEqual(
  determinarFlags({ scoreGeral: 10, potencial: 10, valorPontos: 95, emRisco: false }),
  ['indicacao_alto_valor']
)
assert.deepEqual(
  determinarFlags({
    scoreGeral: 10,
    potencial: 10,
    valorPontos: 10,
    emRisco: true,
    temDono: true,
    diasDesdeUltimaInteracao: 45,
  }),
  ['em_risco_de_perda', 'especificador_esfriando']
)
assert.deepEqual(
  determinarFlags({
    scoreGeral: 10,
    potencial: 10,
    valorPontos: 10,
    emRisco: true,
    temDono: true,
    diasDesdeUltimaInteracao: 15,
  }),
  ['em_risco_de_perda']
)
assert.deepEqual(
  determinarFlags({
    scoreGeral: 10,
    potencial: 10,
    valorPontos: 10,
    emRisco: true,
    temDono: false,
    diasDesdeUltimaInteracao: 45,
  }),
  ['em_risco_de_perda']
)
assert.deepEqual(
  determinarFlags({
    scoreGeral: 90,
    potencial: 80,
    valorPontos: 95,
    emRisco: false,
  }),
  ['top_indicador', 'alto_potencial', 'indicacao_alto_valor']
)
console.log('✓ determinarFlags passed (5 flags e coexistência)')

// 12. Concorrência
assert.deepEqual(calcularRiscoConcorrencia([]), { risco: 0.0, nivel: 'baixo' })
assert.deepEqual(calcularRiscoConcorrencia([10, 20]), { risco: 20.0, nivel: 'baixo' })
assert.deepEqual(calcularRiscoConcorrencia([29]), { risco: 29.0, nivel: 'baixo' })
assert.deepEqual(calcularRiscoConcorrencia([30]), { risco: 30.0, nivel: 'medio' })
assert.deepEqual(calcularRiscoConcorrencia([60]), { risco: 60.0, nivel: 'medio' })
assert.deepEqual(calcularRiscoConcorrencia([61]), { risco: 61.0, nivel: 'alto' })
assert.deepEqual(calcularRiscoConcorrencia([10, 80]), { risco: 80.0, nivel: 'alto' })
console.log('✓ calcularRiscoConcorrencia passed')

console.log('\nALL PURE SCORE TESTS PASSED 100%!')
