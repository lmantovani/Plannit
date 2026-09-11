import vine from '@vinejs/vine'
import { StatusProjeto } from '#models/projeto'

/**
 * Validador para mudança de status de projeto com histórico imutável (RN017 / RN005)
 */
export const mudarStatusProjetoValidator = vine.compile(
  vine.object({
    status: vine.enum(Object.values(StatusProjeto)),
    observacao: vine.string().trim().optional(),
  })
)

/**
 * Validador para submissão de maquete/versão 3D pelo projetista
 */
export const submeterVersao3DValidator = vine.compile(
  vine.object({
    arquivoUrl: vine.string().trim().maxLength(500).optional(),
    descricaoAlteracao: vine.string().trim().optional(),
    renderUrls: vine.string().trim().optional(),
  })
)

/**
 * Validador para avaliação da versão 3D pelo vendedor (RN004)
 */
export const avaliarVersao3DValidator = vine.compile(
  vine.object({
    acao: vine.enum(['aprovar', 'devolver']),
    motivoDevolucao: vine.string().trim().optional(),
  })
)

/**
 * Validador para conclusão de render fotorrealista
 */
export const concluirRenderValidator = vine.compile(
  vine.object({
    renderUrls: vine.string().trim().minLength(3),
  })
)

/**
 * Validador para arquivamento com justificativa obrigatória (RN017)
 */
export const arquivarProjetoValidator = vine.compile(
  vine.object({
    motivo: vine.string().trim().minLength(5).maxLength(1000),
  })
)
