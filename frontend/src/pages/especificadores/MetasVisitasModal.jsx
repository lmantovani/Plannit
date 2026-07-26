import { useEffect, useState } from 'react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, Spinner, AlertBanner } from '../../components/ui'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

export default function MetasVisitasModal({ open, onClose }) {
  const [vendedores, setVendedores] = useState([])
  const [metas, setMetas] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [salvandoId, setSalvandoId] = useState(null)

  const fetchTudo = async () => {
    setLoading(true)
    setError('')
    try {
      const [u, m] = await Promise.all([usersApi.list(), arquitetosApi.listarMetasVisitas()])
      setVendedores(u.data.filter(x => x.perfil === 'vendedor'))
      setMetas(Object.fromEntries(m.data.map(x => [x.consultor_id, x.meta_visitas_mes])))
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar vendedores e metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) fetchTudo() }, [open])

  const salvar = async (consultorId, valor) => {
    setSalvandoId(consultorId)
    setError('')
    try {
      await arquitetosApi.definirMetaVisitas({ consultor_id: consultorId, meta_visitas_mes: Number(valor) })
      setMetas(m => ({ ...m, [consultorId]: Number(valor) }))
    } catch (e) {
      setError(extractErrorMessage(e, 'Erro ao salvar meta'))
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Metas de visitas mensais" size="md">
      {error && <div className="mb-3"><AlertBanner type="error" message={error} onDismiss={() => setError('')} /></div>}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={22} /></div>
      ) : vendedores.length === 0 ? (
        <p className="text-sm text-stone-400">Nenhum vendedor cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {vendedores.map(v => (
            <li key={v.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-stone-700">{v.nome}</span>
              <input
                type="number"
                min="0"
                className="input w-24 text-sm py-1"
                defaultValue={metas[v.id] ?? 0}
                onBlur={e => salvar(v.id, e.target.value)}
                disabled={salvandoId === v.id}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
