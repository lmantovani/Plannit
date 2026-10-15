import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

const isoDateOuNullRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (value === null || value === undefined || value === '') return
  if (typeof value !== 'string') {
    field.report('Data informada deve ser uma string', 'isoDateOuNull', field)
    return
  }
  const dt = DateTime.fromISO(value)
  if (!dt.isValid) {
    field.report('Data informada é inválida (esperado formato AAAA-MM-DD)', 'isoDateOuNull', field)
  }
})

const slugOpcionalRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (value === null || value === undefined || value === '') {
    field.mutate(null, field)
    return
  }
  if (typeof value !== 'string') {
    field.report('Identificador (slug) deve ser uma string', 'slugOpcional', field)
    return
  }
  const trimmed = value.trim()
  if (trimmed.length < 2) {
    field.report('O identificador (slug) deve conter pelo menos 2 caracteres', 'slugOpcional', field)
    return
  }
  field.mutate(trimmed, field)
})

export const createAmbienteValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100),
  categoria: vine.string().trim().maxLength(100).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const updateAmbienteValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100).optional(),
  categoria: vine.string().trim().maxLength(100).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const createOrigemValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const updateOrigemValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100).optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const createCampanhaValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150),
  dataInicio: vine.string().trim().use(isoDateOuNullRule()).nullable().optional(),
  dataFim: vine.string().trim().use(isoDateOuNullRule()).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const updateCampanhaValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(150).optional(),
  dataInicio: vine.string().trim().use(isoDateOuNullRule()).nullable().optional(),
  dataFim: vine.string().trim().use(isoDateOuNullRule()).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const createTipoCompromissoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  cor: vine.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const updateTipoCompromissoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100).optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  cor: vine.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const togglePermissaoValidator = vine.create({
  perfil: vine.string().trim().minLength(2).maxLength(50),
  permissaoCodigo: vine.string().trim().minLength(2).maxLength(100),
  concedido: vine.boolean(),
})

export const createPerfilValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  descricao: vine.string().trim().maxLength(255).nullable().optional(),
  copiarDePerfil: vine.string().trim().optional(),
  isActive: vine.boolean().optional(),
  ordem: vine.number().min(0).optional(),
})

export const updatePerfilValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(100).optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  descricao: vine.string().trim().maxLength(255).nullable().optional(),
  isActive: vine.boolean().optional(),
  ordem: vine.number().min(0).optional(),
})

export const createRoteiroValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(150),
  subtitulo: vine.string().trim().maxLength(255).nullable().optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  ambientes: vine.array(vine.string().trim()).optional(),
  secoes: vine.array(vine.any()).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const updateRoteiroValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(150).optional(),
  subtitulo: vine.string().trim().maxLength(255).nullable().optional(),
  slug: vine.string().trim().use(slugOpcionalRule()).nullable().optional(),
  ambientes: vine.array(vine.string().trim()).optional(),
  secoes: vine.array(vine.any()).optional(),
  ordem: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})



