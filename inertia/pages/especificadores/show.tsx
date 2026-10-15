import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  ArrowLeft,
  Compass,
  Edit2,
  UserCheck,
  Award,
  User,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  EspecificadoresShowProps,
  ConsultorOption,
} from './types'
import { STATUS_CARTEIRA_CONFIG } from '../../lib/constants'
import { ScoreTab } from './components/ScoreTab'
import { PerfilTab } from './components/PerfilTab'
import { DecisoresConcorrentesTab } from './components/DecisoresConcorrentesTab'
import { EditarEspecificadorModal } from './components/EditarEspecificadorModal'
import { ReatribuirDonoModal } from './components/ReatribuirDonoModal'

type TabKey = 'score' | 'perfil' | 'decisores'

export default function EspecificadorShow({
  arquiteto,
  score,
}: EspecificadoresShowProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('score')
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [modalReatribuirOpen, setModalReatribuirOpen] = useState(false)
  const [consultores, setConsultores] = useState<ConsultorOption[]>([])

  // Carrega consultores sob demanda para o modal de reatribuição se ainda não carregados
  const handleAbrirReatribuir = async () => {
    if (consultores.length === 0) {
      try {
        const resp = await fetch('/especificadores?format=json')
        if (resp.ok) {
          const data = await resp.json()
          setConsultores(data.consultores || [])
        }
      } catch (err) {
        console.error('Erro ao carregar consultores:', err)
      }
    }
    setModalReatribuirOpen(true)
  }

  const statusCfg = STATUS_CARTEIRA_CONFIG[arquiteto.statusCarteira] || {
    label: arquiteto.statusCarteira,
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
  }

  return (
    <AppLayout
      title={arquiteto.nome}
      subtitle={arquiteto.escritorio || 'Especificador Parceiro — Líder Móveis'}
    >
      <Head title={`${arquiteto.nome} — Especificadores — Plannit`} />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Barra Superior de Navegação e Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/especificadores"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para a Lista de Especificadores
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalEditarOpen(true)}
              className="btn btn-secondary btn-sm text-xs gap-1.5"
            >
              <Edit2 size={14} />
              Editar Cadastro
            </button>
            <button
              type="button"
              onClick={handleAbrirReatribuir}
              className="btn btn-primary btn-sm text-xs gap-1.5"
            >
              <UserCheck size={14} />
              Reatribuir Dono
            </button>
          </div>
        </div>

        {/* Hero Card do Especificador */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-display font-bold text-xl border border-primary-200 shadow-xs flex-shrink-0">
              {arquiteto.nome ? arquiteto.nome.charAt(0).toUpperCase() : <Compass size={28} />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold font-display text-stone-900">
                  {arquiteto.nome}
                </h1>
                <span
                  className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold border uppercase',
                    statusCfg.bg,
                    statusCfg.text,
                    statusCfg.border
                  )}
                >
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {arquiteto.escritorio || 'Escritório não informado'}
                {arquiteto.consultor && (
                  <span className="text-stone-400">
                    {' '}
                    · Consultor responsável:{' '}
                    <strong className="text-stone-700">{arquiteto.consultor.nome}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Mini Score Indicador */}
          {score && (
            <div className="flex items-center gap-4 bg-stone-50 border border-stone-200/70 rounded-xl p-3.5 flex-shrink-0">
              <div className="text-right">
                <span className="text-2xs uppercase tracking-wider text-stone-400 font-semibold block">
                  Score Geral
                </span>
                <span className="text-xs font-semibold text-primary-700">
                  Segmento: {score.segmento}
                </span>
              </div>
              <div className="text-3xl font-display font-bold text-stone-900 font-mono pl-3 border-l border-stone-200">
                {score.scoreGeral.toFixed(0)}
              </div>
            </div>
          )}
        </div>

        {/* Abas Superiores */}
        <div className="border-b border-stone-200 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('score')}
            className={clsx(
              'flex items-center gap-2 py-3 px-2 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'score'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            )}
          >
            <Award size={15} />
            Score & Análise de Relacionamento
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={clsx(
              'flex items-center gap-2 py-3 px-2 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'perfil'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            )}
          >
            <User size={15} />
            Perfil & Interações ({arquiteto.interacoes?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decisores')}
            className={clsx(
              'flex items-center gap-2 py-3 px-2 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'decisores'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            )}
          >
            <Users size={15} />
            Decisores & Concorrentes ({arquiteto.decisores?.length || 0})
          </button>
        </div>

        {/* Conteúdo da Aba Selecionada */}
        <div>
          {activeTab === 'score' && (
            <ScoreTab score={score} nomeEspecificador={arquiteto.nome} />
          )}

          {activeTab === 'perfil' && (
            <PerfilTab
              arquiteto={arquiteto}
              interacoes={arquiteto.interacoes || []}
              historicoDono={arquiteto.historicoDono || []}
              onEditar={() => setModalEditarOpen(true)}
              onReatribuir={handleAbrirReatribuir}
              onDesativado={() => {
                router.visit('/especificadores')
              }}
            />
          )}

          {activeTab === 'decisores' && (
            <DecisoresConcorrentesTab
              arquitetoId={arquiteto.id}
              decisores={arquiteto.decisores || []}
              concorrentes={arquiteto.concorrentes || []}
            />
          )}
        </div>
      </div>

      {/* Modais */}
      <EditarEspecificadorModal
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        arquiteto={arquiteto}
      />

      <ReatribuirDonoModal
        open={modalReatribuirOpen}
        onClose={() => setModalReatribuirOpen(false)}
        arquiteto={arquiteto}
        consultores={consultores}
      />
    </AppLayout>
  )
}
