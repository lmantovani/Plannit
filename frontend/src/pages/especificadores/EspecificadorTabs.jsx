import { useEffect, useState } from 'react'
import { TrendingUp, Trash2, Plus, User } from 'lucide-react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, timeAgo } from '../../lib/constants'
import { EmptyState, Modal } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'

function podeGerenciarRelacionamento(user, arquiteto) {
  if (podeVerTudo(user?.perfil) || user?.perfil === 'recepcao') return true
  return user?.perfil === 'vendedor' && arquiteto?.vendedor_id === user?.id
}

// === Aba Perfil ===
export function PerfilTab({ arquiteto, onUpdated }) {
  const { user } = useAuthStore()
  const [clientes, setClientes] = useState([])
  const [interacoes, setInteracoes] = useState([])
  const [tipo, setTipo] = useState('visita_escritorio')
  const [observacao, setObservacao] = useState('')
  const [loadingRegistro, setLoadingRegistro] = useState(false)

  const podeRegistrar = podeGerenciarRelacionamento(user, arquiteto)

  const carregar = () => {
    arquitetosApi.listarClientes(arquiteto.id).then(r => setClientes(r.data)).catch(console.error)
    arquitetosApi.listarInteracoes(arquiteto.id).then(r => setInteracoes(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquiteto.id])

  const registrar = async () => {
    if (!observacao.trim()) return
    setLoadingRegistro(true)
    try {
      await arquitetosApi.registrarInteracao(arquiteto.id, { tipo, observacao })
      setObservacao('')
      carregar()
      onUpdated?.()
    } catch (e) { console.error(e) }
    finally { setLoadingRegistro(false) }
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
          <p className="text-xs text-stone-400">Vendedor vinculado</p>
          <p className="font-medium text-stone-700">{arquiteto.vendedor_nome || 'Nenhum'}</p>
        </div>
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

        {podeRegistrar && (
          <div className="space-y-2 mb-4">
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input text-sm">
              {Object.entries(TIPO_INTERACAO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Observações sobre o contato..."
              className="input resize-none h-20 text-sm"
            />
            <button
              onClick={registrar}
              disabled={loadingRegistro || !observacao.trim()}
              className="btn-primary w-full justify-center"
            >
              {loadingRegistro ? 'Registrando...' : 'Registrar interação'}
            </button>
          </div>
        )}

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
                    <span className="text-2xs text-stone-300">{timeAgo(i.criado_em)}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{i.observacao}</p>
                  <p className="text-2xs text-stone-400 mt-0.5">por {i.autor_nome || 'usuário'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === Aba Score ===
export function ScoreTab() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Score ainda não disponível"
      description="O RFV (Recência, Frequência, Valor) deste especificador depende de pedidos e fechamentos vinculados a ele — funcionalidade prevista para uma próxima etapa. Assim que houver dados suficientes, o score aparecerá aqui automaticamente."
    />
  )
}

// === Aba Decisores ===
export function DecisoresTab({ arquiteto }) {
  const { user } = useAuthStore()
  const [funcionarios, setFuncionarios] = useState([])
  const [showModal, setShowModal] = useState(false)

  const podeGerenciar = podeGerenciarRelacionamento(user, arquiteto)

  const carregar = () => {
    arquitetosApi.listarFuncionarios(arquiteto.id).then(r => setFuncionarios(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquiteto.id])

  const toggleDecisor = async (funcionario) => {
    try {
      await arquitetosApi.atualizarFuncionario(arquiteto.id, funcionario.id, { decisor: !funcionario.decisor })
      carregar()
    } catch (e) { console.error(e) }
  }

  const remover = async (funcionarioId) => {
    try {
      await arquitetosApi.removerFuncionario(arquiteto.id, funcionarioId)
      carregar()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      {podeGerenciar && (
        <button onClick={() => setShowModal(true)} className="btn-secondary btn-sm gap-1.5">
          <Plus size={13} /> Adicionar funcionário
        </button>
      )}

      {funcionarios.length === 0 ? (
        <EmptyState title="Nenhum funcionário cadastrado" description="Adicione as pessoas do escritório e marque quem participa das decisões de compra." />
      ) : (
        <div className="space-y-3">
          {funcionarios.map(f => (
            <div key={f.id} className="card p-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-800 text-sm">{f.nome}</p>
                  {f.funcao && <span className="text-xs text-stone-400">— {f.funcao}</span>}
                </div>
                <div className="text-xs text-stone-400 mt-0.5 space-x-2">
                  {f.telefone && <span>{f.telefone}</span>}
                  {f.email && <span>{f.email}</span>}
                </div>
                {f.observacoes && <p className="text-sm text-stone-500 mt-1">{f.observacoes}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={f.decisor}
                    disabled={!podeGerenciar}
                    onChange={() => toggleDecisor(f)}
                  />
                  Decisor
                </label>
                {podeGerenciar && (
                  <button onClick={() => remover(f.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoFuncionarioModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); carregar() }}
        arquitetoId={arquiteto.id}
      />
    </div>
  )
}

function NovoFuncionarioModal({ open, onClose, onSaved, arquitetoId }) {
  const vazio = { nome: '', funcao: '', telefone: '', email: '', observacoes: '', decisor: false }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await arquitetosApi.criarFuncionario(arquitetoId, form)
      onSaved()
      setForm(vazio)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar funcionário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo funcionário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nome *</label>
          <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} />
        </div>
        <div>
          <label className="label">Função</label>
          <input className="input" value={form.funcao} onChange={e => set('funcao', e.target.value)} placeholder="Ex: Sócio, Estagiário" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={form.decisor} onChange={e => set('decisor', e.target.checked)} />
          É decisor
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Modal de edição dos dados principais ===
export function EditarEspecificadorModal({ open, onClose, onSaved, arquiteto }) {
  const { user } = useAuthStore()
  const podeEditarVendedor = podeVerTudo(user?.perfil)
  const [form, setForm] = useState(arquiteto)
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(arquiteto) }, [arquiteto])

  useEffect(() => {
    if (open && podeEditarVendedor) {
      usersApi.list().then(r => setVendedores(r.data.filter(u => u.perfil === 'vendedor'))).catch(console.error)
    }
  }, [open, podeEditarVendedor])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nome: form.nome, tipo: form.tipo, escritorio: form.escritorio,
        endereco_escritorio: form.endereco_escritorio, telefone: form.telefone,
        email: form.email, nivel_parceria: form.nivel_parceria,
      }
      if (podeEditarVendedor) payload.vendedor_id = form.vendedor_id || null
      await arquitetosApi.update(arquiteto.id, payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar')
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
            <label className="label">Vendedor vinculado</label>
            {podeEditarVendedor ? (
              <select className="input" value={form.vendedor_id || ''} onChange={e => set('vendedor_id', e.target.value || null)}>
                <option value="">Nenhum</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-stone-500 py-1.5">{arquiteto.vendedor_nome || 'Nenhum'} (só Diretoria/Gerente pode alterar)</p>
            )}
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
