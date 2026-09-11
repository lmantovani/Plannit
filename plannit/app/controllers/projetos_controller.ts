import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Projeto, { StatusProjeto, STATUS_PROJETO_LABELS } from '#models/projeto'
import ProjetoComercial, {
  StatusProjetoComercial,
  STATUS_PROJETO_COMERCIAL_LABELS,
} from '#models/projeto_comercial'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import Handoff, { ITENS_OBRIGATORIOS_HANDOFF } from '#models/handoff'
import { PerfilUsuario } from '#models/user'

import {
  mudarStatusProjetoValidator,
  submeterVersao3DValidator,
  avaliarVersao3DValidator,
  concluirRenderValidator,
  arquivarProjetoValidator,
} from '#validators/projeto'

export default class ProjetosController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }

  /**
   * Listagem de Projetos com filtros e monitoramento de SLA (RN016)
   */
  async index({ request, inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const query = request.qs()
    const search = (query.q || '').trim()
    const statusFilter = query.status as StatusProjeto | undefined
    const arquivadoFilter = query.arquivado === 'true'

    const projetosQuery = Projeto.query()
      .where('arquivado', arquivadoFilter)
      .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
      .preload('projetista', (pQuery) => pQuery.select('id', 'nome', 'email'))
      .preload('arquiteto', (aQuery) => aQuery.select('id', 'nome', 'escritorio'))
      .preload('cliente', (cQuery) => cQuery.select('id', 'nome', 'cpfCnpj', 'telefone'))
      .preload('briefing', (bQuery) => bQuery.select('id', 'score', 'scoreMinimo', 'status'))
      .preload('versoesComerciais', (vQuery) => vQuery.orderBy('versao', 'desc'))
      .orderBy('updatedAt', 'desc')

    // Isolamento por perfil de acesso
    if (user.perfil === PerfilUsuario.VENDEDOR) {
      projetosQuery.where('vendedor_id', user.id)
    } else if (user.perfil === PerfilUsuario.PROJETISTA) {
      projetosQuery.where('projetista_id', user.id)
    }

    if (statusFilter) {
      projetosQuery.where('status', statusFilter)
    }

    if (search) {
      projetosQuery.where((builder) => {
        builder
          .whereILike('codigo', `%${search}%`)
          .orWhereILike('cliente_nome', `%${search}%`)
      })
    }

    const projetos = await projetosQuery

    // Formata projetos e avalia estagnação (RN016 - > 5 dias sem movimentação)
    const agora = DateTime.now()
    const projetosFormatados = projetos.map((proj) => {
      const dataMovimentacao = proj.statusAlteradoEm || proj.updatedAt || proj.createdAt
      const diasParado = Math.max(0, Math.floor(agora.diff(dataMovimentacao, 'days').days))
      const alertaParado = !proj.arquivado && diasParado > 5

      const ultimaVersao = proj.versoesComerciais?.[0] || null
      const temRenderAprovado = proj.versoesComerciais?.some(
        (v) =>
          v.status === StatusProjetoComercial.APROVADO ||
          v.status === StatusProjetoComercial.FINALIZADO
      )

      return {
        id: proj.id,
        codigo: proj.codigo,
        clienteNome: proj.cliente?.nome || proj.clienteNome,
        clienteId: proj.clienteId,
        vendedorId: proj.vendedorId,
        vendedorNome: proj.vendedor?.nome || 'Não atribuído',
        projetistaId: proj.projetistaId,
        projetistaNome: proj.projetista?.nome || 'Aguardando alocação',
        arquitetoNome: proj.arquiteto?.nome || proj.arquitetoNome || null,
        status: proj.status,
        statusLabel: STATUS_PROJETO_LABELS[proj.status as StatusProjeto] || proj.status,
        valorContrato: proj.valorContrato ? Number(proj.valorContrato) : null,
        prazoEntregaEstimado: proj.prazoEntregaEstimado ? proj.prazoEntregaEstimado.toString() : null,
        diasParado,
        alertaParado,
        arquivado: proj.arquivado,
        arquivadoMotivo: proj.arquivadoMotivo,
        totalVersoes3D: proj.versoesComerciais?.length || 0,
        statusVersao3D: ultimaVersao?.status || null,
        statusVersao3DLabel: ultimaVersao
          ? STATUS_PROJETO_COMERCIAL_LABELS[ultimaVersao.status as StatusProjetoComercial] ||
            ultimaVersao.status
          : 'Sem 3D',
        temRenderAprovado,
        briefingScore: proj.briefing?.score ? Number(proj.briefing.score) : null,
        updatedAt: proj.updatedAt ? proj.updatedAt.toISO() : null,
        statusAlteradoEm: proj.statusAlteradoEm ? proj.statusAlteradoEm.toISO() : null,
      }
    })

    // Estatísticas resumidas para o topo
    const stats = {
      total: projetosFormatados.length,
      emProjeto: projetosFormatados.filter((p) => p.status === StatusProjeto.EM_PROJETO).length,
      aguardandoValidacao: projetosFormatados.filter(
        (p) => p.status === StatusProjeto.AGUARD_VALIDACAO
      ).length,
      emRender: projetosFormatados.filter((p) => p.status === StatusProjeto.EM_RENDER).length,
      aguardandoApresentacao: projetosFormatados.filter(
        (p) => p.status === StatusProjeto.AGUARD_APRESENTACAO
      ).length,
      estagnados: projetosFormatados.filter((p) => p.alertaParado).length,
    }

    if (this.wantsJson(request)) {
      return response.ok({ projetos: projetosFormatados, stats })
    }

    return inertia.render('projetos/index', {
      projetos: projetosFormatados,
      stats,
      filters: {
        q: search,
        status: statusFilter || '',
        arquivado: arquivadoFilter,
      },
      statusOptions: Object.entries(STATUS_PROJETO_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    })
  }

  /**
   * Sala de Controle do Projeto (Detalhes, Versões 3D, Aprovação de Render, Histórico Imutável)
   */
  async show({ params, request, inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const projeto = await Projeto.query()
      .where('id', params.id)
      .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email', 'telefone'))
      .preload('projetista', (pQuery) => pQuery.select('id', 'nome', 'email', 'telefone'))
      .preload('conferente', (cQuery) => cQuery.select('id', 'nome', 'email', 'telefone'))
      .preload('arquiteto', (aQuery) => aQuery.select('id', 'nome', 'escritorio', 'telefone'))
      .preload('cliente', (cQuery) => {
        cQuery.preload('enderecos')
      })
      .preload('briefing', (bQuery) => {
        bQuery.preload('ambientesDetalhados')
      })

      .preload('fila')
      .preload('versoesComerciais', (vQuery) => {
        vQuery
          .preload('validadoPor', (uQuery) => uQuery.select('id', 'nome', 'email'))
          .preload('criadoPor', (uQuery) => uQuery.select('id', 'nome', 'email'))
          .orderBy('versao', 'desc')
      })
      .preload('historicoStatus', (hQuery) => {
        hQuery
          .preload('alteradoPor', (uQuery) => uQuery.select('id', 'nome', 'email', 'perfil'))
          .orderBy('createdAt', 'desc')
      })
      .first()

    if (!projeto) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Projeto não encontrado' })
      }
      return response.redirect().toPath('/projetos')
    }

    // Permissões
    const isVendedorDono = projeto.vendedorId === user.id
    const isProjetistaDono = projeto.projetistaId === user.id
    const isGestor =
      user.perfil === PerfilUsuario.DIRETORIA ||
      user.perfil === PerfilUsuario.GERENTE_COMERCIAL ||
      user.isSuperuser

    const podeValidar3D = isVendedorDono || isGestor
    const podeSubmeter3D = isProjetistaDono || isGestor

    const agora = DateTime.now()
    const dataMovimentacao = projeto.statusAlteradoEm || projeto.updatedAt || projeto.createdAt
    const diasParado = Math.max(0, Math.floor(agora.diff(dataMovimentacao, 'days').days))
    const alertaParado = !projeto.arquivado && diasParado > 5

    const temRenderAprovado = projeto.versoesComerciais.some(
      (v) =>
        v.status === StatusProjetoComercial.APROVADO ||
        v.status === StatusProjetoComercial.FINALIZADO
    )

    const payload = {
      projeto: {
        id: projeto.id,
        codigo: projeto.codigo,
        clienteNome: projeto.cliente?.nome || projeto.clienteNome,
        status: projeto.status,
        statusLabel: STATUS_PROJETO_LABELS[projeto.status as StatusProjeto] || projeto.status,
        statusAlteradoEm: projeto.statusAlteradoEm ? projeto.statusAlteradoEm.toISO() : null,
        valorContrato: projeto.valorContrato ? Number(projeto.valorContrato) : null,
        prazoEntregaEstimado: projeto.prazoEntregaEstimado
          ? projeto.prazoEntregaEstimado.toString()
          : null,
        arquivado: projeto.arquivado,
        arquivadoMotivo: projeto.arquivadoMotivo,
        alertaParado,
        diasParado,
        temRenderAprovado,
        createdAt: projeto.createdAt.toISO(),
        updatedAt: projeto.updatedAt ? projeto.updatedAt.toISO() : null,
        vendedor: projeto.vendedor
          ? {
              id: projeto.vendedor.id,
              nome: projeto.vendedor.nome,
              email: projeto.vendedor.email,
              telefone: projeto.vendedor.telefone,
            }
          : null,
        projetista: projeto.projetista
          ? {
              id: projeto.projetista.id,
              nome: projeto.projetista.nome,
              email: projeto.projetista.email,
              telefone: projeto.projetista.telefone,
            }
          : null,
        conferente: projeto.conferente
          ? {
              id: projeto.conferente.id,
              nome: projeto.conferente.nome,
              email: projeto.conferente.email,
              telefone: projeto.conferente.telefone,
            }
          : null,
        arquiteto: projeto.arquiteto
          ? {
              id: projeto.arquiteto.id,
              nome: projeto.arquiteto.nome,
              escritorio: projeto.arquiteto.escritorio,
              telefone: projeto.arquiteto.telefone,
            }
          : null,
        cliente: projeto.cliente
          ? {
              id: projeto.cliente.id,
              nome: projeto.cliente.nome,
              cpfCnpj: projeto.cliente.cpfCnpj,
              telefone: projeto.cliente.telefone,
              email: projeto.cliente.email,
              tipo: projeto.cliente.tipo,
              enderecos: projeto.cliente.enderecos.map((e) => ({
                id: e.id,
                tipo: e.tipo,
                identificacao: e.identificacao,
                logradouro: e.logradouro,
                numero: e.numero,
                complemento: e.complemento,
                bairro: e.bairro,
                cidade: e.cidade,
                estado: e.estado,
                cep: e.cep,
              })),
            }
          : null,
        briefing: projeto.briefing
          ? {
              id: projeto.briefing.id,
              score: Number(projeto.briefing.score || 0),
              scoreMinimo: Number(projeto.briefing.scoreMinimo || 70),
              status: projeto.briefing.status,
              estiloPreferido: (projeto.briefing as any).estiloPreferido || null,
              faixaInvestimentoMin: (projeto.briefing as any).faixaInvestimentoMin || null,
              faixaInvestimentoMax: (projeto.briefing as any).faixaInvestimentoMax || null,
              ambientes: (((projeto.briefing as any).ambientesDetalhados || []) as Array<any>).map((a: any) => ({
                id: a.id,
                tipo: a.tipo,
                descricao: a.descricao,
                medidasPreliminares: a.medidasPreliminares,
              })),

            }
          : null,

        versoes3D: projeto.versoesComerciais.map((v) => ({
          id: v.id,
          versao: v.versao,
          arquivoUrl: v.arquivoUrl,
          renderUrls: v.renderUrls,
          descricaoAlteracao: v.descricaoAlteracao,
          status: v.status,
          statusLabel:
            STATUS_PROJETO_COMERCIAL_LABELS[v.status as StatusProjetoComercial] || v.status,
          submetidoParaValidacaoEm: v.submetidoParaValidacaoEm
            ? v.submetidoParaValidacaoEm.toISO()
            : null,
          validadoEm: v.validadoEm ? v.validadoEm.toISO() : null,
          validadoPor: v.validadoPor ? { id: v.validadoPor.id, nome: v.validadoPor.nome } : null,
          motivoDevolucao: v.motivoDevolucao,
          numeroApresentacao: v.numeroApresentacao,
          criadoPor: v.criadoPor ? { id: v.criadoPor.id, nome: v.criadoPor.nome } : null,
          createdAt: v.createdAt.toISO(),
        })),
        historico: projeto.historicoStatus.map((h) => ({
          id: h.id,
          statusDe: h.statusDe,
          statusDeLabel: h.statusDe ? STATUS_PROJETO_LABELS[h.statusDe as StatusProjeto] || h.statusDe : null,
          statusPara: h.statusPara,
          statusParaLabel: STATUS_PROJETO_LABELS[h.statusPara as StatusProjeto] || h.statusPara,
          observacao: h.observacao,
          alteradoPor: h.alteradoPor
            ? {
                id: h.alteradoPor.id,
                nome: h.alteradoPor.nome,
                perfil: h.alteradoPor.perfil,
              }
            : null,
          createdAt: h.createdAt.toISO(),
        })),
      },
      permissions: {
        podeValidar3D,
        podeSubmeter3D,
        isGestor,
      },
      statusOptions: Object.entries(STATUS_PROJETO_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    }

    if (this.wantsJson(request)) {
      return response.ok(payload)
    }

    return inertia.render('projetos/show', payload)
  }

  /**
   * Transição de Status com aplicação estrita da RN005 e gravação de Histórico Imutável RN017
   */
  async mudarStatus({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(mudarStatusProjetoValidator)

    const projeto = await Projeto.query()
      .where('id', params.id)
      .preload('versoesComerciais')
      .first()

    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    if (projeto.arquivado) {
      if (this.wantsJson(request)) {
        return response.badRequest({ message: 'Projeto arquivado não pode ter status alterado' })
      }
      session.flash('error', 'Projeto arquivado não pode ter status alterado')
      return response.redirect().back()
    }

    // =========================================================================
    // RN005 — Bloqueio estrito de avanço para a etapa de "Apresentação ao Cliente"
    // Apresentação do projeto ao cliente só ocorre com render concluído e aprovado.
    // =========================================================================
    const etapasApresentacao = [
      StatusProjeto.AGUARD_APRESENTACAO,
      StatusProjeto.EM_FECHAMENTO,
      StatusProjeto.AGUARD_ASSINATURA,
      StatusProjeto.EM_HANDOFF,
    ]

    if (etapasApresentacao.includes(payload.status as StatusProjeto)) {
      const temRenderAprovado = projeto.versoesComerciais.some(
        (v) =>
          v.status === StatusProjetoComercial.APROVADO ||
          v.status === StatusProjetoComercial.FINALIZADO
      )

      if (!temRenderAprovado) {
        const msg =
          'RN005: Apresentação ao cliente bloqueada. O render deve estar aprovado pelo vendedor e concluído antes de agendar apresentação.'
        if (this.wantsJson(request)) {
          return response.badRequest({ message: msg, code: 'RN005_RENDER_NAO_CONCLUIDO' })
        }
        session.flash('error', msg)
        return response.redirect().back()
      }
    }

    // =========================================================================
    // RN006 — Bloqueio estrito de avanço para etapas técnicas sem Handoff Completo
    // Passagem comercial -> técnica exige os 8 itens obrigatórios validados
    // =========================================================================
    const etapasTecnicas = [
      StatusProjeto.CONTATO_CONF,
      StatusProjeto.VALIDANDO_OBRA,
      StatusProjeto.EM_MEDICAO,
      StatusProjeto.EM_ADEQUACAO,
      StatusProjeto.ALINHANDO_CLIENTE,
      StatusProjeto.EM_AUDITORIA,
      StatusProjeto.AGUARD_ASSINATURA_TEC,
      StatusProjeto.EM_PRODUCAO,
      StatusProjeto.PRE_MONTAGEM,
      StatusProjeto.AGUARD_MERCADORIA,
      StatusProjeto.ENTREGA_AGENDADA,
      StatusProjeto.EM_ENTREGA,
      StatusProjeto.EM_MONTAGEM,
    ]

    if (etapasTecnicas.includes(payload.status as StatusProjeto)) {
      const handoff = await Handoff.query().where('projeto_id', projeto.id).first()
      if (!handoff || !handoff.checklistCompleto) {
        const itensPendentes = ITENS_OBRIGATORIOS_HANDOFF.filter(
          (item) => !handoff?.checklistJson?.[item.id]
        ).map((i) => i.id)

        const msg =
          'RN006: Passagem técnica bloqueada. O Handoff deve ter todos os 8 itens obrigatórios validados antes de avançar para a equipe técnica de conferência ou produção.'
        if (this.wantsJson(request)) {
          return response.badRequest({
            message: msg,
            code: 'RN006_HANDOFF_INCOMPLETO',
            itensPendentes,
          })
        }
        session.flash('error', msg)
        return response.redirect().back()
      }
    }

    await db.transaction(async (trx) => {

      const statusAnterior = projeto.status

      // 1. Registro imutável de histórico (RN017)
      await HistoricoStatusProjeto.create(
        {
          projetoId: projeto.id,
          statusDe: statusAnterior,
          statusPara: payload.status,
          alteradoPorId: user.id,
          observacao: payload.observacao || null,
        },
        { client: trx }
      )

      // 2. Atualiza projeto
      projeto.useTransaction(trx)
      projeto.status = payload.status
      projeto.statusAlteradoEm = DateTime.now()
      projeto.alertaParado = false
      await projeto.save()
    })

    if (this.wantsJson(request)) {
      return response.ok({
        message: 'Status do projeto atualizado com sucesso',
        status: payload.status,
      })
    }

    session.flash(
      'success',
      `Status do projeto alterado para "${STATUS_PROJETO_LABELS[payload.status as StatusProjeto] || payload.status}"`
    )
    return response.redirect().back()
  }

  /**
   * Submissão de nova maquete/versão 3D pelo projetista
   */
  async submeterVersao3D({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(submeterVersao3DValidator)

    const projeto = await Projeto.query()
      .where('id', params.id)
      .preload('versoesComerciais', (q) => q.orderBy('versao', 'desc'))
      .first()

    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    if (projeto.arquivado) {
      return response.badRequest({ message: 'Projeto arquivado não aceita novas versões 3D' })
    }

    // Calcula próximo número de versão
    const ultimaVersao = projeto.versoesComerciais[0]?.versao || 0
    const proximaVersao = ultimaVersao + 1

    let novaVersao: ProjetoComercial
    await db.transaction(async (trx) => {
      novaVersao = await ProjetoComercial.create(
        {
          projetoId: projeto.id,
          versao: proximaVersao,
          arquivoUrl: payload.arquivoUrl || null,
          descricaoAlteracao: payload.descricaoAlteracao || `Versão ${proximaVersao} desenvolvida pelo projetista`,
          renderUrls: payload.renderUrls || null,
          status: StatusProjetoComercial.AGUARD_VALIDACAO_VENDEDOR,
          submetidoParaValidacaoEm: DateTime.now(),
          criadoPorId: user.id,
        },
        { client: trx }
      )

      // Se o projeto estiver em_projeto ou em_ajuste, move para aguard_validacao
      if (
        projeto.status === StatusProjeto.EM_PROJETO ||
        projeto.status === StatusProjeto.EM_AJUSTE
      ) {
        const statusAnterior = projeto.status
        projeto.useTransaction(trx)
        projeto.status = StatusProjeto.AGUARD_VALIDACAO
        projeto.statusAlteradoEm = DateTime.now()
        projeto.alertaParado = false
        await projeto.save()


        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.AGUARD_VALIDACAO,
            alteradoPorId: user.id,
            observacao: `Versão 3D (v${proximaVersao}) submetida para validação do vendedor.`,
          },
          { client: trx }
        )
      }
    })

    if (this.wantsJson(request)) {
      return response.created({
        message: `Versão 3D (v${proximaVersao}) submetida para aprovação comercial`,
        versao: novaVersao!,
      })
    }

    session.flash(
      'success',
      `Versão 3D (v${proximaVersao}) submetida com sucesso para validação do vendedor.`
    )
    return response.redirect().back()
  }

  /**
   * Avaliação da versão 3D pelo vendedor (RN004 - Aprovação ou Devolução com Motivo Obrigatório)
   */
  async avaliarVersao3D({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(avaliarVersao3DValidator)

    const versao = await ProjetoComercial.query()
      .where('id', params.versaoId)
      .where('projeto_id', params.id)
      .preload('projeto')
      .first()

    if (!versao || !versao.projeto) {
      return response.notFound({ message: 'Versão 3D do projeto não encontrada' })
    }

    const projeto = versao.projeto

    // =========================================================================
    // RN004 — Se devolver, motivo é estritamente OBRIGATÓRIO
    // =========================================================================
    if (payload.acao === 'devolver') {
      const motivo = (payload.motivoDevolucao || '').trim()
      if (!motivo) {
        const msg = 'RN004: O motivo da devolução é obrigatório ao recusar a maquete 3D.'
        if (this.wantsJson(request)) {
          return response.badRequest({ message: msg, code: 'RN004_MOTIVO_OBRIGATORIO' })
        }
        session.flash('error', msg)
        return response.redirect().back()
      }

      await db.transaction(async (trx) => {
        versao.useTransaction(trx)
        versao.status = StatusProjetoComercial.DEVOLVIDO
        versao.motivoDevolucao = motivo
        versao.validadoPorId = user.id
        versao.validadoEm = DateTime.now()
        await versao.save()

        const statusAnterior = projeto.status
        projeto.useTransaction(trx)
        projeto.status = StatusProjeto.EM_AJUSTE
        projeto.statusAlteradoEm = DateTime.now()
        projeto.alertaParado = false
        await projeto.save()


        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.EM_AJUSTE,
            alteradoPorId: user.id,
            observacao: `Versão 3D (v${versao.versao}) devolvida pelo vendedor. Motivo: ${motivo}`,
          },
          { client: trx }
        )
      })

      if (this.wantsJson(request)) {
        return response.ok({
          message: 'Versão 3D devolvida para ajustes com sucesso',
          versao,
        })
      }

      session.flash('info', `Versão 3D devolvida ao projetista com apontamentos.`)
      return response.redirect().back()
    }

    // =========================================================================
    // RN004 — Se aprovar, libera para render
    // =========================================================================
    if (payload.acao === 'aprovar') {
      await db.transaction(async (trx) => {
        versao.useTransaction(trx)
        versao.status = StatusProjetoComercial.APROVADO
        versao.validadoPorId = user.id
        versao.validadoEm = DateTime.now()
        versao.motivoDevolucao = null
        await versao.save()

        const statusAnterior = projeto.status
        projeto.useTransaction(trx)
        projeto.status = StatusProjeto.EM_RENDER
        projeto.statusAlteradoEm = DateTime.now()
        projeto.alertaParado = false
        await projeto.save()


        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.EM_RENDER,
            alteradoPorId: user.id,
            observacao: `Versão 3D (v${versao.versao}) aprovada pelo vendedor. Liberado para renderização fotorrealista.`,
          },
          { client: trx }
        )
      })

      if (this.wantsJson(request)) {
        return response.ok({
          message: 'Versão 3D aprovada com sucesso e liberada para render',
          versao,
        })
      }

      session.flash('success', `Versão 3D aprovada! Projeto avançado para fase de renderização.`)
      return response.redirect().back()
    }

    return response.badRequest({ message: 'Ação de validação inválida' })
  }

  /**
   * Conclui o render da versão 3D com as URLs das imagens de alta resolução
   */
  async concluirRender({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(concluirRenderValidator)

    const versao = await ProjetoComercial.query()
      .where('id', params.versaoId)
      .where('projeto_id', params.id)
      .preload('projeto')
      .first()

    if (!versao || !versao.projeto) {
      return response.notFound({ message: 'Versão 3D não encontrada' })
    }

    const projeto = versao.projeto

    await db.transaction(async (trx) => {
      versao.useTransaction(trx)
      versao.renderUrls = payload.renderUrls
      versao.status = StatusProjetoComercial.FINALIZADO
      await versao.save()

      await HistoricoStatusProjeto.create(
        {
          projetoId: projeto.id,
          statusDe: projeto.status,
          statusPara: projeto.status,
          alteradoPorId: user.id,
          observacao: `Renderização 3D de alta resolução concluída para a versão v${versao.versao}. Pronto para agendamento de apresentação.`,
        },
        { client: trx }
      )
    })

    if (this.wantsJson(request)) {
      return response.ok({
        message: 'Render finalizado e imagens salvas com sucesso',
        versao,
      })
    }

    session.flash('success', 'Renderização concluída com sucesso! Imagens vinculadas ao projeto.')
    return response.redirect().back()
  }

  /**
   * RN017 — Preservação de Histórico e Soft Delete (Projetos NUNCA são deletados fisicamente)
   */
  async arquivar({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!

    // Permissão: apenas Diretoria e Gerente Comercial
    const permitido =
      user.perfil === PerfilUsuario.DIRETORIA ||
      user.perfil === PerfilUsuario.GERENTE_COMERCIAL ||
      user.isSuperuser

    if (!permitido) {
      return response.forbidden({ message: 'Apenas a Diretoria ou Gerência Comercial podem arquivar projetos' })
    }

    const payload = await request.validateUsing(arquivarProjetoValidator)
    const projeto = await Projeto.query().where('id', params.id).first()

    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    if (projeto.arquivado) {
      return response.badRequest({ message: 'Projeto já se encontra arquivado' })
    }

    await db.transaction(async (trx) => {
      projeto.useTransaction(trx)
      projeto.arquivado = true
      projeto.arquivadoMotivo = payload.motivo
      await projeto.save()

      await HistoricoStatusProjeto.create(
        {
          projetoId: projeto.id,
          statusDe: projeto.status,
          statusPara: StatusProjeto.CANCELADO,
          alteradoPorId: user.id,
          observacao: `[RN017 - ARQUIVAMENTO] Projeto arquivado com justificativa: ${payload.motivo}`,
        },
        { client: trx }
      )
    })

    if (this.wantsJson(request)) {
      return response.ok({ message: 'Projeto arquivado com sucesso (soft-delete)' })
    }

    session.flash('success', 'Projeto arquivado com sucesso e histórico preservado.')
    return response.redirect().toPath('/projetos')
  }
}

