import { useState, useMemo } from 'react'
import { Head } from '@inertiajs/react'
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarCheck,
  CalendarRange,
} from 'lucide-react'
import { DateTime } from 'luxon'
import clsx from 'clsx'

import AppLayout from '../../layouts/app_layout'
import type { AgendaPageProps, Compromisso } from './types'
import AgendaFiltrosBar from './components/AgendaFiltrosBar'
import AgendaCalendarGrid from './components/AgendaCalendarGrid'
import AgendaListView from './components/AgendaListView'
import ModalNovoCompromisso from './components/ModalNovoCompromisso'
import ModalConcluirCompromisso from './components/ModalConcluirCompromisso'
import ModalReagendarCompromisso from './components/ModalReagendarCompromisso'
import ModalCancelarCompromisso from './components/ModalCancelarCompromisso'
import ModalEditarCompromisso from './components/ModalEditarCompromisso'

export default function AgendaIndexPage({
  compromissos = [],
  tipos = [],
  colaboradores = [],
  leads = [],
  podeVerEquipe = false,
  filtros,
}: AgendaPageProps) {
  // Controle do modo de visualização (Grade vs Lista) com persistência local
  const [modoVisualizacao, setModoVisualizacao] = useState<'grade' | 'lista'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('plannit_agenda_view') as 'grade' | 'lista') || 'grade'
    }
    return 'grade'
  })

  const handleChangeModo = (modo: 'grade' | 'lista') => {
    setModoVisualizacao(modo)
    if (typeof window !== 'undefined') {
      localStorage.setItem('plannit_agenda_view', modo)
    }
  }

  // Modais interativos
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [compromissoConcluir, setCompromissoConcluir] = useState<Compromisso | null>(null)
  const [compromissoReagendar, setCompromissoReagendar] = useState<Compromisso | null>(null)
  const [compromissoCancelar, setCompromissoCancelar] = useState<Compromisso | null>(null)
  const [compromissoEditar, setCompromissoEditar] = useState<Compromisso | null>(null)

  // Estatísticas e KPIs calculados
  const kpis = useMemo(() => {
    const agora = DateTime.now()
    let total = compromissos.length
    let hoje = 0
    let pendentes = 0
    let concluidos = 0
    let atrasados = 0

    compromissos.forEach((c) => {
      const inicio = DateTime.fromISO(c.dataHoraInicio)
      const fim = DateTime.fromISO(c.dataHoraFim)

      if (inicio.isValid && inicio.hasSame(agora, 'day')) {
        hoje++
      }

      if (c.status === 'concluido') {
        concluidos++
      } else if (c.status === 'cancelado') {
        // cancelados não contam como pendentes
      } else {
        pendentes++
        if (fim < agora || inicio < agora.minus({ hours: 1 })) {
          atrasados++
        }
      }
    })

    return { total, hoje, pendentes, concluidos, atrasados }
  }, [compromissos])

  return (
    <AppLayout title="Agenda" subtitle="Gestão operacional de visitas e reuniões">
      <Head title="Agenda de Compromissos" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-700" />
              </div>
              <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
                Agenda de Compromissos
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Gestão integrada de visitas técnicas, medições no local, reuniões comerciais e apresentações 3D
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="btn btn-primary text-xs flex items-center gap-2 shadow-sm px-4 py-2"
            >
              <Plus size={15} />
              <span>Novo Compromisso</span>
            </button>
          </div>
        </div>

        {/* Cards de Métricas / KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Total no Período</span>
              <CalendarRange size={14} className="text-stone-400" />
            </div>
            <div className="text-xl font-bold text-stone-900 mt-1 font-serif">
              {kpis.total}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Encontros listados</div>
          </div>

          {/* Hoje */}
          <div className="bg-white rounded-xl border border-blue-200/80 bg-blue-50/20 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-blue-800 text-xs font-medium">
              <span>Compromissos Hoje</span>
              <CalendarCheck size={14} className="text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-900 mt-1 font-serif">
              {kpis.hoje}
            </div>
            <div className="text-[10px] text-blue-600/80 mt-0.5">Programados para hoje</div>
          </div>

          {/* Agendados / Pendentes */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 text-xs">
              <span>Pendentes</span>
              <Clock size={14} className="text-amber-500" />
            </div>
            <div className="text-xl font-bold text-stone-900 mt-1 font-serif">
              {kpis.pendentes}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Aguardando realização</div>
          </div>

          {/* Concluídos */}
          <div className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
              <span>Concluídos</span>
              <CheckCircle2 size={14} className="text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-1 font-serif">
              {kpis.concluidos}
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Com desfecho registrado</div>
          </div>

          {/* Atrasados */}
          <div
            className={clsx(
              'rounded-xl border p-3.5 shadow-2xs',
              kpis.atrasados > 0
                ? 'bg-rose-50/50 border-rose-200'
                : 'bg-white border-stone-200 opacity-90'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-between text-xs',
                kpis.atrasados > 0 ? 'text-rose-800 font-medium' : 'text-stone-500'
              )}
            >
              <span>Atrasados</span>
              <AlertCircle
                size={14}
                className={kpis.atrasados > 0 ? 'text-rose-600' : 'text-stone-400'}
              />
            </div>
            <div
              className={clsx(
                'text-xl font-bold mt-1 font-serif',
                kpis.atrasados > 0 ? 'text-rose-900' : 'text-stone-900'
              )}
            >
              {kpis.atrasados}
            </div>
            <div
              className={clsx(
                'text-[10px] mt-0.5',
                kpis.atrasados > 0 ? 'text-rose-600' : 'text-stone-400'
              )}
            >
              Requerem atenção/desfecho
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Alternadores */}
        <AgendaFiltrosBar
          filtros={filtros}
          tipos={tipos}
          colaboradores={colaboradores}
          podeVerEquipe={podeVerEquipe}
          modoVisualizacao={modoVisualizacao}
          onChangeModoVisualizacao={handleChangeModo}
        />

        {/* Conteúdo Principal: Grade ou Lista */}
        {modoVisualizacao === 'grade' ? (
          <AgendaCalendarGrid
            compromissos={compromissos}
            onConcluir={(comp) => setCompromissoConcluir(comp)}
            onReagendar={(comp) => setCompromissoReagendar(comp)}
            onEditar={(comp) => setCompromissoEditar(comp)}
            onCancelar={(comp) => setCompromissoCancelar(comp)}
            onNovoCompromisso={() => setModalNovoAberto(true)}
          />
        ) : (
          <AgendaListView
            compromissos={compromissos}
            onConcluir={(comp) => setCompromissoConcluir(comp)}
            onReagendar={(comp) => setCompromissoReagendar(comp)}
            onEditar={(comp) => setCompromissoEditar(comp)}
            onCancelar={(comp) => setCompromissoCancelar(comp)}
            onNovoCompromisso={() => setModalNovoAberto(true)}
          />
        )}
      </div>

      {/* Modais */}
      <ModalNovoCompromisso
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        tipos={tipos}
        colaboradores={colaboradores}
        leads={leads}
        podeVerEquipe={podeVerEquipe}
      />

      <ModalConcluirCompromisso
        isOpen={Boolean(compromissoConcluir)}
        onClose={() => setCompromissoConcluir(null)}
        compromisso={compromissoConcluir}
      />

      <ModalReagendarCompromisso
        isOpen={Boolean(compromissoReagendar)}
        onClose={() => setCompromissoReagendar(null)}
        compromisso={compromissoReagendar}
      />

      <ModalCancelarCompromisso
        isOpen={Boolean(compromissoCancelar)}
        onClose={() => setCompromissoCancelar(null)}
        compromisso={compromissoCancelar}
      />

      <ModalEditarCompromisso
        isOpen={Boolean(compromissoEditar)}
        onClose={() => setCompromissoEditar(null)}
        compromisso={compromissoEditar}
        tipos={tipos}
        colaboradores={colaboradores}
        podeVerEquipe={podeVerEquipe}
      />
    </AppLayout>
  )
}
