import { ArquitetoSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import DecisorArquiteto from '#models/decisor_arquiteto'
import ConcorrenteArquiteto from '#models/concorrente_arquiteto'
import HistoricoDonoArquiteto from '#models/historico_dono_arquiteto'
import InteracaoArquiteto from '#models/interacao_arquiteto'
import Projeto from '#models/projeto'
import Lead from '#models/lead'

export enum NivelParceria {
  PARCEIRO = 'parceiro',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export enum TipoEspecificador {
  ARQUITETO = 'arquiteto',
  DESIGNER_INTERIORES = 'designer_interiores',
  DECORADOR = 'decorador',
  ENGENHEIRO = 'engenheiro',
  CORRETOR = 'corretor',
  OUTRO = 'outro',
}

export enum StatusCarteiraEspecificador {
  ATIVO = 'ativo',
  EM_PROSPECCAO = 'em_prospeccao',
  INATIVO = 'inativo',
}

export const TIPO_ESPECIFICADOR_LABELS: Record<TipoEspecificador, string> = {
  [TipoEspecificador.ARQUITETO]: 'Arquiteto',
  [TipoEspecificador.DESIGNER_INTERIORES]: 'Designer de Interiores',
  [TipoEspecificador.DECORADOR]: 'Decorador',
  [TipoEspecificador.ENGENHEIRO]: 'Engenheiro',
  [TipoEspecificador.CORRETOR]: 'Corretor',
  [TipoEspecificador.OUTRO]: 'Outro',
}

export const NIVEL_PARCERIA_LABELS: Record<NivelParceria, string> = {
  [NivelParceria.PARCEIRO]: 'Parceiro',
  [NivelParceria.PREMIUM]: 'Premium',
  [NivelParceria.VIP]: 'VIP',
}

export const STATUS_CARTEIRA_LABELS: Record<StatusCarteiraEspecificador, string> = {
  [StatusCarteiraEspecificador.ATIVO]: 'Ativo',
  [StatusCarteiraEspecificador.EM_PROSPECCAO]: 'Em Prospecção',
  [StatusCarteiraEspecificador.INATIVO]: 'Inativo',
}

export default class Arquiteto extends ArquitetoSchema {
  static table = 'arquitetos'

  @belongsTo(() => User, { foreignKey: 'consultorId' })
  declare consultor: BelongsTo<typeof User>

  @hasMany(() => DecisorArquiteto, { foreignKey: 'arquitetoId' })
  declare decisores: HasMany<typeof DecisorArquiteto>

  @hasMany(() => ConcorrenteArquiteto, { foreignKey: 'arquitetoId' })
  declare concorrentes: HasMany<typeof ConcorrenteArquiteto>

  @hasMany(() => HistoricoDonoArquiteto, { foreignKey: 'arquitetoId' })
  declare historicoDono: HasMany<typeof HistoricoDonoArquiteto>

  @hasMany(() => InteracaoArquiteto, { foreignKey: 'arquitetoId' })
  declare interacoes: HasMany<typeof InteracaoArquiteto>

  @hasMany(() => Projeto, { foreignKey: 'arquitetoId' })
  declare projetos: HasMany<typeof Projeto>

  @hasMany(() => Lead, { foreignKey: 'arquitetoId' })
  declare leads: HasMany<typeof Lead>
}
