import { useEffect, useState, useCallback } from 'react'
import { Search, FileText, CheckCircle2, AlertCircle, Clock, X, Plus, Trash2 } from 'lucide-react'
import { briefingsApi, projetosApi } from '../../lib/api'
import { LoadingPage, EmptyState, ScoreBar, StatusBadge } from '../../components/ui'
import { timeAgo, formatCurrency } from '../../lib/constants'
import clsx from 'clsx'

const AMBIENTES_OPCOES = [
  'Sala de Estar', 'Sala de Jantar', 'Cozinha', 'Lavanderia', 'Área Gourmet',
  'Quarto Casal', 'Quarto Solteiro', 'Quarto Infantil', 'Escritório', 'Home Office',
  'Banheiro', 'Closet', 'Varanda', 'Garagem', 'Biblioteca',
]

const ESTILOS = [
  'Contemporâneo', 'Moderno', 'Clássico', 'Rústico', 'Minimalista',
  'Industrial', 'Escandinavo', 'Provençal', 'Art Déco', 'Outro',
]

const PRAZOS = [
  '1 mês', '2 meses', '3 meses', '4-6 meses', '6-12 meses', 'Acima de 12 meses', 'Sem prazo definido',
]

// Espelha a lógica do briefing_score.py para feedback instantâneo
function calcularScoreLocal(form) {
  let pontos = 0
  const faltando = []

  if (form.cidade_obra?.trim()) pontos += 8
  else faltando.push('Cidade da obra')

  if (form.ambientes?.length > 0) pontos += 10
  else faltando.push('Ambientes do projeto')

  if (form.prazo_desejado) pontos += 8
  else faltando.push('Prazo desejado')

  if (form.faixa_investimento_min && form.faixa_investimento_max) pontos += 14
  else faltando.push('Faixa de investimento')

  if (form.ambientes_detalhados?.some(a => a.tipo)) pontos += 15
  else faltando.push('Detalhamento dos ambientes')

  if (form.referencias_url?.some(r => r.trim())) pontos += 12
  else faltando.push('Referências visuais')

  if (form.ambientes_detalhados?.some(a => a.medidas_preliminares?.trim())) pontos += 8
  // medidas: não é obrigatório para atingir 70

  if (form.estilo_preferido) pontos += 8
  else faltando.push('Estilo preferido')

  if (form.arquiteto_nome?.trim()) pontos += 7
  // arquiteto: bonus

  if (form.observacoes?.length >= 50) pontos += 10
  else faltando.push('Observações (mín. 50 caracteres)')

  return { score: Math.min(100, pontos), faltando }
}

const FORM_INICIAL = {
  cidade_obra: '',
  estado_obra: '',
  endereco_obra: '',
  ambientes: [],
  prazo_desejado: '',
  faixa_investimento_min: '',
  faixa_investimento_max: '',
  estilo_preferido: '',
  observacoes: '',
  referencias_url: [''],
  arquiteto_nome: '',
  arquiteto_email: '',
  arquiteto_telefone: '',
  ambientes_detalhados: [],
}

export default function BriefingPage() {
  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [projetoSelecionado, setProjetoSelecionado] = useState(null)

  const fetchProjetos = async () => {
    try {
      const { data } = await projetosApi.list({ status: 'em_briefing' })
      setProjetos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjetos() }, [])

  const filtrados = projetos.filter(p =>
    !search ||
    p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente_nome?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-stone-200 flex-shrink-0">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar projeto ou cliente..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>
        <div className="ml-auto">
          <span className="text-xs text-stone-400">
            <strong className="text-stone-600">{filtrados.length}</strong> projeto{filtrados.length !== 1 ? 's' : ''} em briefing
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-auto p-6">
        {filtrados.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum projeto em briefing"
            description="Projetos chegam aqui quando o lead avança para a etapa de briefing no CRM."
          />
        ) : (
          <div className="grid gap-3 max-w-4xl">
            {filtrados.map(projeto => (
              <ProjetoCard
                key={projeto.id}
                projeto={projeto}
                onClick={() => setProjetoSelecionado(projeto)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer de briefing */}
      {projetoSelecionado && (
        <BriefingDrawer
          projeto={projetoSelecionado}
          onClose={() => setProjetoSelecionado(null)}
          onSaved={() => { setProjetoSelecionado(null); fetchProjetos() }}
        />
      )}
    </div>
  )
}

// === Card do projeto ===
function ProjetoCard({ projeto, onClick }) {
  const score = projeto.briefing_score ?? null

  return (
    <div onClick={onClick} className="card card-hover p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-stone-400">{projeto.codigo}</span>
            <StatusBadge status={projeto.status} />
          </div>
          <p className="font-semibold text-stone-800 truncate">{projeto.cliente_nome || '—'}</p>
          {projeto.cidade && (
            <p className="text-xs text-stone-400 mt-0.5">{projeto.cidade}</p>
          )}
        </div>

        <div className="flex-shrink-0 w-40">
          {score !== null ? (
            <ScoreBar score={score} min={70} label="Score atual" />
          ) : (
            <div className="text-xs text-stone-300 text-right">Sem briefing</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 text-xs text-stone-400">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(projeto.criado_em)}
        </span>
        {projeto.vendedor_nome && (
          <span>Vendedor: <strong className="text-stone-600">{projeto.vendedor_nome}</strong></span>
        )}
      </div>
    </div>
  )
}

// === Drawer de Briefing ===
function BriefingDrawer({ projeto, onClose, onSaved }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [briefingId, setBriefingId] = useState(null)
  const [scoreLocal, setScoreLocal] = useState({ score: 0, faltando: [] })
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('localizacao')

  // Carrega briefing existente se houver
  useEffect(() => {
    const carregarBriefing = async () => {
      if (projeto.briefing_id) {
        try {
          const { data } = await briefingsApi.get(projeto.briefing_id)
          setBriefingId(data.id)
          setForm({
            cidade_obra: data.cidade_obra || '',
            estado_obra: data.estado_obra || '',
            endereco_obra: data.endereco_obra || '',
            ambientes: data.ambientes || [],
            prazo_desejado: data.prazo_desejado || '',
            faixa_investimento_min: data.faixa_investimento_min || '',
            faixa_investimento_max: data.faixa_investimento_max || '',
            estilo_preferido: data.estilo_preferido || '',
            observacoes: data.observacoes || '',
            referencias_url: data.referencias_url?.length ? data.referencias_url : [''],
            arquiteto_nome: data.arquiteto_nome || '',
            arquiteto_email: data.arquiteto_email || '',
            arquiteto_telefone: data.arquiteto_telefone || '',
            ambientes_detalhados: data.ambientes_detalhados || [],
          })
        } catch (e) {
          console.error(e)
        }
      }
      setLoadingBriefing(false)
    }
    carregarBriefing()
  }, [projeto.briefing_id])

  // Recalcula score a cada mudança no form
  useEffect(() => {
    setScoreLocal(calcularScoreLocal(form))
  }, [form])

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), [])

  const toggleAmbiente = (amb) => {
    set('ambientes', form.ambientes.includes(amb)
      ? form.ambientes.filter(a => a !== amb)
      : [...form.ambientes, amb]
    )
  }

  const setAmbienteDetalhado = (idx, campo, valor) => {
    const novos = [...form.ambientes_detalhados]
    novos[idx] = { ...novos[idx], [campo]: valor }
    set('ambientes_detalhados', novos)
  }

  const adicionarAmbienteDetalhado = () => {
    set('ambientes_detalhados', [...form.ambientes_detalhados, { tipo: '', descricao: '', medidas_preliminares: '', observacoes_especificas: '' }])
  }

  const removerAmbienteDetalhado = (idx) => {
    set('ambientes_detalhados', form.ambientes_detalhados.filter((_, i) => i !== idx))
  }

  const setReferencia = (idx, valor) => {
    const novas = [...form.referencias_url]
    novas[idx] = valor
    set('referencias_url', novas)
  }

  const adicionarReferencia = () => set('referencias_url', [...form.referencias_url, ''])
  const removerReferencia = (idx) => set('referencias_url', form.referencias_url.filter((_, i) => i !== idx))

  const salvarRascunho = async () => {
    setSalvando(true)
    setErro('')
    setSucesso('')
    try {
      const payload = montarPayload()
      const { data } = await briefingsApi.salvar(payload)
      setBriefingId(data.briefing_id)
      setSucesso('Rascunho salvo com sucesso.')
    } catch (e) {
      setErro(e.response?.data?.detail || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const enviarParaFila = async () => {
    if (!briefingId) {
      setErro('Salve o rascunho antes de enviar.')
      return
    }
    setEnviando(true)
    setErro('')
    setSucesso('')
    try {
      await briefingsApi.enviarParaFila(briefingId)
      setSucesso('Briefing enviado para a fila de projetos!')
      setTimeout(onSaved, 1200)
    } catch (e) {
      const detail = e.response?.data?.detail
      if (typeof detail === 'object' && detail?.message) {
        setErro(detail.message)
      } else {
        setErro(typeof detail === 'string' ? detail : 'Erro ao enviar para fila.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const montarPayload = () => ({
    projeto_id: projeto.id,
    cidade_obra: form.cidade_obra || null,
    estado_obra: form.estado_obra || null,
    endereco_obra: form.endereco_obra || null,
    ambientes: form.ambientes,
    prazo_desejado: form.prazo_desejado || null,
    faixa_investimento_min: form.faixa_investimento_min ? parseFloat(form.faixa_investimento_min) : null,
    faixa_investimento_max: form.faixa_investimento_max ? parseFloat(form.faixa_investimento_max) : null,
    estilo_preferido: form.estilo_preferido || null,
    observacoes: form.observacoes || null,
    referencias_url: form.referencias_url.filter(r => r.trim()),
    arquiteto_nome: form.arquiteto_nome || null,
    arquiteto_email: form.arquiteto_email || null,
    arquiteto_telefone: form.arquiteto_telefone || null,
    ambientes_detalhados: form.ambientes_detalhados.filter(a => a.tipo),
  })

  const aprovado = scoreLocal.score >= 70

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl shadow-elevated flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <p className="text-xs font-mono text-stone-400 mb-0.5">{projeto.codigo}</p>
            <h3 className="font-semibold text-stone-800 text-lg">{projeto.cliente_nome || 'Cliente'}</h3>
            <StatusBadge status={projeto.status} className="mt-1" />
          </div>
          <button onClick={onClose} className="btn-icon mt-1"><X size={16} /></button>
        </div>

        {/* Score em tempo real */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-100 flex-shrink-0">
          <ScoreBar score={scoreLocal.score} min={70} label="Score do briefing (atualizado em tempo real)" />
          {scoreLocal.faltando.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {scoreLocal.faltando.map(f => (
                <span key={f} className="inline-flex items-center gap-1 text-2xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                  <AlertCircle size={9} /> {f}
                </span>
              ))}
            </div>
          )}
          {aprovado && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> Pronto para enviar para a fila
            </p>
          )}
        </div>

        {/* Abas */}
        <div className="flex border-b border-stone-100 flex-shrink-0 bg-white">
          {[
            { key: 'localizacao', label: 'Localização' },
            { key: 'ambientes', label: 'Ambientes' },
            { key: 'comercial', label: 'Comercial' },
          ].map(aba => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={clsx(
                'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
                abaAtiva === aba.key
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              )}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingBriefing ? (
            <div className="flex items-center justify-center h-32 text-stone-400 text-sm">Carregando...</div>
          ) : (
            <>
              {abaAtiva === 'localizacao' && (
                <AbaLocalizacao form={form} set={set} />
              )}
              {abaAtiva === 'ambientes' && (
                <AbaAmbientes
                  form={form}
                  toggleAmbiente={toggleAmbiente}
                  setAmbienteDetalhado={setAmbienteDetalhado}
                  adicionarAmbienteDetalhado={adicionarAmbienteDetalhado}
                  removerAmbienteDetalhado={removerAmbienteDetalhado}
                />
              )}
              {abaAtiva === 'comercial' && (
                <AbaComercial
                  form={form}
                  set={set}
                  setReferencia={setReferencia}
                  adicionarReferencia={adicionarReferencia}
                  removerReferencia={removerReferencia}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex-shrink-0 bg-white">
          {erro && (
            <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} /> {erro}
            </p>
          )}
          {sucesso && (
            <p className="text-sm text-green-600 mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {sucesso}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={salvarRascunho}
              disabled={salvando}
              className="btn-secondary flex-1"
            >
              {salvando ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button
              onClick={enviarParaFila}
              disabled={enviando || !aprovado}
              className={clsx('btn-primary flex-1', !aprovado && 'opacity-50 cursor-not-allowed')}
              title={!aprovado ? `Score insuficiente (${scoreLocal.score}/70)` : ''}
            >
              {enviando ? 'Enviando...' : 'Enviar para fila'}
            </button>
          </div>
          {!aprovado && (
            <p className="text-xs text-stone-400 text-center mt-2">
              Faltam {70 - scoreLocal.score} pontos para enviar para a fila
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// === Aba Localização ===
function AbaLocalizacao({ form, set }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Cidade da obra *</label>
        <input
          className="input"
          value={form.cidade_obra}
          onChange={e => set('cidade_obra', e.target.value)}
          placeholder="Ex: São Paulo"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Estado</label>
          <input
            className="input"
            value={form.estado_obra}
            onChange={e => set('estado_obra', e.target.value)}
            placeholder="SP"
          />
        </div>
      </div>
      <div>
        <label className="label">Endereço</label>
        <input
          className="input"
          value={form.endereco_obra}
          onChange={e => set('endereco_obra', e.target.value)}
          placeholder="Rua, número, complemento"
        />
      </div>
    </div>
  )
}

// === Aba Ambientes ===
function AbaAmbientes({ form, toggleAmbiente, setAmbienteDetalhado, adicionarAmbienteDetalhado, removerAmbienteDetalhado }) {
  return (
    <div className="space-y-6">
      {/* Seleção de ambientes */}
      <div>
        <label className="label">Ambientes do projeto *</label>
        <p className="text-xs text-stone-400 mb-3">Selecione todos os ambientes que fazem parte do projeto</p>
        <div className="flex flex-wrap gap-2">
          {AMBIENTES_OPCOES.map(amb => (
            <button
              key={amb}
              type="button"
              onClick={() => toggleAmbiente(amb)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                form.ambientes.includes(amb)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-primary-300'
              )}
            >
              {amb}
            </button>
          ))}
        </div>
      </div>

      {/* Detalhamento */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="label">Detalhamento dos ambientes *</label>
            <p className="text-xs text-stone-400">Descreva cada ambiente com medidas e observações</p>
          </div>
          <button type="button" onClick={adicionarAmbienteDetalhado} className="btn-secondary btn-sm gap-1">
            <Plus size={12} /> Adicionar
          </button>
        </div>

        {form.ambientes_detalhados.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center text-stone-400 text-sm">
            Nenhum ambiente detalhado ainda
          </div>
        ) : (
          <div className="space-y-3">
            {form.ambientes_detalhados.map((amb, idx) => (
              <div key={idx} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">Ambiente {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removerAmbienteDetalhado(idx)}
                    className="btn-icon text-stone-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo *</label>
                    <select
                      className="input"
                      value={amb.tipo}
                      onChange={e => setAmbienteDetalhado(idx, 'tipo', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {AMBIENTES_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Medidas preliminares</label>
                    <input
                      className="input"
                      value={amb.medidas_preliminares}
                      onChange={e => setAmbienteDetalhado(idx, 'medidas_preliminares', e.target.value)}
                      placeholder="Ex: 4x3m"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Descrição</label>
                  <textarea
                    className="input resize-none h-16 text-sm"
                    value={amb.descricao}
                    onChange={e => setAmbienteDetalhado(idx, 'descricao', e.target.value)}
                    placeholder="Descreva o ambiente e necessidades específicas..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === Aba Comercial ===
function AbaComercial({ form, set, setReferencia, adicionarReferencia, removerReferencia }) {
  return (
    <div className="space-y-5">
      {/* Prazo e investimento */}
      <div>
        <label className="label">Prazo desejado *</label>
        <select className="input" value={form.prazo_desejado} onChange={e => set('prazo_desejado', e.target.value)}>
          <option value="">Selecione...</option>
          {PRAZOS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Investimento mínimo (R$) *</label>
          <input
            className="input"
            type="number"
            value={form.faixa_investimento_min}
            onChange={e => set('faixa_investimento_min', e.target.value)}
            placeholder="50000"
          />
        </div>
        <div>
          <label className="label">Investimento máximo (R$) *</label>
          <input
            className="input"
            type="number"
            value={form.faixa_investimento_max}
            onChange={e => set('faixa_investimento_max', e.target.value)}
            placeholder="100000"
          />
        </div>
      </div>

      {/* Estilo */}
      <div>
        <label className="label">Estilo preferido *</label>
        <div className="flex flex-wrap gap-2">
          {ESTILOS.map(est => (
            <button
              key={est}
              type="button"
              onClick={() => set('estilo_preferido', form.estilo_preferido === est ? '' : est)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                form.estilo_preferido === est
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-primary-300'
              )}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="label">
          Observações e contexto *
          <span className={clsx('ml-2 text-xs', form.observacoes.length >= 50 ? 'text-green-500' : 'text-amber-500')}>
            {form.observacoes.length}/50 mín.
          </span>
        </label>
        <textarea
          className="input resize-none h-24 text-sm"
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
          placeholder="Contexto do cliente, motivações, restrições, expectativas..."
        />
      </div>

      {/* Referências visuais */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label">Referências visuais *</label>
          <button type="button" onClick={adicionarReferencia} className="btn-secondary btn-sm gap-1">
            <Plus size={12} /> Adicionar URL
          </button>
        </div>
        <div className="space-y-2">
          {form.referencias_url.map((ref, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="input flex-1"
                value={ref}
                onChange={e => setReferencia(idx, e.target.value)}
                placeholder="https://pinterest.com/..."
              />
              {form.referencias_url.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerReferencia(idx)}
                  className="btn-icon text-stone-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Arquiteto vinculado */}
      <div className="pt-2 border-t border-stone-100">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Arquiteto / Especificador (opcional +7 pts)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome</label>
            <input
              className="input"
              value={form.arquiteto_nome}
              onChange={e => set('arquiteto_nome', e.target.value)}
              placeholder="Nome do arquiteto"
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              value={form.arquiteto_email}
              onChange={e => set('arquiteto_email', e.target.value)}
              placeholder="arq@email.com"
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              value={form.arquiteto_telefone}
              onChange={e => set('arquiteto_telefone', e.target.value)}
              placeholder="(11) 99999-0000"
            />
          </div>
        </div>
      </div>
    </div>
  )
}