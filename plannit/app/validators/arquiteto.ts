import vine from '@vinejs/vine'

export const createArquitetoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200),
  escritorio: vine.string().trim().maxLength(200).optional(),
  enderecoEscritorio: vine.string().trim().maxLength(300).optional(),
  telefone: vine.string().trim().maxLength(30).optional(),
  email: vine.string().email().optional(),
  nivelParceria: vine.enum(['parceiro', 'premium', 'vip']).optional(),
  tipo: vine
    .enum(['arquiteto', 'designer_interiores', 'decorador', 'engenheiro', 'corretor', 'outro'])
    .optional(),
  especialidade: vine.string().trim().maxLength(200).optional(),
  consultorId: vine.number().positive().nullable().optional(),
  statusCarteira: vine.enum(['ativo', 'em_prospeccao', 'inativo']).optional(),
})

export const updateArquitetoValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200).optional(),
  escritorio: vine.string().trim().maxLength(200).nullable().optional(),
  enderecoEscritorio: vine.string().trim().maxLength(300).nullable().optional(),
  telefone: vine.string().trim().maxLength(30).nullable().optional(),
  email: vine.string().email().nullable().optional(),
  nivelParceria: vine.enum(['parceiro', 'premium', 'vip']).optional(),
  tipo: vine
    .enum(['arquiteto', 'designer_interiores', 'decorador', 'engenheiro', 'corretor', 'outro'])
    .optional(),
  especialidade: vine.string().trim().maxLength(200).nullable().optional(),
  statusCarteira: vine.enum(['ativo', 'em_prospeccao', 'inativo']).optional(),
})

export const reatribuirDonoValidator = vine.create({
  consultorNovoId: vine.number().positive(),
  motivo: vine.string().trim().maxLength(1000).optional(),
})

export const decisorValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200),
  cargo: vine.string().trim().maxLength(100).optional(),
  telefone: vine.string().trim().maxLength(30).optional(),
  email: vine.string().email().optional(),
  observacoes: vine.string().trim().maxLength(1000).optional(),
  isPrincipal: vine.boolean().optional(),
})

export const updateDecisorValidator = vine.create({
  nome: vine.string().trim().minLength(2).maxLength(200).optional(),
  cargo: vine.string().trim().maxLength(100).nullable().optional(),
  telefone: vine.string().trim().maxLength(30).nullable().optional(),
  email: vine.string().email().nullable().optional(),
  observacoes: vine.string().trim().maxLength(1000).nullable().optional(),
  isPrincipal: vine.boolean().optional(),
})

export const concorrenteValidator = vine.create({
  nomeConcorrente: vine.string().trim().minLength(2).maxLength(200),
  percentualFechamentoEstimado: vine.number().min(0).max(100),
  observacoes: vine.string().trim().maxLength(1000).optional(),
})

export const updateConcorrenteValidator = vine.create({
  nomeConcorrente: vine.string().trim().minLength(2).maxLength(200).optional(),
  percentualFechamentoEstimado: vine.number().min(0).max(100).optional(),
  observacoes: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const interacaoArquitetoValidator = vine.create({
  tipo: vine.enum([
    'ligacao',
    'whatsapp',
    'email',
    'visita_escritorio',
    'visita_loja',
    'reuniao',
    'evento',
    'viagem',
    'envio_brinde',
  ]),
  resumo: vine.string().trim().minLength(2).maxLength(2000),
  leadId: vine.number().positive().nullable().optional(),
  data: vine.string().trim().optional(),
})

export const metaVisitasValidator = vine.create({
  consultorId: vine.number().positive(),
  metaVisitasMes: vine.number().min(0).max(1000),
})
