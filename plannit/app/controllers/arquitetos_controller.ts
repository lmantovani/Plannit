import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Arquiteto from '#models/arquiteto'
import User, { PerfilUsuario } from '#models/user'
import DecisorArquiteto from '#models/decisor_arquiteto'
import ConcorrenteArquiteto from '#models/concorrente_arquiteto'
import HistoricoDonoArquiteto from '#models/historico_dono_arquiteto'
import InteracaoArquiteto from '#models/interacao_arquiteto'
import MetaVisitasConsultor from '#models/meta_visitas_consultor'
import {
  calcularScoreArquiteto,
  calcularKpisCarteira,
  obterMetaVisitasConsultor,
} from '#services/arquiteto_score_service'
import {
  createArquitetoValidator,
  updateArquitetoValidator,
  reatribuirDonoValidator,
  decisorValidator,
  updateDecisorValidator,
  concorrenteValidator,
  updateConcorrenteValidator,
  interacaoArquitetoValidator,
  metaVisitasValidator,
} from '#validators/arquiteto'

export default class ArquitetosController {
  /**
   * Helper para verificar se a requisição espera retorno JSON em vez de página Inertia.
   */
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = request.header('x-inertia') === 'true'
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.qs().format === 'json'
  }

  /**
   * Helper para verificar se o usuário autenticado possui perfil gerencial.
   */
  private isGestor(user: User): boolean {
    if (user.isSuperuser) return true
    const perfil = String(user.perfil || '').toLowerCase()
    return ['diretoria', 'gerente_comercial', 'admin'].includes(perfil)
  }

  /**
   * Listagem de especificadores com busca textual, filtros combinados,
   * cálculo de score analítico em lote, KPIs da carteira e meta do consultor.
   */
  async index({ request, inertia, response, auth }: HttpContext) {
    const user = auth.user!
    const query = request.qs()
    const search = (query.q || query.busca || '').trim()
    const tipoFilter = query.tipo
    const statusCarteiraFilter = query.statusCarteira
    const consultorFilter = query.consultorId ? Number(query.consultorId) : null
    const includeInactive = query.includeInactive === 'true' || query.includeInactive === '1'

    const arquitetoQuery = Arquiteto.query()

    if (!includeInactive) {
      arquitetoQuery.where('is_active', true)
    }

    if (user.perfil === PerfilUsuario.VENDEDOR) {
      // Vendedor tem visão prioritária da sua carteira se especificado ou por filtro
      if (consultorFilter) {
        arquitetoQuery.where('consultor_id', consultorFilter)
      }
    } else if (consultorFilter) {
      arquitetoQuery.where('consultor_id', consultorFilter)
    }

    if (tipoFilter) {
      arquitetoQuery.where('tipo', tipoFilter)
    }

    if (statusCarteiraFilter) {
      arquitetoQuery.where('status_carteira', statusCarteiraFilter)
    }

    if (search) {
      arquitetoQuery.where((builder) => {
        builder
          .whereILike('nome', `%${search}%`)
          .orWhereILike('escritorio', `%${search}%`)
          .orWhereILike('telefone', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    arquitetoQuery
      .preload('consultor', (cQuery) => cQuery.select('id', 'nome', 'email'))
      .orderBy('nome', 'asc')

    const rawArquitetos = await arquitetoQuery

    // Calcula score analítico para cada especificador
    const especificadores = await Promise.all(
      rawArquitetos.map(async (arq) => {
        const score = await calcularScoreArquiteto(arq)
        return {
          id: arq.id,
          nome: arq.nome,
          escritorio: arq.escritorio,
          enderecoEscritorio: arq.enderecoEscritorio,
          telefone: arq.telefone,
          email: arq.email,
          nivelParceria: arq.nivelParceria,
          tipo: arq.tipo,
          especialidade: arq.especialidade,
          consultorId: arq.consultorId,
          statusCarteira: arq.statusCarteira,
          isActive: arq.isActive,
          createdAt: arq.createdAt ? arq.createdAt.toISO() : null,
          updatedAt: arq.updatedAt ? arq.updatedAt.toISO() : null,
          consultor: arq.consultor
            ? { id: arq.consultor.id, nome: arq.consultor.nome, email: arq.consultor.email }
            : null,
          score,
        }
      })
    )

    // KPIs de carteira agregados
    const kpis = await calcularKpisCarteira(consultorFilter || undefined)

    // Meta individual do usuário logado
    const minhaMeta = await obterMetaVisitasConsultor(user.id)

    // Lista de consultores para seletores e filtros
    const consultores = await User.query()
      .whereIn('perfil', [
        PerfilUsuario.VENDEDOR,
        PerfilUsuario.GERENTE_COMERCIAL,
        PerfilUsuario.DIRETORIA,
      ])
      .where('is_active', true)
      .orderBy('nome', 'asc')
      .select('id', 'nome', 'email')

    if (this.wantsJson(request)) {
      return response.json({
        especificadores,
        kpis,
        minhaMeta,
        consultores,
      })
    }

    return inertia.render('especificadores/index' as any, {
      especificadores,
      kpis,
      minhaMeta,
      consultores,
      filtros: {
        busca: search,
        tipo: tipoFilter || '',
        statusCarteira: statusCarteiraFilter || '',
        consultorId: consultorFilter ? String(consultorFilter) : '',
      },
    })
  }

  /**
   * Detalhamento de um especificador (com abas Perfil, Score, Decisores & Concorrentes).
   */
  async show({ params, request, inertia, response }: HttpContext) {
    const arquiteto = await Arquiteto.query()
      .where('id', params.id)
      .preload('consultor', (c) => c.select('id', 'nome', 'email'))
      .preload('decisores', (d) => d.orderBy('isPrincipal', 'desc').orderBy('nome', 'asc'))
      .preload('concorrentes', (c) => c.preload('registradoPor', (r) => r.select('id', 'nome')))
      .preload('historicoDono', (h) => {
        h.preload('consultorAnterior', (u) => u.select('id', 'nome'))
          .preload('consultorNovo', (u) => u.select('id', 'nome'))
          .preload('alteradoPor', (u) => u.select('id', 'nome'))
          .orderBy('createdAt', 'desc')
      })
      .preload('interacoes', (i) => {
        i.preload('responsavel', (u) => u.select('id', 'nome'))
          .preload('lead', (l) => l.select('id', 'nome'))
          .orderBy('data', 'desc')
      })
      .firstOrFail()

    const score = await calcularScoreArquiteto(arquiteto)

    const serialized = {
      id: arquiteto.id,
      nome: arquiteto.nome,
      escritorio: arquiteto.escritorio,
      enderecoEscritorio: arquiteto.enderecoEscritorio,
      telefone: arquiteto.telefone,
      email: arquiteto.email,
      nivelParceria: arquiteto.nivelParceria,
      tipo: arquiteto.tipo,
      especialidade: arquiteto.especialidade,
      consultorId: arquiteto.consultorId,
      statusCarteira: arquiteto.statusCarteira,
      isActive: arquiteto.isActive,
      createdAt: arquiteto.createdAt ? arquiteto.createdAt.toISO() : null,
      updatedAt: arquiteto.updatedAt ? arquiteto.updatedAt.toISO() : null,
      consultor: arquiteto.consultor
        ? { id: arquiteto.consultor.id, nome: arquiteto.consultor.nome, email: arquiteto.consultor.email }
        : null,
      decisores: arquiteto.decisores.map((d) => ({
        id: d.id,
        arquitetoId: d.arquitetoId,
        nome: d.nome,
        cargo: d.cargo,
        telefone: d.telefone,
        email: d.email,
        observacoes: d.observacoes,
        isPrincipal: d.isPrincipal,
        createdAt: d.createdAt ? d.createdAt.toISO() : null,
      })),
      concorrentes: arquiteto.concorrentes.map((c) => ({
        id: c.id,
        arquitetoId: c.arquitetoId,
        nomeConcorrente: c.nomeConcorrente,
        percentualFechamentoEstimado: Number(c.percentualFechamentoEstimado) || 0,
        observacoes: c.observacoes,
        registradoPor: c.registradoPor
          ? { id: c.registradoPor.id, nome: c.registradoPor.nome }
          : null,
      })),
      historicoDono: arquiteto.historicoDono.map((h) => ({
        id: h.id,
        arquitetoId: h.arquitetoId,
        consultorAnteriorId: h.consultorAnteriorId,
        consultorNovoId: h.consultorNovoId,
        alteradoPorId: h.alteradoPorId,
        motivo: h.motivo,
        createdAt: h.createdAt ? h.createdAt.toISO() : null,
        consultorAnterior: h.consultorAnterior
          ? { id: h.consultorAnterior.id, nome: h.consultorAnterior.nome }
          : null,
        consultorNovo: h.consultorNovo
          ? { id: h.consultorNovo.id, nome: h.consultorNovo.nome }
          : null,
        alteradoPor: h.alteradoPor
          ? { id: h.alteradoPor.id, nome: h.alteradoPor.nome }
          : null,
      })),
      interacoes: arquiteto.interacoes.map((i) => ({
        id: i.id,
        arquitetoId: i.arquitetoId,
        responsavelId: i.responsavelId,
        tipo: i.tipo,
        resumo: i.resumo,
        leadId: i.leadId,
        data: i.data ? i.data.toISO() : null,
        createdAt: i.createdAt ? i.createdAt.toISO() : null,
        responsavel: i.responsavel
          ? { id: i.responsavel.id, nome: i.responsavel.nome }
          : null,
        lead: i.lead ? { id: i.lead.id, nome: i.lead.nome } : null,
      })),
    }

    if (this.wantsJson(request)) {
      return response.json({ arquiteto: serialized, score })
    }

    return inertia.render('especificadores/show' as any, {
      arquiteto: serialized,
      score,
    })
  }

  /**
   * Criação de novo especificador com transacionalidade atômica.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createArquitetoValidator)

    let consultorId = payload.consultorId
    if (!consultorId && user.perfil === PerfilUsuario.VENDEDOR) {
      consultorId = user.id
    }

    const arquiteto = await db.transaction(async (trx) => {
      const novoArquiteto = await Arquiteto.create(
        {
          nome: payload.nome,
          escritorio: payload.escritorio || null,
          enderecoEscritorio: payload.enderecoEscritorio || null,
          telefone: payload.telefone || null,
          email: payload.email || null,
          nivelParceria: payload.nivelParceria || 'parceiro',
          tipo: payload.tipo || 'arquiteto',
          especialidade: payload.especialidade || null,
          consultorId: consultorId || null,
          statusCarteira: payload.statusCarteira || 'em_prospeccao',
          isActive: true,
        },
        { client: trx }
      )

      // Se foi atribuído consultor na criação, registra auditoria inicial imutável
      if (consultorId) {
        await HistoricoDonoArquiteto.create(
          {
            arquitetoId: novoArquiteto.id,
            consultorAnteriorId: null,
            consultorNovoId: consultorId,
            alteradoPorId: user.id,
            motivo: 'Atribuição inicial de consultor no cadastro',
          },
          { client: trx }
        )
      }

      return novoArquiteto
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(arquiteto)
    }

    session.flash('success', `Especificador "${payload.nome}" cadastrado com sucesso!`)
    return response.redirect().back()
  }

  /**
   * Edição dos dados cadastrais do especificador.
   */
  async update({ params, request, response, session }: HttpContext) {
    const arquiteto = await Arquiteto.findOrFail(params.id)
    const payload = await request.validateUsing(updateArquitetoValidator)

    arquiteto.merge({
      ...(payload.nome !== undefined && { nome: payload.nome }),
      ...(payload.escritorio !== undefined && { escritorio: payload.escritorio }),
      ...(payload.enderecoEscritorio !== undefined && { enderecoEscritorio: payload.enderecoEscritorio }),
      ...(payload.telefone !== undefined && { telefone: payload.telefone }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.nivelParceria !== undefined && { nivelParceria: payload.nivelParceria }),
      ...(payload.tipo !== undefined && { tipo: payload.tipo }),
      ...(payload.especialidade !== undefined && { especialidade: payload.especialidade }),
      ...(payload.statusCarteira !== undefined && { statusCarteira: payload.statusCarteira }),
    })

    await arquiteto.save()

    if (this.wantsJson(request)) {
      return response.json(arquiteto)
    }

    session.flash('success', 'Dados cadastrais atualizados com sucesso.')
    return response.redirect().back()
  }

  /**
   * Soft delete estrito conforme Guardrail RN017 e proteção RBAC.
   * Apenas gestores ou o próprio consultor dono podem desativar.
   * Nunca remove fisicamente do banco de dados para preservar integridade referencial.
   */
  async destroy({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const arquiteto = await Arquiteto.findOrFail(params.id)

    const isGestor = this.isGestor(user)
    const isDono = arquiteto.consultorId === user.id

    if (!isGestor && !isDono) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          error: 'Apenas gestores ou o consultor responsável podem desativar este especificador.',
        })
      }
      session.flash('error', 'Apenas gestores ou o consultor responsável podem desativar este especificador.')
      return response.redirect().back()
    }

    arquiteto.isActive = false
    await arquiteto.save()

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: 'Especificador desativado com sucesso (soft delete).',
      })
    }

    session.flash('success', 'Especificador desativado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Reatribuição de consultor dono com auditoria imutável transacional (RN017).
   * Restrito a perfis de gestão (diretoria, gerente comercial, admin).
   */
  async reatribuirDono({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!

    if (!this.isGestor(user)) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          error: 'Apenas gestores têm permissão para reatribuir o consultor dono de um especificador.',
        })
      }
      session.flash('error', 'Apenas gestores têm permissão para reatribuir o consultor dono de um especificador.')
      return response.redirect().back()
    }

    const arquiteto = await Arquiteto.findOrFail(params.id)
    const payload = await request.validateUsing(reatribuirDonoValidator)

    const consultorAnteriorId = arquiteto.consultorId
    const consultorNovoId = payload.consultorNovoId

    await db.transaction(async (trx) => {
      arquiteto.useTransaction(trx)
      arquiteto.consultorId = consultorNovoId
      await arquiteto.save()

      await HistoricoDonoArquiteto.create(
        {
          arquitetoId: arquiteto.id,
          consultorAnteriorId,
          consultorNovoId,
          alteradoPorId: user.id,
          motivo: payload.motivo || 'Transferência de carteira comercial',
        },
        { client: trx }
      )
    })

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: 'Dono de carteira reatribuído com sucesso.',
        arquitetoId: arquiteto.id,
        consultorNovoId,
      })
    }

    session.flash('success', 'Consultor responsável alterado com sucesso.')
    return response.redirect().back()
  }

  /**
   * Consulta o histórico imutável de dono de carteira de um arquiteto (RN017).
   */
  async historicoDono({ params, response }: HttpContext) {
    const historico = await HistoricoDonoArquiteto.query()
      .where('arquiteto_id', params.id)
      .preload('consultorAnterior', (u) => u.select('id', 'nome'))
      .preload('consultorNovo', (u) => u.select('id', 'nome'))
      .preload('alteradoPor', (u) => u.select('id', 'nome'))
      .orderBy('created_at', 'desc')

    return response.json(historico)
  }

  /**
   * Retorna exclusivamente o cálculo de score analítico em JSON.
   */
  async score({ params, response }: HttpContext) {
    const arquiteto = await Arquiteto.findOrFail(params.id)
    const score = await calcularScoreArquiteto(arquiteto)
    return response.json(score)
  }

  /**
   * Retorna os KPIs agregados de carteira.
   */
  async kpis({ request, response }: HttpContext) {
    const query = request.qs()
    const consultorId = query.consultorId ? Number(query.consultorId) : undefined
    const kpis = await calcularKpisCarteira(consultorId)
    return response.json(kpis)
  }

  // -------------------------------------------------------------
  // Sub-recurso: Decisores do Escritório
  // -------------------------------------------------------------

  async listarDecisores({ params, response }: HttpContext) {
    const decisores = await DecisorArquiteto.query()
      .where('arquiteto_id', params.id)
      .orderBy('isPrincipal', 'desc')
      .orderBy('nome', 'asc')
    return response.json(decisores)
  }

  async criarDecisor({ params, request, response, session }: HttpContext) {
    const arquiteto = await Arquiteto.findOrFail(params.id)
    const payload = await request.validateUsing(decisorValidator)

    if (payload.isPrincipal) {
      await DecisorArquiteto.query()
        .where('arquiteto_id', arquiteto.id)
        .update({ isPrincipal: false })
    }

    const decisor = await DecisorArquiteto.create({
      arquitetoId: arquiteto.id,
      nome: payload.nome,
      cargo: payload.cargo || null,
      telefone: payload.telefone || null,
      email: payload.email || null,
      observacoes: payload.observacoes || null,
      isPrincipal: payload.isPrincipal || false,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(decisor)
    }

    session.flash('success', 'Decisor cadastrado com sucesso.')
    return response.redirect().back()
  }

  async atualizarDecisor({ params, request, response, session }: HttpContext) {
    const decisor = await DecisorArquiteto.query()
      .where('id', params.decisorId)
      .where('arquiteto_id', params.id)
      .firstOrFail()

    const payload = await request.validateUsing(updateDecisorValidator)

    if (payload.isPrincipal) {
      await DecisorArquiteto.query()
        .where('arquiteto_id', params.id)
        .whereNot('id', decisor.id)
        .update({ isPrincipal: false })
    }

    decisor.merge({
      ...(payload.nome !== undefined && { nome: payload.nome }),
      ...(payload.cargo !== undefined && { cargo: payload.cargo }),
      ...(payload.telefone !== undefined && { telefone: payload.telefone }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.observacoes !== undefined && { observacoes: payload.observacoes }),
      ...(payload.isPrincipal !== undefined && { isPrincipal: payload.isPrincipal }),
    })

    await decisor.save()

    if (this.wantsJson(request)) {
      return response.json(decisor)
    }

    session.flash('success', 'Decisor atualizado com sucesso.')
    return response.redirect().back()
  }

  async removerDecisor({ params, request, response, session }: HttpContext) {
    const decisor = await DecisorArquiteto.query()
      .where('id', params.decisorId)
      .where('arquiteto_id', params.id)
      .firstOrFail()

    await decisor.delete()

    if (this.wantsJson(request)) {
      return response.json({ success: true, message: 'Decisor removido com sucesso.' })
    }

    session.flash('success', 'Decisor removido com sucesso.')
    return response.redirect().back()
  }

  // -------------------------------------------------------------
  // Sub-recurso: Concorrentes
  // -------------------------------------------------------------

  async listarConcorrentes({ params, response }: HttpContext) {
    const concorrentes = await ConcorrenteArquiteto.query()
      .where('arquiteto_id', params.id)
      .preload('registradoPor', (u) => u.select('id', 'nome'))
      .orderBy('percentualFechamentoEstimado', 'desc')
    return response.json(concorrentes)
  }

  async criarConcorrente({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const arquiteto = await Arquiteto.findOrFail(params.id)
    const payload = await request.validateUsing(concorrenteValidator)

    const concorrente = await ConcorrenteArquiteto.create({
      arquitetoId: arquiteto.id,
      nomeConcorrente: payload.nomeConcorrente,
      percentualFechamentoEstimado: String(payload.percentualFechamentoEstimado),
      observacoes: payload.observacoes || null,
      registradoPorId: user.id,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(concorrente)
    }

    session.flash('success', 'Concorrente registrado com sucesso.')
    return response.redirect().back()
  }

  async atualizarConcorrente({ params, request, response, session }: HttpContext) {
    const concorrente = await ConcorrenteArquiteto.query()
      .where('id', params.concorrenteId)
      .where('arquiteto_id', params.id)
      .firstOrFail()

    const payload = await request.validateUsing(updateConcorrenteValidator)

    concorrente.merge({
      ...(payload.nomeConcorrente !== undefined && {
        nomeConcorrente: payload.nomeConcorrente,
      }),
      ...(payload.percentualFechamentoEstimado !== undefined && {
        percentualFechamentoEstimado: String(payload.percentualFechamentoEstimado),
      }),
      ...(payload.observacoes !== undefined && { observacoes: payload.observacoes }),
    })

    await concorrente.save()

    if (this.wantsJson(request)) {
      return response.json(concorrente)
    }

    session.flash('success', 'Concorrente atualizado com sucesso.')
    return response.redirect().back()
  }

  async removerConcorrente({ params, request, response, session }: HttpContext) {
    const concorrente = await ConcorrenteArquiteto.query()
      .where('id', params.concorrenteId)
      .where('arquiteto_id', params.id)
      .firstOrFail()

    await concorrente.delete()

    if (this.wantsJson(request)) {
      return response.json({ success: true, message: 'Concorrente removido com sucesso.' })
    }

    session.flash('success', 'Concorrente removido com sucesso.')
    return response.redirect().back()
  }

  // -------------------------------------------------------------
  // Sub-recurso: Interações
  // -------------------------------------------------------------

  async listarInteracoes({ params, response }: HttpContext) {
    const interacoes = await InteracaoArquiteto.query()
      .where('arquiteto_id', params.id)
      .preload('responsavel', (u) => u.select('id', 'nome'))
      .preload('lead', (l) => l.select('id', 'nome'))
      .orderBy('data', 'desc')
    return response.json(interacoes)
  }

  async criarInteracao({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const arquiteto = await Arquiteto.findOrFail(params.id)
    const payload = await request.validateUsing(interacaoArquitetoValidator)

    const dataInteracao = payload.data
      ? DateTime.fromISO(payload.data).toUTC()
      : DateTime.now().toUTC()

    const interacao = await InteracaoArquiteto.create({
      arquitetoId: arquiteto.id,
      responsavelId: user.id,
      tipo: payload.tipo,
      resumo: payload.resumo,
      leadId: payload.leadId || null,
      data: dataInteracao,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(interacao)
    }

    session.flash('success', 'Interação registrada com sucesso.')
    return response.redirect().back()
  }

  // -------------------------------------------------------------
  // Gestão de Metas de Visitas Mensais por Consultor
  // -------------------------------------------------------------

  async listarMetas({ response }: HttpContext) {
    const metas = await MetaVisitasConsultor.query()
      .preload('consultor', (u) => u.select('id', 'nome', 'email'))
      .preload('configuradoPor', (u) => u.select('id', 'nome'))
      .orderBy('metaVisitasMes', 'desc')

    return response.json(metas)
  }

  async definirMeta({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(metaVisitasValidator)

    const isGestor = this.isGestor(user)
    if (!isGestor && payload.consultorId !== user.id) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          error: 'Apenas gestores podem alterar metas de outros consultores.',
        })
      }
      session.flash('error', 'Apenas gestores podem alterar metas de outros consultores.')
      return response.redirect().back()
    }

    let meta = await MetaVisitasConsultor.query()
      .where('consultor_id', payload.consultorId)
      .first()

    if (meta) {
      meta.metaVisitasMes = payload.metaVisitasMes
      meta.configuradoPorId = user.id
      await meta.save()
    } else {
      meta = await MetaVisitasConsultor.create({
        consultorId: payload.consultorId,
        metaVisitasMes: payload.metaVisitasMes,
        configuradoPorId: user.id,
      })
    }

    if (this.wantsJson(request)) {
      return response.json(meta)
    }

    session.flash('success', 'Meta de visitas configurada com sucesso.')
    return response.redirect().back()
  }

  async minhaMeta({ auth, response }: HttpContext) {
    const user = auth.user!
    const meta = await obterMetaVisitasConsultor(user.id)
    return response.json(meta)
  }
}
