import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  UserCheck,
  Trash2,
  Send,
  Clock,
  Edit2,
  AlertTriangle,
  History,
  MessageSquare,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import type {
  EspecificadorListItem,
  EspecificadorDetalhado,
  InteracaoItem,
  HistoricoDonoItem,
  TipoInteracao,
  ConsultorOption,
} from '../types'
import {
  TIPO_ESPECIFICADOR_LABELS,
  NIVEL_PARCERIA_LABELS,
  NIVEL_PARCERIA_COLORS,
  TIPO_INTERACAO_ARQUITETO_LABELS,
  timeAgo,
  formatDateTime,
  formatDate,
} from '../../../lib/constants'

interface PerfilTabProps {
  arquiteto: EspecificadorListItem | EspecificadorDetalhado
  interacoes?: InteracaoItem[]
  historicoDono?: HistoricoDonoItem[]
  consultores?: ConsultorOption[]
  onEditar?: () => void
  onReatribuir?: () => void
  onDesativado?: () => void
}

export const PerfilTab: React.FC<PerfilTabProps> = ({
  arquiteto,
  interacoes = [],
  historicoDono = [],
  consultores: _consultores = [],
  onEditar,
  onReatribuir,
  onDesativado,
}) => {
  // Estado para novo registro de contato
  const [tipoInteracao, setTipoInteracao] = useState<TipoInteracao>('visita_escritorio')
  const [resumo, setResumo] = useState('')
  const [salvandoInteracao, setSalvandoInteracao] = useState(false)

  // Estado para confirmação de soft delete
  const [showConfirmDesativar, setShowConfirmDesativar] = useState(false)
  const [desativando, setDesativando] = useState(false)

  const handleRegistrarInteracao = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumo.trim()) {
      toast.error('Informe um resumo ou ata da interação.')
      return
    }

    setSalvandoInteracao(true)
    router.post(
      `/especificadores/${arquiteto.id}/interacoes`,
      {
        tipo: tipoInteracao,
        resumo: resumo.trim(),
        data: new Date().toISOString(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Interação registrada com sucesso!')
          setResumo('')
          setSalvandoInteracao(false)
        },
        onError: (errors) => {
          const first = Object.values(errors)[0] || 'Erro ao registrar interação'
          toast.error(String(first))
          setSalvandoInteracao(false)
        },
      }
    )
  }

  const handleConfirmarDesativacao = () => {
    setDesativando(true)
    router.delete(`/especificadores/${arquiteto.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${arquiteto.nome} foi desativado com sucesso (soft delete).`)
        setDesativando(false)
        setShowConfirmDesativar(false)
        onDesativado?.()
      },
      onError: (errors) => {
        const first = Object.values(errors)[0] || 'Erro ao desativar especificador'
        toast.error(String(first))
        setDesativando(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Card de Dados Cadastrais */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Informações Gerais
            </h4>
          </div>
          {onEditar && (
            <button
              type="button"
              onClick={onEditar}
              className="btn btn-ghost btn-sm text-xs gap-1 text-stone-600 hover:text-stone-900"
            >
              <Edit2 size={13} />
              Editar Dados
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-stone-400 block mb-0.5">Tipo Profissional</span>
            <span className="font-medium text-stone-800">
              {TIPO_ESPECIFICADOR_LABELS[arquiteto.tipo] || arquiteto.tipo}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block mb-0.5">Nível de Parceria</span>
            <span
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold border',
                NIVEL_PARCERIA_COLORS[arquiteto.nivelParceria] || 'bg-stone-100 text-stone-700'
              )}
            >
              {NIVEL_PARCERIA_LABELS[arquiteto.nivelParceria] || arquiteto.nivelParceria}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block mb-0.5">Escritório / Razão</span>
            <span className="font-medium text-stone-800">
              {arquiteto.escritorio || 'Pessoa Física / Autônomo'}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block mb-0.5">Consultor Dono da Carteira</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-stone-800">
                {arquiteto.consultor ? arquiteto.consultor.nome : 'Sem consultor'}
              </span>
              {onReatribuir && (
                <button
                  type="button"
                  onClick={onReatribuir}
                  className="text-2xs text-primary-600 hover:text-primary-800 font-semibold underline ml-1"
                >
                  Transferir
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="text-stone-400 block mb-0.5">Telefone / WhatsApp</span>
            <div className="flex items-center gap-1.5 text-stone-800">
              <Phone size={13} className="text-stone-400" />
              <span>{arquiteto.telefone || 'Não informado'}</span>
            </div>
          </div>

          <div>
            <span className="text-stone-400 block mb-0.5">E-mail Principal</span>
            <div className="flex items-center gap-1.5 text-stone-800 truncate">
              <Mail size={13} className="text-stone-400" />
              <span className="truncate">{arquiteto.email || 'Não informado'}</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="text-stone-400 block mb-0.5">Endereço do Escritório</span>
            <div className="flex items-center gap-1.5 text-stone-800">
              <MapPin size={13} className="text-stone-400 flex-shrink-0" />
              <span>{arquiteto.enderecoEscritorio || 'Endereço não cadastrado'}</span>
            </div>
          </div>

          {arquiteto.especialidade && (
            <div className="sm:col-span-2">
              <span className="text-stone-400 block mb-0.5">Especialidade / Perfil de Projetos</span>
              <p className="text-stone-700 bg-stone-50 p-2 rounded border border-stone-100">
                {arquiteto.especialidade}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Formulário Rápido de Interação */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <MessageSquare size={16} className="text-primary-600" />
          <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
            Registrar Novo Contato / Visita
          </h4>
        </div>

        <form onSubmit={handleRegistrarInteracao} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
                Tipo de Interação
              </label>
              <select
                value={tipoInteracao}
                onChange={(e) => setTipoInteracao(e.target.value as TipoInteracao)}
                className="input w-full text-xs"
              >
                {(Object.entries(TIPO_INTERACAO_ARQUITETO_LABELS) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-2xs text-stone-400">
                Registrado automaticamente em nome do usuário logado na data de hoje.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-stone-600 uppercase mb-1">
              Resumo / Ata da Interação
            </label>
            <textarea
              rows={2}
              required
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="input w-full text-xs resize-none"
              placeholder="Ex: Visita ao escritório para entrega de amostras da nova linha Warm Gold. Arquiteto sinalizou 2 novos clientes em Alphaville..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvandoInteracao || !resumo.trim()}
              className="btn btn-primary btn-sm gap-1.5 text-xs"
            >
              <Send size={13} />
              {salvandoInteracao ? 'Registrando...' : 'Gravar Interação'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Timeline de Interações */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Histórico de Relacionamento ({interacoes.length})
            </h4>
          </div>
        </div>

        {interacoes.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            <Calendar size={24} className="mx-auto mb-1.5 opacity-40" />
            Nenhuma interação registrada até o momento.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {interacoes.map((item) => (
              <div key={item.id} className="relative pl-8 text-xs">
                <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-sm flex items-center justify-center text-white" />
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200/70 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-stone-800">
                      {TIPO_INTERACAO_ARQUITETO_LABELS[item.tipo] || item.tipo}
                    </span>
                    <span className="text-2xs text-stone-400 font-mono">
                      {timeAgo(item.data || item.createdAt)}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{item.resumo}</p>
                  <div className="flex items-center gap-2 pt-1 text-2xs text-stone-400 border-t border-stone-200/50">
                    <User size={11} />
                    <span>Registrado por {item.responsavel?.nome || 'Consultor'}</span>
                    {item.data && <span>· {formatDateTime(item.data)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Painel de Auditoria de Transferência de Dono (RN017) */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-amber-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Auditoria de Dono da Carteira (RN017)
            </h4>
          </div>
          {onReatribuir && (
            <button
              type="button"
              onClick={onReatribuir}
              className="btn btn-secondary btn-sm text-xs gap-1"
            >
              <UserCheck size={13} />
              Reatribuir Titularidade
            </button>
          )}
        </div>

        {historicoDono.length === 0 ? (
          <div className="text-center py-4 text-stone-400 text-xs">
            Nenhuma transferência registrada. Titularidade inicial mantida.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 uppercase text-2xs">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 px-3">De</th>
                  <th className="py-2 px-3">Para</th>
                  <th className="py-2 px-3">Alterado Por</th>
                  <th className="py-2 pl-3">Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {historicoDono.map((h) => (
                  <tr key={h.id} className="text-stone-700">
                    <td className="py-2.5 pr-3 text-2xs text-stone-500 font-mono whitespace-nowrap">
                      {formatDate(h.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {h.consultorAnterior?.nome || '— (Início)'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-primary-700">
                      {h.consultorNovo?.nome}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500">
                      {h.alteradoPor?.nome || 'Sistema'}
                    </td>
                    <td className="py-2.5 pl-3 text-stone-600 italic">
                      {h.motivo || 'Sem justificativa'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Zona de Perigo / Soft Delete */}
      <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-rose-600" />
              Desativação de Especificador (RN017)
            </h4>
            <p className="text-xs text-rose-700/80 mt-0.5">
              Em conformidade com a RN017, parceiros nunca são removidos fisicamente do banco de
              dados. A desativação oculta o profissional das buscas ativas preservando todo o histórico
              de projetos e indicações.
            </p>
          </div>
        </div>

        {!showConfirmDesativar ? (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowConfirmDesativar(true)}
              className="btn btn-danger btn-sm text-xs gap-1.5"
            >
              <Trash2 size={13} />
              Desativar Parceiro
            </button>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-rose-200 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-stone-800">
              Confirma a desativação lógica de {arquiteto.nome}?
            </p>
            <p className="text-2xs text-stone-500">
              Ele não aparecerá mais no CRM de novos leads ou na carteira comercial de atendimento.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDesativar(false)}
                disabled={desativando}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesativacao}
                disabled={desativando}
                className="btn btn-danger btn-sm text-xs"
              >
                {desativando ? 'Desativando...' : 'Sim, Desativar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerfilTab
