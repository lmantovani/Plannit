import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

/**
 * Regra R3: Cada ambiente deve ter no mínimo 2 caracteres.
 * Se a opção "Outro" for selecionada, exige campo de texto descritivo obrigatório
 * (ex: "Outro: Adega Climatizada"), rejeitando "Outro" isolado ou com descrição em branco.
 */
const ambienteValidoRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (typeof value !== 'string') return
  const val = value.trim()
  if (val.length < 2) {
    field.report('O ambiente selecionado deve ter no mínimo 2 caracteres', 'ambienteValido', field)
    return
  }
  if (val.toLowerCase() === 'outro' || val.toLowerCase() === 'outro:') {
    field.report(
      'A opção "Outro" exige uma descrição obrigatória (ex: "Outro: Adega Climatizada")',
      'ambienteValido',
      field
    )
    return
  }
  if (val.toLowerCase().startsWith('outro:')) {
    const desc = val.slice(6).trim()
    if (desc.length < 2) {
      field.report(
        'A descrição do ambiente "Outro" deve conter no mínimo 2 caracteres',
        'ambienteValido',
        field
      )
      return
    }
  }
})

export const createLeadValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200),
  telefone: vine.string().trim().minLength(8).maxLength(30),
  email: vine.string().email().optional(),
  cidade: vine.string().trim().maxLength(100).optional(),
  estado: vine.string().trim().maxLength(2).optional(),
  origem: vine.string().trim().maxLength(100).optional(),
  campanha: vine.string().trim().maxLength(200).optional(),
  vendedorId: vine.number().positive().optional(),
})

export const updateLeadValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200).optional(),
  telefone: vine.string().trim().minLength(8).maxLength(30).optional(),
  email: vine.string().email().nullable().optional(),
  cidade: vine.string().trim().maxLength(100).nullable().optional(),
  estado: vine.string().trim().maxLength(2).nullable().optional(),
  origem: vine.string().trim().maxLength(100).optional(),
  campanha: vine.string().trim().maxLength(200).nullable().optional(),
  vendedorId: vine.number().positive().nullable().optional(),
})

export const updateStatusValidator = vine.create({
  statusFunil: vine.enum([
    'novo_lead',
    'qualificando',
    'em_visita',
    'em_briefing',
    'em_projeto',
    'em_fechamento',
    'fechado',
    'perdido',
    'desqualificado',
  ]),
  motivoPerda: vine.string().trim().minLength(3).maxLength(1000).optional(),
  concorrentePerdido: vine.string().trim().maxLength(200).optional(),
})

export const perderLeadValidator = vine.create({
  motivoPerda: vine.string().trim().minLength(3).maxLength(1000),
  concorrentePerdido: vine.string().trim().maxLength(200).optional(),
})

export const interacaoValidator = vine.create({
  tipo: vine.enum(['whatsapp', 'ligacao', 'email', 'visita', 'reuniao']),
  resumo: vine.string().trim().minLength(2).maxLength(2000),
})

export const qualificarLeadValidator = vine.create({
  faixaOrcamento: vine.enum([
    'ate_80k',
    '80k_150k',
    '150k_300k',
    '300k_500k',
    'acima_500k',
    'ate_40k',
    '40k_80k',
    'acima_300k',
  ]),
  prazoObra: vine.enum([
    'pronto_imediato',
    'ate_3_meses',
    'ate_6_meses',
    'mais_12_meses',
    'venda_futura_18m',
  ]),
  tipoImovel: vine.enum(['apartamento', 'casa_condominio', 'casa_rua', 'comercial']),
  ambientesInteresse: vine
    .array(vine.string().trim().minLength(2).maxLength(100).use(ambienteValidoRule()))
    .minLength(1),
  orcamentoEstimado: vine.number().positive().nullable().optional(),
  possuiArquiteto: vine.boolean().optional(),
  arquitetoId: vine.number().positive().nullable().optional(),
  decisorPresente: vine.boolean().optional(),
  observacoes: vine.string().trim().maxLength(2000).nullable().optional(),
})

export const desqualificarLeadValidator = vine.create({
  motivoDesqualificacao: vine.string().trim().minLength(5).maxLength(1000),
})
