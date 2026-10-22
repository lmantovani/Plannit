export interface FunilEtapa {
  key: string
  label: string
  cor: string
  bg: string
  border: string
  text: string
  quadroSlug?: string
  quadroNome?: string
  exigeQualificacao?: boolean
  exigeMotivoPerda?: boolean
  tipoEstagio?: string
}

export interface KanbanEtapaCatalogoItem {
  id: number
  quadroId: number
  nome: string
  slug: string
  cor: string
  ordem: number
  exigeQualificacao: boolean
  exigeMotivoPerda: boolean
  tipoEstagio: string
  isActive?: boolean
  isSistema?: boolean
}

export interface KanbanQuadroCatalogoItem {
  id: number
  nome: string
  slug: string
  descricao: string | null
  cor: string
  ordem: number
  isActive?: boolean
  isSistema?: boolean
  etapas: KanbanEtapaCatalogoItem[]
}

export const FUNIL_ETAPAS: FunilEtapa[] = [
  // Comercial
  { key: 'novo_lead', label: 'Novo Lead', cor: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', quadroSlug: 'comercial', exigeQualificacao: false },
  { key: 'qualificando', label: 'Qualificação', cor: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', quadroSlug: 'comercial', exigeQualificacao: false },
  { key: 'em_visita', label: 'Em Visita', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', quadroSlug: 'comercial', exigeQualificacao: false },
  { key: 'em_briefing', label: 'Briefing', cor: '#a66a12', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'fila_projeto', label: 'Fila de Projeto', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'em_projeto', label: 'Em Projeto', cor: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'pronto_para_renderizar', label: 'Pronto para Renderizar', cor: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'finalizacao_renderizado', label: 'Finalização / Renderizado', cor: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'confirmar_apresentacao', label: 'Confirmar Apresentação', cor: '#ec4899', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'apresentacao_agendada', label: 'Apresentação Agendada', cor: '#d946ef', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'em_fechamento', label: 'Em Aberto / Em Negociação / Apresentado', cor: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'stand_by', label: 'Stand-by', cor: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'alteracao_ajuste', label: 'Alteração / Modificação / Ajuste', cor: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', quadroSlug: 'comercial', exigeQualificacao: true },
  { key: 'fechado', label: 'Fechado / Vendido', cor: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'comercial', exigeQualificacao: true, tipoEstagio: 'ganho' },
  { key: 'perdido', label: 'Perdido', cor: '#dc2626', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', quadroSlug: 'comercial', exigeQualificacao: false, exigeMotivoPerda: true, tipoEstagio: 'perdido' },

  // Pós-venda (Conferência)
  { key: 'caderno_comercial', label: 'Caderno Comercial', cor: '#0284c7', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'aguardando_obra', label: 'Aguardando Obra', cor: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'fila_medicao_tecnica', label: 'Fila Medição Técnica', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'fila_pasta_tecnica', label: 'Fila Pasta Técnica', cor: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'em_adequacao_obra', label: 'Em Adequação de Obra', cor: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'medicao_tecnica', label: 'Medição Técnica', cor: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'fila_medicao_final', label: 'Fila Medição Final', cor: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'medicao_final', label: 'Medição Final', cor: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'pre_executivo', label: 'Pré-executivo', cor: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'fila_projeto_executivo', label: 'Fila Projeto Executivo', cor: '#a855f7', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'adequacao', label: 'Adequação', cor: '#ec4899', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'auditoria_projeto', label: 'Auditoria Projeto', cor: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'assinatura_executiva', label: 'Assinatura Executiva', cor: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'em_codificacao', label: 'Em Codificação', cor: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },
  { key: 'postagem', label: 'Postagem', cor: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_conferencia', exigeQualificacao: true },

  // Pós-venda - Entrega e Montagem
  { key: 'aguardando_producao', label: 'Aguardando Produção', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'pronto_industria', label: 'Pronto pra Indústria', cor: '#0284c7', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'vistoria_montagem', label: 'Vistoria para Montagem', cor: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'entrega_agendada', label: 'Entrega Agendada', cor: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'em_montagem', label: 'Em Montagem', cor: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'checklist_final', label: 'Checklist Final', cor: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'montagem_finalizada', label: 'Montagem Finalizada', cor: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'finalizada_com_pendencia', label: 'Finalizada com Pendência', cor: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },
  { key: 'relatorio_obra', label: 'Relatório de Obra', cor: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_entrega_montagem', exigeQualificacao: true },

  // Pós-venda - Assistência Técnica
  { key: 'aguardando_abertura_at', label: 'Aguardando Abertura de AT', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', quadroSlug: 'pos_venda_assistencia_tecnica', exigeQualificacao: true },
  { key: 'at_aberta', label: 'AT Aberta', cor: '#ef4444', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', quadroSlug: 'pos_venda_assistencia_tecnica', exigeQualificacao: true },
  { key: 'at_finalizada', label: 'Finalizada', cor: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_assistencia_tecnica', exigeQualificacao: true },
  { key: 'pos_venda_concluido', label: 'Pós-venda', cor: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', quadroSlug: 'pos_venda_assistencia_tecnica', exigeQualificacao: true, tipoEstagio: 'ganho' },
]

export const ORIGEM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  indicacao: 'Indicação',
  site_google: 'Site / Google',
  construtora: 'Construtora',
  showroom: 'Showroom',
  arquiteto: 'Especificador',
  outro: 'Outro',
}

// Slug da origem "Especificador" (OrigemLead.ARQUITETO no backend)
export const ORIGEM_ESPECIFICADOR = 'arquiteto'

// Slug da origem "Outro" (OrigemLead.OUTRO no backend), que exige descrever a origem
export const ORIGEM_OUTRO = 'outro'

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Sem contato'
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Ontem'
  return `${days}d atrás`
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// === ESPECIFICADORES (Fase 5 / R4) ===

export const TIPO_ESPECIFICADOR_LABELS: Record<string, string> = {
  arquiteto: 'Arquiteto',
  designer_interiores: 'Designer de Interiores',
  decorador: 'Decorador',
  engenheiro: 'Engenheiro',
  corretor: 'Corretor',
  outro: 'Outro',
}

export const TIPO_ESPECIFICADOR_COLORS: Record<string, string> = {
  arquiteto: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  designer_interiores: 'bg-purple-50 text-purple-700 border-purple-200',
  decorador: 'bg-pink-50 text-pink-700 border-pink-200',
  engenheiro: 'bg-blue-50 text-blue-700 border-blue-200',
  corretor: 'bg-amber-50 text-amber-700 border-amber-200',
  outro: 'bg-stone-50 text-stone-700 border-stone-200',
}

export const NIVEL_PARCERIA_LABELS: Record<string, string> = {
  parceiro: 'Parceiro',
  premium: 'Premium',
  vip: 'VIP',
}

export const NIVEL_PARCERIA_COLORS: Record<string, string> = {
  parceiro: 'bg-stone-100 text-stone-700 border-stone-200',
  premium: 'bg-blue-50 text-blue-700 border-blue-200',
  vip: 'bg-amber-50 text-amber-700 border-amber-300',
}

export interface StatusCarteiraConfig {
  label: string
  bg: string
  border: string
  text: string
}

export const STATUS_CARTEIRA_CONFIG: Record<string, StatusCarteiraConfig> = {
  ativo: {
    label: 'Ativo',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  em_prospeccao: {
    label: 'Em Prospecção',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  inativo: {
    label: 'Inativo',
    bg: 'bg-stone-100',
    border: 'border-stone-200',
    text: 'text-stone-600',
  },
}

export interface SegmentoConfig {
  label: string
  desc: string
  color: string
  bg: string
  text: string
  border: string
}

export const SEGMENTO_CONFIG: Record<string, SegmentoConfig> = {
  campeao: {
    label: 'Campeão',
    desc: 'Score geral superior a 85 pontos com alta recorrência',
    color: 'purple',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  parceiro_fiel: {
    label: 'Parceiro Fiel',
    desc: 'Alta lealdade e recorrência de projetos sustentada',
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  em_ascensao: {
    label: 'Em Ascensão',
    desc: 'Forte pipeline futuro e potencial de crescimento',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  novo_promissor: {
    label: 'Novo Promissor',
    desc: 'Cadastrado há menos de 90 dias com projetos ativos',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  ocasional: {
    label: 'Ocasional',
    desc: 'Indicações esporádicas de projetos no ano',
    color: 'yellow',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  em_risco: {
    label: 'Em Risco',
    desc: 'Mais de 180 dias sem novos projetos registrados',
    color: 'rose',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  inativo: {
    label: 'Inativo',
    desc: 'Sem projetos nos últimos 12 meses',
    color: 'stone',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
  },
}

export interface FlagConfig {
  label: string
  desc: string
  color: string
  bg: string
  text: string
  border: string
}

export const FLAG_CONFIG: Record<string, FlagConfig> = {
  top_indicador: {
    label: 'Top Indicador',
    desc: 'Maior gerador de volume contratual nos últimos 12 meses',
    color: 'purple',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  em_risco_de_perda: {
    label: 'Em Risco de Perda',
    desc: 'Concorrência agressiva ou estagnação crítica',
    color: 'rose',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  alto_potencial: {
    label: 'Alto Potencial',
    desc: 'Pipeline robusto com alto valor prospectado',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  indicacao_alto_valor: {
    label: 'Indicação Alto Valor',
    desc: 'Ticket médio de projetos expressivo',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  especificador_esfriando: {
    label: 'Esfriando',
    desc: 'Sem contato comercial recente (>180 dias)',
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
}

export const TIPO_INTERACAO_ARQUITETO_LABELS: Record<string, string> = {
  ligacao: 'Ligação Telefônica',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita_escritorio: 'Visita ao Escritório',
  visita_loja: 'Visita à Loja / Showroom',
  reuniao: 'Reunião Presencial/Online',
  evento: 'Evento / Workshop',
  viagem: 'Viagem / Feira',
  envio_brinde: 'Envio de Brinde / Catálogo',
}

export interface RiscoConcorrenciaConfig {
  label: string
  color: string
  bg: string
  text: string
  border: string
}

export const RISCO_CONCORRENCIA_CONFIG: Record<string, RiscoConcorrenciaConfig> = {
  baixo: {
    label: 'Baixo Risco',
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  medio: {
    label: 'Médio Risco',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  alto: {
    label: 'Alto Risco',
    color: 'rose',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
}

