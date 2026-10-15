import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import CompromissoAgenda, { StatusCompromisso } from '#models/compromisso_agenda'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'
import Lead from '#models/lead'
import InteracaoLead from '#models/interacao_lead'
import User, { PerfilUsuario } from '#models/user'
import {
  createCompromissoValidator,
  updateCompromissoValidator,
  reagendarCompromissoValidator,
  cancelarCompromissoValidator,
  concluirCompromissoValidator,
} from '#validators/compromisso_agenda'

export default class AgendaController {
  /**
   * Helper que identifica requisições que preferem JSON sobre redirecionamento Inertia.
   */
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }

  /**
   * Helper RBAC que verifica se o usuário é gestor (Diretoria, Gerente Comercial ou Superuser).
   */
  private isGestor(user: User): boolean {
    if (user.isSuperuser) return true
    return user.hasRole([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])
  }

  /**
   * Lista compromissos com isolamento por perfil e filtros.
   */
  async index({ request, inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const queryParams = request.qs()
    const isUserGestor = this.isGestor(user)

    const visao = queryParams.visao || (isUserGestor ? 'equipe' : 'minha')
    const responsavelIdFilter = queryParams.responsavelId ? Number(queryParams.responsavelId) : null
    const statusFilter = queryParams.status
    const tipoIdFilter = queryParams.tipoId ? Number(queryParams.tipoId) : null
    const leadIdFilter = queryParams.leadId ? Number(queryParams.leadId) : null
    const clienteIdFilter = queryParams.clienteId ? Number(queryParams.clienteId) : null
    const projetoIdFilter = queryParams.projetoId ? Number(queryParams.projetoId) : null
    const dataInicioFilter = queryParams.dataInicio || queryParams.inicio
    const dataFimFilter = queryParams.dataFim || queryParams.fim
    const busca = (queryParams.q || '').trim()

    const agendaQuery = CompromissoAgenda.query()

    // RBAC: operacional (Vendedor, Projetista, etc.) vê estritamente seus compromissos
    if (!isUserGestor) {
      agendaQuery.where('responsavel_id', user.id)
    } else {
      // Gestor pode alternar entre "Minha Agenda", "Equipe" ou filtrar por colaborador específico
      if (responsavelIdFilter) {
        agendaQuery.where('responsavel_id', responsavelIdFilter)
      } else if (visao === 'minha') {
        agendaQuery.where('responsavel_id', user.id)
      }
    }

    // Filtros de período (datas ISO ou timestamps)
    if (dataInicioFilter) {
      const dtInicio = DateTime.fromISO(dataInicioFilter).toUTC()
      if (dtInicio.isValid) {
        agendaQuery.where('data_hora_inicio', '>=', dtInicio.toSQL()!)
      }
    }

    if (dataFimFilter) {
      const dtFim = DateTime.fromISO(dataFimFilter).toUTC()
      if (dtFim.isValid) {
        agendaQuery.where('data_hora_inicio', '<=', dtFim.toSQL()!)
      }
    }

    // Filtros de relacionamento e status
    if (statusFilter) {
      agendaQuery.where('status', statusFilter)
    }

    if (tipoIdFilter) {
      agendaQuery.where('tipo_id', tipoIdFilter)
    }

    if (leadIdFilter) {
      agendaQuery.where('lead_id', leadIdFilter)
    }

    if (clienteIdFilter) {
      agendaQuery.where('cliente_id', clienteIdFilter)
    }

    if (projetoIdFilter) {
      agendaQuery.where('projeto_id', projetoIdFilter)
    }

    // Busca textual
    if (busca) {
      agendaQuery.where((builder) => {
        builder
          .whereILike('titulo', `%${busca}%`)
          .orWhereILike('local', `%${busca}%`)
          .orWhereILike('observacoes', `%${busca}%`)
      })
    }

    // Preloads
    agendaQuery
      .preload('tipo')
      .preload('responsavel')
      .preload('criadoPor')
      .preload('lead')
      .preload('cliente')
      .preload('projeto')
      .orderBy('data_hora_inicio', 'asc')

    const compromissos = await agendaQuery

    // Tipos ativos para catálogo
    const tipos = await TipoCompromissoCatalogo.query()
      .withScopes((scopes) => scopes.ativos())
      .withScopes((scopes) => scopes.ordenados())

    // Colaboradores internos (carregados apenas para gestores filtrarem equipe)
    const colaboradores = isUserGestor
      ? await User.query()
          .where('is_active', true)
          .orderBy('nome', 'asc')
          .select('id', 'nome', 'email', 'perfil')
      : []

    // Leads para autocomplete no agendamento
    const leadsQuery = Lead.query().select('id', 'nome', 'telefone', 'cidade').orderBy('nome', 'asc')
    if (!isUserGestor && user.perfil === PerfilUsuario.VENDEDOR) {
      leadsQuery.where('vendedor_id', user.id)
    }
    const leads = await leadsQuery

    const props = {
      compromissos,
      tipos,
      colaboradores,
      leads,
      podeVerEquipe: isUserGestor,
      filtros: {
        visao,
        responsavelId: responsavelIdFilter,
        status: statusFilter,
        tipoId: tipoIdFilter,
        leadId: leadIdFilter,
        clienteId: clienteIdFilter,
        projetoId: projetoIdFilter,
        dataInicio: dataInicioFilter,
        dataFim: dataFimFilter,
        q: busca,
      },
    }

    if (this.wantsJson(request)) {
      return response.json(props)
    }

    return inertia.render('agenda/index', props)
  }

  /**
   * Cria um novo compromisso na agenda.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createCompromissoValidator)

    const inicio = DateTime.fromISO(payload.dataHoraInicio).toUTC()
    const fim = DateTime.fromISO(payload.dataHoraFim).toUTC()

    if (fim <= inicio) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          message: 'A data e horário de término devem ser posteriores ao início.',
        })
      }
      session.flash('error', 'A data e horário de término devem ser posteriores ao início.')
      return response.redirect().back()
    }

    // RBAC: Se não for gestor, força responsavelId como o usuário logado
    let responsavelId = user.id
    if (this.isGestor(user) && payload.responsavelId) {
      responsavelId = payload.responsavelId
    }

    // Se o título não foi informado, assume o nome do tipo selecionado
    let titulo = payload.titulo?.trim()
    if (!titulo) {
      const tipo = await TipoCompromissoCatalogo.find(payload.tipoId)
      titulo = tipo ? tipo.nome : 'Compromisso'
    }

    const compromisso = await CompromissoAgenda.create({
      titulo,
      tipoId: payload.tipoId,
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      local: payload.local || null,
      status: StatusCompromisso.AGENDADO,
      observacoes: payload.observacoes || null,
      desfecho: null,
      responsavelId,
      criadoPorId: user.id,
      leadId: payload.leadId || null,
      clienteId: payload.clienteId || null,
      projetoId: payload.projetoId || null,
    })

    // Se vinculado a um Lead, atualiza última interação
    if (payload.leadId) {
      const lead = await Lead.find(payload.leadId)
      if (lead) {
        lead.ultimaInteracaoEm = DateTime.now().toUTC()
        await lead.save()
      }
    }

    await compromisso.load('tipo')
    await compromisso.load('responsavel')

    if (this.wantsJson(request)) {
      return response.status(201).json({
        message: 'Compromisso agendado com sucesso.',
        compromisso,
      })
    }

    session.flash('success', 'Compromisso agendado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Atualiza dados de um compromisso.
   */
  async update({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const compromisso = await CompromissoAgenda.findOrFail(params.id)

    // RBAC: Usuário comum só edita seus próprios compromissos
    if (!this.isGestor(user) && compromisso.responsavelId !== user.id) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          message: 'Você não tem permissão para editar este compromisso.',
        })
      }
      session.flash('error', 'Você não tem permissão para editar este compromisso.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(updateCompromissoValidator)

    const inicio = payload.dataHoraInicio
      ? DateTime.fromISO(payload.dataHoraInicio).toUTC()
      : compromisso.dataHoraInicio
    const fim = payload.dataHoraFim
      ? DateTime.fromISO(payload.dataHoraFim).toUTC()
      : compromisso.dataHoraFim

    if (fim <= inicio) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          message: 'A data e horário de término devem ser posteriores ao início.',
        })
      }
      session.flash('error', 'A data e horário de término devem ser posteriores ao início.')
      return response.redirect().back()
    }

    if (payload.titulo !== undefined) compromisso.titulo = payload.titulo
    if (payload.tipoId !== undefined) compromisso.tipoId = payload.tipoId
    compromisso.dataHoraInicio = inicio
    compromisso.dataHoraFim = fim
    if (payload.local !== undefined) compromisso.local = payload.local || null
    if (payload.observacoes !== undefined) compromisso.observacoes = payload.observacoes || null

    if (this.isGestor(user) && payload.responsavelId !== undefined) {
      compromisso.responsavelId = payload.responsavelId
    }

    if (payload.leadId !== undefined) compromisso.leadId = payload.leadId || null
    if (payload.clienteId !== undefined) compromisso.clienteId = payload.clienteId || null
    if (payload.projetoId !== undefined) compromisso.projetoId = payload.projetoId || null

    await compromisso.save()
    await compromisso.load('tipo')
    await compromisso.load('responsavel')

    if (this.wantsJson(request)) {
      return response.json({
        message: 'Compromisso atualizado com sucesso.',
        compromisso,
      })
    }

    session.flash('success', 'Compromisso atualizado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Reagenda um compromisso existente.
   */
  async reagendar({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const compromisso = await CompromissoAgenda.findOrFail(params.id)

    // RBAC: Usuário comum só reagenda seus próprios compromissos
    if (!this.isGestor(user) && compromisso.responsavelId !== user.id) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          message: 'Você não tem permissão para reagendar este compromisso.',
        })
      }
      session.flash('error', 'Você não tem permissão para reagendar este compromisso.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(reagendarCompromissoValidator)

    const inicio = DateTime.fromISO(payload.dataHoraInicio).toUTC()
    const fim = DateTime.fromISO(payload.dataHoraFim).toUTC()

    if (fim <= inicio) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          message: 'A nova data e horário de término devem ser posteriores ao início.',
        })
      }
      session.flash('error', 'A nova data e horário de término devem ser posteriores ao início.')
      return response.redirect().back()
    }

    compromisso.dataHoraInicio = inicio
    compromisso.dataHoraFim = fim
    compromisso.status = StatusCompromisso.REAGENDADO

    if (payload.observacoes) {
      compromisso.observacoes = compromisso.observacoes
        ? `${compromisso.observacoes}\n[Reagendado]: ${payload.observacoes}`
        : `[Reagendado]: ${payload.observacoes}`
    }

    await compromisso.save()

    if (compromisso.leadId) {
      const lead = await Lead.find(compromisso.leadId)
      if (lead) {
        lead.ultimaInteracaoEm = DateTime.now().toUTC()
        await lead.save()
      }
    }

    await compromisso.load('tipo')
    await compromisso.load('responsavel')

    if (this.wantsJson(request)) {
      return response.json({
        message: 'Compromisso reagendado com sucesso.',
        compromisso,
      })
    }

    session.flash('success', 'Compromisso reagendado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Cancela um compromisso existente.
   */
  async cancelar({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const compromisso = await CompromissoAgenda.findOrFail(params.id)

    // RBAC: Usuário comum só cancela seus próprios compromissos
    if (!this.isGestor(user) && compromisso.responsavelId !== user.id) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          message: 'Você não tem permissão para cancelar este compromisso.',
        })
      }
      session.flash('error', 'Você não tem permissão para cancelar este compromisso.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(cancelarCompromissoValidator)

    compromisso.status = StatusCompromisso.CANCELADO
    const motivo = payload.motivo || payload.observacoes
    if (motivo) {
      compromisso.observacoes = compromisso.observacoes
        ? `${compromisso.observacoes}\n[Cancelado]: ${motivo}`
        : `[Cancelado]: ${motivo}`
    }

    await compromisso.save()
    await compromisso.load('tipo')
    await compromisso.load('responsavel')

    if (this.wantsJson(request)) {
      return response.json({
        message: 'Compromisso cancelado com sucesso.',
        compromisso,
      })
    }

    session.flash('success', 'Compromisso cancelado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Conclui um compromisso, registrando desfecho e adicionando interação na timeline do lead.
   */
  async concluir({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const compromisso = await CompromissoAgenda.findOrFail(params.id)

    // RBAC: Usuário comum só conclui seus próprios compromissos
    if (!this.isGestor(user) && compromisso.responsavelId !== user.id) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          message: 'Você não tem permissão para concluir este compromisso.',
        })
      }
      session.flash('error', 'Você não tem permissão para concluir este compromisso.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(concluirCompromissoValidator)

    // Transação atômica para conclusão e alimentação da timeline do lead
    await db.transaction(async (trx) => {
      compromisso.useTransaction(trx)
      compromisso.status = StatusCompromisso.CONCLUIDO
      compromisso.desfecho = payload.desfecho
      await compromisso.save()

      if (compromisso.leadId) {
        await InteracaoLead.create(
          {
            leadId: compromisso.leadId,
            responsavelId: user.id,
            tipo: 'reuniao',
            resumo: `Compromisso concluído: ${compromisso.titulo} - Desfecho: ${payload.desfecho}`,
          },
          { client: trx }
        )

        const lead = await Lead.find(compromisso.leadId, { client: trx })
        if (lead) {
          lead.useTransaction(trx)
          lead.ultimaInteracaoEm = DateTime.now().toUTC()
          await lead.save()
        }
      }
    })

    await compromisso.load('tipo')
    await compromisso.load('responsavel')

    if (this.wantsJson(request)) {
      return response.json({
        message: 'Compromisso concluído com sucesso e registrado na linha do tempo do lead.',
        compromisso,
      })
    }

    session.flash(
      'success',
      'Compromisso concluído com sucesso e registrado na linha do tempo do lead.'
    )
    return response.redirect().back()
  }
}
