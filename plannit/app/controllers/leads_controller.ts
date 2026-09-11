import type { HttpContext } from '@adonisjs/core/http'
import Lead, { OrigemLead, StatusFunil } from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import User, { PerfilUsuario } from '#models/user'
import {
  createLeadValidator,
  interacaoValidator,
  perderLeadValidator,
  updateStatusValidator,
} from '#validators/lead'
import { DateTime } from 'luxon'

export default class LeadsController {
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
      .preload('interacoes', (iQuery) => {
        iQuery.preload('responsavel', (rQuery) => rQuery.select('id', 'nome')).orderBy('createdAt', 'desc')
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

    return inertia.render('crm/index', {
      leads,
      estatisticas,
      vendedores,
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

    await Lead.create({
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

    session.flash('success', `Lead "${payload.nome}" cadastrado com sucesso!`)
    return response.redirect().back()
  }

  /**
   * Atualização de status no Kanban (Drag and Drop) com guardrails RN001 e RF004.
   */
  async updateStatus({ params, request, response, session }: HttpContext) {
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(updateStatusValidator)

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

    lead.statusFunil = payload.statusFunil
    if (payload.statusFunil === StatusFunil.PERDIDO) {
      lead.motivoPerda = payload.motivoPerda || null
      lead.concorrentePerdido = payload.concorrentePerdido || null
    }

    await lead.save()

    session.flash('success', `Status de "${lead.nome}" atualizado para ${lead.statusFunil}.`)
    return response.redirect().back()
  }

  /**
   * RN001 — Registra qualificação do lead antes de avançar no funil.
   */
  async qualificar({ params, response, session }: HttpContext) {
    const lead = await Lead.findOrFail(params.id)
    lead.qualificado = true

    // Se estiver em etapas preliminares, avança para Em Visita
    if (
      lead.statusFunil === StatusFunil.NOVO_LEAD ||
      lead.statusFunil === StatusFunil.QUALIFICANDO
    ) {
      lead.statusFunil = StatusFunil.EM_VISITA
    }

    await lead.save()
    session.flash('success', `Lead "${lead.nome}" qualificado com sucesso! Etapas de briefing liberadas.`)
    return response.redirect().back()
  }

  /**
   * RF004 — Marca o lead como Perdido exigindo motivo da perda.
   */
  async marcarPerdido({ params, request, response, session }: HttpContext) {
    const lead = await Lead.findOrFail(params.id)
    const payload = await request.validateUsing(perderLeadValidator)

    lead.statusFunil = StatusFunil.PERDIDO
    lead.motivoPerda = payload.motivoPerda
    lead.concorrentePerdido = payload.concorrentePerdido || null

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
