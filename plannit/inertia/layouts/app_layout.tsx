import React, { useState, useEffect } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  Building2,
  Hammer,
  UserCog,
  UserCheck,
  Compass,
  FolderKanban,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

import clsx from 'clsx'
import { toast, Toaster } from 'sonner'

interface UserProps {
  id: number
  nome: string
  email: string
  telefone: string | null
  perfil: string
  perfilLabel: string
  isActive: boolean
  isSuperuser: boolean
  initials: string
}

interface SharedProps extends Record<string, unknown> {
  user: UserProps
  flash?: {
    success?: string
    error?: string
    info?: string
  }
}

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  badge?: string
  disabled?: boolean
  external?: boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, flash } = usePage<SharedProps>().props
  const { url } = usePage()

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('plannit_sidebar')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('plannit_sidebar', String(next))
    }
  }

  const handleLogout = () => {
    router.post('/logout')
  }

  // Monitora flash messages do AdonisJS
  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error)
    }
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.info) {
      toast.info(flash.info)
    }
  }, [flash])

  const navigation: NavGroup[] = [
    {
      section: 'Principal',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      section: 'Comercial',
      items: [
        { label: 'CRM / Leads', href: '/crm', icon: Users },
        { label: 'Clientes', href: '/clientes', icon: UserCheck },
        { label: 'Briefings', href: '/briefings', icon: FileText, badge: 'RN002' },
        { label: 'Fila de Projetos', href: '/fila', icon: Layers, badge: 'RN003' },
        { label: 'Projetos & Render', href: '/projetos', icon: FolderKanban, badge: 'RN004/005' },
        { label: 'Especificadores', href: '/especificadores', icon: Compass },
      ],
    },

    {
      section: 'Operacional',
      items: [
        { label: 'Conferência', href: '#', icon: Building2, disabled: true },
        { label: 'Montagem', href: '#', icon: Hammer, disabled: true },
      ],
    },
    {
      section: 'Gestão',
      items: [
        { label: 'Colaboradores', href: '/colaboradores', icon: UserCog, badge: 'RH-RN009' },
      ],
    },
    {
      section: 'Suporte',
      items: [
        {
          label: 'Manual do Usuário',
          href: '/manual/index.html',
          icon: BookOpen,
          external: true,
          badge: 'Docs',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col antialiased">
      <Toaster position="top-right" richColors />

      {/* Sidebar Desktop */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full bg-stone-900 border-r border-stone-800 flex-col justify-between transition-all duration-300 z-40 hidden md:flex',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        {/* Topo do Sidebar / Logo */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800/80">
            {sidebarOpen ? (
              <div className="flex flex-col">
                <span className="font-display text-white font-semibold text-base tracking-tight leading-tight">
                  Líder
                </span>
                <span className="text-[10px] font-semibold text-primary-400 tracking-[0.2em] uppercase mt-0.5">
                  Móveis Planejados
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-display font-bold text-sm">
                L
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 flex items-center justify-center rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Links de Navegação */}
          <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navigation.map((group) => (
              <div key={group.section} className="space-y-1">
                {sidebarOpen && (
                  <p className="px-2.5 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {group.section}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.exact ? url === item.href : url.startsWith(item.href) && item.href !== '#'

                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className={clsx(
                          'flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium text-stone-600 cursor-not-allowed select-none',
                          !sidebarOpen && 'justify-center'
                        )}
                        title={`${item.label} (Em breve)`}
                      >
                        <Icon size={16} className="text-stone-700 flex-shrink-0" />
                        {sidebarOpen && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={clsx(
                          'flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group relative',
                          'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30 border border-transparent hover:border-amber-500/30',
                          !sidebarOpen && 'justify-center'
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon
                          size={16}
                          className="flex-shrink-0 text-amber-400 group-hover:scale-110 transition-transform"
                        />
                        {sidebarOpen && (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-amber-200">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </a>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group relative',
                        isActive
                          ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60',
                        !sidebarOpen && 'justify-center'
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon
                        size={16}
                        className={clsx(
                          'flex-shrink-0 transition-colors',
                          isActive ? 'text-primary-400' : 'text-stone-400 group-hover:text-stone-200'
                        )}
                      />
                      {sidebarOpen && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] bg-primary-500/20 text-primary-300 font-semibold px-1.5 py-0.5 rounded border border-primary-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé do Sidebar / Usuário */}
        <div className="border-t border-stone-800/80 p-3">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-900/60 text-primary-300 border border-primary-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {user?.initials || 'LM'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-stone-200 truncate">{user?.nome}</span>
                  <span className="text-[10px] text-primary-400 font-semibold truncate">
                    {user?.perfilLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-md transition-colors"
                title="Sair"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-md transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Conteúdo com offset para sidebar */}
      <div
        className={clsx(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarOpen ? 'md:ml-60' : 'md:ml-16'
        )}
      >
        {/* Header Superior */}
        <header className="bg-white border-b border-stone-200/80 px-6 py-3.5 sticky top-0 z-30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg md:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-display font-semibold text-lg text-stone-900 leading-tight">
                {title || 'Plataforma Plannit'}
              </h1>
              {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/manual/index.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100/80 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
              title="Abrir Manual Interativo do Sistema em nova aba"
            >
              <BookOpen size={14} className="text-amber-800" />
              <span className="hidden sm:inline">Manual do Sistema</span>
            </a>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-50 border border-stone-200/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-stone-700">{user?.perfilLabel}</span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">{user?.nome}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm text-stone-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
              title="Sair do sistema"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline text-xs">Sair</span>
            </button>
          </div>
        </header>

        {/* Corpo da Página */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col">{children}</main>
      </div>
    </div>
  )
}
