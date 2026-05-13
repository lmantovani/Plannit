import { Bell, Search, AlertTriangle } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store'
import clsx from 'clsx'

export default function Header({ title, subtitle }) {
  const { sidebarOpen, notifications } = useUIStore()
  const { user } = useAuthStore()

  const unread = notifications.filter(n => !n.lida).length

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 h-14 bg-white border-b border-stone-200 flex items-center px-5 gap-4 z-30 transition-all duration-300',
        sidebarOpen ? 'left-60' : 'left-14'
      )}
    >
      {/* Título */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-stone-800 font-semibold text-base leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-stone-400 text-xs truncate">{subtitle}</p>
        )}
      </div>

      {/* Busca global */}
      <div className="hidden md:flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 w-56">
        <Search size={13} className="text-stone-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente, projeto..."
          className="bg-transparent text-sm text-stone-600 placeholder:text-stone-400 outline-none w-full"
        />
      </div>

      {/* Notificações */}
      <button className="relative btn-icon">
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-2xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
        {user?.nome?.charAt(0) || 'U'}
      </div>
    </header>
  )
}
