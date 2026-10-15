import vine from '@vinejs/vine'

export const createDepartamentoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150),
  ativo: vine.boolean().optional(),
})

export const updateDepartamentoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150).optional(),
  ativo: vine.boolean().optional(),
})

export const createCargoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150),
  departamentoId: vine.number().positive(),
  ativo: vine.boolean().optional(),
})

export const updateCargoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150).optional(),
  departamentoId: vine.number().positive().optional(),
  ativo: vine.boolean().optional(),
})

export const createColaboradorValidator = vine.create({
  userId: vine.number().positive().nullable().optional(),
  nome: vine.string().trim().minLength(2).maxLength(200),
  cpf: vine.string().trim().minLength(11).maxLength(14),
  rg: vine.string().trim().maxLength(20).nullable().optional(),
  dataNascimento: vine.string().trim().nullable().optional(),
  sexo: vine.string().trim().maxLength(20).nullable().optional(),
  estadoCivil: vine.string().trim().maxLength(30).nullable().optional(),
  fotoUrl: vine.string().trim().maxLength(500).nullable().optional(),

  // Perfil comportamental DISC
  perfilDiscPrimario: vine.enum(['dominante', 'influente', 'estavel', 'cauteloso']).nullable().optional(),
  perfilDiscSecundario: vine.enum(['dominante', 'influente', 'estavel', 'cauteloso']).nullable().optional(),
  observacoesComportamentais: vine.string().trim().maxLength(2000).nullable().optional(),

  // Contatos
  telefonePessoal: vine.string().trim().maxLength(20).nullable().optional(),
  telefoneCorporativo: vine.string().trim().maxLength(20).nullable().optional(),
  emailPessoal: vine.string().email().nullable().optional(),
  emailCorporativo: vine.string().email().nullable().optional(),

  // Endereço
  enderecoLogradouro: vine.string().trim().maxLength(300).nullable().optional(),
  enderecoNumero: vine.string().trim().maxLength(20).nullable().optional(),
  enderecoComplemento: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoBairro: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoCidade: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoEstado: vine.string().trim().maxLength(2).nullable().optional(),
  enderecoCep: vine.string().trim().maxLength(10).nullable().optional(),

  // Contratação
  dataAdmissao: vine.string().trim(),
  cargoId: vine.number().positive(),
  departamentoId: vine.number().positive(),
  regime: vine.enum(['clt', 'pj']).optional(),
  tipoContrato: vine.string().trim().maxLength(100).nullable().optional(),

  // PJ (condicional)
  pjCnpj: vine.string().trim().maxLength(20).nullable().optional(),
  pjContratoUrl: vine.string().trim().maxLength(500).nullable().optional(),
  pjValorMensal: vine.number().min(0).nullable().optional(),
  pjVigenciaInicio: vine.string().trim().nullable().optional(),
  pjVigenciaFim: vine.string().trim().nullable().optional(),

  // Remuneração Inicial (Admissão)
  salarioClt: vine.number().min(0).nullable().optional(),
  remuneracaoComplementar: vine.number().min(0).nullable().optional(),
  dataVigenciaSalario: vine.string().trim().nullable().optional(),

  // Regime de trabalho
  cargaHoraria: vine.string().trim().maxLength(50).nullable().optional(),
  escala: vine.string().trim().maxLength(100).nullable().optional(),
  modalidade: vine.enum(['presencial', 'hibrido', 'remoto']).optional(),
  jornadaEspecial: vine.string().trim().maxLength(200).nullable().optional(),

  // Dados bancários
  banco: vine.string().trim().maxLength(100).nullable().optional(),
  agencia: vine.string().trim().maxLength(20).nullable().optional(),
  conta: vine.string().trim().maxLength(20).nullable().optional(),
  tipoConta: vine.string().trim().maxLength(20).nullable().optional(),

  // Organograma
  gestorId: vine.number().positive().nullable().optional(),
})

export const updateColaboradorValidator = vine.create({
  userId: vine.number().positive().nullable().optional(),
  nome: vine.string().trim().minLength(2).maxLength(200).optional(),
  rg: vine.string().trim().maxLength(20).nullable().optional(),
  dataNascimento: vine.string().trim().nullable().optional(),
  sexo: vine.string().trim().maxLength(20).nullable().optional(),
  estadoCivil: vine.string().trim().maxLength(30).nullable().optional(),
  fotoUrl: vine.string().trim().maxLength(500).nullable().optional(),

  // Perfil comportamental DISC
  perfilDiscPrimario: vine.enum(['dominante', 'influente', 'estavel', 'cauteloso']).nullable().optional(),
  perfilDiscSecundario: vine.enum(['dominante', 'influente', 'estavel', 'cauteloso']).nullable().optional(),
  observacoesComportamentais: vine.string().trim().maxLength(2000).nullable().optional(),

  // Contatos
  telefonePessoal: vine.string().trim().maxLength(20).nullable().optional(),
  telefoneCorporativo: vine.string().trim().maxLength(20).nullable().optional(),
  emailPessoal: vine.string().email().nullable().optional(),
  emailCorporativo: vine.string().email().nullable().optional(),

  // Endereço
  enderecoLogradouro: vine.string().trim().maxLength(300).nullable().optional(),
  enderecoNumero: vine.string().trim().maxLength(20).nullable().optional(),
  enderecoComplemento: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoBairro: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoCidade: vine.string().trim().maxLength(100).nullable().optional(),
  enderecoEstado: vine.string().trim().maxLength(2).nullable().optional(),
  enderecoCep: vine.string().trim().maxLength(10).nullable().optional(),

  // Contratação (dados cadastrais gerais)
  regime: vine.enum(['clt', 'pj']).optional(),
  tipoContrato: vine.string().trim().maxLength(100).nullable().optional(),

  // PJ
  pjCnpj: vine.string().trim().maxLength(20).nullable().optional(),
  pjContratoUrl: vine.string().trim().maxLength(500).nullable().optional(),
  pjValorMensal: vine.number().min(0).nullable().optional(),
  pjVigenciaInicio: vine.string().trim().nullable().optional(),
  pjVigenciaFim: vine.string().trim().nullable().optional(),

  // Regime de trabalho
  cargaHoraria: vine.string().trim().maxLength(50).nullable().optional(),
  escala: vine.string().trim().maxLength(100).nullable().optional(),
  modalidade: vine.enum(['presencial', 'hibrido', 'remoto']).optional(),
  jornadaEspecial: vine.string().trim().maxLength(200).nullable().optional(),

  // Dados bancários
  banco: vine.string().trim().maxLength(100).nullable().optional(),
  agencia: vine.string().trim().maxLength(20).nullable().optional(),
  conta: vine.string().trim().maxLength(20).nullable().optional(),
  tipoConta: vine.string().trim().maxLength(20).nullable().optional(),

  // Organograma
  gestorId: vine.number().positive().nullable().optional(),
})

// RH-RN009: Lançamento de Histórico Salarial Imutável
export const historicoSalarialValidator = vine.create({
  salarioClt: vine.number().min(0),
  remuneracaoComplementar: vine.number().min(0).nullable().optional(),
  dataVigencia: vine.string().trim(),
  motivo: vine.string().trim().minLength(3).maxLength(300),
})

// RH-RN009: Lançamento de Histórico de Cargos Imutável
export const historicoCargoValidator = vine.create({
  cargoNovoId: vine.number().positive(),
  data: vine.string().trim(),
  justificativa: vine.string().trim().maxLength(300).nullable().optional(),
})

// RH-RN009: Desligamento formal
export const desligamentoValidator = vine.create({
  dataDesligamento: vine.string().trim(),
  tipoDesligamento: vine.string().trim().maxLength(50),
  motivoDesligamento: vine.string().trim().maxLength(2000),
  entrevistaSaida: vine.string().trim().maxLength(3000).nullable().optional(),
})

// Documentos
export const documentoValidator = vine.create({
  tipo: vine.enum(['ctps', 'aso_admissional', 'contrato_assinado', 'exame_periodico', 'certidao', 'pis_pasep', 'outro']),
  url: vine.string().trim().maxLength(500),
  dataVencimento: vine.string().trim().nullable().optional(),
})
