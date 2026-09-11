import React, { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import AppLayout from '~/layouts/app_layout'
import {
  Users,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  FolderGit2,
} from 'lucide-react'

import type { ClienteData, ClientesKpiData } from './types'
import NovoClienteModal from './components/NovoClienteModal'

interface ClientesIndexProps {
  clientes: {
    data: ClienteData[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  }
  kpis: ClientesKpiData
  arquitetos: Array<{ id: number; nome: string; escritorio: string | null }>
  filtros: {
    busca: string
    tipo: string
    status_aprovacao: string
    arquiteto_id: string
  }
}

export default function ClientesIndex({ clientes, kpis, arquitetos, filtros }: ClientesIndexProps) {
  const [busca, setBusca] = useState(filtros.busca || '')
  const [tipo, setTipo] = useState(filtros.tipo || '')
  const [statusAprovacao, setStatusAprovacao] = useState(filtros.status_aprovacao || '')
  const [arquitetoId, setArquitetoId] = useState(filtros.arquiteto_id || '')

  const [modalNovoAberto, setModalNovoAberto] = useState(false)

  const aplicarFiltros = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    router.get(
      '/clientes',
      {
        busca: busca || undefined,
        tipo: tipo || undefined,
        status_aprovacao: statusAprovacao || undefined,
        arquiteto_id: arquitetoId || undefined,
      },
      { preserveState: true }
    )
  }

  const limparFiltros = () => {
    setBusca('')
    setTipo('')
    setStatusAprovacao('')
    setArquitetoId('')
    router.get('/clientes')
  }

  return (
    <AppLayout title="Clientes" subtitle="Gestão cadastral, aprovação financeira e histórico de compras">
      <div className="space-y-6">
        {/* Topo de Ações & KPIs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-stone-900 tracking-tight">Carteira de Clientes</h1>
            <p className="text-sm text-stone-500">
              Controle de dados cadastrais, múltiplos endereços de entrega e aprovação financeira de crédito
            </p>
          </div>
          <button
            onClick={() => setModalNovoAberto(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>

        {/* Cards de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total de Clientes</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-0.5">{kpis.totalClientes}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Cadastros Aprovados</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">{kpis.aprovados}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Aprovação Pendente</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{kpis.pendentesAprovacao}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Pessoa Jurídica (PJ)</p>
              <h3 className="text-2xl font-bold text-primary-900 mt-0.5">{kpis.pessoaJuridica}</h3>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <form onSubmit={aplicarFiltros} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, email..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-primary-500 focus:bg-white text-stone-700"
              >
                <option value="">Todos os Tipos (PF / PJ)</option>
                <option value="pessoa_fisica">Pessoa Física (PF)</option>
                <option value="pessoa_juridica">Pessoa Jurídica (PJ)</option>
              </select>
            </div>

            <div>
              <select
                value={statusAprovacao}
                onChange={(e) => setStatusAprovacao(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-primary-500 focus:bg-white text-stone-700"
              >
                <option value="">Aprovação Financeira (Todos)</option>
                <option value="aprovado">Aprovado pelo Financeiro</option>
                <option value="pendente">Pendente de Aprovação</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Filtrar
              </button>
              {(busca || tipo || statusAprovacao || arquitetoId) && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Clientes */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-600 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Cliente / Contato</th>
                  <th className="py-3.5 px-4">Documento (CPF/CNPJ)</th>
                  <th className="py-3.5 px-4">Endereço Principal</th>
                  <th className="py-3.5 px-4">Parceria / Especificador</th>
                  <th className="py-3.5 px-4 text-center">Projetos</th>
                  <th className="py-3.5 px-4 text-center">Crédito Financeiro</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {clientes.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      Nenhum cliente encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  clientes.data.map((c) => {
                    const enderecoPrincipal = c.enderecos?.find((e) => e.isPrincipal) || c.enderecos?.[0]
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 font-semibold flex items-center justify-center text-xs">
                              {c.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/clientes/${c.id}`}
                                className="font-semibold text-stone-900 hover:text-primary-700 transition-colors"
                              >
                                {c.nome}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {c.telefone}
                                </span>
                                {c.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {c.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-stone-700">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                c.tipo === 'pessoa_juridica'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {c.tipo === 'pessoa_juridica' ? 'PJ' : 'PF'}
                            </span>
                            <span className="font-mono text-xs text-stone-600">{c.cpfCnpj || 'Não informado'}</span>
                          </div>
                          {c.profissaoRamo && <p className="text-xs text-stone-400 mt-0.5">{c.profissaoRamo}</p>}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-stone-600">
                          {enderecoPrincipal ? (
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                              <span>
                                {enderecoPrincipal.cidade}/{enderecoPrincipal.estado}
                                <span className="block text-stone-400 text-[11px]">
                                  {enderecoPrincipal.logradouro}, {enderecoPrincipal.numero}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Nenhum endereço</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-stone-700">
                          {c.arquiteto ? (
                            <div>
                              <span className="font-medium text-stone-900">{c.arquiteto.nome}</span>
                              {c.arquiteto.escritorio && (
                                <span className="block text-stone-400 text-[11px]">{c.arquiteto.escritorio}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400">Cliente direto</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md text-xs font-semibold">
                            <FolderGit2 className="w-3.5 h-3.5 text-stone-500" />
                            {c.totalProjetos ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {c.cadastroAprovado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/clientes/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800 hover:underline"
                          >
                            Ver Ficha <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Novo Cliente */}
        <NovoClienteModal
          isOpen={modalNovoAberto}
          onClose={() => setModalNovoAberto(false)}
          arquitetos={arquitetos}
        />
      </div>
    </AppLayout>
  )
}
