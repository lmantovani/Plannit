import { HandoffSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import User from '#models/user'

/**
 * 8 Itens Obrigatórios do Handoff Técnico (Passagem Comercial -> Técnico - RN006)
 */
export const ITENS_OBRIGATORIOS_HANDOFF = [
  { id: 'contrato_assinado', label: 'Contrato Assinado pelo Cliente', categoria: 'Jurídico' },
  { id: 'caderno_comercial', label: 'Caderno Comercial de Ambientes Aprovado', categoria: 'Comercial' },
  { id: 'plantas_arquitetonicas', label: 'Plantas Arquitetônicas & Paginação', categoria: 'Técnico' },
  { id: 'fotos_ambiente', label: 'Fotos do Local / Ambiente da Obra', categoria: 'Técnico' },
  { id: 'briefing_completo', label: 'Briefing Inteligente Completo & Qualificado', categoria: 'Briefing' },
  { id: 'aprovacao_financeira', label: 'Aprovação Cadastral & Financeira Concluída', categoria: 'Financeiro' },
  { id: 'pedido_gerado', label: 'Pedido de Venda Gerado & Codificado', categoria: 'Comercial' },
  { id: 'dados_obra', label: 'Dados de Obra Confirmados (Endereço, Acesso, Restrições)', categoria: 'Logística' },
] as const

export type ItemHandoffId = (typeof ITENS_OBRIGATORIOS_HANDOFF)[number]['id']

const jsonPrepareConsume = {
  prepare: (value: any) => (value !== null && value !== undefined ? JSON.stringify(value) : null),
  consume: (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  },
}

export default class Handoff extends HandoffSchema {
  static table = 'handoffs'

  @column(jsonPrepareConsume)
  declare checklistJson: Record<string, boolean> & any

  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  @belongsTo(() => User, {
    foreignKey: 'liberadoPorId',
  })
  declare liberadoPor: BelongsTo<typeof User>
}
