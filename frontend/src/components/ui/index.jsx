import { X, Loader2, Inbox } from 'lucide-react'
import { getStatusBadge } from '../../lib/constants'
import clsx from 'clsx'

// === Status Badge ===
export function StatusBadge({ status, className }) {
  const { label, classes } = getStatusBadge(status)
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', classes, className)}>
      {label}
    </span>
  )
}

// === Spinner ===
export function Spinner({ size = 16, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-primary-500', className)} />
}

// === Loading full page ===
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  )
}

// === Empty State ===
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Icon size={22} className="text-stone-400" />
      </div>
      <h3 className="font-medium text-stone-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// === Modal ===
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-elevated w-full animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-display font-semibold text-stone-800 text-base">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// === Confirm Dialog ===
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-stone-600 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
        <button className={clsx(danger ? 'btn-danger' : 'btn-primary', 'btn-sm')} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// === Card ===
export function Card({ children, className, onClick }) {
  return (
    <div
      className={clsx('card p-4', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// === KPI Card ===
export function KpiCard({ label, value, delta, deltaType, icon: Icon, color = 'primary', onClick }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    blue:    'bg-blue-50 text-blue-600',
    green:   'bg-green-50 text-green-600',
    red:     'bg-red-50 text-red-600',
    amber:   'bg-amber-50 text-amber-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className={clsx('kpi-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow')} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
            <Icon size={17} />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <p className={deltaType === 'up' ? 'kpi-delta-up' : 'kpi-delta-down'}>
          {deltaType === 'up' ? '↑' : '↓'} {delta}
        </p>
      )}
    </div>
  )
}

// === Alert Banner ===
export function AlertBanner({ type = 'warning', message, onDismiss }) {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-lg border text-sm', styles[type])}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// === Tab Group ===
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            active === tab.key
              ? 'bg-white shadow-card text-stone-800'
              : 'text-stone-500 hover:text-stone-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx('ml-1.5 text-xs', active === tab.key ? 'text-primary-600' : 'text-stone-400')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// === Score Bar ===
export function ScoreBar({ score, min = 70, label, showMinimo = true }) {
  const pct = Math.min(100, Math.max(0, score))
  const ok = score >= min
  return (
    <div>
      {label && <p className="text-xs text-stone-500 mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', ok ? 'bg-green-500' : 'bg-amber-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={clsx('text-xs font-semibold min-w-[2.5rem] text-right', ok ? 'text-green-600' : 'text-amber-600')}>
          {score.toFixed(0)}/100
        </span>
      </div>
      {showMinimo && score < min && (
        <p className="text-xs text-amber-600 mt-0.5">Mínimo: {min} pontos</p>
      )}
    </div>
  )
}
