import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Briefing, { StatusBriefing } from '#models/briefing'
import AmbienteBriefing from '#models/ambiente_briefing'
import Projeto, { StatusProjeto } from '#models/projeto'
import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import { PerfilUsuario } from '#models/user'
import {
  calcularScoreBriefing,
  BriefingScoreInput,
} from '#services/briefing_score_service'
import {
  calcularScoreValidator,
  saveBriefingValidator,
} from '#validators/briefing'

export default class BriefingsController {
  /**
   * Lista briefings e status no pipeline de projetos
   */
  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.user!
    const query = request.qs()
    const search = (query.q || '').trim()
    const statusFilter = query.status
    const scoreFilter = query.scoreAprovado // 'aprovado' | 'reprovado'

    const briefingsQuery = Briefing.query()
      .preload('projeto', (pQuery) => {
        pQuery
          .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
          .preload('lead', (lQuery) => lQuery.select('id', 'nome', 'telefone'))
      })
      .preload('ambientesDetalhados')
      .orderBy('updatedAt', 'desc')

    // Isolamento por perfil: Vendedor só vê projetos sob sua responsabilidade
    if (user.perfil === PerfilUsuario.VENDEDOR) {
      briefingsQuery.whereHas('projeto', (pQuery) => {
        pQuery.where('vendedor_id', user.id)
      })
    }

    if (statusFilter) {
      briefingsQuery.where('status', statusFilter)
    }

    if (search) {
      briefingsQuery.where((builder) => {
        builder
          .whereILike('cidade_obra', `%${search}%`)
          .orWhereILike('estilo_preferido', `%${search}%`)
          .orWhereILike('arquiteto_nome', `%${search}%`)
          .orWhereHas('projeto', (pQuery) => {
            pQuery
              .whereILike('cliente_nome', `%${search}%`)
              .orWhereILike('codigo', `%${search}%`)
          })
      })
    }

    const briefings = await briefingsQuery

    // Filtragem em memória por score se solicitada
    let filteredBriefings = briefings
    if (scoreFilter === 'aprovado') {
      filteredBriefings = briefings.filter((b) => Number(b.score) >= Number(b.scoreMinimo || 70))
    } else if (scoreFilter === 'reprovado') {
      filteredBriefings = briefings.filter((b) => Number(b.score) < Number(b.scoreMinimo || 70))
    }

    // Projetos sem briefing para o modal de criação rápida
    const projetosSemBriefing = await Projeto.query()
      .whereDoesntHave('briefing', () => {})
      .where('arquivado', false)
      .select('id', 'codigo', 'clienteNome')
      .orderBy('createdAt', 'desc')

    // Estatísticas
    const totalBriefings = briefings.length
    const rascunhos = briefings.filter((b) => b.status === StatusBriefing.RASCUNHO).length
    const aptosEnvio = briefings.filter(
      (b) => b.status === StatusBriefing.RASCUNHO && Number(b.score) >= Number(b.scoreMinimo || 70)
    ).length
    const enviadosNaFila = briefings.filter((b) => b.status === StatusBriefing.ENVIADO).length

    return inertia.render('briefings/index', {
      briefings: filteredBriefings.map((b) => ({
        id: b.id,
        projetoId: b.projetoId,
        cidadeObra: b.cidadeObra,
        estadoObra: b.estadoObra,
        ambientes: b.ambientes || [],
        prazoDesejado: b.prazoDesejado,
        faixaInvestimentoMin: b.faixaInvestimentoMin ? Number(b.faixaInvestimentoMin) : null,
        faixaInvestimentoMax: b.faixaInvestimentoMax ? Number(b.faixaInvestimentoMax) : null,
        estiloPreferido: b.estiloPreferido,
        arquitetoNome: b.arquitetoNome,
        score: Number(b.score || 0),
        scoreMinimo: Number(b.scoreMinimo || 70),
        status: b.status,
        aprovado: Number(b.score || 0) >= Number(b.scoreMinimo || 70),
        enviadoEm: b.enviadoEm ? b.enviadoEm.toISO() : null,
        updatedAt: b.updatedAt ? b.updatedAt.toISO() : null,
        projeto: b.projeto
          ? {
              id: b.projeto.id,
              codigo: b.projeto.codigo,
              clienteNome: b.projeto.clienteNome,
              status: b.projeto.status,
              vendedor: b.projeto.vendedor
                ? { id: b.projeto.vendedor.id, nome: b.projeto.vendedor.nome }
                : null,
            }
          : null,
        qtdAmbientesDetalhados: b.ambientesDetalhados ? b.ambientesDetalhados.length : 0,
      })),
      stats: {
        total: totalBriefings,
        rascunhos,
        aptosEnvio,
        enviadosNaFila,
      },
      projetosSemBriefing,
      filters: {
        q: search,
        status: statusFilter || '',
        scoreAprovado: scoreFilter || '',
      },
    })
  }

  /**
   * Renderiza formulário de edição de briefing com score e detalhamento de ambientes
   */
  async edit({ params, inertia, response, auth }: HttpContext) {
    const user = auth.user!
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('projeto', (pQuery) => {
        pQuery
          .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
          .preload('lead', (lQuery) => lQuery.select('id', 'nome', 'telefone', 'email'))
      })
      .preload('ambientesDetalhados')
      .first()

    if (!briefing) {
      return response.status(404).send('Briefing não encontrado')
    }

    // Permissão: vendedor só edita briefing dos seus projetos
    if (user.perfil === PerfilUsuario.VENDEDOR && briefing.projeto?.vendedorId !== user.id) {
      return response.status(403).send('Acesso negado a este briefing')
    }

    // Calcula breakdown atualizado
    const scoreInput: BriefingScoreInput = {
      cidadeObra: briefing.cidadeObra,
      ambientes: briefing.ambientes,
      prazoDesejado: briefing.prazoDesejado,
      faixaInvestimentoMin: briefing.faixaInvestimentoMin ? Number(briefing.faixaInvestimentoMin) : null,
      faixaInvestimentoMax: briefing.faixaInvestimentoMax ? Number(briefing.faixaInvestimentoMax) : null,
      estiloPreferido: briefing.estiloPreferido,
      arquitetoNome: briefing.arquitetoNome,
      observacoes: briefing.observacoes,
      referenciasUrl: briefing.referenciasUrl,
      scoreMinimo: Number(briefing.scoreMinimo || 70),
      ambientesDetalhados: briefing.ambientesDetalhados.map((a) => ({
        tipo: a.tipo,
        descricao: a.descricao,
        medidasPreliminares: a.medidasPreliminares,
        observacoesEspecificas: a.observacoesEspecificas,
      })),
    }

    const scoreResult = calcularScoreBriefing(scoreInput)

    return inertia.render('briefings/edit', {
      briefing: {
        id: briefing.id,
        projetoId: briefing.projetoId,
        cidadeObra: briefing.cidadeObra || '',
        estadoObra: briefing.estadoObra || '',
        enderecoObra: briefing.enderecoObra || '',
        ambientes: briefing.ambientes || [],
        prazoDesejado: briefing.prazoDesejado || '',
        faixaInvestimentoMin: briefing.faixaInvestimentoMin ? Number(briefing.faixaInvestimentoMin) : null,
        faixaInvestimentoMax: briefing.faixaInvestimentoMax ? Number(briefing.faixaInvestimentoMax) : null,
        estiloPreferido: briefing.estiloPreferido || '',
        observacoes: briefing.observacoes || '',
        referenciasUrl: briefing.referenciasUrl || [],
        arquitetoNome: briefing.arquitetoNome || '',
        arquitetoEmail: briefing.arquitetoEmail || '',
        arquitetoTelefone: briefing.arquitetoTelefone || '',
        score: Number(briefing.score || 0),
        scoreMinimo: Number(briefing.scoreMinimo || 70),
        status: briefing.status,
        motivoDevolucao: briefing.motivoDevolucao,
        enviadoEm: briefing.enviadoEm ? briefing.enviadoEm.toISO() : null,
        projeto: briefing.projeto
          ? {
              id: briefing.projeto.id,
              codigo: briefing.projeto.codigo,
              clienteNome: briefing.projeto.clienteNome,
              status: briefing.projeto.status,
              vendedor: briefing.projeto.vendedor
                ? { id: briefing.projeto.vendedor.id, nome: briefing.projeto.vendedor.nome }
                : null,
              lead: briefing.projeto.lead
                ? {
                    id: briefing.projeto.lead.id,
                    nome: briefing.projeto.lead.nome,
                    telefone: briefing.projeto.lead.telefone,
                    email: briefing.projeto.lead.email,
                  }
                : null,
            }
          : null,
        ambientesDetalhados: briefing.ambientesDetalhados.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          descricao: a.descricao || '',
          medidasPreliminares: a.medidasPreliminares || '',
          observacoesEspecificas: a.observacoesEspecificas || '',
        })),
      },
      scoreBreakdown: scoreResult,
    })
  }

  /**
   * Cria briefing para um projeto existente ou cria novo projeto com briefing
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

    let projeto: Projeto | null = null

    if (projetoId) {
      projeto = await Projeto.find(projetoId)
      if (!projeto) {
        session.flash('erro', 'Projeto não encontrado')
        return response.redirect().back()
      }
    } else if (clienteNome) {
      // Cria novo projeto automaticamente
      const count = await Projeto.query().count('* as total')
      const totalNum = Number(count[0]?.$extras?.total || 0) + 1
      const year = new Date().getFullYear()
      const codigo = `PRJ-${year}-${String(totalNum).padStart(3, '0')}`

      projeto = await Projeto.create({
        codigo,
        clienteNome,
        leadId: leadId ? Number(leadId) : null,
        vendedorId: user.id,
        status: StatusProjeto.EM_BRIEFING,
        arquivado: false,
        alertaParado: false,
        statusAlteradoEm: DateTime.now(),
      })
    } else {
      session.flash('erro', 'Informe o projeto ou o nome do cliente.')
      return response.redirect().back()
    }

    // Verifica se já existe briefing
    let briefing = await Briefing.query().where('projeto_id', projeto.id).first()
    if (!briefing) {
      briefing = await Briefing.create({
        projetoId: projeto.id,
        status: StatusBriefing.RASCUNHO,
        score: '0',
        scoreMinimo: '70',
        ambientes: [],
        referenciasUrl: [],
      })
    }

    session.flash('sucesso', 'Briefing iniciado com sucesso!')
    return response.redirect().toRoute('briefings.edit', { id: briefing.id })
  }

  /**
   * Endpoint AJAX para simulação e prévia do Score em tempo real
   */
  async calcularScore({ request, response }: HttpContext) {
    const payload = await request.validateUsing(calcularScoreValidator)
    const resultado = calcularScoreBriefing(payload as BriefingScoreInput)
    return response.json(resultado)
  }

  /**
   * Salva alterações do briefing como rascunho
   */
  async update({ params, request, response, session }: HttpContext) {
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('ambientesDetalhados')
      .first()

    if (!briefing) {
      session.flash('erro', 'Briefing não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(saveBriefingValidator)

    await db.transaction(async (trx) => {
      briefing.useTransaction(trx)

      // Atualiza campos do briefing
      briefing.cidadeObra = payload.cidadeObra ?? null
      briefing.estadoObra = payload.estadoObra ?? null
      briefing.enderecoObra = payload.enderecoObra ?? null
      briefing.ambientes = payload.ambientes ?? []
      briefing.prazoDesejado = payload.prazoDesejado ?? null
      briefing.faixaInvestimentoMin = payload.faixaInvestimentoMin ? String(payload.faixaInvestimentoMin) : null
      briefing.faixaInvestimentoMax = payload.faixaInvestimentoMax ? String(payload.faixaInvestimentoMax) : null
      briefing.estiloPreferido = payload.estiloPreferido ?? null
      briefing.observacoes = payload.observacoes ?? null
      briefing.referenciasUrl = payload.referenciasUrl ?? []
      briefing.arquitetoNome = payload.arquitetoNome ?? null
      briefing.arquitetoEmail = payload.arquitetoEmail ?? null
      briefing.arquitetoTelefone = payload.arquitetoTelefone ?? null

      // Recria ambientes detalhados
      await AmbienteBriefing.query({ client: trx }).where('briefing_id', briefing.id).delete()

      if (payload.ambientesDetalhados && payload.ambientesDetalhados.length > 0) {
        for (const amb of payload.ambientesDetalhados) {
          await AmbienteBriefing.create(
            {
              briefingId: briefing.id,
              tipo: amb.tipo,
              descricao: amb.descricao ?? null,
              medidasPreliminares: amb.medidasPreliminares ?? null,
              observacoesEspecificas: amb.observacoesEspecificas ?? null,
            },
            { client: trx }
          )
        }
      }

      // Calcula score e salva no briefing
      const scoreResult = calcularScoreBriefing({
        cidadeObra: briefing.cidadeObra,
        ambientes: briefing.ambientes,
        prazoDesejado: briefing.prazoDesejado,
        faixaInvestimentoMin: briefing.faixaInvestimentoMin,
        faixaInvestimentoMax: briefing.faixaInvestimentoMax,
        ambientesDetalhados: payload.ambientesDetalhados,
        referenciasUrl: briefing.referenciasUrl,
        estiloPreferido: briefing.estiloPreferido,
        arquitetoNome: briefing.arquitetoNome,
        observacoes: briefing.observacoes,
        scoreMinimo: Number(briefing.scoreMinimo || 70),
      })

      briefing.score = String(scoreResult.score)
      briefing.scoreDetalhes = scoreResult.detalhes

      await briefing.save()
    })

    session.flash('sucesso', 'Briefing salvo como rascunho com sucesso!')
    return response.redirect().back()
  }

  /**
   * RF008, RF009, RN002 — Valida score e trava se score < mínimo antes de enviar para a fila
   */
  async enviarParaFila({ params, response, session }: HttpContext) {
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('ambientesDetalhados')
      .preload('projeto')
      .first()

    if (!briefing) {
      session.flash('erro', 'Briefing não encontrado')
      return response.redirect().back()
    }

    if (briefing.status !== StatusBriefing.RASCUNHO && briefing.status !== StatusBriefing.DEVOLVIDO) {
      session.flash('erro', `Briefing já se encontra no status "${briefing.status}".`)
      return response.redirect().back()
    }

    // Calcula o score definitivo para validar RN002
    const scoreResult = calcularScoreBriefing({
      cidadeObra: briefing.cidadeObra,
      ambientes: briefing.ambientes,
      prazoDesejado: briefing.prazoDesejado,
      faixaInvestimentoMin: briefing.faixaInvestimentoMin,
      faixaInvestimentoMax: briefing.faixaInvestimentoMax,
      ambientesDetalhados: briefing.ambientesDetalhados.map((a) => ({
        tipo: a.tipo,
        descricao: a.descricao,
        medidasPreliminares: a.medidasPreliminares,
        observacoesEspecificas: a.observacoesEspecificas,
      })),
      referenciasUrl: briefing.referenciasUrl,
      estiloPreferido: briefing.estiloPreferido,
      arquitetoNome: briefing.arquitetoNome,
      observacoes: briefing.observacoes,
      scoreMinimo: Number(briefing.scoreMinimo || 70),
    })

    // RN002: Bloqueio estrito se score < 70
    if (!scoreResult.aprovado) {
      const msg = `Score insuficiente (${scoreResult.score}/${scoreResult.scoreMinimo} pts). Critérios faltantes: ${scoreResult.pontosFaltantes.join(', ')}`
      session.flash('erro', msg)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      briefing.useTransaction(trx)
      briefing.status = StatusBriefing.ENVIADO
      briefing.score = String(scoreResult.score)
      briefing.scoreDetalhes = scoreResult.detalhes
      briefing.enviadoEm = DateTime.now()
      await briefing.save()

      // Cria ou atualiza entrada na fila de projetos
      const filaExistente = await FilaProjeto.query({ client: trx })
        .where('projeto_id', briefing.projetoId)
        .first()

      if (!filaExistente) {
        await FilaProjeto.create(
          {
            projetoId: briefing.projetoId,
            status: StatusFila.AGUARDANDO,
            prioridade: 5,
            dataEntradaFila: DateTime.now(),
          },
          { client: trx }
        )
      } else {
        filaExistente.status = StatusFila.AGUARDANDO
        filaExistente.dataEntradaFila = DateTime.now()
        await filaExistente.save()
      }

      // Atualiza status do projeto para NA_FILA
      if (briefing.projeto) {
        briefing.projeto.useTransaction(trx)
        briefing.projeto.status = StatusProjeto.NA_FILA
        briefing.projeto.statusAlteradoEm = DateTime.now()
        await briefing.projeto.save()
      }
    })

    session.flash(
      'sucesso',
      `Briefing aprovado com Score ${scoreResult.score} pts! O projeto avançou para a Fila de Projetos.`
    )
    return response.redirect().toRoute('briefings.index')
  }
}
