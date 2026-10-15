import { ColaboradoreSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Cargo from '#models/cargo'
import Departamento from '#models/departamento'
import HistoricoSalarialColaborador from '#models/historico_salarial_colaborador'
import HistoricoCargoColaborador from '#models/historico_cargo_colaborador'
import DocumentoColaborador from '#models/documento_colaborador'

export enum RegimeContratacao {
  CLT = 'clt',
  PJ = 'pj',
}

export enum ModalidadeTrabalho {
  PRESENCIAL = 'presencial',
  HIBRIDO = 'hibrido',
  REMOTO = 'remoto',
}

export enum PerfilDISC {
  DOMINANTE = 'dominante',
  INFLUENTE = 'influente',
  ESTAVEL = 'estavel',
  CAUTELOSO = 'cauteloso',
}

export const REGIME_LABELS: Record<RegimeContratacao, string> = {
  [RegimeContratacao.CLT]: 'CLT',
  [RegimeContratacao.PJ]: 'Pessoa Jurídica (PJ)',
}

export const MODALIDADE_LABELS: Record<ModalidadeTrabalho, string> = {
  [ModalidadeTrabalho.PRESENCIAL]: 'Presencial',
  [ModalidadeTrabalho.HIBRIDO]: 'Híbrido',
  [ModalidadeTrabalho.REMOTO]: 'Remoto',
}

export const DISC_LABELS: Record<PerfilDISC, { label: string; cor: string; sigla: string }> = {
  [PerfilDISC.DOMINANTE]: { label: 'Dominante (Executor / Foco em Resultados)', cor: 'bg-red-50 text-red-700 border-red-200', sigla: 'D' },
  [PerfilDISC.INFLUENTE]: { label: 'Influente (Comunicador / Relacionamento)', cor: 'bg-amber-50 text-amber-700 border-amber-200', sigla: 'I' },
  [PerfilDISC.ESTAVEL]: { label: 'Estável (Planejador / Harmonia e Processo)', cor: 'bg-emerald-50 text-emerald-700 border-emerald-200', sigla: 'S' },
  [PerfilDISC.CAUTELOSO]: { label: 'Cauteloso (Analista / Precisão e Qualidade)', cor: 'bg-blue-50 text-blue-700 border-blue-200', sigla: 'C' },
}

export default class Colaborador extends ColaboradoreSchema {
  static table = 'colaboradores'

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Cargo, { foreignKey: 'cargoId' })
  declare cargo: BelongsTo<typeof Cargo>

  @belongsTo(() => Departamento, { foreignKey: 'departamentoId' })
  declare departamento: BelongsTo<typeof Departamento>

  @belongsTo(() => Colaborador, { foreignKey: 'gestorId' })
  declare gestor: BelongsTo<typeof Colaborador>

  @hasMany(() => Colaborador, { foreignKey: 'gestorId' })
  declare subordinados: HasMany<typeof Colaborador>

  @hasMany(() => HistoricoSalarialColaborador, { foreignKey: 'colaboradorId' })
  declare historicoSalarial: HasMany<typeof HistoricoSalarialColaborador>

  @hasMany(() => HistoricoCargoColaborador, { foreignKey: 'colaboradorId' })
  declare historicoCargos: HasMany<typeof HistoricoCargoColaborador>

  @hasMany(() => DocumentoColaborador, { foreignKey: 'colaboradorId' })
  declare documentos: HasMany<typeof DocumentoColaborador>
}
