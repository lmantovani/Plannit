import vine from '@vinejs/vine'

export const criarProntuarioValidator = vine.create({
  descricao: vine.string().trim().minLength(2).maxLength(5000),
  categoria: vine.string().trim().maxLength(50).optional(),
  titulo: vine.string().trim().maxLength(150).nullable().optional(),
  importante: vine.boolean().optional(),
})

