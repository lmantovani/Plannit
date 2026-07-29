import { useEffect, useState } from 'react'
import { Compass, TrendingUp, Target, MessageSquare, Building2, Settings } from 'lucide-react'
import { arquitetosApi } from '../../lib/api'
import { KpiCard, Spinner } from '../ui'
import { useAuthStore, podeVerTudo } from '../../store'
import MetasVisitasModal from '../../pages/especificadores/MetasVisitasModal'

export default function EspecificadoresKpiPanel() {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)

  const [kpis, setKpis] = useState(null)
  const [minhaMeta, setMinhaMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMetas, setShowMetas] = useState(false)

  useEffect(() => {
    let ignore = false

    async function fetchTudo() {
      try {
        const promessas = [arquitetosApi.kpis()]
        if (!gestor) promessas.push(arquitetosApi.minhaMetaVisitas())
        const [k, m] = await Promise.all(promessas)
        if (ignore) return
        setKpis(k.data)
        if (m) setMinhaMeta(m.data)
      } catch (e) {
        if (!ignore) console.error(e)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchTudo()
    return () => { ignore = true }
  }, [gestor])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={22} /></div>
  if (!kpis) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Carteira de Especificadores</h3>
        {gestor && (
          <button onClick={() => setShowMetas(true)} className="btn-ghost btn-sm gap-1.5">
            <Settings size={13} /> Configurar metas
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Especificadores Ativos" value={kpis.especificadores_ativos} icon={Compass} color="purple" />
        <KpiCard label="% Venda c/ Especificador (mês)" value={`${kpis.pct_venda_mes}%`} icon={TrendingUp} color="green" />
        <KpiCard label="% Venda c/ Especificador (ano)" value={`${kpis.pct_venda_ano}%`} icon={Target} color="blue" />
        <KpiCard label="Atendimentos no Mês" value={kpis.atendimentos_mes} icon={MessageSquare} color="amber" />
        <KpiCard label="Visitas ao Escritório" value={kpis.visitas_escritorio_mes} icon={Building2} color="primary" />
      </div>
      {!gestor && minhaMeta && (
        <p className="text-xs text-stone-500">
          Sua meta de visitas este mês: <strong>{minhaMeta.visitas_realizadas_mes} de {minhaMeta.meta_visitas_mes}</strong>
        </p>
      )}
      {gestor && (
        <MetasVisitasModal open={showMetas} onClose={() => setShowMetas(false)} />
      )}
    </div>
  )
}
