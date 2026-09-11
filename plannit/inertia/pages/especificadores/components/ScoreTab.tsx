import React from 'react'
import {
  Award,
  Shield,
  Zap,
  Activity,
  BarChart3,
} from 'lucide-react'
import clsx from 'clsx'
import type { ArquitetoScore } from '../types'
import { ScoreBar } from './ScoreBar'
import {
  SEGMENTO_CONFIG,
  FLAG_CONFIG,
  RISCO_CONCORRENCIA_CONFIG,
} from '../../../lib/constants'

interface ScoreTabProps {
  score: ArquitetoScore | null
  nomeEspecificador?: string
}

export const ScoreTab: React.FC<ScoreTabProps> = ({ score, nomeEspecificador }) => {
  if (!score) {
    return (
      <div className="text-center py-12 text-stone-400 text-xs">
        <Activity size={28} className="mx-auto mb-2 opacity-40 animate-pulse" />
        Carregando dados analíticos do especificador...
      </div>
    )
  }

  const segmentoCfg = SEGMENTO_CONFIG[score.segmento] || {
    label: score.segmento,
    desc: 'Segmento comportamental',
    color: 'stone',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
  }

  const riscoCfg = RISCO_CONCORRENCIA_CONFIG[score.concorrencia.nivel] || {
    label: score.concorrencia.nivel,
    color: 'stone',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Placar Principal do Score e Segmento */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-stone-700">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
                Score Analítico Multidimensional
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-mono font-semibold bg-stone-700/80 text-primary-300 border border-stone-600">
                Backend Realtime
              </span>
            </div>
            <h3 className="text-lg font-display font-semibold text-stone-100">
              {nomeEspecificador ? `Classificação de ${nomeEspecificador}` : 'Classificação Geral'}
            </h3>
            <p className="text-xs text-stone-300 max-w-sm leading-relaxed">
              {segmentoCfg.desc}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm border',
                  segmentoCfg.bg,
                  segmentoCfg.text,
                  segmentoCfg.border
                )}
              >
                <Award size={13} />
                Segmento: {segmentoCfg.label}
              </span>
            </div>
          </div>

          {/* Círculo do Score Geral */}
          <div className="flex flex-col items-center justify-center bg-stone-800/80 border border-stone-700/90 rounded-2xl p-4 min-w-[130px] shadow-inner text-center">
            <span className="text-4xl font-display font-bold text-primary-400 tracking-tight">
              {score.scoreGeral.toFixed(0)}
            </span>
            <span className="text-3xs uppercase tracking-widest text-stone-400 font-semibold mt-0.5">
              Score Geral
            </span>
            <span className="text-3xs text-stone-500 font-mono mt-0.5">Escala 0 a 100</span>
          </div>
        </div>
      </div>

      {/* 2. Flags de Risco e Oportunidade */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Flags de Risco e Oportunidade ({score.flags.length})
            </h4>
          </div>
          <span className="text-2xs text-stone-400">Ativação sob demanda</span>
        </div>

        {score.flags.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-1">
            Nenhum gatilho de risco ou oportunidade especial disparado para este perfil.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {score.flags.map((flag) => {
              const cfg = FLAG_CONFIG[flag] || {
                label: flag,
                desc: 'Alerta comportamental',
                color: 'stone',
                bg: 'bg-stone-100',
                text: 'text-stone-700',
                border: 'border-stone-200',
              }
              return (
                <div
                  key={flag}
                  title={cfg.desc}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-2xs',
                    cfg.bg,
                    cfg.text,
                    cfg.border
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span className="font-semibold">{cfg.label}</span>
                  <span className="text-2xs opacity-75 hidden sm:inline">({cfg.desc})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Barras Comparativas dos 3 Pilares */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Dimensões da Pontuação (Pilares)
            </h4>
          </div>
          <span className="text-2xs text-stone-400 font-mono">Média Ponderada = {score.scoreGeral.toFixed(1)}</span>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <ScoreBar
              score={score.rfv}
              label="RFV (Recência, Frequência e Valor Contratual)"
              variant="purple"
            />
            <p className="text-2xs text-stone-400 mt-1">
              Avalia o histórico transacional de projetos fechados nos últimos 12 meses.
            </p>
          </div>

          <div>
            <ScoreBar
              score={score.potencial}
              label="Potencial Futuro (Pipeline e Funil)"
              variant="blue"
            />
            <p className="text-2xs text-stone-400 mt-1">
              Calcula o volume de leads qualificados em aberto e projetos em execução 3D.
            </p>
          </div>

          <div>
            <ScoreBar
              score={score.lealdade}
              label="Lealdade & Consistência de Parceria"
              variant="emerald"
            />
            <p className="text-2xs text-stone-400 mt-1">
              Mede tempo de relacionamento, consistência mês a mês e taxa de conversão de indicações.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Breakdown Detalhado dos Indicadores */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Estatísticas & Variáveis de Entrada
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Projetos (12m)
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.projetos12Meses}
            </span>
            <span className="text-3xs text-stone-500">
              Freq: {score.detalhes.frequencia} pts
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Valor Contratual (12m)
            </span>
            <span className="text-base font-bold font-mono text-stone-800 mt-0.5 block truncate">
              R$ {score.detalhes.somaValorContratos12Meses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-3xs text-stone-500">
              Valor: {score.detalhes.valor} pts
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Recência (Último Projeto)
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.diasDesdeUltimoProjeto !== null
                ? `${score.detalhes.diasDesdeUltimoProjeto}d`
                : '—'}
            </span>
            <span className="text-3xs text-stone-500">
              Recência: {score.detalhes.recencia} pts
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Tempo de Parceria
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.mesesDesdeCadastro} meses
            </span>
            <span className="text-3xs text-stone-500">
              Tempo: {score.detalhes.tempoParceria} pts
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Pipeline Ativo
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.leadsAtivos + score.detalhes.projetosAtivos}
            </span>
            <span className="text-3xs text-stone-500">
              {score.detalhes.leadsAtivos} leads · {score.detalhes.projetosAtivos} proj
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Consistência Anual
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.consistencia.toFixed(0)}%
            </span>
            <span className="text-3xs text-stone-500">Meses com indicação</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Conversão de Leads
            </span>
            <span className="text-lg font-bold font-mono text-stone-800 mt-0.5 block">
              {score.detalhes.taxaConversao.toFixed(1)}%
            </span>
            <span className="text-3xs text-stone-500">Fechados vs Perdidos</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-400 text-2xs uppercase block font-semibold">
              Origem do Cálculo
            </span>
            <span className="text-xs font-semibold text-emerald-700 mt-1 block">
              ✓ 100% Determinístico
            </span>
            <span className="text-3xs text-stone-400">arquiteto_score_service</span>
          </div>
        </div>
      </div>

      {/* 5. Análise de Risco de Concorrência */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-rose-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Pressão Competitiva & Concorrência
            </h4>
          </div>
          <span
            className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              riscoCfg.bg,
              riscoCfg.text,
              riscoCfg.border
            )}
          >
            {riscoCfg.label} ({score.concorrencia.risco.toFixed(0)}%)
          </span>
        </div>

        {score.concorrencia.concorrentes.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-1">
            Nenhum concorrente mapeado para este escritório. A concorrência é monitorada na aba
            &ldquo;Decisores & Concorrentes&rdquo;.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-stone-600">
              Marcas competidoras com estimativa de fechamento pelo escritório:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {score.concorrencia.concorrentes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-xs"
                >
                  <span className="font-medium text-stone-800">{c.nomeConcorrente}</span>
                  <span
                    className={clsx(
                      'font-mono font-bold text-2xs px-2 py-0.5 rounded border',
                      c.percentualFechamentoEstimado >= 60
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : c.percentualFechamentoEstimado >= 30
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    )}
                  >
                    {c.percentualFechamentoEstimado.toFixed(0)}% de fechamento
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScoreTab
