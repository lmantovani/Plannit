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
  valorContrato: number
  prazoEntregaEstimado: string | null
  vendedorNome: string
  projetistaNome: string
  createdAt: string
  scoreBriefing: number | null
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
