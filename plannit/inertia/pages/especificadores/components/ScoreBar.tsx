import React from 'react'
import clsx from 'clsx'

interface ScoreBarProps {
  score: number
  label?: string
  min?: number
  showMinimo?: boolean
  variant?: 'primary' | 'purple' | 'emerald' | 'amber' | 'blue'
  className?: string
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  label,
  min = 70,
  showMinimo = false,
  variant = 'primary',
  className,
}) => {
  const safeScore = Number.isFinite(score) ? score : 0
  const pct = Math.min(100, Math.max(0, safeScore))
  const ok = safeScore >= min

  const variantGradients: Record<string, string> = {
    primary: 'bg-gradient-to-r from-amber-500 to-primary-600',
    purple: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    emerald: 'bg-gradient-to-r from-teal-500 to-emerald-600',
    amber: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    blue: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  }

  const textColors: Record<string, string> = {
    primary: 'text-primary-700',
    purple: 'text-purple-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
  }

  const barColor = showMinimo
    ? ok
      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
      : 'bg-gradient-to-r from-amber-400 to-rose-500'
    : variantGradients[variant] || variantGradients.primary

  const textColor = showMinimo
    ? ok
      ? 'text-emerald-700'
      : 'text-rose-600'
    : textColors[variant] || textColors.primary

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-stone-600">{label}</span>
          <span className={clsx('font-semibold font-mono text-xs', textColor)}>
            {safeScore.toFixed(0)}/100
          </span>
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/60 shadow-inner">
          <div
            className={clsx('h-full rounded-full transition-all duration-500 shadow-sm', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!label && (
          <span className={clsx('text-xs font-semibold font-mono min-w-[2.5rem] text-right', textColor)}>
            {safeScore.toFixed(0)}/100
          </span>
        )}
      </div>
      {showMinimo && safeScore < min && (
        <p className="text-2xs text-rose-600 font-medium">Meta mínima: {min} pontos</p>
      )}
    </div>
  )
}

export default ScoreBar
