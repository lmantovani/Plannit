import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { router } from '@inertiajs/react'
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  AlertCircle,
  Heart,
  Sparkles,
  Lightbulb,
  Tag,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import type { AmbienteItem } from '../index'

export type TipoPerguntaBloco = 'geral' | 'emocional' | 'estrategica' | 'chave' | 'pratica'

export interface BlocoPerguntaForm {
  id: string
  tipo: TipoPerguntaBloco
  texto: string
  itens: string[]
}

export interface RoteiroSecaoForm {
  id: string
  titulo: string
  blocos: BlocoPerguntaForm[]
}

export interface RoteiroBriefingItem {
  id: number
  slug: string
  titulo: string
  subtitulo: string | null
  secoes: any[]
  isActive: boolean
  ordem: number
  ambientes: string[]
  totalSecoes: number
  createdAt: string | null
  updatedAt: string | null
}

interface ModalRoteiroBriefingProps {
  isOpen: boolean
  onClose: () => void
  roteiroParaEditar?: RoteiroBriefingItem | null
  ambientesDisponiveis: AmbienteItem[]
}

const TIPOS_PERGUNTA: Array<{
  valor: TipoPerguntaBloco
  rotulo: string
  icone: any
  corBadge: string
}> = [
  {
    valor: 'geral',
    rotulo: 'Funcional / Rotina',
    icone: HelpCircle,
    corBadge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  {
    valor: 'emocional',
    rotulo: 'Emocional ♡',
    icone: Heart,
    corBadge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    valor: 'estrategica',
    rotulo: 'Estratégica ✦',
    icone: Sparkles,
    corBadge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    valor: 'chave',
    rotulo: 'Chave 💡',
    icone: Lightbulb,
    corBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
]

export default function ModalRoteiroBriefing({
  isOpen,
  onClose,
  roteiroParaEditar,
  ambientesDisponiveis,
}: ModalRoteiroBriefingProps) {
  const isEditing = !!roteiroParaEditar

  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [ordem, setOrdem] = useState(0)
  const [ambientesSelecionados, setAmbientesSelecionados] = useState<string[]>([])
  const [secoes, setSecoes] = useState<RoteiroSecaoForm[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [secaoExpandida, setSecaoExpandida] = useState<number | null>(0)
  const [novaOpcaoInputs, setNovaOpcaoInputs] = useState<Record<string, string>>({})

  // Preenche dados ao abrir/editar
  useEffect(() => {
    if (roteiroParaEditar) {
      setTitulo(roteiroParaEditar.titulo || '')
      setSubtitulo(roteiroParaEditar.subtitulo || '')
      setOrdem(roteiroParaEditar.ordem || 0)
      setAmbientesSelecionados(roteiroParaEditar.ambientes || [])

      const secoesArray = Array.isArray(roteiroParaEditar.secoes) ? roteiroParaEditar.secoes : []
      if (secoesArray.length > 0) {
        setSecoes(
          secoesArray.map((s: any, idx: number) => {
            const secaoId = s.id || `secao_${idx + 1}`
            const secaoTitulo = s.titulo || `Seção ${idx + 1}`

            // Se possui blocos estruturados ricos (com perguntas e opções associadas)
            if (Array.isArray(s.blocos) && s.blocos.length > 0) {
              const blocosConvertidos: BlocoPerguntaForm[] = s.blocos.map(
                (b: any, bIdx: number) => {
                  let tipo: TipoPerguntaBloco = 'geral'
                  if (b.tipo === 'pergunta_destaque') {
                    tipo = b.tipoPergunta || 'estrategica'
                  }

                  const itensBloco: string[] = Array.isArray(b.itens) ? b.itens : []
                  return {
                    id: `bloco_${secaoId}_${bIdx}`,
                    tipo,
                    texto: b.texto || '',
                    itens: itensBloco,
                  }
                }
              )

              return {
                id: secaoId,
                titulo: secaoTitulo,
                blocos: blocosConvertidos,
              }
            }

            // Fallback para seções que vieram apenas com itens e perguntasDestaque soltas
            const blocosFallback: BlocoPerguntaForm[] = []
            const itensRestantes = Array.isArray(s.itens) ? [...s.itens] : []

            if (Array.isArray(s.perguntasDestaque) && s.perguntasDestaque.length > 0) {
              s.perguntasDestaque.forEach((p: any, pIdx: number) => {
                blocosFallback.push({
                  id: `bloco_${secaoId}_p_${pIdx}`,
                  tipo: (p.tipo as TipoPerguntaBloco) || 'estrategica',
                  texto: p.pergunta || '',
                  itens: [],
                })
              })
            }

            if (itensRestantes.length > 0) {
              if (blocosFallback.length > 0) {
                // Atribui os itens ao primeiro bloco ou cria bloco de opções
                blocosFallback[0].itens = itensRestantes
              } else {
                blocosFallback.push({
                  id: `bloco_${secaoId}_geral`,
                  tipo: 'geral',
                  texto: 'Perguntas e Tópicos Técnicos',
                  itens: itensRestantes,
                })
              }
            }

            if (blocosFallback.length === 0) {
              blocosFallback.push({
                id: `bloco_${secaoId}_inicial`,
                tipo: 'geral',
                texto: 'Tópicos de Análise',
                itens: [''],
              })
            }

            return {
              id: secaoId,
              titulo: secaoTitulo,
              blocos: blocosFallback,
            }
          })
        )
      } else {
        setSecoes([
          {
            id: 'secao_1',
            titulo: '1. Levantamento de Necessidades',
            blocos: [
              {
                id: 'bloco_1_1',
                tipo: 'geral',
                texto: 'Qual o principal papel deste ambiente na rotina da família?',
                itens: ['Uso diário', 'Receber visitas', 'Espaço de relaxamento'],
              },
            ],
          },
        ])
      }
      setSecaoExpandida(0)
    } else {
      // Novo Roteiro
      setTitulo('')
      setSubtitulo('')
      setOrdem(0)
      setAmbientesSelecionados([])
      setSecoes([
        {
          id: 'secao_1',
          titulo: '1. Diagnóstico do Ambiente e Rotina',
          blocos: [
            {
              id: 'bloco_1_1',
              tipo: 'geral',
              texto: 'Qual o objetivo principal deste ambiente para o cliente?',
              itens: ['Receber convidados', 'Uso diário da família', 'Espaço de descanso'],
            },
            {
              id: 'bloco_1_2',
              tipo: 'emocional',
              texto: 'O que você quer sentir ao estar neste ambiente?',
              itens: ['Aconchego', 'Conforto', 'Sofisticação', 'Leveza', 'Relaxamento'],
            },
          ],
        },
        {
          id: 'secao_2',
          titulo: '2. Equipamentos e Itens a Acomodar',
          blocos: [
            {
              id: 'bloco_2_1',
              tipo: 'geral',
              texto: 'Quais eletros e objetos precisam de espaço dedicado?',
              itens: [],
            },
          ],
        },
      ])
      setSecaoExpandida(0)
    }
  }, [roteiroParaEditar, isOpen])

  if (!isOpen) return null

  // Gestão de Ambientes
  const toggleAmbiente = (nomeAmbiente: string) => {
    setAmbientesSelecionados((prev) =>
      prev.includes(nomeAmbiente)
        ? prev.filter((a) => a !== nomeAmbiente)
        : [...prev, nomeAmbiente]
    )
  }

  // Gestão de Seções
  const adicionarSecao = () => {
    const novaIdx = secoes.length + 1
    const novaSecaoId = `secao_${Date.now()}`
    const novaSecao: RoteiroSecaoForm = {
      id: novaSecaoId,
      titulo: `${novaIdx}. Nova Seção de Análise`,
      blocos: [
        {
          id: `bloco_${novaSecaoId}_1`,
          tipo: 'geral',
          texto: 'Pergunta ou tópico principal desta seção',
          itens: [],
        },
      ],
    }
    setSecoes([...secoes, novaSecao])
    setSecaoExpandida(secoes.length)
  }

  const removerSecao = (index: number) => {
    if (secoes.length <= 1) {
      toast.warning('O roteiro deve conter pelo menos uma seção.')
      return
    }
    const novasSecoes = secoes.filter((_, idx) => idx !== index)
    setSecoes(novasSecoes)
    if (secaoExpandida === index) {
      setSecaoExpandida(Math.max(0, index - 1))
    } else if (secaoExpandida !== null && secaoExpandida > index) {
      setSecaoExpandida(secaoExpandida - 1)
    }
  }

  const atualizarTituloSecao = (index: number, novoTitulo: string) => {
    const novasSecoes = [...secoes]
    novasSecoes[index].titulo = novoTitulo
    setSecoes(novasSecoes)
  }

  // Gestão de Blocos de Pergunta
  const adicionarBlocoPergunta = (secaoIndex: number, tipo: TipoPerguntaBloco = 'geral') => {
    const novasSecoes = [...secoes]
    const secaoId = novasSecoes[secaoIndex].id
    const novoBloco: BlocoPerguntaForm = {
      id: `bloco_${secaoId}_${Date.now()}`,
      tipo,
      texto: tipo === 'emocional' ? 'O que você quer sentir ao estar neste ambiente?' : '',
      itens:
        tipo === 'emocional'
          ? ['Conforto', 'Aconchego', 'Sofisticação', 'Leveza', 'Relaxamento']
          : [],
    }
    novasSecoes[secaoIndex].blocos.push(novoBloco)
    setSecoes(novasSecoes)
  }

  const removerBlocoPergunta = (secaoIndex: number, blocoIndex: number) => {
    const novasSecoes = [...secoes]
    if (novasSecoes[secaoIndex].blocos.length <= 1) {
      toast.warning('A seção deve ter pelo menos uma pergunta ou tópico.')
      return
    }
    novasSecoes[secaoIndex].blocos = novasSecoes[secaoIndex].blocos.filter(
      (_, idx) => idx !== blocoIndex
    )
    setSecoes(novasSecoes)
  }

  const atualizarTextoPergunta = (secaoIndex: number, blocoIndex: number, novoTexto: string) => {
    const novasSecoes = [...secoes]
    novasSecoes[secaoIndex].blocos[blocoIndex].texto = novoTexto
    setSecoes(novasSecoes)
  }

  const atualizarTipoPergunta = (
    secaoIndex: number,
    blocoIndex: number,
    novoTipo: TipoPerguntaBloco
  ) => {
    const novasSecoes = [...secoes]
    novasSecoes[secaoIndex].blocos[blocoIndex].tipo = novoTipo
    setSecoes(novasSecoes)
  }

  // Gestão de Opções / Respostas do Bloco
  const adicionarOpcaoAoBloco = (secaoIndex: number, blocoIndex: number, blocoId: string) => {
    const valor = (novaOpcaoInputs[blocoId] || '').trim()
    if (!valor) return

    const novasSecoes = [...secoes]
    if (!novasSecoes[secaoIndex].blocos[blocoIndex].itens.includes(valor)) {
      novasSecoes[secaoIndex].blocos[blocoIndex].itens.push(valor)
      setSecoes(novasSecoes)
    }

    setNovaOpcaoInputs((prev) => ({ ...prev, [blocoId]: '' }))
  }

  const removerOpcaoDoBloco = (secaoIndex: number, blocoIndex: number, opcaoIndex: number) => {
    const novasSecoes = [...secoes]
    novasSecoes[secaoIndex].blocos[blocoIndex].itens = novasSecoes[secaoIndex].blocos[
      blocoIndex
    ].itens.filter((_, idx) => idx !== opcaoIndex)
    setSecoes(novasSecoes)
  }

  // Submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast.error('Informe o título do roteiro.')
      return
    }

    if (ambientesSelecionados.length === 0) {
      toast.warning('Selecione pelo menos um ambiente atendido por este roteiro.')
      return
    }

    // Formata seções ricas completas para salvar no banco
    const secoesFormatadas = secoes
      .filter((s) => s.titulo.trim().length > 0)
      .map((s, idx) => {
        const blocosFormatados = s.blocos
          .filter((b) => b.texto.trim().length > 0 || b.itens.length > 0)
          .map((b) => {
            const itensValidos = b.itens.map((i) => i.trim()).filter((i) => i.length > 0)
            if (b.tipo === 'geral') {
              return {
                tipo: 'prompt' as const,
                texto: b.texto.trim(),
                itens: itensValidos,
              }
            }

            const rotuloMap: Record<TipoPerguntaBloco, string> = {
              emocional: 'Pergunta emocional:',
              estrategica: 'Pergunta estratégica:',
              chave: 'Pergunta chave:',
              pratica: 'Checklist prático:',
              geral: 'Tópico de análise:',
            }

            return {
              tipo: 'pergunta_destaque' as const,
              rotulo: rotuloMap[b.tipo] || 'Pergunta estratégica:',
              tipoPergunta: b.tipo,
              texto: b.texto.trim(),
              itens: itensValidos,
            }
          })

        // Consolida itens gerais da seção para retrocompatibilidade
        const todosItens = blocosFormatados.flatMap((b) => b.itens || [])
        const perguntasDestaque = blocosFormatados
          .filter((b) => b.tipo === 'pergunta_destaque')
          .map((b) => ({
            tipo: b.tipoPergunta || 'estrategica',
            rotulo: b.rotulo,
            pergunta: b.texto,
          }))

        const conteudoLinhas: string[] = []
        blocosFormatados.forEach((b) => {
          if (b.texto) conteudoLinhas.push(b.texto)
          if (b.itens && b.itens.length > 0) {
            b.itens.forEach((it) => conteudoLinhas.push(`   ${it}`))
          }
        })

        return {
          id: s.id || `secao_${idx + 1}`,
          titulo: s.titulo.trim(),
          itens: todosItens,
          perguntasDestaque,
          conteudoLinhas,
          blocos: blocosFormatados,
        }
      })

    if (secoesFormatadas.length === 0) {
      toast.error('O roteiro precisa de pelo menos uma seção preenchida.')
      return
    }

    setSubmitting(true)

    const payload = {
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim() || null,
      ordem: Number(ordem) || 0,
      ambientes: ambientesSelecionados,
      secoes: secoesFormatadas,
    }

    if (isEditing && roteiroParaEditar) {
      router.put(`/configuracoes/roteiros/${roteiroParaEditar.id}`, payload, {
        onSuccess: () => {
          setSubmitting(false)
          onClose()
          toast.success('Roteiro atualizado com sucesso!')
        },
        onError: () => {
          setSubmitting(false)
        },
      })
    } else {
      router.post('/configuracoes/roteiros', payload, {
        onSuccess: () => {
          setSubmitting(false)
          onClose()
          toast.success('Novo roteiro criado com sucesso!')
        },
        onError: () => {
          setSubmitting(false)
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {isEditing ? 'Editar Roteiro de Apoio' : 'Novo Roteiro de Apoio ao Briefing'}
              </h2>
              <p className="text-xs text-stone-500">
                Personalize as perguntas, diretrizes, perguntas emocionais e respostas sugeridas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identificação Geral */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Título do Roteiro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Cozinha Integrada / Espaço Gourmet"
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Ordem de Exibição</label>
              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>

            <div className="md:col-span-12 space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Subtítulo / Objetivo do Guia Técnico
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Fluxo de trabalho, eletros embutidos, despensa, bancadas e iluminação cênica"
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>

          {/* Ambientes Atendidos (Seleção Múltipla) */}
          <div className="space-y-2 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary-600" />
                  Ambientes Atendidos por este Roteiro <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-stone-500">
                  Um mesmo roteiro pode atender múltiplos ambientes (ex: Quarto do Filho, Filha e Visita)
                </p>
              </div>
              <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                {ambientesSelecionados.length} selecionado{ambientesSelecionados.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-stone-200">
              {ambientesDisponiveis.map((amb) => {
                const isSelected = ambientesSelecionados.includes(amb.nome)
                return (
                  <button
                    key={amb.id}
                    type="button"
                    onClick={() => toggleAmbiente(amb.nome)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    {amb.nome}
                  </button>
                )
              })}
              {ambientesDisponiveis.length === 0 && (
                <p className="text-xs text-stone-400 p-2 italic">
                  Nenhum ambiente encontrado no catálogo de ambientes.
                </p>
              )}
            </div>
          </div>

          {/* Editor Estruturado de Seções e Perguntas com Respostas Agrupadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary-600" />
                  Seções do Roteiro ({secoes.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Configure as perguntas e respostas sugeridas agrupadas que o vendedor consultará no briefing
                </p>
              </div>

              <button
                type="button"
                onClick={adicionarSecao}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 border border-stone-300 hover:bg-stone-50 rounded-lg font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary-600" />
                Adicionar Seção
              </button>
            </div>

            <div className="space-y-4">
              {secoes.map((secao, sIdx) => {
                const isExpanded = secaoExpandida === sIdx
                return (
                  <div
                    key={secao.id || sIdx}
                    className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    {/* Barra de Título da Seção */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/90 border-b border-stone-200 gap-2">
                      <div
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                        onClick={() => setSecaoExpandida(isExpanded ? null : sIdx)}
                      >
                        <span className="text-xs font-bold text-stone-500 bg-stone-200/80 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={secao.titulo}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => atualizarTituloSecao(sIdx, e.target.value)}
                          placeholder={`Nome da Seção ${sIdx + 1}`}
                          className="text-xs font-bold text-stone-800 bg-transparent border-b border-dashed border-stone-300 focus:border-primary-500 focus:outline-none w-full max-w-md py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-stone-400 mr-2">
                          {secao.blocos.length} pergunta(s)/bloco(s)
                        </span>

                        <button
                          type="button"
                          onClick={() => setSecaoExpandida(isExpanded ? null : sIdx)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                          title={isExpanded ? 'Recolher seção' : 'Expandir seção'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => removerSecao(sIdx)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Excluir seção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo da Seção: Blocos de Perguntas e Respostas */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-stone-50/30">
                        {/* Lista de Blocos */}
                        <div className="space-y-3">
                          {secao.blocos.map((bloco, bIdx) => {
                            const isEmocional = bloco.tipo === 'emocional'
                            const isEstrategica = bloco.tipo === 'estrategica'
                            const inputValor = novaOpcaoInputs[bloco.id] || ''

                            return (
                              <div
                                key={bloco.id || bIdx}
                                className={clsx(
                                  'p-3.5 rounded-xl border transition-all space-y-3 bg-white shadow-2xs',
                                  isEmocional
                                    ? 'border-rose-200/90 ring-1 ring-rose-200/50 bg-rose-50/20'
                                    : isEstrategica
                                      ? 'border-amber-200/90 ring-1 ring-amber-200/50 bg-amber-50/20'
                                      : 'border-stone-200'
                                )}
                              >
                                {/* Topo do Bloco: Tipo de Pergunta + Botão Excluir */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                      Tipo de Pergunta:
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {TIPOS_PERGUNTA.map((tp) => {
                                        const isSelected = bloco.tipo === tp.valor
                                        const Icone = tp.icone
                                        return (
                                          <button
                                            key={tp.valor}
                                            type="button"
                                            onClick={() =>
                                              atualizarTipoPergunta(sIdx, bIdx, tp.valor)
                                            }
                                            className={clsx(
                                              'text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border transition-all cursor-pointer',
                                              isSelected
                                                ? clsx(tp.corBadge, 'shadow-2xs ring-1 ring-current')
                                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                                            )}
                                          >
                                            <Icone className="w-3 h-3" />
                                            <span>{tp.rotulo}</span>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removerBlocoPergunta(sIdx, bIdx)}
                                    className="p-1 text-stone-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                    title="Remover este bloco"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Campo da Pergunta */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-stone-700 flex items-center gap-1">
                                    {isEmocional ? (
                                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                                    ) : isEstrategica ? (
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    ) : (
                                      <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                                    )}
                                    Pergunta / Tópico:
                                  </label>
                                  <input
                                    type="text"
                                    value={bloco.texto}
                                    onChange={(e) =>
                                      atualizarTextoPergunta(sIdx, bIdx, e.target.value)
                                    }
                                    placeholder={
                                      isEmocional
                                        ? 'Ex: O que você quer sentir ao estar na sua sala?'
                                        : 'Ex: Qual o principal papel deste ambiente?'
                                    }
                                    className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                  />
                                </div>

                                {/* Respostas Sugeridas Vinculadas a esta Pergunta */}
                                <div className="space-y-1.5 pt-1 border-t border-stone-100">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-stone-400" />
                                      Respostas / Opções Sugeridas ({bloco.itens.length}):
                                    </label>
                                    <span className="text-[10px] text-stone-400">
                                      Virarão botões de inserção direta no briefing
                                    </span>
                                  </div>

                                  {/* Chips de Respostas */}
                                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-stone-50/70 rounded-lg border border-stone-200/80 items-center">
                                    {bloco.itens.map((opcao, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className={clsx(
                                          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium border shadow-2xs',
                                          isEmocional
                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                            : isEstrategica
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : 'bg-white text-stone-700 border-stone-200'
                                        )}
                                      >
                                        <span>{opcao}</span>
                                        <button
                                          type="button"
                                          onClick={() => removerOpcaoDoBloco(sIdx, bIdx, oIdx)}
                                          className="text-stone-400 hover:text-red-500 rounded cursor-pointer"
                                          title="Remover opção"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}

                                    {/* Mini Input para Adicionar Nova Resposta */}
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={inputValor}
                                        onChange={(e) =>
                                          setNovaOpcaoInputs((prev) => ({
                                            ...prev,
                                            [bloco.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            adicionarOpcaoAoBloco(sIdx, bIdx, bloco.id)
                                          }
                                        }}
                                        placeholder={
                                          isEmocional
                                            ? '+ Sentimento (ex: Conforto)...'
                                            : '+ Nova resposta / opção...'
                                        }
                                        className="text-xs px-2 py-1 rounded-md border border-dashed border-stone-300 focus:outline-none focus:border-primary-500 bg-white placeholder:text-stone-400 min-w-[170px]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => adicionarOpcaoAoBloco(sIdx, bIdx, bloco.id)}
                                        className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md transition-colors cursor-pointer"
                                        title="Adicionar opção à pergunta"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Botões para Adicionar Nova Pergunta */}
                        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/80">
                          <button
                            type="button"
                            onClick={() => adicionarBlocoPergunta(sIdx, 'geral')}
                            className="text-xs text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-stone-500" />
                            + Pergunta Funcional
                          </button>

                          <button
                            type="button"
                            onClick={() => adicionarBlocoPergunta(sIdx, 'emocional')}
                            className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-600" />
                            + Pergunta Emocional ♡
                          </button>

                          <button
                            type="button"
                            onClick={() => adicionarBlocoPergunta(sIdx, 'estrategica')}
                            className="text-xs text-amber-800 hover:text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            + Pergunta Estratégica ✦
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </form>

        {/* Rodapé com Botões */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            As perguntas e respostas sugeridas ficarão disponíveis imediatamente na gaveta do briefing.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-100 font-medium text-stone-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-xs px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Roteiro' : 'Criar Roteiro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
