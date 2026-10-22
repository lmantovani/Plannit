import React, { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import {
  Kanban,
  Plus,
  Pencil,
  Trash2,
  Power,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
  X,
  Check,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import { notificarCatalogoAtualizado } from '~/lib/catalogos'
import type { KanbanQuadroCatalogoItem, KanbanEtapaCatalogoItem } from '~/lib/constants'

const PALETA_CORES = [
  '#b45309', // Ouro / Âmbar Escuro
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#f59e0b', // Âmbar
  '#6366f1', // Índigo
  '#06b6d4', // Ciano
  '#0ea5e9', // Sky
  '#0284c7', // Azul Oceano
  '#ec4899', // Rosa
  '#d946ef', // Fúcsia
  '#eab308', // Amarelo
  '#f97316', // Laranja
  '#14b8a6', // Turquesa
  '#10b981', // Esmeralda
  '#059669', // Verde Floresta
  '#16a34a', // Verde Sucesso
  '#dc2626', // Vermelho
  '#64748b', // Slate / Cinza
]

const TIPO_ESTAGIO_LABELS: Record<string, { label: string; badge: string }> = {
  aberta: { label: 'Em Andamento', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  ganho: { label: 'Ganho / Fechado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  perdido: { label: 'Perdido', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  desqualificado: { label: 'Desqualificado', badge: 'bg-stone-100 text-stone-700 border-stone-200' },
}

interface KanbanFunisPanelProps {
  quadros: KanbanQuadroCatalogoItem[]
}

export default function KanbanFunisPanel({ quadros = [] }: KanbanFunisPanelProps) {
  const [selectedQuadroId, setSelectedQuadroId] = useState<number | null>(
    quadros[0]?.id ?? null
  )
  const [modalQuadro, setModalQuadro] = useState<{
    open: boolean
    editing: KanbanQuadroCatalogoItem | null
  }>({ open: false, editing: null })

  const [modalEtapa, setModalEtapa] = useState<{
    open: boolean
    quadroId: number
    editing: KanbanEtapaCatalogoItem | null
  }>({ open: false, quadroId: quadros[0]?.id || 0, editing: null })

  const [deleteTarget, setDeleteTarget] = useState<{
    tipo: 'quadro' | 'etapa'
    id: number
    nome: string
  } | null>(null)

  const quadroAtivo =
    quadros.find((q) => q.id === selectedQuadroId) || quadros[0] || null

  const handleToggleQuadro = (q: KanbanQuadroCatalogoItem) => {
    router.patch(
      `/configuracoes/kanban-quadros/${q.id}/toggle`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
        },
        onError: () => toast.error('Erro ao alterar status do quadro.'),
      }
    )
  }

  const handleReorderQuadro = (q: KanbanQuadroCatalogoItem, direcao: 'up' | 'down') => {
    router.patch(
      `/configuracoes/kanban-quadros/${q.id}/reorder`,
      { direcao },
      {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
        },
      }
    )
  }

  const handleToggleEtapa = (e: KanbanEtapaCatalogoItem) => {
    router.patch(
      `/configuracoes/kanban-etapas/${e.id}/toggle`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
        },
        onError: () => toast.error('Erro ao alterar status da etapa.'),
      }
    )
  }

  const handleReorderEtapa = (e: KanbanEtapaCatalogoItem, direcao: 'up' | 'down') => {
    router.patch(
      `/configuracoes/kanban-etapas/${e.id}/reorder`,
      { direcao },
      {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
        },
      }
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const url =
      deleteTarget.tipo === 'quadro'
        ? `/configuracoes/kanban-quadros/${deleteTarget.id}`
        : `/configuracoes/kanban-etapas/${deleteTarget.id}`

    router.delete(url, {
      preserveScroll: true,
      onSuccess: () => {
        notificarCatalogoAtualizado('kanban')
        setDeleteTarget(null)
      },
      onError: () => {
        setDeleteTarget(null)
      },
    })
  }

  const totalColunas = quadros.reduce((acc, q) => acc + (q.etapas?.length || 0), 0)

  return (
    <div className="space-y-5">
      {/* Banner Explicativo */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Kanban size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Quadros e Etapas do Kanban (Multi-Pipelines do CRM)
            </h3>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              Organize o fluxo operacional em <strong>Quadros independentes</strong> (ex.: Comercial,
              Conferência, Entrega e Montagem, Assistência Técnica). No CRM, o usuário escolhe qual
              quadro deseja visualizar por vez. Você pode criar, editar, reordenar, ativar/desativar ou
              excluir tanto os quadros quanto as colunas de cada quadro.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalQuadro({ open: true, editing: null })}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />
          <span>Novo Quadro</span>
        </button>
      </div>

      {/* Lista de Quadros (Pipelines) */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Layers size={14} className="text-primary-600" />
              <span>1. Quadros do Kanban ({quadros.length} quadros • {totalColunas} etapas no total)</span>
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Clique em um quadro abaixo para gerenciar suas colunas (etapas) ou use as setas para alterar a ordem de exibição no CRM.
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {quadros.map((q, idx) => {
            const isSelected = quadroAtivo?.id === q.id
            const etapasAtivas = (q.etapas || []).filter((e) => e.isActive !== false).length

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuadroId(q.id)}
                className={clsx(
                  'p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-primary-50/50 border-l-4 border-l-primary-600'
                    : 'hover:bg-stone-50/80'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Ordenação do Quadro */}
                  <div
                    className="flex flex-col items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleReorderQuadro(q, 'up')}
                      className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-25 rounded"
                      title="Mover quadro para cima"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === quadros.length - 1}
                      onClick={() => handleReorderQuadro(q, 'down')}
                      className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-25 rounded"
                      title="Mover quadro para baixo"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: q.cor }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-sm">{q.nome}</span>
                      <code className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded font-mono">
                        {q.slug}
                      </code>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {etapasAtivas}/{(q.etapas || []).length} colunas ativas
                      </span>
                    </div>
                    {q.descricao && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate max-w-2xl">
                        {q.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações do Quadro */}
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleQuadro(q)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      q.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    )}
                    title={q.isActive !== false ? 'Clique para desativar' : 'Clique para ativar'}
                  >
                    <Power size={11} />
                    <span>{q.isActive !== false ? 'Ativo' : 'Inativo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuadroId(q.id)
                      setModalEtapa({ open: true, quadroId: q.id, editing: null })
                    }}
                    className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                    title="Adicionar nova coluna a este quadro"
                  >
                    <Plus size={12} />
                    <span>Coluna</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalQuadro({ open: true, editing: q })}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                    title="Editar quadro"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ tipo: 'quadro', id: q.id, nome: q.nome })
                    }
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Excluir quadro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Colunas (Etapas) do Quadro Selecionado */}
      {quadroAtivo && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: quadroAtivo.cor }}
              />
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Colunas do Quadro: {quadroAtivo.nome} ({(quadroAtivo.etapas || []).length})
                </h4>
                <p className="text-xs text-stone-500">
                  Arraste ou use as setas para ordenar as colunas da esquerda para a direita no Kanban.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setModalEtapa({ open: true, quadroId: quadroAtivo.id, editing: null })
              }
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Nova Coluna em "{quadroAtivo.nome}"</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-20">Ordem</th>
                  <th>Nome da Coluna (Etapa)</th>
                  <th>Identificador (Slug)</th>
                  <th>Regras & Gatilhos</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(quadroAtivo.etapas || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400 text-xs">
                      Nenhuma coluna cadastrada neste quadro. Clique em "Nova Coluna" para adicionar.
                    </td>
                  </tr>
                ) : (
                  (quadroAtivo.etapas || []).map((etapa, idx) => {
                    const tipoInfo =
                      TIPO_ESTAGIO_LABELS[etapa.tipoEstagio] || TIPO_ESTAGIO_LABELS.aberta

                    return (
                      <tr
                        key={etapa.id}
                        className={clsx(etapa.isActive === false && 'opacity-60 bg-stone-50/40')}
                      >
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleReorderEtapa(etapa, 'up')}
                              className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-25 rounded hover:bg-stone-100"
                              title="Mover coluna para a esquerda/cima"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <span className="font-mono text-xs font-semibold text-stone-600 w-6 text-center">
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              disabled={idx === (quadroAtivo.etapas || []).length - 1}
                              onClick={() => handleReorderEtapa(etapa, 'down')}
                              className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-25 rounded hover:bg-stone-100"
                              title="Mover coluna para a direita/baixo"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: etapa.cor }}
                            />
                            <span className="font-medium text-stone-800">{etapa.nome}</span>
                          </div>
                        </td>
                        <td>
                          <code className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-mono">
                            {etapa.slug}
                          </code>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {etapa.exigeQualificacao && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                title="RN001: Exige que o lead esteja qualificado antes de entrar nesta coluna"
                              >
                                <ShieldCheck size={11} />
                                Exige Qualificação (RN001)
                              </span>
                            )}
                            {etapa.exigeMotivoPerda && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                                title="RF004: Solicita motivo de perda ao mover para esta coluna"
                              >
                                Exige Motivo Perda
                              </span>
                            )}
                            {!etapa.exigeQualificacao && !etapa.exigeMotivoPerda && (
                              <span className="text-[11px] text-stone-400">Livre</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                              tipoInfo.badge
                            )}
                          >
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleEtapa(etapa)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                              etapa.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            )}
                          >
                            <Power size={11} />
                            <span>{etapa.isActive !== false ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setModalEtapa({
                                  open: true,
                                  quadroId: etapa.quadroId,
                                  editing: etapa,
                                })
                              }
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                              title="Editar coluna"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  tipo: 'etapa',
                                  id: etapa.id,
                                  nome: etapa.nome,
                                })
                              }
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Excluir coluna"
                            >
                              <Trash2 size={14} />
                            </button>
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
      )}

      {/* Modal Criar / Editar Quadro */}
      {modalQuadro.open && (
        <ModalQuadroForm
          editing={modalQuadro.editing}
          onClose={() => setModalQuadro({ open: false, editing: null })}
        />
      )}

      {/* Modal Criar / Editar Etapa */}
      {modalEtapa.open && (
        <ModalEtapaForm
          quadros={quadros}
          defaultQuadroId={modalEtapa.quadroId}
          editing={modalEtapa.editing}
          onClose={() =>
            setModalEtapa({ open: false, quadroId: quadroAtivo?.id || 0, editing: null })
          }
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Excluir {deleteTarget.tipo === 'quadro' ? 'Quadro' : 'Coluna do Kanban'}
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir{' '}
                  <strong>"{deleteTarget.nome}"</strong>? Caso existam leads posicionados nesta
                  etapa, o sistema impedirá a exclusão física para preservar o histórico (você
                  pode apenas desativá-la).
                </p>
              </div>
            </div>
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-danger text-xs py-1.5 px-3.5"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalQuadroForm({
  editing,
  onClose,
}: {
  editing: KanbanQuadroCatalogoItem | null
  onClose: () => void
}) {
  const form = useForm({
    nome: editing?.nome || '',
    descricao: editing?.descricao || '',
    cor: editing?.cor || '#b45309',
    ordem: editing?.ordem ?? 1,
    isActive: editing?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.data.nome.trim()) {
      toast.error('Informe o nome do quadro.')
      return
    }

    if (editing) {
      form.put(`/configuracoes/kanban-quadros/${editing.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
          onClose()
        },
      })
    } else {
      form.post('/configuracoes/kanban-quadros', {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
          onClose()
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <h3 className="font-display font-semibold text-stone-900 text-base">
            {editing ? `Editar Quadro: ${editing.nome}` : 'Novo Quadro do Kanban'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Nome do Quadro (Pipeline) *</label>
            <input
              type="text"
              value={form.data.nome}
              onChange={(e) => form.setData('nome', e.target.value)}
              placeholder="Ex.: Pós-venda (Conferência)"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="label">Descrição Operacional</label>
            <input
              type="text"
              value={form.data.descricao}
              onChange={(e) => form.setData('descricao', e.target.value)}
              placeholder="Breve descrição das etapas deste quadro"
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ordem de Exibição</label>
              <input
                type="number"
                min={0}
                value={form.data.ordem}
                onChange={(e) => form.setData('ordem', Number(e.target.value))}
                className="input w-full"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={form.data.isActive}
                  onChange={(e) => form.setData('isActive', e.target.checked)}
                  className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Quadro ativo no CRM</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Cor de Identificação do Quadro</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PALETA_CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setData('cor', c)}
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-transform',
                    form.data.cor === c ? 'scale-110 ring-2 ring-offset-2 ring-stone-800' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {form.data.cor === c && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={form.processing}
              className="btn-primary text-xs py-2 px-4"
            >
              {form.processing ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Quadro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalEtapaForm({
  quadros,
  defaultQuadroId,
  editing,
  onClose,
}: {
  quadros: KanbanQuadroCatalogoItem[]
  defaultQuadroId: number
  editing: KanbanEtapaCatalogoItem | null
  onClose: () => void
}) {
  const form = useForm({
    quadroId: editing?.quadroId || defaultQuadroId || quadros[0]?.id || 1,
    nome: editing?.nome || '',
    cor: editing?.cor || '#3b82f6',
    ordem: editing?.ordem ?? 1,
    exigeQualificacao: editing?.exigeQualificacao ?? true,
    exigeMotivoPerda: editing?.exigeMotivoPerda ?? false,
    tipoEstagio: (editing?.tipoEstagio || 'aberta') as
      | 'aberta'
      | 'ganho'
      | 'perdido'
      | 'desqualificado',
    isActive: editing?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.data.nome.trim()) {
      toast.error('Informe o nome da coluna/etapa.')
      return
    }

    if (editing) {
      form.put(`/configuracoes/kanban-etapas/${editing.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
          onClose()
        },
      })
    } else {
      form.post('/configuracoes/kanban-etapas', {
        preserveScroll: true,
        onSuccess: () => {
          notificarCatalogoAtualizado('kanban')
          onClose()
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <h3 className="font-display font-semibold text-stone-900 text-base">
            {editing ? `Editar Coluna: ${editing.nome}` : 'Nova Coluna (Etapa) do Kanban'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Quadro (Pipeline) *</label>
              <select
                value={form.data.quadroId}
                onChange={(e) => form.setData('quadroId', Number(e.target.value))}
                className="input w-full"
              >
                {quadros.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de Estágio (KPIs)</label>
              <select
                value={form.data.tipoEstagio}
                onChange={(e) =>
                  form.setData(
                    'tipoEstagio',
                    e.target.value as 'aberta' | 'ganho' | 'perdido' | 'desqualificado'
                  )
                }
                className="input w-full"
              >
                <option value="aberta">Em Andamento (Pipeline Ativo)</option>
                <option value="ganho">Fechado / Ganho</option>
                <option value="perdido">Perdido</option>
                <option value="desqualificado">Desqualificado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Nome da Coluna *</label>
              <input
                type="text"
                value={form.data.nome}
                onChange={(e) => form.setData('nome', e.target.value)}
                placeholder="Ex.: Fila Medição Técnica"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="label">Ordem na Coluna</label>
              <input
                type="number"
                min={0}
                value={form.data.ordem}
                onChange={(e) => form.setData('ordem', Number(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
            <p className="text-[11px] font-semibold text-stone-700 uppercase">
              Guardrails Operacionais da Coluna
            </p>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
              <input
                type="checkbox"
                checked={form.data.exigeQualificacao}
                onChange={(e) => form.setData('exigeQualificacao', e.target.checked)}
                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                <strong>Exigir Qualificação (RN001):</strong> bloqueia cards não qualificados de entrarem nesta coluna
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
              <input
                type="checkbox"
                checked={form.data.exigeMotivoPerda}
                onChange={(e) => form.setData('exigeMotivoPerda', e.target.checked)}
                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                <strong>Exigir Motivo da Perda (RF004):</strong> solicita motivo ao mover o card para esta coluna
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
              <input
                type="checkbox"
                checked={form.data.isActive}
                onChange={(e) => form.setData('isActive', e.target.checked)}
                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Coluna ativa e visível no quadro</span>
            </label>
          </div>

          <div>
            <label className="label">Cor da Coluna</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PALETA_CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setData('cor', c)}
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-transform',
                    form.data.cor === c ? 'scale-110 ring-2 ring-offset-2 ring-stone-800' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {form.data.cor === c && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={form.processing}
              className="btn-primary text-xs py-2 px-4"
            >
              {form.processing ? 'Salvando...' : editing ? 'Salvar Coluna' : 'Criar Coluna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

