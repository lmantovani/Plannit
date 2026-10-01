import React, { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  AlertTriangle,
  ThumbsDown,
  DollarSign,
  Home,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'

export type ArquitetoOption = {
  id: number
  nome: string
  escritorio: string | null
}

interface QualificarLeadModalProps {
  lead: {
    id: number
    nome: string
    telefone: string
    cidade?: string | null
    faixaOrcamento?: string | null
    orcamentoEstimado?: number | string | null
    prazoObra?: string | null
    tipoImovel?: string | null
    ambientesInteresse?: string[] | string | null
    possuiArquiteto?: boolean
    arquitetoId?: number | null
    decisorPresente?: boolean
  }
  arquitetos: ArquitetoOption[]
  ambientesDisponiveis?: string[]
  onClose: () => void
  onSuccess?: () => void
}

const OPCOES_AMBIENTES_PADRAO = [
  'Cozinha',
  'Living',
  'Home Theater',
  'Espaço Gourmet',
  'Varanda',
  'Suíte Master',
  'Quarto do Filho',
  'Quarto da Filha',
  'Quarto de Visita',
  'Closet',
  'Banheiro',
  'Lavabo',
  'Home Office',
  'Área de Serviço',
]

const FAIXAS_ORCAMENTO = [
  { value: 'ate_80k', label: 'Até R$ 80.000', desc: 'Ambiente único / Compacto' },
  { value: '80k_150k', label: 'R$ 80.000 a R$ 150.000', desc: 'Residencial Médio' },
  { value: '150k_300k', label: 'R$ 150.000 a R$ 300.000', desc: 'Residencial Médio-Alto' },
  { value: '300k_500k', label: 'R$ 300.000 a R$ 500.000', desc: 'Alto Padrão' },
  { value: 'acima_500k', label: 'Acima de R$ 500.000', desc: 'Super Luxo / Mansões' },
]

const PRAZOS_OBRA = [
  { value: 'pronto_imediato', label: 'Imóvel pronto / Início imediato', desc: 'Alta urgência comercial' },
  { value: 'ate_3_meses', label: 'Entrega em até 3 meses', desc: 'Tempo ideal para projeto 3D' },
  { value: 'ate_6_meses', label: 'Entrega em 3 a 6 meses', desc: 'Planejamento antecipado' },
  { value: 'mais_12_meses', label: 'Entrega em mais de 12 meses', desc: 'Prazo longo' },
  { value: 'venda_futura_18m', label: 'Venda futura (acima de 18 meses)', desc: 'Planejamento a longo prazo / Obra na planta' },
]

const TIPOS_IMOVEL = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa_condominio', label: 'Casa em Condomínio' },
  { value: 'casa_rua', label: 'Casa de Rua' },
  { value: 'comercial', label: 'Comercial / Corporativo' },
]

export default function QualificarLeadModal({
  lead,
  arquitetos,
  ambientesDisponiveis,
  onClose,
  onSuccess,
}: QualificarLeadModalProps) {
  // Extrai ambientes pré-existentes caso o lead já possua histórico
  const rawAmbientes = lead.ambientesInteresse
  const leadAmbientes: string[] = Array.isArray(rawAmbientes)
    ? rawAmbientes
    : typeof rawAmbientes === 'string'
      ? (() => {
          try {
            const p = JSON.parse(rawAmbientes)
            return Array.isArray(p) ? p : []
          } catch {
            return []
          }
        })()
      : []

  const outroItem = leadAmbientes.find(
    (a) => a.toLowerCase().startsWith('outro:') || a.toLowerCase() === 'outro'
  )
  const initialOutroSelected = Boolean(outroItem)
  const initialOutroDescricao = outroItem ? outroItem.replace(/^outro:\s*/i, '') : ''
  const initialAmbientesPadrao = leadAmbientes.filter(
    (a) => !a.toLowerCase().startsWith('outro:') && a.toLowerCase() !== 'outro'
  )

  const [modo, setModo] = useState<'qualificar' | 'desqualificar'>('qualificar')
  const [motivoDesqualificacao, setMotivoDesqualificacao] = useState('')
  const [isDesqualificando, setIsDesqualificando] = useState(false)
  const [isOutroSelected, setIsOutroSelected] = useState(initialOutroSelected)
  const [outroDescricao, setOutroDescricao] = useState(initialOutroDescricao)

  const listaAmbientes = ambientesDisponiveis && ambientesDisponiveis.length > 0
    ? ambientesDisponiveis
    : OPCOES_AMBIENTES_PADRAO

  const { data, setData, post, processing, transform } = useForm({
    faixaOrcamento: lead.faixaOrcamento || '80k_150k',
    orcamentoEstimado: lead.orcamentoEstimado ? String(lead.orcamentoEstimado) : '',
    prazoObra: lead.prazoObra || 'ate_3_meses',
    tipoImovel: lead.tipoImovel || 'apartamento',
    ambientesInteresse: (initialAmbientesPadrao.length > 0
      ? initialAmbientesPadrao
      : initialOutroSelected
        ? []
        : ['Cozinha']) as string[],
    possuiArquiteto: Boolean(lead.possuiArquiteto || lead.arquitetoId),
    arquitetoId: lead.arquitetoId ? String(lead.arquitetoId) : '',
    decisorPresente: lead.decisorPresente !== undefined ? lead.decisorPresente : true,
    observacoes: '',
  })

  const toggleAmbiente = (ambiente: string) => {
    if (data.ambientesInteresse.includes(ambiente)) {
      if (data.ambientesInteresse.length === 1 && !isOutroSelected) {
        toast.error('Selecione pelo menos um ambiente de interesse')
        return
      }
      setData(
        'ambientesInteresse',
        data.ambientesInteresse.filter((a) => a !== ambiente)
      )
    } else {
      setData('ambientesInteresse', [...data.ambientesInteresse, ambiente])
    }
  }

  const handleQualificarSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isOutroSelected && (!outroDescricao.trim() || outroDescricao.trim().length < 2)) {
      toast.error('Informe uma descrição com no mínimo 2 caracteres para o ambiente "Outro".')
      return
    }

    const finalAmbientes = [...data.ambientesInteresse]
    if (isOutroSelected && outroDescricao.trim()) {
      finalAmbientes.push(`Outro: ${outroDescricao.trim()}`)
    }

    if (finalAmbientes.length === 0) {
      toast.error('Selecione pelo menos um ambiente de interesse.')
      return
    }

    transform((currentData) => ({
      ...currentData,
      ambientesInteresse: finalAmbientes,
    }))

    post(`/crm/leads/${lead.id}/qualificar`, {
      onSuccess: () => {
        toast.success(`Lead "${lead.nome}" qualificado com sucesso!`)
        onSuccess?.()
        onClose()
      },
      onError: () => {
        toast.error('Erro ao registrar qualificação. Verifique os campos.')
      },
    })
  }

  const handleDesqualificarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivoDesqualificacao.trim() || motivoDesqualificacao.length < 5) {
      toast.error('Informe um motivo de desqualificação com no mínimo 5 caracteres.')
      return
    }

    setIsDesqualificando(true)
    router.post(
      `/crm/leads/${lead.id}/desqualificar`,
      { motivoDesqualificacao },
      {
        onSuccess: () => {
          toast.success(`Lead "${lead.nome}" desqualificado.`)
          onSuccess?.()
          onClose()
        },
        onError: () => {
          toast.error('Erro ao desqualificar lead.')
        },
        onFinish: () => setIsDesqualificando(false),
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-scale-in my-auto">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">
                  Qualificação de Lead (Regra RN001)
                </h3>
                <p className="text-xs text-stone-500">
                  Atestado de aderência comercial para <strong className="text-stone-800">{lead.nome}</strong>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seletor de Modo: Qualificar vs Desqualificar */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-stone-100 bg-stone-50/30">
          <button
            type="button"
            onClick={() => setModo('qualificar')}
            className={clsx(
              'pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all',
              modo === 'qualificar'
                ? 'border-primary-600 text-primary-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            )}
          >
            <CheckCircle2 size={14} className={modo === 'qualificar' ? 'text-primary-600' : ''} />
            <span>Critérios de Qualificação</span>
          </button>
          <button
            type="button"
            onClick={() => setModo('desqualificar')}
            className={clsx(
              'pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all',
              modo === 'desqualificar'
                ? 'border-rose-500 text-rose-800'
                : 'border-transparent text-stone-400 hover:text-rose-600'
            )}
          >
            <ThumbsDown size={14} className={modo === 'desqualificar' ? 'text-rose-500' : ''} />
            <span>Desqualificar Lead</span>
          </button>
        </div>

        {modo === 'qualificar' ? (
          <form onSubmit={handleQualificarSubmit} className="p-6 space-y-5 max-h-[calc(85vh-150px)] overflow-y-auto text-xs">
            {/* 1. Tipo de Imóvel */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Home size={14} className="text-stone-400" />
                1. Tipo de Imóvel *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIPOS_IMOVEL.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setData('tipoImovel', t.value)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-center font-medium transition-all select-none',
                      data.tipoImovel === t.value
                        ? 'bg-primary-50 border-primary-500 text-primary-900 ring-2 ring-primary-300/40 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Faixa de Investimento Estimado */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-stone-400" />
                2. Faixa de Orçamento Estimado *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FAIXAS_ORCAMENTO.map((f) => (
                  <div
                    key={f.value}
                    onClick={() => setData('faixaOrcamento', f.value)}
                    className={clsx(
                      'p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none',
                      data.faixaOrcamento === f.value
                        ? 'bg-amber-50/60 border-amber-500 text-amber-950 ring-2 ring-amber-300/50'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    )}
                  >
                    <span className="font-semibold text-xs text-stone-900">{f.label}</span>
                    <span className="text-[11px] text-stone-500 mt-0.5">{f.desc}</span>
                  </div>
                ))}
              </div>

              {/* Valor exato opcional */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-medium text-stone-500 mb-1">
                  Valor estimado específico (opcional):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    step="1000"
                    placeholder="Ex: 85000"
                    value={data.orcamentoEstimado}
                    onChange={(e) => setData('orcamentoEstimado', e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 3. Previsão de Entrega / Momento da Obra */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-stone-400" />
                3. Momento da Obra & Prazo *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRAZOS_OBRA.map((p) => (
                  <div
                    key={p.value}
                    onClick={() => setData('prazoObra', p.value)}
                    className={clsx(
                      'p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none',
                      data.prazoObra === p.value
                        ? 'bg-primary-50 border-primary-500 text-primary-950 ring-2 ring-primary-300/40'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    )}
                  >
                    <span className="font-semibold text-xs">{p.label}</span>
                    <span className="text-[11px] text-stone-500 mt-0.5">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Ambientes de Interesse */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-stone-400" />
                  4. Ambientes de Interesse * ({data.ambientesInteresse.length + (isOutroSelected ? 1 : 0)} selecionado(s))
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listaAmbientes.map((amb) => {
                  const selected = data.ambientesInteresse.includes(amb)
                  return (
                    <button
                      key={amb}
                      type="button"
                      onClick={() => toggleAmbiente(amb)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 select-none cursor-pointer',
                        selected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      )}
                    >
                      {selected && <CheckCircle2 size={12} className="text-primary-400" />}
                      <span>{amb}</span>
                    </button>
                  )
                })}

                {/* Opção interativa Outro */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isOutroSelected
                    setIsOutroSelected(next)
                    if (!next) {
                      setOutroDescricao('')
                    }
                  }}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 select-none cursor-pointer',
                    isOutroSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  )}
                >
                  {isOutroSelected && <CheckCircle2 size={12} className="text-white" />}
                  <span>Outro</span>
                </button>
              </div>

              {/* Input descritivo obrigatório quando Outro estiver selecionado */}
              {isOutroSelected && (
                <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-amber-950">
                    Descrição do Ambiente "Outro" *
                  </label>
                  <input
                    type="text"
                    required
                    value={outroDescricao}
                    onChange={(e) => setOutroDescricao(e.target.value)}
                    placeholder="Ex: Adega Climatizada, Brinquedoteca, Academia, etc."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-stone-800"
                  />
                  <p className="text-[10px] text-amber-700">
                    Campo obrigatório para descrever o ambiente fora do catálogo padrão.
                  </p>
                </div>
              )}
            </div>

            {/* 5. Acompanhamento de Arquiteto */}
            <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-xl space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.possuiArquiteto}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setData('possuiArquiteto', checked)
                    if (!checked) setData('arquitetoId', '')
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Cliente acompanhado por Arquiteto / Designer parceiro</span>
              </label>

              {data.possuiArquiteto && (
                <div className="pt-2 border-t border-stone-200 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Selecione o Especificador da Carteira:
                  </label>
                  <select
                    value={data.arquitetoId}
                    onChange={(e) => setData('arquitetoId', e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Outro / Ainda não cadastrado</option>
                    {arquitetos.map((arq) => (
                      <option key={arq.id} value={arq.id}>
                        {arq.nome} {arq.escritorio ? `(${arq.escritorio})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 6. Declaração do Tomador de Decisão */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
              <input
                type="checkbox"
                required
                id="checkDecisor"
                checked={data.decisorPresente}
                onChange={(e) => setData('decisorPresente', e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="checkDecisor" className="cursor-pointer select-none leading-relaxed">
                <strong>Declaração de Atestado Comercial:</strong> Confirmo que conversei com o cliente/decisor, verifiquei os requisitos acima e atesto que o lead possui potencial aderente ao padrão da Líder Móveis.
              </label>
            </div>

            {/* Rodapé e Ações */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processing || !data.decisorPresente}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>{processing ? 'Gravando...' : 'Confirmar Qualificação & Liberar Funil (RN001)'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Formulário de Desqualificação */
          <form onSubmit={handleDesqualificarSubmit} className="p-6 space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-950">Descarte Consciente de Oportunidade</h4>
                <p className="text-rose-800 text-[11px] mt-0.5 leading-relaxed">
                  Ao desqualificar, o lead será movido para o status de <strong>Desqualificado</strong>, evitando desperdício de tempo da equipe de projetos técnicos. O histórico permanecerá gravado.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Motivo da Desqualificação *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Cliente com orçamento previsto de R$ 5.000 para projeto de R$ 40.000, ou imóvel com entrega prevista apenas para 2029..."
                value={motivoDesqualificacao}
                onChange={(e) => setMotivoDesqualificacao(e.target.value)}
                className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
              <p className="text-[10px] text-stone-400 mt-1">Mínimo de 5 caracteres.</p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModo('qualificar')}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Voltar aos Critérios
              </button>
              <button
                type="submit"
                disabled={isDesqualificando || motivoDesqualificacao.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                <ThumbsDown size={14} />
                <span>{isDesqualificando ? 'Salvando...' : 'Confirmar Desqualificação'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
