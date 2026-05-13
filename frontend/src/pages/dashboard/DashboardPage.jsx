import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, TrendingUp, Users, FolderKanban,
  Clock, CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react'
import { dashboardApi } from '../../lib/api'
import { KpiCard, StatusBadge, LoadingPage, AlertBanner } from '../../components/ui'
import { formatDate, timeAgo, formatCurrency } from '../../lib/constants'
import { useAuthStore } from '../../store'
import clsx from 'clsx'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const fetchData = async () => {
    try {
      const [d, p] = await Promise.all([
        dashboardApi.gestor(),
        dashboardApi.projetosAtivos(),
      ])
      setData(d.data)
      setProjetos(p.data)
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Auto-refresh a cada 60s
  useEffect(() => {
    const t = setInterval(fetchData, 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <LoadingPage />

  const parados = projetos.filter(p => p.alerta_parado)

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6 animate-fade-in">

      {/* Alerta de projetos parados — RN016 */}
      {parados.length > 0 && (
        <AlertBanner
          type="warning"
          message={`${parados.length} projeto${parados.length > 1 ? 's' : ''} sem movimentação há mais de 5 dias úteis. Ação necessária.`}
        />
      )}

      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-stone-800 text-xl font-semibold">
            Bom dia, {user?.nome?.split(' ')[0]} 👋
          </h2>
          <p className="text-stone-400 text-sm mt-0.5">
            Visão geral da operação em tempo real
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-ghost btn-sm gap-1.5"
          title={lastUpdate ? `Atualizado ${timeAgo(lastUpdate)}` : ''}
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Projetos Ativos"
          value={data?.resumo?.projetos_ativos ?? '—'}
          icon={FolderKanban}
          color="blue"
          onClick={() => navigate('/projetos')}
        />
        <KpiCard
          label="Leads no Funil"
          value={data?.resumo?.leads_total ?? '—'}
          icon={Users}
          color="purple"
          onClick={() => navigate('/crm')}
        />
        <KpiCard
          label="Taxa de Conversão"
          value={`${data?.resumo?.taxa_conversao_pct ?? 0}%`}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          label="Parados > 5 dias"
          value={data?.resumo?.projetos_parados_alerta ?? 0}
          icon={AlertTriangle}
          color={data?.resumo?.projetos_parados_alerta > 0 ? 'red' : 'green'}
          onClick={() => {}}
        />
      </div>

      {/* Funil de leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 card p-4">
          <h3 className="font-medium text-stone-700 text-sm mb-4 flex items-center gap-2">
            <Users size={15} className="text-stone-400" />
            Funil de Leads
          </h3>
          <div className="space-y-2">
            {data?.funil_leads && Object.entries(data.funil_leads).map(([status, count]) => (
              <FunilBar key={status} status={status} count={count} total={data.resumo.leads_total} />
            ))}
          </div>
        </div>

        {/* Projetos por status */}
        <div className="lg:col-span-2 card p-4">
          <h3 className="font-medium text-stone-700 text-sm mb-4 flex items-center gap-2">
            <FolderKanban size={15} className="text-stone-400" />
            Distribuição por Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {data?.projetos_por_status && Object.entries(data.projetos_por_status).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-stone-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de projetos ativos */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h3 className="font-medium text-stone-700 text-sm">Projetos Ativos</h3>
          <button
            onClick={() => navigate('/projetos')}
            className="btn-ghost btn-sm gap-1"
          >
            Ver todos <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Cód.</th>
                <th>Status</th>
                <th>Vendedor</th>
                <th>Última mov.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projetos.slice(0, 15).map(p => (
                <tr key={p.id} className={clsx(p.alerta_parado && 'bg-amber-50/40')}>
                  <td className="font-medium text-stone-800">{p.cliente || '—'}</td>
                  <td className="text-stone-400 font-mono text-xs">{p.codigo}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-stone-500">{p.vendedor || '—'}</td>
                  <td className="text-stone-400 text-xs">
                    <div className="flex items-center gap-1">
                      {p.alerta_parado && <AlertTriangle size={12} className="text-amber-500" />}
                      {timeAgo(p.ultima_movimentacao)}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/projetos/${p.id}`)}
                      className="btn-ghost btn-sm px-2"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {projetos.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-stone-400 py-8">
                    Nenhum projeto ativo no momento
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FunilBar({ status, count, total }) {
  const labels = {
    novo_lead: 'Novo Lead', qualificando: 'Qualificando',
    em_visita: 'Em Visita', em_briefing: 'Em Briefing',
    fechado: 'Fechado', perdido: 'Perdido',
  }
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-500 w-24 truncate">{labels[status] || status}</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-stone-600 w-6 text-right">{count}</span>
    </div>
  )
}
