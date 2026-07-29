import { useCallback, useEffect, useState } from 'react'
import { User } from 'lucide-react'
import clsx from 'clsx'
import { arquitetosApi, usersApi, leadsApi } from '../../lib/api'
import {
  TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, timeAgo,
  STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG,
} from '../../lib/constants'
import { Modal, Spinner, ScoreBar, AlertBanner, ConfirmDialog } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

// === Aba Perfil ===
export function PerfilTab({ arquiteto, onUpdated, onDesativado }) {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)
  const [confirmDesativar, setConfirmDesativar] = useState(false)
  const [desativarError, setDesativarError] = useState('')

  const handleDesativar = async () => {
    try {
      await arquitetosApi.desativar(arquiteto.id)
      setConfirmDesativar(false)
      onDesativado?.()
    } catch (err) {
      setConfirmDesativar(false)
      setDesativarError(extractErrorMessage(err, 'Erro ao desativar especificador'))
    }
  }

  const [clientes, setClientes] = useState([])
  const [interacoes, setInteracoes] = useState([])
  const [leadsDoEspecificador, setLeadsDoEspecificador] = useState([])
  const [tipo, setTipo] = useState('visita_escritorio')
  const [resumo, setResumo] = useState('')
  const [leadId, setLeadId] = useState('')
  const [loadingRegistro, setLoadingRegistro] = useState(false)

  const [historico, setHistorico] = useState([])
  const [historicoLoading, setHistoricoLoading] = useState(true)
  const [showReatribuir, setShowReatribuir] = useState(false)
  const [consultores, setConsultores] = useState([])
  const [novoConsultorId, setNovoConsultorId] = useState('')
  const [reatribuindo, setReatribuindo] = useState(false)
  const [reatribuirError, setReatribuirError] = useState('')

  const carregar = useCallback(() => {
    arquitetosApi.listarClientes(arquiteto.id).then(r => setClientes(r.data)).catch(console.error)
    arquitetosApi.listarInteracoes(arquiteto.id).then(r => setInteracoes(r.data)).catch(console.error)
    leadsApi.list({ arquiteto_id: arquiteto.id }).then(r => setLeadsDoEspecificador(r.data)).catch(console.error)
  }, [arquiteto.id])

  const carregarHistorico = useCallback(() => {
    arquitetosApi.historicoDono(arquiteto.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setHistoricoLoading(false))
  }, [arquiteto.id])

  useEffect(() => { carregar(); carregarHistorico() }, [carregar, carregarHistorico])

  const registrar = async () => {
    if (!resumo.trim()) return
    setLoadingRegistro(true)
    try {
      await arquitetosApi.registrarInteracao(arquiteto.id, { tipo, resumo, lead_id: leadId ? Number(leadId) : null })
      setResumo('')
      setLeadId('')
      carregar()
      onUpdated?.()
    } catch (e) { console.error(e) }
    finally { setLoadingRegistro(false) }
  }

  const abrirReatribuir = async () => {
    setReatribuirError('')
    setShowReatribuir(true)
    if (consultores.length === 0) {
      try {
        const { data } = await usersApi.list()
        setConsultores(data.filter(u => u.perfil === 'vendedor'))
      } catch {
        setReatribuirError('Não foi possível carregar a lista de vendedores.')
      }
    }
  }

  const confirmarReatribuir = async () => {
    if (!novoConsultorId) return
    setReatribuindo(true)
    setReatribuirError('')
    try {
      await arquitetosApi.reatribuirDono(arquiteto.id, { consultor_id: Number(novoConsultorId) })
      setShowReatribuir(false)
      setNovoConsultorId('')
      carregarHistorico()
      onUpdated?.()
    } catch (err) {
      setReatribuirError(extractErrorMessage(err, 'Erro ao reatribuir dono'))
    } finally {
      setReatribuindo(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-stone-400">Tipo</p>
          <p className="font-medium text-stone-700">{TIPO_ARQUITETO_LABELS[arquiteto.tipo] || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Nível de parceria</p>
          <p className="font-medium text-stone-700 capitalize">{arquiteto.nivel_parceria}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Escritório</p>
          <p className="font-medium text-stone-700">{arquiteto.escritorio || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Telefone</p>
          <p className="font-medium text-stone-700">{arquiteto.telefone || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-400">Endereço do escritório</p>
          <p className="font-medium text-stone-700">{arquiteto.endereco_escritorio || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-400">Especialidade</p>
          <p className="font-medium text-stone-700">{arquiteto.especialidade || '—'}</p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Dono da carteira</p>
          {gestor && (
            <button className="btn-secondary btn-sm" onClick={abrirReatribuir}>Reatribuir</button>
          )}
        </div>
        <p className="text-sm text-stone-700 mb-3">{arquiteto.consultor_nome || 'Sem dono definido'}</p>

        <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Histórico de donos</p>
        {historicoLoading ? (
          <Spinner size={16} />
        ) : historico.length === 0 ? (
          <p className="text-xs text-stone-300">Nenhuma reatribuição registrada</p>
        ) : (
          <ul className="space-y-1">
            {historico.map(h => (
              <li key={h.id} className="text-xs text-stone-500">
                {h.consultor_anterior_nome || 'Sem dono'} → <strong className="text-stone-700">{h.consultor_novo_nome}</strong>
                <span className="text-stone-300"> · {timeAgo(h.alterado_em)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Clientes vinculados</p>
        {clientes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum cliente vinculado ainda</p>
        ) : (
          <ul className="space-y-1">
            {clientes.map(c => (
              <li key={c.id} className="text-sm text-stone-600">{c.nome}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Histórico de interações</p>

        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input text-sm w-40">
              {Object.entries(TIPO_INTERACAO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {leadsDoEspecificador.length > 0 && (
              <select value={leadId} onChange={e => setLeadId(e.target.value)} className="input text-sm flex-1">
                <option value="">Lead gerado (opcional)</option>
                {leadsDoEspecificador.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            )}
          </div>
          <textarea
            value={resumo}
            onChange={e => setResumo(e.target.value)}
            placeholder="Resumo do contato..."
            className="input resize-none h-20 text-sm"
          />
          <button
            onClick={registrar}
            disabled={loadingRegistro || !resumo.trim()}
            className="btn-primary w-full justify-center"
          >
            {loadingRegistro ? 'Registrando...' : 'Registrar interação'}
          </button>
        </div>

        {interacoes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhuma interação registrada</p>
        ) : (
          <div className="space-y-3">
            {interacoes.map(i => (
              <div key={i.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                  <User size={13} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-stone-600">{TIPO_INTERACAO_ARQUITETO_LABELS[i.tipo] || i.tipo}</span>
                    <span className="text-2xs text-stone-300">{timeAgo(i.data)}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{i.resumo}</p>
                  <p className="text-2xs text-stone-400 mt-0.5">
                    por {i.responsavel_nome || 'usuário'}
                    {i.lead_id && <span className="text-primary-600"> · gerou lead #{i.lead_id}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {desativarError && (
        <AlertBanner type="error" message={desativarError} onDismiss={() => setDesativarError('')} />
      )}
      {gestor && (
        <div className="border-t border-stone-100 pt-3">
          <button className="btn-danger btn-sm" onClick={() => setConfirmDesativar(true)}>Desativar</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDesativar}
        onClose={() => setConfirmDesativar(false)}
        onConfirm={handleDesativar}
        title="Desativar especificador"
        message={`Tem certeza que deseja desativar ${arquiteto.nome}? Ele deixará de aparecer na listagem.`}
        confirmLabel="Desativar"
        danger
      />

      <Modal open={showReatribuir} onClose={() => setShowReatribuir(false)} title="Reatribuir dono da carteira" size="sm">
        {reatribuirError && <div className="mb-3"><AlertBanner type="error" message={reatribuirError} onDismiss={() => setReatribuirError('')} /></div>}
        <label className="label">Novo consultor</label>
        <select value={novoConsultorId} onChange={e => setNovoConsultorId(e.target.value)} className="input mb-4">
          <option value="">Selecione um vendedor...</option>
          {consultores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary btn-sm" onClick={() => setShowReatribuir(false)}>Cancelar</button>
          <button className="btn-primary btn-sm" disabled={!novoConsultorId || reatribuindo} onClick={confirmarReatribuir}>
            {reatribuindo ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// === Aba Score ===
export function ScoreTab({ arquiteto }) {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function fetchScore() {
      setLoading(true)
      setError('')
      try {
        const r = await arquitetosApi.score(arquiteto.id)
        if (!ignore) setScore(r.data)
      } catch (err) {
        if (!ignore) setError(extractErrorMessage(err, 'Erro ao carregar score'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchScore()
    return () => { ignore = true }
  }, [arquiteto.id])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!score) return null

  const segmentoCfg = SEGMENTO_CONFIG[score.segmento] || { label: score.segmento, color: 'stone' }

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <p className="text-3xl font-display font-semibold text-stone-800">{score.score_geral.toFixed(0)}</p>
        <p className="text-xs text-stone-400 mb-2">Score geral</p>
        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[segmentoCfg.color])}>
          {segmentoCfg.label}
        </span>
      </div>

      {score.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {score.flags.map(flag => {
            const cfg = FLAG_CONFIG[flag] || { label: flag, color: 'stone' }
            return (
              <span key={flag} className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[cfg.color])}>
                {cfg.label}
              </span>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        <ScoreBar score={score.rfv} label="RFV (Recência, Frequência, Valor)" showMinimo={false} />
        <ScoreBar score={score.potencial} label="Potencial" showMinimo={false} />
        <ScoreBar score={score.lealdade} label="Lealdade" showMinimo={false} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm border-t border-stone-100 pt-3">
        <div>
          <p className="text-xs text-stone-400">Projetos ativos</p>
          <p className="font-medium text-stone-700">{score.detalhes.projetos_ativos}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Leads ativos</p>
          <p className="font-medium text-stone-700">{score.detalhes.leads_ativos}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Dias desde último projeto</p>
          <p className="font-medium text-stone-700">{score.detalhes.dias_desde_ultimo_projeto ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Meses de parceria</p>
          <p className="font-medium text-stone-700">{score.detalhes.meses_desde_cadastro}</p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Risco de concorrência</p>
        <p className="text-sm text-stone-700 mb-2">
          Nível <strong className="capitalize">{score.concorrencia.nivel}</strong> ({score.concorrencia.risco.toFixed(0)}%)
        </p>
        {score.concorrencia.concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-1">
            {score.concorrencia.concorrentes.map(c => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-stone-600">{c.nome_concorrente}</span>
                <span className="text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// === Aba Decisores & Concorrentes ===
export function ContatosTabContent({ arquitetoId }) {
  const [contatos, setContatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDecisor, setEditingDecisor] = useState(undefined)
  const [editingConcorrente, setEditingConcorrente] = useState(undefined)
  const [removerDecisor, setRemoverDecisor] = useState(null)
  const [removerConcorrente, setRemoverConcorrente] = useState(null)
  const [removeError, setRemoveError] = useState('')

  const fetchContatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [d, c] = await Promise.all([
        arquitetosApi.listarDecisores(arquitetoId),
        arquitetosApi.listarConcorrentes(arquitetoId),
      ])
      setContatos({ decisores: d.data, concorrentes: c.data })
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar decisores e concorrentes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function fetchInicial() {
      setLoading(true)
      setError('')
      try {
        const [d, c] = await Promise.all([
          arquitetosApi.listarDecisores(arquitetoId),
          arquitetosApi.listarConcorrentes(arquitetoId),
        ])
        if (!ignore) setContatos({ decisores: d.data, concorrentes: c.data })
      } catch (e) {
        if (!ignore) {
          console.error(e)
          setError('Não foi possível carregar decisores e concorrentes.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchInicial()
    return () => { ignore = true }
  }, [arquitetoId])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!contatos) return null

  const decisores = contatos.decisores
  const concorrentes = contatos.concorrentes

  return (
    <div className="space-y-6">
      {removeError && (
        <AlertBanner type="error" message={removeError} onDismiss={() => setRemoveError('')} />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Decisores</p>
          {editingDecisor === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingDecisor(null)}>Adicionar</button>
          )}
        </div>

        {editingDecisor !== undefined && (
          <DecisorForm
            key={editingDecisor?.id ?? 'novo'}
            initial={editingDecisor ? {
              nome: editingDecisor.nome,
              cargo: editingDecisor.cargo || '',
              telefone: editingDecisor.telefone || '',
              email: editingDecisor.email || '',
              observacoes: editingDecisor.observacoes || '',
              is_principal: editingDecisor.is_principal,
            } : { nome: '', cargo: '', telefone: '', email: '', observacoes: '', is_principal: false }}
            onCancel={() => setEditingDecisor(undefined)}
            onSubmit={async (form) => {
              if (editingDecisor?.id) {
                await arquitetosApi.atualizarDecisor(arquitetoId, editingDecisor.id, form)
              } else {
                await arquitetosApi.criarDecisor(arquitetoId, form)
              }
              setEditingDecisor(undefined)
              fetchContatos()
            }}
          />
        )}

        {decisores.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum decisor cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {decisores.map(d => (
              <li key={d.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">
                    {d.nome} {d.is_principal && <span className="badge badge-ativo ml-1">Principal</span>}
                  </p>
                  <p className="text-xs text-stone-400">{d.cargo || '—'} · {d.telefone || d.email || 'sem contato'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingDecisor(d)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverDecisor(d)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Concorrentes</p>
          {editingConcorrente === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingConcorrente(null)}>Adicionar</button>
          )}
        </div>

        {editingConcorrente !== undefined && (
          <ConcorrenteForm
            key={editingConcorrente?.id ?? 'novo'}
            initial={editingConcorrente ? {
              nome_concorrente: editingConcorrente.nome_concorrente,
              percentual_fechamento_estimado: editingConcorrente.percentual_fechamento_estimado,
              observacoes: editingConcorrente.observacoes || '',
            } : { nome_concorrente: '', percentual_fechamento_estimado: 0, observacoes: '' }}
            onCancel={() => setEditingConcorrente(undefined)}
            onSubmit={async (form) => {
              const payload = { ...form, percentual_fechamento_estimado: Number(form.percentual_fechamento_estimado) }
              if (editingConcorrente?.id) {
                await arquitetosApi.atualizarConcorrente(arquitetoId, editingConcorrente.id, payload)
              } else {
                await arquitetosApi.criarConcorrente(arquitetoId, payload)
              }
              setEditingConcorrente(undefined)
              fetchContatos()
            }}
          />
        )}

        {concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {concorrentes.map(c => (
              <li key={c.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">{c.nome_concorrente}</p>
                  <p className="text-xs text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}% de fechamento estimado</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingConcorrente(c)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverConcorrente(c)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!removerDecisor}
        onClose={() => setRemoverDecisor(null)}
        onConfirm={async () => {
          try {
            await arquitetosApi.removerDecisor(arquitetoId, removerDecisor.id)
            setRemoverDecisor(null)
            fetchContatos()
          } catch (err) {
            setRemoverDecisor(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover decisor'))
          }
        }}
        title="Remover decisor"
        message={`Remover ${removerDecisor?.nome} da lista de decisores?`}
        confirmLabel="Remover"
        danger
      />

      <ConfirmDialog
        open={!!removerConcorrente}
        onClose={() => setRemoverConcorrente(null)}
        onConfirm={async () => {
          try {
            await arquitetosApi.removerConcorrente(arquitetoId, removerConcorrente.id)
            setRemoverConcorrente(null)
            fetchContatos()
          } catch (err) {
            setRemoverConcorrente(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover concorrente'))
          }
        }}
        title="Remover concorrente"
        message={`Remover ${removerConcorrente?.nome_concorrente} da lista de concorrentes?`}
        confirmLabel="Remover"
        danger
      />
    </div>
  )
}

function DecisorForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar decisor'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome *" />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Cargo" />
        <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="Telefone" />
      </div>
      <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="E-mail" />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={form.is_principal} onChange={e => set('is_principal', e.target.checked)} />
        Contato principal
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}

function ConcorrenteForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar concorrente'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome_concorrente} onChange={e => set('nome_concorrente', e.target.value)} placeholder="Nome do concorrente *" />
      <input
        className="input" type="number" min="0" max="100" required
        value={form.percentual_fechamento_estimado}
        onChange={e => set('percentual_fechamento_estimado', e.target.value)}
        placeholder="% estimado de fechamento"
      />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}

// === Modal de edição dos dados principais ===
export function EditarEspecificadorModal({ open, onClose, onSaved, arquiteto }) {
  const [form, setForm] = useState(arquiteto)
  const [prevArquiteto, setPrevArquiteto] = useState(arquiteto)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (arquiteto !== prevArquiteto) {
    setPrevArquiteto(arquiteto)
    setForm(arquiteto)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nome: form.nome, tipo: form.tipo, especialidade: form.especialidade,
        escritorio: form.escritorio, endereco_escritorio: form.endereco_escritorio,
        telefone: form.telefone, email: (form.email || '').trim() || null,
        nivel_parceria: form.nivel_parceria,
      }
      await arquitetosApi.update(arquiteto.id, payload)
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar especificador" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome || ''} onChange={e => set('nome', e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo || ''} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nível de parceria</label>
            <select className="input" value={form.nivel_parceria || 'parceiro'} onChange={e => set('nivel_parceria', e.target.value)}>
              <option value="parceiro">Parceiro</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="label">Escritório</label>
            <input className="input" value={form.escritorio || ''} onChange={e => set('escritorio', e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone || ''} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Endereço do escritório</label>
            <input className="input" value={form.endereco_escritorio || ''} onChange={e => set('endereco_escritorio', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Especialidade</label>
            <input className="input" value={form.especialidade || ''} onChange={e => set('especialidade', e.target.value)} placeholder="Ex: interiores comerciais" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
