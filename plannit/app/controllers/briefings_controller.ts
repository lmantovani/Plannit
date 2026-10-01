import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Briefing, { StatusBriefing } from '#models/briefing'
import AmbienteBriefing from '#models/ambiente_briefing'
import Projeto, { StatusProjeto } from '#models/projeto'
import Cliente from '#models/cliente'
import Lead, { StatusFunil } from '#models/lead'
import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import Arquiteto from '#models/arquiteto'
import User, { PerfilUsuario } from '#models/user'
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
          .preload('arquiteto')
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

    // Lista de especificadores/parceiros ativos para seleção na Seção 6
    const especificadores = await Arquiteto.query()
      .where('is_active', true)
      .select('id', 'nome', 'escritorio', 'telefone', 'email', 'tipo', 'nivelParceria')
      .orderBy('nome', 'asc')

    // Lista de consultores para eventual cadastro rápido
    const consultores = await User.query()
      .where('is_active', true)
      .select('id', 'nome', 'email')
      .orderBy('nome', 'asc')

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
        arquitetoId: briefing.projeto?.arquitetoId || null,
        arquitetoNome: briefing.arquitetoNome || briefing.projeto?.arquiteto?.nome || '',
        arquitetoEmail: briefing.arquitetoEmail || briefing.projeto?.arquiteto?.email || '',
        arquitetoTelefone: briefing.arquitetoTelefone || briefing.projeto?.arquiteto?.telefone || '',
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
              arquitetoId: briefing.projeto.arquitetoId || null,
              arquiteto: briefing.projeto.arquiteto
                ? {
                    id: briefing.projeto.arquiteto.id,
                    nome: briefing.projeto.arquiteto.nome,
                    escritorio: briefing.projeto.arquiteto.escritorio,
                    telefone: briefing.projeto.arquiteto.telefone,
                    email: briefing.projeto.arquiteto.email,
                  }
                : null,
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
      especificadores: especificadores.map((esp) => ({
        id: esp.id,
        nome: esp.nome,
        escritorio: esp.escritorio || null,
        telefone: esp.telefone || null,
        email: esp.email || null,
        tipo: esp.tipo,
        nivelParceria: esp.nivelParceria,
      })),
      consultores: consultores.map((c) => ({
        id: c.id,
        nome: c.nome,
        email: c.email,
      })),
    })
  }

  /**
   * Cria briefing para um projeto existente ou cria novo projeto com briefing
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { projetoId, clienteNome, leadId } = request.only(['projetoId', 'clienteNome', 'leadId'])

    // R5: Validação da qualificação do lead (RN001)
    let lead: Lead | null = null
    if (leadId) {
      lead = await Lead.find(leadId)
      if (!lead) {
        session.flash('erro', 'Lead não encontrado')
        return response.badRequest({ message: 'Lead não encontrado', code: 'LEAD_NOT_FOUND' })
      }
      if (!lead.qualificado) {
        session.flash('erro', 'RN001: Lead não pode avançar no funil sem qualificação registrada')
        return response.badRequest({
          message: 'RN001: Lead não pode avançar no funil sem qualificação registrada',
          code: 'RN001_LEAD_NAO_QUALIFICADO',
        })
      }
    }

    let projeto: Projeto | null = null

    if (projetoId) {
      projeto = await Projeto.find(projetoId)
      if (!projeto) {
        session.flash('erro', 'Projeto não encontrado')
        return response.redirect().back()
      }
    } else if ((clienteNome && clienteNome.trim()) || lead) {
      const nomeFinal = (clienteNome && clienteNome.trim()) || lead!.nome

      // R2: Resolução relacional de clienteId
      let clienteIdParaProjeto: number | null = null
      if (lead?.clienteId) {
        clienteIdParaProjeto = lead.clienteId
      } else if (nomeFinal) {
        const cliente = await Cliente.firstOrCreate(
          { nome: nomeFinal },
          {
            nome: nomeFinal,
            telefone: lead?.telefone || '(00) 00000-0000',
            email: lead?.email || null,
            arquitetoId: lead?.arquitetoId || null,
            tipo: 'pessoa_fisica',
            isActive: true,
            cadastroAprovado: false,
          }
        )
        clienteIdParaProjeto = cliente.id
        if (lead && !lead.clienteId) {
          lead.clienteId = cliente.id
          await lead.save()
        }
      }

      // Gera próximo código sequencial livre (evita colisões com gaps ou seeds existentes)
      const year = new Date().getFullYear()
      const prefix = `PRJ-${year}-`
      const projetosAno = await Projeto.query().whereILike('codigo', `${prefix}%`).select('codigo')

      let maxSeq = 0
      for (const p of projetosAno) {
        const match = p.codigo.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxSeq) maxSeq = num
        }
      }

      let nextSeq = Math.max(maxSeq + 1, 1)
      let codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`

      while (await Projeto.query().where('codigo', codigo).first()) {
        nextSeq++
        codigo = `${prefix}${String(nextSeq).padStart(3, '0')}`
      }

      projeto = await Projeto.create({
        codigo,
        clienteNome: nomeFinal,
        clienteId: clienteIdParaProjeto,
        leadId: lead ? lead.id : null,
        arquitetoId: lead?.arquitetoId || null,
        vendedorId: user.id,
        status: StatusProjeto.EM_BRIEFING,
        arquivado: false,
        alertaParado: false,
        statusAlteradoEm: DateTime.now(),
      })

      // Registro imutável de histórico inicial (RN017)
      await HistoricoStatusProjeto.create({
        projetoId: projeto.id,
        statusDe: null,
        statusPara: StatusProjeto.EM_BRIEFING,
        alteradoPorId: user.id,
        observacao: 'Criação do projeto e abertura de briefing',
      })

      if (lead) {
        lead.statusFunil = StatusFunil.EM_BRIEFING
        await lead.save()
      }
    } else {
      session.flash('erro', 'Informe o projeto ou o nome do cliente.')
      return response.redirect().back()
    }

    // Verifica se já existe briefing
    let briefing = await Briefing.query().where('projeto_id', projeto.id).first()
    if (!briefing) {
      let ambientesIniciais: string[] = []
      let faixaMin: number | null = null
      let faixaMax: number | null = null

      if (lead) {
        if (Array.isArray(lead.ambientesInteresse)) {
          ambientesIniciais = lead.ambientesInteresse
        }
        if (lead.faixaOrcamento) {
          switch (lead.faixaOrcamento) {
            case 'ate_80k':
              faixaMin = 30000
              faixaMax = 80000
              break
            case '80k_150k':
              faixaMin = 80000
              faixaMax = 150000
              break
            case '150k_300k':
              faixaMin = 150000
              faixaMax = 300000
              break
            case '300k_500k':
              faixaMin = 300000
              faixaMax = 500000
              break
            case 'acima_500k':
              faixaMin = 500000
              faixaMax = 1000000
              break
            case 'ate_40k':
              faixaMin = 20000
              faixaMax = 40000
              break
            case '40k_80k':
              faixaMin = 40000
              faixaMax = 80000
              break
            case 'acima_300k':
              faixaMin = 300000
              faixaMax = 600000
              break
          }
        }
      }

      briefing = await Briefing.create({
        projetoId: projeto.id,
        status: StatusBriefing.RASCUNHO,
        score: '0',
        scoreMinimo: '70',
        ambientes: ambientesIniciais,
        faixaInvestimentoMin: faixaMin ? String(faixaMin) : null,
        faixaInvestimentoMax: faixaMax ? String(faixaMax) : null,
        cidadeObra: lead?.cidade || null,
        estadoObra: lead?.estado || null,
        referenciasUrl: [],
      })
    }

    session.flash('sucesso', 'Briefing iniciado com sucesso!')
    if (request.header('accept')?.includes('application/json')) {
      return response.status(201).json({
        message: 'Briefing iniciado com sucesso!',
        projeto,
        briefing,
      })
    }
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

      // Sincroniza o arquiteto no projeto associado (R1)
      const projeto = await Projeto.query({ client: trx }).where('id', briefing.projetoId).first()
      if (projeto) {
        if (payload.arquitetoId !== undefined) {
          projeto.arquitetoId = payload.arquitetoId ?? null
        }
        if (payload.arquitetoNome !== undefined) {
          projeto.arquitetoNome = payload.arquitetoNome ?? null
        }
        await projeto.save()
      }

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
  async enviarParaFila({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const briefing = await Briefing.query()
      .where('id', params.id)
      .preload('ambientesDetalhados')
      .preload('projeto')
      .first()

    if (!briefing) {
      session.flash('erro', 'Briefing não encontrado')
      if (request.header('accept')?.includes('application/json')) {
        return response.notFound({ message: 'Briefing não encontrado' })
      }
      return response.redirect().back()
    }

    if (briefing.status !== StatusBriefing.RASCUNHO && briefing.status !== StatusBriefing.DEVOLVIDO) {
      session.flash('erro', `Briefing já se encontra no status "${briefing.status}".`)
      if (request.header('accept')?.includes('application/json')) {
        return response.badRequest({ message: `Briefing já se encontra no status "${briefing.status}".` })
      }
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
      if (request.header('accept')?.includes('application/json')) {
        return response.badRequest({ message: msg, scoreResult })
      }
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

      // Atualiza status do projeto para NA_FILA e registra auditoria imutável (RN017 / R3)
      const projeto = briefing.projeto || (await Projeto.query({ client: trx }).where('id', briefing.projetoId).first())
      if (projeto) {
        const statusAnterior = projeto.status
        projeto.useTransaction(trx)
        projeto.status = StatusProjeto.NA_FILA
        projeto.statusAlteradoEm = DateTime.now()
        await projeto.save()

        // R3: Auditoria Imutável no Envio de Briefing à Fila (RN017)
        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: statusAnterior,
            statusPara: StatusProjeto.NA_FILA,
            alteradoPorId: user.id,
            observacao: 'Briefing aprovado com score de qualificação e enviado para a fila de projetos (RN017)',
          },
          { client: trx }
        )
      }
    })

    session.flash(
      'sucesso',
      `Briefing aprovado com Score ${scoreResult.score} pts! O projeto avançou para a Fila de Projetos.`
    )
    if (request.header('accept')?.includes('application/json')) {
      return response.json({
        message: `Briefing aprovado com Score ${scoreResult.score} pts! O projeto avançou para a Fila de Projetos.`,
        score: scoreResult.score,
      })
    }
    return response.redirect().toRoute('briefings.index')
  }
}
