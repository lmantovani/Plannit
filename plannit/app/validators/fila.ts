import vine from '@vinejs/vine'

export const alocarProjetistaValidator = vine.create({
  projetistaId: vine.number().positive(),
  prioridade: vine.number().min(1).max(10).optional(),
  observacao: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const configurarWipValidator = vine.create({
  projetistaId: vine.number().positive(),
  wipLimit: vine.number().min(1).max(20),
})

export const mudarStatusProjetoValidator = vine.create({
  status: vine.string().trim().minLength(1).maxLength(50),
  observacao: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const arquivarProjetoValidator = vine.create({
  motivo: vine.string().trim().minLength(3).maxLength(1000),
})
