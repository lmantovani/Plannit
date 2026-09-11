import vine from '@vinejs/vine'

/**
 * Validador para salvar/atualizar Fechamento Comercial & Contrato
 */
export const salvarFechamentoValidator = vine.compile(
  vine.object({
    contratoUrl: vine.string().trim().maxLength(500).optional(),
    cadernoComercialUrl: vine.string().trim().maxLength(500).optional(),
    valorTotalFechamento: vine.number().positive().optional(),
    dataLimiteAssinatura: vine.string().trim().optional(),
    contratoAssinado: vine.boolean().optional(),
    parcelas: vine
      .array(
        vine.object({
          numero: vine.number().positive(),
          valor: vine.number().positive(),
          vencimento: vine.string().trim(),
          formaPagamento: vine.string().trim().optional(),
          observacoes: vine.string().trim().optional(),
        })
      )
      .optional(),
  })
)

/**
 * Validador para liquidação/pagamento de parcela financeira
 */
export const liquidarParcelaValidator = vine.compile(
  vine.object({
    formaPagamento: vine.string().trim().minLength(2).maxLength(50),
    dataPagamento: vine.string().trim().optional(),
    comprovanteUrl: vine.string().trim().maxLength(500).optional(),
    observacoes: vine.string().trim().optional(),
  })
)

/**
 * Validador para atualização do Checklist de Handoff Técnico (RN006)
 */
export const salvarHandoffValidator = vine.compile(
  vine.object({
    checklist: vine.record(vine.boolean()),
    observacoes: vine.string().trim().optional(),
  })
)
