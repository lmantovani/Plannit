import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import AmbienteCatalogo from '#models/ambiente_catalogo'
import OrigemLeadCatalogo from '#models/origem_lead_catalogo'
import CampanhaLead from '#models/campanha_lead'
import TipoCompromissoCatalogo from '#models/tipo_compromisso_catalogo'
import User, { PerfilUsuario } from '#models/user'
import {
  createAmbienteValidator,
  updateAmbienteValidator,
  createOrigemValidator,
  updateOrigemValidator,
  createCampanhaValidator,
  updateCampanhaValidator,
  createTipoCompromissoValidator,
  updateTipoCompromissoValidator,
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
    return accept.includes('application/json') || request.qs().format === 'json'
  }

  private isAuthorized(user: User): boolean {
    if (user.isSuperuser) return true
    return user.hasRole([PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL])
  }

  /**
   * Painel de parametrização administrativa de tabelas de apoio
   */
  async index({ inertia, auth, response, request }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito a Gestores e Diretoria' })
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

    const payload = {
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
}

