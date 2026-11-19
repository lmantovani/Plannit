import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import User, { PerfilUsuario } from '#models/user'
import Arquiteto from '#models/arquiteto'
import Cliente from '#models/cliente'
import Lead, { OrigemLead, StatusFunil } from '#models/lead'
import HistoricoStatusLead from '#models/historico_status_lead'
import PermissionService from '#services/permission_service'
import AtendimentoFilaVendedor, {
  StatusDisponibilidadeFila,
  STATUS_DISPONIBILIDADE_LABELS,
} from '#models/atendimento_fila_vendedor'
import AtendimentoRegistro, {
  TipoAtendimentoPorta,
  TIPO_ATENDIMENTO_LABELS,
  MotivoPuloFila,
  MOTIVO_PULO_LABELS,
  StatusAtendimentoRegistro,
  STATUS_ATENDIMENTO_LABELS,
  DESFECHO_ATENDIMENTO_LABELS,
} from '#models/atendimento_registro'
import AtendimentoHistoricoEvento, {
  TipoEventoFila,
  TIPO_EVENTO_FILA_LABELS,
} from '#models/atendimento_historico_evento'
import {
  entrarFilaValidator,
  mudarDisponibilidadeValidator,
  reordenarFilaValidator,
  iniciarAtendimentoValidator,
  concluirAtendimentoValidator,
} from '#validators/atendimento_fila'

const ZONA_LOJA = 'America/Sao_Paulo'

export default class AtendimentosFilaController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }

  private getDataHojeLoja(): string {
    return DateTime.now().setZone(ZONA_LOJA).toISODate()!
  }

  private async podeVisualizar(user: User): Promise<boolean> {
    if (
      user.isSuperuser ||
      user.perfil === PerfilUsuario.DIRETORIA ||
      user.perfil === PerfilUsuario.GERENTE_COMERCIAL ||
      user.perfil === PerfilUsuario.RECEPCAO ||
      user.perfil === PerfilUsuario.VENDEDOR
    ) {
      return PermissionService.hasPermission(user, 'atendimentos.visualizar_fila')
    }
    return PermissionService.hasPermission(user, 'atendimentos.visualizar_fila')
  }

  private async podeOperar(user: User): Promise<boolean> {
    return PermissionService.hasPermission(user, 'atendimentos.operar_fila')
  }

  private async podeGerenciarOrdem(user: User): Promise<boolean> {
    if (
      user.isSuperuser ||
      user.perfil === PerfilUsuario.DIRETORIA ||
      user.perfil === PerfilUsuario.GERENTE_COMERCIAL ||
      user.perfil === PerfilUsuario.RECEPCAO
    ) {
      return true
    }
    return PermissionService.hasPermission(user, 'atendimentos.reordenar_fila')
  }

  private async reorganizarPosicoes(trx: TransactionClientContract, dataISO: string) {
    const itens = await AtendimentoFilaVendedor.query({ client: trx })
      .where('data', dataISO)
      .orderBy('posicao', 'asc')
      .orderBy('hora_chegada', 'asc')
      .orderBy('id', 'asc')

    for (let i = 0; i < itens.length; i++) {
      const novaPos = i + 1
      if (itens[i].posicao !== novaPos) {
        itens[i].useTransaction(trx)
        itens[i].posicao = novaPos
        await itens[i].save()
      }
    }

    return itens
  }

  /**
   * GET /atendimentos/fila — Painel da Fila da Vez da Recepção e Vendedores
   */
  async index({ request, response, inertia, auth, session }: HttpContext) {
    const user = auth.user!

    if (!(await this.podeVisualizar(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_VISUALIZAR_FILA',
          message: 'Você não tem permissão para visualizar a fila de atendimento.',
        })
      }
      session.flash('error', 'Você não tem permissão para visualizar a fila de atendimento.')
      return response.redirect().toRoute('dashboard')
    }

    const agoraLoja = DateTime.now().setZone(ZONA_LOJA)
    const dataHoje = agoraLoja.toISODate()!

    const qs = request.qs()
    const periodoParam = String(qs.periodo || '').trim()
    const temIntervaloExplicito =
      periodoParam === 'personalizado' || qs.dataInicio !== undefined || qs.dataFim !== undefined

    const periodo: 'dia' | 'semana' | 'quinzena' | 'mes' | 'personalizado' = temIntervaloExplicito
      ? 'personalizado'
      : periodoParam === 'dia' ||
          periodoParam === 'semana' ||
          periodoParam === 'quinzena' ||
          periodoParam === 'mes'
        ? periodoParam
        : 'mes'

    const parseDataISO = (raw: unknown): DateTime | null => {
      const str = String(raw ?? '').trim()
      if (!str) return null
      const dt = DateTime.fromISO(str, { zone: ZONA_LOJA })
      return dt.isValid ? dt : null
    }

    const dataRefDT = parseDataISO(qs.dataRef) || agoraLoja
    const dataRef = dataRefDT.toISODate()!

    const filtroVendedorId =
      qs.vendedorId && Number(qs.vendedorId) > 0 ? Number(qs.vendedorId) : null

    let inicioPeriodo: string | null = null
    let fimPeriodo: string | null = null
    let periodoLabel = ''

    if (periodo === 'personalizado') {
      const dtInicio = parseDataISO(qs.dataInicio)
      const dtFim = parseDataISO(qs.dataFim)
      inicioPeriodo = dtInicio ? dtInicio.toISODate()! : null
      fimPeriodo = dtFim ? dtFim.toISODate()! : null

      if (dtInicio && dtFim) {
        periodoLabel =
          inicioPeriodo === fimPeriodo
            ? dtInicio.toFormat('dd/MM/yyyy')
            : `${dtInicio.toFormat('dd/MM/yyyy')} a ${dtFim.toFormat('dd/MM/yyyy')}`
      } else if (dtInicio) {
        periodoLabel = `A partir de ${dtInicio.toFormat('dd/MM/yyyy')}`
      } else if (dtFim) {
        periodoLabel = `Até ${dtFim.toFormat('dd/MM/yyyy')}`
      } else {
        periodoLabel = 'Todo o período'
      }
    } else if (periodo === 'dia') {
      inicioPeriodo = dataRef
      fimPeriodo = dataRef
      periodoLabel = dataRefDT.toFormat('dd/MM/yyyy')
    } else if (periodo === 'semana') {
      const inicioSem = dataRefDT.startOf('week')
      const fimSem = dataRefDT.endOf('week')
      inicioPeriodo = inicioSem.toISODate()!
      fimPeriodo = fimSem.toISODate()!
      periodoLabel = `Semana ${inicioSem.toFormat('dd/MM')} a ${fimSem.toFormat('dd/MM/yyyy')}`
    } else if (periodo === 'quinzena') {
      if (dataRefDT.day <= 15) {
        inicioPeriodo = dataRefDT.startOf('month').toISODate()!
        fimPeriodo = dataRefDT.set({ day: 15 }).toISODate()!
        periodoLabel = `1ª Quinzena ${dataRefDT.toFormat('MM/yyyy')}`
      } else {
        inicioPeriodo = dataRefDT.set({ day: 16 }).toISODate()!
        fimPeriodo = dataRefDT.endOf('month').toISODate()!
        periodoLabel = `2ª Quinzena ${dataRefDT.toFormat('MM/yyyy')}`
      }
    } else {
      inicioPeriodo = dataRefDT.startOf('month').toISODate()!
      fimPeriodo = dataRefDT.endOf('month').toISODate()!
      periodoLabel = dataRefDT.toFormat('MM/yyyy')
    }

    const filaHoje = await AtendimentoFilaVendedor.query()
      .where('data', dataHoje)
      .preload('vendedor', (q) => q.select('id', 'nome', 'email', 'perfil'))
      .preload('adicionadoPor', (q) => q.select('id', 'nome'))
      .orderBy('posicao', 'asc')
      .orderBy('hora_chegada', 'asc')
      .orderBy('id', 'asc')

    const proximoDaVezItem =
      filaHoje.find((item) => item.status === StatusDisponibilidadeFila.DISPONIVEL) || null
    const meuItemFila = filaHoje.find((item) => item.vendedorId === user.id) || null

    const atendimentosHoje = await AtendimentoRegistro.query()
      .where('data', dataHoje)
      .preload('vendedor', (q) => q.select('id', 'nome', 'email'))
      .preload('iniciadoPor', (q) => q.select('id', 'nome'))
      .preload('vendedorPulado', (q) => q.select('id', 'nome'))
      .preload('arquiteto', (q) => q.select('id', 'nome', 'escritorio'))
      .preload('lead', (q) => q.select('id', 'nome', 'statusFunil'))
      .orderBy('iniciado_em', 'desc')

    const atendimentosEmAndamento = atendimentosHoje.filter(
      (a) => a.status === StatusAtendimentoRegistro.EM_ANDAMENTO
    )
    const atendimentosConcluidosHoje = atendimentosHoje.filter(
      (a) => a.status === StatusAtendimentoRegistro.CONCLUIDO
    )

    const historicoEventosQuery = AtendimentoHistoricoEvento.query()
      .preload('vendedor', (q) => q.select('id', 'nome'))
      .preload('executadoPor', (q) => q.select('id', 'nome'))
      .preload('vendedorPulado', (q) => q.select('id', 'nome'))
      .orderBy('created_at', 'desc')
      .limit(300)

    if (inicioPeriodo) {
      historicoEventosQuery.where('data', '>=', inicioPeriodo)
    }
    if (fimPeriodo) {
      historicoEventosQuery.where('data', '<=', fimPeriodo)
    }

    if (filtroVendedorId) {
      historicoEventosQuery.where((q) => {
        q.where('vendedor_id', filtroVendedorId).orWhere('vendedor_pulado_id', filtroVendedorId)
      })
    }

    const historicoEventos = await historicoEventosQuery

    const todosVendedoresUsers = await User.query()
      .where('is_active', true)
      .whereIn('perfil', [PerfilUsuario.VENDEDOR, PerfilUsuario.GERENTE_COMERCIAL])
      .select('id', 'nome', 'email', 'perfil')
      .orderByRaw("CASE WHEN perfil = 'vendedor' THEN 0 ELSE 1 END")
      .orderBy('nome', 'asc')

    const idsNaFila = new Set(filaHoje.map((f) => f.vendedorId))
    const vendedoresForaDaFila = todosVendedoresUsers.filter((v) => !idsNaFila.has(v.id))

    const vendedoresNaFilaOrdenados = filaHoje
      .filter((f) => Boolean(f.vendedor))
      .map((f) => ({
        id: f.vendedor.id,
        nome: f.vendedor.nome,
        email: f.vendedor.email,
        perfil: f.vendedor.perfil,
      }))

    const idsAdicionados = new Set(vendedoresNaFilaOrdenados.map((v) => v.id))
    const todosVendedoresOrdenados = [
      ...vendedoresNaFilaOrdenados,
      ...vendedoresForaDaFila
        .filter((v) => !idsAdicionados.has(v.id))
        .map((v) => ({
          id: v.id,
          nome: v.nome,
          email: v.email,
          perfil: v.perfil,
        })),
    ]

    const arquitetos = await Arquiteto.query()
      .where('is_active', true)
      .select('id', 'nome', 'escritorio')
      .orderBy('nome', 'asc')

    const clientesRows = await Cliente.query()
      .where('is_active', true)
      .select('id', 'nome', 'telefone', 'email', 'arquiteto_id')
      .orderBy('nome', 'asc')

    const leadsClientesRows = await Lead.query()
      .whereNotNull('cliente_id')
      .preload('vendedor', (q) => q.select('id', 'nome'))
      .orderBy('created_at', 'desc')

    const ultimoLeadPorCliente = new Map<
      number,
      { leadId: number; vendedorId: number | null; vendedorNome: string | null }
    >()
    for (const l of leadsClientesRows) {
      if (l.clienteId && !ultimoLeadPorCliente.has(l.clienteId)) {
        ultimoLeadPorCliente.set(l.clienteId, {
          leadId: l.id,
          vendedorId: l.vendedorId,
          vendedorNome: l.vendedor?.nome || null,
        })
      }
    }

    // Métricas por vendedor no período selecionado
    const registrosPeriodoQuery = AtendimentoRegistro.query()
      .whereNot('status', StatusAtendimentoRegistro.CANCELADO)
      .preload('vendedor', (q) => q.select('id', 'nome'))

    if (inicioPeriodo) {
      registrosPeriodoQuery.where('data', '>=', inicioPeriodo)
    }
    if (fimPeriodo) {
      registrosPeriodoQuery.where('data', '<=', fimPeriodo)
    }

    if (filtroVendedorId) {
      registrosPeriodoQuery.where((q) => {
        q.where('vendedor_id', filtroVendedorId).orWhere('vendedor_pulado_id', filtroVendedorId)
      })
    }

    const registrosMes = await registrosPeriodoQuery

    const metricasMap = new Map<
      number,
      {
        vendedorId: number
        nome: string
        initials: string
        totalAtendimentos: number
        portaNovo: number
        retornoCarteira: number
        indicacaoEspecificador: number
        outros: number
        conversoes: number
        naoEvoluiu: number
        vezesPulouOutros: number
        vezesFoiPulado: number
      }
    >()

    for (const v of todosVendedoresUsers.filter((u) => u.perfil === PerfilUsuario.VENDEDOR)) {
      metricasMap.set(v.id, {
        vendedorId: v.id,
        nome: v.nome,
        initials: v.initials,
        totalAtendimentos: 0,
        portaNovo: 0,
        retornoCarteira: 0,
        indicacaoEspecificador: 0,
        outros: 0,
        conversoes: 0,
        naoEvoluiu: 0,
        vezesPulouOutros: 0,
        vezesFoiPulado: 0,
      })
    }

    for (const reg of registrosMes) {
      if (!metricasMap.has(reg.vendedorId)) {
        const nome = reg.vendedor?.nome || `Vendedor #${reg.vendedorId}`
        metricasMap.set(reg.vendedorId, {
          vendedorId: reg.vendedorId,
          nome,
          initials: nome.slice(0, 2).toUpperCase(),
          totalAtendimentos: 0,
          portaNovo: 0,
          retornoCarteira: 0,
          indicacaoEspecificador: 0,
          outros: 0,
          conversoes: 0,
          naoEvoluiu: 0,
          vezesPulouOutros: 0,
          vezesFoiPulado: 0,
        })
      }

      const m = metricasMap.get(reg.vendedorId)!
      m.totalAtendimentos += 1
      if (reg.tipoAtendimento === TipoAtendimentoPorta.PORTA_NOVO) m.portaNovo += 1
      else if (reg.tipoAtendimento === TipoAtendimentoPorta.RETORNO_CARTEIRA) m.retornoCarteira += 1
      else if (reg.tipoAtendimento === TipoAtendimentoPorta.INDICACAO_ESPECIFICADOR) {
        m.indicacaoEspecificador += 1
      } else {
        m.outros += 1
      }

      if (reg.desfecho === 'gerou_orcamento' || reg.desfecho === 'gerou_lead') {
        m.conversoes += 1
      } else if (reg.desfecho === 'nao_evoluiu') {
        m.naoEvoluiu += 1
      }

      if (reg.foiPuloDeVez) {
        m.vezesPulouOutros += 1
      }

      if (reg.vendedorPuladoId) {
        const pulado = metricasMap.get(reg.vendedorPuladoId)
        if (pulado) {
          pulado.vezesFoiPulado += 1
        }
      }
    }

    if (filtroVendedorId && !metricasMap.has(filtroVendedorId)) {
      const vendedorFiltroUser =
        todosVendedoresUsers.find((u) => u.id === filtroVendedorId) ||
        (await User.find(filtroVendedorId))
      if (vendedorFiltroUser) {
        metricasMap.set(vendedorFiltroUser.id, {
          vendedorId: vendedorFiltroUser.id,
          nome: vendedorFiltroUser.nome,
          initials: vendedorFiltroUser.initials,
          totalAtendimentos: 0,
          portaNovo: 0,
          retornoCarteira: 0,
          indicacaoEspecificador: 0,
          outros: 0,
          conversoes: 0,
          naoEvoluiu: 0,
          vezesPulouOutros: 0,
          vezesFoiPulado: 0,
        })
      }
    }

    const metricasFiltradas = Array.from(metricasMap.values())
      .filter((m) => !filtroVendedorId || m.vendedorId === filtroVendedorId)
      .sort((a, b) => b.totalAtendimentos - a.totalAtendimentos || a.nome.localeCompare(b.nome))

    const serializarFilaItem = (f: AtendimentoFilaVendedor) => ({
      id: f.id,
      data: f.data ? f.data.toISODate() : dataHoje,
      vendedorId: f.vendedorId,
      posicao: f.posicao,
      status: f.status,
      statusLabel: STATUS_DISPONIBILIDADE_LABELS[f.status] || f.status,
      motivoIndisponibilidade: f.motivoIndisponibilidade,
      horaChegada: f.horaChegada ? f.horaChegada.toISO() : null,
      ultimoAtendimentoEm: f.ultimoAtendimentoEm ? f.ultimoAtendimentoEm.toISO() : null,
      atendimentosHoje: f.atendimentosHoje,
      vendedor: f.vendedor
        ? {
            id: f.vendedor.id,
            nome: f.vendedor.nome,
            email: f.vendedor.email,
            initials: f.vendedor.initials,
          }
        : null,
      adicionadoPor: f.adicionadoPor
        ? { id: f.adicionadoPor.id, nome: f.adicionadoPor.nome }
        : null,
    })

    const serializarRegistro = (r: AtendimentoRegistro) => ({
      id: r.id,
      data: r.data ? r.data.toISODate() : dataHoje,
      vendedorId: r.vendedorId,
      iniciadoPorId: r.iniciadoPorId,
      tipoAtendimento: r.tipoAtendimento,
      tipoAtendimentoLabel: TIPO_ATENDIMENTO_LABELS[r.tipoAtendimento] || r.tipoAtendimento,
      clienteNome: r.clienteNome,
      clienteTelefone: r.clienteTelefone,
      leadId: r.leadId,
      clienteId: r.clienteId,
      arquitetoId: r.arquitetoId,
      foiPuloDeVez: r.foiPuloDeVez,
      vendedorPuladoId: r.vendedorPuladoId,
      motivoPulo: r.motivoPulo,
      motivoPuloLabel: r.motivoPulo ? MOTIVO_PULO_LABELS[r.motivoPulo] || r.motivoPulo : null,
      justificativaPulo: r.justificativaPulo,
      status: r.status,
      statusLabel: STATUS_ATENDIMENTO_LABELS[r.status] || r.status,
      desfecho: r.desfecho,
      desfechoLabel: r.desfecho ? DESFECHO_ATENDIMENTO_LABELS[r.desfecho] || r.desfecho : null,
      observacao: r.observacao,
      iniciadoEm: r.iniciadoEm ? r.iniciadoEm.toISO() : null,
      concluidoEm: r.concluidoEm ? r.concluidoEm.toISO() : null,
      duracaoMinutos: r.duracaoMinutos,
      vendedor: r.vendedor ? { id: r.vendedor.id, nome: r.vendedor.nome } : null,
      iniciadoPor: r.iniciadoPor ? { id: r.iniciadoPor.id, nome: r.iniciadoPor.nome } : null,
      vendedorPulado: r.vendedorPulado
        ? { id: r.vendedorPulado.id, nome: r.vendedorPulado.nome }
        : null,
      arquiteto: r.arquiteto
        ? { id: r.arquiteto.id, nome: r.arquiteto.nome, escritorio: r.arquiteto.escritorio }
        : null,
      lead: r.lead ? { id: r.lead.id, nome: r.lead.nome, statusFunil: r.lead.statusFunil } : null,
    })

    const props = {
      dataHoje,
      mesReferencia: periodoLabel,
      filtrosPainel: {
        periodo,
        dataRef,
        dataInicio: inicioPeriodo || '',
        dataFim: fimPeriodo || '',
        vendedorId: filtroVendedorId ? String(filtroVendedorId) : '',
        periodoLabel,
      },
      fila: filaHoje.map(serializarFilaItem),
      proximoDaVez: proximoDaVezItem ? serializarFilaItem(proximoDaVezItem) : null,
      meuItemFila: meuItemFila ? serializarFilaItem(meuItemFila) : null,
      atendimentosEmAndamento: atendimentosEmAndamento.map(serializarRegistro),
      atendimentosConcluidosHoje: atendimentosConcluidosHoje.map(serializarRegistro),
      historicoEventos: historicoEventos.map((e) => ({
        id: e.id,
        tipoEvento: e.tipoEvento,
        tipoEventoLabel: TIPO_EVENTO_FILA_LABELS[e.tipoEvento] || e.tipoEvento,
        vendedorId: e.vendedorId,
        executadoPorId: e.executadoPorId,
        vendedorPuladoId: e.vendedorPuladoId,
        posicaoAnterior: e.posicaoAnterior,
        posicaoNova: e.posicaoNova,
        motivo: e.motivo,
        detalhes: e.detalhes,
        createdAt: e.createdAt ? e.createdAt.toISO() : null,
        vendedor: e.vendedor ? { id: e.vendedor.id, nome: e.vendedor.nome } : null,
        executadoPor: e.executadoPor ? { id: e.executadoPor.id, nome: e.executadoPor.nome } : null,
        vendedorPulado: e.vendedorPulado
          ? { id: e.vendedorPulado.id, nome: e.vendedorPulado.nome }
          : null,
      })),
      metricasMes: metricasFiltradas,
      vendedoresForaDaFila: vendedoresForaDaFila.map((v) => ({
        id: v.id,
        nome: v.nome,
        email: v.email,
        perfil: v.perfil,
      })),
      todosVendedores: todosVendedoresOrdenados,
      arquitetos: arquitetos.map((a) => ({
        id: a.id,
        nome: a.nome,
        escritorio: a.escritorio,
      })),
      clientesCatalogo: clientesRows.map((cl) => {
        const infoLead = ultimoLeadPorCliente.get(cl.id)
        return {
          id: cl.id,
          nome: cl.nome,
          telefone: cl.telefone,
          email: cl.email,
          arquitetoId: cl.arquitetoId,
          vendedorId: infoLead?.vendedorId || null,
          vendedorNome: infoLead?.vendedorNome || null,
          leadId: infoLead?.leadId || null,
        }
      }),
      permissoesFila: {
        podeOperar: await this.podeOperar(user),
        podeGerenciarOrdem: await this.podeGerenciarOrdem(user),
        isVendedor: user.perfil === PerfilUsuario.VENDEDOR,
      },
    }

    if (this.wantsJson(request)) {
      return response.ok(props)
    }

    return inertia.render('atendimentos/fila', props)
  }

  /**
   * POST /atendimentos/fila/entrar — Vendedor marca chegada ou Recepção/Gerência inclui vendedor na fila do dia
   */
  async entrarNaFila({ request, response, auth, session }: HttpContext) {
    const user = auth.user!

    if (!(await this.podeOperar(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_OPERAR_FILA',
          message: 'Você não tem permissão para operar a fila de atendimento.',
        })
      }
      session.flash('error', 'Você não tem permissão para operar a fila de atendimento.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(entrarFilaValidator)
    const vendedorAlvoId = payload.vendedorId || user.id

    if (vendedorAlvoId !== user.id && !(await this.podeGerenciarOrdem(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_ADICIONAR_TERCEIRO',
          message: 'Apenas Recepção, Gerência ou Diretoria podem incluir outro vendedor na fila.',
        })
      }
      session.flash(
        'error',
        'Apenas Recepção, Gerência ou Diretoria podem incluir outro vendedor na fila.'
      )
      return response.redirect().back()
    }

    const vendedorAlvo = await User.find(vendedorAlvoId)
    if (!vendedorAlvo || !vendedorAlvo.isActive) {
      if (this.wantsJson(request)) {
        return response.notFound({
          code: 'VENDEDOR_NAO_ENCONTRADO',
          message: 'Vendedor não encontrado ou inativo.',
        })
      }
      session.flash('error', 'Vendedor não encontrado ou inativo.')
      return response.redirect().back()
    }

    const dataHoje = this.getDataHojeLoja()
    const jaExiste = await AtendimentoFilaVendedor.query()
      .where('data', dataHoje)
      .where('vendedor_id', vendedorAlvoId)
      .first()

    if (jaExiste) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_JA_NA_FILA',
          message: `${vendedorAlvo.nome} já está na fila de atendimento de hoje (posição ${jaExiste.posicao}º).`,
        })
      }
      session.flash(
        'error',
        `${vendedorAlvo.nome} já está na fila de atendimento de hoje (posição ${jaExiste.posicao}º).`
      )
      return response.redirect().back()
    }

    const itemCriado = await db.transaction(async (trx) => {
      const agora = DateTime.now().toUTC()
      const dataDia = DateTime.fromISO(dataHoje, { zone: 'utc' })

      const existentes = await AtendimentoFilaVendedor.query({ client: trx })
        .where('data', dataHoje)
        .orderBy('posicao', 'desc')

      const proximaPosicao = existentes.length > 0 ? existentes[0].posicao + 1 : 1

      const novoItem = await AtendimentoFilaVendedor.create(
        {
          data: dataDia,
          vendedorId: vendedorAlvoId,
          adicionadoPorId: user.id,
          posicao: proximaPosicao,
          status: StatusDisponibilidadeFila.DISPONIVEL,
          motivoIndisponibilidade: null,
          horaChegada: agora,
          atendimentosHoje: 0,
        },
        { client: trx }
      )

      const listaAtualizada = await this.reorganizarPosicoes(trx, dataHoje)
      const itemFinal = listaAtualizada.find((i) => i.id === novoItem.id) || novoItem

      await AtendimentoHistoricoEvento.create(
        {
          data: dataDia,
          tipoEvento: TipoEventoFila.CHEGADA_FILA,
          vendedorId: vendedorAlvoId,
          executadoPorId: user.id,
          posicaoAnterior: null,
          posicaoNova: itemFinal.posicao,
          motivo: vendedorAlvoId === user.id ? 'check_in_proprio' : 'adicionado_recepcao_gestao',
          detalhes:
            vendedorAlvoId === user.id
              ? `${vendedorAlvo.nome} entrou na fila na ${itemFinal.posicao}ª posição.`
              : `${vendedorAlvo.nome} foi incluído na fila por ${user.nome} (${itemFinal.posicao}ª posição).`,
        },
        { client: trx }
      )

      return itemFinal
    })

    if (this.wantsJson(request)) {
      return response.created({ success: true, item: itemCriado })
    }

    session.flash(
      'success',
      `${vendedorAlvo.nome} entrou na fila de atendimento (${itemCriado.posicao}º da fila).`
    )
    return response.redirect().back()
  }

  /**
   * PATCH /atendimentos/fila/:id/status — Alterna disponibilidade do vendedor
   */
  async mudarStatus({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!

    if (!(await this.podeOperar(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_OPERAR_FILA',
          message: 'Você não tem permissão para operar a fila de atendimento.',
        })
      }
      session.flash('error', 'Você não tem permissão para operar a fila de atendimento.')
      return response.redirect().back()
    }

    const item = await AtendimentoFilaVendedor.query()
      .where('id', params.id)
      .preload('vendedor')
      .first()

    if (!item) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Registro da fila não encontrado.' })
      }
      session.flash('error', 'Registro da fila não encontrado.')
      return response.redirect().back()
    }

    const podeGerenciar = await this.podeGerenciarOrdem(user)
    if (item.vendedorId !== user.id && !podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_STATUS_TERCEIRO',
          message: 'Você só pode alterar a sua própria disponibilidade.',
        })
      }
      session.flash('error', 'Você só pode alterar a sua própria disponibilidade.')
      return response.redirect().back()
    }

    if (item.status === StatusDisponibilidadeFila.EM_ATENDIMENTO) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_EM_ATENDIMENTO_ATIVO',
          message: 'Vendedor está em atendimento ativo. Conclua o atendimento antes de alterar a disponibilidade.',
        })
      }
      session.flash(
        'error',
        'Vendedor está em atendimento ativo. Conclua o atendimento antes de alterar a disponibilidade.'
      )
      return response.redirect().back()
    }

    const payload = await request.validateUsing(mudarDisponibilidadeValidator)
    const statusAnterior = item.status

    await db.transaction(async (trx) => {
      item.useTransaction(trx)
      item.status = payload.status
      item.motivoIndisponibilidade =
        payload.status === StatusDisponibilidadeFila.DISPONIVEL
          ? null
          : payload.motivoIndisponibilidade || null
      await item.save()

      await AtendimentoHistoricoEvento.create(
        {
          data: item.data,
          tipoEvento: TipoEventoFila.MUDANCA_STATUS,
          vendedorId: item.vendedorId,
          executadoPorId: user.id,
          posicaoAnterior: item.posicao,
          posicaoNova: item.posicao,
          motivo: payload.status,
          detalhes: `Status de ${item.vendedor?.nome || 'Vendedor'} alterado de "${STATUS_DISPONIBILIDADE_LABELS[statusAnterior] || statusAnterior}" para "${STATUS_DISPONIBILIDADE_LABELS[payload.status] || payload.status}"${payload.motivoIndisponibilidade ? ` (${payload.motivoIndisponibilidade})` : ''}.`,
        },
        { client: trx }
      )
    })

    if (this.wantsJson(request)) {
      return response.ok({ success: true, item })
    }

    session.flash(
      'success',
      `Disponibilidade de ${item.vendedor?.nome || 'vendedor'} atualizada para ${STATUS_DISPONIBILIDADE_LABELS[payload.status] || payload.status}.`
    )
    return response.redirect().back()
  }

  /**
   * PATCH /atendimentos/fila/:id/reordenar — Altera ordem da fila (Recepção, Gerente Comercial, Diretoria)
   */
  async reordenar({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!

    if (!(await this.podeGerenciarOrdem(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_REORDENAR_FILA',
          message: 'Apenas Recepção, Gerência Comercial e Diretoria podem alterar a ordem da fila.',
        })
      }
      session.flash(
        'error',
        'Apenas Recepção, Gerência Comercial e Diretoria podem alterar a ordem da fila.'
      )
      return response.redirect().back()
    }

    const payload = await request.validateUsing(reordenarFilaValidator)
    const item = await AtendimentoFilaVendedor.query()
      .where('id', params.id)
      .preload('vendedor')
      .first()

    if (!item) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Vendedor não encontrado na fila.' })
      }
      session.flash('error', 'Vendedor não encontrado na fila.')
      return response.redirect().back()
    }

    const dataISO = item.data.toISODate() || this.getDataHojeLoja()

    const resultado = await db.transaction(async (trx) => {
      const lista = await AtendimentoFilaVendedor.query({ client: trx })
        .where('data', dataISO)
        .orderBy('posicao', 'asc')
        .orderBy('hora_chegada', 'asc')
        .orderBy('id', 'asc')

      const idxAtual = lista.findIndex((i) => i.id === item.id)
      if (idxAtual === -1) {
        return { alterado: false, posicaoAnterior: item.posicao, posicaoNova: item.posicao }
      }

      let idxDestino = idxAtual
      if (payload.direcao === 'up') {
        idxDestino = Math.max(0, idxAtual - 1)
      } else if (payload.direcao === 'down') {
        idxDestino = Math.min(lista.length - 1, idxAtual + 1)
      } else if (payload.direcao === 'top') {
        idxDestino = 0
      } else if (payload.direcao === 'bottom') {
        idxDestino = lista.length - 1
      } else if (payload.novaPosicao !== undefined) {
        idxDestino = Math.min(lista.length - 1, Math.max(0, payload.novaPosicao - 1))
      }

      const posicaoAnterior = idxAtual + 1
      const posicaoNova = idxDestino + 1

      if (idxDestino === idxAtual) {
        return { alterado: false, posicaoAnterior, posicaoNova }
      }

      const [movido] = lista.splice(idxAtual, 1)
      lista.splice(idxDestino, 0, movido)

      for (let i = 0; i < lista.length; i++) {
        const pos = i + 1
        if (lista[i].posicao !== pos) {
          lista[i].useTransaction(trx)
          lista[i].posicao = pos
          await lista[i].save()
        }
      }

      await AtendimentoHistoricoEvento.create(
        {
          data: item.data,
          tipoEvento: TipoEventoFila.REORDENACAO_MANUAL,
          vendedorId: item.vendedorId,
          executadoPorId: user.id,
          posicaoAnterior,
          posicaoNova,
          motivo: payload.motivo || 'ajuste_manual_ordem',
          detalhes: `Ordem da fila de ${item.vendedor?.nome || 'Vendedor'} alterada de ${posicaoAnterior}º para ${posicaoNova}º por ${user.nome}${payload.motivo ? ` (${payload.motivo})` : ''}.`,
        },
        { client: trx }
      )

      return { alterado: true, posicaoAnterior, posicaoNova }
    })

    if (this.wantsJson(request)) {
      return response.ok({ success: true, ...resultado })
    }

    if (resultado.alterado) {
      session.flash(
        'success',
        `Posição de ${item.vendedor?.nome || 'vendedor'} alterada de ${resultado.posicaoAnterior}º para ${resultado.posicaoNova}º.`
      )
    } else {
      session.flash('info', 'A posição do vendedor na fila não foi alterada.')
    }

    return response.redirect().back()
  }

  /**
   * DELETE /atendimentos/fila/:id — Remove vendedor da fila de hoje
   */
  async removerDaFila({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!

    const item = await AtendimentoFilaVendedor.query()
      .where('id', params.id)
      .preload('vendedor')
      .first()

    if (!item) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Registro não encontrado na fila.' })
      }
      session.flash('error', 'Registro não encontrado na fila.')
      return response.redirect().back()
    }

    const podeGerenciar = await this.podeGerenciarOrdem(user)
    if (item.vendedorId !== user.id && !podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_REMOVER_FILA',
          message: 'Você não tem permissão para remover outro vendedor da fila.',
        })
      }
      session.flash('error', 'Você não tem permissão para remover outro vendedor da fila.')
      return response.redirect().back()
    }

    if (item.status === StatusDisponibilidadeFila.EM_ATENDIMENTO) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_EM_ATENDIMENTO_ATIVO',
          message: 'Não é possível remover da fila enquanto há um atendimento em andamento.',
        })
      }
      session.flash(
        'error',
        'Não é possível remover da fila enquanto há um atendimento em andamento.'
      )
      return response.redirect().back()
    }

    const dataISO = item.data.toISODate() || this.getDataHojeLoja()

    await db.transaction(async (trx) => {
      await AtendimentoHistoricoEvento.create(
        {
          data: item.data,
          tipoEvento: TipoEventoFila.REMOCAO_FILA,
          vendedorId: item.vendedorId,
          executadoPorId: user.id,
          posicaoAnterior: item.posicao,
          posicaoNova: null,
          motivo: item.vendedorId === user.id ? 'saida_propria' : 'removido_recepcao_gestao',
          detalhes: `${item.vendedor?.nome || 'Vendedor'} saiu da fila (estava em ${item.posicao}º lugar).`,
        },
        { client: trx }
      )

      item.useTransaction(trx)
      await item.delete()

      await this.reorganizarPosicoes(trx, dataISO)
    })

    if (this.wantsJson(request)) {
      return response.ok({ success: true })
    }

    session.flash('success', `${item.vendedor?.nome || 'Vendedor'} removido da fila de hoje.`)
    return response.redirect().back()
  }

  /**
   * POST /atendimentos/fila/iniciar-atendimento — Despacha cliente para o vendedor (detectando e auditando pulo de vez)
   */
  async iniciarAtendimento({ request, response, auth, session }: HttpContext) {
    const user = auth.user!

    if (!(await this.podeOperar(user))) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_OPERAR_FILA',
          message: 'Você não tem permissão para iniciar atendimentos na fila.',
        })
      }
      session.flash('error', 'Você não tem permissão para iniciar atendimentos na fila.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(iniciarAtendimentoValidator)
    const vendedorAlvo = await User.find(payload.vendedorId)

    if (!vendedorAlvo || !vendedorAlvo.isActive) {
      if (this.wantsJson(request)) {
        return response.notFound({
          code: 'VENDEDOR_NAO_ENCONTRADO',
          message: 'Vendedor não encontrado ou inativo.',
        })
      }
      session.flash('error', 'Vendedor não encontrado ou inativo.')
      return response.redirect().back()
    }

    let clienteIdFinal: number | null = null
    let leadIdFinal: number | null = null
    let clienteNomeFinal: string | null = payload.clienteNome || null
    let clienteTelefoneFinal: string | null = payload.clienteTelefone || null
    let arquitetoIdFinal: number | null = payload.arquitetoId || null

    if (payload.clienteId) {
      const clienteExistente = await Cliente.query()
        .where('id', payload.clienteId)
        .where('is_active', true)
        .first()

      if (!clienteExistente) {
        if (this.wantsJson(request)) {
          return response.notFound({
            code: 'CLIENTE_NAO_ENCONTRADO',
            message: 'Cliente selecionado não encontrado ou inativo.',
          })
        }
        session.flash('error', 'Cliente selecionado não encontrado ou inativo.')
        return response.redirect().back()
      }

      clienteIdFinal = clienteExistente.id
      clienteNomeFinal = payload.clienteNome?.trim() || clienteExistente.nome
      clienteTelefoneFinal = payload.clienteTelefone?.trim() || clienteExistente.telefone
      arquitetoIdFinal = payload.arquitetoId ?? clienteExistente.arquitetoId ?? null

      const leadDoVendedor = await Lead.query()
        .where('cliente_id', clienteExistente.id)
        .where('vendedor_id', payload.vendedorId)
        .orderBy('created_at', 'desc')
        .first()

      const leadRecente =
        leadDoVendedor ||
        (await Lead.query()
          .where('cliente_id', clienteExistente.id)
          .orderBy('created_at', 'desc')
          .first())

      leadIdFinal = leadRecente?.id || null
    }

    const dataHoje = this.getDataHojeLoja()
    const dataDia = DateTime.fromISO(dataHoje, { zone: 'utc' })

    const filaAtual = await AtendimentoFilaVendedor.query()
      .where('data', dataHoje)
      .orderBy('posicao', 'asc')
      .orderBy('hora_chegada', 'asc')
      .orderBy('id', 'asc')

    const itemExistente = filaAtual.find((f) => f.vendedorId === payload.vendedorId)
    if (itemExistente?.status === StatusDisponibilidadeFila.EM_ATENDIMENTO) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_VENDEDOR_JA_EM_ATENDIMENTO',
          message: `${vendedorAlvo.nome} já está em atendimento ativo. Conclua o atendimento atual primeiro.`,
        })
      }
      session.flash(
        'error',
        `${vendedorAlvo.nome} já está em atendimento ativo. Conclua o atendimento atual primeiro.`
      )
      return response.redirect().back()
    }

    const proximoDaVez =
      filaAtual.find((f) => f.status === StatusDisponibilidadeFila.DISPONIVEL) || null
    const foiPuloDeVez = Boolean(proximoDaVez && proximoDaVez.vendedorId !== payload.vendedorId)
    const vendedorPuladoId = foiPuloDeVez ? proximoDaVez!.vendedorId : null

    if (
      foiPuloDeVez &&
      payload.tipoAtendimento === TipoAtendimentoPorta.PORTA_NOVO &&
      !payload.motivoPulo
    ) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_JUSTIFICATIVA_PULO_OBRIGATORIA',
          message:
            'Para pular o próximo vendedor da fila em um cliente novo de porta, informe obrigatoriamente o motivo do pulo.',
        })
      }
      session.flash(
        'error',
        'Para pular o próximo vendedor da fila em um cliente novo de porta, informe obrigatoriamente o motivo do pulo.'
      )
      return response.redirect().back()
    }

    let motivoPuloFinal: string | null = null
    if (foiPuloDeVez) {
      if (payload.motivoPulo) {
        motivoPuloFinal = payload.motivoPulo
      } else if (payload.tipoAtendimento === TipoAtendimentoPorta.RETORNO_CARTEIRA) {
        motivoPuloFinal = MotivoPuloFila.CLIENTE_PROCUROU_VENDEDOR
      } else if (payload.tipoAtendimento === TipoAtendimentoPorta.INDICACAO_ESPECIFICADOR) {
        motivoPuloFinal = MotivoPuloFila.PARCEIRO_ESPECIFICADOR
      } else {
        motivoPuloFinal = MotivoPuloFila.OUTRO
      }
    }

    const registroCriado = await db.transaction(async (trx) => {
      const agora = DateTime.now().toUTC()

      let itemFila = await AtendimentoFilaVendedor.query({ client: trx })
        .where('data', dataHoje)
        .where('vendedor_id', payload.vendedorId)
        .first()

      if (!itemFila) {
        const existentes = await AtendimentoFilaVendedor.query({ client: trx })
          .where('data', dataHoje)
          .orderBy('posicao', 'desc')
        const pos = existentes.length > 0 ? existentes[0].posicao + 1 : 1

        itemFila = await AtendimentoFilaVendedor.create(
          {
            data: dataDia,
            vendedorId: payload.vendedorId,
            adicionadoPorId: user.id,
            posicao: pos,
            status: StatusDisponibilidadeFila.EM_ATENDIMENTO,
            motivoIndisponibilidade: null,
            horaChegada: agora,
            atendimentosHoje: 0,
          },
          { client: trx }
        )

        await AtendimentoHistoricoEvento.create(
          {
            data: dataDia,
            tipoEvento: TipoEventoFila.CHEGADA_FILA,
            vendedorId: payload.vendedorId,
            executadoPorId: user.id,
            posicaoAnterior: null,
            posicaoNova: pos,
            motivo: 'inclusao_automatica_atendimento',
            detalhes: `${vendedorAlvo.nome} foi incluído automaticamente na fila ao iniciar atendimento.`,
          },
          { client: trx }
        )
      } else {
        itemFila.useTransaction(trx)
        itemFila.status = StatusDisponibilidadeFila.EM_ATENDIMENTO
        itemFila.motivoIndisponibilidade = null
        await itemFila.save()
      }

      if (!clienteIdFinal && clienteNomeFinal && clienteNomeFinal.trim()) {
        const nomeLimpo = clienteNomeFinal.trim()
        let clienteAuto = await Cliente.query({ client: trx })
          .where('isActive', true)
          .where((q) => {
            if (clienteTelefoneFinal) q.where('telefone', clienteTelefoneFinal)
            q.orWhereILike('nome', nomeLimpo)
          })
          .first()

        if (!clienteAuto) {
          clienteAuto = await Cliente.create(
            {
              nome: nomeLimpo,
              telefone: clienteTelefoneFinal || '(00) 00000-0000',
              arquitetoId: arquitetoIdFinal || null,
              tipo: 'pessoa_fisica',
              isActive: true,
              cadastroAprovado: false,
            },
            { client: trx }
          )
        }

        clienteIdFinal = clienteAuto.id
        clienteNomeFinal = clienteAuto.nome
        if (
          !clienteTelefoneFinal &&
          clienteAuto.telefone &&
          clienteAuto.telefone !== '(00) 00000-0000'
        ) {
          clienteTelefoneFinal = clienteAuto.telefone
        }
      }

      const registro = await AtendimentoRegistro.create(
        {
          data: dataDia,
          vendedorId: payload.vendedorId,
          iniciadoPorId: user.id,
          tipoAtendimento: payload.tipoAtendimento,
          clienteId: clienteIdFinal,
          leadId: leadIdFinal,
          clienteNome: clienteNomeFinal,
          clienteTelefone: clienteTelefoneFinal,
          arquitetoId: arquitetoIdFinal,
          foiPuloDeVez,
          vendedorPuladoId,
          motivoPulo: motivoPuloFinal,
          justificativaPulo: payload.justificativaPulo || null,
          status: StatusAtendimentoRegistro.EM_ANDAMENTO,
          observacao: payload.observacao || null,
          iniciadoEm: agora,
        },
        { client: trx }
      )

      await AtendimentoHistoricoEvento.create(
        {
          data: dataDia,
          tipoEvento: TipoEventoFila.INICIO_ATENDIMENTO,
          vendedorId: payload.vendedorId,
          executadoPorId: user.id,
          atendimentoRegistroId: registro.id,
          vendedorPuladoId,
          posicaoAnterior: itemFila.posicao,
          posicaoNova: itemFila.posicao,
          motivo: payload.tipoAtendimento,
          detalhes: `${vendedorAlvo.nome} iniciou atendimento (${TIPO_ATENDIMENTO_LABELS[payload.tipoAtendimento] || payload.tipoAtendimento})${clienteNomeFinal ? ` — Cliente: ${clienteNomeFinal}` : ''}.`,
        },
        { client: trx }
      )

      if (foiPuloDeVez && vendedorPuladoId) {
        const puladoUser = await User.find(vendedorPuladoId, { client: trx })
        await AtendimentoHistoricoEvento.create(
          {
            data: dataDia,
            tipoEvento: TipoEventoFila.PULO_DE_VEZ,
            vendedorId: payload.vendedorId,
            executadoPorId: user.id,
            atendimentoRegistroId: registro.id,
            vendedorPuladoId,
            posicaoAnterior: proximoDaVez?.posicao || null,
            posicaoNova: itemFila.posicao,
            motivo: motivoPuloFinal,
            detalhes: `Pulo de vez: ${puladoUser?.nome || 'Vendedor da vez'} foi pulado para ${vendedorAlvo.nome} (${MOTIVO_PULO_LABELS[motivoPuloFinal!] || motivoPuloFinal})${payload.justificativaPulo ? ` — "${payload.justificativaPulo}"` : ''}.`,
          },
          { client: trx }
        )
      }

      return registro
    })

    if (this.wantsJson(request)) {
      return response.created({ success: true, registro: registroCriado })
    }

    session.flash(
      'success',
      `Atendimento iniciado com ${vendedorAlvo.nome}${foiPuloDeVez ? ' (pulo de vez auditado)' : ''}.`
    )
    return response.redirect().back()
  }

  /**
   * POST /atendimentos/fila/atendimentos/:id/concluir — Conclui atendimento e envia vendedor para o fim da fila
   */
  async concluirAtendimento({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!

    const registro = await AtendimentoRegistro.query()
      .where('id', params.id)
      .preload('vendedor')
      .first()

    if (!registro) {
      if (this.wantsJson(request)) {
        return response.notFound({ message: 'Atendimento não encontrado.' })
      }
      session.flash('error', 'Atendimento não encontrado.')
      return response.redirect().back()
    }

    const podeGerenciar = await this.podeGerenciarOrdem(user)
    if (registro.vendedorId !== user.id && !podeGerenciar) {
      if (this.wantsJson(request)) {
        return response.forbidden({
          code: 'FORBIDDEN_CONCLUIR_ATENDIMENTO',
          message: 'Você não tem permissão para concluir este atendimento.',
        })
      }
      session.flash('error', 'Você não tem permissão para concluir este atendimento.')
      return response.redirect().back()
    }

    if (registro.status !== StatusAtendimentoRegistro.EM_ANDAMENTO) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_ATENDIMENTO_JA_CONCLUIDO',
          message: 'Este atendimento já foi encerrado.',
        })
      }
      session.flash('error', 'Este atendimento já foi encerrado.')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(concluirAtendimentoValidator)
    const nomeClienteFinal = (payload.clienteNome || registro.clienteNome || '').trim()
    const telefoneClienteFinal = (payload.clienteTelefone || registro.clienteTelefone || '').trim()

    if (payload.criarLeadNoCrm && !nomeClienteFinal) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_NOME_CLIENTE_OBRIGATORIO_LEAD',
          message: 'Informe o nome do cliente para gerar o card no CRM.',
        })
      }
      session.flash('error', 'Informe o nome do cliente para gerar o card no CRM.')
      return response.redirect().back()
    }

    const dataRegistroISO = registro.data.toISODate() || this.getDataHojeLoja()

    const resultado = await db.transaction(async (trx) => {
      const agora = DateTime.now().toUTC()
      const duracaoMinutos = registro.iniciadoEm
        ? Math.max(1, Math.round(agora.diff(registro.iniciadoEm, 'minutes').minutes))
        : 1

      registro.useTransaction(trx)
      registro.status = StatusAtendimentoRegistro.CONCLUIDO
      registro.desfecho = payload.desfecho
      registro.observacao = payload.observacao ?? registro.observacao
      registro.concluidoEm = agora
      registro.duracaoMinutos = duracaoMinutos
      if (nomeClienteFinal) registro.clienteNome = nomeClienteFinal
      if (telefoneClienteFinal) registro.clienteTelefone = telefoneClienteFinal

      if (payload.criarLeadNoCrm && nomeClienteFinal) {
        const telefoneUso = telefoneClienteFinal || '(00) 00000-0000'
        let cliente = registro.clienteId
          ? await Cliente.find(registro.clienteId, { client: trx })
          : null

        if (!cliente) {
          cliente = await Cliente.query({ client: trx })
            .where('isActive', true)
            .where((q) => {
              if (telefoneClienteFinal) q.where('telefone', telefoneClienteFinal)
              q.orWhereILike('nome', nomeClienteFinal)
            })
            .first()
        }

        if (!cliente) {
          cliente = await Cliente.create(
            {
              nome: nomeClienteFinal,
              telefone: telefoneUso,
              arquitetoId: registro.arquitetoId || null,
              tipo: 'pessoa_fisica',
              isActive: true,
              cadastroAprovado: false,
            },
            { client: trx }
          )
        }

        const lead = await Lead.create(
          {
            nome: nomeClienteFinal,
            telefone: telefoneUso,
            origem: registro.arquitetoId ? OrigemLead.ARQUITETO : OrigemLead.SHOWROOM,
            vendedorId: registro.vendedorId,
            arquitetoId: registro.arquitetoId || null,
            possuiArquiteto: Boolean(registro.arquitetoId),
            clienteId: cliente.id,
            statusFunil: StatusFunil.NOVO_LEAD,
            qualificado: false,
            statusAlteradoEm: agora,
          },
          { client: trx }
        )

        await HistoricoStatusLead.create(
          {
            leadId: lead.id,
            alteradoPorId: user.id,
            statusDe: null,
            statusPara: StatusFunil.NOVO_LEAD,
            tempoPermanenciaSegundos: null,
            observacao: 'Lead originado pela Fila de Atendimento da Recepção.',
          },
          { client: trx }
        )

        registro.leadId = lead.id
        registro.clienteId = cliente.id
      }

      await registro.save()

      // Regra validada: após concluir QUALQUER atendimento, o vendedor sempre vai ao final da fila
      const lista = await AtendimentoFilaVendedor.query({ client: trx })
        .where('data', dataRegistroISO)
        .orderBy('posicao', 'asc')
        .orderBy('hora_chegada', 'asc')
        .orderBy('id', 'asc')

      const idxVendedor = lista.findIndex((i) => i.vendedorId === registro.vendedorId)
      let posicaoAnterior: number | null = null
      let posicaoNova = 1

      if (idxVendedor !== -1) {
        const [itemVendedor] = lista.splice(idxVendedor, 1)
        posicaoAnterior = itemVendedor.posicao
        lista.push(itemVendedor)

        for (let i = 0; i < lista.length; i++) {
          const pos = i + 1
          const item = lista[i]
          item.useTransaction(trx)
          item.posicao = pos

          if (item.id === itemVendedor.id) {
            item.status = StatusDisponibilidadeFila.DISPONIVEL
            item.motivoIndisponibilidade = null
            item.atendimentosHoje = (item.atendimentosHoje || 0) + 1
            item.ultimoAtendimentoEm = agora
          }

          await item.save()
        }

        posicaoNova = lista.length
      } else {
        const novaPos = lista.length + 1
        await AtendimentoFilaVendedor.create(
          {
            data: registro.data,
            vendedorId: registro.vendedorId,
            adicionadoPorId: user.id,
            posicao: novaPos,
            status: StatusDisponibilidadeFila.DISPONIVEL,
            motivoIndisponibilidade: null,
            horaChegada: agora,
            ultimoAtendimentoEm: agora,
            atendimentosHoje: 1,
          },
          { client: trx }
        )
        posicaoNova = novaPos
      }

      await AtendimentoHistoricoEvento.create(
        {
          data: registro.data,
          tipoEvento: TipoEventoFila.CONCLUSAO_ATENDIMENTO,
          vendedorId: registro.vendedorId,
          executadoPorId: user.id,
          atendimentoRegistroId: registro.id,
          posicaoAnterior,
          posicaoNova,
          motivo: payload.desfecho,
          detalhes: `Atendimento de ${registro.vendedor?.nome || 'Vendedor'} concluído (${DESFECHO_ATENDIMENTO_LABELS[payload.desfecho] || payload.desfecho}). Enviado para o final da fila (${posicaoNova}º lugar).`,
        },
        { client: trx }
      )

      return { registro, posicaoNova }
    })

    if (this.wantsJson(request)) {
      return response.ok({
        success: true,
        registro: resultado.registro,
        novaPosicao: resultado.posicaoNova,
      })
    }

    session.flash(
      'success',
      `Atendimento concluído! ${registro.vendedor?.nome || 'Vendedor'} foi movido para o final da fila (${resultado.posicaoNova}º lugar).`
    )
    return response.redirect().back()
  }
}
