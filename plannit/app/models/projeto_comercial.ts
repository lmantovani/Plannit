import { ProjetosComerciaiSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import User from '#models/user'

export enum StatusProjetoComercial {
  EM_DESENVOLVIMENTO = 'em_desenvolvimento',
  AGUARD_VALIDACAO_VENDEDOR = 'aguard_validacao_vendedor',
  APROVADO = 'aprovado',
  DEVOLVIDO = 'devolvido',
  EM_RENDER = 'em_render',
  FINALIZADO = 'finalizado',
}

export const STATUS_PROJETO_COMERCIAL_LABELS: Record<StatusProjetoComercial, string> = {
  [StatusProjetoComercial.EM_DESENVOLVIMENTO]: 'Em Desenvolvimento',
  [StatusProjetoComercial.AGUARD_VALIDACAO_VENDEDOR]: 'Aguardando Validação do Vendedor',
  [StatusProjetoComercial.APROVADO]: 'Aprovado pelo Vendedor',
  [StatusProjetoComercial.DEVOLVIDO]: 'Devolvido para Ajuste',
  [StatusProjetoComercial.EM_RENDER]: 'Em Renderização',
  [StatusProjetoComercial.FINALIZADO]: 'Render Concluído',
}

export default class ProjetoComercial extends ProjetosComerciaiSchema {
  static table = 'projetos_comerciais'

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @belongsTo(() => User, {
    foreignKey: 'validadoPorId',
  })
  declare validadoPor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'criadoPorId',
  })
  declare criadoPor: BelongsTo<typeof User>
}
