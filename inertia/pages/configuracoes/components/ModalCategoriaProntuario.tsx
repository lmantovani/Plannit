import React, { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import {
  X,
  Palette,
  Check,
  User,
  Users,
  Dog,
  Smile,
  Heart,
  MessageSquare,
  Bookmark,
  Sparkles,
  Star,
  Coffee,
  Wine,
  Utensils,
  Gift,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CategoriaProntuarioItem } from '../index'

export const ICONES_DISPONIVEIS: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Users,
  Dog,
  Smile,
  Heart,
  MessageSquare,
  Bookmark,
  Sparkles,
  Star,
  Coffee,
  Wine,
  Utensils,
  Gift,
}

export const CORES_CATEGORIAS = [
  '#3B82F6', // Azul Pavão
  '#10B981', // Verde Manjericão
  '#8B5CF6', // Roxo Uva
  '#F59E0B', // Âmbar Tangerina
  '#EC4899', // Rosa Flamingo
  '#6366F1', // Índigo Mirtilo
  '#06B6D4', // Ciano
  '#14B8A6', // Sálvia / Turquesa
  '#84CC16', // Verde Abacate
  '#EF4444', // Vermelho Tomate
  '#C8841A', // Ouro Líder
  '#6B7280', // Grafite
]

interface ModalCategoriaProntuarioProps {
  isOpen: boolean
  onClose: () => void
  categoriaParaEditar?: CategoriaProntuarioItem | null
  onSuccessNotification?: () => void
}

export default function ModalCategoriaProntuario({
  isOpen,
  onClose,
  categoriaParaEditar,
  onSuccessNotification,
}: ModalCategoriaProntuarioProps) {
  const isEditing = Boolean(categoriaParaEditar)

  const { data, setData, post, put, processing, reset } = useForm({
    nome: '',
    slug: '',
    cor: '#3B82F6',
    icone: 'User',
    ordem: 0,
    isActive: true,
  })

  useEffect(() => {
    if (categoriaParaEditar) {
      setData({
        nome: categoriaParaEditar.nome,
        slug: categoriaParaEditar.slug,
        cor: categoriaParaEditar.cor || '#3B82F6',
        icone: categoriaParaEditar.icone || 'User',
        ordem: categoriaParaEditar.ordem || 0,
        isActive: categoriaParaEditar.isActive,
      })
    } else {
      reset()
    }
  }, [categoriaParaEditar, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && categoriaParaEditar) {
      put(`/configuracoes/categorias-prontuario/${categoriaParaEditar.id}`, {
        onSuccess: () => {
          toast.success(`Categoria "${data.nome}" atualizada com sucesso!`)
          onSuccessNotification?.()
          onClose()
        },
        onError: () => toast.error('Erro ao atualizar categoria de prontuário.'),
      })
    } else {
      post('/configuracoes/categorias-prontuario', {
        onSuccess: () => {
          toast.success(`Categoria "${data.nome}" cadastrada com sucesso!`)
          onSuccessNotification?.()
          reset()
          onClose()
        },
        onError: () => toast.error('Erro ao cadastrar categoria de prontuário.'),
      })
    }
  }

  const IconePreview = ICONES_DISPONIVEIS[data.icone] || User

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-scale-in">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">
              {isEditing ? 'Editar Categoria do Prontuário' : 'Nova Categoria do Prontuário'}
            </h3>
            <p className="text-[11px] text-stone-500">
              Parametrização dinâmica para observações pessoais e encantamento
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Preview ao vivo */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500">Preview do Badge:</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all"
              style={{
                backgroundColor: `${data.cor}18`,
                color: data.cor,
                borderColor: `${data.cor}40`,
                borderWidth: 1,
              }}
            >
              <IconePreview className="w-3.5 h-3.5" />
              <span>{data.nome || 'Nome da Categoria'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome da Categoria *</label>
              <input
                type="text"
                required
                value={data.nome}
                onChange={(e) => setData('nome', e.target.value)}
                placeholder="Ex: Restrições Alimentares, Pets, Hobbies..."
                className="input text-xs"
              />
            </div>

            <div>
              <label className="label">Identificador / Slug (Opcional)</label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => setData('slug', e.target.value)}
                placeholder="Ex: restricoes_alimentares (auto)"
                className="input text-xs font-mono"
              />
            </div>

            <div>
              <label className="label">Ordem de Exibição</label>
              <input
                type="number"
                min={0}
                value={data.ordem}
                onChange={(e) => setData('ordem', Number(e.target.value))}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-1.5">
            <label className="label flex items-center justify-between mb-0">
              <span className="flex items-center gap-1.5">
                <Palette size={13} className="text-primary-600" />
                <span>Cor do Badge</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase">{data.cor}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {CORES_CATEGORIAS.map((corHex) => {
                const isSelected = data.cor.toUpperCase() === corHex.toUpperCase()
                return (
                  <button
                    key={corHex}
                    type="button"
                    onClick={() => setData('cor', corHex)}
                    className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-2xs"
                    style={{ backgroundColor: corHex }}
                    title={corHex}
                  >
                    {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seletor de Ícone */}
          <div className="space-y-1.5">
            <label className="label mb-0">Ícone Representativo</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(ICONES_DISPONIVEIS).map(([nomeIcone, IconeComp]) => {
                const isSelected = data.icone === nomeIcone
                return (
                  <button
                    key={nomeIcone}
                    type="button"
                    onClick={() => setData('icone', nomeIcone)}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-2xs ring-2 ring-primary-300/40'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                    title={nomeIcone}
                  >
                    <IconeComp className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Toggle Ativo */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.isActive}
                onChange={(e) => setData('isActive', e.target.checked)}
                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-stone-800">Categoria Ativa no Catálogo</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processing || !data.nome.trim()}
                className="btn btn-primary btn-sm text-xs"
              >
                {processing ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Categoria'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
