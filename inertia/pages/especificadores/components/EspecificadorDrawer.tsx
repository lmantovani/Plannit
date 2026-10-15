import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import {
  X,
  ExternalLink,
  User,
  Award,
  Users,
  Compass,
  Edit2,
  UserCheck,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  EspecificadorListItem,
  EspecificadorDetalhado,
  ArquitetoScore,
  ConsultorOption,
} from '../types'
import { PerfilTab } from './PerfilTab'
import { ScoreTab } from './ScoreTab'
import { DecisoresConcorrentesTab } from './DecisoresConcorrentesTab'
import { STATUS_CARTEIRA_CONFIG } from '../../../lib/constants'

interface EspecificadorDrawerProps {
  open: boolean
  onClose: () => void
  arquitetoId: number | null
  initialData?: EspecificadorListItem | null
  consultores: ConsultorOption[]
  onEditar?: (arquiteto: EspecificadorListItem) => void
  onReatribuir?: (arquiteto: EspecificadorListItem) => void
}

type TabKey = 'perfil' | 'score' | 'decisores'

export const EspecificadorDrawer: React.FC<EspecificadorDrawerProps> = ({
  open,
  onClose,
  arquitetoId,
  initialData,
  consultores,
  onEditar,
  onReatribuir,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('score')
  const [arquitetoDetalhado, setArquitetoDetalhado] = useState<EspecificadorDetalhado | null>(null)
  const [score, setScore] = useState<ArquitetoScore | null>(initialData?.score || null)
  const [loading, setLoading] = useState(false)

  // Ao abrir ou mudar de ID, carrega dados completos em JSON
  useEffect(() => {
    if (open && arquitetoId) {
      carregarDetalhes(arquitetoId)
    } else {
      setArquitetoDetalhado(null)
      setScore(null)
      setActiveTab('score')
    }
  }, [open, arquitetoId])

  const carregarDetalhes = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/especificadores/${id}`, {
        headers: {
          Accept: 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setArquitetoDetalhado(data.arquiteto)
        setScore(data.score)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do especificador:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const dadosAtuais = arquitetoDetalhado || initialData

  const handleAbrirPaginaDedicada = () => {
    if (arquitetoId) {
      router.visit(`/especificadores/${arquitetoId}`)
    }
  }

  const statusCfg = dadosAtuais
    ? STATUS_CARTEIRA_CONFIG[dadosAtuais.statusCarteira] || {
        label: dadosAtuais.statusCarteira,
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
      }
    : null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-stone-100 shadow-2xl flex flex-col border-l border-stone-200 animate-slide-up sm:animate-none">
          {/* Header Superior do Drawer */}
          <div className="bg-white px-6 py-4 border-b border-stone-200 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-display font-bold text-base flex-shrink-0 border border-primary-200">
                  {dadosAtuais?.nome ? dadosAtuais.nome.charAt(0).toUpperCase() : <Compass size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-stone-900 truncate font-display">
                      {dadosAtuais?.nome || 'Carregando parceiro...'}
                    </h3>
                    {statusCfg && (
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded text-3xs font-semibold border uppercase',
                          statusCfg.bg,
                          statusCfg.text,
                          statusCfg.border
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 truncate">
                    {dadosAtuais?.escritorio || 'Escritório não cadastrado'}
                    {dadosAtuais?.consultor && (
                      <span className="text-stone-400"> · Dono: {dadosAtuais.consultor.nome}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Controles do Cabeçalho */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {dadosAtuais && onEditar && (
                  <button
                    type="button"
                    onClick={() => onEditar(dadosAtuais)}
                    title="Editar dados"
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {dadosAtuais && onReatribuir && (
                  <button
                    type="button"
                    onClick={() => onReatribuir(dadosAtuais)}
                    title="Reatribuir dono de carteira"
                    className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <UserCheck size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAbrirPaginaDedicada}
                  title="Abrir página dedicada em tela cheia"
                  className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Fechar painel"
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-2 mt-4 border-b border-stone-200 -mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('score')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
                  activeTab === 'score'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                )}
              >
                <Award size={14} />
                Score & Analítico
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('perfil')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
                  activeTab === 'perfil'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                )}
              >
                <User size={14} />
                Perfil & Contatos ({arquitetoDetalhado?.interacoes?.length ?? 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('decisores')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
                  activeTab === 'decisores'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                )}
              >
                <Users size={14} />
                Decisores & Concorrentes
              </button>
            </div>
          </div>

          {/* Conteúdo da Aba com Scroll Vertical */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && !dadosAtuais ? (
              <div className="flex items-center justify-center py-20 text-stone-400 text-xs">
                Carregando dados do parceiro...
              </div>
            ) : dadosAtuais ? (
              <>
                {activeTab === 'score' && (
                  <ScoreTab score={score} nomeEspecificador={dadosAtuais.nome} />
                )}

                {activeTab === 'perfil' && (
                  <PerfilTab
                    arquiteto={dadosAtuais}
                    interacoes={arquitetoDetalhado?.interacoes || []}
                    historicoDono={arquitetoDetalhado?.historicoDono || []}
                    consultores={consultores}
                    onEditar={onEditar ? () => onEditar(dadosAtuais) : undefined}
                    onReatribuir={onReatribuir ? () => onReatribuir(dadosAtuais) : undefined}
                    onDesativado={() => {
                      onClose()
                      router.reload()
                    }}
                  />
                )}

                {activeTab === 'decisores' && (
                  <DecisoresConcorrentesTab
                    arquitetoId={dadosAtuais.id}
                    decisores={arquitetoDetalhado?.decisores || []}
                    concorrentes={arquitetoDetalhado?.concorrentes || []}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EspecificadorDrawer
