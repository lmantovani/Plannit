import { LeadSchema } from '#database/schema'
import { belongsTo, hasMany, hasOne, column } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import InteracaoLead from '#models/interacao_lead'
import Arquiteto from '#models/arquiteto'
import HistoricoStatusLead from '#models/historico_status_lead'
import CompromissoAgenda from '#models/compromisso_agenda'
import Cliente from '#models/cliente'
import Projeto from '#models/projeto'

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
  // Quadro 1: Comercial
  NOVO_LEAD = 'novo_lead',
  QUALIFICANDO = 'qualificando',
  EM_VISITA = 'em_visita',
  EM_BRIEFING = 'em_briefing',
  FILA_PROJETO = 'fila_projeto',
  EM_PROJETO = 'em_projeto',
  PRONTO_PARA_RENDERIZAR = 'pronto_para_renderizar',
  FINALIZACAO_RENDERIZADO = 'finalizacao_renderizado',
  CONFIRMAR_APRESENTACAO = 'confirmar_apresentacao',
  APRESENTACAO_AGENDADA = 'apresentacao_agendada',
  EM_FECHAMENTO = 'em_fechamento',
  STAND_BY = 'stand_by',
  ALTERACAO_AJUSTE = 'alteracao_ajuste',
  FECHADO = 'fechado',
  PERDIDO = 'perdido',
  DESQUALIFICADO = 'desqualificado',

  // Quadro 2: Pós-venda (Conferência)
  CADERNO_COMERCIAL = 'caderno_comercial',
  AGUARDANDO_OBRA = 'aguardando_obra',
  FILA_MEDICAO_TECNICA = 'fila_medicao_tecnica',
  FILA_PASTA_TECNICA = 'fila_pasta_tecnica',
  EM_ADEQUACAO_OBRA = 'em_adequacao_obra',
  MEDICAO_TECNICA = 'medicao_tecnica',
  FILA_MEDICAO_FINAL = 'fila_medicao_final',
  MEDICAO_FINAL = 'medicao_final',
  PRE_EXECUTIVO = 'pre_executivo',
  FILA_PROJETO_EXECUTIVO = 'fila_projeto_executivo',
  ADEQUACAO = 'adequacao',
  AUDITORIA_PROJETO = 'auditoria_projeto',
  ASSINATURA_EXECUTIVA = 'assinatura_executiva',
  EM_CODIFICACAO = 'em_codificacao',
  POSTAGEM = 'postagem',

  // Quadro 3: Pós-venda - Entrega e Montagem
  AGUARDANDO_PRODUCAO = 'aguardando_producao',
  PRONTO_INDUSTRIA = 'pronto_industria',
  VISTORIA_MONTAGEM = 'vistoria_montagem',
  ENTREGA_AGENDADA = 'entrega_agendada',
  EM_MONTAGEM = 'em_montagem',
  CHECKLIST_FINAL = 'checklist_final',
  MONTAGEM_FINALIZADA = 'montagem_finalizada',
  FINALIZADA_COM_PENDENCIA = 'finalizada_com_pendencia',
  RELATORIO_OBRA = 'relatorio_obra',

  // Quadro 4: Pós-venda - Assistência Técnica
  AGUARDANDO_ABERTURA_AT = 'aguardando_abertura_at',
  AT_ABERTA = 'at_aberta',
  AT_FINALIZADA = 'at_finalizada',
  POS_VENDA_CONCLUIDO = 'pos_venda_concluido',
}

export const STATUS_FUNIL_LABELS: Record<string, string> = {
  [StatusFunil.NOVO_LEAD]: 'Novo Lead',
  [StatusFunil.QUALIFICANDO]: 'Qualificação',
  [StatusFunil.EM_VISITA]: 'Em Visita',
  [StatusFunil.EM_BRIEFING]: 'Briefing',
  [StatusFunil.FILA_PROJETO]: 'Fila de Projeto',
  [StatusFunil.EM_PROJETO]: 'Em Projeto',
  [StatusFunil.PRONTO_PARA_RENDERIZAR]: 'Pronto para Renderizar',
  [StatusFunil.FINALIZACAO_RENDERIZADO]: 'Finalização / Renderizado',
  [StatusFunil.CONFIRMAR_APRESENTACAO]: 'Confirmar Apresentação',
  [StatusFunil.APRESENTACAO_AGENDADA]: 'Apresentação Agendada',
  [StatusFunil.EM_FECHAMENTO]: 'Em Aberto / Em Negociação / Apresentado',
  [StatusFunil.STAND_BY]: 'Stand-by',
  [StatusFunil.ALTERACAO_AJUSTE]: 'Alteração / Modificação / Ajuste',
  [StatusFunil.FECHADO]: 'Fechado / Vendido',
  [StatusFunil.PERDIDO]: 'Perdido',
  [StatusFunil.DESQUALIFICADO]: 'Desqualificado',

  // Pós-venda (Conferência)
  [StatusFunil.CADERNO_COMERCIAL]: 'Caderno Comercial',
  [StatusFunil.AGUARDANDO_OBRA]: 'Aguardando Obra',
  [StatusFunil.FILA_MEDICAO_TECNICA]: 'Fila Medição Técnica',
  [StatusFunil.FILA_PASTA_TECNICA]: 'Fila Pasta Técnica',
  [StatusFunil.EM_ADEQUACAO_OBRA]: 'Em Adequação de Obra',
  [StatusFunil.MEDICAO_TECNICA]: 'Medição Técnica',
  [StatusFunil.FILA_MEDICAO_FINAL]: 'Fila Medição Final',
  [StatusFunil.MEDICAO_FINAL]: 'Medição Final',
  [StatusFunil.PRE_EXECUTIVO]: 'Pré-executivo',
  [StatusFunil.FILA_PROJETO_EXECUTIVO]: 'Fila Projeto Executivo',
  [StatusFunil.ADEQUACAO]: 'Adequação',
  [StatusFunil.AUDITORIA_PROJETO]: 'Auditoria Projeto',
  [StatusFunil.ASSINATURA_EXECUTIVA]: 'Assinatura Executiva',
  [StatusFunil.EM_CODIFICACAO]: 'Em Codificação',
  [StatusFunil.POSTAGEM]: 'Postagem',

  // Pós-venda - Entrega e Montagem
  [StatusFunil.AGUARDANDO_PRODUCAO]: 'Aguardando Produção',
  [StatusFunil.PRONTO_INDUSTRIA]: 'Pronto pra Indústria',
  [StatusFunil.VISTORIA_MONTAGEM]: 'Vistoria para Montagem',
  [StatusFunil.ENTREGA_AGENDADA]: 'Entrega Agendada',
  [StatusFunil.EM_MONTAGEM]: 'Em Montagem',
  [StatusFunil.CHECKLIST_FINAL]: 'Checklist Final',
  [StatusFunil.MONTAGEM_FINALIZADA]: 'Montagem Finalizada',
  [StatusFunil.FINALIZADA_COM_PENDENCIA]: 'Finalizada com Pendência',
  [StatusFunil.RELATORIO_OBRA]: 'Relatório de Obra',

  // Pós-venda - Assistência Técnica
  [StatusFunil.AGUARDANDO_ABERTURA_AT]: 'Aguardando Abertura de AT',
  [StatusFunil.AT_ABERTA]: 'AT Aberta',
  [StatusFunil.AT_FINALIZADA]: 'Finalizada',
  [StatusFunil.POS_VENDA_CONCLUIDO]: 'Pós-venda',
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

  @hasMany(() => CompromissoAgenda, {
    foreignKey: 'leadId',
  })
  declare compromissos: HasMany<typeof CompromissoAgenda>

  @belongsTo(() => Arquiteto, {
    foreignKey: 'arquitetoId',
  })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => Cliente, {
    foreignKey: 'clienteId',
  })
  declare cliente: BelongsTo<typeof Cliente>

  @hasOne(() => Projeto, {
    foreignKey: 'leadId',
  })
  declare projeto: HasOne<typeof Projeto>

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
