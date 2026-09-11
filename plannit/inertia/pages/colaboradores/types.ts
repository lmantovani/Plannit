export interface DepartamentoOption {
  id: number
  nome: string
}

export interface CargoOption {
  id: number
  nome: string
  departamentoId: number
}

export interface GestorOption {
  id: number
  nome: string
}

export interface ColaboradorItem {
  id: number
  nome: string
  cpf: string
  rg?: string | null
  emailCorporativo?: string | null
  telefoneCorporativo?: string | null
  fotoUrl?: string | null
  regime: 'clt' | 'pj'
  modalidade: 'presencial' | 'hibrido' | 'remoto'
  salarioClt?: number | null
  remuneracaoComplementar?: number | null
  pjValorMensal?: number | null
  dataAdmissao?: string | null
  isActive: boolean
  dataDesligamento?: string | null
  tipoDesligamento?: string | null
  perfilDiscPrimario?: string | null
  perfilDiscSecundario?: string | null
  cargo?: { id: number; nome: string } | null
  departamento?: { id: number; nome: string } | null
  gestor?: { id: number; nome: string; emailCorporativo?: string | null } | null
}

export interface ColaboradorDetalhe extends ColaboradorItem {
  userId?: number | null
  cargoId?: number | null
  departamentoId?: number | null
  dataNascimento?: string | null
  sexo?: string | null
  estadoCivil?: string | null
  observacoesComportamentais?: string | null
  telefonePessoal?: string | null
  emailPessoal?: string | null
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoComplemento?: string | null
  enderecoBairro?: string | null
  enderecoCidade?: string | null
  enderecoEstado?: string | null
  enderecoCep?: string | null
  tipoContrato?: string | null
  pjCnpj?: string | null
  pjContratoUrl?: string | null
  pjVigenciaInicio?: string | null
  pjVigenciaFim?: string | null
  dataVigenciaSalario?: string | null
  cargaHoraria?: string | null
  escala?: string | null
  jornadaEspecial?: string | null
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  tipoConta?: string | null
  gestorId?: number | null
  motivoDesligamento?: string | null
  entrevistaSaida?: string | null
  subordinados: Array<{ id: number; nome: string; cargoNome?: string | null }>
  historicoSalarial: Array<{
    id: number
    salarioClt: number
    remuneracaoComplementar?: number | null
    dataVigencia: string
    motivo: string
    registradoPorNome: string
    createdAt?: string | null
  }>
  historicoCargos: Array<{
    id: number
    cargoAnteriorNome?: string | null
    cargoNovoNome: string
    cargoNovoId: number
    data: string
    justificativa?: string | null
    aprovadoPorNome: string
    createdAt?: string | null
  }>
  documentos: Array<{
    id: number
    tipo: string
    url: string
    dataVencimento?: string | null
    createdAt?: string | null
  }>
}

export interface HeadcountKpis {
  total: number
  ativos: number
  desligados: number
  clt: number
  pj: number
  presencial: number
  hibrido: number
  remoto: number
}
