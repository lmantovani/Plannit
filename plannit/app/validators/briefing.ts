import vine from '@vinejs/vine'

export const ambienteInputSchema = vine.object({
  tipo: vine.string().trim().minLength(1),
  descricao: vine.string().trim().nullable().optional(),
  medidasPreliminares: vine.string().trim().nullable().optional(),
  observacoesEspecificas: vine.string().trim().nullable().optional(),
})

export const saveBriefingValidator = vine.create({
  cidadeObra: vine.string().trim().maxLength(100).nullable().optional(),
  estadoObra: vine.string().trim().maxLength(2).nullable().optional(),
  enderecoObra: vine.string().trim().maxLength(300).nullable().optional(),
  ambientes: vine.array(vine.string().trim()).optional(),
  prazoDesejado: vine.string().trim().nullable().optional(),
  faixaInvestimentoMin: vine.number().nullable().optional(),
  faixaInvestimentoMax: vine.number().nullable().optional(),
  estiloPreferido: vine.string().trim().maxLength(100).nullable().optional(),
  observacoes: vine.string().trim().nullable().optional(),
  referenciasUrl: vine.array(vine.string().trim()).optional(),
  arquitetoId: vine.number().positive().nullable().optional(),
  arquitetoNome: vine.string().trim().maxLength(200).nullable().optional(),
  arquitetoEmail: vine.string().trim().email().nullable().optional(),
  arquitetoTelefone: vine.string().trim().maxLength(30).nullable().optional(),
  ambientesDetalhados: vine.array(ambienteInputSchema).optional(),
})

export const calcularScoreValidator = vine.create({
  cidadeObra: vine.string().trim().maxLength(100).nullable().optional(),
  estadoObra: vine.string().trim().maxLength(2).nullable().optional(),
  enderecoObra: vine.string().trim().maxLength(300).nullable().optional(),
  ambientes: vine.array(vine.string().trim()).optional(),
  prazoDesejado: vine.string().trim().nullable().optional(),
  faixaInvestimentoMin: vine.number().nullable().optional(),
  faixaInvestimentoMax: vine.number().nullable().optional(),
  estiloPreferido: vine.string().trim().maxLength(100).nullable().optional(),
  observacoes: vine.string().trim().nullable().optional(),
  referenciasUrl: vine.array(vine.string().trim()).optional(),
  arquitetoId: vine.number().positive().nullable().optional(),
  arquitetoNome: vine.string().trim().maxLength(200).nullable().optional(),
  arquitetoEmail: vine.string().trim().email().nullable().optional(),
  arquitetoTelefone: vine.string().trim().maxLength(30).nullable().optional(),
  ambientesDetalhados: vine.array(ambienteInputSchema).optional(),
  scoreMinimo: vine.number().positive().optional(),
})
