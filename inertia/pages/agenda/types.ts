export interface TipoCompromisso {
  id: number
  nome: string
  slug: string
  cor: string
  isActive?: boolean
  ordem?: number
}

export interface Colaborador {
  id: number
  nome: string
  email: string
  perfil: string
}

export interface LeadResumo {
  id: number
  nome: string
  telefone?: string | null
  cidade?: string | null
}

export interface ClienteResumo {
  id: number
  nome: string
}

export interface ProjetoResumo {
  id: number
  codigo: string
  nome?: string
}

export type StatusCompromissoType = 'agendado' | 'concluido' | 'cancelado' | 'reagendado'

export interface Compromisso {
  id: number
  titulo: string
  tipoId: number
  dataHoraInicio: string
  dataHoraFim: string
  local: string | null
  status: StatusCompromissoType
  observacoes: string | null
  desfecho: string | null
  responsavelId: number
  criadoPorId: number
  leadId: number | null
  clienteId: number | null
  projetoId: number | null
  createdAt?: string
  updatedAt?: string
  isAtrasado?: boolean
  isHoje?: boolean
  tipo?: TipoCompromisso | null
  responsavel?: Colaborador | null
  criadoPor?: Colaborador | null
  lead?: LeadResumo | null
  cliente?: ClienteResumo | null
  projeto?: ProjetoResumo | null
}

export interface AgendaFiltros {
  visao: 'minha' | 'equipe' | string
  responsavelId: number | null
  status?: string | null
  tipoId?: number | null
  leadId?: number | null
  clienteId?: number | null
  projetoId?: number | null
  dataInicio?: string
  dataFim?: string
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos' | string
  q?: string
}

export interface AgendaPageProps {
  compromissos: Compromisso[]
  tipos: TipoCompromisso[]
  colaboradores: Colaborador[]
  leads?: LeadResumo[]
  podeVerEquipe: boolean
  filtros: AgendaFiltros
}
