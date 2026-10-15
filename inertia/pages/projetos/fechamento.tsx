import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  DollarSign,
  CreditCard,
  Lock,
  Unlock,
  ListChecks,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'

interface ParcelaItem {
  id: number
  numero: number
  valor: number
  vencimento: string
  status: string
  dataPagamento: string | null
  formaPagamento: string | null
  comprovanteUrl: string | null
  observacoes: string | null
}

interface ItemObrigatorio {
  id: string
  label: string
  categoria: string
}

interface Props {
  projetoId: number
  codigo: string
  clienteNome: string
  statusProjeto: string
  valorContrato: number | null
  fechamento: {
    id: number
    checklistCompleto: boolean
    cadastroAprovado: boolean
    cadastroAprovadoPor: string | null
    contratoUrl: string | null
    cadernoComercialUrl: string | null
    valorTotalFechamento: number | null
    dataLimiteAssinatura: string | null
    contratoAssinadoEm: string | null
    onboardingDisparado: boolean
    onboardingDisparadoEm: string | null
    parcelas: ParcelaItem[]
  } | null
  handoff: {
    id: number | null
    checklist: Record<string, boolean>
    checklistCompleto: boolean
    liberadoEm: string | null
    liberadoPorNome: string | null
    observacoes: string
    itensObrigatorios: readonly ItemObrigatorio[]
  }
}

export default function FechamentoShow({
  projetoId,
  codigo,
  clienteNome,
  statusProjeto,
  valorContrato,
  fechamento,
  handoff,
}: Props) {
  // Estado Fechamento Comercial
  const [contratoUrl, setContratoUrl] = useState(fechamento?.contratoUrl || '')
  const [cadernoComercialUrl, setCadernoComercialUrl] = useState(
    fechamento?.cadernoComercialUrl || ''
  )
  const [valorTotalFechamento, setValorTotalFechamento] = useState(
    fechamento?.valorTotalFechamento?.toString() || valorContrato?.toString() || ''
  )
  const [dataLimiteAssinatura, setDataLimiteAssinatura] = useState(
    fechamento?.dataLimiteAssinatura || ''
  )
  const [contratoAssinado, setContratoAssinado] = useState(
    Boolean(fechamento?.contratoAssinadoEm)
  )

  // Gerador rápido de parcelas se vazio
  const [qtdParcelasGerar, setQtdParcelasGerar] = useState(3)
  const [parcelasGeradas, setParcelasGeradas] = useState<
    Array<{ numero: number; valor: number; vencimento: string; formaPagamento: string }>
  >([])

  // Modal de Liquidação de Parcela
  const [modalLiquidarOpen, setModalLiquidarOpen] = useState(false)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaItem | null>(null)
  const [formaPagamentoLiquidar, setFormaPagamentoLiquidar] = useState('pix')
  const [comprovanteUrlLiquidar, setComprovanteUrlLiquidar] = useState('')
  const [dataPagamentoLiquidar, setDataPagamentoLiquidar] = useState(
    new Date().toISOString().substring(0, 10)
  )
  const [obsLiquidar, setObsLiquidar] = useState('')

  // Estado Checklist Handoff Técnico (RN006)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    handoff.checklist || {}
  )
  const [observacoesHandoff, setObservacoesHandoff] = useState(handoff.observacoes || '')

  const totalItens = handoff.itensObrigatorios.length
  const totalChecados = handoff.itensObrigatorios.filter(
    (item) => checklist[item.id] === true
  ).length
  const todosChecados = totalChecados === totalItens

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const marcarTodosItens = () => {
    const novoChecklist: Record<string, boolean> = {}
    handoff.itensObrigatorios.forEach((item) => {
      novoChecklist[item.id] = true
    })
    setChecklist(novoChecklist)
  }

  // Ação: Salvar Fechamento Comercial
  const handleSalvarFechamento = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      contratoUrl: contratoUrl || null,
      cadernoComercialUrl: cadernoComercialUrl || null,
      valorTotalFechamento: valorTotalFechamento ? Number(valorTotalFechamento) : null,
      dataLimiteAssinatura: dataLimiteAssinatura || null,
      contratoAssinado,
    }

    if (parcelasGeradas.length > 0) {
      payload.parcelas = parcelasGeradas
    }

    router.post(`/projetos/${projetoId}/fechamento`, payload, {
      preserveScroll: true,
      onSuccess: () => {
        setParcelasGeradas([])
      },
    })
  }

  // Gerar Plano Sugerido
  const gerarSugestaoParcelas = () => {
    const total = Number(valorTotalFechamento) || 0
    if (total <= 0 || qtdParcelasGerar <= 0) return

    const valorPorParcela = Math.round((total / qtdParcelasGerar) * 100) / 100
    const novas: Array<{
      numero: number
      valor: number
      vencimento: string
      formaPagamento: string
    }> = []

    const hoje = new Date()
    for (let i = 1; i <= qtdParcelasGerar; i++) {
      const dataVenc = new Date(hoje)
      dataVenc.setDate(hoje.getDate() + (i - 1) * 30)
      novas.push({
        numero: i,
        valor: i === qtdParcelasGerar ? total - valorPorParcela * (qtdParcelasGerar - 1) : valorPorParcela,
        vencimento: dataVenc.toISOString().substring(0, 10),
        formaPagamento: 'pix',
      })
    }
    setParcelasGeradas(novas)
  }

  // Ação: Liquidar Parcela
  const handleLiquidarParcela = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parcelaSelecionada) return

    router.post(
      `/projetos/${projetoId}/fechamento/parcelas/${parcelaSelecionada.id}/pagar`,
      {
        formaPagamento: formaPagamentoLiquidar,
        comprovanteUrl: comprovanteUrlLiquidar || null,
        dataPagamento: dataPagamentoLiquidar || null,
        observacoes: obsLiquidar || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setModalLiquidarOpen(false)
          setParcelaSelecionada(null)
          setComprovanteUrlLiquidar('')
          setObsLiquidar('')
        },
      }
    )
  }

  // Ação: Salvar Handoff Técnico (RN006)
  const handleSalvarHandoff = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(
      `/projetos/${projetoId}/handoff`,
      {
        checklist,
        observacoes: observacoesHandoff,
      },
      {
        preserveScroll: true,
      }
    )
  }

  // Métricas de parcelas
  const parcelasAtuais = fechamento?.parcelas || []
  const totalPago = parcelasAtuais
    .filter((p) => p.status === 'pago')
    .reduce((acc, p) => acc + p.valor, 0)
  const totalPendente = parcelasAtuais
    .filter((p) => p.status === 'pendente')
    .reduce((acc, p) => acc + p.valor, 0)

  return (
    <AppLayout
      title={`Fechamento & Handoff • ${codigo}`}
      subtitle={`Contratos, Financeiro e Passagem Técnica (RN006) • ${clienteNome}`}
    >
      <Head title={`Fechamento & Handoff ${codigo} | Plannit`} />

      <div className="space-y-6">
        {/* Barra Superior / Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/projetos/${projetoId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 transition-colors shadow-xs"
            >
              <ArrowLeft size={14} /> Sala de Controle do Projeto
            </Link>
            <Link
              href="/projetos"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 bg-transparent px-2 py-1.5 rounded-lg transition-colors"
            >
              Carteira Geral
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {handoff.checklistCompleto ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                <CheckCircle2 size={14} /> Handoff Liberado (RN006 Aprovada)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                <Lock size={14} /> RN006 Ativa: {totalChecados}/8 Itens
              </span>
            )}
          </div>
        </div>

        {/* Banner de Contexto do Projeto */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary-800 bg-primary-50 px-2.5 py-1 rounded border border-primary-200">
                  {codigo}
                </span>
                <h1 className="text-xl font-display font-bold text-stone-900">{clienteNome}</h1>
              </div>
              <p className="text-xs text-stone-500">
                Fase Atual do Projeto: <span className="font-semibold text-stone-700 uppercase tracking-wide">{statusProjeto.replace(/_/g, ' ')}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Valor Fechamento</span>
                <span className="font-bold text-stone-900 text-sm mt-0.5 block font-mono">
                  {valorTotalFechamento
                    ? `R$ ${Number(valorTotalFechamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Não definido'}
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Status Contrato</span>
                <span
                  className={clsx(
                    'text-xs font-bold mt-0.5 block',
                    fechamento?.contratoAssinadoEm ? 'text-emerald-700' : 'text-amber-700'
                  )}
                >
                  {fechamento?.contratoAssinadoEm ? 'Assinado' : 'Pendente'}
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Onboarding RF028</span>
                <span
                  className={clsx(
                    'text-xs font-bold mt-0.5 block',
                    fechamento?.onboardingDisparado ? 'text-emerald-700' : 'text-stone-500'
                  )}
                >
                  {fechamento?.onboardingDisparado ? 'Disparado' : 'Aguardando'}
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Passagem RN006</span>
                <span
                  className={clsx(
                    'text-xs font-bold mt-0.5 block',
                    handoff.checklistCompleto ? 'text-emerald-700' : 'text-amber-700'
                  )}
                >
                  {handoff.checklistCompleto ? 'Liberada' : 'Bloqueada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Layout em 2 Colunas: Coluna 1 (Comercial & Financeiro) e Coluna 2 (Checklist RN006) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LADO ESQUERDO: FECHAMENTO COMERCIAL & PLANO FINANCEIRO (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bloco 1: Contrato & Documentação Comercial */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-primary-600" size={18} />
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  1. Fechamento Comercial & Contrato (RF024–RF028)
                </h2>
              </div>

              <form onSubmit={handleSalvarFechamento} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Valor Total do Fechamento (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorTotalFechamento}
                      onChange={(e) => setValorTotalFechamento(e.target.value)}
                      placeholder="Ex: 85000.00"
                      className="w-full text-xs rounded-lg border-stone-200 focus:border-primary-500 focus:ring-primary-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Data Limite para Assinatura
                    </label>
                    <input
                      type="date"
                      value={dataLimiteAssinatura}
                      onChange={(e) => setDataLimiteAssinatura(e.target.value)}
                      className="w-full text-xs rounded-lg border-stone-200 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      URL do Contrato Digital (PDF)
                    </label>
                    <input
                      type="text"
                      value={contratoUrl}
                      onChange={(e) => setContratoUrl(e.target.value)}
                      placeholder="https://docs.lidermoveis.com.br/contratos/..."
                      className="w-full text-xs rounded-lg border-stone-200 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      URL do Caderno Comercial de Ambientes
                    </label>
                    <input
                      type="text"
                      value={cadernoComercialUrl}
                      onChange={(e) => setCadernoComercialUrl(e.target.value)}
                      placeholder="https://docs.lidermoveis.com.br/cadernos/..."
                      className="w-full text-xs rounded-lg border-stone-200 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Checkbox de Assinatura & Disparo de Onboarding */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contratoAssinado}
                      onChange={(e) => setContratoAssinado(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Contrato Assinado pelo Cliente
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Ao marcar como assinado, o sistema registra a data oficial e dispara
                        automaticamente o fluxo de <strong>Onboarding do Cliente (RF028)</strong>.
                      </span>
                    </div>
                  </label>

                  {fechamento?.contratoAssinadoEm && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <Check size={14} className="text-emerald-600 font-bold" />
                      <span>
                        Assinado em{' '}
                        <strong>
                          {new Date(fechamento.contratoAssinadoEm).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(fechamento.contratoAssinadoEm).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                    </div>
                  )}

                  {fechamento?.onboardingDisparado && (
                    <div className="flex items-center gap-2 text-[11px] text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      <Sparkles size={14} className="text-blue-600 font-bold" />
                      <span>
                        Onboarding disparado com sucesso para o cliente em{' '}
                        {fechamento.onboardingDisparadoEm
                          ? new Date(fechamento.onboardingDisparadoEm).toLocaleDateString('pt-BR')
                          : 'hoje'}
                        .
                      </span>
                    </div>
                  )}
                </div>

                {/* Botão de Gravação */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition shadow-sm"
                  >
                    <Check size={14} /> Salvar Dados do Fechamento
                  </button>
                </div>
              </form>
            </div>

            {/* Bloco 2: Plano de Pagamento & Parcelas Financeiras */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-emerald-600" size={18} />
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                    2. Plano Financeiro & Parcelas
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-stone-500">
                    Pago: <strong className="text-emerald-700 font-mono">R$ {totalPago.toFixed(2)}</strong>
                  </span>
                  <span className="text-stone-500">
                    Pendente: <strong className="text-amber-700 font-mono">R$ {totalPendente.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              {/* Tabela de Parcelas Existentes */}
              {parcelasAtuais.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Valor</th>
                        <th className="py-2.5 px-3">Vencimento</th>
                        <th className="py-2.5 px-3">Forma</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {parcelasAtuais.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-stone-800">
                            Parcela {p.numero}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                            R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">
                            {new Date(p.vencimento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-stone-500">
                            {p.formaPagamento || 'PIX'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                                p.status === 'pago'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              )}
                            >
                              {p.status === 'pago' ? <Check size={10} /> : <Clock size={10} />}
                              {p.status}
                            </span>
                            {p.dataPagamento && (
                              <span className="block text-[10px] text-stone-400 mt-0.5">
                                Pago em {new Date(p.dataPagamento).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {p.status !== 'pago' ? (
                              <button
                                onClick={() => {
                                  setParcelaSelecionada(p)
                                  setModalLiquidarOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition"
                              >
                                <CreditCard size={12} /> Liquidar
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400 font-semibold italic">
                                Quitado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-6 text-center">
                  <DollarSign className="mx-auto text-stone-400 mb-2" size={24} />
                  <p className="text-xs font-semibold text-stone-700">
                    Nenhuma parcela cadastrada para este fechamento.
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Gere uma sugestão automática de parcelamento abaixo ou configure manualmente.
                  </p>
                </div>
              )}

              {/* Gerador de Parcelas */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-stone-700">
                    Gerador de Plano de Pagamento:
                  </span>
                  <select
                    value={qtdParcelasGerar}
                    onChange={(e) => setQtdParcelasGerar(Number(e.target.value))}
                    className="text-xs rounded-lg border-stone-200"
                  >
                    <option value={1}>1x (À Vista)</option>
                    <option value={2}>2x Parcelas Mensais</option>
                    <option value={3}>3x Parcelas Mensais</option>
                    <option value={4}>4x Parcelas Mensais</option>
                    <option value={5}>5x Parcelas Mensais</option>
                    <option value={6}>6x Parcelas Mensais</option>
                    <option value={10}>10x Parcelas Mensais</option>
                    <option value={12}>12x Parcelas Mensais</option>
                  </select>

                  <button
                    type="button"
                    onClick={gerarSugestaoParcelas}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition"
                  >
                    Calcular Parcelas
                  </button>
                </div>

                {parcelasGeradas.length > 0 && (
                  <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-primary-900">
                      <span>Proposta Gerada ({parcelasGeradas.length} parcelas):</span>
                      <span>Total: R$ {Number(valorTotalFechamento).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {parcelasGeradas.map((p) => (
                        <div key={p.numero} className="bg-white p-2 rounded border border-primary-100 text-[11px]">
                          <span className="font-bold text-stone-700">Parcela #{p.numero}:</span>{' '}
                          <span className="font-mono font-semibold text-emerald-700">R$ {p.valor.toFixed(2)}</span>
                          <span className="block text-[10px] text-stone-400">Venc: {p.vencimento}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-600 italic">
                      Clique em <strong>"Salvar Dados do Fechamento"</strong> acima para confirmar este parcelamento no banco de dados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: CHECKLIST RN006 & HANDOFF TÉCNICO FORMAL (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="text-primary-700" size={18} />
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                    3. Handoff Técnico (RN006)
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={marcarTodosItens}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-800 transition"
                >
                  Marcar Todos
                </button>
              </div>

              {/* Alerta de Guardrail RN006 */}
              <div
                className={clsx(
                  'p-4 rounded-xl border flex items-start gap-3',
                  todosChecados
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                )}
              >
                {todosChecados ? (
                  <CheckCircle2 className="text-emerald-600 mt-0.5 shrink-0" size={18} />
                ) : (
                  <ShieldAlert className="text-amber-600 mt-0.5 shrink-0" size={18} />
                )}
                <div className="text-xs space-y-1">
                  <span className="font-bold block">
                    {todosChecados
                      ? 'RN006 Cumprida: Requisitos de Passagem Satisfeitos'
                      : `RN006 Pendente: ${totalChecados} de ${totalItens} itens obrigatórios`}
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    O avanço para conferência técnica de obras e produção é estritamente bloqueado
                    enquanto qualquer um dos 8 itens obrigatórios abaixo não for aprovado.
                  </p>
                </div>
              </div>

              {/* Lista dos 8 Itens Obrigatórios */}
              <form onSubmit={handleSalvarHandoff} className="space-y-4">
                <div className="space-y-2">
                  {handoff.itensObrigatorios.map((item) => {
                    const isChecked = checklist[item.id] === true
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className={clsx(
                          'flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer select-none',
                          isChecked
                            ? 'bg-stone-50 border-emerald-300'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // tratado no onClick do container
                            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span
                              className={clsx(
                                'text-xs font-semibold block',
                                isChecked ? 'text-stone-900' : 'text-stone-700'
                              )}
                            >
                              {item.label}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-stone-400">
                              Categoria: {item.categoria}
                            </span>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-500'
                          )}
                        >
                          {isChecked ? 'Conferido' : 'Pendente'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Observações do Handoff Técnico */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Observações Técnicas de Handoff (Condomínio, Acesso, Restrições)
                  </label>
                  <textarea
                    rows={3}
                    value={observacoesHandoff}
                    onChange={(e) => setObservacoesHandoff(e.target.value)}
                    placeholder="Instruções para o conferente e equipe de medição..."
                    className="w-full text-xs rounded-lg border-stone-200 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                {/* Carimbo de Auditoria */}
                {handoff.liberadoEm && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-0.5">
                    <span className="font-bold text-stone-800 block">Auditoria de Liberação:</span>
                    <p className="text-[11px]">
                      Liberado por: <strong>{handoff.liberadoPorNome || 'Gestor'}</strong>
                    </p>
                    <p className="text-[11px]">
                      Em:{' '}
                      <strong>
                        {new Date(handoff.liberadoEm).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(handoff.liberadoEm).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </p>
                  </div>
                )}

                {/* Botão de Liberação / Gravação do Handoff */}
                <button
                  type="submit"
                  className={clsx(
                    'w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm',
                    todosChecados
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-stone-800 text-white hover:bg-stone-900'
                  )}
                >
                  {todosChecados ? (
                    <>
                      <Unlock size={14} /> Salvar e Liberar Handoff Técnico (RN006)
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Salvar Checklist Parcial ({totalChecados}/8)
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Liquidação de Parcela */}
      {modalLiquidarOpen && parcelaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Liquidar Parcela #{parcelaSelecionada.numero}
              </h3>
              <button
                onClick={() => setModalLiquidarOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLiquidarParcela} className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Valor da Parcela:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    R$ {parcelaSelecionada.valor.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-stone-500">Vencimento Original:</span>
                  <span className="font-medium text-stone-700">
                    {new Date(parcelaSelecionada.vencimento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamentoLiquidar}
                  onChange={(e) => setFormaPagamentoLiquidar(e.target.value)}
                  className="w-full text-xs rounded-lg border-stone-200"
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência TED/DOC</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Data Efetiva do Pagamento
                </label>
                <input
                  type="date"
                  value={dataPagamentoLiquidar}
                  onChange={(e) => setDataPagamentoLiquidar(e.target.value)}
                  className="w-full text-xs rounded-lg border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  URL do Comprovante de Pagamento (Opcional)
                </label>
                <input
                  type="text"
                  value={comprovanteUrlLiquidar}
                  onChange={(e) => setComprovanteUrlLiquidar(e.target.value)}
                  placeholder="https://comprovantes.lidermoveis.com.br/..."
                  className="w-full text-xs rounded-lg border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Observações Financeiras
                </label>
                <textarea
                  rows={2}
                  value={obsLiquidar}
                  onChange={(e) => setObsLiquidar(e.target.value)}
                  placeholder="Informações adicionais do recebimento..."
                  className="w-full text-xs rounded-lg border-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalLiquidarOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Confirmar Liquidação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
