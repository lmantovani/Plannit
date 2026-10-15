import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  Sparkles,
  Info,
  Shield,
  Layers,
  Users,
  Calendar,
  Compass,
  FileText,
  FolderKanban,
  UserCog,
  Sliders,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'

export type DefinicaoPermissao = {
  codigo: string
  modulo: string
  moduloLabel: string
  nome: string
  descricao: string
}

export type PerfilItem = {
  id?: number
  key: string
  label: string
  descricao?: string | null
  isSistema?: boolean
  isActive?: boolean
  ordem?: number
  isDiretoria: boolean
}

export type ModuloItem = {
  key: string
  label: string
  ordem: number
}

export type PermissaoPerfilMatrix = {
  modulos: ModuloItem[]
  definicoes: DefinicaoPermissao[]
  perfis: PerfilItem[]
  matrix: Record<string, Record<string, boolean>>
}

interface MatrizPermissoesPanelProps {
  config: PermissaoPerfilMatrix
}

const MODULO_ICONS: Record<string, React.ElementType> = {
  crm: Users,
  clientes: Users,
  briefings: FileText,
  fila: Layers,
  projetos: FolderKanban,
  especificadores: Compass,
  agenda: Calendar,
  colaboradores: UserCog,
  configuracoes: Sliders,
}

export default function MatrizPermissoesPanel({ config }: MatrizPermissoesPanelProps) {
  const { modulos, definicoes, perfis, matrix } = config

  const [selectedPerfil, setSelectedPerfil] = useState<string>(() => {
    const primeiroNaoDiretoria = perfis.find((p) => !p.isDiretoria)
    return primeiroNaoDiretoria?.key || perfis[0]?.key || 'gerente_comercial'
  })

  const [search, setSearch] = useState('')
  const [selectedModuloFilter, setSelectedModuloFilter] = useState<string>('todos')
  const [togglingKeys, setTogglingKeys] = useState<Record<string, boolean>>({})

  // Estado local para resposta otimista imediata na UI
  const [localMatrix, setLocalMatrix] = useState<Record<string, Record<string, boolean>>>(matrix)

  // Modais de Criação, Edição e Exclusão de Perfis
  const [modalNovoPerfilOpen, setModalNovoPerfilOpen] = useState(false)
  const [novoPerfilForm, setNovoPerfilForm] = useState({
    nome: '',
    slug: '',
    descricao: '',
    copiarDePerfil: '',
    ordem: 0,
  })
  const [submittingNovoPerfil, setSubmittingNovoPerfil] = useState(false)

  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<PerfilItem | null>(null)
  const [editarPerfilForm, setEditarPerfilForm] = useState({
    nome: '',
    descricao: '',
    ordem: 0,
    isActive: true,
  })
  const [submittingEditarPerfil, setSubmittingEditarPerfil] = useState(false)

  const [perfilParaExcluir, setPerfilParaExcluir] = useState<PerfilItem | null>(null)
  const [submittingExcluir, setSubmittingExcluir] = useState(false)

  // Sincroniza se vier novas props
  React.useEffect(() => {
    if (matrix) {
      setLocalMatrix(matrix)
    }
  }, [matrix])

  const perfilAtual = perfis.find((p) => p.key === selectedPerfil) || perfis[0]
  const isDiretoria = perfilAtual?.isDiretoria

  // Contagem de permissões do perfil selecionado
  const totalPermissoes = definicoes.length
  const ativasPerfil = definicoes.filter((d) =>
    isDiretoria ? true : Boolean(localMatrix[selectedPerfil]?.[d.codigo])
  ).length

  // Filtragem de permissões
  const definicoesFiltradas = definicoes.filter((def) => {
    if (selectedModuloFilter !== 'todos' && def.modulo !== selectedModuloFilter) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchNome = def.nome.toLowerCase().includes(q)
      const matchDesc = def.descricao.toLowerCase().includes(q)
      const matchCod = def.codigo.toLowerCase().includes(q)
      const matchMod = def.moduloLabel.toLowerCase().includes(q)
      return matchNome || matchDesc || matchCod || matchMod
    }
    return true
  })

  // Agrupamento por módulo
  const modulosAgrupados = modulos
    .map((mod) => ({
      ...mod,
      itens: definicoesFiltradas.filter((d) => d.modulo === mod.key),
    }))
    .filter((mod) => mod.itens.length > 0)

  const handleToggle = (permissaoCodigo: string) => {
    if (isDiretoria) {
      toast.info('O perfil Diretoria possui governança integral mestre e não pode ter permissões desativadas.')
      return
    }

    const currentVal = Boolean(localMatrix[selectedPerfil]?.[permissaoCodigo])
    const nextVal = !currentVal
    const toggleId = `${selectedPerfil}:${permissaoCodigo}`

    // Atualização otimista imediata
    setLocalMatrix((prev) => ({
      ...prev,
      [selectedPerfil]: {
        ...(prev[selectedPerfil] || {}),
        [permissaoCodigo]: nextVal,
      },
    }))

    setTogglingKeys((prev) => ({ ...prev, [toggleId]: true }))

    router.patch(
      '/configuracoes/permissoes/toggle',
      {
        perfil: selectedPerfil,
        permissaoCodigo,
        concedido: nextVal,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          const definicao = definicoes.find((d) => d.codigo === permissaoCodigo)
          const nomePerm = definicao ? `"${definicao.nome}"` : permissaoCodigo
          toast.success(
            `Permissão ${nomePerm} ${nextVal ? 'habilitada' : 'desabilitada'} para ${perfilAtual?.label || selectedPerfil}.`
          )
        },
        onError: (errors) => {
          // Reverte em caso de falha
          setLocalMatrix((prev) => ({
            ...prev,
            [selectedPerfil]: {
              ...(prev[selectedPerfil] || {}),
              [permissaoCodigo]: currentVal,
            },
          }))
          const msg =
            typeof errors === 'object' && errors !== null && 'message' in errors
              ? String(errors.message)
              : 'Não foi possível alterar a permissão.'
          toast.error(msg)
        },
        onFinish: () => {
          setTogglingKeys((prev) => {
            const next = { ...prev }
            delete next[toggleId]
            return next
          })
        },
      }
    )
  }

  // Handlers para Perfil (Criar, Editar, Excluir)
  const handleSubmitNovoPerfil = (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoPerfilForm.nome.trim()) {
      toast.error('Informe o nome do perfil.')
      return
    }

    setSubmittingNovoPerfil(true)
    router.post(
      '/configuracoes/perfis',
      novoPerfilForm,
      {
        onSuccess: () => {
          toast.success(`Perfil "${novoPerfilForm.nome}" cadastrado com sucesso!`)
          setModalNovoPerfilOpen(false)
          const genSlug = (novoPerfilForm.slug || novoPerfilForm.nome)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
          setSelectedPerfil(genSlug)
          setNovoPerfilForm({
            nome: '',
            slug: '',
            descricao: '',
            copiarDePerfil: '',
            ordem: 0,
          })
        },
        onError: (errors) => {
          const msg =
            typeof errors === 'object' && errors !== null && 'message' in errors
              ? String(errors.message)
              : 'Erro ao cadastrar perfil.'
          toast.error(msg)
        },
        onFinish: () => setSubmittingNovoPerfil(false),
      }
    )
  }

  const handleOpenEditarPerfil = (perfil: PerfilItem) => {
    setEditingPerfil(perfil)
    setEditarPerfilForm({
      nome: perfil.label,
      descricao: perfil.descricao || '',
      ordem: perfil.ordem ?? 0,
      isActive: perfil.isActive ?? true,
    })
    setModalEditarPerfilOpen(true)
  }

  const handleSubmitEditarPerfil = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPerfil?.id) {
      toast.error('Perfil sem identificador para edição.')
      return
    }

    setSubmittingEditarPerfil(true)
    router.put(
      `/configuracoes/perfis/${editingPerfil.id}`,
      editarPerfilForm,
      {
        onSuccess: () => {
          toast.success(`Perfil atualizado com sucesso!`)
          setModalEditarPerfilOpen(false)
        },
        onError: (errors) => {
          const msg =
            typeof errors === 'object' && errors !== null && 'message' in errors
              ? String(errors.message)
              : 'Erro ao atualizar perfil.'
          toast.error(msg)
        },
        onFinish: () => setSubmittingEditarPerfil(false),
      }
    )
  }

  const handleConfirmarExclusaoPerfil = () => {
    if (!perfilParaExcluir?.id) return
    setSubmittingExcluir(true)
    router.delete(
      `/configuracoes/perfis/${perfilParaExcluir.id}`,
      {
        onSuccess: () => {
          toast.success(`Perfil "${perfilParaExcluir.label}" excluído com sucesso.`)
          setPerfilParaExcluir(null)
          setSelectedPerfil('gerente_comercial')
        },
        onError: (errors) => {
          const msg =
            typeof errors === 'object' && errors !== null && 'message' in errors
              ? String(errors.message)
              : 'Erro ao excluir perfil.'
          toast.error(msg)
        },
        onFinish: () => setSubmittingExcluir(false),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* CABEÇALHO */}
        <div className="px-6 py-5 border-b border-stone-200 bg-linear-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base tracking-tight text-white">
                  Matriz Dinâmica de Permissões por Perfil
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles size={11} />
                  RBAC Ativo
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                Crie novos perfis, ajuste atribuições existentes e controle granularmente o acesso a cada módulo do Plannit.
                As mudanças entram em vigor imediatamente para todos os usuários daquele perfil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/10 text-xs text-stone-200">
            <Info size={15} className="text-amber-400 shrink-0" />
            <span>Diretoria pode delegar permissões a qualquer momento</span>
          </div>
        </div>

        {/* SELETOR DE PERFIS (PILLS / TABS COM BOTÃO DE NOVO PERFIL) */}
        <div className="p-6 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Selecione o Perfil para Configurar:
              </span>
              <span className="text-xs text-stone-400">
                ({perfis.length} perfis operacionais cadastrados)
              </span>
            </div>

            {/* BOTÃO NOVO PERFIL */}
            <button
              type="button"
              onClick={() => setModalNovoPerfilOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Novo Perfil</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {perfis.map((perfil) => {
              const isSelected = perfil.key === selectedPerfil
              const isDir = perfil.isDiretoria
              const ativas = isDir
                ? totalPermissoes
                : definicoes.filter((d) => localMatrix[perfil.key]?.[d.codigo]).length

              return (
                <button
                  key={perfil.key}
                  type="button"
                  onClick={() => setSelectedPerfil(perfil.key)}
                  className={clsx(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border select-none',
                    isSelected
                      ? isDir
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs ring-2 ring-amber-400/30'
                        : 'bg-primary-600 border-primary-600 text-white shadow-xs ring-2 ring-primary-400/30'
                      : isDir
                        ? 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border-amber-200/80'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                  )}
                >
                  {isDir ? (
                    <Shield size={14} className={isSelected ? 'text-white' : 'text-amber-600'} />
                  ) : (
                    <Users size={14} className={isSelected ? 'text-white' : 'text-stone-400'} />
                  )}
                  <span>{perfil.label}</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDir
                          ? 'bg-amber-200/60 text-amber-900'
                          : 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {isDir ? 'Total' : `${ativas}/${totalPermissoes}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* BANNER DO PERFIL SELECIONADO COM BOTÃO DE EDITAR / EXCLUIR */}
        <div className="px-6 py-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                isDiretoria
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-primary-100 text-primary-800 border border-primary-200'
              )}
            >
              {perfilAtual?.label.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-stone-900 text-sm">
                  Configurações do Perfil: {perfilAtual?.label}
                </h4>

                {isDiretoria ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Lock size={10} />
                    Acesso Mestre Incondicional
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={10} />
                    {ativasPerfil} de {totalPermissoes} permissões ativas
                  </span>
                )}

                {/* BOTÕES DE EDITAR E EXCLUIR PERFIL */}
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditarPerfil(perfilAtual)}
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar nome ou detalhes deste perfil"
                  >
                    <Pencil size={14} />
                  </button>

                  {!perfilAtual?.isSistema && !isDiretoria && (
                    <button
                      type="button"
                      onClick={() => setPerfilParaExcluir(perfilAtual)}
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir este perfil customizado"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-500 mt-0.5">
                {perfilAtual?.descricao ||
                  (isDiretoria
                    ? 'A Diretoria possui acesso pleno a todos os módulos e ferramentas para garantir a operação contínua do sistema.'
                    : `Controle quais ações e módulos os usuários cadastrados como "${perfilAtual?.label}" podem acessar.`)}
              </p>
            </div>
          </div>

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Filtrar permissão..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all w-56"
              />
            </div>

            <select
              value={selectedModuloFilter}
              onChange={(e) => setSelectedModuloFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
            >
              <option value="todos">Todos os Módulos</option>
              {modulos.map((mod) => (
                <option key={mod.key} value={mod.key}>
                  {mod.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ALERTA CASO DIRETORIA */}
        {isDiretoria && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Proteção de Governança Ativa:</span>
              Todas as permissões do perfil Diretoria permanecem permanentemente ativas por segurança operacional para evitar bloqueio acidental do administrador.
            </div>
          </div>
        )}

        {/* LISTAGEM DE MÓDULOS E PERMISSÕES */}
        <div className="p-6 space-y-6">
          {modulosAgrupados.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Nenhuma permissão encontrada para a busca.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedModuloFilter('todos')
                }}
                className="mt-2 text-xs text-primary-600 hover:underline font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            modulosAgrupados.map((mod) => {
              const IconeModulo = MODULO_ICONS[mod.key] || Layers
              const totalModulo = mod.itens.length
              const ativasModulo = mod.itens.filter((item) =>
                isDiretoria ? true : Boolean(localMatrix[selectedPerfil]?.[item.codigo])
              ).length

              return (
                <div
                  key={mod.key}
                  className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                >
                  {/* CABEÇALHO DO MÓDULO */}
                  <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs">
                        <IconeModulo size={15} />
                      </div>
                      <span className="font-semibold text-stone-900 text-xs">
                        {mod.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[11px] font-bold',
                          ativasModulo === totalModulo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ativasModulo === 0
                              ? 'bg-stone-100 text-stone-500 border border-stone-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        {ativasModulo} de {totalModulo} ativas
                      </span>
                    </div>
                  </div>

                  {/* ITENS DE PERMISSÃO */}
                  <div className="divide-y divide-stone-100">
                    {mod.itens.map((item) => {
                      const isAtivo = isDiretoria
                        ? true
                        : Boolean(localMatrix[selectedPerfil]?.[item.codigo])
                      const isMestre = item.codigo === 'configuracoes.gerenciar_permissoes'
                      const isToggling = Boolean(togglingKeys[`${selectedPerfil}:${item.codigo}`])

                      return (
                        <div
                          key={item.codigo}
                          className={clsx(
                            'px-5 py-3.5 flex items-start justify-between gap-4 transition-colors',
                            isMestre ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-stone-50/40'
                          )}
                        >
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-stone-900 text-xs">
                                {item.nome}
                              </span>

                              {isMestre && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Sparkles size={10} className="text-amber-600" />
                                  Permissão Mestre (Configura outros perfis)
                                </span>
                              )}

                              <code className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                {item.codigo}
                              </code>
                            </div>

                            <p className="text-xs text-stone-500 leading-relaxed">
                              {item.descricao}
                            </p>
                          </div>

                          {/* TOGGLE SWITCH */}
                          <div className="shrink-0 flex items-center pt-0.5">
                            {isDiretoria ? (
                              <div
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed opacity-80"
                                title="Diretoria possui acesso integral permanente"
                              >
                                <Lock size={12} />
                                <span>Sempre Ativo</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggle(item.codigo)}
                                className={clsx(
                                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary-500/20',
                                  isAtivo ? 'bg-emerald-600' : 'bg-stone-300',
                                  isToggling && 'opacity-60 cursor-wait'
                                )}
                                title={
                                  isAtivo
                                    ? `Clique para desabilitar "${item.nome}" para ${perfilAtual?.label}`
                                    : `Clique para habilitar "${item.nome}" para ${perfilAtual?.label}`
                                }
                              >
                                <span className="sr-only">Alternar permissão</span>
                                <span
                                  className={clsx(
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px]',
                                    isAtivo ? 'translate-x-5 text-emerald-600' : 'translate-x-0 text-stone-400'
                                  )}
                                >
                                  {isAtivo ? <CheckCircle2 size={12} /> : null}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MODAL NOVO PERFIL */}
      {modalNovoPerfilOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                <h3 className="font-semibold text-stone-900 text-sm">
                  Cadastrar Novo Perfil de Usuário
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoPerfilOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNovoPerfil} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nome do Perfil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assistente Comercial, Auxiliar de Projetos..."
                  value={novoPerfilForm.nome}
                  onChange={(e) => setNovoPerfilForm({ ...novoPerfilForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Identificador Único (Slug Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para gerar automaticamente"
                  value={novoPerfilForm.slug}
                  onChange={(e) => setNovoPerfilForm({ ...novoPerfilForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Ex: assistente_comercial (usado internamente pelo sistema).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Descrição das Atribuições
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumo das responsabilidades deste perfil..."
                  value={novoPerfilForm.descricao}
                  onChange={(e) => setNovoPerfilForm({ ...novoPerfilForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Copiar Permissões Iniciais de:
                </label>
                <select
                  value={novoPerfilForm.copiarDePerfil}
                  onChange={(e) => setNovoPerfilForm({ ...novoPerfilForm, copiarDePerfil: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                >
                  <option value="">Nenhum (começar com todas as permissões desabilitadas)</option>
                  {perfis.map((p) => (
                    <option key={p.key} value={p.key}>
                      Copiar do perfil: {p.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400 mt-1">
                  Facilita a configuração ao herdar as permissões de um perfil similar.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalNovoPerfilOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingNovoPerfil}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submittingNovoPerfil ? 'Cadastrando...' : 'Criar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL */}
      {modalEditarPerfilOpen && editingPerfil && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-primary-600" />
                <h3 className="font-semibold text-stone-900 text-sm">
                  Editar Perfil: {editingPerfil.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarPerfilOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditarPerfil} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nome do Perfil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editarPerfilForm.nome}
                  onChange={(e) => setEditarPerfilForm({ ...editarPerfilForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Identificador (Slug)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPerfil.key}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-stone-100 text-stone-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  O identificador interno não pode ser alterado após a criação para manter a integridade dos dados.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Descrição das Atribuições
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumo das responsabilidades deste perfil..."
                  value={editarPerfilForm.descricao}
                  onChange={(e) => setEditarPerfilForm({ ...editarPerfilForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  min={0}
                  value={editarPerfilForm.ordem}
                  onChange={(e) => setEditarPerfilForm({ ...editarPerfilForm, ordem: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {!editingPerfil.isSistema && !editingPerfil.isDiretoria && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editar-perfil-ativo"
                    checked={editarPerfilForm.isActive}
                    onChange={(e) => setEditarPerfilForm({ ...editarPerfilForm, isActive: e.target.checked })}
                    className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="editar-perfil-ativo" className="text-xs font-medium text-stone-700 cursor-pointer">
                    Perfil Ativo no Sistema
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalEditarPerfilOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEditarPerfil}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submittingEditarPerfil ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO DE PERFIL */}
      {perfilParaExcluir && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">
                Excluir Perfil "{perfilParaExcluir.label}"?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Esta ação removerá o perfil e todas as suas configurações de permissão.
                A exclusão só será permitida se não houver usuários cadastrados com este perfil.
              </p>
            </div>

            <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPerfilParaExcluir(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingExcluir}
                onClick={handleConfirmarExclusaoPerfil}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {submittingExcluir ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
