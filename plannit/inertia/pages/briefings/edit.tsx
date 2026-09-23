import React, { useState, useMemo } from 'react'
import { Head, Link, router } from '@inertiajs/react'
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
  X,
  Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import {
  TIPO_AMBIENTE_OPTIONS,
  ESTILOS_PREFERIDOS_OPTIONS,
  CRITERIOS_SCORE,
  STATUS_BRIEFING_MAP,
  calcularScoreBriefingClient,
  type CriterioDef,
} from '../../lib/briefing_constants'

const getXsrfToken = (): string => {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

type AmbienteItem = {
  id?: number
  tipo: string
  descricao: string
  medidasPreliminares: string
  observacoesEspecificas: string
}

export interface EspecificadorItem {
  id: number
  nome: string
  tipo: string
  email?: string | null
  telefone?: string | null
  escritorio?: string | null
  cauOuCrea?: string | null
  cidade?: string | null
  uf?: string | null
  nivelParceria?: string | null
}

export interface ConsultorItem {
  id: number
  nome: string
  email?: string | null
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
}

const BriefingEdit: React.FC<PageProps> = ({
  briefing,
  especificadores = [],
  consultores = [],
}) => {
  // Lista local de especificadores (para permitir inclusão imediata ao cadastrar via modal sem recarregar tela)
  const [listaEspecificadores, setListaEspecificadores] = useState<EspecificadorItem[]>(especificadores)
  const [isModalNovoArquitetoOpen, setIsModalNovoArquitetoOpen] = useState(false)

  // Estado do formulário
  const [formData, setFormData] = useState({
    cidadeObra: briefing.cidadeObra || '',
    estadoObra: briefing.estadoObra || '',
    enderecoObra: briefing.enderecoObra || '',
    ambientes: briefing.ambientes || [],
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
    ambientesDetalhados: briefing.ambientesDetalhados || [],
  })

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
      ambientes: formData.ambientes,
      prazoDesejado: formData.prazoDesejado,
      faixaInvestimentoMin: formData.faixaInvestimentoMin,
      faixaInvestimentoMax: formData.faixaInvestimentoMax,
      ambientesDetalhados: formData.ambientesDetalhados,
      referenciasUrl: formData.referenciasUrl,
      estiloPreferido: formData.estiloPreferido,
      arquitetoNome: formData.arquitetoNome,
      observacoes: formData.observacoes,
      scoreMinimo: briefing.scoreMinimo || 70,
    })
  }, [formData, briefing.scoreMinimo])

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
    const defaultTipo = formData.ambientes.length > 0 ? formData.ambientes[0] : 'cozinha'
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

  const updateAmbienteDetalhado = (index: number, field: keyof AmbienteItem, value: string) => {
    setFormData((prev) => {
      const copy = [...prev.ambientesDetalhados]
      copy[index] = { ...copy[index], [field]: value }
      return { ...prev, ambientesDetalhados: copy }
    })
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

  // Salvar Rascunho
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)

    router.put(
      `/briefings/${briefing.id}`,
      {
        cidadeObra: formData.cidadeObra || null,
        estadoObra: formData.estadoObra || null,
        enderecoObra: formData.enderecoObra || null,
        ambientes: formData.ambientes,
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
          ambientes: formData.ambientes,
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
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  {liveScore.detalhes.ambientes ? '+10 pts' : '0/10 pts'}
                </span>
              </div>

              <div>
                <p className="text-xs text-stone-500 mb-3">
                  Selecione os ambientes que farão parte do escopo contratual deste projeto:
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIPO_AMBIENTE_OPTIONS.map((opt: { value: string; label: string }) => {
                    const isSelected = formData.ambientes.includes(opt.value)
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => toggleAmbiente(opt.value)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                          isSelected
                            ? 'bg-primary-500 text-stone-900 border-primary-600 shadow-sm font-semibold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-stone-900" />}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Seção 3: Detalhamento dos Ambientes (15 pts + 8 pts medidas) */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <h3 className="font-semibold text-sm text-stone-900">
                    3. Detalhamento Técnico dos Ambientes
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-stone-500">
                    Desc.: {liveScore.detalhes.ambientes_detalhados ? '+15' : '0'}/15 | Medidas: {liveScore.detalhes.medidas_preliminares ? '+8' : '0'}/8
                  </span>
                  <button
                    type="button"
                    onClick={addAmbienteDetalhado}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary-400" />
                    Adicionar Ambiente
                  </button>
                </div>
              </div>

              {formData.ambientesDetalhados.length === 0 ? (
                <div className="p-6 border border-dashed border-stone-200 rounded-xl text-center bg-stone-50/50">
                  <p className="text-xs text-stone-500">
                    Nenhum ambiente detalhado adicionado ainda. Adicione pelo menos um ambiente com medidas para pontuar 23 pontos no score!
                  </p>
                  <button
                    type="button"
                    onClick={addAmbienteDetalhado}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-stone-900 font-semibold text-xs rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Primeiro Ambiente
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.ambientesDetalhados.map((amb, index) => (
                    <div
                      key={index}
                      className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 relative space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <select
                            value={amb.tipo}
                            onChange={(e) => updateAmbienteDetalhado(index, 'tipo', e.target.value)}
                            className="text-xs font-semibold text-stone-800 bg-white border border-stone-200 rounded-md px-2 py-1 capitalize focus:ring-2 focus:ring-primary-500"
                          >
                            {TIPO_AMBIENTE_OPTIONS.map((o: { value: string; label: string }) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAmbienteDetalhado(index)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                          title="Remover este ambiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            Descrição Detalhada do Ambiente (+15 pts):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Cozinha gourmet com ilha central, gavetas com amortecimento, torre quente para micro e forno..."
                            value={amb.descricao}
                            onChange={(e) => updateAmbienteDetalhado(index, 'descricao', e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
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
                            onChange={(e) => updateAmbienteDetalhado(index, 'medidasPreliminares', e.target.value)}
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
                            onChange={(e) => updateAmbienteDetalhado(index, 'observacoesEspecificas', e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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

            {/* Seção 5: Estilo, Referências & Observações */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <Palette className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-sm text-stone-900">5. Estilo, Referências & Contexto</h3>
                <span className="ml-auto text-[11px] font-bold text-stone-400 font-mono">
                  Estilo: {liveScore.detalhes.estilo_preferido ? '+8' : '0'}/8 | Refs: {liveScore.detalhes.referencias_visuais ? '+12' : '0'}/12 | Obs: {liveScore.detalhes.observacoes ? '+10' : '0'}/10
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Estilo Preferido:</label>
                  <select
                    value={formData.estiloPreferido}
                    onChange={(e) => setFormData({ ...formData, estiloPreferido: e.target.value })}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione um estilo...</option>
                    {ESTILOS_PREFERIDOS_OPTIONS.map((est: string) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>

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
                  <span className="text-sm font-medium text-stone-400 ml-1">/ 100 pts</span>
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
                    style={{ width: `${Math.min(100, Math.max(0, liveScore.score))}%` }}
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

              {/* Checklist dos 10 Critérios com Pontuação */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Checklist dos 10 Critérios:
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
    </AppLayout>
  )
}

interface ModalNovoParceiroRapidoProps {
  open: boolean
  onClose: () => void
  onSuccess: (novoArquiteto: EspecificadorItem) => void
  consultores?: ConsultorItem[]
}

const ModalNovoParceiroRapido: React.FC<ModalNovoParceiroRapidoProps> = ({
  open,
  onClose,
  onSuccess,
  consultores = [],
}) => {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('arquiteto')
  const [escritorio, setEscritorio] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cauOuCrea, setCauOuCrea] = useState('')
  const [consultorId, setConsultorId] = useState<number | ''>('')
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  if (!open) return null

  const resetForm = () => {
    setNome('')
    setTipo('arquiteto')
    setEscritorio('')
    setEmail('')
    setTelefone('')
    setCauOuCrea('')
    setConsultorId('')
    setErroMsg(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!nome.trim() || nome.trim().length < 2) {
      setErroMsg('O nome do parceiro é obrigatório (mínimo 2 caracteres).')
      return
    }

    setSalvando(true)
    setErroMsg(null)

    try {
      const payload: Record<string, any> = {
        nome: nome.trim(),
        tipo,
        statusCarteira: 'ativo',
      }

      if (escritorio.trim()) payload.escritorio = escritorio.trim()
      if (telefone.trim()) payload.telefone = telefone.trim()
      if (email.trim()) payload.email = email.trim()
      if (cauOuCrea.trim()) payload.especialidade = `Registro: ${cauOuCrea.trim()}`
      if (consultorId) payload.consultorId = Number(consultorId)

      const response = await fetch('/especificadores?format=json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let erroTexto = 'Erro ao cadastrar parceiro.'
        try {
          const errData = await response.json()
          if (errData.errors && Array.isArray(errData.errors) && errData.errors[0]?.message) {
            erroTexto = errData.errors[0].message
          } else if (errData.message) {
            erroTexto = errData.message
          }
        } catch (_) {}
        setErroMsg(erroTexto)
        setSalvando(false)
        return
      }

      const data = await response.json()
      const novoArquiteto: EspecificadorItem = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo || tipo,
        escritorio: data.escritorio || (escritorio.trim() || null),
        email: data.email || (email.trim() || null),
        telefone: data.telefone || (telefone.trim() || null),
        cauOuCrea: cauOuCrea.trim() || null,
      }

      toast.success(`Parceiro "${novoArquiteto.nome}" cadastrado e vinculado com sucesso!`)
      onSuccess(novoArquiteto)
      resetForm()
      onClose()
    } catch (err: any) {
      setErroMsg(err?.message || 'Falha na comunicação com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Cadastro Rápido de Parceiro</h3>
              <p className="text-[11px] text-stone-500">
                Adicione o arquiteto/designer sem recarregar e sem perder o rascunho do briefing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erroMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erroMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Arq. Mariana Albuquerque"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Tipo de Parceiro</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="arquiteto">Arquiteto(a)</option>
                  <option value="designer_interiores">Designer de Interiores</option>
                  <option value="decorador">Decorador(a)</option>
                  <option value="engenheiro">Engenheiro(a)</option>
                  <option value="corretor">Corretor(a)</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Escritório / Studio</label>
                <input
                  type="text"
                  placeholder="Ex: Albuquerque & Associados"
                  value={escritorio}
                  onChange={(e) => setEscritorio(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="mariana@studio.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">CAU / CREA / Registro Profissional</label>
              <input
                type="text"
                placeholder="Ex: CAU A12345-6"
                value={cauOuCrea}
                onChange={(e) => setCauOuCrea(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {consultores && consultores.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Consultor Responsável</label>
                <select
                  value={consultorId}
                  onChange={(e) => setConsultorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Automático (atribuir ao meu usuário)</option>
                  {consultores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={salvando}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Cadastrar e Vincular
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BriefingEdit
