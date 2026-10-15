import React, { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import AppLayout from '~/layouts/app_layout'
import {
  Building,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  FolderGit2,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

import type { ClienteData } from './types'
import NovoEnderecoModal from './components/NovoEnderecoModal'

interface ClienteShowProps {
  cliente: ClienteData
  arquitetos: Array<{ id: number; nome: string; escritorio: string | null }>
}

export default function ClienteShow({ cliente, arquitetos }: ClienteShowProps) {
  const { user } = usePage<any>().props
  const [modalEnderecoAberto, setModalEnderecoAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  // Form states de edição
  const [nome, setNome] = useState(cliente.nome)
  const [cpfCnpj, setCpfCnpj] = useState(cliente.cpfCnpj || '')
  const [telefone, setTelefone] = useState(cliente.telefone)
  const [email, setEmail] = useState(cliente.email || '')
  const [rgIe, setRgIe] = useState(cliente.rgIe || '')
  const [profissaoRamo, setProfissaoRamo] = useState(cliente.profissaoRamo || '')
  const [arquitetoId, setArquitetoId] = useState(cliente.arquitetoId ? String(cliente.arquitetoId) : '')
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '')

  const podeAprovar = ['diretoria', 'gerente_comercial', 'financeiro'].includes(user?.perfil)

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault()
    router.put(
      `/clientes/${cliente.id}`,
      {
        nome,
        cpfCnpj: cpfCnpj || undefined,
        telefone,
        email: email || undefined,
        rgIe: rgIe || undefined,
        profissaoRamo: profissaoRamo || undefined,
        arquitetoId: arquitetoId ? Number(arquitetoId) : null,
        observacoes: observacoes || undefined,
      },
      {
        onSuccess: () => setModoEdicao(false),
      }
    )
  }

  const handleAprovarCadastro = () => {
    if (confirm(`Deseja aprovar financeiramente o cadastro de ${cliente.nome}? Isso desbloqueia a geração de contratos.`)) {
      router.post(`/clientes/${cliente.id}/aprovar`)
    }
  }

  const handleRemoverEndereco = (enderecoId: number) => {
    if (confirm('Deseja realmente remover este endereço?')) {
      router.delete(`/clientes/${cliente.id}/enderecos/${enderecoId}`)
    }
  }

  return (
    <AppLayout title={cliente.nome} subtitle="Ficha Cadastral e Histórico de Compras">
      <div className="space-y-6">
        {/* Barra de Navegação & Ações de Topo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/clientes"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-semibold text-stone-900">{cliente.nome}</h1>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    cliente.tipo === 'pessoa_juridica'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {cliente.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Cliente desde {new Date(cliente.createdAt).toLocaleDateString('pt-BR')} • {cliente.profissaoRamo || 'Sem atividade informada'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!cliente.cadastroAprovado && podeAprovar && (
              <button
                onClick={handleAprovarCadastro}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Aprovar Cadastro Financeiro
              </button>
            )}

            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {modoEdicao ? 'Cancelar Edição' : 'Editar Dados'}
            </button>
          </div>
        </div>

        {/* Banner de Status de Aprovação Financeira */}
        {cliente.cadastroAprovado ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Cadastro Aprovado pelo Financeiro</p>
                <p className="text-xs text-emerald-700">
                  Liberado para geração de contratos, projetos executivos e faturamento
                  {cliente.aprovadoPor ? ` • Aprovado por ${cliente.aprovadoPor.nome}` : ''}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
              Crédito Autorizado
            </span>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Cadastro Pendente de Aprovação Financeira</p>
                <p className="text-xs text-amber-700">
                  Projetos e briefings podem ser desenvolvidos, mas a assinatura do contrato requer liberação cadastral
                </p>
              </div>
            </div>
            {podeAprovar && (
              <button
                onClick={handleAprovarCadastro}
                className="text-xs font-bold text-amber-900 hover:underline"
              >
                Aprovar agora →
              </button>
            )}
          </div>
        )}

        {/* Resumo Financeiro / Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">
              <FolderGit2 className="w-4 h-4 text-primary-600" />
              Total de Projetos Contratados
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mt-2">
              {cliente.resumoCompras?.totalProjetos ?? 0} projetos
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {cliente.resumoCompras?.projetosAtivos ?? 0} ativos no momento
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Volume Histórico de Compras
            </div>
            <h3 className="text-2xl font-bold text-emerald-700 mt-2">
              {(cliente.resumoCompras?.valorTotalComprado ?? 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </h3>
            <p className="text-xs text-stone-500 mt-1">Total faturado acumulado</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">
              <Building className="w-4 h-4 text-blue-600" />
              Especificador Responsável
            </div>
            <h3 className="text-lg font-bold text-stone-900 mt-2">
              {cliente.arquiteto?.nome || 'Cliente Direto'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {cliente.arquiteto?.escritorio ? `${cliente.arquiteto.escritorio}` : 'Sem escritório vinculado'}
            </p>
          </div>
        </div>

        {/* Ficha Cadastral (Leitura ou Edição) */}
        {modoEdicao ? (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-base font-semibold text-stone-900 mb-4">Editar Dados do Cliente</h3>
            <form onSubmit={handleSalvarEdicao} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">RG ou IE</label>
                <input
                  type="text"
                  value={rgIe}
                  onChange={(e) => setRgIe(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Profissão / Ramo</label>
                <input
                  type="text"
                  value={profissaoRamo}
                  onChange={(e) => setProfissaoRamo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Especificador Parceiro</label>
                <select
                  value={arquitetoId}
                  onChange={(e) => setArquitetoId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                >
                  <option value="">Nenhum especificador vinculado</option>
                  {arquitetos.map((arq) => (
                    <option key={arq.id} value={arq.id}>
                      {arq.nome} {arq.escritorio ? `(${arq.escritorio})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Observações Gerais</label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModoEdicao(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-base font-semibold text-stone-900 mb-4">Dados Cadastrais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="block text-xs text-stone-400 uppercase font-semibold">Documento de Identificação</span>
                <span className="font-mono text-stone-800 font-medium">{cliente.cpfCnpj || 'Não cadastrado'}</span>
                {cliente.rgIe && <span className="block text-xs text-stone-500 mt-0.5">RG/IE: {cliente.rgIe}</span>}
              </div>

              <div>
                <span className="block text-xs text-stone-400 uppercase font-semibold">Contato Principal</span>
                <span className="text-stone-800 font-medium flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> {cliente.telefone}
                </span>
                {cliente.email && (
                  <span className="text-xs text-stone-600 flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5 text-stone-400" /> {cliente.email}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-xs text-stone-400 uppercase font-semibold">Observações Comerciais</span>
                <p className="text-stone-600 text-xs mt-1 italic">
                  {cliente.observacoes || 'Nenhuma observação relevante registrada.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bloco de Múltiplos Endereços (Entrega / Montagem) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Locais de Entrega e Montagem</h3>
              <p className="text-xs text-stone-500">Múltiplos endereços para logística, montagem e faturamento</p>
            </div>
            <button
              onClick={() => setModalEnderecoAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Endereço
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cliente.enderecos && cliente.enderecos.length > 0 ? (
              cliente.enderecos.map((end) => (
                <div
                  key={end.id}
                  className={`p-4 rounded-xl border transition-all ${
                    end.isPrincipal
                      ? 'border-primary-300 bg-primary-50/20 shadow-xs'
                      : 'border-stone-200 bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-200/80 text-stone-700">
                        {end.tipo}
                      </span>
                      {end.isPrincipal && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800">
                          Principal
                        </span>
                      )}
                      {end.identificacao && (
                        <span className="text-xs font-semibold text-stone-800">{end.identificacao}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoverEndereco(end.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Excluir endereço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-stone-700 space-y-1">
                    <p className="font-medium text-stone-900">
                      {end.logradouro}, {end.numero} {end.complemento ? `— ${end.complemento}` : ''}
                    </p>
                    <p className="text-stone-500">
                      {end.bairro ? `${end.bairro}, ` : ''}
                      {end.cidade} - {end.estado} {end.cep ? `• CEP: ${end.cep}` : ''}
                    </p>
                    {end.pontoReferencia && (
                      <p className="text-[11px] text-stone-400 italic pt-1">Ref: {end.pontoReferencia}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                Nenhum endereço cadastrado para este cliente.
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Projetos e Compras */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Histórico de Projetos & Compras</h3>
              <p className="text-xs text-stone-500">Acompanhamento dos projetos realizados pela Líder Móveis</p>
            </div>
            <Link
              href="/crm"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              Iniciar Novo Projeto via CRM →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-600 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Status Atual</th>
                  <th className="py-3 px-3">Vendedor</th>
                  <th className="py-3 px-3">Projetista 3D</th>
                  <th className="py-3 px-3">Valor do Contrato</th>
                  <th className="py-3 px-3">Score Briefing</th>
                  <th className="py-3 px-3">Data Contratação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {cliente.projetos && cliente.projetos.length > 0 ? (
                  cliente.projetos.map((proj) => (
                    <tr key={proj.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">{proj.codigo}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-700">{proj.vendedorNome}</td>
                      <td className="py-3 px-3 text-stone-700">{proj.projetistaNome}</td>
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {proj.valorContrato > 0
                          ? proj.valorContrato.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'Em negociação'}
                      </td>
                      <td className="py-3 px-3">
                        {proj.scoreBriefing !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              proj.scoreBriefing >= 70
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {proj.scoreBriefing} pts
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-500">
                        {new Date(proj.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Nenhum projeto registrado para este cliente ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Novo Endereço */}
        <NovoEnderecoModal
          isOpen={modalEnderecoAberto}
          onClose={() => setModalEnderecoAberto(false)}
          clienteId={cliente.id}
        />
      </div>
    </AppLayout>
  )
}
