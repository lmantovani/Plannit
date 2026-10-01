import type { HttpContext } from '@adonisjs/core/http'
import Lead, {
  OrigemLead,
  StatusFunil,
  STATUS_FUNIL_LABELS,
  FAIXA_ORCAMENTO_LABELS,
  PRAZO_OBRA_LABELS,
  TIPO_IMOVEL_LABELS,
} from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import Arquiteto from '#models/arquiteto'
import User, { PerfilUsuario } from '#models/user'
import HistoricoStatusLead from '#models/historico_status_lead'
import AmbienteCatalogo from '#models/ambiente_catalogo'
import OrigemLeadCatalogo from '#models/origem_lead_catalogo'
import CampanhaLead from '#models/campanha_lead'
import {
  createLeadValidator,
  interacaoValidator,
  perderLeadValidator,
  updateStatusValidator,
  qualificarLeadValidator,
  desqualificarLeadValidator,
} from '#validators/lead'
import { DateTime } from 'luxon'

export default class LeadsController {
  private async registrarHistoricoStatus(lead: Lead, statusDe: string | null, statusPara: string, user: User) {
    if (statusDe === statusPara) return

    const refDate = lead.statusAlteradoEm || lead.createdAt
    const tempoPermanencia = refDate ? Math.max(0, Math.floor(DateTime.now().diff(refDate, 'seconds').seconds)) : 0

    await HistoricoStatusLead.create({
      leadId: lead.id,
      alteradoPorId: user.id,
      statusDe: statusDe,
      statusPara: statusPara,
      tempoPermanenciaSegundos: statusDe ? tempoPermanencia : null,
    })

    lead.statusAlteradoEm = DateTime.now()
  }

  /**
   * Lista leads no CRM — renderiza a visão Kanban/Lista via Inertia.
   * Vendedor vê apenas seus próprios leads; Gestão vê todos e pode filtrar.
   */
  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.user!
    const query = request.qs()
    const search = (query.q || '').trim()
    const statusFilter = query.statusFunil
    const origemFilter = query.origem
    const vendedorFilter = query.vendedorId ? Number(query.vendedorId) : null

    // Base query
    const leadsQuery = Lead.query().where('convertido_em_cliente', false)

    // Isolamento por perfil (SRS Seção 2)
    if (user.perfil === PerfilUsuario.VENDEDOR) {
      leadsQuery.where('vendedor_id', user.id)
    } else if (vendedorFilter) {
      leadsQuery.where('vendedor_id', vendedorFilter)
    }

    if (statusFilter) {
      leadsQuery.where('status_funil', statusFilter)
    }

    if (origemFilter) {
      leadsQuery.where('origem', origemFilter)
    }

    if (search) {
      leadsQuery.where((builder) => {
        builder
          .whereILike('nome', `%${search}%`)
          .orWhereILike('telefone', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('cidade', `%${search}%`)
      })
    }

    leadsQuery
      .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
      .preload('qualificadoPor', (qQuery) => qQuery.select('id', 'nome', 'email'))
      .preload('arquiteto', (aQuery) => aQuery.select('id', 'nome', 'escritorio'))
      .preload('interacoes', (iQuery) => {
        iQuery.preload('responsavel', (rQuery) => rQuery.select('id', 'nome')).orderBy('createdAt', 'desc')
      })
      .preload('historicoStatus', (hQuery) => {
        hQuery.preload('alteradoPor', (rQuery) => rQuery.select('id', 'nome')).orderBy('createdAt', 'desc')
      })
      .orderBy('createdAt', 'desc')

    const rawLeads = await leadsQuery

    // Métricas para a barra superior calculadas direto dos models
    const estatisticas = {
      total: rawLeads.length,
      ativos: rawLeads.filter(
        (l) =>
          l.statusFunil !== StatusFunil.FECHADO &&
          l.statusFunil !== StatusFunil.PERDIDO &&
          l.statusFunil !== StatusFunil.DESQUALIFICADO
      ).length,
      fechados: rawLeads.filter((l) => l.statusFunil === StatusFunil.FECHADO).length,
      perdidos: rawLeads.filter((l) => l.statusFunil === StatusFunil.PERDIDO).length,
      estagnados: rawLeads.filter((l) => l.precisaAtencao).length,
    }

    // Formata leads para o frontend com getters computados e relações seguras
    const leads = rawLeads.map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      cidade: lead.cidade,
      estado: lead.estado,
      origem: lead.origem,
      campanha: lead.campanha,
      statusFunil: lead.statusFunil,
      qualificado: lead.qualificado,
      orcamentoEstimado: lead.orcamentoEstimado ? Number(lead.orcamentoEstimado) : null,
      faixaOrcamento: lead.faixaOrcamento,
      faixaOrcamentoLabel: lead.faixaOrcamento ? FAIXA_ORCAMENTO_LABELS[lead.faixaOrcamento] || lead.faixaOrcamento : null,
      prazoObra: lead.prazoObra,
      prazoObraLabel: lead.prazoObra ? PRAZO_OBRA_LABELS[lead.prazoObra] || lead.prazoObra : null,
      tipoImovel: lead.tipoImovel,
      tipoImovelLabel: lead.tipoImovel ? TIPO_IMOVEL_LABELS[lead.tipoImovel] || lead.tipoImovel : null,
      ambientesInteresse: (lead.ambientesInteresse as string[]) || [],
      possuiArquiteto: lead.possuiArquiteto,
      arquitetoId: lead.arquitetoId,
      arquiteto: lead.arquiteto ? { id: lead.arquiteto.id, nome: lead.arquiteto.nome, escritorio: lead.arquiteto.escritorio } : null,
      decisorPresente: lead.decisorPresente,
      qualificadoEm: lead.qualificadoEm ? lead.qualificadoEm.toISO() : null,
      qualificadoPorId: lead.qualificadoPorId,
      qualificadoPor: lead.qualificadoPor ? { id: lead.qualificadoPor.id, nome: lead.qualificadoPor.nome } : null,
      motivoDesqualificacao: lead.motivoDesqualificacao,
      motivoPerda: lead.motivoPerda,
      concorrentePerdido: lead.concorrentePerdido,
      convertidoEmCliente: lead.convertidoEmCliente,
      ultimaInteracaoEm: lead.ultimaInteracaoEm ? lead.ultimaInteracaoEm.toISO() : null,
      createdAt: lead.createdAt ? lead.createdAt.toISO() : null,
      updatedAt: lead.updatedAt ? lead.updatedAt.toISO() : null,
      vendedorId: lead.vendedorId,
      diasSemInteracao: lead.diasSemInteracao,
      precisaAtencao: lead.precisaAtencao,
      vendedor: lead.vendedor
        ? { id: lead.vendedor.id, nome: lead.vendedor.nome, email: lead.vendedor.email }
        : null,
      interacoes: (lead.interacoes || []).map((i) => ({
        id: i.id,
        leadId: i.leadId,
        tipo: i.tipo,
        resumo: i.resumo,
        createdAt: i.createdAt ? i.createdAt.toISO() : null,
        responsavel: i.responsavel
          ? { id: i.responsavel.id, nome: i.responsavel.nome }
          : null,
      })),
      historicoStatus: (lead.historicoStatus || []).map((h) => ({
        id: h.id,
        leadId: h.leadId,
        statusDe: h.statusDe,
        statusDeLabel: h.statusDe ? STATUS_FUNIL_LABELS[h.statusDe as StatusFunil] || h.statusDe : null,
        statusPara: h.statusPara,
        statusParaLabel: STATUS_FUNIL_LABELS[h.statusPara as StatusFunil] || h.statusPara,
        tempoPermanenciaSegundos: h.tempoPermanenciaSegundos,
        observacao: h.observacao,
        createdAt: h.createdAt ? h.createdAt.toISO() : null,
        alteradoPor: h.alteradoPor ? { id: h.alteradoPor.id, nome: h.alteradoPor.nome } : null,
      })),
    }))

    // Lista de vendedores para o seletor de gestores
    let vendedores: Array<{ id: number; nome: string }> = []
    if (user.isGestor || user.isSuperuser) {
      const sellers = await User.query()
        .whereIn('perfil', [PerfilUsuario.VENDEDOR, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA])
        .where('is_active', true)
        .orderBy('nome', 'asc')
      vendedores = sellers.map((s) => ({ id: s.id, nome: s.nome }))
    }

    // Lista de arquitetos ativos para a modal de qualificação
    const arquitetos = await Arquiteto.query()
      .where('is_active', true)
      .select('id', 'nome', 'escritorio')
      .orderBy('nome', 'asc')

    // Tabelas de apoio ativas
    const ambientesCatalogo = await AmbienteCatalogo.query()
      .where('isActive', true)
      .orderBy('ordem', 'asc')
      .orderBy('nome', 'asc')

    const origensCatalogo = await OrigemLeadCatalogo.query()
      .where('isActive', true)
      .orderBy('nome', 'asc')

    const campanhasCatalogo = await CampanhaLead.query()
      .where('isActive', true)
      .orderBy('nome', 'asc')

    return inertia.render('crm/index', {
      leads,
      estatisticas,
      vendedores,
      arquitetos: arquitetos.map((a) => ({ id: a.id, nome: a.nome, escritorio: a.escritorio })),
      ambientesCatalogo: ambientesCatalogo.map((a) => ({ id: a.id, nome: a.nome, categoria: a.categoria })),
      origensCatalogo: origensCatalogo.map((o) => ({ id: o.id, nome: o.nome, slug: o.slug })),
      campanhasCatalogo: campanhasCatalogo.map((c) => ({ id: c.id, nome: c.nome })),
      filtros: {
        q: search,
        statusFunil: statusFilter || '',
        origem: origemFilter || '',
        vendedorId: vendedorFilter || '',
      },
      isVendedor: user.perfil === PerfilUsuario.VENDEDOR,
    })
  }

  /**
   * RF001 — Cadastra novo lead.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createLeadValidator)

    // Auto-atribuição para vendedor caso não tenha sido especificado
    let vendedorId = payload.vendedorId
    if (!vendedorId && user.perfil === PerfilUsuario.VENDEDOR) {
      vendedorId = user.id
    }

    const lead = await Lead.create({
      nome: payload.nome,
      telefone: payload.telefone,
      email: payload.email || null,
      cidade: payload.cidade || null,
      estado: payload.estado || null,
      origem: payload.origem || OrigemLead.OUTRO,
      campanha: payload.campanha || null,
      vendedorId: vendedorId || null,
      statusFunil: StatusFunil.NOVO_LEAD,
      qualificado: false,
    })

    await this.registrarHistoricoStatus(lead, null, StatusFunil.NOVO_LEAD, user)
    await lead.save()

    session.flash('success', `Lead "${payload.nome}" cadastrado com sucesso!`)
    return response.redirect().back()
  }

  /**
   * Atualização de status no Kanban (Drag and Drop) com guardrails RN001 e RF004.
   */
  async updateStatus({ params, request, response, auth, session }: HttpContext) {
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(updateStatusValidator)
    const user = auth.user!

    const etapasPosVisita: string[] = [
      StatusFunil.EM_BRIEFING,
      StatusFunil.EM_PROJETO,
      StatusFunil.EM_FECHAMENTO,
    ]

    // RN001: Bloqueia avanço para briefing/projeto sem qualificação prévia
    if (etapasPosVisita.includes(payload.statusFunil) && !lead.qualificado) {
      session.flash(
        'error',
        'RN001 — Bloqueio de Funil: O lead precisa ser qualificado antes de avançar para Briefing ou Projeto.'
      )
      return response.redirect().back()
    }

    // RF004: Exige motivo ao marcar como Perdido
    if (payload.statusFunil === StatusFunil.PERDIDO && !payload.motivoPerda) {
      session.flash(
        'error',
        'RF004: É obrigatório informar o motivo da perda ao arquivar um lead como perdido.'
      )
      return response.redirect().back()
    }

    const statusAnterior = lead.statusFunil
    lead.statusFunil = payload.statusFunil
    if (payload.statusFunil === StatusFunil.PERDIDO) {
      lead.motivoPerda = payload.motivoPerda || null
      lead.concorrentePerdido = payload.concorrentePerdido || null
    }

    await this.registrarHistoricoStatus(lead, statusAnterior, payload.statusFunil, user)
    await lead.save()

    session.flash('success', `Status de "${lead.nome}" atualizado para ${lead.statusFunil}.`)
    return response.redirect().back()
  }

  /**
   * RN001 — Registra qualificação estruturada do lead com validação dos 5 critérios.
   */
  async qualificar({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(qualificarLeadValidator)

    lead.qualificado = true
    lead.faixaOrcamento = payload.faixaOrcamento
    lead.prazoObra = payload.prazoObra
    lead.tipoImovel = payload.tipoImovel
    lead.ambientesInteresse = payload.ambientesInteresse
    lead.orcamentoEstimado = payload.orcamentoEstimado ? String(payload.orcamentoEstimado) : null
    lead.possuiArquiteto = Boolean(payload.possuiArquiteto || payload.arquitetoId)
    lead.arquitetoId = payload.arquitetoId || null
    lead.decisorPresente = payload.decisorPresente !== undefined ? payload.decisorPresente : true
    lead.qualificadoEm = DateTime.now()
    lead.qualificadoPorId = user.id

    const statusAnterior = lead.statusFunil

    // Se estiver em etapas preliminares, avança para Em Visita
    if (
      lead.statusFunil === StatusFunil.NOVO_LEAD ||
      lead.statusFunil === StatusFunil.QUALIFICANDO
    ) {
      lead.statusFunil = StatusFunil.EM_VISITA
    }

    await this.registrarHistoricoStatus(lead, statusAnterior, lead.statusFunil, user)
    await lead.save()

    // Registra interação automática de auditoria na timeline
    const orcamentoDesc = FAIXA_ORCAMENTO_LABELS[payload.faixaOrcamento] || payload.faixaOrcamento
    const prazoDesc = PRAZO_OBRA_LABELS[payload.prazoObra] || payload.prazoObra
    const tipoDesc = TIPO_IMOVEL_LABELS[payload.tipoImovel] || payload.tipoImovel
    const ambientesDesc = (payload.ambientesInteresse || []).join(', ')

    await InteracaoLead.create({
      leadId: lead.id,
      responsavelId: user.id,
      tipo: 'reuniao',
      resumo: `Qualificação RN001 Concluída: [${tipoDesc}] • Orçamento: ${orcamentoDesc} • Prazo: ${prazoDesc} • Ambientes: ${ambientesDesc}.${payload.observacoes ? ` Detalhes: ${payload.observacoes}` : ''}`,
    })

    lead.ultimaInteracaoEm = DateTime.now()
    await lead.save()

    session.flash('success', `Lead "${lead.nome}" qualificado com sucesso! Etapa de briefing liberada.`)
    return response.redirect().back()
  }

  /**
   * RN001 — Desqualifica o lead caso não atenda aos critérios da Líder Móveis.
   */
  async desqualificar({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(desqualificarLeadValidator)

    const statusAnterior = lead.statusFunil
    lead.statusFunil = StatusFunil.DESQUALIFICADO
    lead.qualificado = false
    lead.motivoDesqualificacao = payload.motivoDesqualificacao

    await this.registrarHistoricoStatus(lead, statusAnterior, lead.statusFunil, user)
    await lead.save()

    await InteracaoLead.create({
      leadId: lead.id,
      responsavelId: user.id,
      tipo: 'ligacao',
      resumo: `Lead Desqualificado (RN001): ${payload.motivoDesqualificacao}`,
    })

    lead.ultimaInteracaoEm = DateTime.now()
    await lead.save()

    session.flash('success', `Lead "${lead.nome}" desqualificado.`)
    return response.redirect().back()
  }

  /**
   * RF004 — Marca o lead como Perdido exigindo motivo da perda.
   */
  async marcarPerdido({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(perderLeadValidator)

    const statusAnterior = lead.statusFunil
    lead.statusFunil = StatusFunil.PERDIDO
    lead.motivoPerda = payload.motivoPerda
    lead.concorrentePerdido = payload.concorrentePerdido || null

    await this.registrarHistoricoStatus(lead, statusAnterior, lead.statusFunil, user)
    await lead.save()
    session.flash('success', `Lead "${lead.nome}" marcado como perdido.`)
    return response.redirect().back()
  }

  /**
   * RF003 & RF005 — Registra interação na timeline e atualiza última_interacao_em.
   */
  async registrarInteracao({ params, request, response, auth, session }: HttpContext) {
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(interacaoValidator)
    const user = auth.user!

    await InteracaoLead.create({
      leadId: lead.id,
      responsavelId: user.id,
      tipo: payload.tipo,
      resumo: payload.resumo,
    })

    lead.ultimaInteracaoEm = DateTime.now()
    await lead.save()

    session.flash('success', 'Interação registrada com sucesso!')
    return response.redirect().back()
  }
}
