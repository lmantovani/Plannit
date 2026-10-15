import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react'
import clsx from 'clsx'
import { DateTime } from 'luxon'

export interface UsuarioSistemaItem {
  id: number
  nome: string
  email: string
  telefone: string | null
  perfil: string
  perfilLabel: string
  isActive: boolean
  isSuperuser: boolean
  ultimoLogin: string | null
  createdAt: string | null
}

export interface PerfilCatalogoItem {
  id: number
  slug: string
  nome: string
  isActive: boolean
}

interface UsuariosSistemaPanelProps {
  usuarios: UsuarioSistemaItem[]
  perfisCatalogo: PerfilCatalogoItem[]
}

export default function UsuariosSistemaPanel({
  usuarios = [],
  perfisCatalogo = [],
}: UsuariosSistemaPanelProps) {
  const [busca, setBusca] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')

  // Métricas
  const totalUsuarios = usuarios.length
  const totalAtivos = usuarios.filter((u) => u.isActive).length
  const totalInativos = totalUsuarios - totalAtivos
  const totalDiretoria = usuarios.filter(
    (u) => u.perfil === 'diretoria' || u.isSuperuser
  ).length

  // Filtragem
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de texto (nome ou e-mail)
      const termo = busca.toLowerCase().trim()
      const matchTexto =
        !termo ||
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        (u.telefone && u.telefone.includes(termo))

      // Filtro de perfil
      const matchPerfil =
        filtroPerfil === 'todos' || u.perfil === filtroPerfil

      // Filtro de status
      const matchStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'ativos' && u.isActive) ||
        (filtroStatus === 'inativos' && !u.isActive)

      return matchTexto && matchPerfil && matchStatus
    })
  }, [usuarios, busca, filtroPerfil, filtroStatus])

  const formatarData = (isoStr: string | null) => {
    if (!isoStr) return null
    try {
      return DateTime.fromISO(isoStr).setLocale('pt-BR').toFormat('dd/MM/yyyy HH:mm')
    } catch {
      return isoStr
    }
  }

  const getIniciais = (nome: string) => {
    const partes = nome.trim().split(/\s+/)
    if (partes.length >= 2) {
      return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase()
    }
    return (nome.slice(0, 2) || 'US').toUpperCase()
  }

  // Estilização de badge conforme o perfil
  const getBadgePerfil = (perfil: string, isSuperuser: boolean) => {
    if (isSuperuser || perfil === 'diretoria') {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    if (perfil === 'gerente_comercial') {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (perfil === 'vendedor') {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (perfil === 'projetista') {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
    if (perfil === 'conferente') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
    if (perfil === 'rh') {
      return 'bg-rose-100 text-rose-800 border-rose-200'
    }
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  return (
    <div className="space-y-6">
      {/* Banner de Apresentação */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-primary-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Users size={14} className="text-primary-300" />
              <span>Controle de Acessos & Logins</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Usuários do Sistema Plannit
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl mt-1">
              Visualização de todos os colaboradores e contas que possuem acesso de login à plataforma. Cada usuário herda automaticamente as regras e capacidades configuradas na Matriz de Permissões do seu perfil.
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total de Usuários</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{totalUsuarios}</span>
            <span className="text-[11px] text-stone-400">cadastrados</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Contas Ativas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{totalAtivos}</span>
            <span className="text-[11px] text-emerald-600/80">com acesso liberado</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Contas Inativas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-700">{totalInativos}</span>
            <span className="text-[11px] text-stone-400">bloqueadas</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Diretoria & Admins</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Shield size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">{totalDiretoria}</span>
            <span className="text-[11px] text-purple-600/80">acesso integral</span>
          </div>
        </div>
      </div>

      {/* Controles de Filtro e Busca */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Filtro Perfil */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={14} className="text-stone-400" />
            <select
              value={filtroPerfil}
              onChange={(e) => setFiltroPerfil(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
            >
              <option value="todos">Todos os Perfis ({usuarios.length})</option>
              {perfisCatalogo.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer shrink-0"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativos">Apenas Ativos ({totalAtivos})</option>
            <option value="inativos">Apenas Inativos ({totalInativos})</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">
              Listagem de Usuários & Perfis Atribuídos
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Exibindo {usuariosFiltrados.length} de {totalUsuarios} usuários cadastrados
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6">Usuário / Colaborador</th>
                <th className="py-3.5 px-6">Contato</th>
                <th className="py-3.5 px-6">Perfil Atribuído</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6">Último Acesso</th>
                <th className="py-3.5 px-6">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Users size={32} className="mx-auto mb-2 text-stone-300" />
                    <p className="text-sm font-semibold text-stone-600">
                      Nenhum usuário encontrado
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Tente ajustar os filtros ou o termo de busca.
                    </p>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => {
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Nome e Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {getIniciais(user.nome)}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              <span>{user.nome}</span>
                              {user.isSuperuser && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800"
                                  title="Superusuário com privilégios irrestritos"
                                >
                                  <Shield size={10} />
                                  Superuser
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 font-mono">
                              ID: #{user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Mail size={13} className="text-stone-400 shrink-0" />
                            <span className="font-mono text-[11px]">{user.email}</span>
                          </div>
                          {user.telefone && (
                            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                              <Phone size={12} className="text-stone-400 shrink-0" />
                              <span>{user.telefone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Perfil */}
                      <td className="py-4 px-6">
                        <div
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-2xs',
                            getBadgePerfil(user.perfil, user.isSuperuser)
                          )}
                        >
                          <Shield size={13} />
                          <span>{user.perfilLabel}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 size={12} />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>

                      {/* Último Login */}
                      <td className="py-4 px-6">
                        {user.ultimoLogin ? (
                          <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                            <Clock size={12} className="text-stone-400" />
                            <span>{formatarData(user.ultimoLogin)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">
                            Nunca acessou
                          </span>
                        )}
                      </td>

                      {/* Criado em */}
                      <td className="py-4 px-6 text-stone-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-stone-400" />
                          <span>{formatarData(user.createdAt) || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
