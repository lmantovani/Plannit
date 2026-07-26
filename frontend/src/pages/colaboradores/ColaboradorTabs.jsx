import { useEffect, useState } from 'react'
import { formatDate, formatCurrency, REGIME_CONFIG, MODALIDADE_LABELS, TIPO_DESLIGAMENTO_LABELS, TIPO_DOCUMENTO_COLABORADOR_LABELS } from '../../lib/constants'
import { Modal, Spinner, ConfirmDialog } from '../../components/ui'
import { colaboradoresApi, cargosApi } from '../../lib/api'

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

  const handleClose = () => {
    setForm(buildEditForm(colaborador))
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, { ...form, modalidade: form.modalidade || null })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Editar Colaborador" size="lg">
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
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Modal Desligar ===
const desligarFormVazio = { data_desligamento: '', tipo_desligamento: '', motivo_desligamento: '', entrevista_saida: '' }

export function DesligarModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState(desligarFormVazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm(desligarFormVazio)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.desligar(colaborador.id, form)
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao desligar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Desligar ${colaborador.nome}`} size="md">
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
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
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
        <p className="text-xl font-semibold text-stone-800">{colaborador.salario_clt ? formatCurrency(colaborador.salario_clt) : 'Não informado'}</p>
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

  const resetForm = () => {
    setForm({ salario_clt: '', remuneracao_complementar: '', data_vigencia: '', motivo: '' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao lançar salário'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Lançar novo salário" size="sm">
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
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Aba Cargo & Progressão ===
export function CargoProgressaoTab({ colaborador, onUpdated }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPromover, setShowPromover] = useState(false)

  const carregar = () => {
    colaboradoresApi.historicoCargo(colaborador.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-xs text-stone-400">Cargo atual</p>
        <p className="text-lg font-semibold text-stone-800">{colaborador.cargo_nome}</p>
        <p className="text-xs text-stone-400 mt-1">{colaborador.departamento_nome}</p>
      </div>

      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowPromover(true)}>Registrar promoção</button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
        {loading ? <Spinner size={18} /> : historico.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhum registro.</p>
        ) : (
          <ul className="space-y-2">
            {historico.map(h => (
              <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                <p className="text-stone-700 font-medium">
                  {h.cargo_anterior_nome ? `${h.cargo_anterior_nome} → ${h.cargo_novo_nome}` : h.cargo_novo_nome}
                </p>
                <p className="text-xs text-stone-400">{formatDate(h.data)} — {h.justificativa || 'Sem justificativa'} — {h.aprovado_por_nome}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PromoverModal
        open={showPromover}
        onClose={() => setShowPromover(false)}
        colaborador={colaborador}
        onSaved={() => { setShowPromover(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}

function PromoverModal({ open, onClose, colaborador, onSaved }) {
  const [cargos, setCargos] = useState([])
  const [form, setForm] = useState({ cargo_novo_id: '', data: '', justificativa: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) cargosApi.list().then(r => setCargos(r.data.filter(c => c.ativo))).catch(console.error)
  }, [open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({ cargo_novo_id: '', data: '', justificativa: '' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.promover(colaborador.id, {
        cargo_novo_id: Number(form.cargo_novo_id),
        data: form.data,
        justificativa: form.justificativa || null,
      })
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao registrar promoção'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Registrar promoção" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Novo cargo *</label>
          <select className="input" required value={form.cargo_novo_id} onChange={e => set('cargo_novo_id', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {cargos.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.departamento_nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data *</label>
          <input type="date" className="input" required value={form.data} onChange={e => set('data', e.target.value)} />
        </div>
        <div>
          <label className="label">Justificativa</label>
          <textarea className="input" rows={3} value={form.justificativa} onChange={e => set('justificativa', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Aba Documentos ===
export function DocumentosTab({ colaborador }) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdicionar, setShowAdicionar] = useState(false)
  const [documentoParaRemover, setDocumentoParaRemover] = useState(null)
  const [error, setError] = useState('')

  const carregar = () => {
    colaboradoresApi.listarDocumentos(colaborador.id)
      .then(r => setDocumentos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  const confirmarRemocao = async () => {
    try {
      await colaboradoresApi.removerDocumento(colaborador.id, documentoParaRemover.id)
      setDocumentoParaRemover(null)
      carregar()
    } catch (err) {
      setDocumentoParaRemover(null)
      setError(extractErrorMessage(err, 'Erro ao remover documento'))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowAdicionar(true)}>Adicionar documento</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? <Spinner size={18} /> : documentos.length === 0 ? (
        <p className="text-sm text-stone-400">Nenhum documento cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {documentos.map(d => (
            <li key={d.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-stone-700 font-medium">{TIPO_DOCUMENTO_COLABORADOR_LABELS[d.tipo] || d.tipo}</p>
                <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">Abrir documento</a>
                {d.data_vencimento && <p className="text-xs text-stone-400">Vence em {formatDate(d.data_vencimento)}</p>}
              </div>
              <button className="text-xs text-red-600" onClick={() => setDocumentoParaRemover(d)}>Remover</button>
            </li>
          ))}
        </ul>
      )}

      <AdicionarDocumentoModal
        open={showAdicionar}
        onClose={() => setShowAdicionar(false)}
        colaborador={colaborador}
        onSaved={() => { setShowAdicionar(false); carregar() }}
      />

      <ConfirmDialog
        open={!!documentoParaRemover}
        onClose={() => setDocumentoParaRemover(null)}
        onConfirm={confirmarRemocao}
        title="Remover documento"
        message={`Remover o documento "${TIPO_DOCUMENTO_COLABORADOR_LABELS[documentoParaRemover?.tipo] || documentoParaRemover?.tipo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        danger
      />
    </div>
  )
}

function AdicionarDocumentoModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ tipo: '', url: '', data_vencimento: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({ tipo: '', url: '', data_vencimento: '' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.adicionarDocumento(colaborador.id, {
        tipo: form.tipo,
        url: form.url,
        data_vencimento: form.data_vencimento || null,
      })
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao adicionar documento'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar documento" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tipo *</label>
          <select className="input" required value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="" disabled>Selecione...</option>
            {Object.entries(TIPO_DOCUMENTO_COLABORADOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">URL *</label>
          <input className="input" required type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="label">Data de vencimento</label>
          <input type="date" className="input" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Aba Contratação ===
export function ContratacaoTab({ colaborador, onUpdated }) {
  const [showEdit, setShowEdit] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contrato</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Regime" valor={REGIME_CONFIG[colaborador.regime]?.label || colaborador.regime} />
          <Campo label="Tipo de contrato" valor={colaborador.tipo_contrato} />
        </dl>
      </section>

      {colaborador.regime === 'pj' && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo label="CNPJ" valor={colaborador.pj_cnpj} />
            <Campo label="Valor mensal" valor={colaborador.pj_valor_mensal ? formatCurrency(colaborador.pj_valor_mensal) : null} />
            <Campo label="Vigência início" valor={formatDate(colaborador.pj_vigencia_inicio)} />
            <Campo label="Vigência fim" valor={formatDate(colaborador.pj_vigencia_fim)} />
          </dl>
          {colaborador.pj_contrato_url && (
            <a href={colaborador.pj_contrato_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">Abrir contrato</a>
          )}
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Escala" valor={colaborador.escala} />
          <Campo label="Jornada especial" valor={colaborador.jornada_especial} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados bancários</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo label="Banco" valor={colaborador.banco} />
          <Campo label="Agência" valor={colaborador.agencia} />
          <Campo label="Conta" valor={colaborador.conta} />
          <Campo label="Tipo de conta" valor={colaborador.tipo_conta === 'corrente' ? 'Corrente' : colaborador.tipo_conta === 'poupanca' ? 'Poupança' : colaborador.tipo_conta} />
        </dl>
      </section>

      <EditarContratacaoModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        colaborador={colaborador}
        onSaved={() => { setShowEdit(false); onUpdated?.() }}
      />
    </div>
  )
}

function buildContratacaoForm(colaborador) {
  return {
    tipo_contrato: colaborador.tipo_contrato || '',
    pj_cnpj: colaborador.pj_cnpj || '',
    pj_contrato_url: colaborador.pj_contrato_url || '',
    pj_valor_mensal: colaborador.pj_valor_mensal ?? '',
    pj_vigencia_inicio: colaborador.pj_vigencia_inicio || '',
    pj_vigencia_fim: colaborador.pj_vigencia_fim || '',
    escala: colaborador.escala || '',
    jornada_especial: colaborador.jornada_especial || '',
    banco: colaborador.banco || '',
    agencia: colaborador.agencia || '',
    conta: colaborador.conta || '',
    tipo_conta: colaborador.tipo_conta || '',
    gestor_id: colaborador.gestor_id || '',
  }
}

function EditarContratacaoModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState(() => buildContratacaoForm(colaborador))
  const [prevColaborador, setPrevColaborador] = useState(colaborador)
  const [gestores, setGestores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (colaborador !== prevColaborador) {
    setPrevColaborador(colaborador)
    setForm(buildContratacaoForm(colaborador))
  }

  useEffect(() => {
    if (open) {
      colaboradoresApi.list({ is_active: 'true' })
        .then(r => setGestores(r.data.filter(c => c.id !== colaborador.id)))
        .catch(console.error)
    }
  }, [open, colaborador.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleClose = () => {
    setForm(buildContratacaoForm(colaborador))
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, {
        ...form,
        pj_valor_mensal: form.pj_valor_mensal === '' ? null : Number(form.pj_valor_mensal),
        pj_vigencia_inicio: form.pj_vigencia_inicio || null,
        pj_vigencia_fim: form.pj_vigencia_fim || null,
        gestor_id: form.gestor_id ? Number(form.gestor_id) : null,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar contratação'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Editar Contratação" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contrato</p>
          <input className="input" placeholder="Tipo de contrato" value={form.tipo_contrato} onChange={e => set('tipo_contrato', e.target.value)} />
        </div>

        {colaborador.regime === 'pj' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="CNPJ" value={form.pj_cnpj} onChange={e => set('pj_cnpj', e.target.value)} />
              <input className="input" type="number" step="0.01" placeholder="Valor mensal" value={form.pj_valor_mensal} onChange={e => set('pj_valor_mensal', e.target.value)} />
              <input className="input col-span-2" type="url" placeholder="URL do contrato" value={form.pj_contrato_url} onChange={e => set('pj_contrato_url', e.target.value)} />
              <div>
                <label className="label">Vigência início</label>
                <input type="date" className="input" value={form.pj_vigencia_inicio} onChange={e => set('pj_vigencia_inicio', e.target.value)} />
              </div>
              <div>
                <label className="label">Vigência fim</label>
                <input type="date" className="input" value={form.pj_vigencia_fim} onChange={e => set('pj_vigencia_fim', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Escala" value={form.escala} onChange={e => set('escala', e.target.value)} />
            <input className="input" placeholder="Jornada especial" value={form.jornada_especial} onChange={e => set('jornada_especial', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados bancários</p>
          <div className="grid grid-cols-4 gap-3">
            <input className="input" placeholder="Banco" value={form.banco} onChange={e => set('banco', e.target.value)} />
            <input className="input" placeholder="Agência" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
            <input className="input" placeholder="Conta" value={form.conta} onChange={e => set('conta', e.target.value)} />
            <select className="input" value={form.tipo_conta} onChange={e => set('tipo_conta', e.target.value)}>
              <option value="">Tipo...</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Organograma</p>
          <select className="input" value={form.gestor_id} onChange={e => set('gestor_id', e.target.value)}>
            <option value="">Sem gestor</option>
            {gestores.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
