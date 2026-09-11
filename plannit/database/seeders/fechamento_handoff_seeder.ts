import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Projeto, { StatusProjeto } from '#models/projeto'
import Fechamento from '#models/fechamento'
import Parcela, { StatusParcela } from '#models/parcela'
import Handoff, { ITENS_OBRIGATORIOS_HANDOFF } from '#models/handoff'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import Cliente from '#models/cliente'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const cliente = await Cliente.first()
    const vendedor = await User.query().where('perfil', 'vendedor').first()
    const gestor = await User.query().where('perfil', 'diretoria').first() || vendedor

    if (!vendedor || !cliente) {
      return
    }

    // =========================================================================
    // 1. Projeto em Fechamento com Handoff Incompleto (RN006 - Trava Ativa)
    // =========================================================================
    const p1 = await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-FECHAMENTO-PEND' },
      {
        codigo: 'PROJ-2026-FECHAMENTO-PEND',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        vendedorId: vendedor.id,
        status: StatusProjeto.EM_FECHAMENTO,
        valorContrato: '98000.00',
        alertaParado: false,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: 2 }),
      }
    )

    const f1 = await Fechamento.updateOrCreate(
      { projetoId: p1.id },
      {
        projetoId: p1.id,
        valorTotalFechamento: '98000.00',
        contratoUrl: 'https://docs.lidermoveis.com.br/contratos/ct-98000-v1.pdf',
        cadernoComercialUrl: 'https://docs.lidermoveis.com.br/cadernos/cc-98000.pdf',
        dataLimiteAssinatura: DateTime.now().plus({ days: 5 }),
        contratoAssinadoEm: DateTime.now().minus({ days: 1 }),
        onboardingDisparado: true,
        onboardingDisparadoEm: DateTime.now().minus({ days: 1 }),
        checklistCompleto: true,
      }
    )

    // Parcelas de p1 (1 Paga, 2 Pendentes)
    await Parcela.query().where('fechamento_id', f1.id).delete()
    await Parcela.createMany([
      {
        fechamentoId: f1.id,
        numero: 1,
        valor: '32666.66',
        vencimento: DateTime.now().minus({ days: 1 }),
        dataPagamento: DateTime.now().minus({ days: 1 }),
        formaPagamento: 'pix',
        status: StatusParcela.PAGO,
        observacoes: 'Entrada via PIX confirmada.',
      },
      {
        fechamentoId: f1.id,
        numero: 2,
        valor: '32666.67',
        vencimento: DateTime.now().plus({ days: 30 }),
        status: StatusParcela.PENDENTE,
        formaPagamento: 'boleto',
      },
      {
        fechamentoId: f1.id,
        numero: 3,
        valor: '32666.67',
        vencimento: DateTime.now().plus({ days: 60 }),
        status: StatusParcela.PENDENTE,
        formaPagamento: 'boleto',
      },
    ])

    // Handoff com 5 de 8 itens checados (Incompleto - RN006)
    const checklistIncompleto: Record<string, boolean> = {
      contrato_assinado: true,
      caderno_comercial: true,
      plantas_arquitetonicas: true,
      fotos_ambiente: true,
      briefing_completo: true,
      aprovacao_financeira: false, // Faltando
      pedido_gerado: false,        // Faltando
      dados_obra: false,           // Faltando
    }

    await Handoff.updateOrCreate(
      { projetoId: p1.id },
      {
        projetoId: p1.id,
        checklistJson: checklistIncompleto,
        checklistCompleto: false,
        observacoes: 'Aguardando aprovação cadastral da financeira e geração do pedido no ERP.',
      }
    )

    // =========================================================================
    // 2. Projeto com Handoff 100% Liberado (RN006 Cumprida -> CONTATO_CONF)
    // =========================================================================
    const p2 = await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-HANDOFF-LIBERADO' },
      {
        codigo: 'PROJ-2026-HANDOFF-LIBERADO',
        clienteId: cliente.id,
        clienteNome: 'Mansão Jardins - Suíte Master & Living',
        vendedorId: vendedor.id,
        status: StatusProjeto.CONTATO_CONF,
        valorContrato: '215000.00',
        alertaParado: false,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ hours: 4 }),
      }
    )

    const f2 = await Fechamento.updateOrCreate(
      { projetoId: p2.id },
      {
        projetoId: p2.id,
        valorTotalFechamento: '215000.00',
        contratoUrl: 'https://docs.lidermoveis.com.br/contratos/ct-jardins-215k.pdf',
        cadernoComercialUrl: 'https://docs.lidermoveis.com.br/cadernos/cc-jardins-215k.pdf',
        dataLimiteAssinatura: DateTime.now().minus({ days: 3 }),
        contratoAssinadoEm: DateTime.now().minus({ days: 3 }),
        onboardingDisparado: true,
        onboardingDisparadoEm: DateTime.now().minus({ days: 3 }),
        checklistCompleto: true,
      }
    )

    await Parcela.query().where('fechamento_id', f2.id).delete()
    await Parcela.createMany([
      {
        fechamentoId: f2.id,
        numero: 1,
        valor: '107500.00',
        vencimento: DateTime.now().minus({ days: 3 }),
        dataPagamento: DateTime.now().minus({ days: 3 }),
        formaPagamento: 'transferencia',
        status: StatusParcela.PAGO,
        observacoes: 'Entrada de 50% compensada.',
      },
      {
        fechamentoId: f2.id,
        numero: 2,
        valor: '107500.00',
        vencimento: DateTime.now().plus({ days: 45 }),
        status: StatusParcela.PENDENTE,
        formaPagamento: 'boleto',
        observacoes: 'Saldo final na entrega da obra.',
      },
    ])

    const checklistCompleto: Record<string, boolean> = {}
    ITENS_OBRIGATORIOS_HANDOFF.forEach((item) => {
      checklistCompleto[item.id] = true
    })

    await Handoff.updateOrCreate(
      { projetoId: p2.id },
      {
        projetoId: p2.id,
        checklistJson: checklistCompleto,
        checklistCompleto: true,
        liberadoPorId: gestor?.id || vendedor.id,
        liberadoEm: DateTime.now().minus({ hours: 4 }),
        observacoes: 'Projeto conferido e liberado formalmente com todas as plantas e memorial de obra.',
      }
    )

    await HistoricoStatusProjeto.updateOrCreate(
      { projetoId: p2.id, statusPara: StatusProjeto.CONTATO_CONF },
      {
        projetoId: p2.id,
        statusDe: StatusProjeto.EM_HANDOFF,
        statusPara: StatusProjeto.CONTATO_CONF,
        alteradoPorId: gestor?.id || vendedor.id,
        observacao: '[RN006 - HANDOFF TÉCNICO COMPLETO] Passagem formal para equipe de conferência de obras liberada.',
      }
    )
  }
}
