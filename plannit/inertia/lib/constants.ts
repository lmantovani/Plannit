export interface FunilEtapa {
  key: string
  label: string
  cor: string
  bg: string
  border: string
  text: string
}

export const FUNIL_ETAPAS: FunilEtapa[] = [
  { key: 'novo_lead', label: 'Novo Lead', cor: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { key: 'qualificando', label: 'Qualificando', cor: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { key: 'em_visita', label: 'Em Visita', cor: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { key: 'em_briefing', label: 'Em Briefing', cor: '#a66a12', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  { key: 'em_projeto', label: 'Em Projeto', cor: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { key: 'fechado', label: 'Fechado', cor: '#16a34a', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { key: 'perdido', label: 'Perdido', cor: '#dc2626', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
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

