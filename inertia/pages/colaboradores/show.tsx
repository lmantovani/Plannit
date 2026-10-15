import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '~/layouts/app_layout'
import {
  ArrowLeft,
  DollarSign,
  Award,
  FileText,
  UserX,
  Trash2,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  BrainCircuit,
  FileUp,
  UserCheck,
} from 'lucide-react'
import type { ColaboradorDetalhe, DepartamentoOption, CargoOption, GestorOption } from './types'
import NovoSalarioModal from './components/NovoSalarioModal'
import NovoCargoModal from './components/NovoCargoModal'
import DesligarModal from './components/DesligarModal'
import PurgaModal from './components/PurgaModal'
import NovoDocumentoModal from './components/NovoDocumentoModal'

interface Props {
  colaborador: ColaboradorDetalhe
  departamentos: DepartamentoOption[]
  cargos: CargoOption[]
  gestores: GestorOption[]
  isDiretoria: boolean
}

export default function ColaboradorShow({ colaborador, cargos, isDiretoria }: Props) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'contrato' | 'salarial' | 'cargos' | 'docs' | 'rescisao'>('perfil')

  // Modais
  const [modalSalarioOpen, setModalSalarioOpen] = useState(false)
  const [modalCargoOpen, setModalCargoOpen] = useState(false)
  const [modalDesligarOpen, setModalDesligarOpen] = useState(false)
  const [modalPurgaOpen, setModalPurgaOpen] = useState(false)
  const [modalDocOpen, setModalDocOpen] = useState(false)

  const iniciais = colaborador.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <AppLayout
      title={colaborador.nome}
      subtitle={`Prontuário Funcional — ${colaborador.cargo?.nome || 'Colaborador'} (${colaborador.departamento?.nome || 'Geral'})`}
    >
      <Head title={`${colaborador.nome} — Líder Móveis Planejados`} />

      <div className="space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
        {/* Cabeçalho do Prontuário */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/colaboradores"
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={14} />
            <span>Voltar para Lista de Colaboradores</span>
          </Link>

          <div className="flex items-center gap-2">
            {colaborador.isActive ? (
              <button
                type="button"
                onClick={() => setModalDesligarOpen(true)}
                className="btn btn-secondary btn-sm text-red-700 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
              >
                <UserX size={14} />
                <span>Formalizar Desligamento (RH-RN009)</span>
              </button>
            ) : isDiretoria ? (
              <button
                type="button"
                onClick={() => setModalPurgaOpen(true)}
                className="btn btn-danger btn-sm flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Purga Administrativa (RH-RN011)</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Card Principal do Perfil */}
        <div className="card p-6 bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white font-display text-xl font-bold flex items-center justify-center shadow-md">
              {iniciais}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-stone-900">{colaborador.nome}</h2>
                {colaborador.isActive ? (
                  <span className="badge badge-success text-[10px] uppercase font-semibold">Ativo</span>
                ) : (
                  <span className="badge badge-secondary text-[10px] uppercase font-semibold bg-stone-100 text-stone-600">Desligado</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <Building2 size={13} className="text-stone-400" />
                  {colaborador.cargo?.nome} • {colaborador.departamento?.nome}
                </span>
                <span>CPF: {colaborador.cpf}</span>
                {colaborador.dataAdmissao && (
                  <span className="flex items-center gap-1 text-stone-400">
                    <Calendar size={13} />
                    Admissão: {colaborador.dataAdmissao.split('-').reverse().join('/')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right border-l border-stone-200 pl-4">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Remuneração Base</span>
              <span className="text-lg font-bold font-display text-stone-900">
                {colaborador.regime === 'clt'
                  ? colaborador.salarioClt
                    ? `R$ ${Number(colaborador.salarioClt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'
                  : colaborador.pjValorMensal
                  ? `R$ ${Number(colaborador.pjValorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
                  : '—'}
              </span>
              <span className="text-[10px] text-stone-500 block uppercase">{colaborador.regime.toUpperCase()} • {colaborador.modalidade}</span>
            </div>
          </div>
        </div>

        {/* Barra de Abas */}
        <div className="border-b border-stone-200 bg-white rounded-t-xl px-4 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'perfil'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <UserCheck size={14} />
            <span>Perfil & Contato</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contrato')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'contrato'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Building2 size={14} />
            <span>Contrato & Organograma</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salarial')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'salarial'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <DollarSign size={14} />
            <span>Histórico Salarial ({colaborador.historicoSalarial.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cargos')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'cargos'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Award size={14} />
            <span>Progressão de Cargos ({colaborador.historicoCargos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'docs'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileText size={14} />
            <span>Documentos ({colaborador.documentos.length})</span>
          </button>

          {!colaborador.isActive && (
            <button
              type="button"
              onClick={() => setActiveTab('rescisao')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'rescisao'
                  ? 'border-red-600 text-red-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <UserX size={14} />
              <span>Rescisão & Saída</span>
            </button>
          )}
        </div>

        {/* Conteúdo da Aba */}
        <div className="card p-6 bg-white border border-stone-200 shadow-sm">
          {/* Aba 1: Perfil & Contato */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-display font-semibold text-stone-800 text-sm mb-3">Identificação & Dados Pessoais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5">Nome Completo</span>
                    <span className="font-medium text-stone-800">{colaborador.nome}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">CPF</span>
                    <span className="font-medium text-stone-800">{colaborador.cpf}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">RG</span>
                    <span className="font-medium text-stone-800">{colaborador.rg || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Data de Nascimento</span>
                    <span className="font-medium text-stone-800">
                      {colaborador.dataNascimento ? colaborador.dataNascimento.split('-').reverse().join('/') : 'Não informada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Sexo / Estado Civil</span>
                    <span className="font-medium text-stone-800">
                      {colaborador.sexo || '—'} / {colaborador.estadoCivil || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h4 className="font-display font-semibold text-stone-800 text-sm mb-3">Contatos & Endereço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5">E-mail Corporativo</span>
                    <span className="font-medium text-stone-800 flex items-center gap-1">
                      <Mail size={12} className="text-stone-400" />
                      {colaborador.emailCorporativo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Telefone Corporativo</span>
                    <span className="font-medium text-stone-800 flex items-center gap-1">
                      <Phone size={12} className="text-stone-400" />
                      {colaborador.telefoneCorporativo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">E-mail Pessoal</span>
                    <span className="font-medium text-stone-800">{colaborador.emailPessoal || '—'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Telefone Pessoal</span>
                    <span className="font-medium text-stone-800">{colaborador.telefonePessoal || '—'}</span>
                  </div>
                </div>

                {colaborador.enderecoCidade && (
                  <div className="mt-3 text-xs text-stone-600 flex items-center gap-1">
                    <MapPin size={13} className="text-stone-400" />
                    <span>
                      {colaborador.enderecoLogradouro && `${colaborador.enderecoLogradouro}, `}
                      {colaborador.enderecoNumero && `nº ${colaborador.enderecoNumero}, `}
                      {colaborador.enderecoBairro && `${colaborador.enderecoBairro} — `}
                      {colaborador.enderecoCidade}/{colaborador.enderecoEstado}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h4 className="font-display font-semibold text-stone-800 text-sm mb-3 flex items-center gap-1.5">
                  <BrainCircuit size={16} className="text-primary-600" />
                  <span>Perfil Comportamental (DISC)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="text-xs text-stone-500 font-semibold mb-1">Traço Primário / Secundário</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-800 uppercase">
                        {colaborador.perfilDiscPrimario || 'Não avaliado'}
                      </span>
                      {colaborador.perfilDiscSecundario && (
                        <span className="text-xs text-stone-500">
                          + {colaborador.perfilDiscSecundario} (Secundário)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="text-xs text-stone-500 font-semibold mb-1">Observações Comportamentais</div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {colaborador.observacoesComportamentais || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Contrato & Organograma */}
          {activeTab === 'contrato' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-display font-semibold text-stone-800 text-sm mb-3">Contratação & Horários</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5">Regime</span>
                    <span className="font-semibold text-stone-800 uppercase">{colaborador.regime}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Modalidade</span>
                    <span className="font-medium text-stone-800 capitalize">{colaborador.modalidade}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Carga Horária / Escala</span>
                    <span className="font-medium text-stone-800">{colaborador.cargaHoraria || '44h semanais'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h4 className="font-display font-semibold text-stone-800 text-sm mb-3">Posição no Organograma</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase block mb-1">Liderança Direta</span>
                    {colaborador.gestor ? (
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} className="text-primary-600" />
                        <div>
                          <span className="text-xs font-semibold text-stone-800 block">{colaborador.gestor.nome}</span>
                          <span className="text-[11px] text-stone-500">{colaborador.gestor.emailCorporativo}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-500">Sem gestor direto (Liderança Executiva)</span>
                    )}
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase block mb-1">
                      Subordinados Diretos ({colaborador.subordinados.length})
                    </span>
                    {colaborador.subordinados.length === 0 ? (
                      <span className="text-xs text-stone-500">Nenhum colaborador sob sua gestão direta.</span>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {colaborador.subordinados.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/colaboradores/${sub.id}`}
                            className="text-xs text-primary-700 hover:underline block"
                          >
                            • {sub.nome} ({sub.cargoNome || 'Colaborador'})
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Histórico Salarial Imutável (RH-RN009) */}
          {activeTab === 'salarial' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-stone-800 text-sm">Histórico Salarial Oficial (RH-RN009)</h4>
                  <p className="text-xs text-stone-500">
                    Trilha de auditoria imutável de todas as alterações salariais, méritos e dissídios.
                  </p>
                </div>
                {colaborador.isActive && (
                  <button
                    type="button"
                    onClick={() => setModalSalarioOpen(true)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Lançar Reajuste</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-lg">
                <table className="table w-full text-xs">
                  <thead className="bg-stone-50 text-stone-600 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Vigência</th>
                      <th className="py-2.5 px-3 text-left">Salário CLT</th>
                      <th className="py-2.5 px-3 text-left">Compl.</th>
                      <th className="py-2.5 px-3 text-left">Motivo</th>
                      <th className="py-2.5 px-3 text-left">Registrado Por</th>
                      <th className="py-2.5 px-3 text-right">Data Lançamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {colaborador.historicoSalarial.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-stone-400">
                          Nenhum histórico salarial registrado.
                        </td>
                      </tr>
                    ) : (
                      colaborador.historicoSalarial.map((hs, idx) => (
                        <tr key={hs.id} className={idx === 0 ? 'bg-primary-50/20' : ''}>
                          <td className="py-2.5 px-3 font-semibold text-stone-800">
                            {hs.dataVigencia.split('-').reverse().join('/')}
                            {idx === 0 && (
                              <span className="ml-2 text-[9px] font-bold bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                                Atual
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">
                            R$ {hs.salarioClt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600">
                            {hs.remuneracaoComplementar
                              ? `R$ ${hs.remuneracaoComplementar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-stone-700">{hs.motivo}</td>
                          <td className="py-2.5 px-3 text-stone-500">{hs.registradoPorNome}</td>
                          <td className="py-2.5 px-3 text-right text-stone-400">
                            {hs.createdAt ? hs.createdAt.split('T')[0].split('-').reverse().join('/') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aba 4: Progressão de Cargos Imutável (RH-RN009) */}
          {activeTab === 'cargos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-stone-800 text-sm">Evolução Funcional & Cargos</h4>
                  <p className="text-xs text-stone-500">Histórico de promoções, transferências de departamento e progressões de carreira.</p>
                </div>
                {colaborador.isActive && (
                  <button
                    type="button"
                    onClick={() => setModalCargoOpen(true)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Lançar Progressão</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-lg">
                <table className="table w-full text-xs">
                  <thead className="bg-stone-50 text-stone-600 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Data</th>
                      <th className="py-2.5 px-3 text-left">Cargo Anterior</th>
                      <th className="py-2.5 px-3 text-left">Novo Cargo</th>
                      <th className="py-2.5 px-3 text-left">Justificativa</th>
                      <th className="py-2.5 px-3 text-left">Aprovado Por</th>
                      <th className="py-2.5 px-3 text-right">Registrado Em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {colaborador.historicoCargos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-stone-400">
                          Nenhum histórico de cargos registrado.
                        </td>
                      </tr>
                    ) : (
                      colaborador.historicoCargos.map((hc, idx) => (
                        <tr key={hc.id} className={idx === 0 ? 'bg-primary-50/20' : ''}>
                          <td className="py-2.5 px-3 font-semibold text-stone-800">
                            {hc.data.split('-').reverse().join('/')}
                            {idx === 0 && (
                              <span className="ml-2 text-[9px] font-bold bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                                Vigente
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500">{hc.cargoAnteriorNome}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{hc.cargoNovoNome}</td>
                          <td className="py-2.5 px-3 text-stone-700">{hc.justificativa || '—'}</td>
                          <td className="py-2.5 px-3 text-stone-500">{hc.aprovadoPorNome}</td>
                          <td className="py-2.5 px-3 text-right text-stone-400">
                            {hc.createdAt ? hc.createdAt.split('T')[0].split('-').reverse().join('/') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aba 5: Documentos */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-stone-800 text-sm">Documentos Funcionais</h4>
                  <p className="text-xs text-stone-500">Contratos, ASO, comprovantes e termos assinados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDocOpen(true)}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <FileUp size={14} />
                  <span>Anexar Documento</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-lg">
                <table className="table w-full text-xs">
                  <thead className="bg-stone-50 text-stone-600 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Tipo</th>
                      <th className="py-2.5 px-3 text-left">Link / Arquivo</th>
                      <th className="py-2.5 px-3 text-left">Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Data de Envio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {colaborador.documentos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-stone-400">
                          Nenhum documento anexado até o momento.
                        </td>
                      </tr>
                    ) : (
                      colaborador.documentos.map((doc) => (
                        <tr key={doc.id}>
                          <td className="py-2.5 px-3 font-semibold text-stone-800 capitalize">
                            {doc.tipo.replace('_', ' ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-700 hover:underline flex items-center gap-1"
                            >
                              <FileText size={12} />
                              <span>Visualizar documento</span>
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-stone-500">
                            {doc.dataVencimento ? doc.dataVencimento.split('-').reverse().join('/') : 'Não expira'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-stone-400">
                            {doc.createdAt ? doc.createdAt.split('T')[0].split('-').reverse().join('/') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aba 6: Rescisão & Saída */}
          {activeTab === 'rescisao' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <UserX size={18} className="text-red-700" />
                  <span>Dados do Desligamento Formal (RH-RN009)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <span className="text-stone-500 block mb-0.5">Data de Desligamento:</span>
                    <strong className="text-stone-900">
                      {colaborador.dataDesligamento ? colaborador.dataDesligamento.split('-').reverse().join('/') : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-0.5">Tipo de Rescisão:</span>
                    <strong className="text-stone-900 capitalize">
                      {colaborador.tipoDesligamento ? colaborador.tipoDesligamento.replace(/_/g, ' ') : '—'}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-stone-500 text-xs block mb-0.5">Motivo Registrado:</span>
                  <p className="text-xs text-stone-800 bg-white p-3 rounded border border-red-100 leading-relaxed">
                    {colaborador.motivoDesligamento || 'Não informado.'}
                  </p>
                </div>

                {colaborador.entrevistaSaida && (
                  <div>
                    <span className="text-stone-500 text-xs block mb-0.5">Síntese da Entrevista de Saída:</span>
                    <p className="text-xs text-stone-800 bg-white p-3 rounded border border-red-100 leading-relaxed">
                      {colaborador.entrevistaSaida}
                    </p>
                  </div>
                )}
              </div>

              {isDiretoria && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-800 text-xs block">Purga Definitiva (RH-RN011)</span>
                    <span className="text-[11px] text-stone-500">
                      Exceção exclusiva para Diretoria. Permite remover permanentemente o cadastro em caso de erro material.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalPurgaOpen(true)}
                    className="btn btn-danger btn-sm flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Expurgar Cadastro</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <NovoSalarioModal
        isOpen={modalSalarioOpen}
        onClose={() => setModalSalarioOpen(false)}
        colaboradorId={colaborador.id}
        salarioAtual={colaborador.salarioClt}
      />

      <NovoCargoModal
        isOpen={modalCargoOpen}
        onClose={() => setModalCargoOpen(false)}
        colaboradorId={colaborador.id}
        cargoAtualId={colaborador.cargo?.id}
        cargoAtualNome={colaborador.cargo?.nome}
        cargos={cargos}
      />

      <DesligarModal
        isOpen={modalDesligarOpen}
        onClose={() => setModalDesligarOpen(false)}
        colaboradorId={colaborador.id}
        colaboradorNome={colaborador.nome}
      />

      <PurgaModal
        isOpen={modalPurgaOpen}
        onClose={() => setModalPurgaOpen(false)}
        colaboradorId={colaborador.id}
        colaboradorNome={colaborador.nome}
        isActive={colaborador.isActive}
      />

      <NovoDocumentoModal
        isOpen={modalDocOpen}
        onClose={() => setModalDocOpen(false)}
        colaboradorId={colaborador.id}
      />
    </AppLayout>
  )
}
