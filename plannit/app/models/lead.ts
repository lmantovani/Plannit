import { LeadSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import InteracaoLead from '#models/interacao_lead'
import Arquiteto from '#models/arquiteto'

export enum OrigemLead {
  INSTAGRAM = 'instagram',
  INDICACAO = 'indicacao',
  SITE_GOOGLE = 'site_google',
  CONSTRUTORA = 'construtora',
  SHOWROOM = 'showroom',
  ARQUITETO = 'arquiteto',
  OUTRO = 'outro',
}

export enum StatusFunil {
  NOVO_LEAD = 'novo_lead',
  QUALIFICANDO = 'qualificando',
  EM_VISITA = 'em_visita',
  EM_BRIEFING = 'em_briefing',
  EM_PROJETO = 'em_projeto',
  EM_FECHAMENTO = 'em_fechamento',
  FECHADO = 'fechado',
  PERDIDO = 'perdido',
  DESQUALIFICADO = 'desqualificado',
}

export const STATUS_FUNIL_LABELS: Record<StatusFunil, string> = {
  [StatusFunil.NOVO_LEAD]: 'Novo Lead',
  [StatusFunil.QUALIFICANDO]: 'Qualificando',
  [StatusFunil.EM_VISITA]: 'Em Visita',
  [StatusFunil.EM_BRIEFING]: 'Em Briefing',
  [StatusFunil.EM_PROJETO]: 'Em Projeto',
  [StatusFunil.EM_FECHAMENTO]: 'Em Fechamento',
  [StatusFunil.FECHADO]: 'Fechado',
  [StatusFunil.PERDIDO]: 'Perdido',
  [StatusFunil.DESQUALIFICADO]: 'Desqualificado',
}

export const ORIGEM_LEAD_LABELS: Record<OrigemLead, string> = {
  [OrigemLead.INSTAGRAM]: 'Instagram',
  [OrigemLead.INDICACAO]: 'Indicação',
  [OrigemLead.SITE_GOOGLE]: 'Site / Google',
  [OrigemLead.CONSTRUTORA]: 'Construtora',
  [OrigemLead.SHOWROOM]: 'Showroom',
  [OrigemLead.ARQUITETO]: 'Especificador',
  [OrigemLead.OUTRO]: 'Outro',
}

export default class Lead extends LeadSchema {
  static table = 'leads'

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @hasMany(() => InteracaoLead, {
    foreignKey: 'leadId',
  })
  declare interacoes: HasMany<typeof InteracaoLead>

  @belongsTo(() => Arquiteto, {
    foreignKey: 'arquitetoId',
  })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  get diasSemInteracao(): number {
    const ref = this.ultimaInteracaoEm || this.createdAt
    if (!ref) return 0
    const diff = DateTime.now().diff(ref, 'days')
    return Math.max(0, Math.floor(diff.days))
  }

  get precisaAtencao(): boolean {
    if (
      this.statusFunil === StatusFunil.FECHADO ||
      this.statusFunil === StatusFunil.PERDIDO ||
      this.statusFunil === StatusFunil.DESQUALIFICADO
    ) {
      return false
    }
    return this.diasSemInteracao >= 3
  }
}
