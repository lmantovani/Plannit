import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { arquitetosApi } from '../../lib/api'
import { Tabs, Spinner } from '../../components/ui'
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'

export default function EspecificadorDrawer({ arquitetoId, onClose, onUpdated }) {
  const navigate = useNavigate()
  const [arquiteto, setArquiteto] = useState(null)
  const [tab, setTab] = useState('perfil')
  const [showEdit, setShowEdit] = useState(false)

  const carregar = () => {
    arquitetosApi.get(arquitetoId).then(r => setArquiteto(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquitetoId])

  if (!arquiteto) {
    return (
      <div className="fixed inset-y-0 right-0 w-[28rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex items-center justify-center animate-slide-in-right">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[28rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <button
            className="font-semibold text-stone-800 hover:text-primary-600 transition-colors text-left"
            onClick={() => navigate(`/especificadores/${arquiteto.id}`)}
          >
            {arquiteto.nome}
          </button>
          <p className="text-xs text-stone-400">{arquiteto.telefone}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs
          tabs={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'score', label: 'Score' },
            { key: 'decisores', label: 'Decisores' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'score' && <ScoreTab />}
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
      </div>

      <EditarEspecificadorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        arquiteto={arquiteto}
        onSaved={() => { setShowEdit(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}
