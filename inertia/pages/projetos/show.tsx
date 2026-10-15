import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '../../layouts/app_layout'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Layers,
  Palette,
  Send,
  Check,
  X,
  ExternalLink,
  Archive,
  Image as ImageIcon,
  ShieldAlert,
} from 'lucide-react'

import clsx from 'clsx'

interface EnderecoItem {
  id: number
  tipo: string
  identificacao: string | null
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string | null
  cep: string | null
}

interface Versao3DItem {
  id: number
  versao: number
  arquivoUrl: string | null
  renderUrls: string | null
  descricaoAlteracao: string | null
  status: string
  statusLabel: string
  submetidoParaValidacaoEm: string | null
  validadoEm: string | null
  validadoPor: { id: number; nome: string } | null
  motivoDevolucao: string | null
  numeroApresentacao: number
  criadoPor: { id: number; nome: string } | null
  createdAt: string
}

interface HistoricoItem {
  id: number
  statusDe: string | null
  statusDeLabel: string | null
  statusPara: string
  statusParaLabel: string
  observacao: string | null
  alteradoPor: { id: number; nome: string; perfil: string } | null
  createdAt: string
}

interface Props {
  projeto: {
    id: number
    codigo: string
    clienteNome: string
    status: string
    statusLabel: string
    statusAnterior: string | null
    statusAlteradoEm: string | null
    valorContrato: number | null
    prazoEntregaEstimado: string | null
    arquivado: boolean
    arquivadoEm: string | null
    arquivadoMotivo: string | null
    alertaParado: boolean
    diasParado: number
    temRenderAprovado: boolean
    createdAt: string
    updatedAt: string | null
    vendedor: { id: number; nome: string; email: string; telefone: string | null } | null
    projetista: { id: number; nome: string; email: string; telefone: string | null } | null
    conferente: { id: number; nome: string; email: string; telefone: string | null } | null
    arquiteto: { id: number; nome: string; escritorio: string | null; telefone: string | null } | null
    cliente: {
      id: number
      nome: string
      cpfCnpj: string | null
      telefone: string
      email: string | null
      tipo: string
      enderecos: EnderecoItem[]
    } | null
    briefing: {
      id: number
      score: number
      scoreMinimo: number
      status: string
      estiloPrincipal: string | null
      padraoAcabamento: string | null
      orcamentoPrevisto: number | null
      ambientes: Array<{
        id: number
        tipo: string
        descricao: string | null
        medidasPreliminares: string | null
      }>
    } | null
    versoes3D: Versao3DItem[]
    historico: HistoricoItem[]
  }
  permissions: {
    podeValidar3D: boolean
    podeSubmeter3D: boolean
    isGestor: boolean
  }
  statusOptions: Array<{ value: string; label: string }>
}

export default function ProjetoShow({ projeto, permissions, statusOptions }: Props) {
  const [activeTab, setActiveTab] = useState<'3d_render' | 'visao_geral' | 'historico'>('3d_render')

  // Modais de Controle
  const [modalStatusOpen, setModalStatusOpen] = useState(false)
  const [novoStatus, setNovoStatus] = useState(projeto.status)
  const [observacaoStatus, setObservacaoStatus] = useState('')

  const [modalNovaVersaoOpen, setModalNovaVersaoOpen] = useState(false)
  const [arquivoUrl, setArquivoUrl] = useState('')
  const [descricaoAlteracao, setDescricaoAlteracao] = useState('')

  const [modalDevolverOpen, setModalDevolverOpen] = useState(false)
  const [versaoParaDevolver, setVersaoParaDevolver] = useState<number | null>(null)
  const [motivoDevolucao, setMotivoDevolucao] = useState('')

  const [modalRenderOpen, setModalRenderOpen] = useState(false)
  const [versaoParaRender, setVersaoParaRender] = useState<number | null>(null)
  const [renderUrls, setRenderUrls] = useState('')

  const [modalArquivarOpen, setModalArquivarOpen] = useState(false)
  const [motivoArquivamento, setMotivoArquivamento] = useState('')

  // Submissões
  const handleMudarStatus = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(
      `/projetos/${projeto.id}/status`,
      {
        status: novoStatus,
        observacao: observacaoStatus,
      },
      {
        onSuccess: () => {
          setModalStatusOpen(false)
          setObservacaoStatus('')
        },
      }
    )
  }

  const handleSubmeterVersao3D = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(
      `/projetos/${projeto.id}/versoes-3d`,
      {
        arquivoUrl,
        descricaoAlteracao,
      },
      {
        onSuccess: () => {
          setModalNovaVersaoOpen(false)
          setArquivoUrl('')
          setDescricaoAlteracao('')
        },
      }
    )
  }

  const handleAprovarVersao3D = (versaoId: number) => {
    if (!confirm('Deseja realmente aprovar esta maquete 3D e liberar para a fase de renderização?')) {
      return
    }
    router.post(`/projetos/${projeto.id}/versoes-3d/${versaoId}/avaliar`, {
      acao: 'aprovar',
    })
  }

  const handleDevolverVersao3D = (e: React.FormEvent) => {
    e.preventDefault()
    if (!versaoParaDevolver) return
    router.post(
      `/projetos/${projeto.id}/versoes-3d/${versaoParaDevolver}/avaliar`,
      {
        acao: 'devolver',
        motivoDevolucao,
      },
      {
        onSuccess: () => {
          setModalDevolverOpen(false)
          setMotivoDevolucao('')
          setVersaoParaDevolver(null)
        },
      }
    )
  }

  const handleConcluirRender = (e: React.FormEvent) => {
    e.preventDefault()
    if (!versaoParaRender) return
    router.post(
      `/projetos/${projeto.id}/versoes-3d/${versaoParaRender}/concluir-render`,
      {
        renderUrls,
      },
      {
        onSuccess: () => {
          setModalRenderOpen(false)
          setRenderUrls('')
          setVersaoParaRender(null)
        },
      }
    )
  }

  const handleArquivar = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(
      `/projetos/${projeto.id}/arquivar`,
      {
        motivo: motivoArquivamento,
      },
      {
        onSuccess: () => {
          setModalArquivarOpen(false)
        },
      }
    )
  }

  return (
    <AppLayout
      title={`Projeto ${projeto.codigo}`}
      subtitle={`Sala de Controle • ${projeto.clienteNome}`}
    >
      <Head title={`Projeto ${projeto.codigo} | Plannit`} />

      <div className="space-y-6">
        {/* Barra Superior / Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/projetos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} /> Voltar para Carteira
          </Link>

          <div className="flex items-center gap-2">
            {!projeto.arquivado && (
              <>
                <Link
                  href={`/projetos/${projeto.id}/fechamento`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm"
                >
                  <FileText size={14} /> Fechamento & Handoff (RN006)
                </Link>

                <button
                  onClick={() => setModalStatusOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Layers size={14} /> Transicionar Etapa
                </button>

                {permissions.isGestor && (
                  <button
                    onClick={() => setModalArquivarOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-300"
                  >
                    <Archive size={14} /> Arquivar (RN017)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card do Header do Projeto */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary-800 bg-primary-50 px-2.5 py-1 rounded border border-primary-200">
                  {projeto.codigo}
                </span>
                <h1 className="text-xl font-display font-semibold text-stone-900">
                  {projeto.clienteNome}
                </h1>
                {projeto.arquivado && (
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                    Arquivado (Soft-Delete)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Criado em {new Date(projeto.createdAt).toLocaleDateString('pt-BR')} • Última
                movimentação há {projeto.diasParado} dia(s)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                Etapa: <strong className="ml-1">{projeto.statusLabel}</strong>
              </span>

              {projeto.alertaParado && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
                  <AlertTriangle size={13} /> Alerta RN016 ({projeto.diasParado} dias parado)
                </span>
              )}
            </div>
          </div>

          {/* Dados Resumidos da Equipe */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Vendedor Responsável</span>
              <span className="font-semibold text-stone-800 mt-0.5 block">
                {projeto.vendedor?.nome || 'Não atribuído'}
              </span>
              {projeto.vendedor?.email && (
                <span className="text-[11px] text-stone-500 block truncate">{projeto.vendedor.email}</span>
              )}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Projetista Alocado</span>
              <span className="font-semibold text-stone-800 mt-0.5 block">
                {projeto.projetista?.nome || 'Aguardando alocação na fila'}
              </span>
              {projeto.projetista?.email && (
                <span className="text-[11px] text-stone-500 block truncate">{projeto.projetista.email}</span>
              )}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Especificador Parceiro</span>
              <span className="font-semibold text-stone-800 mt-0.5 block">
                {projeto.arquiteto?.nome || 'Direto com cliente'}
              </span>
              {projeto.arquiteto?.escritorio && (
                <span className="text-[11px] text-stone-500 block truncate">
                  {projeto.arquiteto.escritorio}
                </span>
              )}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Valor Comercial Estimado</span>
              <span className="font-bold text-stone-900 text-sm mt-0.5 block font-mono">
                {projeto.valorContrato
                  ? `R$ ${projeto.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Em negociação'}
              </span>
            </div>
          </div>
        </div>

        {/* Navegação por Abas */}
        <div className="border-b border-stone-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('3d_render')}
              className={clsx(
                'py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors',
                activeTab === '3d_render'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              )}
            >
              <Palette size={16} /> Maquete 3D & Validação de Render (RN004/RN005)
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600">
                {projeto.versoes3D.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('visao_geral')}
              className={clsx(
                'py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors',
                activeTab === 'visao_geral'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              )}
            >
              <User size={16} /> Visão Geral, Cliente & Briefing
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={clsx(
                'py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors',
                activeTab === 'historico'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              )}
            >
              <Clock size={16} /> Linha do Tempo & Histórico Imutável (RN017)
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600">
                {projeto.historico.length}
              </span>
            </button>

            <Link
              href={`/projetos/${projeto.id}/fechamento`}
              className="py-3 text-xs font-semibold border-b-2 border-transparent text-stone-500 hover:text-stone-800 flex items-center gap-2 transition-colors"
            >
              <FileText size={16} /> Fechamento & Handoff (RN006)
            </Link>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: MAQUETE 3D & VALIDAÇÃO DE RENDER (RN004 & RN005) */}
        {/* ========================================================================= */}
        {activeTab === '3d_render' && (
          <div className="space-y-6">
            {/* Banner de Conformidade RN005 */}
            {projeto.temRenderAprovado ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Conformidade RN005 Atestada — Apresentação ao Cliente Liberada
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    O projeto possui versão 3D com render aprovado pelo vendedor responsável e
                    processado. O agendamento da reunião de apresentação ao cliente está autorizado
                    pelo sistema.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    RN005: Trava de Segurança Ativa — Apresentação Bloqueada
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Apresentação ao cliente estritamente bloqueada. É obrigatório que o vendedor
                    aprove a maquete 3D (RN004) e que a renderização fotorrealista seja concluída
                    antes de agendar a apresentação comercial.
                  </p>
                </div>
              </div>
            )}

            {/* Ações da Maquete 3D */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Versões do Projeto Comercial & Maquetes 3D
              </h3>

              {!projeto.arquivado && permissions.podeSubmeter3D && (
                <button
                  onClick={() => setModalNovaVersaoOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
                >
                  <Send size={14} /> Submeter Nova Versão 3D
                </button>
              )}
            </div>

            {/* Lista de Versões 3D */}
            {projeto.versoes3D.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <Palette size={40} className="mx-auto text-stone-300 mb-3" />
                <h4 className="text-sm font-semibold text-stone-700">Nenhuma maquete 3D submetida</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  O projetista alocado deve desenvolver a primeira proposta e submeter a versão para
                  validação formal do vendedor responsável (RN004).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projeto.versoes3D.map((versao) => (
                  <div
                    key={versao.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                          v{versao.versao}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900">
                            Versão {versao.versao} • Submetida por {versao.criadoPor?.nome || 'Projetista'}
                          </h4>
                          <span className="text-[11px] text-stone-400">
                            {new Date(versao.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'px-3 py-1 rounded-full text-xs font-semibold border',
                            versao.status === 'aguard_validacao_vendedor' &&
                              'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
                            versao.status === 'aprovado' &&
                              'bg-emerald-50 text-emerald-700 border-emerald-200',
                            versao.status === 'devolvido' &&
                              'bg-rose-50 text-rose-700 border-rose-200',
                            versao.status === 'em_render' &&
                              'bg-purple-50 text-purple-700 border-purple-200',
                            versao.status === 'finalizado' &&
                              'bg-emerald-100 text-emerald-800 border-emerald-300'
                          )}
                        >
                          {versao.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Descrição e Arquivo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-stone-400 font-medium block">
                          Memorial de Alterações / Descrição:
                        </span>
                        <p className="text-stone-700 mt-1 bg-stone-50 p-3 rounded-lg border border-stone-100 leading-relaxed">
                          {versao.descricaoAlteracao || 'Sem descrição informada.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-stone-400 font-medium block">
                          Arquivo 3D (Promob / Sketchup / Nuvem):
                        </span>
                        {versao.arquivoUrl ? (
                          <a
                            href={versao.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold border border-primary-200 transition-colors"
                          >
                            <ExternalLink size={14} /> Abrir Arquivo 3D da Versão {versao.versao}
                          </a>
                        ) : (
                          <span className="text-stone-400 italic block mt-1">
                            Link do arquivo não informado.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Devolução com Motivo (RN004) */}
                    {versao.status === 'devolvido' && versao.motivoDevolucao && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900">
                        <div className="font-bold flex items-center gap-1.5 text-rose-800">
                          <X size={14} /> Apontamentos do Vendedor (Motivo da Devolução — RN004):
                        </div>
                        <p className="mt-1 text-rose-800 leading-relaxed whitespace-pre-wrap">
                          {versao.motivoDevolucao}
                        </p>
                        {versao.validadoPor && (
                          <span className="text-[10px] text-rose-600 block mt-1">
                            Apontado por {versao.validadoPor.nome} em{' '}
                            {versao.validadoEm
                              ? new Date(versao.validadoEm).toLocaleString('pt-BR')
                              : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Galeria de Renders */}
                    {versao.renderUrls && (
                      <div className="space-y-2 pt-2 border-t border-stone-100">
                        <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                          <ImageIcon size={14} /> Imagens de Renderização Fotorrealista:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {versao.renderUrls.split(/[\n,]+/).map((url, idx) => {
                            const link = url.trim()
                            if (!link) return null
                            return (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 inline-flex items-center gap-1"
                              >
                                <ExternalLink size={12} /> Render #{idx + 1}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Barra de Ações do Vendedor (RN004) */}
                    {!projeto.arquivado && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-100">
                        {versao.status === 'aguard_validacao_vendedor' && permissions.podeValidar3D && (
                          <>
                            <button
                              onClick={() => {
                                setVersaoParaDevolver(versao.id)
                                setModalDevolverOpen(true)
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                            >
                              <X size={14} /> Devolver com Apontamentos (RN004)
                            </button>

                            <button
                              onClick={() => handleAprovarVersao3D(versao.id)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                            >
                              <Check size={14} /> Aprovar para Renderização (RN004)
                            </button>
                          </>
                        )}

                        {(versao.status === 'aprovado' || versao.status === 'em_render') && (
                          <button
                            onClick={() => {
                              setVersaoParaRender(versao.id)
                              setRenderUrls(versao.renderUrls || '')
                              setModalRenderOpen(true)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                          >
                            <ImageIcon size={14} /> Vincular / Concluir Renders Finais
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: VISÃO GERAL, CLIENTE & BRIEFING */}
        {/* ========================================================================= */}
        {activeTab === 'visao_geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card do Cliente */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} /> Cadastro do Cliente
                </h3>
                {projeto.cliente && (
                  <Link
                    href={`/clientes/${projeto.cliente.id}`}
                    className="text-xs text-primary-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Ver Cadastro Completo <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {projeto.cliente ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-stone-400 block">Nome Completo:</span>
                    <span className="font-semibold text-stone-900 text-sm">
                      {projeto.cliente.nome}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 block">CPF / CNPJ:</span>
                      <span className="font-mono text-stone-800">
                        {projeto.cliente.cpfCnpj || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Telefone:</span>
                      <span className="text-stone-800">{projeto.cliente.telefone}</span>
                    </div>
                  </div>

                  {/* Endereços de Montagem */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-stone-500 font-semibold block mb-2">
                      Endereços Registrados ({projeto.cliente.enderecos.length}):
                    </span>
                    {projeto.cliente.enderecos.length === 0 ? (
                      <span className="text-stone-400 italic">Nenhum endereço cadastrado.</span>
                    ) : (
                      <div className="space-y-2">
                        {projeto.cliente.enderecos.map((end) => (
                          <div
                            key={end.id}
                            className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-stone-700"
                          >
                            <span className="font-bold text-primary-800 text-[10px] uppercase block">
                              {end.tipo} — {end.identificacao || 'Principal'}
                            </span>
                            <span className="block">
                              {end.logradouro}, {end.numero} {end.complemento || ''}
                            </span>
                            <span className="text-stone-500 text-[11px] block">
                              {end.bairro || ''}, {end.cidade}/{end.estado} • CEP {end.cep}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Cliente não vinculado formalmente.</p>
              )}
            </div>

            {/* Card do Briefing */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} /> Briefing & Requisitos (RN002)
                </h3>
                {projeto.briefing && (
                  <Link
                    href={`/briefings/${projeto.briefing.id}/edit`}
                    className="text-xs text-primary-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Editar Briefing <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {projeto.briefing ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-primary-50/60 p-3 rounded-xl border border-primary-200/60">
                    <div>
                      <span className="text-[10px] font-bold text-primary-800 uppercase tracking-wider block">
                        Briefing Score Inteligente
                      </span>
                      <span className="text-xs text-stone-600">Mínimo para fila: 70 pts</span>
                    </div>
                    <span
                      className={clsx(
                        'text-2xl font-bold font-display px-3 py-1 rounded-lg border',
                        projeto.briefing.score >= 70
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      )}
                    >
                      {projeto.briefing.score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-400 block">Estilo Principal:</span>
                      <span className="font-semibold text-stone-800">
                        {projeto.briefing.estiloPrincipal || 'A definir'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Padrão de Acabamento:</span>
                      <span className="font-semibold text-stone-800">
                        {projeto.briefing.padraoAcabamento || 'Alto Padrão'}
                      </span>
                    </div>
                  </div>

                  {/* Ambientes do Briefing */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-stone-500 font-semibold block mb-2">
                      Ambientes Planejados ({projeto.briefing.ambientes.length}):
                    </span>
                    {projeto.briefing.ambientes.length === 0 ? (
                      <span className="text-stone-400 italic">Nenhum ambiente listado.</span>
                    ) : (
                      <div className="space-y-2">
                        {projeto.briefing.ambientes.map((amb) => (
                          <div
                            key={amb.id}
                            className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-stone-700 flex items-center justify-between"
                          >
                            <span className="font-medium capitalize">{amb.tipo}</span>
                            <span className="text-stone-400 text-[11px] truncate max-w-[200px]">
                              {amb.descricao || 'Sem observações'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Briefing ainda não cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: LINHA DO TEMPO & HISTÓRICO IMUTÁVEL (RN017) */}
        {/* ========================================================================= */}
        {activeTab === 'historico' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} /> Histórico Imutável de Transições de Status
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Auditoria inalterável de todas as fases percorridas pelo projeto (RN017)
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                Total de Registros: {projeto.historico.length}
              </span>
            </div>

            {projeto.historico.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">
                Nenhum histórico registrado até o momento.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {projeto.historico.map((h) => (
                  <div key={h.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                    </div>

                    <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-2">
                        <div className="flex items-center gap-2 font-semibold text-stone-900">
                          {h.statusDeLabel ? (
                            <>
                              <span className="text-stone-500">{h.statusDeLabel}</span>
                              <span className="text-stone-400">→</span>
                            </>
                          ) : null}
                          <span className="text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                            {h.statusParaLabel}
                          </span>
                        </div>

                        <span className="text-[11px] text-stone-400">
                          {new Date(h.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {h.observacao && (
                        <p className="text-stone-700 italic bg-white p-2.5 rounded border border-stone-200/80 leading-relaxed">
                          "{h.observacao}"
                        </p>
                      )}

                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                        <User size={12} className="text-stone-400" />
                        <span>
                          Registrado por: <strong>{h.alteradoPor?.nome || 'Sistema'}</strong>
                          {h.alteradoPor?.perfil && ` (${h.alteradoPor.perfil})`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MUDANÇA DE STATUS (RN005 & RN017) */}
      {/* ========================================================================= */}
      {modalStatusOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <Layers size={18} /> Transicionar Status do Projeto
              </h3>
              <button
                onClick={() => setModalStatusOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMudarStatus} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nova Etapa do Fluxo:
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alerta explicativo se selecionar apresentação sem render aprovado */}
              {novoStatus === 'aguard_apresentacao' && !projeto.temRenderAprovado && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-800">
                    <ShieldAlert size={14} /> Bloqueio Inegociável RN005:
                  </div>
                  <p>
                    O sistema recusará esta transição porque o render ainda não foi aprovado pelo
                    vendedor e concluído.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Observação / Justificativa da Mudança (RN017 - Histórico Imutável):
                </label>
                <textarea
                  rows={3}
                  value={observacaoStatus}
                  onChange={(e) => setObservacaoStatus(e.target.value)}
                  placeholder="Informe os detalhes do avanço ou recuo de etapa..."
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalStatusOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-xs transition-colors"
                >
                  Confirmar Transição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMETER NOVA VERSÃO 3D */}
      {/* ========================================================================= */}
      {modalNovaVersaoOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <Send size={18} /> Submeter Maquete 3D para Validação
              </h3>
              <button
                onClick={() => setModalNovaVersaoOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmeterVersao3D} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Link / URL do Arquivo 3D (Promob / Sketchup / Google Drive):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={arquivoUrl}
                  onChange={(e) => setArquivoUrl(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Memorial de Modificações / O que foi ajustado nesta versão:
                </label>
                <textarea
                  rows={3}
                  value={descricaoAlteracao}
                  onChange={(e) => setDescricaoAlteracao(e.target.value)}
                  placeholder="Ex: Ajustada a altura da torre quente, adicionadas portas de vidro reflecta e gavetões..."
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalNovaVersaoOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 shadow-xs transition-colors"
                >
                  Submeter para Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEVOLUÇÃO COM MOTIVO OBRIGATÓRIO (RN004) */}
      {/* ========================================================================= */}
      {modalDevolverOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-semibold text-rose-900 flex items-center gap-2">
                <X size={18} className="text-rose-600" /> Devolver Maquete 3D para Ajustes (RN004)
              </h3>
              <button
                onClick={() => setModalDevolverOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDevolverVersao3D} className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                <strong>Atenção (RN004):</strong> É obrigatório descrever detalhadamente o motivo da
                reprovação para que o projetista saiba exatamente quais adequações são necessárias
                antes da renderização.
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Motivo da Devolução / Apontamentos Comerciais (Obrigatório):
                </label>
                <textarea
                  rows={4}
                  required
                  value={motivoDevolucao}
                  onChange={(e) => setMotivoDevolucao(e.target.value)}
                  placeholder="Descreva o que não está de acordo com o briefing ou as expectativas do cliente..."
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalDevolverOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONCLUIR RENDER FOTORREALISTA */}
      {/* ========================================================================= */}
      {modalRenderOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <ImageIcon size={18} /> Vincular Renders Finais
              </h3>
              <button
                onClick={() => setModalRenderOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConcluirRender} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  URLs / Links das Imagens Fotorrealistas (separados por linha ou vírgula):
                </label>
                <textarea
                  rows={4}
                  required
                  value={renderUrls}
                  onChange={(e) => setRenderUrls(e.target.value)}
                  placeholder="https://meudrive.com/render_cozinha_01.jpg&#10;https://meudrive.com/render_sala_02.jpg"
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalRenderOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition-colors"
                >
                  Salvar e Concluir Renders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ARQUIVAMENTO SOFT DELETE (RN017) */}
      {/* ========================================================================= */}
      {modalArquivarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-300">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <Archive size={18} /> Arquivar Projeto (RN017 - Preservação de Histórico)
              </h3>
              <button
                onClick={() => setModalArquivarOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleArquivar} className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700">
                <strong>Regra RN017:</strong> Projetos nunca são excluídos fisicamente. O
                arquivamento preserva todo o histórico técnico, comercial e financeiro para fins de
                auditoria futura.
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Justificativa Obrigatória do Arquivamento:
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoArquivamento}
                  onChange={(e) => setMotivoArquivamento(e.target.value)}
                  placeholder="Ex: Desistência por mudança de cidade do cliente, orçamento expirado..."
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalArquivarOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-xs transition-colors"
                >
                  Arquivar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
