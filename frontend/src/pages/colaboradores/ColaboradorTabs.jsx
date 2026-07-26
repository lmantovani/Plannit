import { useEffect, useState } from 'react'
import { formatDate, formatCurrency, REGIME_CONFIG, MODALIDADE_LABELS, TIPO_DESLIGAMENTO_LABELS } from '../../lib/constants'
import { Modal, Spinner } from '../../components/ui'
import { colaboradoresApi } from '../../lib/api'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

// === Aba Perfil ===
export function PerfilTab({ colaborador, onUpdated }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDesligar, setShowDesligar] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        {colaborador.is_active && (
          <button className="btn-secondary btn-sm text-red-600" onClick={() => setShowDesligar(true)}>Desligar</button>
        )}
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      {!colaborador.is_active && (
        <div className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          Desligado em {formatDate(colaborador.data_desligamento)} — {TIPO_DESLIGAMENTO_LABELS[colaborador.tipo_desligamento] || colaborador.tipo_desligamento}
          {colaborador.motivo_desligamento && <p className="text-xs text-stone-400 mt-1">{colaborador.motivo_desligamento}</p>}
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Identificação</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="CPF" valor={colaborador.cpf} />
          <Campo label="Data de nascimento" valor={formatDate(colaborador.data_nascimento)} />
          <Campo label="Sexo" valor={colaborador.sexo} />
          <Campo label="Estado civil" valor={colaborador.estado_civil} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contato</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Telefone" valor={colaborador.telefone} />
          <Campo label="E-mail pessoal" valor={colaborador.email_pessoal} />
          <Campo label="E-mail corporativo" valor={colaborador.email_corporativo} />
          <Campo label="Cidade/UF" valor={colaborador.endereco_cidade ? `${colaborador.endereco_cidade}/${colaborador.endereco_estado || ''}` : null} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contratação</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Admissão" valor={formatDate(colaborador.data_admissao)} />
          <Campo label="Regime" valor={REGIME_CONFIG[colaborador.regime]?.label || colaborador.regime} />
          <Campo label="Modalidade" valor={MODALIDADE_LABELS[colaborador.modalidade]} />
          <Campo label="Carga horária" valor={colaborador.carga_horaria} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Organograma</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
          <Campo label="Gestor direto" valor={colaborador.gestor_nome} />
        </dl>
        {colaborador.subordinados_diretos?.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-1">Subordinados diretos</p>
            <ul className="space-y-1">
              {colaborador.subordinados_diretos.map(s => (
                <li key={s.id} className="text-sm text-stone-700">{s.nome} <span className="text-stone-400">— {s.cargo_nome}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <EditarColaboradorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        colaborador={colaborador}
        onSaved={() => { setShowEdit(false); onUpdated?.() }}
      />
      <DesligarModal
        open={showDesligar}
        onClose={() => setShowDesligar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowDesligar(false); onUpdated?.() }}
      />
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div>
      <dt className="text-stone-400 text-xs">{label}</dt>
      <dd className="text-stone-700">{valor || '—'}</dd>
    </div>
  )
}

// === Modal Editar (dados cadastrais — nunca salario/cargo atuais) ===
function buildEditForm(colaborador) {
  return {
    telefone: colaborador.telefone || '',
    email_pessoal: colaborador.email_pessoal || '',
    email_corporativo: colaborador.email_corporativo || '',
    endereco_logradouro: colaborador.endereco_logradouro || '',
    endereco_numero: colaborador.endereco_numero || '',
    endereco_bairro: colaborador.endereco_bairro || '',
    endereco_cidade: colaborador.endereco_cidade || '',
    endereco_estado: colaborador.endereco_estado || '',
    endereco_cep: colaborador.endereco_cep || '',
    carga_horaria: colaborador.carga_horaria || '',
    modalidade: colaborador.modalidade || '',
  }
}

export function EditarColaboradorModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState(() => buildEditForm(colaborador))
  const [prevColaborador, setPrevColaborador] = useState(colaborador)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (colaborador !== prevColaborador) {
    setPrevColaborador(colaborador)
    setForm(buildEditForm(colaborador))
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, form)
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Colaborador" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          <input className="input" type="email" placeholder="E-mail pessoal" value={form.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} />
          <input className="input col-span-2" type="email" placeholder="E-mail corporativo" value={form.email_corporativo} onChange={e => set('email_corporativo', e.target.value)} />
          <input className="input col-span-2" placeholder="Logradouro" value={form.endereco_logradouro} onChange={e => set('endereco_logradouro', e.target.value)} />
          <input className="input" placeholder="Número" value={form.endereco_numero} onChange={e => set('endereco_numero', e.target.value)} />
          <input className="input" placeholder="Bairro" value={form.endereco_bairro} onChange={e => set('endereco_bairro', e.target.value)} />
          <input className="input" placeholder="Cidade" value={form.endereco_cidade} onChange={e => set('endereco_cidade', e.target.value)} />
          <input className="input" placeholder="UF" maxLength={2} value={form.endereco_estado} onChange={e => set('endereco_estado', e.target.value.toUpperCase())} />
          <input className="input" placeholder="CEP" value={form.endereco_cep} onChange={e => set('endereco_cep', e.target.value)} />
          <input className="input" placeholder="Carga horária" value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)} />
          <select className="input" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
            <option value="">Modalidade...</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
            <option value="remoto">Remoto</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Modal Desligar ===
export function DesligarModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ data_desligamento: '', tipo_desligamento: '', motivo_desligamento: '', entrevista_saida: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.desligar(colaborador.id, form)
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao desligar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Desligar ${colaborador.nome}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Data de desligamento *</label>
          <input type="date" className="input" required value={form.data_desligamento} onChange={e => set('data_desligamento', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input" required value={form.tipo_desligamento} onChange={e => set('tipo_desligamento', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {Object.entries(TIPO_DESLIGAMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Motivo *</label>
          <textarea className="input" required rows={3} value={form.motivo_desligamento} onChange={e => set('motivo_desligamento', e.target.value)} />
        </div>
        <div>
          <label className="label">Entrevista de saída</label>
          <textarea className="input" rows={2} value={form.entrevista_saida} onChange={e => set('entrevista_saida', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-danger" disabled={loading}>
            {loading ? 'Desligando...' : 'Confirmar desligamento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Aba Remuneração ===
export function RemuneracaoTab({ colaborador, onUpdated }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLancar, setShowLancar] = useState(false)

  const carregar = () => {
    colaboradoresApi.historicoSalarial(colaborador.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-xs text-stone-400">Salário CLT atual</p>
        <p className="text-xl font-semibold text-stone-800">{formatCurrency(colaborador.salario_clt)}</p>
        {colaborador.remuneracao_complementar > 0 && (
          <p className="text-xs text-stone-500 mt-1">+ {formatCurrency(colaborador.remuneracao_complementar)} complementar</p>
        )}
        <p className="text-xs text-stone-400 mt-1">Vigente desde {formatDate(colaborador.data_vigencia_salario)}</p>
      </div>

      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowLancar(true)}>Lançar novo salário</button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
        {loading ? <Spinner size={18} /> : historico.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhum registro.</p>
        ) : (
          <ul className="space-y-2">
            {historico.map(h => (
              <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                <p className="text-stone-700 font-medium">{formatCurrency(h.salario_clt)}</p>
                <p className="text-xs text-stone-400">{formatDate(h.data_vigencia)} — {h.motivo} — {h.registrado_por_nome}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LancarSalarioModal
        open={showLancar}
        onClose={() => setShowLancar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowLancar(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}

function LancarSalarioModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ salario_clt: '', remuneracao_complementar: '', data_vigencia: '', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.lancarSalario(colaborador.id, {
        salario_clt: Number(form.salario_clt),
        remuneracao_complementar: form.remuneracao_complementar ? Number(form.remuneracao_complementar) : null,
        data_vigencia: form.data_vigencia,
        motivo: form.motivo,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao lançar salário'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar novo salário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Salário CLT *</label>
          <input type="number" step="0.01" className="input" required value={form.salario_clt} onChange={e => set('salario_clt', e.target.value)} />
        </div>
        <div>
          <label className="label">Remuneração complementar</label>
          <input type="number" step="0.01" className="input" value={form.remuneracao_complementar} onChange={e => set('remuneracao_complementar', e.target.value)} />
        </div>
        <div>
          <label className="label">Vigência *</label>
          <input type="date" className="input" required value={form.data_vigencia} onChange={e => set('data_vigencia', e.target.value)} />
        </div>
        <div>
          <label className="label">Motivo *</label>
          <input className="input" required value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Ex: Reajuste anual" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
