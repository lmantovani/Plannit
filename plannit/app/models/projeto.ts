import { ProjetoSchema } from '#database/schema'
import { belongsTo, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lead from '#models/lead'
import Briefing from '#models/briefing'
import FilaProjeto from '#models/fila_projeto'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import Arquiteto from '#models/arquiteto'
import Cliente from '#models/cliente'
import ProjetoComercial from '#models/projeto_comercial'
import Fechamento from '#models/fechamento'
import Handoff from '#models/handoff'


export enum StatusProjeto {
  NOVO_LEAD = 'novo_lead',
  QUALIFICANDO = 'qualificando',
  EM_VISITA = 'em_visita',
  EM_BRIEFING = 'em_briefing',
  NA_FILA = 'na_fila',
  EM_PROJETO = 'em_projeto',
  AGUARD_VALIDACAO = 'aguard_validacao',
  EM_RENDER = 'em_render',
  AGUARD_APRESENTACAO = 'aguard_apresentacao',
  EM_AJUSTE = 'em_ajuste',
  EM_FECHAMENTO = 'em_fechamento',
  AGUARD_ASSINATURA = 'aguard_assinatura',
  EM_HANDOFF = 'em_handoff',
  CONTATO_CONF = 'contato_conf',
  VALIDANDO_OBRA = 'validando_obra',
  EM_MEDICAO = 'em_medicao',
  EM_ADEQUACAO = 'em_adequacao',
  ALINHANDO_CLIENTE = 'alinhando_cliente',
  EM_AUDITORIA = 'em_auditoria',
  AGUARD_ASSINATURA_TEC = 'aguard_assinatura_tec',
  EM_PRODUCAO = 'em_producao',
  PRE_MONTAGEM = 'pre_montagem',
  AGUARD_MERCADORIA = 'aguard_mercadoria',
  ENTREGA_AGENDADA = 'entrega_agendada',
  EM_ENTREGA = 'em_entrega',
  EM_MONTAGEM = 'em_montagem',
  COM_OCORRENCIA = 'com_ocorrencia',
  CHECKLIST_FINAL = 'checklist_final',
  POS_VENDA = 'pos_venda',
  EM_AT = 'em_at',
  RELACIONAMENTO = 'relacionamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export const STATUS_PROJETO_LABELS: Record<StatusProjeto, string> = {
  [StatusProjeto.NOVO_LEAD]: 'Novo Lead',
  [StatusProjeto.QUALIFICANDO]: 'Qualificando',
  [StatusProjeto.EM_VISITA]: 'Em Visita',
  [StatusProjeto.EM_BRIEFING]: 'Em Briefing',
  [StatusProjeto.NA_FILA]: 'Na Fila de Projetos',
  [StatusProjeto.EM_PROJETO]: 'Em Projeto',
  [StatusProjeto.AGUARD_VALIDACAO]: 'Aguardando Validação',
  [StatusProjeto.EM_RENDER]: 'Em Render',
  [StatusProjeto.AGUARD_APRESENTACAO]: 'Aguardando Apresentação',
  [StatusProjeto.EM_AJUSTE]: 'Em Ajuste',
  [StatusProjeto.EM_FECHAMENTO]: 'Em Fechamento',
  [StatusProjeto.AGUARD_ASSINATURA]: 'Aguardando Assinatura',
  [StatusProjeto.EM_HANDOFF]: 'Em Handoff',
  [StatusProjeto.CONTATO_CONF]: 'Contato Conferência',
  [StatusProjeto.VALIDANDO_OBRA]: 'Validando Obra',
  [StatusProjeto.EM_MEDICAO]: 'Em Medição',
  [StatusProjeto.EM_ADEQUACAO]: 'Em Adequação',
  [StatusProjeto.ALINHANDO_CLIENTE]: 'Alinhando Cliente',
  [StatusProjeto.EM_AUDITORIA]: 'Em Auditoria',
  [StatusProjeto.AGUARD_ASSINATURA_TEC]: 'Aguardando Assinatura Técnica',
  [StatusProjeto.EM_PRODUCAO]: 'Em Produção',
  [StatusProjeto.PRE_MONTAGEM]: 'Pré-Montagem',
  [StatusProjeto.AGUARD_MERCADORIA]: 'Aguardando Mercadoria',
  [StatusProjeto.ENTREGA_AGENDADA]: 'Entrega Agendada',
  [StatusProjeto.EM_ENTREGA]: 'Em Entrega',
  [StatusProjeto.EM_MONTAGEM]: 'Em Montagem',
  [StatusProjeto.COM_OCORRENCIA]: 'Com Ocorrência',
  [StatusProjeto.CHECKLIST_FINAL]: 'Checklist Final',
  [StatusProjeto.POS_VENDA]: 'Pós-Venda',
  [StatusProjeto.EM_AT]: 'Em Assistência Técnica',
  [StatusProjeto.RELACIONAMENTO]: 'Relacionamento',
  [StatusProjeto.CONCLUIDO]: 'Concluído',
  [StatusProjeto.CANCELADO]: 'Cancelado',
}

export default class Projeto extends ProjetoSchema {
  static table = 'projetos'

  @belongsTo(() => User, {
    foreignKey: 'vendedorId',
  })
  declare vendedor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'projetistaId',
  })
  declare projetista: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'conferenteId',
  })
  declare conferente: BelongsTo<typeof User>

  @belongsTo(() => Lead, {
    foreignKey: 'leadId',
  })
  declare lead: BelongsTo<typeof Lead>

  @hasOne(() => Briefing, {
    foreignKey: 'projetoId',
  })
  declare briefing: HasOne<typeof Briefing>

  @hasOne(() => FilaProjeto, {
    foreignKey: 'projetoId',
  })
  declare fila: HasOne<typeof FilaProjeto>

  @hasMany(() => HistoricoStatusProjeto, {
    foreignKey: 'projetoId',
  })
  declare historicoStatus: HasMany<typeof HistoricoStatusProjeto>

  @belongsTo(() => Arquiteto, {
    foreignKey: 'arquitetoId',
  })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>

  @hasMany(() => ProjetoComercial, {
    foreignKey: 'projetoId',
  })
  declare versoesComerciais: HasMany<typeof ProjetoComercial>

  @hasOne(() => Fechamento, {
    foreignKey: 'projetoId',
  })
  declare fechamento: HasOne<typeof Fechamento>

  @hasOne(() => Handoff, {
    foreignKey: 'projetoId',
  })
  declare handoff: HasOne<typeof Handoff>
}



