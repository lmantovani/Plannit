import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import {
  List,
  Search,
  Users,
  User,
  X,
  LayoutGrid,
} from 'lucide-react'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import type { AgendaFiltros, TipoCompromisso, Colaborador } from '../types'

interface AgendaFiltrosBarProps {
  filtros: AgendaFiltros
  tipos: TipoCompromisso[]
  colaboradores: Colaborador[]
  podeVerEquipe: boolean
  modoVisualizacao: 'grade' | 'lista'
  onChangeModoVisualizacao: (modo: 'grade' | 'lista') => void
}

export default function AgendaFiltrosBar({
  filtros,
  tipos = [],
  colaboradores = [],
  podeVerEquipe = false,
  modoVisualizacao,
  onChangeModoVisualizacao,
}: AgendaFiltrosBarProps) {
  const [busca, setBusca] = useState(filtros.q || '')

  useEffect(() => {
    setBusca(filtros.q || '')
  }, [filtros.q])

  // Aplica novos filtros mantendo a rota e atualizando query params
  const aplicarFiltros = (novosParametros: Partial<AgendaFiltros & { periodo?: string }>) => {
    const paramsAtuais: Record<string, any> = {
      visao: filtros.visao || (podeVerEquipe ? 'equipe' : 'minha'),
      responsavelId: filtros.responsavelId || undefined,
      status: filtros.status || undefined,
      tipoId: filtros.tipoId || undefined,
      dataInicio: filtros.dataInicio || undefined,
      dataFim: filtros.dataFim || undefined,
      periodo: filtros.periodo || undefined,
      q: filtros.q || undefined,
    }

    const paramsFinais: Record<string, any> = {
      ...paramsAtuais,
      ...novosParametros,
    }

    // Remove valores vazios ou nulos
    Object.keys(paramsFinais).forEach((key) => {
      if (
        paramsFinais[key] === undefined ||
        paramsFinais[key] === null ||
        paramsFinais[key] === ''
      ) {
        delete paramsFinais[key]
      }
    })

    router.get('/agenda', paramsFinais, {
      preserveState: true,
      replace: true,
    })
  }

  // Mudança do alternador de Visão (Minha Agenda vs Toda a Equipe)
  const handleAlternarVisao = (novaVisao: 'minha' | 'equipe') => {
    aplicarFiltros({
      visao: novaVisao,
      // Se mudar para minha agenda, limpa o filtro específico de colaborador
      responsavelId: novaVisao === 'minha' ? null : filtros.responsavelId,
    })
  }

  // Filtro de período rápido
  const handleSelecionarPeriodo = (periodo: 'hoje' | 'semana' | 'mes' | 'todos') => {
    if (periodo === 'todos') {
      aplicarFiltros({
        periodo: undefined,
        dataInicio: undefined,
        dataFim: undefined,
      })
      return
    }

    const agora = DateTime.now()
    let dataInicio: string | undefined
    let dataFim: string | undefined

    if (periodo === 'hoje') {
      dataInicio = agora.startOf('day').toUTC().toISO()!
      dataFim = agora.endOf('day').toUTC().toISO()!
    } else if (periodo === 'semana') {
      dataInicio = agora.startOf('week').toUTC().toISO()!
      dataFim = agora.endOf('week').toUTC().toISO()!
    } else if (periodo === 'mes') {
      dataInicio = agora.startOf('month').toUTC().toISO()!
      dataFim = agora.endOf('month').toUTC().toISO()!
    }

    aplicarFiltros({
      periodo,
      dataInicio,
      dataFim,
    })
  }

  const handleLimparBusca = () => {
    setBusca('')
    aplicarFiltros({ q: undefined })
  }

  const handleSubmeterBusca = (e: React.FormEvent) => {
    e.preventDefault()
    aplicarFiltros({ q: busca.trim() || undefined })
  }

  const periodoAtivo = filtros.periodo || (filtros.dataInicio ? undefined : 'todos')
  const temFiltrosAtivos =
    Boolean(filtros.status) ||
    Boolean(filtros.tipoId) ||
    Boolean(filtros.responsavelId) ||
    Boolean(filtros.dataInicio) ||
    Boolean(filtros.q)

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
      {/* Linha Superior: Alternador RBAC e Modos de Visualização */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Alternador RBAC (Minha Agenda vs Toda a Equipe) - Apenas para Gestores */}
        {podeVerEquipe ? (
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80 shrink-0">
            <button
              type="button"
              onClick={() => handleAlternarVisao('minha')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filtros.visao === 'minha'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              <User size={13} className="text-stone-500" />
              <span>Minha Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => handleAlternarVisao('equipe')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filtros.visao === 'equipe'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              <Users size={13} className="text-primary-600" />
              <span>Toda a Equipe</span>
            </button>
          </div>
        ) : (
          <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
            <User size={13} className="text-stone-400" />
            <span>Exibindo compromissos atribuídos a você</span>
          </div>
        )}

        {/* Alternador de Período Rápido */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'hoje', label: 'Hoje' },
            { id: 'semana', label: 'Esta Semana' },
            { id: 'mes', label: 'Este Mês' },
          ].map((p) => {
            const isSelected =
              periodoAtivo === p.id ||
              (p.id === 'todos' && !filtros.periodo && !filtros.dataInicio)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelecionarPeriodo(p.id as any)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  isSelected
                    ? 'bg-primary-50 text-primary-800 border border-primary-200 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Alternador de Modo de Visualização (Grade vs Lista) */}
        <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeModoVisualizacao('grade')}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              modoVisualizacao === 'grade'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            )}
            title="Visualização em Grade / Calendário agrupado por dia"
          >
            <LayoutGrid size={14} />
            <span className="hidden md:inline">Grade</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeModoVisualizacao('lista')}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              modoVisualizacao === 'lista'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            )}
            title="Visualização em Lista / Tabela cronológica"
          >
            <List size={14} />
            <span className="hidden md:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Linha Inferior: Dropdowns de Filtro e Busca Textual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
        {/* Filtro por Colaborador (apenas na visão equipe para gestores) */}
        {podeVerEquipe && filtros.visao === 'equipe' ? (
          <div>
            <select
              value={filtros.responsavelId || ''}
              onChange={(e) =>
                aplicarFiltros({
                  responsavelId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="input w-full text-xs"
            >
              <option value="">Todos os Colaboradores</option>
              {colaboradores.map((colab) => (
                <option key={colab.id} value={colab.id}>
                  {colab.nome} ({colab.perfil})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <select
              value={filtros.status || ''}
              onChange={(e) =>
                aplicarFiltros({
                  status: e.target.value || undefined,
                })
              }
              className="input w-full text-xs"
            >
              <option value="">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="concluido">Concluído</option>
              <option value="reagendado">Reagendado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

        {/* Filtro por Status (se já exibiu colaborador, este ocupa a segunda coluna) */}
        {podeVerEquipe && filtros.visao === 'equipe' && (
          <div>
            <select
              value={filtros.status || ''}
              onChange={(e) =>
                aplicarFiltros({
                  status: e.target.value || undefined,
                })
              }
              className="input w-full text-xs"
            >
              <option value="">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="concluido">Concluído</option>
              <option value="reagendado">Reagendado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

        {/* Filtro por Tipo de Compromisso */}
        <div>
          <select
            value={filtros.tipoId || ''}
            onChange={(e) =>
              aplicarFiltros({
                tipoId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="input w-full text-xs"
          >
            <option value="">Todos os Tipos de Compromisso</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Busca por Texto */}
        <form onSubmit={handleSubmeterBusca} className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, local ou notas..."
            className="input w-full text-xs pl-8 pr-7"
          />
          {busca && (
            <button
              type="button"
              onClick={handleLimparBusca}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700"
              title="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </form>

        {/* Botão Limpar Filtros caso haja filtros aplicados */}
        {temFiltrosAtivos && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                router.get(
                  '/agenda',
                  { visao: filtros.visao || (podeVerEquipe ? 'equipe' : 'minha') },
                  { preserveState: true }
                )
              }
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
            >
              <X size={12} />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
