import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { arquitetosApi } from '../../lib/api'
import { Tabs, LoadingPage } from '../../components/ui'
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'

export default function EspecificadorDetalhePage() {
  const { id } = useParams()
  const [arquiteto, setArquiteto] = useState(null)
  const [tab, setTab] = useState('perfil')
  const [showEdit, setShowEdit] = useState(false)

  const carregar = () => {
    arquitetosApi.get(id).then(r => setArquiteto(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [id])

  if (!arquiteto) return <LoadingPage />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-stone-800">{arquiteto.nome}</h1>
          <p className="text-sm text-stone-400">{arquiteto.telefone}</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      <Tabs
        tabs={[
          { key: 'perfil', label: 'Perfil' },
          { key: 'score', label: 'Score' },
          { key: 'decisores', label: 'Decisores' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-5 card p-5">
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={carregar} />}
        {tab === 'score' && <ScoreTab arquiteto={arquiteto} />}
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
      </div>

      <EditarEspecificadorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        arquiteto={arquiteto}
        onSaved={() => { setShowEdit(false); carregar() }}
      />
    </div>
  )
}
