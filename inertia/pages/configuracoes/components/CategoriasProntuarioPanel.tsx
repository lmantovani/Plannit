import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  Bookmark,
  Plus,
  Pencil,
  Trash2,
  Power,
  Search,
  AlertTriangle,
  X,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import ModalCategoriaProntuario, { ICONES_DISPONIVEIS } from './ModalCategoriaProntuario'
import type { CategoriaProntuarioItem } from '../index'

interface CategoriasProntuarioPanelProps {
  categorias: CategoriaProntuarioItem[]
  podeGerenciar: boolean
  notifyCatalogoUpdate: (catalogo?: string) => void
}

export default function CategoriasProntuarioPanel({
  categorias = [],
  podeGerenciar,
  notifyCatalogoUpdate,
}: CategoriasProntuarioPanelProps) {
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<CategoriaProntuarioItem | null>(null)
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CategoriaProntuarioItem | null>(null)
  const [loadingAcaoId, setLoadingAcaoId] = useState<number | null>(null)

  const categoriasFiltradas = useMemo(() => {
    if (!busca.trim()) return categorias
    const termo = busca.toLowerCase()
    return categorias.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.slug.toLowerCase().includes(termo)
    )
  }, [categorias, busca])

  const totalAtivas = useMemo(() => categorias.filter((c) => c.isActive).length, [categorias])

  const handleNovaCategoria = () => {
    setCategoriaEmEdicao(null)
    setModalOpen(true)
  }

  const handleEditarCategoria = (item: CategoriaProntuarioItem) => {
    setCategoriaEmEdicao(item)
    setModalOpen(true)
  }

  const handleToggleStatus = (item: CategoriaProntuarioItem) => {
    setLoadingAcaoId(item.id)
    router.patch(
      `/configuracoes/categorias-prontuario/${item.id}/toggle`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          notifyCatalogoUpdate('categorias_prontuario')
          setLoadingAcaoId(null)
        },
        onError: () => {
          toast.error('Erro ao alterar status da categoria.')
          setLoadingAcaoId(null)
        },
      }
    )
  }

  const handleConfirmarExclusao = () => {
    if (!categoriaParaExcluir) return

    setLoadingAcaoId(categoriaParaExcluir.id)
    router.delete(`/configuracoes/categorias-prontuario/${categoriaParaExcluir.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        notifyCatalogoUpdate('categorias_prontuario')
        setCategoriaParaExcluir(null)
        setLoadingAcaoId(null)
      },
      onError: () => {
        setLoadingAcaoId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ações Superior */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar categoria por nome ou slug..."
              className="input text-xs pl-9 w-full"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
            <span className="font-semibold text-stone-900">{totalAtivas}</span> ativas de{' '}
            <span className="font-semibold text-stone-900">{categorias.length}</span> categorias
          </div>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            onClick={handleNovaCategoria}
            className="btn btn-primary btn-sm text-xs gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Nova Categoria do Prontuário</span>
          </button>
        )}
      </div>

      {/* Tabela de Categorias */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base w-full text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-14">Ordem</th>
                <th className="py-2.5 px-3 text-left">Categoria & Badge</th>
                <th className="py-2.5 px-3 text-left">Slug / Identificador</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
                <th className="py-2.5 px-3 text-right w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Bookmark className="w-8 h-8 text-stone-300 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-stone-600">Nenhuma categoria encontrada</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {busca ? 'Tente outros termos de busca.' : 'Cadastre sua primeira categoria de prontuário.'}
                    </p>
                  </td>
                </tr>
              ) : (
                categoriasFiltradas.map((cat) => {
                  const IconComp = (cat.icone && ICONES_DISPONIVEIS[cat.icone]) || User
                  const isLoading = loadingAcaoId === cat.id

                  return (
                    <tr
                      key={cat.id}
                      className={clsx(
                        'hover:bg-stone-50/70 transition-colors',
                        !cat.isActive && 'bg-stone-50/40 opacity-70'
                      )}
                    >
                      <td className="py-3 px-3 text-center font-mono text-stone-500 font-medium">
                        {cat.ordem}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-3xs"
                            style={{
                              backgroundColor: `${cat.cor}18`,
                              color: cat.cor,
                              borderColor: `${cat.cor}40`,
                              borderWidth: 1,
                            }}
                          >
                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                            <span>{cat.nome}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                        {cat.slug}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs transition-colors',
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 rounded-full',
                              cat.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          {cat.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {podeGerenciar && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(cat)}
                                disabled={isLoading}
                                className={clsx(
                                  'p-1.5 rounded-lg border transition-colors cursor-pointer',
                                  cat.isActive
                                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-400'
                                    : 'border-rose-300 text-rose-600 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-400'
                                )}
                                title={
                                  cat.isActive
                                    ? 'Ligado / Ativo (clique para desativar)'
                                    : 'Desligado / Inativo (clique para ativar)'
                                }
                              >
                                <Power size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditarCategoria(cat)}
                                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-primary-700 hover:bg-stone-100 transition-colors"
                                title="Editar categoria"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setCategoriaParaExcluir(cat)}
                                className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Excluir categoria"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
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

      {/* Modal Criar/Editar */}
      <ModalCategoriaProntuario
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categoriaParaEditar={categoriaEmEdicao}
        onSuccessNotification={() => notifyCatalogoUpdate('categorias_prontuario')}
      />

      {/* Modal de Exclusão */}
      {categoriaParaExcluir && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-rose-200 animate-scale-in text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
              <AlertTriangle size={18} />
              <span>Confirmar Exclusão</span>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Deseja realmente remover a categoria <strong>"{categoriaParaExcluir.nome}"</strong>?
              Se houver anotações vinculadas a ela, o sistema solicitará que você a desative em vez de excluir.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoriaParaExcluir(null)}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="btn btn-danger btn-sm text-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
