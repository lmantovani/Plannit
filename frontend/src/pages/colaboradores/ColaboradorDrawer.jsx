import { useEffect, useState } from 'react'
import { colaboradoresApi } from '../../lib/api'
import { Tabs, Spinner } from '../../components/ui'
import { PerfilTab, ContratacaoTab, RemuneracaoTab, CargoProgressaoTab, DocumentosTab } from './ColaboradorTabs'

export default function ColaboradorDrawer({ colaboradorId, onClose, onUpdated }) {
  const [colaborador, setColaborador] = useState(null)
  const [tab, setTab] = useState('perfil')

  const carregar = () => {
    colaboradoresApi.get(colaboradorId).then(r => setColaborador(r.data)).catch(console.error)
  }

  useEffect(() => {
    let ignore = false
    colaboradoresApi.get(colaboradorId)
      .then(r => { if (!ignore) setColaborador(r.data) })
      .catch(err => { if (!ignore) console.error(err) })
    return () => { ignore = true }
  }, [colaboradorId])

  if (!colaborador) {
    return (
      <div className="fixed inset-y-0 right-0 w-[32rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex items-center justify-center animate-slide-in-right">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[32rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <p className="font-semibold text-stone-800">{colaborador.nome}</p>
          <p className="text-xs text-stone-400">{colaborador.cargo_nome} — {colaborador.departamento_nome}</p>
        </div>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>

      <div className="px-5 pt-4">
        <Tabs
          tabs={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'contratacao', label: 'Contratação' },
            { key: 'remuneracao', label: 'Remuneração' },
            { key: 'cargo', label: 'Cargo & Progressão' },
            { key: 'documentos', label: 'Documentos' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && (
          <PerfilTab
            colaborador={colaborador}
            onUpdated={() => { carregar(); onUpdated?.() }}
          />
        )}
        {tab === 'contratacao' && <ContratacaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'remuneracao' && <RemuneracaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'cargo' && <CargoProgressaoTab colaborador={colaborador} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'documentos' && <DocumentosTab colaborador={colaborador} />}
      </div>
    </div>
  )
}
