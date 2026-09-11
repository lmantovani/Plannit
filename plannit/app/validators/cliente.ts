import vine from '@vinejs/vine'

/**
 * Validador para criação de novo cliente
 */
export const createClienteValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(3).maxLength(200),
    cpfCnpj: vine.string().trim().maxLength(30).optional(),
    telefone: vine.string().trim().minLength(8).maxLength(30),
    email: vine.string().trim().email().maxLength(200).optional(),
    tipo: vine.enum(['pessoa_fisica', 'pessoa_juridica']).optional(),
    rgIe: vine.string().trim().maxLength(30).optional(),
    profissaoRamo: vine.string().trim().maxLength(150).optional(),
    observacoes: vine.string().trim().optional(),
    arquitetoId: vine.number().positive().optional(),

    // Endereço principal inicial (opcional na criação direta)
    endereco: vine
      .object({
        tipo: vine.enum(['montagem', 'entrega', 'cobranca', 'residencial', 'comercial']).optional(),
        identificacao: vine.string().trim().maxLength(100).optional(),
        cep: vine.string().trim().maxLength(15).optional(),
        logradouro: vine.string().trim().minLength(2).maxLength(255),
        numero: vine.string().trim().minLength(1).maxLength(50),
        complemento: vine.string().trim().maxLength(150).optional(),
        bairro: vine.string().trim().maxLength(100).optional(),
        cidade: vine.string().trim().minLength(2).maxLength(100),
        estado: vine.string().trim().maxLength(2).optional(),
        pontoReferencia: vine.string().trim().optional(),
      })
      .optional(),
  })
)

/**
 * Validador para atualização de cliente existente
 */
export const updateClienteValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(3).maxLength(200).optional(),
    cpfCnpj: vine.string().trim().maxLength(30).optional(),
    telefone: vine.string().trim().minLength(8).maxLength(30).optional(),
    email: vine.string().trim().email().maxLength(200).optional(),
    tipo: vine.enum(['pessoa_fisica', 'pessoa_juridica']).optional(),
    rgIe: vine.string().trim().maxLength(30).optional(),
    profissaoRamo: vine.string().trim().maxLength(150).optional(),
    observacoes: vine.string().trim().optional(),
    arquitetoId: vine.number().positive().nullable().optional(),
  })
)

/**
 * Validador para novo endereço de cliente
 */
export const createEnderecoValidator = vine.compile(
  vine.object({
    tipo: vine.enum(['montagem', 'entrega', 'cobranca', 'residencial', 'comercial']),
    identificacao: vine.string().trim().maxLength(100).optional(),
    cep: vine.string().trim().maxLength(15).optional(),
    logradouro: vine.string().trim().minLength(2).maxLength(255),
    numero: vine.string().trim().minLength(1).maxLength(50),
    complemento: vine.string().trim().maxLength(150).optional(),
    bairro: vine.string().trim().maxLength(100).optional(),
    cidade: vine.string().trim().minLength(2).maxLength(100),
    estado: vine.string().trim().maxLength(2).optional(),
    pontoReferencia: vine.string().trim().optional(),
    isPrincipal: vine.boolean().optional(),
  })
)