export interface EnderecoClienteData {
  id: number
  clienteId: number
  tipo: 'montagem' | 'entrega' | 'cobranca' | 'residencial' | 'comercial'
  identificacao: string | null
  cep: string | null
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  pontoReferencia: string | null
  isPrincipal: boolean
  createdAt: string
}

export interface ProjetoClienteData {
  id: number
  codigo: string
  status: string
  statusLabel?: string
  valorContrato: number
  prazoEntregaEstimado: string | null
  vendedorNome: string
  projetistaNome: string
  createdAt: string
  briefingId?: number | null
  statusBriefing?: string | null
  ambientesBriefing?: string[]
  scoreBriefing: number | null
  leadId?: number | null
}

export interface ProntuarioItem {
  id: number
  categoria: 'pessoal' | 'familia' | 'pet' | 'hobby' | 'preferencia' | 'atendimento' | string
  titulo: string | null
  descricao: string
  importante: boolean
  autorNome: string
  leadId?: number | null
  createdAt: string
}

export interface ClienteData {
  id: number
  nome: string
  cpfCnpj: string | null
  telefone: string
  email: string | null
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  rgIe: string | null
  profissaoRamo: string | null
  observacoes: string | null
  arquitetoId: number | null
  cadastroAprovado: boolean
  cadastroAprovadoEm: string | null
  cadastroAprovadoPor: number | null
  isActive: boolean
  createdAt: string
  totalProjetos?: number
  enderecos?: EnderecoClienteData[]
  projetos?: ProjetoClienteData[]
  prontuarios?: ProntuarioItem[]
  arquiteto?: {
    id: number
    nome: string
    escritorio: string | null
  } | null
  aprovadoPor?: {
    id: number
    nome: string
  } | null
  resumoCompras?: {
    totalProjetos: number
    projetosContratados?: number
    projetosEmBriefing?: number
    valorTotalComprado: number
    projetosAtivos: number
  }
}

export interface ClientesKpiData {
  totalClientes: number
  aprovados: number
  pendentesAprovacao: number
  pessoaJuridica: number
}

export interface CategoriaProntuarioCatalogoItem {
  id: number
  nome: string
  slug: string
  cor: string
  icone: string | null
  ordem?: number
}
