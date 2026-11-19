import vine from '@vinejs/vine'

export const entrarFilaValidator = vine.create({
  vendedorId: vine.number().positive().optional(),
})

export const mudarDisponibilidadeValidator = vine.create({
  status: vine.enum(['disponivel', 'ocupado_interno', 'pausa', 'ausente'] as const),
  motivoIndisponibilidade: vine.string().trim().maxLength(255).nullable().optional(),
})

export const reordenarFilaValidator = vine.create({
  direcao: vine.enum(['up', 'down', 'top', 'bottom'] as const).optional(),
  novaPosicao: vine.number().positive().optional(),
  motivo: vine.string().trim().maxLength(255).nullable().optional(),
})

export const iniciarAtendimentoValidator = vine.create({
  vendedorId: vine.number().positive(),
  tipoAtendimento: vine.enum([
    'porta_novo',
    'retorno_carteira',
    'indicacao_especificador',
    'agendado',
    'outro',
  ] as const),
  clienteId: vine.number().positive().nullable().optional(),
  clienteNome: vine.string().trim().maxLength(180).nullable().optional(),
  clienteTelefone: vine.string().trim().maxLength(40).nullable().optional(),
  arquitetoId: vine.number().positive().nullable().optional(),
  motivoPulo: vine
    .enum([
      'cliente_procurou_vendedor',
      'parceiro_especificador',
      'vendedor_recusou',
      'vendedor_ocupado_briefing',
      'outro',
    ] as const)
    .nullable()
    .optional(),
  justificativaPulo: vine.string().trim().maxLength(1000).nullable().optional(),
  observacao: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const concluirAtendimentoValidator = vine.create({
  desfecho: vine.enum([
    'gerou_orcamento',
    'gerou_lead',
    'retorno_agendado',
    'nao_evoluiu',
    'outro',
  ] as const),
  observacao: vine.string().trim().maxLength(1000).nullable().optional(),
  criarLeadNoCrm: vine.boolean().optional(),
  clienteId: vine.number().positive().nullable().optional(),
  clienteNome: vine.string().trim().maxLength(180).nullable().optional(),
  clienteTelefone: vine.string().trim().maxLength(40).nullable().optional(),
})
