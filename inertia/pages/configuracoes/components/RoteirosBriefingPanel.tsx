import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Power,
  Search,
  Layers,
  HelpCircle,
  AlertTriangle,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import ModalRoteiroBriefing, { type RoteiroBriefingItem } from './ModalRoteiroBriefing'
import type { AmbienteItem } from '../index'

interface RoteirosBriefingPanelProps {
  roteiros: RoteiroBriefingItem[]
  ambientes: AmbienteItem[]
  podeGerenciar: boolean
}

export default function RoteirosBriefingPanel({
  roteiros = [],
  ambientes = [],
  podeGerenciar,
}: RoteirosBriefingPanelProps) {
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [roteiroEmEdicao, setRoteiroEmEdicao] = useState<RoteiroBriefingItem | null>(null)
  const [roteiroParaExcluir, setRoteiroParaExcluir] = useState<RoteiroBriefingItem | null>(null)
  const [loadingAcaoId, setLoadingAcaoId] = useState<number | null>(null)

  // Filtra roteiros por título, subtítulo ou ambiente atendido
  const roteirosFiltrados = useMemo(() => {
    if (!busca.trim()) return roteiros
    const termo = busca.toLowerCase()
    return roteiros.filter(
      (r) =>
        r.titulo.toLowerCase().includes(termo) ||
        (r.subtitulo && r.subtitulo.toLowerCase().includes(termo)) ||
        r.ambientes.some((a) => a.toLowerCase().includes(termo))
    )
  }, [roteiros, busca])

  const totalAtivos = useMemo(() => roteiros.filter((r) => r.isActive).length, [roteiros])

  // Abertura de Modais
  const handleNovoRoteiro = () => {
    setRoteiroEmEdicao(null)
    setModalOpen(true)
  }

  const handleEditarRoteiro = (roteiro: RoteiroBriefingItem) => {
    setRoteiroEmEdicao(roteiro)
    setModalOpen(true)
  }

  // Alternar Ativo/Inativo
  const handleToggleStatus = (roteiro: RoteiroBriefingItem) => {
    setLoadingAcaoId(roteiro.id)
    router.patch(
      `/configuracoes/roteiros/${roteiro.id}/toggle`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setLoadingAcaoId(null)
          toast.success(
            `Roteiro "${roteiro.titulo}" ${!roteiro.isActive ? 'ativado' : 'desativado'} com sucesso.`
          )
        },
        onError: () => {
          setLoadingAcaoId(null)
          toast.error('Não foi possível alterar o status do roteiro.')
        },
      }
    )
  }

  // Exclusão de Roteiro
  const handleConfirmarExclusao = () => {
    if (!roteiroParaExcluir) return

    setLoadingAcaoId(roteiroParaExcluir.id)
    router.delete(`/configuracoes/roteiros/${roteiroParaExcluir.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setLoadingAcaoId(null)
        setRoteiroParaExcluir(null)
        toast.success(`Roteiro "${roteiroParaExcluir.titulo}" excluído com sucesso.`)
      },
      onError: () => {
        setLoadingAcaoId(null)
        toast.error('Erro ao excluir o roteiro.')
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">Roteiros Técnicos de Apoio</h2>
            <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded-full border border-primary-200">
              {totalAtivos} ativos de {roteiros.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Gerencie o guia de investigação técnica e estratégica consultado pelos vendedores e
            projetistas durante o preenchimento do briefing. Cada roteiro pode ser vinculado a um ou
            múltiplos ambientes.
          </p>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            onClick={handleNovoRoteiro}
            className="btn-primary text-xs flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Roteiro
          </button>
        )}
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, subtítulo ou ambiente atendido..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs text-stone-500">
          Exibindo {roteirosFiltrados.length} de {roteiros.length} roteiro(s)
        </span>
      </div>

      {/* Lista de Roteiros */}
      {roteirosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200 p-6">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-700">Nenhum roteiro encontrado</h3>
          <p className="text-xs text-stone-500 mt-1">
            {busca
              ? 'Nenhum resultado corresponde aos termos da pesquisa.'
              : 'Nenhum roteiro técnico de apoio foi cadastrado até o momento.'}
          </p>
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="mt-3 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roteirosFiltrados.map((roteiro) => {
            const isLoading = loadingAcaoId === roteiro.id
            return (
              <div
                key={roteiro.id}
                className={clsx(
                  'bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md',
                  roteiro.isActive ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50/50'
                )}
              >
                {/* Topo do Card */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          roteiro.isActive
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'bg-stone-100 text-stone-400'
                        )}
                      >
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 leading-tight">
                          {roteiro.titulo}
                        </h3>
                        {roteiro.subtitulo && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {roteiro.subtitulo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider',
                        roteiro.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      )}
                    >
                      {roteiro.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Ambientes Vinculados */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-stone-400" />
                      Ambientes Atendidos ({roteiro.ambientes.length})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {roteiro.ambientes.length > 0 ? (
                        roteiro.ambientes.map((amb, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200"
                          >
                            {amb}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-amber-600 italic">
                          Nenhum ambiente vinculado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total de Seções */}
                  <div className="flex items-center gap-3 pt-1 text-xs text-stone-500 border-t border-stone-100">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-700">{roteiro.totalSecoes}</strong> seções de
                      análise
                    </span>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(roteiro)}
                    disabled={isLoading || !podeGerenciar}
                    className={clsx(
                      'text-xs font-semibold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 border',
                      roteiro.isActive
                        ? 'text-stone-600 bg-white border-stone-200 hover:bg-stone-100'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    )}
                    title={roteiro.isActive ? 'Desativar roteiro' : 'Ativar roteiro'}
                  >
                    <Power className="w-3 h-3" />
                    {roteiro.isActive ? 'Desativar' : 'Ativar'}
                  </button>

                  {podeGerenciar && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditarRoteiro(roteiro)}
                        disabled={isLoading}
                        className="p-1.5 text-stone-600 hover:text-primary-700 hover:bg-white rounded-md border border-transparent hover:border-stone-200 transition-colors"
                        title="Editar roteiro"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoteiroParaExcluir(roteiro)}
                        disabled={isLoading}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-white rounded-md border border-transparent hover:border-red-200 transition-colors"
                        title="Excluir roteiro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <ModalRoteiroBriefing
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          roteiroParaEditar={roteiroEmEdicao}
          ambientesDisponiveis={ambientes}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {roteiroParaExcluir && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Excluir Roteiro de Apoio</h3>
                  <p className="text-xs text-stone-500">Esta ação não poderá ser desfeita.</p>
                </div>
              </div>

              <p className="text-sm text-stone-700">
                Tem certeza que deseja excluir o roteiro{' '}
                <strong className="text-stone-900">"{roteiroParaExcluir.titulo}"</strong>? Os
                ambientes associados a ele não terão mais este guia disponível na barra lateral do
                briefing.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRoteiroParaExcluir(null)}
                  className="btn-secondary text-xs px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 font-medium text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  className="btn-danger text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
