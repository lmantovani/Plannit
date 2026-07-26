import { useEffect, useState } from 'react'
import { Plus, Search, Settings, Lock } from 'lucide-react'
import { colaboradoresApi, departamentosApi, cargosApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import { REGIME_CONFIG, STATUS_COLOR_CLASSES, validarCPF } from '../../lib/constants'
import { useAuthStore, podeGerenciarColaboradores } from '../../store'
import ColaboradorDrawer from './ColaboradorDrawer'
import clsx from 'clsx'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

export default function ColaboradoresPage() {
  const { user } = useAuthStore()
  const podeGerenciar = podeGerenciarColaboradores(user?.perfil)
  const [colaboradores, setColaboradores] = useState([])
  const [todosColaboradoresAtivos, setTodosColaboradoresAtivos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('')
  const [filtroRegime, setFiltroRegime] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('true')
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [showDeptCargoModal, setShowDeptCargoModal] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState(null)

  const carregarDepartamentosECargos = () => {
    departamentosApi.list().then(r => setDepartamentos(r.data)).catch(console.error)
    cargosApi.list().then(r => setCargos(r.data)).catch(console.error)
    colaboradoresApi.list({ is_active: 'true' }).then(r => setTodosColaboradoresAtivos(r.data)).catch(console.error)
  }

  const fetchLista = () => {
    const params = {}
    if (busca) params.busca = busca
    if (filtroDepartamento) params.departamento_id = filtroDepartamento
    if (filtroCargo) params.cargo_id = filtroCargo
    if (filtroRegime) params.regime = filtroRegime
    if (filtroStatus) params.is_active = filtroStatus
    colaboradoresApi.list(params)
      .then(r => setColaboradores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!podeGerenciar) return
    carregarDepartamentosECargos()
  }, [podeGerenciar])

  useEffect(() => {
    if (!podeGerenciar) return
    let ignore = false
    const fetchData = async () => {
      setLoading(true)
      const params = {}
      if (busca) params.busca = busca
      if (filtroDepartamento) params.departamento_id = filtroDepartamento
      if (filtroCargo) params.cargo_id = filtroCargo
      if (filtroRegime) params.regime = filtroRegime
      if (filtroStatus) params.is_active = filtroStatus
      try {
        const r = await colaboradoresApi.list(params)
        if (!ignore) setColaboradores(r.data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [podeGerenciar, busca, filtroDepartamento, filtroCargo, filtroRegime, filtroStatus])

  if (!podeGerenciar) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Lock}
          title="Acesso restrito"
          description="Esta área é exclusiva para RH e Diretoria."
        />
      </div>
    )
  }

  if (loading && colaboradores.length === 0) return <LoadingPage />

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar colaborador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <select className="input w-44" value={filtroDepartamento} onChange={e => setFiltroDepartamento(e.target.value)}>
          <option value="">Todos os departamentos</option>
          {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>

        <select className="input w-40" value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}>
          <option value="">Todos os cargos</option>
          {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <select className="input w-32" value={filtroRegime} onChange={e => setFiltroRegime(e.target.value)}>
          <option value="">CLT/PJ</option>
          <option value="clt">CLT</option>
          <option value="pj">PJ</option>
        </select>

        <select className="input w-36" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="true">Ativos</option>
          <option value="false">Desligados</option>
          <option value="">Todos</option>
        </select>

        <button onClick={() => setShowDeptCargoModal(true)} className="btn-secondary btn-sm gap-1.5">
          <Settings size={13} /> Departamentos & Cargos
        </button>
        <button onClick={() => setShowNovoModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Colaborador
        </button>
      </div>

      {colaboradores.length === 0 ? (
        <EmptyState title="Nenhum colaborador encontrado" description="Tente ajustar os filtros ou cadastre um novo." />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Regime</th>
                <th>Admissão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map(c => (
                <tr key={c.id}>
                  <td>
                    <button
                      className="font-medium text-stone-800 hover:text-primary-600 transition-colors text-left"
                      onClick={() => setSelecionadoId(c.id)}
                    >
                      {c.nome}
                    </button>
                  </td>
                  <td>{c.cargo_nome || '—'}</td>
                  <td>{c.departamento_nome || '—'}</td>
                  <td>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[REGIME_CONFIG[c.regime]?.color || 'stone'])}>
                      {REGIME_CONFIG[c.regime]?.label || c.regime}
                    </span>
                  </td>
                  <td>{c.data_admissao}</td>
                  <td>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[c.is_active ? 'green' : 'stone'])}>
                      {c.is_active ? 'Ativo' : 'Desligado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DepartamentosCargosModal
        open={showDeptCargoModal}
        onClose={() => setShowDeptCargoModal(false)}
        departamentos={departamentos}
        cargos={cargos}
        onChanged={carregarDepartamentosECargos}
      />

      <NovoColaboradorModal
        open={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        departamentos={departamentos}
        cargos={cargos}
        colaboradoresAtivos={todosColaboradoresAtivos}
        onSaved={() => { setShowNovoModal(false); fetchLista(); carregarDepartamentosECargos() }}
      />

      {selecionadoId && (
        <ColaboradorDrawer
          colaboradorId={selecionadoId}
          onClose={() => setSelecionadoId(null)}
          onUpdated={fetchLista}
        />
      )}
    </div>
  )
}

// === Modal Departamentos & Cargos ===
function DepartamentosCargosModal({ open, onClose, departamentos, cargos, onChanged }) {
  const [novoDept, setNovoDept] = useState('')
  const [novoCargoNome, setNovoCargoNome] = useState('')
  const [novoCargoDept, setNovoCargoDept] = useState('')
  const [error, setError] = useState('')

  const criarDepartamento = async () => {
    if (!novoDept.trim()) return
    try {
      await departamentosApi.create({ nome: novoDept.trim() })
      setNovoDept('')
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao criar departamento')) }
  }

  const criarCargo = async () => {
    if (!novoCargoNome.trim() || !novoCargoDept) return
    try {
      await cargosApi.create({ nome: novoCargoNome.trim(), departamento_id: Number(novoCargoDept) })
      setNovoCargoNome('')
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao criar cargo')) }
  }

  const toggleDeptAtivo = async (dept) => {
    try {
      await departamentosApi.update(dept.id, { ativo: !dept.ativo })
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao atualizar departamento')) }
  }

  const toggleCargoAtivo = async (cargo) => {
    try {
      await cargosApi.update(cargo.id, { ativo: !cargo.ativo })
      onChanged()
    } catch (err) { setError(extractErrorMessage(err, 'Erro ao atualizar cargo')) }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Departamentos & Cargos" size="lg">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-stone-700 text-sm mb-2">Departamentos</h3>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" value={novoDept} onChange={e => setNovoDept(e.target.value)} placeholder="Nome do departamento" />
            <button className="btn-secondary btn-sm" onClick={criarDepartamento}>Adicionar</button>
          </div>
          <ul className="space-y-1">
            {departamentos.map(d => (
              <li key={d.id} className="flex items-center justify-between text-sm py-1">
                <span className={clsx(!d.ativo && 'text-stone-400 line-through')}>{d.nome}</span>
                <button className="text-xs text-primary-600" onClick={() => toggleDeptAtivo(d)}>
                  {d.ativo ? 'Inativar' : 'Reativar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-stone-700 text-sm mb-2">Cargos</h3>
          <div className="flex flex-col gap-2 mb-3">
            <input className="input" value={novoCargoNome} onChange={e => setNovoCargoNome(e.target.value)} placeholder="Nome do cargo" />
            <select className="input" value={novoCargoDept} onChange={e => setNovoCargoDept(e.target.value)}>
              <option value="">Departamento...</option>
              {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <button className="btn-secondary btn-sm" onClick={criarCargo}>Adicionar</button>
          </div>
          <ul className="space-y-1">
            {cargos.map(c => (
              <li key={c.id} className="flex items-center justify-between text-sm py-1">
                <span className={clsx(!c.ativo && 'text-stone-400 line-through')}>{c.nome} <span className="text-stone-400">— {c.departamento_nome}</span></span>
                <button className="text-xs text-primary-600" onClick={() => toggleCargoAtivo(c)}>
                  {c.ativo ? 'Inativar' : 'Reativar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </Modal>
  )
}

// === Modal Novo Colaborador ===
function NovoColaboradorModal({ open, onClose, departamentos, cargos, colaboradoresAtivos, onSaved }) {
  const vazio = {
    nome: '', cpf: '', data_nascimento: '', sexo: '', estado_civil: '',
    telefone: '', email_pessoal: '', email_corporativo: '',
    endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', endereco_cep: '',
    data_admissao: '', departamento_id: '', cargo_id: '', regime: 'clt', tipo_contrato: '',
    pj_cnpj: '', pj_valor_mensal: '',
    salario_clt: '', data_vigencia_salario: '',
    carga_horaria: '', escala: '', modalidade: '',
    banco: '', agencia: '', conta: '', tipo_conta: '',
    gestor_id: '',
  }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const cargosDoDept = form.departamento_id
    ? cargos.filter(c => String(c.departamento_id) === String(form.departamento_id))
    : cargos

  const resetForm = () => {
    setForm(vazio)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarCPF(form.cpf)) {
      setError('CPF inválido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        departamento_id: Number(form.departamento_id),
        cargo_id: Number(form.cargo_id),
        gestor_id: form.gestor_id ? Number(form.gestor_id) : null,
        salario_clt: form.salario_clt ? Number(form.salario_clt) : null,
        pj_valor_mensal: form.pj_valor_mensal ? Number(form.pj_valor_mensal) : null,
        data_vigencia_salario: form.data_vigencia_salario || null,
        data_nascimento: form.data_nascimento || null,
        modalidade: form.modalidade || null,
      }
      await colaboradoresApi.create(payload)
      onSaved()
      resetForm()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar colaborador'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo Colaborador" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Identificação</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label className="label">CPF *</label>
              <input className="input" required value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input type="date" className="input" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
            </div>
            <div>
              <label className="label">Sexo</label>
              <input className="input" value={form.sexo} onChange={e => set('sexo', e.target.value)} />
            </div>
            <div>
              <label className="label">Estado civil</label>
              <input className="input" value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contato</p>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
            <input className="input" type="email" placeholder="E-mail pessoal" value={form.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} />
            <input className="input" type="email" placeholder="E-mail corporativo" value={form.email_corporativo} onChange={e => set('email_corporativo', e.target.value)} />
            <input className="input col-span-2" placeholder="Logradouro" value={form.endereco_logradouro} onChange={e => set('endereco_logradouro', e.target.value)} />
            <input className="input" placeholder="Número" value={form.endereco_numero} onChange={e => set('endereco_numero', e.target.value)} />
            <input className="input" placeholder="Bairro" value={form.endereco_bairro} onChange={e => set('endereco_bairro', e.target.value)} />
            <input className="input" placeholder="Cidade" value={form.endereco_cidade} onChange={e => set('endereco_cidade', e.target.value)} />
            <input className="input" placeholder="UF" maxLength={2} value={form.endereco_estado} onChange={e => set('endereco_estado', e.target.value.toUpperCase())} />
            <input className="input" placeholder="CEP" value={form.endereco_cep} onChange={e => set('endereco_cep', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contratação</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data de admissão *</label>
              <input type="date" className="input" required value={form.data_admissao} onChange={e => set('data_admissao', e.target.value)} />
            </div>
            <div>
              <label className="label">Departamento *</label>
              <select className="input" required value={form.departamento_id} onChange={e => { set('departamento_id', e.target.value); set('cargo_id', '') }}>
                <option value="" disabled>Selecione...</option>
                {departamentos.filter(d => d.ativo).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cargo *</label>
              <select className="input" required value={form.cargo_id} onChange={e => set('cargo_id', e.target.value)}>
                <option value="" disabled>Selecione...</option>
                {cargosDoDept.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Regime *</label>
              <select className="input" required value={form.regime} onChange={e => set('regime', e.target.value)}>
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
              </select>
            </div>
            <div>
              <label className="label">Tipo de contrato</label>
              <input className="input" value={form.tipo_contrato} onChange={e => set('tipo_contrato', e.target.value)} />
            </div>
            <div>
              <label className="label">Gestor direto</label>
              <select className="input" value={form.gestor_id} onChange={e => set('gestor_id', e.target.value)}>
                <option value="">Sem gestor</option>
                {colaboradoresAtivos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {form.regime === 'pj' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Dados PJ</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="CNPJ" value={form.pj_cnpj} onChange={e => set('pj_cnpj', e.target.value)} />
              <input className="input" type="number" step="0.01" placeholder="Valor mensal" value={form.pj_valor_mensal} onChange={e => set('pj_valor_mensal', e.target.value)} />
            </div>
          </div>
        )}

        {form.regime === 'clt' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Remuneração inicial</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" step="0.01" placeholder="Salário CLT" value={form.salario_clt} onChange={e => set('salario_clt', e.target.value)} />
              <input type="date" className="input" placeholder="Vigência" value={form.data_vigencia_salario} onChange={e => set('data_vigencia_salario', e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Regime de trabalho</p>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Carga horária" value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)} />
            <input className="input" placeholder="Escala" value={form.escala} onChange={e => set('escala', e.target.value)} />
            <select className="input" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
              <option value="">Modalidade...</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Colaborador'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
