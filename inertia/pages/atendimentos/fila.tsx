import React, { useState, useMemo, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import BuscaAutocomplete from '../../components/ui/BuscaAutocomplete'
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Coffee,
  LogIn,
  Trash2,
  TrendingUp,
  History,
  X,
  Phone,
  Briefcase,
  Award,
  Sparkles,
  Ban,
  Calendar,
  RotateCcw,
} from 'lucide-react'
import clsx from 'clsx'

type FilaVendedorItem = {
  id: number
  data: string
  vendedorId: number
  posicao: number
  status: string
  statusLabel: string
  motivoIndisponibilidade: string | null
  horaChegada: string | null
  ultimoAtendimentoEm: string | null
  atendimentosHoje: number
  vendedor: {
    id: number
    nome: string
    email: string
    initials: string
  } | null
  adicionadoPor: {
    id: number
    nome: string
  } | null
}

type AtendimentoRegistroItem = {
  id: number
  data: string
  vendedorId: number
  iniciadoPorId: number
  tipoAtendimento: string
  tipoAtendimentoLabel: string
  clienteNome: string | null
  clienteTelefone: string | null
  leadId: number | null
  clienteId: number | null
  arquitetoId: number | null
  foiPuloDeVez: boolean
  vendedorPuladoId: number | null
  motivoPulo: string | null
  motivoPuloLabel: string | null
  justificativaPulo: string | null
  status: string
  statusLabel: string
  desfecho: string | null
  desfechoLabel: string | null
  observacao: string | null
  iniciadoEm: string | null
  concluidoEm: string | null
  duracaoMinutos: number | null
  vendedor: { id: number; nome: string } | null
  iniciadoPor: { id: number; nome: string } | null
  vendedorPulado: { id: number; nome: string } | null
  arquiteto: { id: number; nome: string; escritorio: string | null } | null
  lead: { id: number; nome: string; statusFunil: string } | null
}

type HistoricoEventoItem = {
  id: number
  tipoEvento: string
  tipoEventoLabel: string
  vendedorId: number
  executadoPorId: number
  vendedorPuladoId: number | null
  posicaoAnterior: number | null
  posicaoNova: number | null
  motivo: string | null
  detalhes: string | null
  createdAt: string | null
  vendedor: { id: number; nome: string } | null
  executadoPor: { id: number; nome: string } | null
  vendedorPulado: { id: number; nome: string } | null
}

type MetricaMesVendedor = {
  vendedorId: number
  nome: string
  initials: string
  totalAtendimentos: number
  portaNovo: number
  retornoCarteira: number
  indicacaoEspecificador: number
  outros: number
  conversoes: number
  naoEvoluiu: number
  vezesPulouOutros: number
  vezesFoiPulado: number
}

type VendedorSimples = {
  id: number
  nome: string
  email: string
  perfil: string
}

type ArquitetoSimples = {
  id: number
  nome: string
  escritorio: string | null
}

type ClienteCatalogoItem = {
  id: number
  nome: string
  telefone: string
  email: string | null
  arquitetoId: number | null
  vendedorId: number | null
  vendedorNome: string | null
  leadId: number | null
}

type FiltrosPainel = {
  periodo: 'dia' | 'semana' | 'quinzena' | 'mes' | 'personalizado'
  dataRef?: string
  dataInicio: string
  dataFim: string
  vendedorId: string
  periodoLabel: string
}

type PageProps = {
  dataHoje: string
  mesReferencia: string
  filtrosPainel?: FiltrosPainel
  fila: FilaVendedorItem[]
  proximoDaVez: FilaVendedorItem | null
  meuItemFila: FilaVendedorItem | null
  atendimentosEmAndamento: AtendimentoRegistroItem[]
  atendimentosConcluidosHoje: AtendimentoRegistroItem[]
  historicoEventos: HistoricoEventoItem[]
  metricasMes: MetricaMesVendedor[]
  vendedoresForaDaFila: VendedorSimples[]
  todosVendedores: VendedorSimples[]
  arquitetos: ArquitetoSimples[]
  clientesCatalogo: ClienteCatalogoItem[]
  permissoesFila: {
    podeOperar: boolean
    podeGerenciarOrdem: boolean
    isVendedor: boolean
  }
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  disponivel: { label: 'Disponível', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ocupado_interno: { label: 'Ocupado / Orçamento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pausa: { label: 'Em Pausa', className: 'bg-stone-100 text-stone-700 border-stone-200' },
  ausente: { label: 'Ausente', className: 'bg-red-50 text-red-700 border-red-200' },
}

const OPCOES_TIPO_ATENDIMENTO = [
  { value: 'porta_novo', label: 'Cliente Novo', desc: 'Porta / Showroom' },
  { value: 'retorno_carteira', label: 'Retorno de Carteira', desc: 'Cliente já é do vendedor' },
  { value: 'indicacao_especificador', label: 'Indicação Especificador', desc: 'Arquiteto / Parceiro' },
  { value: 'agendado', label: 'Atendimento Agendado', desc: 'Horário marcado' },
  { value: 'outro', label: 'Outro', desc: 'Demanda avulsa' },
]

const OPCOES_MOTIVO_PULO = [
  { value: 'cliente_procurou_vendedor', label: 'Carteira / Procurou vendedor' },
  { value: 'parceiro_especificador', label: 'Indicação de arquiteto / parceiro' },
  { value: 'vendedor_recusou', label: 'Vendedor da vez recusou' },
  { value: 'vendedor_ocupado_briefing', label: 'Vendedor ocupado (orçamento/briefing)' },
  { value: 'outro', label: 'Outro motivo' },
]

const OPCOES_DESFECHO = [
  { value: 'gerou_lead', label: 'Novo Lead no CRM', desc: 'Abrir card no funil' },
  { value: 'gerou_orcamento', label: 'Gerou Orçamento', desc: 'Em elaboração / projeto' },
  { value: 'retorno_agendado', label: 'Retorno Agendado', desc: 'Nova visita marcada' },
  { value: 'nao_evoluiu', label: 'Não Evoluiu', desc: 'Showroom sem interesse' },
  { value: 'outro', label: 'Outro Desfecho', desc: 'Registrar observação' },
]

const OPCOES_STATUS_MODAL = [
  { value: 'disponivel', label: 'Disponível', desc: 'Pronto para atender' },
  { value: 'ocupado_interno', label: 'Ocupado', desc: 'Orçamento / Projeto' },
  { value: 'pausa', label: 'Em Pausa', desc: 'Intervalo / Almoço' },
  { value: 'ausente', label: 'Ausente', desc: 'Saída externa' },
]

const OPCOES_PERIODO_FILTRO: Array<{ value: 'dia' | 'semana' | 'quinzena' | 'mes'; label: string }> = [
  { value: 'dia', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'quinzena', label: 'Quinzena' },
  { value: 'mes', label: 'Mês' },
]

function formatarHora(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatarDataHoraSegundos(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatarDataBR(dataISO: string): string {
  if (!dataISO) return ''
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function AtendimentoFilaPage({
  dataHoje,
  mesReferencia,
  filtrosPainel,
  fila,
  proximoDaVez,
  meuItemFila,
  atendimentosEmAndamento,
  atendimentosConcluidosHoje,
  historicoEventos,
  metricasMes,
  vendedoresForaDaFila,
  todosVendedores,
  arquitetos,
  clientesCatalogo = [],
  permissoesFila,
}: PageProps) {
  const [activeBottomTab, setActiveBottomTab] = useState<'metricas' | 'auditoria'>('metricas')
  const [vendedorParaAdicionar, setVendedorParaAdicionar] = useState<string>('')
  const [processando, setProcessando] = useState(false)

  // Modal Iniciar Atendimento
  const [modalIniciarOpen, setModalIniciarOpen] = useState(false)
  const [iniciarVendedorId, setIniciarVendedorId] = useState<string>('')
  const [iniciarTipo, setIniciarTipo] = useState<string>('porta_novo')
  const [iniciarClienteId, setIniciarClienteId] = useState<string>('')
  const [iniciarClienteNome, setIniciarClienteNome] = useState('')
  const [iniciarClienteTelefone, setIniciarClienteTelefone] = useState('')
  const [iniciarArquitetoId, setIniciarArquitetoId] = useState<string>('')
  const [iniciarMotivoPulo, setIniciarMotivoPulo] = useState<string>('')
  const [iniciarJustificativaPulo, setIniciarJustificativaPulo] = useState('')
  const [iniciarObservacao, setIniciarObservacao] = useState('')

  // Modal Concluir Atendimento
  const [registroConcluir, setRegistroConcluir] = useState<AtendimentoRegistroItem | null>(null)
  const [concluirDesfecho, setConcluirDesfecho] = useState<string>('gerou_lead')
  const [concluirObservacao, setConcluirObservacao] = useState('')
  const [concluirCriarLead, setConcluirCriarLead] = useState(true)
  const [concluirClienteNome, setConcluirClienteNome] = useState('')
  const [concluirClienteTelefone, setConcluirClienteTelefone] = useState('')

  // Modal Alterar Disponibilidade com Motivo
  const [statusModalItem, setStatusModalItem] = useState<FilaVendedorItem | null>(null)
  const [novoStatusEscolha, setNovoStatusEscolha] = useState<string>('ocupado_interno')
  const [motivoStatusEscolha, setMotivoStatusEscolha] = useState('')

  const disponiveisCount = useMemo(
    () => fila.filter((f) => f.status === 'disponivel').length,
    [fila]
  )
  const emAtendimentoCount = useMemo(
    () => fila.filter((f) => f.status === 'em_atendimento').length,
    [fila]
  )

  const vaiPularDaVez = useMemo(() => {
    if (!proximoDaVez || !iniciarVendedorId) return false
    return Number(iniciarVendedorId) !== proximoDaVez.vendedorId
  }, [proximoDaVez, iniciarVendedorId])

  const opcoesVendedoresForaDaFila = useMemo(
    () =>
      vendedoresForaDaFila.map((v) => ({
        value: String(v.id),
        label: v.nome,
        descricao: v.email,
      })),
    [vendedoresForaDaFila]
  )

  const opcoesVendedoresModal = useMemo(
    () => [
      ...fila.map((f) => ({
        value: String(f.vendedorId),
        label: f.vendedor?.nome || `Vendedor #${f.vendedorId}`,
        descricao:
          proximoDaVez?.vendedorId === f.vendedorId
            ? `★ ${f.posicao}º da fila — PRÓXIMO DA VEZ`
            : `${f.posicao}º na fila (${f.statusLabel})`,
      })),
      ...vendedoresForaDaFila.map((v) => ({
        value: String(v.id),
        label: v.nome,
        descricao: 'Fora da fila hoje — será incluído ao iniciar',
      })),
    ],
    [fila, proximoDaVez, vendedoresForaDaFila]
  )

  const opcoesArquitetos = useMemo(
    () =>
      arquitetos.map((a) => ({
        value: String(a.id),
        label: a.nome,
        descricao: a.escritorio,
      })),
    [arquitetos]
  )

  const opcoesClientesModal = useMemo(() => {
    const vendedorAtualId = iniciarVendedorId ? Number(iniciarVendedorId) : null
    const ordenados = [...clientesCatalogo].sort((a, b) => {
      const aDaCarteira = vendedorAtualId && a.vendedorId === vendedorAtualId ? 0 : 1
      const bDaCarteira = vendedorAtualId && b.vendedorId === vendedorAtualId ? 0 : 1
      if (aDaCarteira !== bDaCarteira) return aDaCarteira - bDaCarteira
      return a.nome.localeCompare(b.nome)
    })

    const lista = ordenados.map((c) => ({
      value: String(c.id),
      label: c.nome,
      descricao: [
        c.telefone,
        c.vendedorNome ? `Carteira: ${c.vendedorNome}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }))

    if (iniciarClienteId === '__novo__' && iniciarClienteNome.trim()) {
      lista.unshift({
        value: '__novo__',
        label: iniciarClienteNome.trim(),
        descricao: 'Novo cliente — será cadastrado ao iniciar',
      })
    }

    return lista
  }, [clientesCatalogo, iniciarVendedorId, iniciarClienteId, iniciarClienteNome])

  const clienteSelecionado = useMemo(
    () =>
      iniciarClienteId && iniciarClienteId !== '__novo__'
        ? clientesCatalogo.find((c) => String(c.id) === iniciarClienteId) || null
        : null,
    [clientesCatalogo, iniciarClienteId]
  )

  const filtroAtivo: FiltrosPainel = filtrosPainel || {
    periodo: 'mes',
    dataInicio: dataHoje,
    dataFim: dataHoje,
    vendedorId: '',
    periodoLabel: mesReferencia,
  }

  const [localDataInicio, setLocalDataInicio] = useState(filtroAtivo.dataInicio)
  const [localDataFim, setLocalDataFim] = useState(filtroAtivo.dataFim)

  useEffect(() => {
    setLocalDataInicio(filtroAtivo.dataInicio)
  }, [filtroAtivo.dataInicio])

  useEffect(() => {
    setLocalDataFim(filtroAtivo.dataFim)
  }, [filtroAtivo.dataFim])

  const temFiltroCustomizado = filtroAtivo.periodo !== 'mes' || Boolean(filtroAtivo.vendedorId)

  const opcoesFiltroVendedor = useMemo(
    () =>
      todosVendedores.map((v) => ({
        value: String(v.id),
        label: v.nome,
        descricao: v.email,
      })),
    [todosVendedores]
  )

  const handleAplicarFiltros = (
    updates: Partial<Pick<FiltrosPainel, 'periodo' | 'dataInicio' | 'dataFim' | 'vendedorId'>>
  ) => {
    const nextVendedorId =
      updates.vendedorId !== undefined ? updates.vendedorId : filtroAtivo.vendedorId

    if (updates.periodo && updates.periodo !== 'personalizado') {
      router.get(
        '/atendimentos/fila',
        {
          periodo: updates.periodo,
          ...(nextVendedorId ? { vendedorId: nextVendedorId } : {}),
        },
        {
          preserveState: true,
          preserveScroll: true,
        }
      )
      return
    }

    const editouIntervalo =
      updates.dataInicio !== undefined ||
      updates.dataFim !== undefined ||
      updates.periodo === 'personalizado' ||
      filtroAtivo.periodo === 'personalizado'

    if (editouIntervalo) {
      const nextInicio =
        updates.dataInicio !== undefined ? updates.dataInicio : filtroAtivo.dataInicio
      const nextFim = updates.dataFim !== undefined ? updates.dataFim : filtroAtivo.dataFim

      router.get(
        '/atendimentos/fila',
        {
          periodo: 'personalizado',
          dataInicio: nextInicio,
          dataFim: nextFim,
          ...(nextVendedorId ? { vendedorId: nextVendedorId } : {}),
        },
        {
          preserveState: true,
          preserveScroll: true,
        }
      )
      return
    }

    router.get(
      '/atendimentos/fila',
      {
        periodo: filtroAtivo.periodo,
        ...(nextVendedorId ? { vendedorId: nextVendedorId } : {}),
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    )
  }

  const isDataProntaParaAutoFiltro = (val: string): boolean => {
    if (val === '') return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false
    const ano = Number(val.slice(0, 4))
    return ano >= 2000 && ano <= 2099
  }

  const handleChangeDataInicio = (val: string) => {
    setLocalDataInicio(val)
    if (isDataProntaParaAutoFiltro(val)) {
      const fimValido = /^\d{4}-\d{2}-\d{2}$/.test(localDataFim) ? localDataFim : ''
      handleAplicarFiltros({
        periodo: 'personalizado',
        dataInicio: val,
        dataFim: fimValido,
      })
    }
  }

  const handleChangeDataFim = (val: string) => {
    setLocalDataFim(val)
    if (isDataProntaParaAutoFiltro(val)) {
      const inicioValido = /^\d{4}-\d{2}-\d{2}$/.test(localDataInicio) ? localDataInicio : ''
      handleAplicarFiltros({
        periodo: 'personalizado',
        dataInicio: inicioValido,
        dataFim: val,
      })
    }
  }

  const handleBlurDatas = () => {
    const inicioValido = localDataInicio === '' || /^\d{4}-\d{2}-\d{2}$/.test(localDataInicio)
    const fimValido = localDataFim === '' || /^\d{4}-\d{2}-\d{2}$/.test(localDataFim)

    if (!inicioValido) setLocalDataInicio(filtroAtivo.dataInicio)
    if (!fimValido) setLocalDataFim(filtroAtivo.dataFim)

    const nextInicio = inicioValido ? localDataInicio : filtroAtivo.dataInicio
    const nextFim = fimValido ? localDataFim : filtroAtivo.dataFim

    if (nextInicio !== filtroAtivo.dataInicio || nextFim !== filtroAtivo.dataFim) {
      handleAplicarFiltros({
        periodo: 'personalizado',
        dataInicio: nextInicio,
        dataFim: nextFim,
      })
    }
  }

  const handleEntrarNaFila = (vendedorId?: number) => {
    setProcessando(true)
    router.post(
      '/atendimentos/fila/entrar',
      vendedorId ? { vendedorId } : {},
      {
        preserveScroll: true,
        onFinish: () => {
          setProcessando(false)
          setVendedorParaAdicionar('')
        },
      }
    )
  }

  const handleMudarStatusRapido = (itemId: number, status: string, motivo?: string) => {
    setProcessando(true)
    router.patch(
      `/atendimentos/fila/${itemId}/status`,
      { status, motivoIndisponibilidade: motivo || null },
      {
        preserveScroll: true,
        onFinish: () => {
          setProcessando(false)
          setStatusModalItem(null)
          setMotivoStatusEscolha('')
        },
      }
    )
  }

  const handleReordenar = (itemId: number, direcao: 'up' | 'down' | 'top' | 'bottom') => {
    setProcessando(true)
    router.patch(
      `/atendimentos/fila/${itemId}/reordenar`,
      { direcao },
      {
        preserveScroll: true,
        onFinish: () => setProcessando(false),
      }
    )
  }

  const handleRemoverDaFila = (itemId: number) => {
    setProcessando(true)
    router.delete(`/atendimentos/fila/${itemId}`, {
      preserveScroll: true,
      onFinish: () => setProcessando(false),
    })
  }

  const abrirModalIniciar = (vendedorIdPreferencial?: number) => {
    const idPadrao =
      vendedorIdPreferencial ??
      proximoDaVez?.vendedorId ??
      fila[0]?.vendedorId ??
      (todosVendedores.length > 0 ? todosVendedores[0].id : '')
    setIniciarVendedorId(idPadrao ? String(idPadrao) : '')
    setIniciarTipo('porta_novo')
    setIniciarClienteId('')
    setIniciarClienteNome('')
    setIniciarClienteTelefone('')
    setIniciarArquitetoId('')
    setIniciarMotivoPulo('')
    setIniciarJustificativaPulo('')
    setIniciarObservacao('')
    setModalIniciarOpen(true)
  }

  const handleSelecionarClienteExistente = (clienteIdStr: string) => {
    setIniciarClienteId(clienteIdStr)
    if (!clienteIdStr) {
      setIniciarClienteNome('')
      setIniciarClienteTelefone('')
      return
    }
    if (clienteIdStr === '__novo__') {
      return
    }
    const found = clientesCatalogo.find((c) => String(c.id) === clienteIdStr)
    if (found) {
      setIniciarClienteNome(found.nome)
      setIniciarClienteTelefone(found.telefone || '')
      if (found.arquitetoId && !iniciarArquitetoId) {
        setIniciarArquitetoId(String(found.arquitetoId))
      }
    }
  }

  const handleSubmitIniciarAtendimento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!iniciarVendedorId) return
    setProcessando(true)
    router.post(
      '/atendimentos/fila/iniciar-atendimento',
      {
        vendedorId: Number(iniciarVendedorId),
        tipoAtendimento: iniciarTipo,
        clienteId:
          iniciarClienteId && iniciarClienteId !== '__novo__' ? Number(iniciarClienteId) : null,
        clienteNome: iniciarClienteNome || null,
        clienteTelefone: iniciarClienteTelefone || null,
        arquitetoId: iniciarArquitetoId ? Number(iniciarArquitetoId) : null,
        motivoPulo: vaiPularDaVez ? iniciarMotivoPulo || null : null,
        justificativaPulo: vaiPularDaVez ? iniciarJustificativaPulo || null : null,
        observacao: iniciarObservacao || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => setModalIniciarOpen(false),
        onFinish: () => setProcessando(false),
      }
    )
  }

  const abrirModalConcluir = (registro: AtendimentoRegistroItem) => {
    setRegistroConcluir(registro)
    setConcluirDesfecho('gerou_lead')
    setConcluirObservacao(registro.observacao || '')
    setConcluirCriarLead(!registro.leadId && Boolean(registro.clienteNome))
    setConcluirClienteNome(registro.clienteNome || '')
    setConcluirClienteTelefone(registro.clienteTelefone || '')
  }

  const handleSubmitConcluirAtendimento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!registroConcluir) return
    setProcessando(true)
    router.post(
      `/atendimentos/fila/atendimentos/${registroConcluir.id}/concluir`,
      {
        desfecho: concluirDesfecho,
        observacao: concluirObservacao || null,
        criarLeadNoCrm: concluirCriarLead,
        clienteNome: concluirClienteNome || null,
        clienteTelefone: concluirClienteTelefone || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => setRegistroConcluir(null),
        onFinish: () => setProcessando(false),
      }
    )
  }

  return (
    <AppLayout
      title="Fila de Atendimento (Showroom)"
      subtitle="Rodízio diário da vez na recepção, controle de disponibilidade e métricas da equipe"
    >
      <Head title="Fila de Atendimento" />

      <div className="space-y-6 pb-12">
        {/* KPIs / Resumo do Dia + Ações Rápidas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs">
              <Clock size={14} className="text-primary-600" />
              Hoje: {formatarDataBR(dataHoje)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700">
              <Users size={14} className="text-stone-500" />
              Na fila: <strong>{fila.length}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              <UserCheck size={14} className="text-emerald-600" />
              Disponíveis: <strong>{disponiveisCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
              <Play size={14} className="text-blue-600" />
              Em atendimento: <strong>{emAtendimentoCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700">
              <CheckCircle2 size={14} className="text-stone-600" />
              Concluídos hoje: <strong>{atendimentosConcluidosHoje.length}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Cheguei na Loja exclusivo para perfil vendedor */}
            {permissoesFila.podeOperar && permissoesFila.isVendedor && !meuItemFila && (
              <button
                type="button"
                disabled={processando}
                onClick={() => handleEntrarNaFila()}
                className="btn-secondary border-primary-300 text-primary-800 bg-primary-50 hover:bg-primary-100"
              >
                <LogIn size={16} />
                <span>Cheguei na Loja (Entrar na Fila)</span>
              </button>
            )}

            {permissoesFila.podeOperar && (
              <button
                type="button"
                disabled={processando}
                onClick={() => abrirModalIniciar()}
                className="btn-primary"
              >
                <Play size={16} />
                <span>Encaminhar Cliente</span>
              </button>
            )}
          </div>
        </div>

        {/* Faixa de Status do Próprio Usuário na Fila */}
        {meuItemFila && (
          <div className="card p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white border-stone-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary-500/20 border border-primary-400/40 flex items-center justify-center font-display font-bold text-lg text-primary-300">
                  {meuItemFila.posicao}º
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Sua posição na fila de hoje: {meuItemFila.posicao}º lugar
                    </span>
                    {proximoDaVez?.vendedorId === meuItemFila.vendedorId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-stone-950">
                        Você é o Próximo da Vez!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Status atual: <strong>{meuItemFila.statusLabel}</strong>
                    {meuItemFila.motivoIndisponibilidade
                      ? ` (${meuItemFila.motivoIndisponibilidade})`
                      : ''}
                    {' · '}Atendimentos hoje: <strong>{meuItemFila.atendimentosHoje}</strong>
                  </p>
                </div>
              </div>

              {meuItemFila.status !== 'em_atendimento' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={processando || meuItemFila.status === 'disponivel'}
                    onClick={() => handleMudarStatusRapido(meuItemFila.id, 'disponivel')}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                      meuItemFila.status === 'disponivel'
                        ? 'bg-emerald-500 text-stone-950'
                        : 'bg-stone-700 hover:bg-emerald-600 text-stone-100'
                    )}
                  >
                    <UserCheck size={14} />
                    Disponível
                  </button>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => {
                      setStatusModalItem(meuItemFila)
                      setNovoStatusEscolha('ocupado_interno')
                      setMotivoStatusEscolha('Elaborando orçamento / projeto')
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                      meuItemFila.status === 'ocupado_interno'
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-700 hover:bg-amber-500 hover:text-stone-950 text-stone-100'
                    )}
                  >
                    <Briefcase size={14} />
                    Ocupado
                  </button>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => handleMudarStatusRapido(meuItemFila.id, 'pausa', 'Intervalo / Pausa')}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                      meuItemFila.status === 'pausa'
                        ? 'bg-stone-300 text-stone-900'
                        : 'bg-stone-700 hover:bg-stone-600 text-stone-100'
                    )}
                  >
                    <Coffee size={14} />
                    Pausa
                  </button>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => handleRemoverDaFila(meuItemFila.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-stone-300 hover:text-red-300 hover:bg-stone-700 transition-colors"
                    title="Sair da fila de hoje"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grade Principal: Próximo da Vez + Lista Ordenada | Atendimentos Ativos e Concluídos */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Coluna Esquerda (7 cols): Próximo da Vez + Fila da Recepção */}
          <div className="xl:col-span-7 space-y-5">
            {/* Destaque Próximo da Vez */}
            <div className="card p-5 border-primary-200 bg-gradient-to-br from-amber-50/70 via-white to-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Próximo da Vez para Atendimento de Porta
                </span>
                {proximoDaVez && (
                  <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {proximoDaVez.posicao}º na fila · Disponível
                  </span>
                )}
              </div>

              {proximoDaVez ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
                      {proximoDaVez.vendedor?.initials || 'VD'}
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-stone-900">
                        {proximoDaVez.vendedor?.nome}
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Chegada às <strong>{formatarHora(proximoDaVez.horaChegada)}</strong>
                        {' · '}Atendimentos hoje: <strong>{proximoDaVez.atendimentosHoje}</strong>
                        {proximoDaVez.ultimoAtendimentoEm &&
                          ` · Último às ${formatarHora(proximoDaVez.ultimoAtendimentoEm)}`}
                      </p>
                    </div>
                  </div>

                  {permissoesFila.podeOperar && (
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() => abrirModalIniciar(proximoDaVez.vendedorId)}
                      className="btn-primary px-5 py-2.5 shadow-sm shrink-0"
                    >
                      <Play size={16} />
                      <span>Chamar Próximo da Vez</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2 text-stone-600">
                  <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-stone-800">
                      Nenhum vendedor disponível no momento.
                    </p>
                    <p className="text-stone-500 mt-0.5">
                      Os vendedores presentes podem estar em atendimento ou ocupados. Inclua vendedores na fila ou aguarde a liberação.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lista Ordenada da Fila */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-base text-stone-900">
                    Ordem da Fila de Hoje
                  </h3>
                  <p className="text-xs text-stone-500">
                    Ao finalizar qualquer atendimento (porta, carteira ou indicação), o vendedor vai automaticamente para o fim da fila.
                  </p>
                </div>
                {permissoesFila.podeGerenciarOrdem && (
                  <span className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                    Reordenação Liberada
                  </span>
                )}
              </div>

              {/* Barra destacada com autocomplete para incluir vendedor na fila dentro do card */}
              {permissoesFila.podeGerenciarOrdem && vendedoresForaDaFila.length > 0 && (
                <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 sm:pt-2 shrink-0">
                    <UserPlus size={15} className="text-emerald-600 shrink-0" />
                    <span>Incluir Vendedor na Fila (Disponível):</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 flex-1 max-w-md">
                    <div className="flex-1 min-w-0">
                      <BuscaAutocomplete
                        opcoes={opcoesVendedoresForaDaFila}
                        value={vendedorParaAdicionar}
                        onChange={setVendedorParaAdicionar}
                        placeholder="Digite o nome do vendedor..."
                        maxSugestoes={8}
                        tituloLimpar="Limpar vendedor selecionado"
                        textoVazio={(busca) =>
                          busca
                            ? `Nenhum vendedor fora da fila encontrado para "${busca}".`
                            : 'Todos os vendedores já estão na fila de hoje.'
                        }
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!vendedorParaAdicionar || processando}
                      onClick={() => handleEntrarNaFila(Number(vendedorParaAdicionar))}
                      className="btn-sm rounded-lg font-semibold text-xs px-3 py-2 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors shrink-0"
                    >
                      <UserCheck size={14} />
                      <span>Colocar Disponível</span>
                    </button>
                  </div>
                </div>
              )}

              {fila.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={36} className="mx-auto text-stone-300 mb-3" />
                  <p className="text-sm font-medium text-stone-700">
                    Nenhum vendedor entrou na fila hoje ainda.
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Os vendedores podem clicar em &ldquo;Cheguei na Loja&rdquo; ou a Recepção pode incluí-los acima.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {fila.map((item, idx) => {
                    const isProximo = proximoDaVez?.id === item.id
                    const statusBadge = STATUS_BADGE_MAP[item.status] || {
                      label: item.statusLabel,
                      className: 'bg-stone-100 text-stone-700 border-stone-200',
                    }

                    return (
                      <div
                        key={item.id}
                        className={clsx(
                          'px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                          isProximo ? 'bg-emerald-50/40' : 'hover:bg-stone-50/70'
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={clsx(
                              'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border',
                              isProximo
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            )}
                          >
                            {item.posicao}º
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-stone-900 truncate">
                                {item.vendedor?.nome || `Vendedor #${item.vendedorId}`}
                              </span>
                              <span
                                className={clsx(
                                  'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                                  statusBadge.className
                                )}
                              >
                                {statusBadge.label}
                              </span>
                              {isProximo && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-100 text-primary-800 border border-primary-200">
                                  Próximo da Vez
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>Chegada: {formatarHora(item.horaChegada)}</span>
                              <span>Atend. hoje: {item.atendimentosHoje}</span>
                              {item.motivoIndisponibilidade && (
                                <span className="text-amber-700 font-medium">
                                  Motivo: {item.motivoIndisponibilidade}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Reordenação para Recepção / Gerente / Diretoria */}
                          {permissoesFila.podeGerenciarOrdem && (
                            <div className="flex items-center gap-1 mr-1 bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                              <button
                                type="button"
                                disabled={idx === 0 || processando}
                                onClick={() => handleReordenar(item.id, 'up')}
                                title="Subir posição na fila"
                                className="p-1.5 rounded text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 transition-colors"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === fila.length - 1 || processando}
                                onClick={() => handleReordenar(item.id, 'down')}
                                title="Descer posição na fila"
                                className="p-1.5 rounded text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 transition-colors"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          )}

                          {/* Botão direto de 1 clique para voltar vendedor a Disponível */}
                          {(permissoesFila.podeGerenciarOrdem ||
                            item.vendedorId === meuItemFila?.vendedorId) &&
                            item.status !== 'em_atendimento' &&
                            item.status !== 'disponivel' && (
                              <button
                                type="button"
                                disabled={processando}
                                onClick={() => handleMudarStatusRapido(item.id, 'disponivel')}
                                className="btn-sm rounded-lg font-semibold text-xs px-2.5 py-1.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                                title="Colocar vendedor como Disponível na fila"
                              >
                                <UserCheck size={13} />
                                <span>Colocar Disponível</span>
                              </button>
                            )}

                          {/* Alterar disponibilidade (Recepção/Gestão ou próprio vendedor) */}
                          {permissoesFila.podeGerenciarOrdem && item.status !== 'em_atendimento' && (
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() => {
                                setStatusModalItem(item)
                                setNovoStatusEscolha(
                                  item.status === 'disponivel' ? 'ocupado_interno' : 'disponivel'
                                )
                                setMotivoStatusEscolha(item.motivoIndisponibilidade || '')
                              }}
                              className="btn-ghost btn-sm px-2.5 py-1.5 text-xs border border-stone-200"
                              title="Alterar disponibilidade do vendedor"
                            >
                              <Pause size={13} />
                              <span className="hidden sm:inline">Status</span>
                            </button>
                          )}

                          {/* Iniciar atendimento direto com este vendedor */}
                          {permissoesFila.podeOperar && item.status !== 'em_atendimento' && (
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() => abrirModalIniciar(item.vendedorId)}
                              className={clsx(
                                'btn-sm rounded-lg font-medium text-xs px-3 py-1.5 inline-flex items-center gap-1.5 transition-colors',
                                isProximo
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                              )}
                            >
                              <Play size={13} />
                              <span>Atender</span>
                            </button>
                          )}

                          {/* Remover da fila */}
                          {permissoesFila.podeGerenciarOrdem && item.status !== 'em_atendimento' && (
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() => handleRemoverDaFila(item.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remover da fila de hoje"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Atalho 1-clique para vendedores fora da fila */}
              {permissoesFila.podeGerenciarOrdem && vendedoresForaDaFila.length > 0 && (
                <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Vendedores fora da fila hoje ({vendedoresForaDaFila.length}) — clique para colocar disponível:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {vendedoresForaDaFila.map((v) => (
                      <button
                        key={`chip-add-${v.id}`}
                        type="button"
                        disabled={processando}
                        onClick={() => handleEntrarNaFila(v.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 text-xs font-medium text-stone-700 hover:text-emerald-800 transition-colors"
                      >
                        <UserPlus size={12} className="text-emerald-600" />
                        <span>{v.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita (5 cols): Atendimentos em Andamento + Concluídos Hoje */}
          <div className="xl:col-span-5 space-y-5">
            {/* Em Andamento */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-blue-50/40">
                <div className="flex items-center gap-2">
                  <Play size={16} className="text-blue-600" />
                  <h3 className="font-display font-semibold text-base text-stone-900">
                    Em Atendimento Agora ({atendimentosEmAndamento.length})
                  </h3>
                </div>
              </div>

              {atendimentosEmAndamento.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  Nenhum atendimento presencial em andamento no momento.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {atendimentosEmAndamento.map((reg) => (
                    <div key={reg.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-stone-900">
                              {reg.vendedor?.nome}
                            </span>
                            <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                              {reg.tipoAtendimentoLabel}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Iniciado às <strong>{formatarHora(reg.iniciadoEm)}</strong>
                            {reg.clienteNome && ` · Cliente: ${reg.clienteNome}`}
                            {reg.clienteTelefone && ` (${reg.clienteTelefone})`}
                          </p>
                          {reg.arquiteto && (
                            <p className="text-xs text-primary-700 mt-0.5">
                              Especificador: <strong>{reg.arquiteto.nome}</strong>
                            </p>
                          )}
                          {reg.clienteId && (
                            <Link
                              href={`/clientes/${reg.clienteId}`}
                              className="inline-block text-[11px] font-semibold text-primary-700 hover:underline mt-0.5"
                            >
                              Abrir Ficha do Cliente ↗
                            </Link>
                          )}
                        </div>
                      </div>

                      {reg.foiPuloDeVez && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">
                              Pulo de Vez registrado (pulou {reg.vendedorPulado?.nome || 'vendedor da vez'})
                            </span>
                            {reg.motivoPuloLabel && (
                              <p className="text-[11px] text-amber-800 mt-0.5">
                                Motivo: {reg.motivoPuloLabel}
                                {reg.justificativaPulo ? ` — "${reg.justificativaPulo}"` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {permissoesFila.podeOperar && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={processando}
                            onClick={() => abrirModalConcluir(reg)}
                            className="btn-primary btn-sm"
                          >
                            <CheckCircle2 size={14} />
                            <span>Concluir Atendimento (Ir p/ Fim da Fila)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Concluídos Hoje */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200/80 flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm text-stone-900 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Concluídos Hoje ({atendimentosConcluidosHoje.length})
                </h3>
              </div>

              {atendimentosConcluidosHoje.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  Ainda não há atendimentos concluídos hoje.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-[380px] overflow-y-auto">
                  {atendimentosConcluidosHoje.map((reg) => (
                    <div key={reg.id} className="px-4 py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-800">
                          {reg.vendedor?.nome}
                          {reg.clienteNome ? ` — ${reg.clienteNome}` : ''}
                        </span>
                        <span className="text-stone-500">
                          {formatarHora(reg.iniciadoEm)}–{formatarHora(reg.concluidoEm)} (
                          {reg.duracaoMinutos || 1} min)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                          {reg.tipoAtendimentoLabel}
                        </span>
                        {reg.desfechoLabel && (
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded font-medium',
                              reg.desfecho === 'nao_evoluiu'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            )}
                          >
                            {reg.desfechoLabel}
                          </span>
                        )}
                        {reg.foiPuloDeVez && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">
                            Com pulo de vez
                          </span>
                        )}
                        {reg.clienteId && (
                          <Link
                            href={`/clientes/${reg.clienteId}`}
                            className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 hover:underline font-semibold"
                          >
                            Ficha do Cliente ↗
                          </Link>
                        )}
                        {reg.leadId && (
                          <Link
                            href="/crm"
                            className="px-2 py-0.5 rounded bg-primary-50 text-primary-800 hover:underline font-semibold"
                          >
                            Lead no CRM ↗
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel Inferior: Métricas por Período e Auditoria Imutável */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-stone-200/80 space-y-3 bg-stone-50/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('metricas')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    activeBottomTab === 'metricas'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-200/70'
                  )}
                >
                  <TrendingUp size={14} />
                  <span>Métricas ({filtroAtivo.periodoLabel})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('auditoria')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    activeBottomTab === 'auditoria'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-200/70'
                  )}
                >
                  <History size={14} />
                  <span>Auditoria da Fila ({historicoEventos.length})</span>
                </button>
              </div>

              <span className="text-[11px] text-stone-500 font-medium">
                Período exibido:{' '}
                <strong className="text-stone-700">
                  {filtroAtivo.dataInicio && filtroAtivo.dataFim
                    ? filtroAtivo.dataInicio === filtroAtivo.dataFim
                      ? formatarDataBR(filtroAtivo.dataInicio)
                      : `${formatarDataBR(filtroAtivo.dataInicio)} a ${formatarDataBR(filtroAtivo.dataFim)}`
                    : filtroAtivo.dataInicio
                      ? `A partir de ${formatarDataBR(filtroAtivo.dataInicio)}`
                      : filtroAtivo.dataFim
                        ? `Até ${formatarDataBR(filtroAtivo.dataFim)}`
                        : 'Todo o período (sem filtro de data)'}
                </strong>
              </span>
            </div>

            {/* Barra de Filtros: Atalhos de Período, Data Início/Fim (opcionais) e Vendedor */}
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg bg-white border border-stone-200 p-0.5 shadow-2xs">
                  {OPCOES_PERIODO_FILTRO.map((op) => {
                    const ativo = filtroAtivo.periodo === op.value
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => handleAplicarFiltros({ periodo: op.value })}
                        className={clsx(
                          'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                          ativo
                            ? 'bg-primary-600 text-white shadow-2xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        {op.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2.5 py-1 gap-1.5 shadow-2xs focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/20">
                    <Calendar size={13} className="text-stone-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-stone-500 shrink-0">De:</span>
                    <input
                      type="date"
                      value={localDataInicio}
                      onChange={(e) => handleChangeDataInicio(e.target.value)}
                      onBlur={handleBlurDatas}
                      aria-label="Data inicial do filtro (opcional)"
                      autoComplete="off"
                      className="text-xs text-stone-800 bg-transparent focus:outline-none w-auto"
                    />
                    {localDataInicio && (
                      <button
                        type="button"
                        onClick={() => handleChangeDataInicio('')}
                        title="Remover data inicial"
                        aria-label="Remover data inicial"
                        className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2.5 py-1 gap-1.5 shadow-2xs focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/20">
                    <Calendar size={13} className="text-stone-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-stone-500 shrink-0">Até:</span>
                    <input
                      type="date"
                      value={localDataFim}
                      onChange={(e) => handleChangeDataFim(e.target.value)}
                      onBlur={handleBlurDatas}
                      aria-label="Data final do filtro (opcional)"
                      autoComplete="off"
                      className="text-xs text-stone-800 bg-transparent focus:outline-none w-auto"
                    />
                    {localDataFim && (
                      <button
                        type="button"
                        onClick={() => handleChangeDataFim('')}
                        title="Remover data final"
                        aria-label="Remover data final"
                        className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-2 flex-1 xl:max-w-md">
                <div className="flex-1 min-w-0">
                  <BuscaAutocomplete
                    opcoes={opcoesFiltroVendedor}
                    value={filtroAtivo.vendedorId}
                    onChange={(val) => handleAplicarFiltros({ vendedorId: val })}
                    placeholder="Filtrar por vendedor..."
                    maxSugestoes={8}
                    tituloLimpar="Mostrar todos os vendedores"
                    textoVazio={(busca) =>
                      busca
                        ? `Nenhum vendedor encontrado para "${busca}".`
                        : 'Nenhum vendedor disponível.'
                    }
                  />
                </div>

                {temFiltroCustomizado && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAplicarFiltros({
                        periodo: 'mes',
                        vendedorId: '',
                      })
                    }
                    className="btn-secondary btn-sm py-1.5 px-2.5 shrink-0"
                    title="Restaurar filtros padrão (Mês atual e todos os vendedores)"
                  >
                    <RotateCcw size={13} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeBottomTab === 'metricas' ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="text-center">Total Atendimentos</th>
                    <th className="text-center">Porta (Novos)</th>
                    <th className="text-center">Retorno Carteira</th>
                    <th className="text-center">Indicação Arq./Espec.</th>
                    <th className="text-center">Conversões (Lead/Orç.)</th>
                    <th className="text-center">Não Evoluiu</th>
                    <th className="text-center">Pulos Realizados</th>
                    <th className="text-center">Vezes Pulado</th>
                  </tr>
                </thead>
                <tbody>
                  {metricasMes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-stone-500 text-xs">
                        Nenhum atendimento registrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    metricasMes.map((m) => (
                      <tr key={m.vendedorId}>
                        <td className="font-semibold text-stone-900">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-[11px] font-bold">
                              {m.initials}
                            </span>
                            <span>{m.nome}</span>
                          </div>
                        </td>
                        <td className="text-center font-bold text-stone-900">{m.totalAtendimentos}</td>
                        <td className="text-center">{m.portaNovo}</td>
                        <td className="text-center">{m.retornoCarteira}</td>
                        <td className="text-center">{m.indicacaoEspecificador}</td>
                        <td className="text-center text-emerald-700 font-semibold">{m.conversoes}</td>
                        <td className="text-center text-stone-500">{m.naoEvoluiu}</td>
                        <td className="text-center text-amber-700">{m.vezesPulouOutros}</td>
                        <td className="text-center text-red-600">{m.vezesFoiPulado}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {historicoEventos.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  Nenhum evento registrado para o período e filtro selecionados.
                </div>
              ) : (
                historicoEventos.map((ev) => (
                  <div key={ev.id} className="px-5 py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-stone-500">
                          {formatarDataHoraSegundos(ev.createdAt)}
                        </span>
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded font-semibold text-[11px]',
                            ev.tipoEvento === 'pulo_de_vez'
                              ? 'bg-amber-100 text-amber-900'
                              : ev.tipoEvento === 'reordenacao_manual'
                                ? 'bg-purple-100 text-purple-900'
                                : 'bg-stone-100 text-stone-700'
                          )}
                        >
                          {ev.tipoEventoLabel}
                        </span>
                        {ev.executadoPor && (
                          <span className="text-stone-500">
                            por <strong>{ev.executadoPor.nome}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-stone-700">{ev.detalhes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Iniciar Atendimento */}
      {modalIniciarOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Encaminhar Cliente para Atendimento
                </h3>
                <p className="text-xs text-stone-500">
                  Registre quem irá atender o cliente no showroom.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalIniciarOpen(false)}
                className="btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitIniciarAtendimento}
              autoComplete="off"
              className="p-6 space-y-4 overflow-y-auto"
            >
              {proximoDaVez ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Próximo da Vez ({proximoDaVez.posicao}º da fila)
                    </p>
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {proximoDaVez.vendedor?.nome}
                    </p>
                  </div>
                  {Number(iniciarVendedorId) === proximoDaVez.vendedorId ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shrink-0">
                      ✓ Pré-selecionado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIniciarVendedorId(String(proximoDaVez.vendedorId))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shrink-0 transition-colors"
                    >
                      Usar Próximo da Vez
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>Nenhum vendedor disponível na fila neste momento.</span>
                </div>
              )}

              <div>
                <label className="label">Vendedor Responsável *</label>
                <BuscaAutocomplete
                  opcoes={opcoesVendedoresModal}
                  value={iniciarVendedorId}
                  onChange={setIniciarVendedorId}
                  placeholder="Digite o nome do vendedor para buscar..."
                  maxSugestoes={10}
                  tituloLimpar="Limpar vendedor selecionado"
                  textoVazio={(busca) =>
                    busca
                      ? `Nenhum vendedor encontrado para "${busca}".`
                      : 'Nenhum vendedor cadastrado.'
                  }
                />
              </div>

              <div>
                <label className="label">Tipo de Atendimento *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OPCOES_TIPO_ATENDIMENTO.map((op) => {
                    const ativo = iniciarTipo === op.value
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => {
                          setIniciarTipo(op.value)
                          if (op.value === 'retorno_carteira') {
                            setIniciarMotivoPulo('cliente_procurou_vendedor')
                          } else if (op.value === 'indicacao_especificador') {
                            setIniciarMotivoPulo('parceiro_especificador')
                          }
                        }}
                        className={clsx(
                          'text-left px-3 py-2 rounded-xl border transition-all',
                          ativo
                            ? 'bg-primary-50 border-primary-500 text-primary-950 ring-1 ring-primary-400 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                        )}
                      >
                        <div className="text-xs font-semibold leading-tight">{op.label}</div>
                        <div
                          className={clsx(
                            'text-[11px] mt-0.5',
                            ativo ? 'text-primary-700' : 'text-stone-500'
                          )}
                        >
                          {op.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {iniciarTipo === 'indicacao_especificador' && (
                <div>
                  <label className="label">Arquiteto / Especificador (Opcional)</label>
                  <BuscaAutocomplete
                    opcoes={opcoesArquitetos}
                    value={iniciarArquitetoId}
                    onChange={setIniciarArquitetoId}
                    placeholder="Digite o nome ou escritório do especificador..."
                    maxSugestoes={8}
                    tituloLimpar="Remover especificador"
                    textoVazio={(busca) =>
                      busca
                        ? `Nenhum especificador encontrado para "${busca}".`
                        : 'Nenhum especificador cadastrado ainda.'
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div>
                    <label className="label">Nome do Cliente (Opcional)</label>
                    <BuscaAutocomplete
                      opcoes={opcoesClientesModal}
                      value={iniciarClienteId}
                      onChange={handleSelecionarClienteExistente}
                      placeholder="Digite o nome ou telefone..."
                      maxSugestoes={8}
                      tituloLimpar="Limpar cliente"
                      textoVazio={(busca) =>
                        busca
                          ? `Nenhum cliente encontrado para "${busca}".`
                          : 'Nenhum cliente cadastrado ainda.'
                      }
                      acaoCriar={{
                        rotulo: (busca) => `Cadastrar "${busca}" como novo cliente`,
                        exigeTexto: true,
                        onCriar: (nomeDigitado) => {
                          setIniciarClienteId('__novo__')
                          setIniciarClienteNome(nomeDigitado)
                          setIniciarClienteTelefone('')
                        },
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        name="plannit_atendimento_contato"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        value={iniciarClienteTelefone}
                        onChange={(e) => setIniciarClienteTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="input pl-8"
                      />
                    </div>
                  </div>
                </div>

                {iniciarClienteId === '__novo__' && iniciarClienteNome.trim() && (
                  <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    Novo cliente <strong>{iniciarClienteNome.trim()}</strong> será cadastrado automaticamente ao iniciar o atendimento.
                  </div>
                )}

                {clienteSelecionado && (
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-stone-700">
                      Cliente vinculado ao cadastro <strong>#{clienteSelecionado.id}</strong>
                      {clienteSelecionado.vendedorNome
                        ? ` · Carteira de ${clienteSelecionado.vendedorNome}`
                        : ''}
                    </span>
                    {clienteSelecionado.vendedorId &&
                      clienteSelecionado.vendedorId !== Number(iniciarVendedorId) && (
                        <button
                          type="button"
                          onClick={() =>
                            setIniciarVendedorId(String(clienteSelecionado.vendedorId))
                          }
                          className="px-2 py-1 rounded bg-primary-50 border border-primary-300 text-primary-800 hover:bg-primary-100 text-[11px] font-semibold transition-colors"
                        >
                          Atribuir a {clienteSelecionado.vendedorNome}
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* Alerta e Justificativa Automática de Pulo de Vez */}
              {vaiPularDaVez && proximoDaVez && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold">
                        Pulo de Vez Detectado — Próximo da fila é {proximoDaVez.vendedor?.nome}
                      </p>
                      <p className="text-amber-800 mt-0.5">
                        Para inibir favorecimentos ou recusas indevidas, este desvio ficará auditado no histórico.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label text-amber-900">
                      Motivo do Pulo {iniciarTipo === 'porta_novo' ? '*' : ''}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {OPCOES_MOTIVO_PULO.map((op) => {
                        const ativo = iniciarMotivoPulo === op.value
                        return (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => setIniciarMotivoPulo(op.value)}
                            className={clsx(
                              'text-left px-2.5 py-2 rounded-lg border text-xs font-medium transition-all',
                              ativo
                                ? 'bg-amber-200/80 border-amber-500 text-amber-950 ring-1 ring-amber-400'
                                : 'bg-white border-amber-200 text-stone-700 hover:bg-amber-100/60'
                            )}
                          >
                            {op.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="label text-amber-900">Justificativa Detalhada (Opcional)</label>
                    <textarea
                      rows={2}
                      value={iniciarJustificativaPulo}
                      onChange={(e) => setIniciarJustificativaPulo(e.target.value)}
                      placeholder="Detalhe o motivo do pulo da vez..."
                      className="input border-amber-300 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Observação Inicial (Opcional)</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={iniciarObservacao}
                  onChange={(e) => setIniciarObservacao(e.target.value)}
                  placeholder="Ex: Procurando cozinha planejada ou sofá"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalIniciarOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    processando ||
                    !iniciarVendedorId ||
                    (vaiPularDaVez && iniciarTipo === 'porta_novo' && !iniciarMotivoPulo)
                  }
                  className="btn-primary"
                >
                  <Play size={15} />
                  <span>Iniciar Atendimento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Concluir Atendimento */}
      {registroConcluir && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Concluir Atendimento — {registroConcluir.vendedor?.nome}
                </h3>
                <p className="text-xs text-stone-500">
                  Ao concluir, o vendedor irá automaticamente para o final da fila de hoje.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegistroConcluir(null)}
                className="btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitConcluirAtendimento}
              autoComplete="off"
              className="p-6 space-y-4"
            >
              <div>
                <label className="label">Desfecho do Atendimento *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OPCOES_DESFECHO.map((op) => {
                    const ativo = concluirDesfecho === op.value
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => {
                          setConcluirDesfecho(op.value)
                          if (op.value === 'nao_evoluiu') {
                            setConcluirCriarLead(false)
                          }
                        }}
                        className={clsx(
                          'text-left px-3 py-2 rounded-xl border transition-all',
                          ativo
                            ? 'bg-primary-50 border-primary-500 text-primary-950 ring-1 ring-primary-400 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                        )}
                      >
                        <div className="text-xs font-semibold leading-tight">{op.label}</div>
                        <div
                          className={clsx(
                            'text-[11px] mt-0.5',
                            ativo ? 'text-primary-700' : 'text-stone-500'
                          )}
                        >
                          {op.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {!registroConcluir.leadId && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={concluirCriarLead}
                      onChange={(e) => setConcluirCriarLead(e.target.checked)}
                      className="rounded border-stone-300 text-primary-600 focus:ring-primary-400"
                    />
                    <span>Criar card de Lead automaticamente no Kanban do CRM</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">
                        Nome do Cliente {concluirCriarLead ? '*' : '(Opcional)'}
                      </label>
                      <input
                        type="text"
                        name="plannit_concluir_nome"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        value={concluirClienteNome}
                        onChange={(e) => setConcluirClienteNome(e.target.value)}
                        required={concluirCriarLead}
                        placeholder="Nome do cliente"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        name="plannit_concluir_contato"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        value={concluirClienteTelefone}
                        onChange={(e) => setConcluirClienteTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Observações do Atendimento</label>
                <textarea
                  rows={3}
                  value={concluirObservacao}
                  onChange={(e) => setConcluirObservacao(e.target.value)}
                  placeholder="Resumo do que o cliente procurou, ambientes ou motivo caso não tenha evoluído..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegistroConcluir(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={processando} className="btn-primary">
                  <Award size={15} />
                  <span>Concluir e Ir p/ Fim da Fila</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alterar Status de Disponibilidade */}
      {statusModalItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-stone-900">
                Disponibilidade — {statusModalItem.vendedor?.nome}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleMudarStatusRapido(statusModalItem.id, novoStatusEscolha, motivoStatusEscolha)
              }}
              autoComplete="off"
              className="p-6 space-y-4"
            >
              <div>
                <label className="label">Status na Fila</label>
                <div className="grid grid-cols-2 gap-2">
                  {OPCOES_STATUS_MODAL.map((op) => {
                    const ativo = novoStatusEscolha === op.value
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => setNovoStatusEscolha(op.value)}
                        className={clsx(
                          'text-left px-3 py-2 rounded-xl border transition-all',
                          ativo
                            ? 'bg-primary-50 border-primary-500 text-primary-950 ring-1 ring-primary-400 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                        )}
                      >
                        <div className="text-xs font-semibold leading-tight">{op.label}</div>
                        <div
                          className={clsx(
                            'text-[11px] mt-0.5',
                            ativo ? 'text-primary-700' : 'text-stone-500'
                          )}
                        >
                          {op.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {novoStatusEscolha !== 'disponivel' && (
                <div>
                  <label className="label">Motivo da Indisponibilidade</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={motivoStatusEscolha}
                    onChange={(e) => setMotivoStatusEscolha(e.target.value)}
                    placeholder="Ex: Elaborando orçamento da Sra. Ana"
                    className="input"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalItem(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={processando} className="btn-primary">
                  <Ban size={14} className={novoStatusEscolha === 'disponivel' ? 'hidden' : ''} />
                  <span>Salvar Disponibilidade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
