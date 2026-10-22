import React, { useState, useMemo, useEffect } from 'react'
import { router } from '@inertiajs/react'
import {
  Heart,
  User,
  Users,
  Dog,
  Smile,
  Star,
  Trash2,
  Plus,
  MessageSquare,
  Sparkles,
  Bookmark,
  X,
  Coffee,
  Wine,
  Utensils,
  Gift,
  ExternalLink,
  RotateCw,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import type { ProntuarioItem, CategoriaProntuarioCatalogoItem } from '../types'
import { timeAgo, formatDateTime } from '../../../lib/constants'
import { recarregarCatalogos, useSincronizarCatalogos } from '../../../lib/catalogos'

interface ProntuarioClienteSectionProps {
  clienteId: number
  prontuarios?: ProntuarioItem[]
  categoriasCatalogo?: CategoriaProntuarioCatalogoItem[]
  canManageConfig?: boolean
}

const ICONES_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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

const CATEGORIAS_FALLBACK: CategoriaProntuarioCatalogoItem[] = [
  { id: 1, slug: 'pessoal', nome: 'Pessoal & Hábitos', cor: '#3B82F6', icone: 'User' },
  { id: 2, slug: 'familia', nome: 'Família & Filhos', cor: '#8B5CF6', icone: 'Users' },
  { id: 3, slug: 'pet', nome: 'Pets & Animais', cor: '#F59E0B', icone: 'Dog' },
  { id: 4, slug: 'hobby', nome: 'Hobbies & Lazer', cor: '#10B981', icone: 'Smile' },
  { id: 5, slug: 'preferencia', nome: 'Preferências & Estilo', cor: '#EC4899', icone: 'Heart' },
  { id: 6, slug: 'atendimento', nome: 'Atendimento & CRM', cor: '#6B7280', icone: 'MessageSquare' },
]

export default function ProntuarioClienteSection({
  clienteId,
  prontuarios = [],
  categoriasCatalogo = [],
  canManageConfig = false,
}: ProntuarioClienteSectionProps) {
  // Ouve automaticamente mutações no catálogo via storage, BroadcastChannel e focus
  useSincronizarCatalogos(['categoriasProntuarioCatalogo'])

  const categorias = useMemo(() => {
    return categoriasCatalogo && categoriasCatalogo.length > 0
      ? categoriasCatalogo
      : CATEGORIAS_FALLBACK
  }, [categoriasCatalogo])

  const [formAberto, setFormAberto] = useState(false)
  const [categoria, setCategoria] = useState<string>(() => categorias[0]?.slug || 'pessoal')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [importante, setImportante] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  // Garante que a categoria selecionada seja sempre válida quando as categorias mudarem
  useEffect(() => {
    if (categorias.length > 0 && !categorias.some((c) => c.slug === categoria)) {
      setCategoria(categorias[0].slug)
    }
  }, [categorias, categoria])

  const handleSincronizar = () => {
    setSincronizando(true)
    recarregarCatalogos(['categoriasProntuarioCatalogo'], () => {
      setSincronizando(false)
      toast.info('Categorias sincronizadas com sucesso.')
    })
  }

  const getCategoriaInfo = (slug: string) => {
    const encontrada = categorias.find((c) => c.slug === slug)
    if (encontrada) {
      const IconComponent = (encontrada.icone && ICONES_MAP[encontrada.icone]) || Bookmark
      return {
        nome: encontrada.nome,
        cor: encontrada.cor || '#C8841A',
        Icon: IconComponent,
      }
    }
    return {
      nome: slug.charAt(0).toUpperCase() + slug.slice(1),
      cor: '#6B7280',
      Icon: Bookmark,
    }
  }

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) return

    setLoading(true)
    router.post(
      `/clientes/${clienteId}/prontuario`,
      {
        categoria,
        titulo: titulo.trim() || undefined,
        descricao: descricao.trim(),
        importante,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setDescricao('')
          setTitulo('')
          setImportante(false)
          setFormAberto(false)
          setLoading(false)
        },
        onError: () => setLoading(false),
      }
    )
  }

  const handleExcluir = (prontuarioId: number) => {
    if (!confirm('Deseja realmente remover esta anotação do prontuário?')) return

    router.delete(`/clientes/${clienteId}/prontuario/${prontuarioId}`, {
      preserveScroll: true,
    })
  }

  const itensFiltrados =
    filtroCategoria === 'todas'
      ? prontuarios
      : prontuarios.filter((p) => p.categoria === filtroCategoria)

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary-600" />
              Prontuário de Relacionamento & Observações Pessoais
            </h3>
            {prontuarios.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-800 border border-primary-200">
                {prontuarios.length}
              </span>
            )}
            {canManageConfig && (
              <a
                href="/configuracoes?tab=prontuario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50/90 hover:bg-primary-100 border border-primary-200/80 px-2.5 py-0.5 rounded-md shadow-2xs transition-all ml-1"
                title="Configurar categorias no módulo de Configurações"
              >
                <span>Configurar Categorias</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Fatos pessoais, preferências, hobbies, família, pets e detalhes para encantamento e pós-venda
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFormAberto(!formAberto)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 text-xs font-semibold rounded-xl transition-colors"
          >
            {formAberto ? (
              <>
                <X className="w-3.5 h-3.5" /> Fechar
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Nova Anotação
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulário de Nova Anotação */}
      {formAberto && (
        <form
          onSubmit={handleSalvar}
          className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Registrar Observação de Relacionamento
            </span>
            <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={importante}
                onChange={(e) => setImportante(e.target.checked)}
                className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1 font-medium">
                <Star className={`w-3.5 h-3.5 ${importante ? 'fill-amber-400 text-amber-500' : 'text-stone-400'}`} />
                Destaque / Fato Importante
              </span>
            </label>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>Categoria</span>
                <span className="text-rose-500">*</span>
              </label>

              {canManageConfig && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSincronizar}
                    disabled={sincronizando}
                    className={clsx(
                      'inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md border border-stone-200 transition-colors cursor-pointer',
                      sincronizando && 'opacity-75'
                    )}
                    title="Sincronizar categorias com o catálogo em tempo real"
                  >
                    <RotateCw size={10} className={clsx(sincronizando && 'animate-spin')} />
                    <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>

                  <a
                    href="/configuracoes?tab=prontuario"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline transition-colors bg-primary-50/90 hover:bg-primary-100 px-2 py-0.5 rounded-md border border-primary-200/80 shadow-2xs"
                    title="Abrir gerenciador de categorias em Configurações (em nova aba)"
                  >
                    <span>Configurar</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categorias.map((cat) => {
                const Icon = (cat.icone && ICONES_MAP[cat.icone]) || Bookmark
                const ativo = categoria === cat.slug
                const cor = cat.cor || '#C8841A'

                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setCategoria(cat.slug)}
                    style={
                      ativo
                        ? {
                            backgroundColor: `${cor}20`,
                            color: cor,
                            borderColor: `${cor}60`,
                          }
                        : undefined
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      ativo
                        ? 'ring-2 ring-primary-300/40 font-semibold shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.nome}</span>
                  </button>
                )
              })}

              {canManageConfig && (
                <a
                  href="/configuracoes?tab=prontuario"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:text-primary-700 hover:border-primary-400 hover:bg-primary-50/50 transition-all cursor-pointer"
                  title="Cadastrar ou editar categorias no módulo de Configurações"
                >
                  <Plus size={11} />
                  <span>Nova Categoria</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-stone-600 block mb-1">
                Título do Fato (Opcional)
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Nome dos filhos, Raça do pet, Café..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-600 block mb-1">
              Observação / Detalhe Pessoal *
            </label>
            <textarea
              required
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Tem dois filhos (Lucas de 7 anos e Sofia de 4). A Sofia adora desenho e pediram mesa baixa no quarto. O cliente torce para o Palmeiras e toma café sem açúcar."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !descricao.trim()}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar no Prontuário'}
            </button>
          </div>
        </form>
      )}

      {/* Filtros rápidos se houver anotações */}
      {prontuarios.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-stone-400 font-medium mr-1">Filtrar:</span>
          <button
            type="button"
            onClick={() => setFiltroCategoria('todas')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              filtroCategoria === 'todas'
                ? 'bg-stone-800 text-white border-stone-800'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            Todas ({prontuarios.length})
          </button>
          {categorias.map((cat) => {
            const qtd = prontuarios.filter((p) => p.categoria === cat.slug).length
            if (qtd === 0) return null
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setFiltroCategoria(cat.slug)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  filtroCategoria === cat.slug
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat.nome} ({qtd})
              </button>
            )
          })}
        </div>
      )}

      {/* Lista de Anotações do Prontuário */}
      <div className="space-y-2.5">
        {itensFiltrados.length > 0 ? (
          itensFiltrados.map((item) => {
            const info = getCategoriaInfo(item.categoria)
            const Icon = info.Icon

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.importante
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-stone-50/60 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        backgroundColor: `${info.cor}18`,
                        color: info.cor,
                        borderColor: `${info.cor}40`,
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border"
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {info.nome}
                    </span>

                    {item.importante && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                        Destaque
                      </span>
                    )}

                    {item.leadId && (
                      <span className="px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-700 text-[10px] font-mono">
                        via CRM #{item.leadId}
                      </span>
                    )}

                    {item.titulo && (
                      <span className="text-xs font-semibold text-stone-900">
                        {item.titulo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-stone-400" title={formatDateTime(item.createdAt)}>
                      {timeAgo(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExcluir(item.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-700 mt-2 leading-relaxed whitespace-pre-line">
                  {item.descricao}
                </p>

                <div className="mt-2.5 pt-1.5 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Registrado por: <strong className="text-stone-600">{item.autorNome}</strong></span>
                  <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl bg-stone-50/40">
            <Sparkles className="w-5 h-5 text-stone-300 mx-auto mb-1.5" />
            <p className="font-medium text-stone-600">Nenhuma observação pessoal no prontuário ainda.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Clique em <strong>+ Nova Anotação</strong> ou marque a opção no CRM ao registrar interações para encantar o cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
