import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  Users,
  Star,
  Plus,
  Trash2,
  Mail,
  Phone,
  Shield,
  Save,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import type { DecisorItem, ConcorrenteItem } from '../types'

interface DecisoresConcorrentesTabProps {
  arquitetoId: number
  decisores?: DecisorItem[]
  concorrentes?: ConcorrenteItem[]
}

export const DecisoresConcorrentesTab: React.FC<DecisoresConcorrentesTabProps> = ({
  arquitetoId,
  decisores = [],
  concorrentes = [],
}) => {
  // Estado para criação de Decisor
  const [showNovoDecisor, setShowNovoDecisor] = useState(false)
  const [nomeDecisor, setNomeDecisor] = useState('')
  const [cargoDecisor, setCargoDecisor] = useState('')
  const [telefoneDecisor, setTelefoneDecisor] = useState('')
  const [emailDecisor, setEmailDecisor] = useState('')
  const [obsDecisor, setObsDecisor] = useState('')
  const [isPrincipal, setIsPrincipal] = useState(false)
  const [salvandoDecisor, setSalvandoDecisor] = useState(false)

  // Estado para criação de Concorrente
  const [showNovoConcorrente, setShowNovoConcorrente] = useState(false)
  const [nomeConcorrente, setNomeConcorrente] = useState('')
  const [pctFechamento, setPctFechamento] = useState<number>(30)
  const [obsConcorrente, setObsConcorrente] = useState('')
  const [salvandoConcorrente, setSalvandoConcorrente] = useState(false)

  // Submissão de novo Decisor
  const handleCriarDecisor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeDecisor.trim()) {
      toast.error('O nome do decisor é obrigatório.')
      return
    }

    setSalvandoDecisor(true)
    router.post(
      `/especificadores/${arquitetoId}/decisores`,
      {
        nome: nomeDecisor.trim(),
        cargo: cargoDecisor.trim() || null,
        telefone: telefoneDecisor.trim() || null,
        email: emailDecisor.trim() || null,
        observacoes: obsDecisor.trim() || null,
        isPrincipal,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Decisor cadastrado com sucesso!')
          setNomeDecisor('')
          setCargoDecisor('')
          setTelefoneDecisor('')
          setEmailDecisor('')
          setObsDecisor('')
          setIsPrincipal(false)
          setShowNovoDecisor(false)
          setSalvandoDecisor(false)
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao cadastrar decisor'
          toast.error(String(first))
          setSalvandoDecisor(false)
        },
      }
    )
  }

  // Exclusão de Decisor
  const handleExcluirDecisor = (decisorId: number, nome: string) => {
    if (confirm(`Deseja remover ${nome} da lista de decisores?`)) {
      router.delete(`/especificadores/${arquitetoId}/decisores/${decisorId}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Decisor removido com sucesso!')
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao remover decisor'
          toast.error(String(first))
        },
      })
    }
  }

  // Submissão de novo Concorrente
  const handleCriarConcorrente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeConcorrente.trim()) {
      toast.error('Informe o nome da marca ou loja concorrente.')
      return
    }

    setSalvandoConcorrente(true)
    router.post(
      `/especificadores/${arquitetoId}/concorrentes`,
      {
        nomeConcorrente: nomeConcorrente.trim(),
        percentualFechamentoEstimado: Number(pctFechamento),
        observacoes: obsConcorrente.trim() || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Concorrente registrado com sucesso!')
          setNomeConcorrente('')
          setPctFechamento(30)
          setObsConcorrente('')
          setShowNovoConcorrente(false)
          setSalvandoConcorrente(false)
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao registrar concorrente'
          toast.error(String(first))
          setSalvandoConcorrente(false)
        },
      }
    )
  }

  // Exclusão de Concorrente
  const handleExcluirConcorrente = (concorrenteId: number, nome: string) => {
    if (confirm(`Deseja remover o monitoramento da concorrente ${nome}?`)) {
      router.delete(`/especificadores/${arquitetoId}/concorrentes/${concorrenteId}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Concorrente removido com sucesso!')
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao remover concorrente'
          toast.error(String(first))
        },
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Seção de Decisores */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Equipe & Decisores do Escritório ({decisores.length})
            </h4>
          </div>
          {!showNovoDecisor && (
            <button
              type="button"
              onClick={() => setShowNovoDecisor(true)}
              className="btn btn-secondary btn-sm text-xs gap-1"
            >
              <Plus size={13} />
              Adicionar Decisor
            </button>
          )}
        </div>

        {/* Formulário de Novo Decisor */}
        {showNovoDecisor && (
          <form
            onSubmit={handleCriarDecisor}
            className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-stone-800">Novo Contato do Escritório</h5>
              <button
                type="button"
                onClick={() => setShowNovoDecisor(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeDecisor}
                  onChange={(e) => setNomeDecisor(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="Ex: Gabriela Torres"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={cargoDecisor}
                  onChange={(e) => setCargoDecisor(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="Ex: Coordenadora de Projetos / Sócia"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefoneDecisor}
                  onChange={(e) => setTelefoneDecisor(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={emailDecisor}
                  onChange={(e) => setEmailDecisor(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="gabriela@escritorio.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Observações de Contato
                </label>
                <input
                  type="text"
                  value={obsDecisor}
                  onChange={(e) => setObsDecisor(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="Ex: Responsável técnica pelas especificações e aprovação de memorial descritivo"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkIsPrincipal"
                  checked={isPrincipal}
                  onChange={(e) => setIsPrincipal(e.target.checked)}
                  className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="checkIsPrincipal" className="text-xs font-medium text-stone-700">
                  Marcar como Decisor Principal do escritório (substitui anterior)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowNovoDecisor(false)}
                disabled={salvandoDecisor}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoDecisor || !nomeDecisor.trim()}
                className="btn btn-primary btn-sm text-xs gap-1.5"
              >
                <Save size={13} />
                {salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Decisores */}
        {decisores.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-3 text-center">
            Nenhum decisor cadastrado. Adicione sócios, especificadores e coordenadores de projetos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {decisores.map((d) => (
              <div
                key={d.id}
                className={clsx(
                  'p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                  d.isPrincipal
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-stone-50/70 border-stone-200'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 text-sm">{d.nome}</span>
                    {d.isPrincipal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        Decisor Principal
                      </span>
                    )}
                    {d.cargo && (
                      <span className="text-stone-500 font-medium">· {d.cargo}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-stone-600 text-2xs pt-0.5">
                    {d.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-stone-400" />
                        {d.telefone}
                      </span>
                    )}
                    {d.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} className="text-stone-400" />
                        {d.email}
                      </span>
                    )}
                  </div>

                  {d.observacoes && (
                    <p className="text-2xs text-stone-500 italic mt-1">{d.observacoes}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleExcluirDecisor(d.id, d.nome)}
                    title="Remover decisor"
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Seção de Concorrentes */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-rose-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Monitoramento da Concorrência ({concorrentes.length})
            </h4>
          </div>
          {!showNovoConcorrente && (
            <button
              type="button"
              onClick={() => setShowNovoConcorrente(true)}
              className="btn btn-secondary btn-sm text-xs gap-1"
            >
              <Plus size={13} />
              Mapear Concorrente
            </button>
          )}
        </div>

        {/* Formulário de Novo Concorrente */}
        {showNovoConcorrente && (
          <form
            onSubmit={handleCriarConcorrente}
            className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-stone-800">
                Registrar Marca / Concorrente Competidora
              </h5>
              <button
                type="button"
                onClick={() => setShowNovoConcorrente(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Nome do Concorrente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeConcorrente}
                  onChange={(e) => setNomeConcorrente(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="Ex: Florense, Ornare, Todeschini..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-2xs font-semibold text-stone-600 uppercase">
                    Taxa de Fechamento Estimada
                  </label>
                  <span className="font-mono font-bold text-xs text-primary-700">
                    {pctFechamento}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pctFechamento}
                  onChange={(e) => setPctFechamento(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                  Observações Competitivas
                </label>
                <input
                  type="text"
                  value={obsConcorrente}
                  onChange={(e) => setObsConcorrente(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="Ex: Costuma fechar projetos comerciais e copas com eles por prazo agressivo"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowNovoConcorrente(false)}
                disabled={salvandoConcorrente}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoConcorrente || !nomeConcorrente.trim()}
                className="btn btn-primary btn-sm text-xs gap-1.5"
              >
                <Save size={13} />
                {salvandoConcorrente ? 'Salvando...' : 'Salvar Concorrente'}
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Concorrentes */}
        {concorrentes.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-3 text-center">
            Nenhum concorrente mapeado para este parceiro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 uppercase text-2xs">
                  <th className="py-2 pr-3">Concorrente</th>
                  <th className="py-2 px-3">Taxa Fechamento Estimada</th>
                  <th className="py-2 px-3">Observações</th>
                  <th className="py-2 px-3">Registrado Por</th>
                  <th className="py-2 pl-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {concorrentes.map((c) => (
                  <tr key={c.id} className="text-stone-700">
                    <td className="py-3 pr-3 font-semibold text-stone-900">
                      {c.nomeConcorrente}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              c.percentualFechamentoEstimado >= 60
                                ? 'bg-rose-500'
                                : c.percentualFechamentoEstimado >= 30
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, c.percentualFechamentoEstimado)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-2xs min-w-[2.2rem] text-right">
                          {c.percentualFechamentoEstimado.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-500 italic max-w-xs truncate">
                      {c.observacoes || '—'}
                    </td>
                    <td className="py-3 px-3 text-2xs text-stone-400">
                      {c.registradoPor?.nome || 'Sistema'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleExcluirConcorrente(c.id, c.nomeConcorrente)}
                        title="Remover concorrente"
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DecisoresConcorrentesTab
