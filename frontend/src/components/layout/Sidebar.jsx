import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Layers, DollarSign,
  Truck, Hammer, HeadphonesIcon, BarChart2, Settings, LogOut,
  ChevronLeft, Building2
} from 'lucide-react'
import { useAuthStore, useUIStore, PERFIL_LABELS } from '../../store'
import clsx from 'clsx'

const NAV = [
  { section: 'Principal' },
  { path: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard, perfis: ['*'] },
  { section: 'Comercial' },
  { path: '/crm',        label: 'CRM / Leads',   icon: Users,           perfis: ['*'] },
  { path: '/briefing',   label: 'Briefings',     icon: FileText,        perfis: ['diretoria','gerente_comercial','vendedor','projetista'] },
  { path: '/projetos',   label: 'Projetos',      icon: Layers,          perfis: ['diretoria','gerente_comercial','projetista','vendedor'] },
  { section: 'Operacional' },
  { path: '/conferencia',label: 'Conferência',   icon: Building2,       perfis: ['diretoria','gerente_comercial','conferente'] },
  { path: '/logistica',  label: 'Logística',     icon: Truck,           perfis: ['diretoria','gerente_comercial','gestor_logistica'] },
  { path: '/montagem',   label: 'Montagem',      icon: Hammer,          perfis: ['diretoria','gerente_comercial','supervisor_montagem'] },
  { section: 'Financeiro & Pós' },
  { path: '/financeiro', label: 'Financeiro',    icon: DollarSign,      perfis: ['diretoria','gerente_comercial','financeiro'] },
  { path: '/pos-venda',  label: 'Pós-Venda / AT', icon: HeadphonesIcon, perfis: ['diretoria','gerente_comercial','sac'] },
  { section: 'Gestão' },
  { path: '/relatorios', label: 'Relatórios',    icon: BarChart2,       perfis: ['diretoria','gerente_comercial'] },
  { path: '/configuracoes',label: 'Configurações', icon: Settings,      perfis: ['diretoria'] },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const perfil = user?.perfil || ''
  const visibleNav = NAV.filter(item =>
    item.section || item.perfis?.includes('*') || item.perfis?.includes(perfil)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full bg-stone-900 flex flex-col transition-all duration-300 z-40',
      sidebarOpen ? 'w-60' : 'w-14'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-stone-700/50">
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="font-display text-white font-semibold text-base leading-tight">Líder</span>
            <span className="text-primary-400 text-xs font-medium tracking-widest uppercase">Móveis</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
        >
          <ChevronLeft size={15} className={clsx('transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {visibleNav.map((item, i) => {
          if (item.section) {
            return sidebarOpen ? (
              <div key={i} className="px-2 pt-4 pb-1 text-2xs font-semibold uppercase tracking-widest text-stone-500">
                {item.section}
              </div>
            ) : <div key={i} className="h-3" />
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors group',
                isActive
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-stone-700/50 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-200 text-xs font-medium truncate">{user?.nome}</p>
              <p className="text-stone-500 text-2xs truncate">{PERFIL_LABELS[perfil] || perfil}</p>
            </div>
            <button onClick={handleLogout} className="text-stone-500 hover:text-stone-300 transition-colors" title="Sair">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center text-stone-500 hover:text-stone-300 py-1 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
