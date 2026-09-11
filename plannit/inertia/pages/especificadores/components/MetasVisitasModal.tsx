import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { X, Target, Save, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { ConsultorOption, MetaConsultorItem } from '../types'

interface MetasVisitasModalProps {
  open: boolean
  onClose: () => void
  consultores: ConsultorOption[]
}

export const MetasVisitasModal: React.FC<MetasVisitasModalProps> = ({
  open,
  onClose,
  consultores,
}) => {
  const [selectedConsultorId, setSelectedConsultorId] = useState<number | ''>('')
  const [metaVisitasMes, setMetaVisitasMes] = useState<number>(8)
  const [salvando, setSalvando] = useState(false)
  const [metasExistentes, setMetasExistentes] = useState<MetaConsultorItem[]>([])
  const [carregandoMetas, setCarregandoMetas] = useState(false)

  useEffect(() => {
    if (open) {
      if (consultores.length > 0 && selectedConsultorId === '') {
        setSelectedConsultorId(consultores[0].id)
      }
      carregarMetas()
    }
  }, [open, consultores])

  const carregarMetas = async () => {
    setCarregandoMetas(true)
    try {
      const response = await fetch('/especificadores/metas-visitas', {
        headers: {
          Accept: 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMetasExistentes(data.metas || [])
      }
    } catch (err) {
      console.error('Erro ao carregar metas de visitas:', err)
    } finally {
      setCarregandoMetas(false)
    }
  }

  if (!open) return null

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConsultorId) {
      toast.error('Selecione um consultor')
      return
    }

    if (metaVisitasMes < 0 || metaVisitasMes > 1000) {
      toast.error('A meta deve ser entre 0 e 1000 visitas')
      return
    }

    setSalvando(true)
    router.put(
      '/especificadores/metas-visitas',
      {
        consultorId: Number(selectedConsultorId),
        metaVisitasMes: Number(metaVisitasMes),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Meta de visitas atualizada com sucesso!')
          setSalvando(false)
          carregarMetas()
        },
        onError: (errors) => {
          const msg = Object.values(errors)[0] || 'Erro ao salvar meta'
          toast.error(String(msg))
          setSalvando(false)
        },
      }
    )
  }

  const consultorSelecionadoInfo = metasExistentes.find(
    (m) => m.consultorId === Number(selectedConsultorId)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 font-display">
                Metas Mensais de Visitas
              </h3>
              <p className="text-xs text-stone-500">
                Configure os objetivos de visitas comerciais a escritórios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSalvar} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
              Consultor Comercial
            </label>
            <div className="relative">
              <Users
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <select
                value={selectedConsultorId}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setSelectedConsultorId(id)
                  const metaExistente = metasExistentes.find((m) => m.consultorId === id)
                  if (metaExistente) {
                    setMetaVisitasMes(metaExistente.metaVisitasMes)
                  }
                }}
                className="input pl-9 w-full text-sm"
                required
              >
                <option value="">Selecione um consultor...</option>
                {consultores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
              Meta de Visitas no Mês Atual
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="number"
                min="0"
                max="1000"
                value={metaVisitasMes}
                onChange={(e) => setMetaVisitasMes(Number(e.target.value))}
                className="input pl-9 w-full text-sm"
                placeholder="Ex: 8"
                required
              />
            </div>
            <p className="text-2xs text-stone-500 mt-1">
              Quantidade de visitas a escritórios esperadas para o consultor no mês corrente.
            </p>
          </div>

          {consultorSelecionadoInfo && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Target size={14} className="text-amber-700" />
                Desempenho no mês atual:
              </p>
              <p>
                Visitas realizadas até o momento:{' '}
                <strong>{consultorSelecionadoInfo.visitasRealizadasMes}</strong> de{' '}
                <strong>{consultorSelecionadoInfo.metaVisitasMes}</strong>
              </p>
              <p>
                Atingimento:{' '}
                <strong>{consultorSelecionadoInfo.percentualAtingido.toFixed(1)}%</strong>
              </p>
            </div>
          )}

          {/* Lista de Metas Vigentes */}
          <div className="border-t border-stone-100 pt-4">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2.5">
              Metas vigentes da equipe
            </h4>
            {carregandoMetas ? (
              <p className="text-xs text-stone-400">Carregando metas...</p>
            ) : metasExistentes.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Nenhuma meta configurada ainda.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {metasExistentes.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-xs"
                  >
                    <div>
                      <p className="font-medium text-stone-800">{m.consultor?.nome}</p>
                      <p className="text-2xs text-stone-500">
                        {m.visitasRealizadasMes} de {m.metaVisitasMes} visitas ({m.percentualAtingido.toFixed(0)}%)
                      </p>
                    </div>
                    <span className="font-mono font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 text-2xs">
                      Meta: {m.metaVisitasMes}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="btn btn-secondary btn-sm"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={salvando || !selectedConsultorId}
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Save size={14} />
              {salvando ? 'Salvando...' : 'Salvar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MetasVisitasModal
