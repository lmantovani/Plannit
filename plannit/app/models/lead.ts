import { LeadSchema } from '#database/schema'
import { belongsTo, hasMany, column } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import InteracaoLead from '#models/interacao_lead'
import Arquiteto from '#models/arquiteto'
import HistoricoStatusLead from '#models/historico_status_lead'

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

export const FAIXA_ORCAMENTO_LABELS: Record<string, string> = {
  // Novas faixas R2
  ate_80k: 'Até R$ 80.000',
  '80k_150k': 'R$ 80.000 a R$ 150.000',
  '150k_300k': 'R$ 150.000 a R$ 300.000',
  '300k_500k': 'R$ 300.000 a R$ 500.000',
  acima_500k: 'Acima de R$ 500.000',

  // Compatibilidade com registros legados
  ate_40k: 'Até R$ 40.000',
  '40k_80k': 'R$ 40.000 a R$ 80.000',
  acima_300k: 'Acima de R$ 300.000 (Alto Padrão)',
}

export const PRAZO_OBRA_LABELS: Record<string, string> = {
  pronto_imediato: 'Imóvel pronto / Início imediato',
  ate_3_meses: 'Entrega em até 3 meses',
  ate_6_meses: 'Entrega em 3 a 6 meses',
  mais_12_meses: 'Entrega em mais de 12 meses',
  venda_futura_18m: 'Venda futura (acima de 18 meses)',
}

export const TIPO_IMOVEL_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  casa_condominio: 'Casa em Condomínio',
  casa_rua: 'Casa de Rua',
  comercial: 'Comercial / Corporativo',
}

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

export default class Lead extends LeadSchema {
  static table = 'leads'

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare statusAlteradoEm: DateTime | null

  @column(jsonPrepareConsume)
  declare ambientesInteresse: any | null

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'qualificadoPorId',
  })
  declare qualificadoPor: BelongsTo<typeof User>

  @hasMany(() => InteracaoLead, {
    foreignKey: 'leadId',
  })
  declare interacoes: HasMany<typeof InteracaoLead>

  @hasMany(() => HistoricoStatusLead, {
    foreignKey: 'leadId',
  })
  declare historicoStatus: HasMany<typeof HistoricoStatusLead>

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
