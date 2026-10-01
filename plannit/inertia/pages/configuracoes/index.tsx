import React, { useState } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  Layers,
  Compass,
  Megaphone,
  Plus,
  Trash2,
  X,
  Power,
  Pencil,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'

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

interface ConfiguracoesPageProps {
  ambientes: AmbienteItem[]
  origens: OrigemItem[]
  campanhas: CampanhaItem[]
}

type TabKey = 'ambientes' | 'origens' | 'campanhas'

export default function ConfiguracoesPage({
  ambientes = [],
  origens = [],
  campanhas = [],
}: ConfiguracoesPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('ambientes')

  // Modais de Criação
  const [modalAmbienteOpen, setModalAmbienteOpen] = useState(false)
  const [modalOrigemOpen, setModalOrigemOpen] = useState(false)
  const [modalCampanhaOpen, setModalCampanhaOpen] = useState(false)

  // Modais de Edição
  const [editingAmbiente, setEditingAmbiente] = useState<AmbienteItem | null>(null)
  const [editingOrigem, setEditingOrigem] = useState<OrigemItem | null>(null)
  const [editingCampanha, setEditingCampanha] = useState<CampanhaItem | null>(null)

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

  const handleUpdateAmbiente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAmbiente) return
    ambienteEditForm.put(`/configuracoes/ambientes/${editingAmbiente.id}`, {
      onSuccess: () => {
        toast.success(`Ambiente "${ambienteEditForm.data.nome}" atualizado com sucesso!`)
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
        setEditingCampanha(null)
      },
      onError: () => toast.error('Erro ao atualizar campanha.'),
    })
  }

  // Handlers de exclusão com confirmação
  const handleDeleteAmbiente = (item: AmbienteItem) => {
    if (confirm(`Deseja realmente remover o ambiente "${item.nome}" do catálogo?`)) {
      router.delete(`/configuracoes/ambientes/${item.id}`, {
        onSuccess: () => toast.success(`Ambiente "${item.nome}" removido.`),
        onError: () => toast.error('Erro ao remover ambiente.'),
      })
    }
  }

  const handleToggleAmbiente = (item: AmbienteItem) => {
    router.patch(
      `/configuracoes/ambientes/${item.id}/toggle`,
      {},
      {
        onSuccess: () =>
          toast.success(
            `Ambiente "${item.nome}" ${!item.isActive ? 'ativado' : 'desativado'} com sucesso.`
          ),
        onError: () => toast.error('Erro ao alterar status do ambiente.'),
      }
    )
  }

  const handleDeleteOrigem = (item: OrigemItem) => {
    if (confirm(`Deseja realmente remover a origem "${item.nome}"?`)) {
      router.delete(`/configuracoes/origens/${item.id}`, {
        onSuccess: () => toast.success(`Origem "${item.nome}" removida.`),
        onError: () => toast.error('Erro ao remover origem.'),
      })
    }
  }

  const handleToggleOrigem = (item: OrigemItem) => {
    router.patch(
      `/configuracoes/origens/${item.id}/toggle`,
      {},
      {
        onSuccess: () =>
          toast.success(
            `Origem "${item.nome}" ${!item.isActive ? 'ativada' : 'desativada'} com sucesso.`
          ),
        onError: () => toast.error('Erro ao alterar status da origem.'),
      }
    )
  }

  const handleDeleteCampanha = (item: CampanhaItem) => {
    if (confirm(`Deseja realmente remover a campanha "${item.nome}"?`)) {
      router.delete(`/configuracoes/campanhas/${item.id}`, {
        onSuccess: () => toast.success(`Campanha "${item.nome}" removida.`),
        onError: () => toast.error('Erro ao remover campanha.'),
      })
    }
  }

  const handleToggleCampanha = (item: CampanhaItem) => {
    router.patch(
      `/configuracoes/campanhas/${item.id}/toggle`,
      {},
      {
        onSuccess: () =>
          toast.success(
            `Campanha "${item.nome}" ${!item.isActive ? 'ativada' : 'desativada'} com sucesso.`
          ),
        onError: () => toast.error('Erro ao alterar status da campanha.'),
      }
    )
  }

  // Submit Criar Ambiente
  const handleSubmitAmbiente = (e: React.FormEvent) => {
    e.preventDefault()
    ambienteForm.post('/configuracoes/ambientes', {
      onSuccess: () => {
        toast.success('Ambiente cadastrado com sucesso!')
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
        campanhaForm.reset()
        setModalCampanhaOpen(false)
      },
      onError: () => toast.error('Erro ao cadastrar campanha.'),
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ambientes')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none',
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
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none',
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
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all select-none',
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
                    <th className="py-3 px-6 w-32">Status</th>
                    <th className="py-3 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {ambientes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
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
                              onClick={() => handleDeleteAmbiente(amb)}
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
                              onClick={() => handleDeleteOrigem(origem)}
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
                              onClick={() => handleDeleteCampanha(camp)}
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
    </AppLayout>
  )
}
