import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

const isoDateTimeRule = vine.createRule((value: unknown, _options, field: FieldContext) => {
  if (value === null || value === undefined || value === '') return
  if (typeof value !== 'string') {
    field.report('Data e hora devem ser uma string no formato ISO-8601', 'isoDateTime', field)
    return
  }
  const dt = DateTime.fromISO(value)
  if (!dt.isValid) {
    field.report('Data e hora informadas são inválidas', 'isoDateTime', field)
  }
})

export const createCompromissoValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(150),
  tipoId: vine
    .number()
    .positive()
    .exists({
      table: 'tipos_compromisso_catalogo',
      column: 'id',
      filter: (db) => {
        db.where('is_active', true)
      },
    }),
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()),
  local: vine.string().trim().maxLength(255).nullable().optional(),
  observacoes: vine.string().trim().maxLength(5000).nullable().optional(),
  responsavelId: vine
    .number()
    .positive()
    .exists({
      table: 'users',
      column: 'id',
      filter: (db) => {
        db.where('is_active', true)
      },
    })
    .optional(),
  leadId: vine
    .number()
    .positive()
    .exists({
      table: 'leads',
      column: 'id',
    })
    .nullable()
    .optional(),
  clienteId: vine
    .number()
    .positive()
    .exists({
      table: 'clientes',
      column: 'id',
    })
    .nullable()
    .optional(),
  projetoId: vine
    .number()
    .positive()
    .exists({
      table: 'projetos',
      column: 'id',
    })
    .nullable()
    .optional(),
})

createCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'titulo.required': 'Informe o título do compromisso.',
  'titulo.minLength': 'O título deve ter no mínimo 2 caracteres.',
  'titulo.maxLength': 'O título deve ter no máximo 150 caracteres.',
  'tipoId.required': 'Selecione o tipo de compromisso.',
  'tipoId.database.exists': 'Tipo de compromisso não encontrado ou inativo.',
  'dataHoraInicio.required': 'Informe a data e horário de início.',
  'dataHoraFim.required': 'Informe a data e horário de término.',
  'responsavelId.database.exists': 'Colaborador responsável não encontrado ou inativo.',
  'leadId.database.exists': 'Lead informado não encontrado.',
  'clienteId.database.exists': 'Cliente informado não encontrado.',
  'projetoId.database.exists': 'Projeto informado não encontrado.',
})

export const updateCompromissoValidator = vine.create({
  titulo: vine.string().trim().minLength(2).maxLength(150).optional(),
  tipoId: vine
    .number()
    .positive()
    .exists({
      table: 'tipos_compromisso_catalogo',
      column: 'id',
      filter: (db) => {
        db.where('is_active', true)
      },
    })
    .optional(),
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()).optional(),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()).optional(),
  local: vine.string().trim().maxLength(255).nullable().optional(),
  observacoes: vine.string().trim().maxLength(5000).nullable().optional(),
  responsavelId: vine
    .number()
    .positive()
    .exists({
      table: 'users',
      column: 'id',
      filter: (db) => {
        db.where('is_active', true)
      },
    })
    .optional(),
  leadId: vine
    .number()
    .positive()
    .exists({
      table: 'leads',
      column: 'id',
    })
    .nullable()
    .optional(),
  clienteId: vine
    .number()
    .positive()
    .exists({
      table: 'clientes',
      column: 'id',
    })
    .nullable()
    .optional(),
  projetoId: vine
    .number()
    .positive()
    .exists({
      table: 'projetos',
      column: 'id',
    })
    .nullable()
    .optional(),
})

updateCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'titulo.minLength': 'O título deve ter no mínimo 2 caracteres.',
  'titulo.maxLength': 'O título deve ter no máximo 150 caracteres.',
  'tipoId.database.exists': 'Tipo de compromisso não encontrado ou inativo.',
  'responsavelId.database.exists': 'Colaborador responsável não encontrado ou inativo.',
  'leadId.database.exists': 'Lead informado não encontrado.',
  'clienteId.database.exists': 'Cliente informado não encontrado.',
  'projetoId.database.exists': 'Projeto informado não encontrado.',
})

export const reagendarCompromissoValidator = vine.create({
  dataHoraInicio: vine.string().trim().use(isoDateTimeRule()),
  dataHoraFim: vine.string().trim().use(isoDateTimeRule()),
  observacoes: vine.string().trim().maxLength(2000).nullable().optional(),
})

reagendarCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'dataHoraInicio.required': 'Informe a nova data e horário de início.',
  'dataHoraFim.required': 'Informe a nova data e horário de término.',
})

export const cancelarCompromissoValidator = vine.create({
  motivo: vine.string().trim().minLength(3).maxLength(1000).optional(),
  observacoes: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const concluirCompromissoValidator = vine.create({
  desfecho: vine.string().trim().minLength(3).maxLength(5000),
})

concluirCompromissoValidator.messagesProvider = new SimpleMessagesProvider({
  'desfecho.required': 'Informe o desfecho do compromisso para concluí-lo.',
  'desfecho.minLength': 'O desfecho deve ter pelo menos 3 caracteres.',
})
