import React, { useState, useMemo } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  Layers,
  Compass,
  Megaphone,
  Calendar,
  Plus,
  Trash2,
  X,
  Power,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  Users,
  BookOpen,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import MatrizPermissoesPanel, { type PermissaoPerfilMatrix } from './components/MatrizPermissoesPanel'
import UsuariosSistemaPanel, {
  type UsuarioSistemaItem,
  type PerfilCatalogoItem,
} from './components/UsuariosSistemaPanel'
import RoteirosBriefingPanel from './components/RoteirosBriefingPanel'
import type { RoteiroBriefingItem } from './components/ModalRoteiroBriefing'

export const CORES_PALETA_TIPOS = [
  '#3B82F6', // Azul (Briefing)
  '#10B981', // Verde Esmeralda (Medição)
  '#8B5CF6', // Roxo (Apresentação 3D)
  '#F59E0B', // Âmbar (Obra)
  '#EC4899', // Rosa (Reunião Loja)
  '#6366F1', // Índigo (Especificador)
  '#06B6D4', // Ciano
  '#EF4444', // Vermelho
  '#C8841A', // Ouro Líder
  '#6B7280', // Cinza (Outro)
]

export type AmbienteItem = {
  id: number
  nome: string
  categoria: string
  ordem: number
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type OrigemItem = {
  id: number
  nome: string
  slug: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type CampanhaItem = {
  id: number
  nome: string
  dataInicio: string | null
  dataFim: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type TipoCompromissoItem = {
  id: number
  nome: string
  slug: string
  cor: string
  ordem: number
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface ConfiguracoesPageProps {
  ambientes: AmbienteItem[]
  origens: OrigemItem[]
  campanhas: CampanhaItem[]
  tiposCompromisso?: TipoCompromissoItem[]
  roteiros?: RoteiroBriefingItem[]
  podeGerenciarPermissoes?: boolean
  permissoesConfig?: PermissaoPerfilMatrix | null
  usuarios?: UsuarioSistemaItem[]
  perfisCatalogo?: PerfilCatalogoItem[]
}

type TabKey =
  | 'ambientes'
  | 'origens'
  | 'campanhas'
  | 'tipos_compromisso'
  | 'roteiros'
  | 'permissoes'
  | 'usuarios'

export type DeleteTarget = {
  type: 'ambiente' | 'origem' | 'campanha' | 'tipo_compromisso'
  id: number
  nome: string
}

export default function ConfiguracoesPage({
  ambientes = [],
  origens = [],
  campanhas = [],
  tiposCompromisso = [],
  roteiros = [],
  podeGerenciarPermissoes = false,
  permissoesConfig = null,
  usuarios = [],
  perfisCatalogo = [],
}: ConfiguracoesPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (
        tab === 'ambientes' ||
        tab === 'origens' ||
        tab === 'campanhas' ||
        tab === 'tipos_compromisso' ||
        tab === 'roteiros' ||
        tab === 'permissoes' ||
        tab === 'usuarios'
      ) {
        return tab
      }
    }
    return 'ambientes'
  })

  // Mapeia ambiente para o título do roteiro que o atende
  const roteiroPorAmbienteNome = useMemo(() => {
    const map = new Map<string, { id: number; titulo: string }>()
    for (const r of roteiros) {
      if (Array.isArray(r.ambientes)) {
        for (const amb of r.ambientes) {
          map.set(amb.toLowerCase().trim(), { id: r.id, titulo: r.titulo })
        }
      }
    }
    return map
  }, [roteiros])

  // Modais de Criação
  const [modalAmbienteOpen, setModalAmbienteOpen] = useState(false)
  const [modalOrigemOpen, setModalOrigemOpen] = useState(false)
  const [modalCampanhaOpen, setModalCampanhaOpen] = useState(false)
  const [modalTipoCompromissoOpen, setModalTipoCompromissoOpen] = useState(false)

  // Modais de Edição
  const [editingAmbiente, setEditingAmbiente] = useState<AmbienteItem | null>(null)
  const [editingOrigem, setEditingOrigem] = useState<OrigemItem | null>(null)
  const [editingCampanha, setEditingCampanha] = useState<CampanhaItem | null>(null)
  const [editingTipoCompromisso, setEditingTipoCompromisso] = useState<TipoCompromissoItem | null>(null)

  // Forms de Criação
  const ambienteForm = useForm({
    nome: '',
    categoria: 'Área Social',
    ordem: 0,
    isActive: true,
  })

  const origemForm = useForm({
    nome: '',
    slug: '',
    isActive: true,
  })

  const campanhaForm = useForm({
    nome: '',
    dataInicio: '',
    dataFim: '',
    isActive: true,
  })

  const tipoCompromissoForm = useForm({
    nome: '',
    slug: '',
    cor: '#3B82F6',
    ordem: 0,
    isActive: true,
  })

  // Forms de Edição
  const ambienteEditForm = useForm({
    nome: '',
    categoria: 'Área Social',
    ordem: 0,
    isActive: true,
  })

  const origemEditForm = useForm({
    nome: '',
    slug: '',
    isActive: true,
  })

  const campanhaEditForm = useForm({
    nome: '',
    dataInicio: '',
    dataFim: '',
    isActive: true,
  })

  const tipoCompromissoEditForm = useForm({
    nome: '',
    slug: '',
    cor: '#3B82F6',
    ordem: 0,
    isActive: true,
  })

  const handleOpenEditAmbiente = (item: AmbienteItem) => {
    setEditingAmbiente(item)
    ambienteEditForm.setData({
      nome: item.nome,
      categoria: item.categoria || 'Área Social',
      ordem: item.ordem,
      isActive: item.isActive,
    })
  }

  const handleOpenEditOrigem = (item: OrigemItem) => {
    setEditingOrigem(item)
    origemEditForm.setData({
      nome: item.nome,
      slug: item.slug,
      isActive: item.isActive,
    })
  }

  const handleOpenEditCampanha = (item: CampanhaItem) => {
    setEditingCampanha(item)
    campanhaEditForm.setData({
      nome: item.nome,
      dataInicio: item.dataInicio || '',
      dataFim: item.dataFim || '',
      isActive: item.isActive,
    })
  }

  const handleOpenEditTipoCompromisso = (item: TipoCompromissoItem) => {
    setEditingTipoCompromisso(item)
    tipoCompromissoEditForm.setData({
      nome: item.nome,
      slug: item.slug,
      cor: item.cor || '#3B82F6',
      ordem: item.ordem,
      isActive: item.isActive,
    })
  }

  const notifyCatalogoUpdate = (catalogo?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'plannit_catalogo_updated',
        catalogo ? `${catalogo}:${Date.now()}` : String(Date.now())
      )
    }
  }

  const handleUpdateAmbiente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAmbiente) return
    ambienteEditForm.put(`/configuracoes/ambientes/${editingAmbiente.id}`, {
      onSuccess: () => {
        toast.success(`Ambiente "${ambienteEditForm.data.nome}" atualizado com sucesso!`)
        notifyCatalogoUpdate()
        setEditingAmbiente(null)
      },
      onError: () => toast.error('Erro ao atualizar ambiente.'),
    })
  }

  const handleUpdateOrigem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrigem) return
    origemEditForm.put(`/configuracoes/origens/${editingOrigem.id}`, {
      onSuccess: () => {
        toast.success(`Origem "${origemEditForm.data.nome}" atualizada com sucesso!`)
        notifyCatalogoUpdate()
        setEditingOrigem(null)
      },
      onError: () => toast.error('Erro ao atualizar origem.'),
    })
  }

  const handleUpdateCampanha = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampanha) return
    campanhaEditForm.put(`/configuracoes/campanhas/${editingCampanha.id}`, {
      onSuccess: () => {
        toast.success(`Campanha "${campanhaEditForm.data.nome}" atualizada com sucesso!`)
        notifyCatalogoUpdate()
        setEditingCampanha(null)
      },
      onError: () => toast.error('Erro ao atualizar campanha.'),
    })
  }

  const handleUpdateTipoCompromisso = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTipoCompromisso) return
    tipoCompromissoEditForm.put(`/configuracoes/tipos-compromisso/${editingTipoCompromisso.id}`, {
      onSuccess: () => {
        toast.success(`Tipo de compromisso "${tipoCompromissoEditForm.data.nome}" atualizado com sucesso!`)
        notifyCatalogoUpdate('tipos_compromisso')
        setEditingTipoCompromisso(null)
      },
      onError: () => toast.error('Erro ao atualizar tipo de compromisso.'),
    })
  }

  // Modal de Exclusão Customizado
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setIsDeleting(true)

    const routeMap = {
      ambiente: `/configuracoes/ambientes/${deleteTarget.id}`,
      origem: `/configuracoes/origens/${deleteTarget.id}`,
      campanha: `/configuracoes/campanhas/${deleteTarget.id}`,
      tipo_compromisso: `/configuracoes/tipos-compromisso/${deleteTarget.id}`,
    }

    const labelMap = {
      ambiente: 'Ambiente',
      origem: 'Origem',
      campanha: 'Campanha',
      tipo_compromisso: 'Tipo de compromisso',
    }

    router.delete(routeMap[deleteTarget.type], {
      onSuccess: () => {
        toast.success(`${labelMap[deleteTarget.type]} "${deleteTarget.nome}" removido(a) com sucesso.`)
        notifyCatalogoUpdate(deleteTarget.type === 'tipo_compromisso' ? 'tipos_compromisso' : undefined)
        setDeleteTarget(null)
        setIsDeleting(false)
      },
      onError: () => {
        toast.error(`Erro ao remover ${labelMap[deleteTarget.type].toLowerCase()}.`)
        setIsDeleting(false)
      },
    })
  }

  const handleToggleAmbiente = (item: AmbienteItem) => {
    router.patch(
      `/configuracoes/ambientes/${item.id}/toggle`,
      {},
      {
        onSuccess: () => {
          toast.success(
            `Ambiente "${item.nome}" ${!item.isActive ? 'ativado' : 'desativado'} com sucesso.`
          )
          notifyCatalogoUpdate()
        },
        onError: () => toast.error('Erro ao alterar status do ambiente.'),
      }
    )
  }

  const handleToggleOrigem = (item: OrigemItem) => {
    router.patch(
      `/configuracoes/origens/${item.id}/toggle`,
      {},
      {
        onSuccess: () => {
          toast.success(
            `Origem "${item.nome}" ${!item.isActive ? 'ativada' : 'desativada'} com sucesso.`
          )
          notifyCatalogoUpdate()
        },
        onError: () => toast.error('Erro ao alterar status da origem.'),
      }
    )
  }

  const handleToggleCampanha = (item: CampanhaItem) => {
    router.patch(
      `/configuracoes/campanhas/${item.id}/toggle`,
      {},
      {
        onSuccess: () => {
          toast.success(
            `Campanha "${item.nome}" ${!item.isActive ? 'ativada' : 'desativada'} com sucesso.`
          )
          notifyCatalogoUpdate()
        },
        onError: () => toast.error('Erro ao alterar status da campanha.'),
      }
    )
  }

  const handleToggleTipoCompromisso = (item: TipoCompromissoItem) => {
    router.patch(
      `/configuracoes/tipos-compromisso/${item.id}/toggle`,
      {},
      {
        onSuccess: () => {
          toast.success(
            `Tipo de compromisso "${item.nome}" ${!item.isActive ? 'ativado' : 'desativado'} com sucesso.`
          )
          notifyCatalogoUpdate('tipos_compromisso')
        },
        onError: () => toast.error('Erro ao alterar status do tipo de compromisso.'),
      }
    )
  }

  // Submit Criar Ambiente
  const handleSubmitAmbiente = (e: React.FormEvent) => {
    e.preventDefault()
    ambienteForm.post('/configuracoes/ambientes', {
      onSuccess: () => {
        toast.success('Ambiente cadastrado com sucesso!')
        notifyCatalogoUpdate()
        ambienteForm.reset()
        setModalAmbienteOpen(false)
      },
      onError: () => toast.error('Erro ao cadastrar ambiente. Verifique os dados.'),
    })
  }

  // Submit Criar Origem
  const handleSubmitOrigem = (e: React.FormEvent) => {
    e.preventDefault()
    origemForm.post('/configuracoes/origens', {
      onSuccess: () => {
        toast.success('Origem cadastrada com sucesso!')
        notifyCatalogoUpdate()
        origemForm.reset()
        setModalOrigemOpen(false)
      },
      onError: () => toast.error('Erro ao cadastrar origem.'),
    })
  }

  // Submit Criar Campanha
  const handleSubmitCampanha = (e: React.FormEvent) => {
    e.preventDefault()
    campanhaForm.post('/configuracoes/campanhas', {
      onSuccess: () => {
        toast.success('Campanha cadastrada com sucesso!')
        notifyCatalogoUpdate()
        campanhaForm.reset()
        setModalCampanhaOpen(false)
      },
      onError: () => toast.error('Erro ao cadastrar campanha.'),
    })
  }

  // Submit Criar Tipo de Compromisso
  const handleSubmitTipoCompromisso = (e: React.FormEvent) => {
    e.preventDefault()
    tipoCompromissoForm.post('/configuracoes/tipos-compromisso', {
      onSuccess: () => {
        toast.success('Tipo de compromisso cadastrado com sucesso!')
        notifyCatalogoUpdate('tipos_compromisso')
        tipoCompromissoForm.reset()
        setModalTipoCompromissoOpen(false)
      },
      onError: () => toast.error('Erro ao cadastrar tipo de compromisso.'),
    })
  }

  return (
    <AppLayout
      title="Configurações & Parâmetros do CRM"
      subtitle="Parametrização das tabelas de apoio para qualificação de leads e funil comercial"
    >
      <Head title="Configurações do CRM | Plannit" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Tabs */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('ambientes')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                activeTab === 'ambientes'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Layers size={15} />
              <span>Catálogo de Ambientes</span>
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'ambientes'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {ambientes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('origens')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                activeTab === 'origens'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Compass size={15} />
              <span>Origens de Lead</span>
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'origens'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {origens.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('campanhas')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                activeTab === 'campanhas'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Megaphone size={15} />
              <span>Campanhas Promocionais</span>
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'campanhas'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {campanhas.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tipos_compromisso')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                activeTab === 'tipos_compromisso'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Calendar size={15} />
              <span>Tipos de Compromisso</span>
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'tipos_compromisso'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {tiposCompromisso.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roteiros')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                activeTab === 'roteiros'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <BookOpen size={15} />
              <span>Roteiros de Apoio</span>
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'roteiros'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {roteiros.length}
              </span>
            </button>

            {podeGerenciarPermissoes && (
              <button
                onClick={() => setActiveTab('permissoes')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                  activeTab === 'permissoes'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                <ShieldCheck size={15} />
                <span>Perfis & Permissões</span>
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    activeTab === 'permissoes'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  Mestre
                </span>
              </button>
            )}

            {podeGerenciarPermissoes && (
              <button
                onClick={() => setActiveTab('usuarios')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none whitespace-nowrap shrink-0 cursor-pointer',
                  activeTab === 'usuarios'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                <Users size={15} />
                <span>Usuários do Sistema</span>
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    activeTab === 'usuarios'
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-800'
                  )}
                >
                  {usuarios.length}
                </span>
              </button>
            )}
          </div>

          <div>
            {activeTab === 'ambientes' && (
              <button
                onClick={() => setModalAmbienteOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Novo Ambiente</span>
              </button>
            )}

            {activeTab === 'origens' && (
              <button
                onClick={() => setModalOrigemOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Nova Origem</span>
              </button>
            )}

            {activeTab === 'campanhas' && (
              <button
                onClick={() => setModalCampanhaOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Nova Campanha</span>
              </button>
            )}

            {activeTab === 'tipos_compromisso' && (
              <button
                onClick={() => setModalTipoCompromissoOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Novo Tipo de Compromisso</span>
              </button>
            )}

            {activeTab === 'roteiros' && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-900 text-xs font-semibold whitespace-nowrap">
                <BookOpen size={14} className="text-primary-700" />
                <span>Gestão de Roteiros</span>
              </div>
            )}

            {activeTab === 'permissoes' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                <ShieldCheck size={14} className="text-amber-600" />
                <span>Gestão Mestre RBAC</span>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: AMBIENTES */}
        {activeTab === 'ambientes' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Catálogo Oficial de Ambientes
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ambientes padronizados disponíveis para seleção durante a qualificação de leads e briefings técnicos.
                </p>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                {ambientes.filter((a) => a.isActive).length} ativos de {ambientes.length} cadastrados
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6 w-16">Ordem</th>
                    <th className="py-3 px-6">Nome do Ambiente</th>
                    <th className="py-3 px-6">Categoria</th>
                    <th className="py-3 px-6">Roteiro Técnico Vinculado</th>
                    <th className="py-3 px-6 w-32">Status</th>
                    <th className="py-3 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {ambientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        Nenhum ambiente cadastrado no catálogo.
                      </td>
                    </tr>
                  ) : (
                    ambientes.map((amb) => (
                      <tr key={amb.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-semibold text-stone-500">
                          {amb.ordem}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-stone-900">
                          {amb.nome}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                            {amb.categoria || 'Geral'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          {(() => {
                            const roteiro = roteiroPorAmbienteNome.get(amb.nome.toLowerCase().trim())
                            if (roteiro) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('roteiros')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200 font-semibold text-[11px] transition-colors cursor-pointer"
                                  title="Clique para abrir e gerenciar este roteiro de apoio"
                                >
                                  <BookOpen size={12} className="text-primary-700" />
                                  <span>{roteiro.titulo}</span>
                                </button>
                              )
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => setActiveTab('roteiros')}
                                className="text-[11px] text-stone-400 hover:text-primary-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                                title="Clique para cadastrar ou vincular um roteiro técnico para este ambiente"
                              >
                                <span>+ Vincular Roteiro</span>
                              </button>
                            )
                          })()}
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleAmbiente(amb)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] transition-colors cursor-pointer',
                              amb.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                            )}
                            title="Clique para alternar o status"
                          >
                            <Power size={11} />
                            <span>{amb.isActive ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAmbiente(amb)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar ambiente"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'ambiente', id: amb.id, nome: amb.nome })}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir ambiente"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORIGENS DE LEAD */}
        {activeTab === 'origens' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Canais e Origens de Captação
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Origens onde o cliente tomou conhecimento da loja (Instagram, Construtora, Indicação, etc.).
                </p>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                {origens.filter((o) => o.isActive).length} ativas de {origens.length} cadastradas
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6">Nome do Canal</th>
                    <th className="py-3 px-6">Identificador (Slug)</th>
                    <th className="py-3 px-6 w-32">Status</th>
                    <th className="py-3 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {origens.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400">
                        Nenhuma origem cadastrada.
                      </td>
                    </tr>
                  ) : (
                    origens.map((origem) => (
                      <tr key={origem.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-stone-900">
                          {origem.nome}
                        </td>
                        <td className="py-3.5 px-6">
                          <code className="text-[11px] px-2 py-0.5 bg-stone-100 rounded text-stone-700 font-mono">
                            {origem.slug}
                          </code>
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleOrigem(origem)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] transition-colors cursor-pointer',
                              origem.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                            )}
                            title="Clique para alternar o status"
                          >
                            <Power size={11} />
                            <span>{origem.isActive ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditOrigem(origem)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar origem"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'origem', id: origem.id, nome: origem.nome })}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir origem"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAMPANHAS */}
        {activeTab === 'campanhas' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Campanhas Promocionais & Ações Especiais
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ações de marketing, mostras parceiras e iniciativas sazonais para atribuição de leads.
                </p>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                {campanhas.filter((c) => c.isActive).length} ativas de {campanhas.length} cadastradas
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6">Nome da Campanha</th>
                    <th className="py-3 px-6">Data de Início</th>
                    <th className="py-3 px-6">Data de Término</th>
                    <th className="py-3 px-6 w-32">Status</th>
                    <th className="py-3 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {campanhas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        Nenhuma campanha cadastrada.
                      </td>
                    </tr>
                  ) : (
                    campanhas.map((camp) => (
                      <tr key={camp.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-stone-900">
                          {camp.nome}
                        </td>
                        <td className="py-3.5 px-6 text-stone-600">
                          {camp.dataInicio || '—'}
                        </td>
                        <td className="py-3.5 px-6 text-stone-600">
                          {camp.dataFim || '—'}
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleCampanha(camp)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] transition-colors cursor-pointer',
                              camp.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                            )}
                            title="Clique para alternar o status"
                          >
                            <Power size={11} />
                            <span>{camp.isActive ? 'Ativa' : 'Inativa'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCampanha(camp)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar campanha"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'campanha', id: camp.id, nome: camp.nome })}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir campanha"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TIPOS DE COMPROMISSO */}
        {activeTab === 'tipos_compromisso' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Tipos de Compromisso & Encontros da Agenda
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Classificação operacional de compromissos para alinhamento entre loja, obra e cliente.
                </p>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                {tiposCompromisso.filter((t) => t.isActive).length} ativos de {tiposCompromisso.length} cadastrados
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6 w-20">Ordem</th>
                    <th className="py-3 px-6">Nome do Tipo</th>
                    <th className="py-3 px-6">Identificador (Slug)</th>
                    <th className="py-3 px-6">Cor / Visual</th>
                    <th className="py-3 px-6 w-32">Status</th>
                    <th className="py-3 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {tiposCompromisso.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        Nenhum tipo de compromisso cadastrado.
                      </td>
                    </tr>
                  ) : (
                    tiposCompromisso.map((tipo) => (
                      <tr key={tipo.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-stone-500 font-semibold">
                          {tipo.ordem}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-stone-900">
                          {tipo.nome}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px] text-stone-500">
                          {tipo.slug}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-stone-200/80 bg-stone-50 shadow-2xs">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                              style={{ backgroundColor: tipo.cor || '#3B82F6' }}
                            />
                            <span className="font-mono text-[11px] font-medium text-stone-600 uppercase">
                              {tipo.cor || '#3B82F6'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleTipoCompromisso(tipo)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] transition-colors cursor-pointer',
                              tipo.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                            )}
                            title="Clique para alternar o status"
                          >
                            <Power size={11} />
                            <span>{tipo.isActive ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTipoCompromisso(tipo)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar tipo de compromisso"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({ type: 'tipo_compromisso', id: tipo.id, nome: tipo.nome })
                              }
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir tipo de compromisso"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PERMISSÕES & PERFIS (RBAC) */}
        {activeTab === 'permissoes' && podeGerenciarPermissoes && permissoesConfig && (
          <MatrizPermissoesPanel config={permissoesConfig} />
        )}

        {/* TAB 6: USUÁRIOS DO SISTEMA */}
        {activeTab === 'usuarios' && podeGerenciarPermissoes && (
          <UsuariosSistemaPanel
            usuarios={usuarios}
            perfisCatalogo={perfisCatalogo}
          />
        )}

        {/* TAB 7: ROTEIROS DE APOIO (BRIEFING) */}
        {activeTab === 'roteiros' && (
          <RoteirosBriefingPanel
            roteiros={roteiros}
            ambientes={ambientes}
            podeGerenciar={podeGerenciarPermissoes || true}
          />
        )}
      </div>

      {/* MODAL CRIAR AMBIENTE */}
      {modalAmbienteOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Cadastrar Novo Ambiente
              </h3>
              <button
                onClick={() => setModalAmbienteOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitAmbiente} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome do Ambiente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Espaço Adega, Cinema, etc."
                  value={ambienteForm.data.nome}
                  onChange={(e) => ambienteForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={ambienteForm.data.categoria}
                  onChange={(e) => ambienteForm.setData('categoria', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="Área Social">Área Social</option>
                  <option value="Área Íntima">Área Íntima</option>
                  <option value="Serviço">Serviço</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  min="0"
                  value={ambienteForm.data.ordem}
                  onChange={(e) => ambienteForm.setData('ordem', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAmbienteOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ambienteForm.processing || !ambienteForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {ambienteForm.processing ? 'Salvando...' : 'Salvar Ambiente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR ORIGEM */}
      {modalOrigemOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Cadastrar Nova Origem de Lead
              </h3>
              <button
                onClick={() => setModalOrigemOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrigem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome da Origem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tráfego Pago Google, TikTok, Feira de Noivas..."
                  value={origemForm.data.nome}
                  onChange={(e) => origemForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Identificador / Slug (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Se vazio, será gerado automaticamente"
                  value={origemForm.data.slug}
                  onChange={(e) => origemForm.setData('slug', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOrigemOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={origemForm.processing || !origemForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {origemForm.processing ? 'Salvando...' : 'Salvar Origem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR CAMPANHA */}
      {modalCampanhaOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Cadastrar Nova Campanha
              </h3>
              <button
                onClick={() => setModalCampanhaOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitCampanha} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Feirão de Primavera 2026"
                  value={campanhaForm.data.nome}
                  onChange={(e) => campanhaForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={campanhaForm.data.dataInicio}
                    onChange={(e) => campanhaForm.setData('dataInicio', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={campanhaForm.data.dataFim}
                    onChange={(e) => campanhaForm.setData('dataFim', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalCampanhaOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={campanhaForm.processing || !campanhaForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {campanhaForm.processing ? 'Salvando...' : 'Salvar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR AMBIENTE */}
      {editingAmbiente && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Editar Ambiente: {editingAmbiente.nome}
              </h3>
              <button
                onClick={() => setEditingAmbiente(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateAmbiente} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome do Ambiente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Espaço Adega, Cinema, etc."
                  value={ambienteEditForm.data.nome}
                  onChange={(e) => ambienteEditForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={ambienteEditForm.data.categoria}
                  onChange={(e) => ambienteEditForm.setData('categoria', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="Área Social">Área Social</option>
                  <option value="Área Íntima">Área Íntima</option>
                  <option value="Serviço">Serviço</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  min="0"
                  value={ambienteEditForm.data.ordem}
                  onChange={(e) => ambienteEditForm.setData('ordem', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAmbiente(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ambienteEditForm.processing || !ambienteEditForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {ambienteEditForm.processing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ORIGEM */}
      {editingOrigem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Editar Origem de Lead: {editingOrigem.nome}
              </h3>
              <button
                onClick={() => setEditingOrigem(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateOrigem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome da Origem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tráfego Pago Google, TikTok, Feira de Noivas..."
                  value={origemEditForm.data.nome}
                  onChange={(e) => origemEditForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Identificador / Slug
                </label>
                <input
                  type="text"
                  value={origemEditForm.data.slug}
                  onChange={(e) => origemEditForm.setData('slug', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOrigem(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={origemEditForm.processing || !origemEditForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {origemEditForm.processing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CAMPANHA */}
      {editingCampanha && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-semibold text-stone-900 text-sm">
                Editar Campanha: {editingCampanha.nome}
              </h3>
              <button
                onClick={() => setEditingCampanha(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCampanha} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Feirão de Primavera 2026"
                  value={campanhaEditForm.data.nome}
                  onChange={(e) => campanhaEditForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={campanhaEditForm.data.dataInicio}
                    onChange={(e) => campanhaEditForm.setData('dataInicio', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={campanhaEditForm.data.dataFim}
                    onChange={(e) => campanhaEditForm.setData('dataFim', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCampanha(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={campanhaEditForm.processing || !campanhaEditForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {campanhaEditForm.processing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR TIPO DE COMPROMISSO */}
      {modalTipoCompromissoOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Calendar size={15} />
                </div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Cadastrar Tipo de Compromisso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTipoCompromissoOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitTipoCompromisso} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome do Tipo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Briefing Técnico, Visita Obra, etc."
                  value={tipoCompromissoForm.data.nome}
                  onChange={(e) => tipoCompromissoForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Slug (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-gerado se vazio"
                    value={tipoCompromissoForm.data.slug}
                    onChange={(e) => tipoCompromissoForm.setData('slug', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tipoCompromissoForm.data.ordem}
                    onChange={(e) => tipoCompromissoForm.setData('ordem', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Cor de Identificação Visual
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CORES_PALETA_TIPOS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => tipoCompromissoForm.setData('cor', cor)}
                      className={clsx(
                        'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer shadow-2xs flex items-center justify-center',
                        tipoCompromissoForm.data.cor.toLowerCase() === cor.toLowerCase()
                          ? 'border-stone-900 scale-110 ring-2 ring-primary-500/30'
                          : 'border-white'
                      )}
                      style={{ backgroundColor: cor }}
                      title={cor}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tipoCompromissoForm.data.cor}
                    onChange={(e) => tipoCompromissoForm.setData('cor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer bg-stone-50 p-0.5"
                  />
                  <input
                    type="text"
                    value={tipoCompromissoForm.data.cor}
                    onChange={(e) => tipoCompromissoForm.setData('cor', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalTipoCompromissoOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tipoCompromissoForm.processing || !tipoCompromissoForm.data.nome.trim()}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {tipoCompromissoForm.processing ? 'Cadastrando...' : 'Cadastrar Tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR TIPO DE COMPROMISSO */}
      {editingTipoCompromisso && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md shadow-2xs border border-black/10 shrink-0"
                  style={{ backgroundColor: tipoCompromissoEditForm.data.cor || '#3B82F6' }}
                />
                <h3 className="font-semibold text-stone-900 text-sm">
                  Editar Tipo: {editingTipoCompromisso.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTipoCompromisso(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTipoCompromisso} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome do Tipo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Briefing Técnico"
                  value={tipoCompromissoEditForm.data.nome}
                  onChange={(e) => tipoCompromissoEditForm.setData('nome', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={tipoCompromissoEditForm.data.slug}
                    onChange={(e) => tipoCompromissoEditForm.setData('slug', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tipoCompromissoEditForm.data.ordem}
                    onChange={(e) => tipoCompromissoEditForm.setData('ordem', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Cor de Identificação Visual
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CORES_PALETA_TIPOS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => tipoCompromissoEditForm.setData('cor', cor)}
                      className={clsx(
                        'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer shadow-2xs flex items-center justify-center',
                        tipoCompromissoEditForm.data.cor.toLowerCase() === cor.toLowerCase()
                          ? 'border-stone-900 scale-110 ring-2 ring-primary-500/30'
                          : 'border-white'
                      )}
                      style={{ backgroundColor: cor }}
                      title={cor}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tipoCompromissoEditForm.data.cor}
                    onChange={(e) => tipoCompromissoEditForm.setData('cor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer bg-stone-50 p-0.5"
                  />
                  <input
                    type="text"
                    value={tipoCompromissoEditForm.data.cor}
                    onChange={(e) => tipoCompromissoEditForm.setData('cor', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTipoCompromisso(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tipoCompromissoEditForm.processing || !tipoCompromissoEditForm.data.nome.trim()}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {tipoCompromissoEditForm.processing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (DESIGN SYSTEM LÍDER) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-stone-900 text-sm">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {deleteTarget.type === 'ambiente' && 'Remover ambiente do catálogo oficial'}
                    {deleteTarget.type === 'origem' && 'Remover canal de captação de lead'}
                    {deleteTarget.type === 'campanha' && 'Remover campanha promocional'}
                    {deleteTarget.type === 'tipo_compromisso' && 'Remover tipo de compromisso da agenda'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <p className="text-stone-600 leading-relaxed">
                Tem certeza de que deseja remover permanentemente o item{' '}
                <strong className="text-stone-900 font-semibold bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {deleteTarget.nome}
                </strong>?
              </p>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Este registro deixará de aparecer para novas qualificações e cadastros no sistema.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? 'Removendo...' : 'Sim, Excluir'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
