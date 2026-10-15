import React, { useState, useMemo } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  ArrowLeft,
  Save,
  Send,
  Building,
  Calendar,
  DollarSign,
  Palette,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
  Sparkles,
  ExternalLink,
  RotateCw,
  BookOpen,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import { recarregarCatalogos, useSincronizarCatalogos } from '../../lib/catalogos'
import ModalNovoParceiroRapido, {
  type EspecificadorItem,
  type ConsultorItem,
} from '../../components/especificadores/ModalNovoParceiroRapido'
import RoteiroAmbienteDrawer, { type RoteiroCatalogoItem } from './components/RoteiroAmbienteDrawer'
import { resolverSlugAmbiente } from '../../lib/roteiros_briefings'
import {
  normalizarAmbiente,
  ehAmbienteOutro,
  descricaoAmbienteOutro,
  CRITERIOS_SCORE,
  SCORE_MAXIMO_BRIEFING,
  STATUS_BRIEFING_MAP,
  calcularScoreBriefingClient,
  type CriterioDef,
} from '../../lib/briefing_constants'

type AmbienteItem = {
  id?: number
  tipo: string
  descricao: string
  medidasPreliminares: string
  observacoesEspecificas: string
}

type BriefingData = {
  id: number
  projetoId: number
  cidadeObra: string
  estadoObra: string
  enderecoObra: string
  ambientes: string[]
  prazoDesejado: string
  faixaInvestimentoMin: number | null
  faixaInvestimentoMax: number | null
  estiloPreferido: string
  observacoes: string
  referenciasUrl: string[]
  arquitetoId: number | null
  arquitetoNome: string
  arquitetoEmail: string
  arquitetoTelefone: string
  score: number
  scoreMinimo: number
  status: string
  motivoDevolucao: string | null
  enviadoEm: string | null
  projeto: {
    id: number
    codigo: string
    clienteNome: string
    status: string
    arquitetoId?: number | null
    arquiteto?: {
      id: number
      nome: string
      escritorio?: string | null
      telefone?: string | null
      email?: string | null
    } | null
    vendedor: { id: number; nome: string } | null
    lead?: { id: number; nome: string; telefone: string; email: string | null } | null
  } | null
  ambientesDetalhados: AmbienteItem[]
}

type PageProps = {
  briefing: BriefingData
  scoreBreakdown: {
    score: number
    scoreMinimo: number
    aprovado: boolean
    detalhes: Record<string, boolean>
    pontosFaltantes: string[]
  }
  especificadores?: EspecificadorItem[]
  consultores?: ConsultorItem[]
  ambientesCatalogo?: string[]
  roteirosCatalogo?: RoteiroCatalogoItem[]
}

const BriefingEdit: React.FC<PageProps> = ({
  briefing,
  especificadores = [],
  consultores = [],
  ambientesCatalogo = [],
  roteirosCatalogo = [],
}) => {
  // Mudanças no catálogo de ambientes (Configurações) aparecem aqui sem recarregar a página
  useSincronizarCatalogos(['ambientesCatalogo'])

  const usuario = usePage<{ user?: { perfil?: string; isSuperuser?: boolean } }>().props.user
  const canManageConfig = Boolean(
    usuario?.isSuperuser ||
      usuario?.perfil === 'diretoria' ||
      usuario?.perfil === 'gerente_comercial'
  )
  const [sincronizandoAmbientes, setSincronizandoAmbientes] = useState(false)
  const sincronizarAmbientes = () => {
    setSincronizandoAmbientes(true)
    recarregarCatalogos(['ambientesCatalogo'], () => {
      setSincronizandoAmbientes(false)
      toast.success('Lista de ambientes sincronizada!')
    })
  }

  // Ambientes vindos da qualificação do lead (nomes do catálogo); valores antigos são traduzidos
  const ambientesIniciais = (briefing.ambientes || []).map(normalizarAmbiente)
  const outroInicial = ambientesIniciais.find(ehAmbienteOutro)

  // Lista local de especificadores (para permitir inclusão imediata ao cadastrar via modal sem recarregar tela)
  const [listaEspecificadores, setListaEspecificadores] = useState<EspecificadorItem[]>(especificadores)
  const [isModalNovoArquitetoOpen, setIsModalNovoArquitetoOpen] = useState(false)

  // Estado do formulário
  const [formData, setFormData] = useState({
    cidadeObra: briefing.cidadeObra || '',
    estadoObra: briefing.estadoObra || '',
    enderecoObra: briefing.enderecoObra || '',
    ambientes: ambientesIniciais.filter((a) => !ehAmbienteOutro(a)),
    prazoDesejado: briefing.prazoDesejado || '',
    faixaInvestimentoMin: briefing.faixaInvestimentoMin ?? '',
    faixaInvestimentoMax: briefing.faixaInvestimentoMax ?? '',
    estiloPreferido: briefing.estiloPreferido || '',
    observacoes: briefing.observacoes || '',
    referenciasUrl: briefing.referenciasUrl || [],
    arquitetoId: briefing.arquitetoId ?? briefing.projeto?.arquitetoId ?? null,
    arquitetoNome: briefing.arquitetoNome || '',
    arquitetoEmail: briefing.arquitetoEmail || '',
    arquitetoTelefone: briefing.arquitetoTelefone || '',
    ambientesDetalhados: (briefing.ambientesDetalhados || []).map((a) => ({
      ...a,
      tipo: normalizarAmbiente(a.tipo),
    })),
  })

  // Ambiente fora do catálogo ("Outro"), com descrição obrigatória como na qualificação do lead
  const [isOutroSelected, setIsOutroSelected] = useState(Boolean(outroInicial))
  const [outroDescricao, setOutroDescricao] = useState(
    outroInicial ? descricaoAmbienteOutro(outroInicial) : ''
  )

  // Lista final gravada no briefing: ambientes do catálogo + "Outro: <descrição>"
  const ambientesFinais = useMemo(
    () =>
      isOutroSelected && outroDescricao.trim()
        ? [...formData.ambientes, `Outro: ${outroDescricao.trim()}`]
        : formData.ambientes,
    [formData.ambientes, isOutroSelected, outroDescricao]
  )

  // Detalhamento técnico: ambientes do catálogo que não foram solicitados
  const restoCatalogo = useMemo(
    () => ambientesCatalogo.filter((a) => !ambientesFinais.includes(a)),
    [ambientesCatalogo, ambientesFinais]
  )

  // Chips: catálogo ativo + ambientes já escolhidos que não estão no catálogo (inativos ou antigos)
  const opcoesAmbientes = useMemo(
    () => [
      ...ambientesCatalogo,
      ...formData.ambientes.filter((a) => !ambientesCatalogo.includes(a)),
    ],
    [ambientesCatalogo, formData.ambientes]
  )

  // Selecionar arquiteto parceiro existente com auto-preenchimento
  const handleSelectArquiteto = (arquitetoIdVal: string) => {
    if (!arquitetoIdVal) {
      setFormData((prev) => ({
        ...prev,
        arquitetoId: null,
      }))
      return
    }

    const selectedId = Number(arquitetoIdVal)
    const arq = listaEspecificadores.find((item) => item.id === selectedId)
    if (arq) {
      setFormData((prev) => ({
        ...prev,
        arquitetoId: arq.id,
        arquitetoNome: arq.nome,
        arquitetoEmail: arq.email || '',
        arquitetoTelefone: arq.telefone || '',
      }))
    }
  }

  // Callback ao criar parceiro via modal rápido (sem reload)
  const handleArquitetoCriado = (novoArq: EspecificadorItem) => {
    setListaEspecificadores((prev) => [...prev, novoArq].sort((a, b) => a.nome.localeCompare(b.nome)))
    setFormData((prev) => ({
      ...prev,
      arquitetoId: novoArq.id,
      arquitetoNome: novoArq.nome,
      arquitetoEmail: novoArq.email || '',
      arquitetoTelefone: novoArq.telefone || '',
    }))
  }

  const [novoLinkRef, setNovoLinkRef] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Cálculo de Score reativo em tempo real no cliente
  const liveScore = useMemo(() => {
    return calcularScoreBriefingClient({
      cidadeObra: formData.cidadeObra,
      ambientes: ambientesFinais,
      prazoDesejado: formData.prazoDesejado,
      faixaInvestimentoMin: formData.faixaInvestimentoMin,
      faixaInvestimentoMax: formData.faixaInvestimentoMax,
      ambientesDetalhados: formData.ambientesDetalhados,
      referenciasUrl: formData.referenciasUrl,
      arquitetoNome: formData.arquitetoNome,
      observacoes: formData.observacoes,
      scoreMinimo: briefing.scoreMinimo || 70,
    })
  }, [formData, ambientesFinais, briefing.scoreMinimo])

  // Alterna ambiente no escopo geral
  const toggleAmbiente = (val: string) => {
    setFormData((prev) => {
      const exists = prev.ambientes.includes(val)
      const newAmbientes = exists
        ? prev.ambientes.filter((a) => a !== val)
        : [...prev.ambientes, val]
      return { ...prev, ambientes: newAmbientes }
    })
  }

  // Gerenciamento de Ambientes Detalhados
  const addAmbienteDetalhado = () => {
    // Sugere o primeiro ambiente solicitado que ainda não foi detalhado
    const detalhados = formData.ambientesDetalhados.map((a) => a.tipo)
    const defaultTipo =
      ambientesFinais.find((a) => !detalhados.includes(a)) ??
      ambientesFinais[0] ??
      ambientesCatalogo[0] ??
      ''
    setFormData((prev) => ({
      ...prev,
      ambientesDetalhados: [
        ...prev.ambientesDetalhados,
        {
          tipo: defaultTipo,
          descricao: '',
          medidasPreliminares: '',
          observacoesEspecificas: '',
        },
      ],
    }))
  }

  // Estado do Drawer do Guia Técnico de Apoio aos Ambientes (R1, R2, R3)
  const [isGuiaDrawerOpen, setIsGuiaDrawerOpen] = useState(false)
  const [guiaAmbienteSelecionado, setGuiaAmbienteSelecionado] = useState<string | null>(null)
  const [guiaCardIndexAtivo, setGuiaCardIndexAtivo] = useState<number | null>(null)
  const [guiaDrawerTrigger, setGuiaDrawerTrigger] = useState<number>(0)

  // Resolve o nome canônico do ambiente mais limpo/oficial para atribuição ao card
  const resolverNomeCanonicoAmbiente = (slug: string, tituloFallback?: string): string => {
    // 1. Se nos ambientes solicitados do briefing houver correspondência exata de slug, usa esse nome
    const matchBriefing = ambientesFinais.find((nome) => resolverSlugAmbiente(nome) === slug)
    if (matchBriefing) return matchBriefing

    // 2. Se no catálogo oficial houver correspondência exata de slug, usa o nome do catálogo
    const matchCatalogo = ambientesCatalogo.find((catNome) => resolverSlugAmbiente(catNome) === slug)
    if (matchCatalogo) return matchCatalogo

    // 3. Se guiaAmbienteSelecionado mapear para o mesmo slug e não contiver barra '/'
    if (
      guiaAmbienteSelecionado &&
      resolverSlugAmbiente(guiaAmbienteSelecionado) === slug &&
      !guiaAmbienteSelecionado.includes('/')
    ) {
      return guiaAmbienteSelecionado
    }

    // 4. Limpeza de títulos compostos com barra (ex.: "Espaço Gourmet / Área Gourmet" -> "Espaço Gourmet")
    if (tituloFallback && tituloFallback.includes('/')) {
      const parteLimpa = tituloFallback.split('/')[0].trim()
      if (parteLimpa) return parteLimpa
    }

    return tituloFallback || 'Living'
  }

  const abrirGuiaGeral = () => {
    const cardComTipoIdx = formData.ambientesDetalhados.findIndex((a) => Boolean(a.tipo))
    const primeiro =
      (cardComTipoIdx !== -1 ? formData.ambientesDetalhados[cardComTipoIdx].tipo : null) ||
      ambientesFinais[0] ||
      'Living'
    const indexAlvo =
      cardComTipoIdx !== -1 ? cardComTipoIdx : formData.ambientesDetalhados.length > 0 ? 0 : null
    setGuiaCardIndexAtivo(indexAlvo)
    setGuiaAmbienteSelecionado(primeiro)
    setGuiaDrawerTrigger(Date.now())
    setIsGuiaDrawerOpen(true)
  }

  const abrirGuiaCard = (index: number, tipo: string) => {
    setGuiaCardIndexAtivo(index)
    setGuiaAmbienteSelecionado(tipo || ambientesFinais[0] || 'Living')
    setGuiaDrawerTrigger(Date.now())
    setIsGuiaDrawerOpen(true)
  }

  const handleInserirTextoNoCard = (
    texto: string,
    ambienteAtivo?: { slug: string; titulo: string; isTituloSecao?: boolean }
  ) => {
    const slugDesejado = ambienteAtivo?.slug || resolverSlugAmbiente(guiaAmbienteSelecionado)
    const tituloBruto = ambienteAtivo?.titulo || guiaAmbienteSelecionado || 'Living'
    const tituloCanonico = resolverNomeCanonicoAmbiente(slugDesejado, tituloBruto)

    let targetIdx: number | null = null

    if (formData.ambientesDetalhados.length > 0) {
      // 1. Se o card atualmente ativo corresponde ao ambiente desejado, insere nele
      if (
        guiaCardIndexAtivo !== null &&
        formData.ambientesDetalhados[guiaCardIndexAtivo] &&
        resolverSlugAmbiente(formData.ambientesDetalhados[guiaCardIndexAtivo].tipo) === slugDesejado
      ) {
        targetIdx = guiaCardIndexAtivo
      } else if (
        // 2. Se o card atualmente ativo NÃO tem tipo definido (recém-adicionado e em foco),
        // ele tem prioridade máxima para adotar o ambiente do guia e receber o item
        guiaCardIndexAtivo !== null &&
        formData.ambientesDetalhados[guiaCardIndexAtivo] &&
        !formData.ambientesDetalhados[guiaCardIndexAtivo].tipo
      ) {
        targetIdx = guiaCardIndexAtivo
      } else {
        // 3. Procura outro card cujo tipo mapeie para o mesmo ambiente
        const matchingIdx = formData.ambientesDetalhados.findIndex(
          (a) => a.tipo && resolverSlugAmbiente(a.tipo) === slugDesejado
        )
        if (matchingIdx !== -1) {
          targetIdx = matchingIdx
        } else if (
          guiaCardIndexAtivo !== null &&
          formData.ambientesDetalhados[guiaCardIndexAtivo]
        ) {
          // Se o usuário selecionou explicitamente um card no formulário, respeita a escolha do usuário
          targetIdx = guiaCardIndexAtivo
        }
      }
    }

    const textoLimpo = texto.trim()
    const isTitulo = Boolean(ambienteAtivo?.isTituloSecao || /^\d+\.\s/.test(textoLimpo))
    const itemFormatado = isTitulo
      ? textoLimpo
      : textoLimpo.startsWith('•')
        ? textoLimpo
        : `• ${textoLimpo}`

    if (targetIdx !== null && formData.ambientesDetalhados[targetIdx]) {
      const amb = formData.ambientesDetalhados[targetIdx]
      let novaDescricao = amb.descricao ? amb.descricao.trimEnd() : ''
      if (novaDescricao) {
        if (isTitulo) {
          novaDescricao = `${novaDescricao}\n\n${itemFormatado}`
        } else {
          novaDescricao = `${novaDescricao}\n${itemFormatado}`
        }
      } else {
        novaDescricao = itemFormatado
      }

      const novoTipo = amb.tipo || tituloCanonico
      setFormData((prev) => {
        const copy = [...prev.ambientesDetalhados]
        copy[targetIdx!] = { ...copy[targetIdx!], tipo: novoTipo, descricao: novaDescricao }
        return { ...prev, ambientesDetalhados: copy }
      })
      setGuiaCardIndexAtivo(targetIdx)
      setGuiaAmbienteSelecionado(novoTipo)
      toast.success(isTitulo ? `Título da seção inserido!` : `"${textoLimpo}" adicionado!`)

      // Mantém foco e seleção no textarea do ambiente selecionado
      setTimeout(() => {
        const elTextarea = document.getElementById(
          `textarea_descricao_ambiente_${targetIdx}`
        ) as HTMLTextAreaElement | null
        if (elTextarea) {
          elTextarea.focus()
          elTextarea.selectionStart = elTextarea.value.length
          elTextarea.selectionEnd = elTextarea.value.length
        }
      }, 50)
    } else {
      // Nenhum card existente para este ambiente: cria novo card direcionado para o ambiente ativo
      const novoAmbiente: AmbienteItem = {
        tipo: tituloCanonico,
        descricao: itemFormatado,
        medidasPreliminares: '',
        observacoesEspecificas: '',
      }
      setFormData((prev) => ({
        ...prev,
        ambientesDetalhados: [...prev.ambientesDetalhados, novoAmbiente],
      }))
      const novoIdx = formData.ambientesDetalhados.length
      setGuiaCardIndexAtivo(novoIdx)
      setGuiaAmbienteSelecionado(tituloCanonico)
      toast.success(`Card ${tituloCanonico} adicionado com o item!`)

      setTimeout(() => {
        const elTextarea = document.getElementById(
          `textarea_descricao_ambiente_${novoIdx}`
        ) as HTMLTextAreaElement | null
        if (elTextarea) {
          elTextarea.focus()
          elTextarea.selectionStart = elTextarea.value.length
          elTextarea.selectionEnd = elTextarea.value.length
        }
      }, 50)
    }
  }

  const updateAmbienteDetalhado = (index: number, field: keyof AmbienteItem, value: string) => {
    setFormData((prev) => {
      const copy = [...prev.ambientesDetalhados]
      copy[index] = { ...copy[index], [field]: value }
      return { ...prev, ambientesDetalhados: copy }
    })

    // Se o ambiente no card for alterado (ex.: de "Living" para "Quarto da Filha"),
    // abre/direciona o guia automaticamente para o novo ambiente selecionado (R3)
    if (field === 'tipo' && value) {
      setGuiaCardIndexAtivo(index)
      setGuiaAmbienteSelecionado(value)
      setGuiaDrawerTrigger(Date.now())
      setIsGuiaDrawerOpen(true)
    }
  }

  const removeAmbienteDetalhado = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ambientesDetalhados: prev.ambientesDetalhados.filter((_, i) => i !== index),
    }))
  }

  // Gerenciamento de Referências Visuais
  const addReferenciaUrl = () => {
    if (!novoLinkRef.trim()) return
    setFormData((prev) => ({
      ...prev,
      referenciasUrl: [...prev.referenciasUrl, novoLinkRef.trim()],
    }))
    setNovoLinkRef('')
  }

  const removeReferenciaUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenciasUrl: prev.referenciasUrl.filter((_, i) => i !== index),
    }))
  }

  // "Outro" marcado exige descrição (mesma regra da qualificação do lead)
  const outroSemDescricao = () => {
    if (isOutroSelected && outroDescricao.trim().length < 2) {
      toast.error('Descreva o ambiente "Outro" com no mínimo 2 caracteres.')
      return true
    }
    return false
  }

  // Salvar Rascunho
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (outroSemDescricao()) return
    setIsSaving(true)

    router.put(
      `/briefings/${briefing.id}`,
      {
        cidadeObra: formData.cidadeObra || null,
        estadoObra: formData.estadoObra || null,
        enderecoObra: formData.enderecoObra || null,
        ambientes: ambientesFinais,
        prazoDesejado: formData.prazoDesejado || null,
        faixaInvestimentoMin: formData.faixaInvestimentoMin ? Number(formData.faixaInvestimentoMin) : null,
        faixaInvestimentoMax: formData.faixaInvestimentoMax ? Number(formData.faixaInvestimentoMax) : null,
        estiloPreferido: formData.estiloPreferido || null,
        observacoes: formData.observacoes || null,
        referenciasUrl: formData.referenciasUrl,
        arquitetoId: formData.arquitetoId ? Number(formData.arquitetoId) : null,
        arquitetoNome: formData.arquitetoNome || null,
        arquitetoEmail: formData.arquitetoEmail || null,
        arquitetoTelefone: formData.arquitetoTelefone || null,
        ambientesDetalhados: formData.ambientesDetalhados,
      },
      {
        onFinish: () => setIsSaving(false),
      }
    )
  }

  // Enviar para Fila de Projetos (RN002)
  const handleEnviarFila = () => {
    if (outroSemDescricao()) return
    if (!liveScore.aprovado) {
      alert(
        `Bloqueio RN002: O score atual é de ${liveScore.score} pts (mínimo exigido: ${liveScore.scoreMinimo} pts).\n\nPontos pendentes:\n• ${liveScore.pontosFaltantes.join('\n• ')}`
      )
      return
    }

    if (
      confirm(
        `Confirma o envio do Briefing para a Fila de Projetos com Score ${liveScore.score} pts?\n\nO projeto mudará para o status "Na Fila" e aguardará alocação de projetista.`
      )
    ) {
      setIsSending(true)
      // Primeiro salva eventuais alterações pendentes, depois envia
      router.put(
        `/briefings/${briefing.id}`,
        {
          cidadeObra: formData.cidadeObra || null,
          estadoObra: formData.estadoObra || null,
          enderecoObra: formData.enderecoObra || null,
          ambientes: ambientesFinais,
          prazoDesejado: formData.prazoDesejado || null,
          faixaInvestimentoMin: formData.faixaInvestimentoMin ? Number(formData.faixaInvestimentoMin) : null,
          faixaInvestimentoMax: formData.faixaInvestimentoMax ? Number(formData.faixaInvestimentoMax) : null,
          estiloPreferido: formData.estiloPreferido || null,
          observacoes: formData.observacoes || null,
          referenciasUrl: formData.referenciasUrl,
          arquitetoId: formData.arquitetoId ? Number(formData.arquitetoId) : null,
          arquitetoNome: formData.arquitetoNome || null,
          arquitetoEmail: formData.arquitetoEmail || null,
          arquitetoTelefone: formData.arquitetoTelefone || null,
          ambientesDetalhados: formData.ambientesDetalhados,
        },
        {
          onSuccess: () => {
            router.post(`/briefings/${briefing.id}/enviar-para-fila`, {}, {
              onFinish: () => setIsSending(false),
            })
          },
          onError: () => setIsSending(false),
        }
      )
    }
  }

  const statusConfig = STATUS_BRIEFING_MAP[briefing.status] || STATUS_BRIEFING_MAP.rascunho

  return (
    <AppLayout
      title={`Briefing — ${briefing.projeto?.clienteNome || 'Cliente'}`}
      subtitle={`Código: ${briefing.projeto?.codigo || 'N/A'} • Status: ${statusConfig.label}`}
    >
      <Head title={`Editar Briefing — ${briefing.projeto?.clienteNome || 'Projeto'}`} />

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Barra Superior de Ações & Status */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/briefings"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              title="Voltar para a listagem"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-stone-900">
                  {briefing.projeto?.clienteNome}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                  {briefing.projeto?.codigo}
                </span>
                <span className={clsx('text-[11px] font-medium px-2.5 py-0.5 rounded-full border', statusConfig.badge)}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Vendedor responsável: {briefing.projeto?.vendedor?.nome || 'Não atribuído'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-stone-500" />
              {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
            </button>

            {briefing.status === 'rascunho' && (
              <button
                type="button"
                onClick={handleEnviarFila}
                disabled={!liveScore.aprovado || isSending}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl shadow transition-all',
                  liveScore.aprovado
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer ring-2 ring-emerald-600/30'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                )}
                title={
                  liveScore.aprovado
                    ? 'Enviar para a Fila de Projetos (RN002 Atendida)'
                    : `Bloqueado por RN002: Faltam ${Math.ceil(70 - liveScore.score)} pontos para atingir o mínimo`
                }
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Enviando...' : 'Enviar para a Fila (RN002)'}
              </button>
            )}
          </div>
        </div>

        {/* Layout Grid: 8 Colunas (Form) + 4 Colunas (Card do Score e Checklist) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Principal: Formulário Multi-Seção */}
          <div className="lg:col-span-8 space-y-6">
            {/* Seção 1: Dados da Obra & Localização */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <Building className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">1. Localização & Dados da Obra</h3>
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  {liveScore.detalhes.cidade_obra ? '+8 pts' : '0/8 pts'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Cidade da Obra: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={formData.cidadeObra}
                    onChange={(e) => setFormData({ ...formData, cidadeObra: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Estado (UF):</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Ex: SP"
                    value={formData.estadoObra}
                    onChange={(e) => setFormData({ ...formData, estadoObra: e.target.value.toUpperCase() })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-stone-700 mb-1">Endereço Completo / Condomínio:</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Brigadeiro Faria Lima, 3477 - Apto 142"
                    value={formData.enderecoObra}
                    onChange={(e) => setFormData({ ...formData, enderecoObra: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Escopo Geral de Ambientes */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <FileCheck className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">2. Ambientes Solicitados</h3>
                <div className="ml-auto flex items-center gap-3">
                  {canManageConfig && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={sincronizarAmbientes}
                        disabled={sincronizandoAmbientes}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 hover:text-stone-700"
                        title="Sincronizar com o catálogo de ambientes"
                      >
                        <RotateCw
                          size={9}
                          className={sincronizandoAmbientes ? 'animate-spin' : ''}
                        />
                        <span>Sincronizar</span>
                      </button>
                      <a
                        href="/configuracoes?tab=ambientes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                        title="Configurar ambientes em nova aba"
                      >
                        <span>Configurar</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-stone-400 font-mono">
                    {liveScore.detalhes.ambientes ? '+10 pts' : '0/10 pts'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-stone-500 mb-3">
                  Selecione os ambientes que farão parte do escopo contratual deste projeto:
                </p>
                <div className="flex flex-wrap gap-2">
                  {opcoesAmbientes.map((amb) => {
                    const isSelected = formData.ambientes.includes(amb)
                    return (
                      <button
                        type="button"
                        key={amb}
                        onClick={() => toggleAmbiente(amb)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                          isSelected
                            ? 'bg-primary-500 text-stone-900 border-primary-600 shadow-sm font-semibold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-stone-900" />}
                        {amb}
                      </button>
                    )
                  })}

                  {/* Ambiente fora do catálogo */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isOutroSelected
                      setIsOutroSelected(next)
                      if (!next) setOutroDescricao('')
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                      isOutroSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-semibold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    )}
                  >
                    {isOutroSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    Outro
                  </button>
                </div>

                {opcoesAmbientes.length === 0 && (
                  <p className="text-[11px] text-stone-400 mt-2">
                    Nenhum ambiente ativo no catálogo. Cadastre em Configurações → Ambientes.
                  </p>
                )}

                {isOutroSelected && (
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-amber-950">
                      Descrição do Ambiente “Outro” *
                    </label>
                    <input
                      type="text"
                      value={outroDescricao}
                      onChange={(e) => setOutroDescricao(e.target.value)}
                      placeholder="Ex: Adega Climatizada, Brinquedoteca, Academia, etc."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-stone-800"
                    />
                    <p className="text-[10px] text-amber-700">
                      Campo obrigatório para descrever o ambiente fora do catálogo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção 3: Detalhamento dos Ambientes (15 pts + 8 pts medidas) */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <h3 className="font-semibold text-sm text-stone-900">
                    3. Detalhamento Técnico dos Ambientes
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-stone-500 hidden sm:inline">
                    Desc.: {liveScore.detalhes.ambientes_detalhados ? '+15' : '0'}/15 | Medidas: {liveScore.detalhes.medidas_preliminares ? '+8' : '0'}/8
                  </span>
                  <button
                    type="button"
                    onClick={abrirGuiaGeral}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    title="Consultar Guia Técnico com roteiros de perguntas e diretrizes dos 18 ambientes"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Consultar Guia Técnico</span>
                  </button>
                  <button
                    type="button"
                    onClick={addAmbienteDetalhado}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary-400" />
                    Adicionar Ambiente
                  </button>
                </div>
              </div>

              {formData.ambientesDetalhados.length === 0 ? (
                <div className="p-6 border border-dashed border-stone-200 rounded-xl text-center bg-stone-50/50 space-y-3">
                  <p className="text-xs text-stone-500">
                    Nenhum ambiente detalhado adicionado ainda. Adicione pelo menos um ambiente com medidas para pontuar 23 pontos no score!
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={addAmbienteDetalhado}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-stone-900 font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Primeiro Ambiente
                    </button>
                    <button
                      type="button"
                      onClick={abrirGuiaGeral}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      Consultar Guia Técnico
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.ambientesDetalhados.map((amb, index) => {
                    const isCardConectado = isGuiaDrawerOpen && guiaCardIndexAtivo === index
                    return (
                      <div
                        key={index}
                        className={clsx(
                          'border rounded-xl p-4 relative space-y-3 transition-all',
                          isCardConectado
                            ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/30 shadow-sm'
                            : 'border-stone-200 bg-stone-50/40'
                        )}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={clsx(
                                'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors',
                                isCardConectado
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-stone-200 text-stone-700'
                              )}
                            >
                              {index + 1}
                            </span>
                            <select
                              value={amb.tipo}
                              onChange={(e) => updateAmbienteDetalhado(index, 'tipo', e.target.value)}
                              className="text-xs font-semibold text-stone-800 bg-white border border-stone-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            >
                              {!amb.tipo && <option value="">Selecione o ambiente...</option>}
                              {ambientesFinais.length > 0 && (
                                <optgroup label="Ambientes solicitados">
                                  {ambientesFinais.map((a) => (
                                    <option key={a} value={a}>
                                      {a}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {restoCatalogo.length > 0 && (
                                <optgroup label="Demais ambientes do catálogo">
                                  {restoCatalogo.map((a) => (
                                    <option key={a} value={a}>
                                      {a}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {amb.tipo &&
                                !ambientesFinais.includes(amb.tipo) &&
                                !restoCatalogo.includes(amb.tipo) && (
                                  <option value={amb.tipo}>{amb.tipo}</option>
                                )}
                            </select>

                            {/* Botão Guia do Ambiente (R3) */}
                            <button
                              type="button"
                              onClick={() => {
                                abrirGuiaCard(index, amb.tipo)
                                setTimeout(() => {
                                  const ta = document.getElementById(
                                    `textarea_descricao_ambiente_${index}`
                                  ) as HTMLTextAreaElement | null
                                  ta?.focus()
                                }, 50)
                              }}
                              className={clsx(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer border',
                                isCardConectado
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold shadow-xs'
                                  : 'bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border-stone-200 hover:border-amber-300'
                              )}
                              title={`Abrir Guia Técnico com roteiro de perguntas para ${amb.tipo || 'este ambiente'}`}
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              <span>Guia do Ambiente</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAmbienteDetalhado(index)}
                            className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remover este ambiente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-medium text-stone-700">
                                Descrição Detalhada do Ambiente (+15 pts):
                              </label>
                              {isCardConectado && (
                                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                  Conectado ao Guia Técnico
                                </span>
                              )}
                            </div>
                            <textarea
                              id={`textarea_descricao_ambiente_${index}`}
                              rows={9}
                              placeholder="Ex: Cozinha gourmet com ilha central, gavetas com amortecimento, torre quente para micro e forno..."
                              value={amb.descricao}
                              onFocus={() => {
                                setGuiaCardIndexAtivo(index)
                                if (amb.tipo) {
                                  setGuiaAmbienteSelecionado(amb.tipo)
                                }
                              }}
                              onChange={(e) =>
                                updateAmbienteDetalhado(index, 'descricao', e.target.value)
                              }
                              className={clsx(
                                'w-full min-h-[200px] text-xs leading-relaxed border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 transition-colors resize-y font-sans',
                                isCardConectado
                                  ? 'border-amber-400 bg-white ring-1 ring-amber-400/30'
                                  : 'border-stone-300'
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-stone-700 mb-1">
                              Medidas Preliminares (+8 pts):
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 4.50m x 3.20m, pé direito 2.65m"
                              value={amb.medidasPreliminares}
                              onChange={(e) =>
                                updateAmbienteDetalhado(index, 'medidasPreliminares', e.target.value)
                              }
                              className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-stone-700 mb-1">
                              Observações Específicas / Elétrica / Hidráulica:
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Ponto de gás na ilha, tomada 220v cooktop"
                              value={amb.observacoesEspecificas}
                              onChange={(e) =>
                                updateAmbienteDetalhado(
                                  index,
                                  'observacoesEspecificas',
                                  e.target.value
                                )
                              }
                              className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Seção 4: Investimento & Prazos */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <DollarSign className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">4. Investimento & Prazos</h3>
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  Prazo: {liveScore.detalhes.prazo_desejado ? '+8' : '0'}/8 | Faixa: {liveScore.detalhes.faixa_investimento ? '+14' : '0'}/14
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Prazo Desejado de Entrega: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.prazoDesejado}
                      onChange={(e) => setFormData({ ...formData, prazoDesejado: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Investimento Mínimo (R$): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="Ex: 80000"
                    value={formData.faixaInvestimentoMin}
                    onChange={(e) => setFormData({ ...formData, faixaInvestimentoMin: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Investimento Máximo (R$): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="Ex: 150000"
                    value={formData.faixaInvestimentoMax}
                    onChange={(e) => setFormData({ ...formData, faixaInvestimentoMax: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção 5: Referências & Observações (o estilo preferido saiu do briefing) */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <Palette className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">5. Referências & Contexto</h3>
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  Refs: {liveScore.detalhes.referencias_visuais ? '+10' : '0'}/10 | Obs:{' '}
                  {liveScore.detalhes.observacoes ? '+10' : '0'}/10
                </span>
              </div>

              <div className="space-y-4">
                {/* Referências Visuais (URLs) */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Referências Visuais (Links do Pinterest, Instagram, Drive ou Nuvem):
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      placeholder="https://br.pinterest.com/pin/exemplo..."
                      value={novoLinkRef}
                      onChange={(e) => setNovoLinkRef(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReferenciaUrl())}
                      className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={addReferenciaUrl}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Link
                    </button>
                  </div>

                  {formData.referenciasUrl.length > 0 && (
                    <div className="space-y-1.5">
                      {formData.referenciasUrl.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700"
                        >
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-md text-primary-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {link}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeReferenciaUrl(idx)}
                            className="text-stone-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Observações com contador */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-stone-700">
                      Observações e Contexto do Cliente (+10 pts):
                    </label>
                    <span
                      className={clsx(
                        'text-[10px] font-mono font-medium',
                        formData.observacoes.trim().length >= 50
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      )}
                    >
                      {formData.observacoes.trim().length} / 50 caracteres mín.
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Descreva particularidades do cliente, rotina familiar, equipamentos especiais, preferências de cores e materiais..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Para pontuar neste critério, forneça ao menos 50 caracteres com detalhes essenciais.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 6: Arquiteto / Especificador Parceiro */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <UserCheck className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">
                  6. Arquiteto / Especificador Vinculado
                </h3>
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  {liveScore.detalhes.arquiteto_vinculado ? '+7 pts' : '0/7 pts'}
                </span>
              </div>

              {/* Seleção de Parceiro Cadastrado na Base + Botão Novo Parceiro */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor="select-arquiteto" className="block text-xs font-semibold text-stone-700">
                    Selecionar Parceiro da Base:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalNovoArquitetoOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition-colors w-fit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Novo Parceiro
                  </button>
                </div>

                <select
                  id="select-arquiteto"
                  value={formData.arquitetoId ? String(formData.arquitetoId) : ''}
                  onChange={(e) => handleSelectArquiteto(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Nenhum parceiro selecionado (ou cadastro avulso)</option>
                  {listaEspecificadores.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nome} {esp.escritorio ? `— ${esp.escritorio}` : ''} ({esp.tipo || 'arquiteto'})
                    </option>
                  ))}
                  {formData.arquitetoId && !listaEspecificadores.some((e) => e.id === formData.arquitetoId) && (
                    <option value={formData.arquitetoId}>
                      {formData.arquitetoNome || `Parceiro #${formData.arquitetoId}`} (atual)
                    </option>
                  )}
                </select>

                <p className="text-[11px] text-stone-500">
                  Ao selecionar um parceiro, seus dados cadastrais (nome, e-mail e telefone) são preenchidos automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Nome do Arquiteto / Escritório (+7 pts):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Studio Renata Vasquez Arquitetura"
                    value={formData.arquitetoNome}
                    onChange={(e) => setFormData({ ...formData, arquitetoNome: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">E-mail do Arquiteto:</label>
                  <input
                    type="email"
                    placeholder="arquiteto@escritorio.com"
                    value={formData.arquitetoEmail}
                    onChange={(e) => setFormData({ ...formData, arquitetoEmail: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.arquitetoTelefone}
                    onChange={(e) => setFormData({ ...formData, arquitetoTelefone: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Termômetro do Score & Checklist de Validação RN002 */}
          <div className="lg:col-span-4 space-y-4 sticky top-6">
            {/* Card Principal do Score */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Score Inteligente (RN002)
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                  Min: 70 pts
                </span>
              </div>

              {/* Termômetro Visual */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center space-y-2">
                <div
                  className={clsx(
                    'text-4xl font-black font-display tracking-tight transition-colors',
                    liveScore.aprovado
                      ? 'text-emerald-600'
                      : liveScore.score >= 50
                        ? 'text-amber-500'
                        : 'text-rose-500'
                  )}
                >
                  {liveScore.score.toFixed(0)}
                  <span className="text-sm font-medium text-stone-400 ml-1">
                    / {SCORE_MAXIMO_BRIEFING} pts
                  </span>
                </div>

                <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-300',
                      liveScore.aprovado
                        ? 'bg-emerald-500'
                        : liveScore.score >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(0, (liveScore.score / SCORE_MAXIMO_BRIEFING) * 100))}%`,
                    }}
                  />
                </div>

                <div className="pt-1">
                  {liveScore.aprovado ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Apto para Fila de Projetos
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Faltam {Math.ceil(70 - liveScore.score)} pts para liberar
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Envio na Lateral */}
              {briefing.status === 'rascunho' && (
                <button
                  type="button"
                  onClick={handleEnviarFila}
                  disabled={!liveScore.aprovado || isSending}
                  className={clsx(
                    'w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2',
                    liveScore.aprovado
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Processando Envio...' : 'Enviar para a Fila de Projetos'}
                </button>
              )}

              {/* Checklist dos critérios com pontuação */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Checklist dos {CRITERIOS_SCORE.length} Critérios:
                </h4>
                <div className="space-y-1.5 text-xs">
                  {CRITERIOS_SCORE.map((crit: CriterioDef) => {
                    const isPassed = liveScore.detalhes[crit.key]
                    return (
                      <div
                        key={crit.key}
                        className={clsx(
                          'flex items-center justify-between p-2 rounded-lg transition-colors',
                          isPassed
                            ? 'bg-emerald-50/60 text-emerald-900 border border-emerald-200/50'
                            : 'bg-stone-50 text-stone-500 border border-stone-100'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate mr-2">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0 flex items-center justify-center text-[9px] text-stone-400">
                              ✕
                            </div>
                          )}
                          <span className={clsx('truncate', isPassed && 'font-medium')}>
                            {crit.descricao}
                          </span>
                        </div>
                        <span
                          className={clsx(
                            'text-[11px] font-mono font-bold shrink-0',
                            isPassed ? 'text-emerald-700' : 'text-stone-400'
                          )}
                        >
                          +{crit.peso} pts
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Rápido de Cadastro de Parceiro (sem recarregar a tela / sem perda de rascunho) */}
      <ModalNovoParceiroRapido
        open={isModalNovoArquitetoOpen}
        onClose={() => setIsModalNovoArquitetoOpen(false)}
        onSuccess={handleArquitetoCriado}
        consultores={consultores}
      />

      {/* Drawer Lateral Direito do Guia Técnico de Apoio aos Ambientes (R1, R2, R3) */}
      <RoteiroAmbienteDrawer
        isOpen={isGuiaDrawerOpen}
        onClose={() => setIsGuiaDrawerOpen(false)}
        ambienteInicial={guiaAmbienteSelecionado}
        ambientesBriefing={ambientesFinais}
        roteirosCatalogo={roteirosCatalogo}
        onInserirTexto={handleInserirTextoNoCard}
        onAmbienteChange={(_slug, titulo) => setGuiaAmbienteSelecionado(titulo)}
        triggerKey={guiaDrawerTrigger}
      />
    </AppLayout>
  )
}

export default BriefingEdit
