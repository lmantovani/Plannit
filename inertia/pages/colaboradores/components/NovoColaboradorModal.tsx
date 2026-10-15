import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, UserPlus, Building2, DollarSign, BrainCircuit } from 'lucide-react'
import type { DepartamentoOption, CargoOption, GestorOption } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  departamentos: DepartamentoOption[]
  cargos: CargoOption[]
  gestores: GestorOption[]
}

export default function NovoColaboradorModal({ isOpen, onClose, departamentos, cargos, gestores }: Props) {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'contrato' | 'disc'>('pessoal')

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    sexo: '',
    estadoCivil: '',
    emailPessoal: '',
    telefonePessoal: '',
    emailCorporativo: '',
    telefoneCorporativo: '',
    enderecoCidade: '',
    enderecoEstado: '',

    // Contrato
    dataAdmissao: new Date().toISOString().split('T')[0],
    departamentoId: departamentos[0]?.id || 1,
    cargoId: cargos[0]?.id || 1,
    regime: 'clt' as 'clt' | 'pj',
    modalidade: 'presencial' as 'presencial' | 'hibrido' | 'remoto',
    salarioClt: '',
    remuneracaoComplementar: '',
    pjCnpj: '',
    pjValorMensal: '',
    gestorId: '',

    // DISC
    perfilDiscPrimario: '',
    perfilDiscSecundario: '',
    observacoesComportamentais: '',
  })

  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  // Filtra cargos pelo departamento selecionado
  const cargosFiltrados = cargos.filter((c) => c.departamentoId === Number(form.departamentoId))

  const handleDeptoChange = (depId: number) => {
    const primeirosCargos = cargos.filter((c) => c.departamentoId === depId)
    setForm({
      ...form,
      departamentoId: depId,
      cargoId: primeirosCargos[0]?.id || cargos[0]?.id || 1,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...form,
      departamentoId: Number(form.departamentoId),
      cargoId: Number(form.cargoId),
      gestorId: form.gestorId ? Number(form.gestorId) : null,
      salarioClt: form.salarioClt ? Number(form.salarioClt) : null,
      remuneracaoComplementar: form.remuneracaoComplementar ? Number(form.remuneracaoComplementar) : null,
      pjValorMensal: form.pjValorMensal ? Number(form.pjValorMensal) : null,
    }

    router.post('/colaboradores', payload, {
      onSuccess: () => {
        setSubmitting(false)
        onClose()
      },
      onError: () => {
        setSubmitting(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-stone-800">
            <UserPlus size={20} className="text-primary-600" />
            <h3 className="font-display font-semibold text-lg">Novo Colaborador</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas do Formulário */}
        <div className="flex border-b border-stone-200 bg-stone-100/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'pessoal'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Building2 size={14} />
            <span>Dados Pessoais & Contato</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contrato')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'contrato'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <DollarSign size={14} />
            <span>Contratação & Remuneração</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disc')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'disc'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <BrainCircuit size={14} />
            <span>Perfil Comportamental (DISC)</span>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'pessoal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Clara Silva"
                  className="input input-sm w-full"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">CPF *</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  className="input input-sm w-full"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">RG</label>
                <input
                  type="text"
                  placeholder="Ex: 12.345.678-9"
                  className="input input-sm w-full"
                  value={form.rg}
                  onChange={(e) => setForm({ ...form, rg: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  placeholder="nome@lidermoveis.com.br"
                  className="input input-sm w-full"
                  value={form.emailCorporativo}
                  onChange={(e) => setForm({ ...form, emailCorporativo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone Corporativo</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  className="input input-sm w-full"
                  value={form.telefoneCorporativo}
                  onChange={(e) => setForm({ ...form, telefoneCorporativo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail Pessoal</label>
                <input
                  type="email"
                  placeholder="pessoal@email.com"
                  className="input input-sm w-full"
                  value={form.emailPessoal}
                  onChange={(e) => setForm({ ...form, emailPessoal: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone Pessoal</label>
                <input
                  type="text"
                  placeholder="(11) 98888-8888"
                  className="input input-sm w-full"
                  value={form.telefonePessoal}
                  onChange={(e) => setForm({ ...form, telefonePessoal: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  className="input input-sm w-full"
                  value={form.enderecoCidade}
                  onChange={(e) => setForm({ ...form, enderecoCidade: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="SP"
                  className="input input-sm w-full uppercase"
                  value={form.enderecoEstado}
                  onChange={(e) => setForm({ ...form, enderecoEstado: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          )}

          {activeTab === 'contrato' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Admissão *</label>
                <input
                  type="date"
                  required
                  className="input input-sm w-full"
                  value={form.dataAdmissao}
                  onChange={(e) => setForm({ ...form, dataAdmissao: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Departamento *</label>
                <select
                  className="select select-sm w-full"
                  value={form.departamentoId}
                  onChange={(e) => handleDeptoChange(Number(e.target.value))}
                >
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Cargo *</label>
                <select
                  className="select select-sm w-full"
                  value={form.cargoId}
                  onChange={(e) => setForm({ ...form, cargoId: Number(e.target.value) })}
                >
                  {cargosFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Gestor Direto</label>
                <select
                  className="select select-sm w-full"
                  value={form.gestorId}
                  onChange={(e) => setForm({ ...form, gestorId: e.target.value })}
                >
                  <option value="">Sem gestor direto (Liderança de Topo)</option>
                  {gestores.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Regime de Contratação *</label>
                <select
                  className="select select-sm w-full"
                  value={form.regime}
                  onChange={(e) => setForm({ ...form, regime: e.target.value as any })}
                >
                  <option value="clt">CLT</option>
                  <option value="pj">Pessoa Jurídica (PJ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Modalidade *</label>
                <select
                  className="select select-sm w-full"
                  value={form.modalidade}
                  onChange={(e) => setForm({ ...form, modalidade: e.target.value as any })}
                >
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="remoto">Remoto</option>
                </select>
              </div>

              {form.regime === 'clt' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Salário CLT Inicial (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5500.00"
                      className="input input-sm w-full"
                      value={form.salarioClt}
                      onChange={(e) => setForm({ ...form, salarioClt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Remuneração Complementar (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1000.00"
                      className="input input-sm w-full"
                      value={form.remuneracaoComplementar}
                      onChange={(e) => setForm({ ...form, remuneracaoComplementar: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">CNPJ da PJ</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      className="input input-sm w-full"
                      value={form.pjCnpj}
                      onChange={(e) => setForm({ ...form, pjCnpj: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Valor Mensal Contrato (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 8000.00"
                      className="input input-sm w-full"
                      value={form.pjValorMensal}
                      onChange={(e) => setForm({ ...form, pjValorMensal: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'disc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Traço DISC Primário</label>
                  <select
                    className="select select-sm w-full"
                    value={form.perfilDiscPrimario}
                    onChange={(e) => setForm({ ...form, perfilDiscPrimario: e.target.value })}
                  >
                    <option value="">Não avaliado</option>
                    <option value="dominante">D — Dominante (Foco em Resultados / Ação)</option>
                    <option value="influente">I — Influente (Comunicação / Entusiasmo)</option>
                    <option value="estavel">S — Estável (Paciência / Harmonia / Apoio)</option>
                    <option value="cauteloso">C — Cauteloso (Precisão / Análise / Detalhes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Traço DISC Secundário</label>
                  <select
                    className="select select-sm w-full"
                    value={form.perfilDiscSecundario}
                    onChange={(e) => setForm({ ...form, perfilDiscSecundario: e.target.value })}
                  >
                    <option value="">Nenhum / Não avaliado</option>
                    <option value="dominante">D — Dominante</option>
                    <option value="influente">I — Influente</option>
                    <option value="estavel">S — Estável</option>
                    <option value="cauteloso">C — Cauteloso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Observações Comportamentais</label>
                <textarea
                  rows={4}
                  placeholder="Pontos fortes, estilo de liderança, preferências de trabalho em equipe..."
                  className="textarea textarea-sm w-full text-xs"
                  value={form.observacoesComportamentais}
                  onChange={(e) => setForm({ ...form, observacoesComportamentais: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Footer Ações */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <div className="text-xs text-stone-500">
              * Campos obrigatórios para cadastro funcional.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                {submitting ? 'Salvando...' : 'Cadastrar Colaborador'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
