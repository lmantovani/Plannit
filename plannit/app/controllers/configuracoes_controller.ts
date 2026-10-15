import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import AmbienteCatalogo from '#models/ambiente_catalogo'
import OrigemLeadCatalogo from '#models/origem_lead_catalogo'
import CampanhaLead from '#models/campanha_lead'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'
import PerfilCatalogo from '#models/perfil_catalogo'
import RoteiroBriefing from '#models/roteiro_briefing'
import RoteiroBriefingAmbiente from '#models/roteiro_briefing_ambiente'
import User, { PerfilUsuario, PERFIL_LABELS } from '#models/user'
import PerfilPermissao, { DEFINICOES_PERMISSOES, MODULOS_SISTEMA } from '#models/perfil_permissao'
import PermissionService from '#services/permission_service'
import {
  createAmbienteValidator,
  updateAmbienteValidator,
  createOrigemValidator,
  updateOrigemValidator,
  createCampanhaValidator,
  updateCampanhaValidator,
  createTipoCompromissoValidator,
  updateTipoCompromissoValidator,
  togglePermissaoValidator,
  createPerfilValidator,
  updatePerfilValidator,
  createRoteiroValidator,
  updateRoteiroValidator,
} from '#validators/configuracao'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default class ConfiguracoesController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = request.header('x-inertia') === 'true'
    if (isInertia) return false
    const accept = request.header('accept') || ''
    const contentType = request.header('content-type') || ''
    return (
      accept.includes('application/json') ||
      contentType.includes('application/json') ||
      request.qs().format === 'json'
    )
  }

  private async isAuthorized(user: User): Promise<boolean> {
    if (user.isSuperuser || user.perfil === PerfilUsuario.DIRETORIA) return true
    return PermissionService.hasPermission(user, 'configuracoes.visualizar')
  }

  /**
   * Painel de parametrização administrativa de tabelas de apoio e permissões
   */
  async index({ inertia, auth, response, request }: HttpContext) {
    const user = auth.user!
    if (!(await this.isAuthorized(user))) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const podeGerenciarPermissoes = await PermissionService.podeGerenciarPermissoes(user)

    let permissoesConfig = null
    if (podeGerenciarPermissoes) {
      const permissoesDb = await PerfilPermissao.query()
      const perfisDb = await PerfilCatalogo.query().orderBy('ordem', 'asc').orderBy('nome', 'asc')

      const perfis =
        perfisDb.length > 0
          ? perfisDb.map((p) => ({
              id: p.id,
              key: p.slug,
              label: p.nome,
              descricao: p.descricao,
              isSistema: p.isSistema,
              isActive: p.isActive,
              ordem: p.ordem,
              isDiretoria: p.slug === 'diretoria',
            }))
          : Object.values(PerfilUsuario).map((p, idx) => ({
              id: idx + 1,
              key: p,
              label: PERFIL_LABELS[p] || p,
              descricao: null,
              isSistema: p === PerfilUsuario.DIRETORIA,
              isActive: true,
              ordem: (idx + 1) * 10,
              isDiretoria: p === PerfilUsuario.DIRETORIA,
            }))

      const matrix: Record<string, Record<string, boolean>> = {}
      for (const p of perfis) {
        matrix[p.key] = {}
      }

      for (const row of permissoesDb) {
        if (!matrix[row.perfil]) {
          matrix[row.perfil] = {}
        }
        matrix[row.perfil][row.permissaoCodigo] = row.concedido
      }

      permissoesConfig = {
        modulos: MODULOS_SISTEMA,
        definicoes: DEFINICOES_PERMISSOES,
        perfis,
        matrix,
      }
    }

    const ambientes = await AmbienteCatalogo.query()
      .orderBy('ordem', 'asc')
      .orderBy('nome', 'asc')

    const origens = await OrigemLeadCatalogo.query()
      .orderBy('nome', 'asc')

    const campanhas = await CampanhaLead.query()
      .orderBy('createdAt', 'desc')

    const tiposCompromisso = await TipoCompromissoCatalogo.query()
      .orderBy('ordem', 'asc')
      .orderBy('nome', 'asc')

    const roteiros = await RoteiroBriefing.query()
      .preload('ambientes')
      .orderBy('ordem', 'asc')
      .orderBy('titulo', 'asc')

    // Carrega usuários do sistema com perfis mapeados
    const todosPerfis = await PerfilCatalogo.query().orderBy('ordem', 'asc')
    const perfisMap = new Map(todosPerfis.map((p) => [p.slug, p.nome]))

    const usuarios = await User.query().orderBy('nome', 'asc')
    const usuariosFormatados = usuarios.map((u) => {
      const perfilNome =
        perfisMap.get(u.perfil) ||
        (PERFIL_LABELS as Record<string, string>)[u.perfil] ||
        u.perfil
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone || null,
        perfil: u.perfil,
        perfilLabel: perfilNome,
        isActive: u.isActive,
        isSuperuser: u.isSuperuser,
        ultimoLogin: u.ultimoLogin ? u.ultimoLogin.toISO() : null,
        createdAt: u.createdAt ? u.createdAt.toISO() : null,
      }
    })

    const payload = {
      podeGerenciarPermissoes,
      permissoesConfig,
      usuarios: usuariosFormatados,
      perfisCatalogo: todosPerfis.map((p) => ({
        id: p.id,
        slug: p.slug,
        nome: p.nome,
        isActive: p.isActive,
      })),
      ambientes: ambientes.map((a) => ({
        id: a.id,
        nome: a.nome,
        categoria: a.categoria,
        ordem: a.ordem,
        isActive: a.isActive,
        createdAt: a.createdAt?.toISO() || null,
        updatedAt: a.updatedAt?.toISO() || null,
      })),
      origens: origens.map((o) => ({
        id: o.id,
        nome: o.nome,
        slug: o.slug,
        isActive: o.isActive,
        createdAt: o.createdAt?.toISO() || null,
        updatedAt: o.updatedAt?.toISO() || null,
      })),
      campanhas: campanhas.map((c) => ({
        id: c.id,
        nome: c.nome,
        dataInicio: c.dataInicio ? c.dataInicio.toISODate() : null,
        dataFim: c.dataFim ? c.dataFim.toISODate() : null,
        isActive: c.isActive,
        createdAt: c.createdAt?.toISO() || null,
        updatedAt: c.updatedAt?.toISO() || null,
      })),
      tiposCompromisso: tiposCompromisso.map((t) => ({
        id: t.id,
        nome: t.nome,
        slug: t.slug,
        cor: t.cor,
        ordem: t.ordem,
        isActive: t.isActive,
        createdAt: t.createdAt?.toISO() || null,
        updatedAt: t.updatedAt?.toISO() || null,
      })),
      roteiros: roteiros.map((r) => ({
        id: r.id,
        slug: r.slug,
        titulo: r.titulo,
        subtitulo: r.subtitulo,
        secoes: r.secoes || [],
        isActive: r.isActive,
        ordem: r.ordem,
        ambientes: r.ambientes.map((a) => a.ambienteNome),
        totalSecoes: Array.isArray(r.secoes) ? r.secoes.length : 0,
        createdAt: r.createdAt?.toISO() || null,
        updatedAt: r.updatedAt?.toISO() || null,
      })),
    }

    if (request.qs().format === 'json') {
      return response.json(payload)
    }

    return inertia.render('configuracoes/index', payload)
  }

  // ==========================================
  // AMBIENTES
  // ==========================================

  async storeAmbiente({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const payload = await request.validateUsing(createAmbienteValidator)

    const ambiente = await AmbienteCatalogo.create({
      nome: payload.nome,
      categoria: payload.categoria || 'Geral',
      ordem: payload.ordem !== undefined ? payload.ordem : 0,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(ambiente)
    }

    session.flash('success', `Ambiente "${ambiente.nome}" cadastrado com sucesso.`)
    return response.redirect().back()
  }

  async updateAmbiente({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const ambiente = await AmbienteCatalogo.findOrFail(params.id)
    const payload = await request.validateUsing(updateAmbienteValidator)

    if (payload.nome !== undefined) ambiente.nome = payload.nome
    if (payload.categoria !== undefined) ambiente.categoria = payload.categoria
    if (payload.ordem !== undefined) ambiente.ordem = payload.ordem
    if (payload.isActive !== undefined) ambiente.isActive = payload.isActive

    await ambiente.save()

    if (this.wantsJson(request)) {
      return response.json(ambiente)
    }

    session.flash('success', `Ambiente "${ambiente.nome}" atualizado com sucesso.`)
    return response.redirect().back()
  }

  async toggleAmbiente({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const ambiente = await AmbienteCatalogo.findOrFail(params.id)
    ambiente.isActive = !ambiente.isActive
    await ambiente.save()

    if (this.wantsJson(request)) {
      return response.json(ambiente)
    }

    session.flash(
      'success',
      `Ambiente "${ambiente.nome}" ${ambiente.isActive ? 'ativado' : 'desativado'} com sucesso.`
    )
    return response.redirect().back()
  }

  async destroyAmbiente({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const ambiente = await AmbienteCatalogo.findOrFail(params.id)
    await ambiente.delete()

    if (this.wantsJson(request)) {
      return response.json({ message: 'Ambiente removido com sucesso' })
    }

    session.flash('success', `Ambiente "${ambiente.nome}" removido do catálogo.`)
    return response.redirect().back()
  }

  // ==========================================
  // ORIGENS
  // ==========================================

  async storeOrigem({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const payload = await request.validateUsing(createOrigemValidator)
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.nome)

    if (!slug || slug.length < 2) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Identificador (slug) inválido ou vazio.' })
      }
      session.flash('error', 'Identificador (slug) inválido ou vazio.')
      return response.redirect().back()
    }

    const existing = await OrigemLeadCatalogo.findBy('slug', slug)
    if (existing) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: `A origem com identificador "${slug}" já existe.` })
      }
      session.flash('error', `A origem com identificador "${slug}" já existe.`)
      return response.redirect().back()
    }

    const origem = await OrigemLeadCatalogo.create({
      nome: payload.nome,
      slug,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(origem)
    }

    session.flash('success', `Origem "${origem.nome}" cadastrada com sucesso.`)
    return response.redirect().back()
  }

  async updateOrigem({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const origem = await OrigemLeadCatalogo.findOrFail(params.id)
    const payload = await request.validateUsing(updateOrigemValidator)

    if (payload.nome !== undefined) origem.nome = payload.nome
    if (payload.slug !== undefined) {
      const slugRaw = payload.slug || payload.nome || origem.nome
      const slug = slugify(slugRaw)
      if (!slug || slug.length < 2) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Identificador (slug) inválido ou vazio.' })
        }
        session.flash('error', 'Identificador (slug) inválido ou vazio.')
        return response.redirect().back()
      }

      const existing = await OrigemLeadCatalogo.query()
        .where('slug', slug)
        .whereNot('id', origem.id)
        .first()

      if (existing) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: `O identificador "${slug}" já está em uso.` })
        }
        session.flash('error', `O identificador "${slug}" já está em uso.`)
        return response.redirect().back()
      }
      origem.slug = slug
    }
    if (payload.isActive !== undefined) origem.isActive = payload.isActive

    await origem.save()

    if (this.wantsJson(request)) {
      return response.json(origem)
    }

    session.flash('success', `Origem "${origem.nome}" atualizada com sucesso.`)
    return response.redirect().back()
  }

  async toggleOrigem({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const origem = await OrigemLeadCatalogo.findOrFail(params.id)
    origem.isActive = !origem.isActive
    await origem.save()

    if (this.wantsJson(request)) {
      return response.json(origem)
    }

    session.flash(
      'success',
      `Origem "${origem.nome}" ${origem.isActive ? 'ativada' : 'desativada'} com sucesso.`
    )
    return response.redirect().back()
  }

  async destroyOrigem({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const origem = await OrigemLeadCatalogo.findOrFail(params.id)
    await origem.delete()

    if (this.wantsJson(request)) {
      return response.json({ message: 'Origem removida com sucesso' })
    }

    session.flash('success', `Origem "${origem.nome}" removida do catálogo.`)
    return response.redirect().back()
  }

  // ==========================================
  // CAMPANHAS
  // ==========================================

  async storeCampanha({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const payload = await request.validateUsing(createCampanhaValidator)
    const dtInicio = payload.dataInicio ? DateTime.fromISO(payload.dataInicio) : null
    const dtFim = payload.dataFim ? DateTime.fromISO(payload.dataFim) : null

    if (dtInicio && !dtInicio.isValid) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Data de início inválida.' })
      }
      session.flash('error', 'Data de início inválida.')
      return response.redirect().back()
    }

    if (dtFim && !dtFim.isValid) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Data de término inválida.' })
      }
      session.flash('error', 'Data de término inválida.')
      return response.redirect().back()
    }

    if (dtInicio && dtFim && dtFim < dtInicio) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'A data de término não pode ser anterior à data de início.' })
      }
      session.flash('error', 'A data de término não pode ser anterior à data de início.')
      return response.redirect().back()
    }

    const campanha = await CampanhaLead.create({
      nome: payload.nome,
      dataInicio: dtInicio && dtInicio.isValid ? dtInicio : null,
      dataFim: dtFim && dtFim.isValid ? dtFim : null,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(campanha)
    }

    session.flash('success', `Campanha "${campanha.nome}" cadastrada com sucesso.`)
    return response.redirect().back()
  }

  async updateCampanha({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const campanha = await CampanhaLead.findOrFail(params.id)
    const payload = await request.validateUsing(updateCampanhaValidator)

    let dtInicio = campanha.dataInicio
    let dtFim = campanha.dataFim

    if (payload.dataInicio !== undefined) {
      dtInicio = payload.dataInicio ? DateTime.fromISO(payload.dataInicio) : null
      if (dtInicio && !dtInicio.isValid) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Data de início inválida.' })
        }
        session.flash('error', 'Data de início inválida.')
        return response.redirect().back()
      }
    }

    if (payload.dataFim !== undefined) {
      dtFim = payload.dataFim ? DateTime.fromISO(payload.dataFim) : null
      if (dtFim && !dtFim.isValid) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Data de término inválida.' })
        }
        session.flash('error', 'Data de término inválida.')
        return response.redirect().back()
      }
    }

    if (dtInicio && dtFim && dtFim < dtInicio) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'A data de término não pode ser anterior à data de início.' })
      }
      session.flash('error', 'A data de término não pode ser anterior à data de início.')
      return response.redirect().back()
    }

    if (payload.nome !== undefined) campanha.nome = payload.nome
    if (payload.dataInicio !== undefined) {
      campanha.dataInicio = dtInicio && dtInicio.isValid ? dtInicio : null
    }
    if (payload.dataFim !== undefined) {
      campanha.dataFim = dtFim && dtFim.isValid ? dtFim : null
    }
    if (payload.isActive !== undefined) campanha.isActive = payload.isActive

    await campanha.save()

    if (this.wantsJson(request)) {
      return response.json(campanha)
    }

    session.flash('success', `Campanha "${campanha.nome}" atualizada com sucesso.`)
    return response.redirect().back()
  }

  async toggleCampanha({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const campanha = await CampanhaLead.findOrFail(params.id)
    campanha.isActive = !campanha.isActive
    await campanha.save()

    if (this.wantsJson(request)) {
      return response.json(campanha)
    }

    session.flash(
      'success',
      `Campanha "${campanha.nome}" ${campanha.isActive ? 'ativada' : 'desativada'} com sucesso.`
    )
    return response.redirect().back()
  }

  async destroyCampanha({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const campanha = await CampanhaLead.findOrFail(params.id)
    await campanha.delete()

    if (this.wantsJson(request)) {
      return response.json({ message: 'Campanha removida com sucesso' })
    }

    session.flash('success', `Campanha "${campanha.nome}" removida do catálogo.`)
    return response.redirect().back()
  }

  // ==========================================
  // TIPOS DE COMPROMISSO (AGENDA)
  // ==========================================

  async storeTipoCompromisso({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const payload = await request.validateUsing(createTipoCompromissoValidator)
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.nome)

    if (!slug || slug.length < 2) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Identificador (slug) inválido ou vazio.' })
      }
      session.flash('error', 'Identificador (slug) inválido ou vazio.')
      return response.redirect().back()
    }

    const existing = await TipoCompromissoCatalogo.findBy('slug', slug)
    if (existing) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: `O tipo de compromisso com identificador "${slug}" já existe.` })
      }
      session.flash('error', `O tipo de compromisso com identificador "${slug}" já existe.`)
      return response.redirect().back()
    }

    const tipo = await TipoCompromissoCatalogo.create({
      nome: payload.nome,
      slug,
      cor: payload.cor || '#3B82F6',
      ordem: payload.ordem !== undefined ? payload.ordem : 0,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(tipo)
    }

    session.flash('success', `Tipo de compromisso "${tipo.nome}" cadastrado com sucesso.`)
    return response.redirect().back()
  }

  async updateTipoCompromisso({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const tipo = await TipoCompromissoCatalogo.findOrFail(params.id)
    const payload = await request.validateUsing(updateTipoCompromissoValidator)

    if (payload.nome !== undefined) tipo.nome = payload.nome
    if (payload.slug !== undefined) {
      const slugRaw = payload.slug || payload.nome || tipo.nome
      const slug = slugify(slugRaw)
      if (!slug || slug.length < 2) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Identificador (slug) inválido ou vazio.' })
        }
        session.flash('error', 'Identificador (slug) inválido ou vazio.')
        return response.redirect().back()
      }

      const existing = await TipoCompromissoCatalogo.query()
        .where('slug', slug)
        .whereNot('id', tipo.id)
        .first()

      if (existing) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: `O identificador "${slug}" já está em uso.` })
        }
        session.flash('error', `O identificador "${slug}" já está em uso.`)
        return response.redirect().back()
      }
      tipo.slug = slug
    }
    if (payload.cor !== undefined) tipo.cor = payload.cor
    if (payload.ordem !== undefined) tipo.ordem = payload.ordem
    if (payload.isActive !== undefined) tipo.isActive = payload.isActive

    await tipo.save()

    if (this.wantsJson(request)) {
      return response.json(tipo)
    }

    session.flash('success', `Tipo de compromisso "${tipo.nome}" atualizado com sucesso.`)
    return response.redirect().back()
  }

  async toggleTipoCompromisso({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const tipo = await TipoCompromissoCatalogo.findOrFail(params.id)
    tipo.isActive = !tipo.isActive
    await tipo.save()

    if (this.wantsJson(request)) {
      return response.json(tipo)
    }

    session.flash(
      'success',
      `Tipo de compromisso "${tipo.nome}" ${tipo.isActive ? 'ativado' : 'desativado'} com sucesso.`
    )
    return response.redirect().back()
  }

  async destroyTipoCompromisso({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const tipo = await TipoCompromissoCatalogo.findOrFail(params.id)

    // Verificar se existem compromissos vinculados antes de excluir
    try {
      const hasTable = await db.rawQuery(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'compromissos_agenda'
        )`
      )
      const tableExists = Boolean(hasTable.rows?.[0]?.exists)
      if (tableExists) {
        const checkVinculos = await db
          .from('compromissos_agenda')
          .where('tipo_id', tipo.id)
          .count('* as total')
        const total = Number(checkVinculos[0]?.total || 0)
        if (total > 0) {
          if (this.wantsJson(request)) {
            return response.status(400).json({
              message: `Não é possível excluir o tipo "${tipo.nome}" pois existem ${total} compromisso(s) vinculado(s). Recomendamos desativá-lo.`,
            })
          }
          session.flash(
            'error',
            `Não é possível excluir o tipo "${tipo.nome}" pois existem ${total} compromisso(s) vinculado(s). Recomendamos desativá-lo.`
          )
          return response.redirect().back()
        }
      }
    } catch {
      // Ignora erro de verificação de tabela caso não exista
    }

    await tipo.delete()

    if (this.wantsJson(request)) {
      return response.json({ message: 'Tipo de compromisso removido com sucesso' })
    }

    session.flash('success', `Tipo de compromisso "${tipo.nome}" removido do catálogo.`)
    return response.redirect().back()
  }

  // ==========================================
  // PERMISSÕES & PERFIS
  // ==========================================

  async togglePermissao({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const podeGerenciar = await PermissionService.podeGerenciarPermissoes(user)
    if (!podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          message: 'Acesso restrito ao perfil de Diretoria e gestores autorizados.',
        })
      }
      session.flash('error', 'Acesso restrito ao perfil de Diretoria e gestores autorizados.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(togglePermissaoValidator)

    const resultado = await PermissionService.togglePermission(
      user,
      payload.perfil,
      payload.permissaoCodigo,
      payload.concedido
    )

    if (!resultado.success) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: resultado.message })
      }
      session.flash('error', resultado.message || 'Erro ao alterar permissão.')
      return response.redirect().back()
    }

    if (this.wantsJson(request)) {
      return response.json({ success: true, message: 'Permissão atualizada com sucesso.' })
    }

    session.flash('success', 'Permissão atualizada com sucesso.')
    return response.redirect().back()
  }

  // ==========================================
  // GESTÃO DE PERFIS DE USUÁRIO (CATÁLOGO)
  // ==========================================

  async storePerfil({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const podeGerenciar = await PermissionService.podeGerenciarPermissoes(user)
    if (!podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          message: 'Acesso restrito ao perfil de Diretoria e gestores autorizados.',
        })
      }
      session.flash('error', 'Acesso restrito ao perfil de Diretoria e gestores autorizados.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(createPerfilValidator)

    const finalSlug = slugify(payload.slug || payload.nome)
    if (!finalSlug) {
      if (this.wantsJson(request)) {
        return response.status(422).json({ message: 'Não foi possível gerar um slug válido para o perfil.' })
      }
      session.flash('error', 'Identificador (slug) do perfil inválido.')
      return response.redirect().back()
    }

    const existe = await PerfilCatalogo.findBy('slug', finalSlug)
    if (existe) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: `Já existe um perfil com o identificador "${finalSlug}".` })
      }
      session.flash('error', `Já existe um perfil com o identificador "${finalSlug}".`)
      return response.redirect().back()
    }

    const perfil = await PerfilCatalogo.create({
      nome: payload.nome,
      slug: finalSlug,
      descricao: payload.descricao || null,
      isSistema: false,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      ordem: payload.ordem !== undefined ? payload.ordem : 0,
    })

    // Inicializa as permissões do novo perfil
    const now = new Date()
    let permsModel: Array<{ permissaoCodigo: string; concedido: boolean }> = []

    if (payload.copiarDePerfil) {
      const permsCopiar = await PerfilPermissao.query().where('perfil', payload.copiarDePerfil)
      permsModel = permsCopiar.map((p) => ({
        permissaoCodigo: p.permissaoCodigo,
        concedido: p.concedido,
      }))
    }

    const rowsParaInserir = DEFINICOES_PERMISSOES.map((def) => {
      const encontrada = permsModel.find((p) => p.permissaoCodigo === def.codigo)
      return {
        perfil: finalSlug,
        modulo: def.modulo,
        permissao_codigo: def.codigo,
        descricao: def.descricao,
        concedido: encontrada ? encontrada.concedido : false,
        created_at: now,
        updated_at: now,
      }
    })

    await db.table('perfil_permissoes').multiInsert(rowsParaInserir)

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: `Perfil "${perfil.nome}" criado com sucesso!`,
        perfil,
      })
    }

    session.flash('success', `Perfil "${perfil.nome}" criado com sucesso!`)
    return response.redirect().back()
  }

  async updatePerfil({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const podeGerenciar = await PermissionService.podeGerenciarPermissoes(user)
    if (!podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          message: 'Acesso restrito ao perfil de Diretoria e gestores autorizados.',
        })
      }
      session.flash('error', 'Acesso restrito ao perfil de Diretoria e gestores autorizados.')
      return response.redirect().back()
    }

    const perfil = await PerfilCatalogo.find(params.id)
    if (!perfil) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Perfil não encontrado.' })
      }
      session.flash('error', 'Perfil não encontrado.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(updatePerfilValidator)

    if (perfil.isSistema && payload.isActive === false) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Perfis nativos do sistema não podem ser desativados.' })
      }
      session.flash('error', 'Perfis nativos do sistema não podem ser desativados.')
      return response.redirect().back()
    }

    if (payload.nome) perfil.nome = payload.nome
    if (payload.descricao !== undefined) perfil.descricao = payload.descricao || null
    if (payload.ordem !== undefined) perfil.ordem = payload.ordem
    if (payload.isActive !== undefined && !perfil.isSistema) perfil.isActive = payload.isActive

    await perfil.save()

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: `Perfil "${perfil.nome}" atualizado com sucesso!`,
        perfil,
      })
    }

    session.flash('success', `Perfil "${perfil.nome}" atualizado com sucesso!`)
    return response.redirect().back()
  }

  async destroyPerfil({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const podeGerenciar = await PermissionService.podeGerenciarPermissoes(user)
    if (!podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.status(403).json({
          message: 'Acesso restrito ao perfil de Diretoria e gestores autorizados.',
        })
      }
      session.flash('error', 'Acesso restrito ao perfil de Diretoria e gestores autorizados.')
      return response.redirect().back()
    }

    const perfil = await PerfilCatalogo.find(params.id)
    if (!perfil) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Perfil não encontrado.' })
      }
      session.flash('error', 'Perfil não encontrado.')
      return response.redirect().back()
    }

    if (perfil.isSistema) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Perfis nativos do sistema não podem ser excluídos.' })
      }
      session.flash('error', 'Perfis nativos do sistema não podem ser excluídos.')
      return response.redirect().back()
    }

    const checkUsers = await db.from('users').where('perfil', perfil.slug).count('* as total')
    const totalUsers = Number(checkUsers[0]?.total || 0)
    if (totalUsers > 0) {
      if (this.wantsJson(request)) {
        return response.status(400).json({
          message: `Não é possível excluir o perfil "${perfil.nome}" pois existem ${totalUsers} usuário(s) com este perfil atribuído. Recomendamos desativá-lo.`,
        })
      }
      session.flash(
        'error',
        `Não é possível excluir o perfil "${perfil.nome}" pois existem ${totalUsers} usuário(s) com este perfil atribuído. Recomendamos desativá-lo.`
      )
      return response.redirect().back()
    }

    // Exclui permissões e perfil
    await PerfilPermissao.query().where('perfil', perfil.slug).delete()
    await perfil.delete()

    if (this.wantsJson(request)) {
      return response.json({ success: true, message: `Perfil "${perfil.nome}" excluído com sucesso.` })
    }

    session.flash('success', `Perfil "${perfil.nome}" excluído com sucesso.`)
    return response.redirect().back()
  }

  // ==========================================
  // ROTEIROS DE BRIEFING
  // ==========================================

  async storeRoteiro({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!(await this.isAuthorized(user))) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const payload = await request.validateUsing(createRoteiroValidator)
    const slugBase = slugify(payload.slug || payload.titulo)
    let finalSlug = slugBase
    let counter = 1
    while (await RoteiroBriefing.findBy('slug', finalSlug)) {
      finalSlug = `${slugBase}_${counter}`
      counter++
    }

    const maxOrdemRow = await db.from('roteiros_briefings').max('ordem as max_ordem')
    const proximaOrdem = payload.ordem ?? (Number(maxOrdemRow[0]?.max_ordem || 0) + 10)

    const roteiro = await db.transaction(async (trx) => {
      const novoRoteiro = await RoteiroBriefing.create(
        {
          titulo: payload.titulo,
          subtitulo: payload.subtitulo || null,
          slug: finalSlug,
          secoes: payload.secoes || [],
          ordem: proximaOrdem,
          isActive: payload.isActive ?? true,
        },
        { client: trx }
      )

      if (payload.ambientes && Array.isArray(payload.ambientes)) {
        for (const ambNome of payload.ambientes) {
          if (ambNome.trim()) {
            await RoteiroBriefingAmbiente.create(
              {
                roteiroId: novoRoteiro.id,
                ambienteNome: ambNome.trim(),
              },
              { client: trx }
            )
          }
        }
      }

      return novoRoteiro
    })

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: 'Roteiro de apoio cadastrado com sucesso.',
        roteiro: {
          id: roteiro.id,
          titulo: roteiro.titulo,
          slug: roteiro.slug,
        },
      })
    }

    session.flash('success', 'Roteiro de apoio cadastrado com sucesso.')
    return response.redirect().back()
  }

  async updateRoteiro({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!(await this.isAuthorized(user))) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const roteiro = await RoteiroBriefing.find(params.id)
    if (!roteiro) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Roteiro não encontrado.' })
      }
      session.flash('error', 'Roteiro não encontrado.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(updateRoteiroValidator)

    await db.transaction(async (trx) => {
      roteiro.useTransaction(trx)

      if (payload.titulo !== undefined) roteiro.titulo = payload.titulo
      if (payload.subtitulo !== undefined) roteiro.subtitulo = payload.subtitulo
      if (payload.secoes !== undefined) roteiro.secoes = payload.secoes
      if (payload.ordem !== undefined) roteiro.ordem = payload.ordem
      if (payload.isActive !== undefined) roteiro.isActive = payload.isActive

      await roteiro.save()

      if (payload.ambientes !== undefined && Array.isArray(payload.ambientes)) {
        await RoteiroBriefingAmbiente.query({ client: trx })
          .where('roteiro_id', roteiro.id)
          .delete()

        for (const ambNome of payload.ambientes) {
          if (ambNome.trim()) {
            await RoteiroBriefingAmbiente.create(
              {
                roteiroId: roteiro.id,
                ambienteNome: ambNome.trim(),
              },
              { client: trx }
            )
          }
        }
      }
    })

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: 'Roteiro de apoio atualizado com sucesso.',
        roteiro: {
          id: roteiro.id,
          titulo: roteiro.titulo,
          slug: roteiro.slug,
        },
      })
    }

    session.flash('success', 'Roteiro de apoio atualizado com sucesso.')
    return response.redirect().back()
  }

  async toggleRoteiro({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!(await this.isAuthorized(user))) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const roteiro = await RoteiroBriefing.find(params.id)
    if (!roteiro) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Roteiro não encontrado.' })
      }
      session.flash('error', 'Roteiro não encontrado.')
      return response.redirect().back()
    }

    roteiro.isActive = !roteiro.isActive
    await roteiro.save()

    const statusMsg = roteiro.isActive ? 'ativado' : 'desativado'
    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: `Roteiro "${roteiro.titulo}" ${statusMsg} com sucesso.`,
        isActive: roteiro.isActive,
      })
    }

    session.flash('success', `Roteiro "${roteiro.titulo}" ${statusMsg} com sucesso.`)
    return response.redirect().back()
  }

  async destroyRoteiro({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (!(await this.isAuthorized(user))) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
    }

    const roteiro = await RoteiroBriefing.find(params.id)
    if (!roteiro) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Roteiro não encontrado.' })
      }
      session.flash('error', 'Roteiro não encontrado.')
      return response.redirect().back()
    }

    const titulo = roteiro.titulo
    await roteiro.delete()

    if (this.wantsJson(request)) {
      return response.json({
        success: true,
        message: `Roteiro "${titulo}" excluído com sucesso.`,
      })
    }

    session.flash('success', `Roteiro "${titulo}" excluído com sucesso.`)
    return response.redirect().back()
  }
}


