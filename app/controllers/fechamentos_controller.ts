import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Projeto, { StatusProjeto } from '#models/projeto'
import Fechamento from '#models/fechamento'
import Parcela, { StatusParcela } from '#models/parcela'
import Handoff, { ITENS_OBRIGATORIOS_HANDOFF } from '#models/handoff'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import {
  salvarFechamentoValidator,
  liquidarParcelaValidator,
  salvarHandoffValidator,
} from '#validators/fechamento'

export default class FechamentosController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }

  /**
   * Consulta os dados completos de Fechamento Comercial, Parcelas e Handoff Técnico
   */
  async show({ params, response, request, inertia }: HttpContext) {
    const projeto = await Projeto.query()
      .where('id', params.id)
      .preload('cliente')
      .preload('vendedor', (q) => q.select('id', 'nome', 'email'))
      .preload('fechamento', (fQuery) => {
        fQuery
          .preload('parcelas', (pQuery) => pQuery.orderBy('numero', 'asc'))
          .preload('cadastroAprovadoPor', (uQuery) => uQuery.select('id', 'nome'))
      })
      .preload('handoff', (hQuery) => {
        hQuery.preload('liberadoPor', (uQuery) => uQuery.select('id', 'nome'))
      })
      .first()

    if (!projeto) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Projeto não encontrado' })
      }
      return response.redirect().toPath('/projetos')
    }

    // Inicializa estrutura padrão de checklist dos 8 itens se ainda não existir
    const checklistAtual: Record<string, boolean> = {}
    ITENS_OBRIGATORIOS_HANDOFF.forEach((item) => {
      checklistAtual[item.id] = projeto.handoff?.checklistJson?.[item.id] || false
    })

    const payload = {
      projetoId: projeto.id,
      codigo: projeto.codigo,
      clienteNome: projeto.cliente?.nome || projeto.clienteNome,
      statusProjeto: projeto.status,
      valorContrato: projeto.valorContrato ? Number(projeto.valorContrato) : null,
      fechamento: projeto.fechamento
        ? {
            id: projeto.fechamento.id,
            checklistCompleto: projeto.fechamento.checklistCompleto,
            cadastroAprovado: projeto.fechamento.cadastroAprovado,
            cadastroAprovadoPor: projeto.fechamento.cadastroAprovadoPor?.nome || null,
            contratoUrl: projeto.fechamento.contratoUrl,
            cadernoComercialUrl: projeto.fechamento.cadernoComercialUrl,
            valorTotalFechamento: projeto.fechamento.valorTotalFechamento
              ? Number(projeto.fechamento.valorTotalFechamento)
              : null,
            dataLimiteAssinatura: projeto.fechamento.dataLimiteAssinatura
              ? projeto.fechamento.dataLimiteAssinatura.toString()
              : null,
            contratoAssinadoEm: projeto.fechamento.contratoAssinadoEm
              ? projeto.fechamento.contratoAssinadoEm.toISO()
              : null,
            onboardingDisparado: projeto.fechamento.onboardingDisparado,
            onboardingDisparadoEm: projeto.fechamento.onboardingDisparadoEm
              ? projeto.fechamento.onboardingDisparadoEm.toISO()
              : null,
            parcelas: projeto.fechamento.parcelas.map((p) => ({
              id: p.id,
              numero: p.numero,
              valor: Number(p.valor),
              vencimento: p.vencimento.toString(),
              status: p.status,
              dataPagamento: p.dataPagamento ? p.dataPagamento.toString() : null,
              formaPagamento: p.formaPagamento,
              comprovanteUrl: p.comprovanteUrl,
              observacoes: p.observacoes,
            })),
          }
        : null,
      handoff: {
        id: projeto.handoff?.id || null,
        checklist: checklistAtual,
        checklistCompleto: projeto.handoff?.checklistCompleto || false,
        liberadoEm: projeto.handoff?.liberadoEm ? projeto.handoff.liberadoEm.toISO() : null,
        liberadoPorNome: projeto.handoff?.liberadoPor?.nome || null,
        observacoes: projeto.handoff?.observacoes || '',
        itensObrigatorios: ITENS_OBRIGATORIOS_HANDOFF,
      },
    }

    if (this.wantsJson(request)) {
      return response.ok(payload)
    }

    return inertia.render('projetos/fechamento', payload)
  }

  /**
   * Salva dados do Contrato Comercial, Fechamento e Parcelas Financeiras (RF024-RF028)
   */
  async salvarFechamento({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(salvarFechamentoValidator)

    const projeto = await Projeto.query().where('id', params.id).first()
    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    let fechamento: Fechamento
    await db.transaction(async (trx) => {
      fechamento = await Fechamento.firstOrNew({ projetoId: projeto.id }, {}, { client: trx })

      fechamento.useTransaction(trx)
      if (payload.contratoUrl !== undefined) fechamento.contratoUrl = payload.contratoUrl
      if (payload.cadernoComercialUrl !== undefined) fechamento.cadernoComercialUrl = payload.cadernoComercialUrl
      if (payload.valorTotalFechamento !== undefined) {
        fechamento.valorTotalFechamento =
          payload.valorTotalFechamento !== null ? String(payload.valorTotalFechamento) : null
        projeto.useTransaction(trx)
        projeto.valorContrato =
          payload.valorTotalFechamento !== null ? String(payload.valorTotalFechamento) : null
        await projeto.save()
      }
      if (payload.dataLimiteAssinatura !== undefined) {
        fechamento.dataLimiteAssinatura = payload.dataLimiteAssinatura
          ? DateTime.fromISO(payload.dataLimiteAssinatura)
          : null
      }

      // Se marcou como assinado ou enviou data
      if (payload.contratoAssinado) {
        if (!fechamento.contratoAssinadoEm) {
          fechamento.contratoAssinadoEm = DateTime.now()
        }
        // RF028 — Disparo do Onboarding
        if (!fechamento.onboardingDisparado) {
          fechamento.onboardingDisparado = true
          fechamento.onboardingDisparadoEm = DateTime.now()
        }
        fechamento.checklistCompleto = true
      }

      await fechamento.save()

      // Salva / recria parcelas se enviadas
      if (payload.parcelas && payload.parcelas.length > 0) {
        // Exclui parcelas pendentes anteriores
        await Parcela.query({ client: trx })
          .where('fechamento_id', fechamento.id)
          .where('status', StatusParcela.PENDENTE)
          .delete()

        for (const p of payload.parcelas) {
          await Parcela.create(
            {
              fechamentoId: fechamento.id,
              numero: p.numero,
              valor: String(p.valor),
              vencimento: DateTime.fromISO(p.vencimento),
              status: StatusParcela.PENDENTE,
              formaPagamento: p.formaPagamento || 'pix',
              observacoes: p.observacoes || null,
            },
            { client: trx }
          )
        }
      }

      // Registro imutável (RN017)
      await HistoricoStatusProjeto.create(
        {
          projetoId: projeto.id,
          statusDe: projeto.status,
          statusPara: projeto.status,
          alteradoPorId: user.id,
          observacao: `[FECHAMENTO COMERCIAL] Dados contratuais atualizados. Onboarding disparado: ${
            fechamento.onboardingDisparado ? 'Sim' : 'Não'
          }.`,
        },
        { client: trx }
      )
    })

    if (this.wantsJson(request)) {
      return response.ok({
        message: 'Fechamento comercial e plano de pagamento salvos com sucesso',
        fechamento: fechamento!,
      })
    }

    session.flash('success', 'Fechamento comercial atualizado com sucesso!')
    return response.redirect().back()
  }

  /**
   * Baixa / Liquidação de parcela de pagamento
   */
  async liquidarParcela({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(liquidarParcelaValidator)

    const parcela = await Parcela.query()
      .where('id', params.parcelaId)
      .preload('fechamento', (f) => f.preload('projeto'))
      .first()

    if (!parcela || !parcela.fechamento) {
      return response.notFound({ message: 'Parcela não encontrada' })
    }

    await db.transaction(async (trx) => {
      parcela.useTransaction(trx)
      parcela.status = StatusParcela.PAGO
      parcela.formaPagamento = payload.formaPagamento
      parcela.comprovanteUrl = payload.comprovanteUrl || null
      parcela.dataPagamento = payload.dataPagamento
        ? DateTime.fromISO(payload.dataPagamento)
        : DateTime.now()
      if (payload.observacoes) parcela.observacoes = payload.observacoes
      await parcela.save()

      const projeto = parcela.fechamento.projeto
      if (projeto) {
        await HistoricoStatusProjeto.create(
          {
            projetoId: projeto.id,
            statusDe: projeto.status,
            statusPara: projeto.status,
            alteradoPorId: user.id,
            observacao: `[FINANCEIRO] Parcela #${parcela.numero} (R$ ${Number(parcela.valor).toFixed(
              2
            )}) liquidada via ${payload.formaPagamento}.`,
          },
          { client: trx }
        )
      }
    })

    if (this.wantsJson(request)) {
      return response.ok({
        message: `Parcela #${parcela.numero} liquidada com sucesso`,
        parcela,
      })
    }

    session.flash('success', `Parcela #${parcela.numero} quitada com sucesso!`)
    return response.redirect().back()
  }

  /**
   * Atualização do Checklist de Handoff Técnico com aplicação estrita da RN006
   */
  async salvarHandoff({ params, request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(salvarHandoffValidator)

    const projeto = await Projeto.query().where('id', params.id).first()
    if (!projeto) {
      return response.notFound({ message: 'Projeto não encontrado' })
    }

    // Avalia se todos os 8 itens obrigatórios estão preenchidos (RN006)
    const todosValidados = ITENS_OBRIGATORIOS_HANDOFF.every(
      (item) => payload.checklist[item.id] === true
    )

    let handoff: Handoff
    await db.transaction(async (trx) => {
      handoff = await Handoff.firstOrNew({ projetoId: projeto.id }, {}, { client: trx })

      handoff.useTransaction(trx)
      handoff.checklistJson = payload.checklist
      handoff.checklistCompleto = todosValidados
      if (payload.observacoes !== undefined) handoff.observacoes = payload.observacoes

      if (todosValidados) {
        handoff.liberadoPorId = user.id
        handoff.liberadoEm = DateTime.now()

        // Se o projeto estiver em fechamento ou handoff, pode avançar para contato com a conferência
        if (
          projeto.status === StatusProjeto.EM_FECHAMENTO ||
          projeto.status === StatusProjeto.EM_HANDOFF
        ) {
          const statusAnterior = projeto.status
          projeto.useTransaction(trx)
          projeto.status = StatusProjeto.CONTATO_CONF
          projeto.statusAlteradoEm = DateTime.now()
          projeto.alertaParado = false
          await projeto.save()

          await HistoricoStatusProjeto.create(
            {
              projetoId: projeto.id,
              statusDe: statusAnterior,
              statusPara: StatusProjeto.CONTATO_CONF,
              alteradoPorId: user.id,
              observacao: `[RN006 - HANDOFF TÉCNICO COMPLETO] Passagem formal da venda para a equipe de conferência de obras liberada. 8 itens obrigatórios conferidos.`,
            },
            { client: trx }
          )
        }
      } else {
        handoff.liberadoPorId = null
        handoff.liberadoEm = null
      }

      await handoff.save()
    })

    if (this.wantsJson(request)) {
      return response.ok({
        message: todosValidados
          ? 'Handoff técnico 100% liberado com sucesso (RN006 cumprida)!'
          : 'Checklist de Handoff salvo. Ainda restam itens obrigatórios para liberação.',
        handoff: handoff!,
        liberado: todosValidados,
      })
    }

    if (todosValidados) {
      session.flash('success', 'Handoff Técnico aprovado! Projeto liberado para Conferência de Obras.')
    } else {
      session.flash('info', 'Checklist de Handoff salvo com sucesso. Faltam itens para a liberação final.')
    }

    return response.redirect().back()
  }
}
