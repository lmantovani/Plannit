import React from 'react'
import { Head, usePage, Link } from '@inertiajs/react'
import AppLayout from '../layouts/app_layout'
import {
  TrendingUp,
  Users,
  FolderKanban,
  Clock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Layers,
  DollarSign,
} from 'lucide-react'

import clsx from 'clsx'

interface UserProps {
  id: number
  nome: string
  email: string
  telefone: string | null
  perfil: string
  perfilLabel: string
  isActive: boolean
  isSuperuser: boolean
  initials: string
}

interface ResumoDashboard {
  projetosAtivos: number
  projetosParadosAlerta: number
  leadsTotal: number
  taxaConversaoPct: number
  projetosNaFila: number
  valorEmCarteira: number
  totalClientes: number
  totalEspecificadores: number
  totalColaboradores: number
}

interface AlertaRn016 {
  id: number
  codigo: string
  clienteNome: string
  status: string
  vendedorNome: string
  projetistaNome: string
  diasParado: number
}

interface ProjetistaWip {
  id: number
  nome: string
  wipAtual: number
  wipLimit: number
  vagasDisponiveis: number
  porcentagemOcupacao: number
  pode: boolean
}

interface ProjetoRecente {
  id: number
  codigo: string
  clienteNome: string
  status: string
  vendedorNome: string
  projetistaNome: string
  valorContrato: number
  ultimaMovimentacao: string
  diasParado: number
  alertaParado: boolean
}

interface DashboardProps {
  resumo: ResumoDashboard
  alertasRn016: AlertaRn016[]
  statusMap: Record<string, number>
  funilLeads: Record<string, number>
  projetistasWip: ProjetistaWip[]
  projetosRecentes: ProjetoRecente[]
}

const STATUS_LABELS: Record<string, string> = {
  novo_lead: 'Novo Lead',
  qualificando: 'Qualificando',
  em_visita: 'Em Visita',
  em_briefing: 'Em Briefing',
  na_fila: 'Na Fila',
  em_projeto: 'Em Projeto (3D)',
  aguard_validacao: 'Aguardando Validação',
  em_render: 'Em Render',
  aguard_apresentacao: 'Aguardando Apresentação',
  em_fechamento: 'Em Fechamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function Dashboard({
  resumo,
  alertasRn016 = [],
  funilLeads = {},
  projetistasWip = [],
  projetosRecentes = [],
}: DashboardProps) {

  const { user } = usePage<{ user: UserProps }>().props

  return (
    <AppLayout
      title="Painel Executivo"
      subtitle="Visão consolidada da operação, funil comercial e alertas de estagnação"
    >
      <Head title="Dashboard — Líder Móveis Planejados" />

      <div className="space-y-6 animate-fade-in max-w-7xl w-full mx-auto">
        {/* Banner de Boas-Vindas */}
        <div className="card p-6 sm:p-7 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white border-0 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-medium mb-3 border border-primary-500/30">
                <Sparkles size={13} />
                <span>Gestão Integrada Líder Móveis • Fases 1 a 7 Concluídas</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                Olá, {user?.nome?.split(' ')[0]} 👋
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                Operando com perfil <strong className="text-primary-300 font-semibold">{user?.perfilLabel}</strong>.
                Acompanhe abaixo os indicadores em tempo real e o controle de capacidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/crm"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Pipeline CRM</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/fila"
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/80 rounded-xl text-xs font-semibold transition-all"
              >
                <span>Fila & WIP</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ALERTA CRÍTICO RN016 — PROJETOS PARADOS HÁ MAIS DE 5 DIAS */}
        {alertasRn016 && alertasRn016.length > 0 && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm animate-slide-in-right">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
                      Alerta de Estagnação Operacional (RN016)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/80 text-rose-900">
                      {alertasRn016.length} {alertasRn016.length === 1 ? 'projeto estagnado' : 'projetos estagnados'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    Os projetos listados abaixo estão há mais de <strong>5 dias sem avanço de etapa</strong>. Exigem contato imediato da equipe com clientes ou projetistas.
                  </p>
                </div>
              </div>

              <Link
                href="/fila"
                className="text-xs font-bold text-rose-900 hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Ver na Fila <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-3 border-t border-rose-200/60">
              {alertasRn016.map((alerta) => (
                <div
                  key={alerta.id}
                  className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-stone-900">{alerta.codigo}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                        {STATUS_LABELS[alerta.status] || alerta.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-800 truncate mt-0.5">{alerta.clienteNome}</p>
                    <p className="text-[11px] text-stone-400">
                      Resp: {alerta.vendedorNome} • 3D: {alerta.projetistaNome}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                      +{alerta.diasParado} dias
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CARDS DE KPIs EXECUTIVOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Projetos Ativos</span>
              <FolderKanban className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900">{resumo?.projetosAtivos ?? 0}</h3>
            <p className="text-xs text-stone-500 mt-1">Em desenvolvimento comercial/técnico</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Leads no Funil</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900">{resumo?.leadsTotal ?? 0}</h3>
            <p className="text-xs text-stone-500 mt-1">Oportunidades em qualificação</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Conversão de Vendas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700">{resumo?.taxaConversaoPct ?? 0}%</h3>
            <p className="text-xs text-stone-500 mt-1">Taxa Lead → Fechamento</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Valor em Carteira</span>
              <DollarSign className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-primary-800 truncate">
              {(resumo?.valorEmCarteira ?? 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })}
            </h3>
            <p className="text-xs text-stone-500 mt-1">Contratos em andamento</p>
          </div>
        </div>

        {/* SEÇÃO ANALÍTICA: FUNIL COMERCIAL + CAPACIDADE WIP DA EQUIPE 3D */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funil de Leads */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-600" />
                  Funil de Conversão Comercial
                </h3>
                <Link href="/crm" className="text-xs text-primary-700 hover:underline">
                  Abrir CRM →
                </Link>
              </div>

              <div className="space-y-3">
                {Object.keys(funilLeads).length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">Nenhum lead registrado no funil.</p>
                ) : (
                  Object.entries(funilLeads).map(([st, count]) => {
                    const total = resumo?.leadsTotal || 1
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-600 font-medium">{STATUS_LABELS[st] || st}</span>
                          <span className="text-stone-900 font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Projetos aguardando alocação na fila:</span>
              <strong className="text-stone-800 font-semibold">{resumo?.projetosNaFila ?? 0}</strong>
            </div>
          </div>

          {/* Capacidade Operacional WIP (RN003) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary-600" />
                    Monitor de Ocupação dos Projetistas (WIP — RN003)
                  </h3>
                  <p className="text-xs text-stone-500">Capacidade máxima simultânea por profissional de 3D</p>
                </div>
                <Link href="/fila" className="text-xs text-primary-700 hover:underline">
                  Gerenciar Fila →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {projetistasWip.map((proj) => {
                  const lotado = !proj.pode
                  return (
                    <div
                      key={proj.id}
                      className={clsx(
                        'p-4 rounded-xl border transition-all',
                        lotado
                          ? 'border-rose-300 bg-rose-50/30'
                          : proj.porcentagemOcupacao >= 60
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-stone-200 bg-stone-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-stone-900 truncate">{proj.nome}</span>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded',
                            lotado ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          )}
                        >
                          {lotado ? 'Lotado' : `${proj.vagasDisponiveis} vaga(s)`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-stone-500 text-[11px]">Projetos ativos:</span>
                        <span className="font-bold text-stone-800">
                          {proj.wipAtual} / {proj.wipLimit} ({proj.porcentagemOcupacao}%)
                        </span>
                      </div>

                      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            lotado ? 'bg-rose-600' : proj.porcentagemOcupacao >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, proj.porcentagemOcupacao)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumo de Cadastros Satélites */}
            <div className="pt-4 mt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="block text-stone-400 text-[11px] uppercase font-semibold">Clientes</span>
                <Link href="/clientes" className="font-bold text-stone-800 hover:text-primary-700">
                  {resumo?.totalClientes ?? 0} ativos
                </Link>
              </div>
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="block text-stone-400 text-[11px] uppercase font-semibold">Especificadores</span>
                <Link href="/especificadores" className="font-bold text-stone-800 hover:text-primary-700">
                  {resumo?.totalEspecificadores ?? 0} escritórios
                </Link>
              </div>
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="block text-stone-400 text-[11px] uppercase font-semibold">Equipe / RH</span>
                <Link href="/colaboradores" className="font-bold text-stone-800 hover:text-primary-700">
                  {resumo?.totalColaboradores ?? 0} colaboradores
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA DE PROJETOS ATIVOS COM MONITOR DE ESTAGNAÇÃO (RN016) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50/50">
            <div>
              <h3 className="font-semibold text-sm text-stone-900">Projetos em Andamento</h3>
              <p className="text-xs text-stone-500">Acompanhamento contínuo da esteira produtiva</p>
            </div>
            <Link
              href="/fila"
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
            >
              Ver Kanban da Fila <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Código / Cliente</th>
                  <th className="py-3 px-4">Status da Etapa</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Projetista 3D</th>
                  <th className="py-3 px-4">Valor Contrato</th>
                  <th className="py-3 px-4">Tempo na Fase (RN016)</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {projetosRecentes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Nenhum projeto ativo no momento.
                    </td>
                  </tr>
                ) : (
                  projetosRecentes.map((p) => (
                    <tr
                      key={p.id}
                      className={clsx(
                        'hover:bg-stone-50/80 transition-colors',
                        p.alertaParado && 'bg-rose-50/30 font-medium'
                      )}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900">{p.codigo}</span>
                        <span className="block text-stone-600 mt-0.5">{p.clienteNome}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-stone-700">{p.vendedorNome}</td>
                      <td className="py-3 px-4 text-stone-700">{p.projetistaNome}</td>

                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {p.valorContrato > 0
                          ? p.valorContrato.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'Em negociação'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {p.alertaParado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {p.diasParado} dias parado (RN016)
                            </span>
                          ) : (
                            <span className="text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {p.diasParado === 0 ? 'Hoje' : `${p.diasParado} dia(s)`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/fila"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                        >
                          Detalhes →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

Dashboard.layout = (page: React.ReactNode) => page
