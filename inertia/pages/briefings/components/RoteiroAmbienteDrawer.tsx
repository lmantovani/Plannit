import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  X,
  Search,
  Copy,
  Check,
  Plus,
  BookOpen,
  Sparkles,
  Heart,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Info,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import {
  ROTEIROS_BRIEFINGS,
  LISTA_ROTEIROS,
  resolverSlugAmbiente,
  type RoteiroAmbiente,
  type SecaoRoteiro,
  type BlocoSecao,
  normalizarNomeAmbiente,
  obterTextoCompletoSecao,
} from '../../../lib/roteiros_briefings'

export interface RoteiroCatalogoItem {
  id: number
  slug: string
  titulo: string
  subtitulo: string | null
  secoes: any[]
  ambientes: string[]
}

export interface RoteiroAmbienteDrawerProps {
  isOpen: boolean
  onClose: () => void
  ambienteInicial?: string | null
  ambientesBriefing?: string[]
  roteirosCatalogo?: RoteiroCatalogoItem[]
  onInserirTexto?: (
    texto: string,
    ambiente?: { slug: string; titulo: string; isTituloSecao?: boolean }
  ) => void
  onAmbienteChange?: (slug: string, titulo: string) => void
  triggerKey?: number | string
}

export const RoteiroAmbienteDrawer: React.FC<RoteiroAmbienteDrawerProps> = ({
  isOpen,
  onClose,
  ambienteInicial,
  ambientesBriefing = [],
  roteirosCatalogo,
  onInserirTexto,
  onAmbienteChange,
  triggerKey,
}) => {
  const [slugAtivo, setSlugAtivo] = useState<string>('living')
  const [termoBusca, setTermoBusca] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [itemInseridoId, setItemInseridoId] = useState<string | null>(null)
  const [secoesRecolhidas, setSecoesRecolhidas] = useState<Record<string, boolean>>({})

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Converte roteiros vindos do banco de dados para o modelo RoteiroAmbiente
  const { bancoRoteirosMap, ambienteParaSlugMap, listaRoteirosAtivos } = useMemo(() => {
    const bMap: Record<string, RoteiroAmbiente> = {}
    const aMap: Record<string, string> = {}
    const lista: Array<{ slug: string; titulo: string; subtitulo: string; ambientes: string[] }> = []

    if (roteirosCatalogo && roteirosCatalogo.length > 0) {
      for (const r of roteirosCatalogo) {
        const secoesConvertidas: SecaoRoteiro[] = (r.secoes || []).map((s: any, idx: number) => {
          const itens: string[] = Array.isArray(s.itens) ? s.itens : []
          const perguntasDestaque = Array.isArray(s.perguntasDestaque) ? s.perguntasDestaque : []
          const blocos = Array.isArray(s.blocos) ? s.blocos : []
          return {
            id: s.id || `secao_${idx + 1}`,
            titulo: s.titulo || `Seção ${idx + 1}`,
            itens,
            perguntasDestaque,
            conteudoLinhas: itens,
            blocos,
          }
        })

        const roteiroObj: RoteiroAmbiente = {
          slug: r.slug,
          titulo: r.titulo,
          subtitulo: r.subtitulo || '',
          arquivoPdfOriginal: '',
          secoes: secoesConvertidas,
          perguntasEstrategicas: secoesConvertidas.flatMap((s) => s.perguntasDestaque || []),
          topicosChecagemTecnica: secoesConvertidas.flatMap((s) => s.itens || []),
        }

        bMap[r.slug] = roteiroObj
        lista.push({
          slug: r.slug,
          titulo: r.titulo,
          subtitulo: r.subtitulo || '',
          ambientes: r.ambientes || [],
        })

        // Vincula cada ambiente associado a este roteiro (case/acentos insensíveis)
        if (Array.isArray(r.ambientes)) {
          for (const amb of r.ambientes) {
            const ambNorm = normalizarNomeAmbiente(amb)
            aMap[ambNorm] = r.slug
          }
        }
      }
    }

    return {
      bancoRoteirosMap: bMap,
      ambienteParaSlugMap: aMap,
      listaRoteirosAtivos: lista,
    }
  }, [roteirosCatalogo])

  // Resolve slug com base nos ambientes cadastrados no banco ou fallback
  const resolverSlug = (nome: string): string => {
    const nomeNorm = normalizarNomeAmbiente(nome)
    if (ambienteParaSlugMap[nomeNorm]) {
      return ambienteParaSlugMap[nomeNorm]
    }
    return resolverSlugAmbiente(nome)
  }

  // Quando ambienteInicial ou triggerKey mudar e o drawer abrir ou for reaberto, resolve o slug correto e limpa a busca
  useEffect(() => {
    if (ambienteInicial) {
      const slugResolvido = resolverSlug(ambienteInicial)
      setSlugAtivo(slugResolvido)
      setTermoBusca('')
    }
  }, [ambienteInicial, isOpen, triggerKey, ambienteParaSlugMap])

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Se fechar, limpa a busca
  useEffect(() => {
    if (!isOpen) {
      setTermoBusca('')
    }
  }, [isOpen])

  // Prioriza roteiro personalizado do banco de dados, com fallback para o estático
  const roteiro: RoteiroAmbiente = useMemo(() => {
    if (bancoRoteirosMap[slugAtivo]) {
      return bancoRoteirosMap[slugAtivo]
    }
    return ROTEIROS_BRIEFINGS[slugAtivo] || ROTEIROS_BRIEFINGS['living']
  }, [slugAtivo, bancoRoteirosMap])

  // Troca de ambiente com notificação ao componente pai
  const handleSelectAmbiente = (novoSlug: string) => {
    setSlugAtivo(novoSlug)
    setTermoBusca('')
    const novoRoteiro = bancoRoteirosMap[novoSlug] || ROTEIROS_BRIEFINGS[novoSlug]
    if (novoRoteiro && onAmbienteChange) {
      onAmbienteChange(novoSlug, novoRoteiro.titulo)
    }
  }

  // Fallback seguro de cópia para a área de transferência compatível com HTTP/HTTPS/iframes
  const fallbackCopyText = (texto: string, callback?: () => void) => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = texto
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (successful) {
        callback?.()
      } else {
        toast.error('Não foi possível copiar o texto automaticamente.')
      }
    } catch {
      toast.error('Não foi possível copiar o texto.')
    }
  }

  // Copia texto para a área de transferência com feedback
  const handleCopiarTexto = (texto: string, id: string, rotuloAcao = 'Texto') => {
    if (!texto) return
    const onSucesso = () => {
      setCopiadoId(id)
      toast.success(`${rotuloAcao} copiado para a área de transferência!`)
      setTimeout(() => setCopiadoId(null), 2000)
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(texto)
        .then(onSucesso)
        .catch(() => fallbackCopyText(texto, onSucesso))
    } else {
      fallbackCopyText(texto, onSucesso)
    }
  }

  // Insere um item diretamente no campo selecionado do formulário com feedback visual imediato
  const handleAdicionarItem = (itemTexto: string, id: string) => {
    if (!itemTexto) return
    if (onInserirTexto) {
      setItemInseridoId(id)
      onInserirTexto(itemTexto, {
        slug: slugAtivo,
        titulo: roteiro.titulo,
        isTituloSecao: false,
      })
      setTimeout(() => {
        setItemInseridoId((current) => (current === id ? null : current))
      }, 1500)
    } else {
      handleCopiarTexto(itemTexto, id, 'Item')
    }
  }

  // Alterna colapso de uma seção
  const toggleSecao = (id: string) => {
    setSecoesRecolhidas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Filtragem de seções pelo termo digitado (título, blocos, perguntas e itens)
  const secoesFiltradas = useMemo(() => {
    const query = normalizarNomeAmbiente(termoBusca)
    if (!query) {
      return roteiro.secoes
    }

    const matchTexto = (str: string) => normalizarNomeAmbiente(str).includes(query)

    const secoes = roteiro.secoes
      .map((sec) => {
        const matchesTitulo = matchTexto(sec.titulo)
        const itensFiltrados = sec.itens.filter((item) => matchTexto(item))
        const perguntasDestaqueFiltradas = sec.perguntasDestaque.filter(
          (p) => matchTexto(p.pergunta) || matchTexto(p.rotulo)
        )
        const matchesLinhas = sec.conteudoLinhas.some((linha) => matchTexto(linha))

        // Filtrar blocos preservando os correspondentes
        const blocosFiltrados = (sec.blocos || [])
          .map((bloco) => {
            if (matchesTitulo) return bloco
            const matchPrompt = bloco.texto && matchTexto(bloco.texto)
            const matchRotulo = bloco.rotulo && matchTexto(bloco.rotulo)
            const itensMatch = (bloco.itens || []).filter((it) => matchTexto(it))
            if (matchPrompt || matchRotulo || itensMatch.length > 0) {
              return {
                ...bloco,
                itens: matchPrompt || matchRotulo ? bloco.itens : itensMatch,
              }
            }
            return null
          })
          .filter(Boolean) as BlocoSecao[]

        if (
          matchesTitulo ||
          itensFiltrados.length > 0 ||
          perguntasDestaqueFiltradas.length > 0 ||
          matchesLinhas ||
          blocosFiltrados.length > 0
        ) {
          return {
            ...sec,
            itens: matchesTitulo ? sec.itens : itensFiltrados,
            perguntasDestaque: matchesTitulo ? sec.perguntasDestaque : perguntasDestaqueFiltradas,
            blocos: matchesTitulo ? sec.blocos : blocosFiltrados,
          }
        }
        return null
      })
      .filter(Boolean) as SecaoRoteiro[]

    return secoes
  }, [roteiro, termoBusca])

  if (!isOpen) return null

  // Ícone e estilo para tipo de pergunta estratégica
  const renderIconePergunta = (tipo: string) => {
    switch (tipo) {
      case 'emocional':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />
      case 'estrategica':
      case 'chave':
      case 'essencial':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      case 'profunda':
      case 'experiencia':
        return <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
    }
  }

  // Lista de ambientes do briefing que mapeiam para guias existentes (para atalhos rápidos)
  const atalhosBriefing = ambientesBriefing
    .map((nome) => ({
      nome,
      slug: resolverSlug(nome),
    }))
    .filter((a, idx, self) => self.findIndex((s) => s.slug === a.slug) === idx)

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 pointer-events-none flex justify-end"
      role="region"
      aria-label={`Guia Técnico de Apoio - ${roteiro.titulo}`}
    >
      {/* Drawer lateral direito (não-modal: permite interagir e selecionar o formulário à esquerda) */}
      <div className="w-full sm:w-[500px] lg:w-[540px] h-full bg-white shadow-2xl border-l border-stone-200 pointer-events-auto flex flex-col animate-slide-in-right">
        {/* Topbar: Badge + Botão Fechar */}
        <div className="px-5 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-200 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-primary-700" />
              Guia Técnico Plannit
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              {roteiro.titulo}
            </span>
            <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
              {listaRoteirosAtivos.length > 0 ? `${listaRoteirosAtivos.length} Roteiros` : '18 Roteiros'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
            title="Fechar guia (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor do Ambiente (Dropdown com todos os roteiros) */}
        <div className="px-5 py-3 border-b border-stone-200 bg-white space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Selecione o Ambiente para Consulta:
            </label>
            <div className="relative">
              <select
                value={slugAtivo}
                onChange={(e) => handleSelectAmbiente(e.target.value)}
                className="w-full text-xs font-semibold text-stone-900 bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer"
              >
                {atalhosBriefing.length > 0 && (
                  <optgroup label="Ambientes neste Projeto">
                    {atalhosBriefing.map((a) => (
                      <option key={`proj_${a.slug}`} value={a.slug}>
                        ★ {a.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={listaRoteirosAtivos.length > 0 ? 'Roteiros de Apoio Cadastrados' : 'Todos os 18 Roteiros Técnicos'}>
                  {(listaRoteirosAtivos.length > 0 ? listaRoteirosAtivos : LISTA_ROTEIROS).map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.titulo}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Subtítulo / Resumo do Roteiro Ativo */}
          <div className="pt-1">
            <h2 className="text-sm font-bold text-stone-900">{roteiro.titulo}</h2>
            <p className="text-xs text-stone-500 leading-snug mt-0.5">{roteiro.subtitulo}</p>
          </div>
        </div>

        {/* Barra de Busca em Tempo Real */}
        <div className="px-5 py-2.5 border-b border-stone-200/80 bg-stone-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder={`Buscar perguntas ou itens em ${roteiro.titulo}...`}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-stone-400 transition-shadow"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo Rolável Principal — Focado Exclusivamente nas Seções */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/40">
          {termoBusca && (
            <div className="flex items-center justify-between text-xs text-stone-500 bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <span>
                Resultados para <strong className="text-stone-800">"{termoBusca}"</strong>:{' '}
                {secoesFiltradas.length}{' '}
                {secoesFiltradas.length === 1 ? 'seção encontrada' : 'seções encontradas'}
              </span>
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="text-primary-600 hover:underline text-[11px] font-medium cursor-pointer"
              >
                Limpar
              </button>
            </div>
          )}

          {/* VAZIO: nada encontrado na busca de seções */}
          {secoesFiltradas.length === 0 && (
            <div className="p-8 text-center bg-white border border-dashed border-stone-200 rounded-xl space-y-2">
              <Layers className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-sm font-semibold text-stone-800">Nenhuma seção encontrada</h3>
              <p className="text-xs text-stone-500">
                {termoBusca
                  ? `Nenhuma seção em ${roteiro.titulo} corresponde a "${termoBusca}".`
                  : `Não há seções cadastradas para ${roteiro.titulo}.`}
              </p>
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  className="mt-2 text-xs font-medium text-primary-700 hover:underline cursor-pointer"
                >
                  Limpar busca e ver todo o roteiro
                </button>
              )}
            </div>
          )}

          {/* SEÇÕES ESTRUTURADAS DO MANUAL */}
          {secoesFiltradas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-700" />
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-800 font-sans">
                    Roteiro Completo por Seções ({secoesFiltradas.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const todosFechados = secoesFiltradas.reduce((acc, s) => {
                        acc[s.id] = true
                        return acc
                      }, {} as Record<string, boolean>)
                      setSecoesRecolhidas(todosFechados)
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    Recolher todos
                  </button>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSecoesRecolhidas({})}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    Expandir todos
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {secoesFiltradas.map((secao) => {
                  const isRecolhida = secoesRecolhidas[secao.id]
                  const secaoCopyId = `sec_copy_${secao.id}`
                  const foiCopiado = copiadoId === secaoCopyId

                  return (
                    <div
                      key={secao.id}
                      className="bg-white border border-stone-200/90 rounded-xl overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                    >
                      {/* Cabeçalho da Seção */}
                      <div
                        onClick={() => toggleSecao(secao.id)}
                        className="p-3.5 bg-stone-50/70 hover:bg-stone-100/70 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                          <h4 className="font-semibold text-xs text-stone-900 leading-snug">
                            {secao.titulo}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onInserirTexto && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onInserirTexto(secao.titulo, {
                                  slug: slugAtivo,
                                  titulo: roteiro.titulo,
                                  isTituloSecao: true,
                                })
                              }}
                              className="px-2 py-1 bg-stone-700 hover:bg-stone-900 text-white text-[11px] font-medium rounded-md shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Inserir apenas o título desta seção no detalhamento do ambiente"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Inserir</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const textoSecao = obterTextoCompletoSecao(secao)
                              handleCopiarTexto(textoSecao, secaoCopyId, 'Seção completa')
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                            title="Copiar texto completo desta seção"
                          >
                            {foiCopiado ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="text-stone-400">
                            {isRecolhida ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo da Seção */}
                      {!isRecolhida && (
                        <div className="p-4 space-y-4 border-t border-stone-100 bg-white">
                          {/* Renderização estruturada de Blocos (quando presentes) */}
                          {secao.blocos && secao.blocos.length > 0 ? (
                            <div className="space-y-3.5">
                              {secao.blocos.map((bloco, bIdx) => {
                                const blocoId = `b_${secao.id}_${bIdx}`
                                const blocoCopiado = copiadoId === blocoId

                                if (bloco.tipo === 'pergunta_destaque') {
                                  return (
                                    <div
                                      key={blocoId}
                                      className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase">
                                            {renderIconePergunta(bloco.tipoPergunta || 'estrategica')}
                                            <span>{bloco.rotulo}</span>
                                          </div>
                                          <p className="font-semibold text-xs text-stone-900 mt-0.5 leading-snug">
                                            "{bloco.texto}"
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCopiarTexto(
                                                bloco.texto || '',
                                                blocoId,
                                                'Pergunta'
                                              )
                                            }
                                            className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-amber-100/60 transition-colors cursor-pointer"
                                            title="Copiar pergunta"
                                          >
                                            {blocoCopiado ? (
                                              <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                          {onInserirTexto && bloco.texto && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                onInserirTexto(bloco.texto!, {
                                                  slug: slugAtivo,
                                                  titulo: roteiro.titulo,
                                                  isTituloSecao: false,
                                                })
                                              }}
                                              className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-medium rounded shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                              title="Inserir esta pergunta no detalhamento"
                                            >
                                              <Plus className="w-3 h-3" />
                                              <span>Inserir</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Opções associadas à pergunta destaque (adicionam diretamente ao texto) */}
                                      {bloco.itens && bloco.itens.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                          {bloco.itens.map((item, itemIdx) => {
                                            const itemId = `it_${blocoId}_${itemIdx}`
                                            const itemInserido = itemInseridoId === itemId
                                            return (
                                              <div
                                                key={itemId}
                                                onClick={() => handleAdicionarItem(item, itemId)}
                                                className={clsx(
                                                  'group flex items-center justify-between gap-1.5 p-1.5 rounded-lg text-xs transition-all cursor-pointer border shadow-2xs select-none',
                                                  itemInserido
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                    : 'bg-white hover:bg-amber-50/80 border-amber-100 hover:border-amber-300 text-stone-700'
                                                )}
                                                title="Clique para adicionar este item ao detalhamento do ambiente"
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span
                                                    className={clsx(
                                                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                      itemInserido ? 'bg-emerald-500' : 'bg-amber-500'
                                                    )}
                                                  />
                                                  <span className="truncate">{item}</span>
                                                </div>
                                                <span
                                                  className={clsx(
                                                    'flex items-center justify-center w-4 h-4 rounded transition-all',
                                                    itemInserido
                                                      ? 'text-emerald-700 bg-emerald-100 opacity-100'
                                                      : 'text-stone-400 group-hover:text-amber-800 group-hover:bg-amber-100/70 opacity-60 group-hover:opacity-100'
                                                  )}
                                                >
                                                  {itemInserido ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                                  ) : (
                                                    <Plus className="w-3.5 h-3.5" />
                                                  )}
                                                </span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }

                                if (bloco.tipo === 'prompt') {
                                  const isQuestion = bloco.texto?.endsWith('?')
                                  const temTexto = Boolean(bloco.texto?.trim())
                                  return (
                                    <div key={blocoId} className="space-y-1.5 pt-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <h5 className="font-semibold text-xs text-stone-800 leading-snug">
                                          {bloco.texto}
                                        </h5>
                                        {temTexto && (
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleCopiarTexto(
                                                  bloco.texto || '',
                                                  blocoId,
                                                  isQuestion ? 'Pergunta' : 'Tópico'
                                                )
                                              }
                                              className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                              title={isQuestion ? 'Copiar pergunta' : 'Copiar tópico'}
                                            >
                                              {blocoCopiado ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                              ) : (
                                                <Copy className="w-3 h-3" />
                                              )}
                                            </button>
                                            {onInserirTexto && bloco.texto && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  onInserirTexto(bloco.texto!, {
                                                    slug: slugAtivo,
                                                    titulo: roteiro.titulo,
                                                    isTituloSecao: false,
                                                  })
                                                }}
                                                className="px-1.5 py-0.5 bg-stone-700 hover:bg-stone-900 text-white text-[10px] font-medium rounded shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                                title="Inserir no detalhamento"
                                              >
                                                <Plus className="w-3 h-3" />
                                                <span>Inserir</span>
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Opções associadas ao prompt (adicionam diretamente ao texto) */}
                                      {bloco.itens && bloco.itens.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          {bloco.itens.map((item, itemIdx) => {
                                            const itemId = `it_${blocoId}_${itemIdx}`
                                            const itemInserido = itemInseridoId === itemId
                                            return (
                                              <div
                                                key={itemId}
                                                onClick={() => handleAdicionarItem(item, itemId)}
                                                className={clsx(
                                                  'group flex items-center justify-between gap-1.5 p-1.5 rounded-lg text-xs transition-all cursor-pointer border border-stone-200/70 shadow-2xs select-none',
                                                  itemInserido
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                                                )}
                                                title="Clique para adicionar este item ao detalhamento do ambiente"
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span
                                                    className={clsx(
                                                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                      itemInserido ? 'bg-emerald-500' : 'bg-stone-400'
                                                    )}
                                                  />
                                                  <span className="truncate">{item}</span>
                                                </div>
                                                <span
                                                  className={clsx(
                                                    'flex items-center justify-center w-4 h-4 rounded transition-all',
                                                    itemInserido
                                                      ? 'text-emerald-700 bg-emerald-100 opacity-100'
                                                      : 'text-stone-400 group-hover:text-primary-700 group-hover:bg-stone-200/60 opacity-60 group-hover:opacity-100'
                                                  )}
                                                >
                                                  {itemInserido ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                                  ) : (
                                                    <Plus className="w-3.5 h-3.5" />
                                                  )}
                                                </span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }

                                if (bloco.tipo === 'nota') {
                                  return (
                                    <div
                                      key={blocoId}
                                      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900"
                                    >
                                      <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <span className="leading-snug">{bloco.texto}</span>
                                    </div>
                                  )
                                }

                                if (bloco.tipo === 'itens' && bloco.itens && bloco.itens.length > 0) {
                                  return (
                                    <div key={blocoId} className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {bloco.itens.map((item, itemIdx) => {
                                        const itemId = `it_${blocoId}_${itemIdx}`
                                        const itemInserido = itemInseridoId === itemId
                                        return (
                                          <div
                                            key={itemId}
                                            onClick={() => handleAdicionarItem(item, itemId)}
                                            className={clsx(
                                              'group flex items-center justify-between gap-1.5 p-1.5 rounded-lg text-xs transition-all cursor-pointer border border-stone-200/70 shadow-2xs select-none',
                                              itemInserido
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                                            )}
                                            title="Clique para adicionar este item ao detalhamento do ambiente"
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span
                                                className={clsx(
                                                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                  itemInserido ? 'bg-emerald-500' : 'bg-stone-400'
                                                )}
                                              />
                                              <span className="truncate">{item}</span>
                                            </div>
                                            <span
                                              className={clsx(
                                                'flex items-center justify-center w-4 h-4 rounded transition-all',
                                                itemInserido
                                                  ? 'text-emerald-700 bg-emerald-100 opacity-100'
                                                  : 'text-stone-400 group-hover:text-primary-700 group-hover:bg-stone-200/60 opacity-60 group-hover:opacity-100'
                                              )}
                                            >
                                              {itemInserido ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                              ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                              )}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                }

                                if (bloco.tipo === 'texto') {
                                  return (
                                    <p key={blocoId} className="text-xs text-stone-700 leading-relaxed">
                                      {bloco.texto}
                                    </p>
                                  )
                                }

                                return null
                              })}
                            </div>
                          ) : (
                            /* Fallback caso não haja blocos pré-calculados */
                            <div className="space-y-3">
                              {secao.perguntasDestaque.length > 0 && (
                                <div className="space-y-1.5">
                                  {secao.perguntasDestaque.map((q, qIdx) => (
                                    <div
                                      key={`sec_q_${qIdx}`}
                                      className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs"
                                    >
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase">
                                        {renderIconePergunta(q.tipo)}
                                        <span>{q.rotulo}</span>
                                      </div>
                                      <p className="font-semibold text-stone-900 mt-0.5">
                                        "{q.pergunta}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {secao.itens.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {secao.itens.map((item, itemIdx) => {
                                    const itemId = `item_${secao.id}_${itemIdx}`
                                    const itemInserido = itemInseridoId === itemId

                                    return (
                                      <div
                                        key={itemId}
                                        onClick={() => handleAdicionarItem(item, itemId)}
                                        className={clsx(
                                          'group flex items-center justify-between gap-1.5 p-1.5 rounded-md text-xs transition-colors cursor-pointer select-none',
                                          itemInserido
                                            ? 'bg-emerald-50 text-emerald-900 font-medium'
                                            : 'hover:bg-stone-100/80 text-stone-700'
                                        )}
                                        title="Clique para adicionar este item ao detalhamento do ambiente"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span
                                            className={clsx(
                                              'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                              itemInserido ? 'bg-emerald-500' : 'bg-stone-400'
                                            )}
                                          />
                                          <span className="truncate">{item}</span>
                                        </div>
                                        <span
                                          className={clsx(
                                            'flex items-center justify-center w-4 h-4 rounded transition-all',
                                            itemInserido
                                              ? 'text-emerald-700 bg-emerald-100 opacity-100'
                                              : 'text-stone-400 group-hover:text-primary-700 opacity-60 group-hover:opacity-100'
                                          )}
                                        >
                                          {itemInserido ? (
                                            <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                                          ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                          )}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {secao.itens.length === 0 && secao.perguntasDestaque.length === 0 && (
                                <div className="text-xs text-stone-700 space-y-1">
                                  {secao.conteudoLinhas.map((linha, lIdx) => (
                                    <p key={lIdx} className="leading-relaxed">
                                      {linha}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Drawer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] leading-tight">
              Dica: Clique em qualquer item ou no botão Inserir para adicionar à descrição do ambiente selecionado.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoteiroAmbienteDrawer
