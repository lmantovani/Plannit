import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import Projeto, { StatusProjeto } from '#models/projeto'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import { PerfilUsuario } from '#models/user'
import {
  podeAlocar,
  listarProjetistasComCapacidade,
  configurarWipLimit,
} from '#services/wip_service'
import {
  alocarProjetistaValidator,
  configurarWipValidator,
  arquivarProjetoValidator,
} from '#validators/fila'

export default class FilaController {
  /**
   * Renderiza a visão operacional da Fila de Projetos (Kanban + Monitor WIP)
   */
  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.user!
    const query = request.qs()
    const search = (query.q || '').trim()
    const statusFilter = query.status
    const projetistaFilter = query.projetistaId ? Number(query.projetistaId) : null

    // Base query
    const filaQuery = FilaProjeto.query()
      .preload('projeto', (pQuery) => {
        pQuery
          .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
          .preload('projetista', (prQuery) => prQuery.select('id', 'nome', 'email'))
          .preload('lead', (lQuery) => lQuery.select('id', 'nome', 'telefone'))
          .preload('briefing', (bQuery) => bQuery.select('id', 'score', 'scoreMinimo', 'status'))
      })
      .preload('projetista', (prQuery) => prQuery.select('id', 'nome', 'email', 'telefone'))
      .orderBy('prioridade', 'asc')
      .orderBy('dataEntradaFila', 'asc')

    // Isolamento por perfil:
    // Projetista vê sua própria alocação + projetos aguardando na fila pública
    if (user.perfil === PerfilUsuario.PROJETISTA) {
      filaQuery.where((builder) => {
        builder
          .where('projetista_id', user.id)
          .orWhere('status', StatusFila.AGUARDANDO)
      })
    } else if (user.perfil === PerfilUsuario.VENDEDOR) {
      filaQuery.whereHas('projeto', (pQuery) => {
        pQuery.where('vendedor_id', user.id)
      })
    } else if (projetistaFilter) {
      filaQuery.where('projetista_id', projetistaFilter)
    }

    if (statusFilter) {
      filaQuery.where('status', statusFilter)
    }

    if (search) {
      filaQuery.whereHas('projeto', (pQuery) => {
        pQuery
          .whereILike('cliente_nome', `%${search}%`)
          .orWhereILike('codigo', `%${search}%`)
      })
    }

    const filaItems = await filaQuery

    // Lista de projetistas com monitoramento de capacidade em tempo real (RN003)
    const projetistasCapacidade = await listarProjetistasComCapacidade()

    // Métricas
    const totalItens = filaItems.length
    const aguardando = filaItems.filter((f) => f.status === StatusFila.AGUARDANDO).length
    const alocados = filaItems.filter((f) => f.status === StatusFila.ALOCADO).length
    const emAndamento = filaItems.filter((f) => f.status === StatusFila.EM_ANDAMENTO).length
    const concluidos = filaItems.filter((f) => f.status === StatusFila.CONCLUIDO).length

    const capacidadeTotalEquipe = projetistasCapacidade.reduce((acc, p) => acc + p.wipLimit, 0)
    const ocupacaoTotalEquipe = projetistasCapacidade.reduce((acc, p) => acc + p.wipAtual, 0)

    const isGestor = user.perfil === PerfilUsuario.DIRETORIA || user.perfil === PerfilUsuario.GERENTE_COMERCIAL

    return inertia.render('fila/index', {
      fila: filaItems.map((f) => ({
        id: f.id,
        projetoId: f.projetoId,
        projetistaId: f.projetistaId,
        prioridade: f.prioridade,
        status: f.status,
        dataEntradaFila: f.dataEntradaFila ? f.dataEntradaFila.toISO() : null,
        dataAlocacao: f.dataAlocacao ? f.dataAlocacao.toISO() : null,
        diasNaFila: f.dataEntradaFila
          ? Math.max(0, Math.floor(DateTime.now().diff(f.dataEntradaFila, 'days').days))
          : 0,
        projeto: f.projeto
          ? {
              id: f.projeto.id,
              codigo: f.projeto.codigo,
              clienteNome: f.projeto.clienteNome,
              status: f.projeto.status,
              arquivado: f.projeto.arquivado,
              vendedor: f.projeto.vendedor
                ? { id: f.projeto.vendedor.id, nome: f.projeto.vendedor.nome }
                : null,
              briefing: f.projeto.briefing
                ? {
                    id: f.projeto.briefing.id,
                    score: Number(f.projeto.briefing.score || 0),
                    scoreMinimo: Number(f.projeto.briefing.scoreMinimo || 70),
                    status: f.projeto.briefing.status,
                  }
                : null,
            }
          : null,
        projetista: f.projetista
          ? {
              id: f.projetista.id,
              nome: f.projetista.nome,
              email: f.projetista.email,
              telefone: f.projetista.telefone,
            }
          : null,
      })),
      projetistas: projetistasCapacidade,
      stats: {
        total: totalItens,
        aguardando,
        alocados,
        emAndamento,
        concluidos,
        capacidadeTotalEquipe,
        ocupacaoTotalEquipe,
        taxaOcupacaoGeral:
          capacidadeTotalEquipe > 0
            ? Math.round((ocupacaoTotalEquipe / capacidadeTotalEquipe) * 100)
            : 0,
      },
      isGestor,
      filters: {
        q: search,
        status: statusFilter || '',
        projetistaId: projetistaFilter || '',
      },
    })
  }

  /**
   * RF014, RN003 — Aloca projetista no projeto com validação estrita de WIP limit
   */
  async alocar({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const filaItem = await FilaProjeto.query()
      .where('id', params.id)
      .preload('projeto')
      .first()

    if (!filaItem) {
      session.flash('erro', 'Item da fila não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(alocarProjetistaValidator)

    // RN003 — Validação estrita de capacidade simultânea do projetista
    const statusCapacidade = await podeAlocar(payload.projetistaId)
    if (!statusCapacidade.pode) {
      session.flash('erro', statusCapacidade.mensagem)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      filaItem.useTransaction(trx)
      const statusAnteriorProjeto = filaItem.projeto?.status || StatusProjeto.NA_FILA

      // Atualiza item da fila
      filaItem.projetistaId = payload.projetistaId
      filaItem.status = StatusFila.ALOCADO
      filaItem.dataAlocacao = DateTime.now()
      if (payload.prioridade) {
        filaItem.prioridade = payload.prioridade
      }
      await filaItem.save()

      // Atualiza projeto vinculado
      if (filaItem.projeto) {
        filaItem.projeto.useTransaction(trx)
        filaItem.projeto.projetistaId = payload.projetistaId
        filaItem.projeto.status = StatusProjeto.EM_PROJETO
        filaItem.projeto.statusAlteradoEm = DateTime.now()
        await filaItem.projeto.save()

        // Grava histórico imutável (RN017)
        await HistoricoStatusProjeto.create(
          {
            projetoId: filaItem.projeto.id,
            statusDe: statusAnteriorProjeto,
            statusPara: StatusProjeto.EM_PROJETO,
            alteradoPorId: user.id,
            observacao:
              payload.observacao ||
              `Alocado para projetista ID ${payload.projetistaId} via Fila de Projetos (RN003)`,
          },
          { client: trx }
        )
      }
    })

    session.flash('sucesso', 'Projetista alocado com sucesso! O projeto avançou para a etapa "Em Projeto".')
    return response.redirect().back()
  }

  /**
   * Desaloca o projetista e retorna o projeto para o status "aguardando" na fila
   */
  async desalocar({ params, response, session, auth }: HttpContext) {
    const user = auth.user!
    const filaItem = await FilaProjeto.query()
      .where('id', params.id)
      .preload('projeto')
      .first()

    if (!filaItem) {
      session.flash('erro', 'Item da fila não encontrado')
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      filaItem.useTransaction(trx)
      const statusAnterior = filaItem.projeto?.status

      filaItem.projetistaId = null
      filaItem.status = StatusFila.AGUARDANDO
      filaItem.dataAlocacao = null
      await filaItem.save()

      if (filaItem.projeto) {
        filaItem.projeto.useTransaction(trx)
        filaItem.projeto.projetistaId = null
        filaItem.projeto.status = StatusProjeto.NA_FILA
        filaItem.projeto.statusAlteradoEm = DateTime.now()
        await filaItem.projeto.save()

        await HistoricoStatusProjeto.create(
          {
            projetoId: filaItem.projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.NA_FILA,
            alteradoPorId: user.id,
            observacao: 'Projetista desalocado; projeto retornado à fila de espera.',
          },
          { client: trx }
        )
      }
    })

    session.flash('sucesso', 'Projeto desalocado e retornado para a fila de espera.')
    return response.redirect().back()
  }

  /**
   * Avança projeto alocado para status "em_andamento"
   */
  async iniciarExecucao({ params, response, session, auth }: HttpContext) {
    const user = auth.user!
    const filaItem = await FilaProjeto.query()
      .where('id', params.id)
      .preload('projeto')
      .first()

    if (!filaItem) {
      session.flash('erro', 'Item da fila não encontrado')
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      filaItem.useTransaction(trx)
      filaItem.status = StatusFila.EM_ANDAMENTO
      await filaItem.save()

      if (filaItem.projeto) {
        filaItem.projeto.useTransaction(trx)
        filaItem.projeto.status = StatusProjeto.EM_PROJETO
        filaItem.projeto.statusAlteradoEm = DateTime.now()
        await filaItem.projeto.save()

        await HistoricoStatusProjeto.create(
          {
            projetoId: filaItem.projeto.id,
            statusDe: StatusProjeto.EM_PROJETO,
            statusPara: StatusProjeto.EM_PROJETO,
            alteradoPorId: user.id,
            observacao: 'Modelagem técnica 3D iniciada pelo projetista.',
          },
          { client: trx }
        )
      }
    })

    session.flash('sucesso', 'Modelagem 3D do projeto iniciada com sucesso!')
    return response.redirect().back()
  }

  /**
   * Configura o limite de capacidade simultânea (WIP limit) de um projetista (Apenas Gestores)
   */
  async configurarWip({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (user.perfil !== PerfilUsuario.DIRETORIA && user.perfil !== PerfilUsuario.GERENTE_COMERCIAL) {
      session.flash('erro', 'Apenas a Diretoria ou Gerência Comercial podem configurar o WIP Limit.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(configurarWipValidator)
    await configurarWipLimit(payload.projetistaId, payload.wipLimit)

    session.flash('sucesso', `Limite WIP do projetista atualizado para ${payload.wipLimit} projetos simultâneos!`)
    return response.redirect().back()
  }

  /**
   * RN017 — Arquivamento obrigatório de projetos com justificativa
   */
  async arquivar({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    if (user.perfil !== PerfilUsuario.DIRETORIA && user.perfil !== PerfilUsuario.GERENTE_COMERCIAL) {
      session.flash('erro', 'Permissão negada para arquivar projetos.')
      return response.redirect().back()
    }

    const projeto = await Projeto.query().where('id', params.id).first()
    if (!projeto) {
      session.flash('erro', 'Projeto não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(arquivarProjetoValidator)

    await db.transaction(async (trx) => {
      projeto.useTransaction(trx)
      const statusAnterior = projeto.status

      projeto.arquivado = true
      projeto.arquivadoMotivo = payload.motivo
      projeto.status = StatusProjeto.CANCELADO
      projeto.statusAlteradoEm = DateTime.now()
      await projeto.save()

      // Remove da fila se estiver ativo
      const fila = await FilaProjeto.query({ client: trx }).where('projeto_id', projeto.id).first()
      if (fila) {
        fila.status = StatusFila.CANCELADO
        await fila.save()
      }

      await HistoricoStatusProjeto.create(
        {
          projetoId: projeto.id,
          statusDe: statusAnterior,
          statusPara: StatusProjeto.CANCELADO,
          alteradoPorId: user.id,
          observacao: `Projeto arquivado (RN017). Motivo: ${payload.motivo}`,
        },
        { client: trx }
      )
    })

    session.flash('sucesso', 'Projeto arquivado com sucesso.')
    return response.redirect().back()
  }
}
