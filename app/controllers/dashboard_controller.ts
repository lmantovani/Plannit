import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Projeto from '#models/projeto'
import Lead from '#models/lead'
import FilaProjeto from '#models/fila_projeto'
import Cliente from '#models/cliente'
import Arquiteto from '#models/arquiteto'
import Colaborador from '#models/colaborador'
import { listarProjetistasComCapacidade } from '#services/wip_service'

export default class DashboardController {
  /**
   * Visão consolidada gerencial com agregação analítica e alertas RN016
   */
  async index({ inertia }: HttpContext) {
    const agora = DateTime.now()
    const cincoDiasAtras = agora.minus({ days: 5 })

    // 1. Alerta de Estagnação (RN016): Projetos parados > 5 dias sem movimentação
    const projetosAtivosQuery = Projeto.query()
      .where('arquivado', false)
      .whereNotIn('status', ['concluido', 'cancelado'])
      .preload('cliente')
      .preload('vendedor')
      .preload('projetista')

    const todosProjetosAtivos = await projetosAtivosQuery.exec()

    // Filtra projetos parados > 5 dias (RN016)
    const projetosParadosAlertas = todosProjetosAtivos.filter((p) => {
      const dataReferencia = p.statusAlteradoEm || p.updatedAt || p.createdAt
      return dataReferencia < cincoDiasAtras
    })

    // 2. Resumo de Projetos por Status
    const statusMap: Record<string, number> = {}
    todosProjetosAtivos.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1
    })

    // 3. Funil Comercial de Leads
    const leadsNoFunil = await Lead.query()
      .where('convertidoEmCliente', false)
      .groupBy('statusFunil')
      .select('statusFunil')
      .count('* as total')

    const funilLeads: Record<string, number> = {}
    leadsNoFunil.forEach((row: any) => {
      funilLeads[row.statusFunil] = Number(row.$extras.total || 0)
    })

    // Taxa de Conversão de Leads
    const totalLeads = await Lead.query().count('* as total')
    const leadsFechados = await Lead.query().where('statusFunil', 'fechado').count('* as total')
    const countTotalLeads = Number(totalLeads[0].$extras.total || 0)
    const countLeadsFechados = Number(leadsFechados[0].$extras.total || 0)
    const taxaConversaoPct =
      countTotalLeads > 0 ? Math.round((countLeadsFechados / countTotalLeads) * 100) : 0

    // 4. Fila de Espera de Projetos (Aguardando Alocação)
    const naFila = await FilaProjeto.query().where('status', 'aguardando').count('* as total')
    const countNaFila = Number(naFila[0].$extras.total || 0)

    // 5. Volume Total Financeiro em Negociação/Carteira
    const valorEmCarteira = todosProjetosAtivos.reduce(
      (acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0),
      0
    )

    // 6. Contagens de Apoio (Clientes, Especificadores e Headcount RH)
    const [totalClientes, totalEspecificadores, totalColaboradores] = await Promise.all([
      Cliente.query().where('isActive', true).count('* as total'),
      Arquiteto.query().where('isActive', true).count('* as total'),
      Colaborador.query().where('isActive', true).count('* as total'),
    ])

    // 7. Capacidade Operacional da Equipe 3D (WIP Service)
    const projetistasWip = await listarProjetistasComCapacidade()

    // 8. Lista de Projetos para a Tabela Operacional (destacando alertas RN016 primeiro)
    const projetosFormatados = [...todosProjetosAtivos]
      .sort((a, b) => {
        const dataA = a.statusAlteradoEm || a.updatedAt || a.createdAt
        const dataB = b.statusAlteradoEm || b.updatedAt || b.createdAt
        // Projetos mais antigos sem movimentação vêm primeiro (foco em estagnação)
        return dataA.toMillis() - dataB.toMillis()
      })
      .slice(0, 20)
      .map((p) => {
        const dataRef = p.statusAlteradoEm || p.updatedAt || p.createdAt
        const diasParado = Math.floor(agora.diff(dataRef, 'days').days)
        const alertaParado = dataRef < cincoDiasAtras

        return {
          id: p.id,
          codigo: p.codigo,
          clienteNome: p.cliente?.nome || p.clienteNome || 'Cliente Direto',
          status: p.status,
          vendedorNome: p.vendedor?.nome || 'Não atribuído',
          projetistaNome: p.projetista?.nome || 'Aguardando',
          valorContrato: p.valorContrato ? Number(p.valorContrato) : 0,
          ultimaMovimentacao: dataRef.toISO(),
          diasParado,
          alertaParado,
        }
      })


    return inertia.render('dashboard', {
      resumo: {
        projetosAtivos: todosProjetosAtivos.length,
        projetosParadosAlerta: projetosParadosAlertas.length,
        leadsTotal: countTotalLeads,
        taxaConversaoPct,
        projetosNaFila: countNaFila,
        valorEmCarteira,
        totalClientes: Number(totalClientes[0].$extras.total || 0),
        totalEspecificadores: Number(totalEspecificadores[0].$extras.total || 0),
        totalColaboradores: Number(totalColaboradores[0].$extras.total || 0),
      },
      alertasRn016: projetosParadosAlertas.map((p) => {
        const dataRef = p.statusAlteradoEm || p.updatedAt || p.createdAt
        const diasParado = Math.floor(agora.diff(dataRef, 'days').days)
        return {
          id: p.id,
          codigo: p.codigo,
          clienteNome: p.cliente?.nome || p.clienteNome || 'Cliente Direto',
          status: p.status,
          vendedorNome: p.vendedor?.nome || 'Não atribuído',
          projetistaNome: p.projetista?.nome || 'Aguardando',
          diasParado,
        }
      }),
      statusMap,
      funilLeads,
      projetistasWip,
      projetosRecentes: projetosFormatados,
    })
  }
}