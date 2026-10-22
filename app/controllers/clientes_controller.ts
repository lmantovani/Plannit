import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Cliente from '#models/cliente'
import EnderecoCliente from '#models/endereco_cliente'
import ProntuarioCliente from '#models/prontuario_cliente'
import CategoriaProntuarioCatalogo from '#models/categoria_prontuario_catalogo'
import Arquiteto from '#models/arquiteto'
import Lead, { OrigemLead, StatusFunil } from '#models/lead'
import Projeto, { STATUS_PROJETO_LABELS, type StatusProjeto } from '#models/projeto'
import HistoricoStatusLead from '#models/historico_status_lead'
import { PerfilUsuario } from '#models/user'
import {
  createClienteValidator,
  updateClienteValidator,
  createEnderecoValidator,
} from '#validators/cliente'
import { criarProntuarioValidator } from '#validators/prontuario'

export default class ClientesController {
  /**
   * Listagem de clientes com filtros, busca e KPIs
   */
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 15)
    const busca = request.input('busca', '')
    const tipo = request.input('tipo', '')
    const statusAprovacao = request.input('status_aprovacao', '')
    const arquitetoId = request.input('arquiteto_id', '')

    const query = Cliente.query()
      .where('isActive', true)
      .preload('enderecos')
      .preload('arquiteto')
      .preload('aprovadoPor')
      .withCount('projetos', (q) => q.where('arquivado', false).as('totalProjetos'))
      .orderBy('nome', 'asc')

    if (busca) {
      query.where((builder) => {
        builder
          .whereILike('nome', `%${busca}%`)
          .orWhereILike('cpfCnpj', `%${busca}%`)
          .orWhereILike('email', `%${busca}%`)
          .orWhereILike('telefone', `%${busca}%`)
      })
    }

    if (tipo) {
      query.where('tipo', tipo)
    }

    if (statusAprovacao === 'aprovado') {
      query.where('cadastroAprovado', true)
    } else if (statusAprovacao === 'pendente') {
      query.where('cadastroAprovado', false)
    }

    if (arquitetoId) {
      query.where('arquitetoId', arquitetoId)
    }

    const clientes = await query.paginate(page, limit)

    // KPIs para os cards de topo
    const [totalGeral, totalAprovados, totalPendentes, totalPJ] = await Promise.all([
      Cliente.query().where('isActive', true).count('* as total'),
      Cliente.query().where('isActive', true).where('cadastroAprovado', true).count('* as total'),
      Cliente.query().where('isActive', true).where('cadastroAprovado', false).count('* as total'),
      Cliente.query().where('isActive', true).where('tipo', 'pessoa_juridica').count('* as total'),
    ])

    const kpis = {
      totalClientes: Number(totalGeral[0].$extras.total || 0),
      aprovados: Number(totalAprovados[0].$extras.total || 0),
      pendentesAprovacao: Number(totalPendentes[0].$extras.total || 0),
      pessoaJuridica: Number(totalPJ[0].$extras.total || 0),
    }

    // Lista de arquitetos para o select de indicação
    const arquitetos = await Arquiteto.query().where('isActive', true).orderBy('nome', 'asc')

    return inertia.render('clientes/index', {
      clientes: clientes.serialize(),
      kpis,
      arquitetos: arquitetos.map((a) => ({ id: a.id, nome: a.nome, escritorio: a.escritorio })),
      filtros: { busca, tipo, status_aprovacao: statusAprovacao, arquiteto_id: arquitetoId },
    })
  }

  /**
   * Cadastro de novo cliente (com endereço principal opcional)
   */
  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createClienteValidator)

    // Validar CPF/CNPJ único se informado
    if (payload.cpfCnpj) {
      const existente = await Cliente.query().where('cpfCnpj', payload.cpfCnpj).first()
      if (existente) {
        session.flash('errors', { cpfCnpj: 'CPF/CNPJ já cadastrado para outro cliente' })
        return response.redirect().back()
      }
    }

    const { endereco, ...dadosCliente } = payload

    const cliente = await Cliente.create(dadosCliente)

    // Se informou dados de endereço na criação, grava como endereço principal
    if (endereco && endereco.logradouro) {
      await EnderecoCliente.create({
        clienteId: cliente.id,
        tipo: endereco.tipo || 'montagem',
        identificacao: endereco.identificacao || 'Principal',
        cep: endereco.cep || null,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento || null,
        bairro: endereco.bairro || null,
        cidade: endereco.cidade,
        estado: endereco.estado || 'SP',
        pontoReferencia: endereco.pontoReferencia || null,
        isPrincipal: true,
      })
    }

    session.flash('success', `Cliente ${cliente.nome} cadastrado com sucesso!`)
    return response.redirect().toRoute('clientes.show', { id: cliente.id })
  }

  /**
   * Exibição da ficha completa do cliente com histórico de projetos/briefings e endereços
   */
  async show({ params, response, inertia }: HttpContext) {
    const cliente = await Cliente.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('enderecos', (q) => q.orderBy('isPrincipal', 'desc').orderBy('id', 'asc'))
      .preload('arquiteto')
      .preload('aprovadoPor')
      .preload('prontuarios', (q) => {
        q.preload('autor').orderBy('importante', 'desc').orderBy('createdAt', 'desc')
      })
      .preload('projetos', (q) => {
        q.where('arquivado', false)
          .preload('vendedor')
          .preload('projetista')
          .preload('briefing')
          .orderBy('createdAt', 'desc')
      })
      .first()

    if (!cliente) {
      return response.redirect().toRoute('clientes.index')
    }

    // Calcular resumo financeiro/compras diferenciando Briefings/Negociação de Projetos Contratados
    const projetosSerializados = cliente.projetos.map((p) => {
      return {
        id: p.id,
        codigo: p.codigo,
        status: p.status,
        statusLabel: STATUS_PROJETO_LABELS[p.status as StatusProjeto] || p.status,
        valorContrato: p.valorContrato ? Number(p.valorContrato) : 0,
        prazoEntregaEstimado: p.prazoEntregaEstimado?.toISODate() || null,
        vendedorNome: p.vendedor?.nome || 'Não atribuído',
        projetistaNome: p.projetista?.nome || 'Aguardando',
        createdAt: p.createdAt.toISO(),
        briefingId: p.briefing ? p.briefing.id : null,
        statusBriefing: p.briefing ? p.briefing.status : null,
        ambientesBriefing:
          p.briefing && Array.isArray(p.briefing.ambientes) ? p.briefing.ambientes : [],
        scoreBriefing: p.briefing ? Number(p.briefing.score) : null,
        leadId: p.leadId || null,
      }
    })

    const valorTotalComprado = projetosSerializados.reduce((acc, p) => acc + p.valorContrato, 0)
    const projetosContratados = projetosSerializados.filter((p) => p.valorContrato > 0).length
    const projetosEmBriefing = projetosSerializados.filter(
      (p) => p.valorContrato === 0 && p.status !== 'cancelado'
    ).length

    const prontuariosSerializados = (cliente.prontuarios || []).map((pr) => ({
      id: pr.id,
      categoria: pr.categoria,
      titulo: pr.titulo,
      descricao: pr.descricao,
      importante: pr.importante,
      autorNome: pr.autor?.nome || 'Sistema',
      leadId: pr.leadId,
      createdAt: pr.createdAt.toISO(),
    }))

    const arquitetos = await Arquiteto.query().where('isActive', true).orderBy('nome', 'asc')

    const categoriasProntuario = await CategoriaProntuarioCatalogo.query().withScopes((scopes) => {
      scopes.ativos()
      scopes.ordenados()
    })

    return inertia.render('clientes/show', {
      cliente: {
        ...cliente.serialize(),
        projetos: projetosSerializados,
        prontuarios: prontuariosSerializados,
        resumoCompras: {
          totalProjetos: projetosSerializados.length,
          projetosContratados,
          projetosEmBriefing,
          valorTotalComprado,
          projetosAtivos: projetosSerializados.filter(
            (p) => p.status !== 'concluido' && p.status !== 'cancelado'
          ).length,
        },
      },
      arquitetos: arquitetos.map((a) => ({ id: a.id, nome: a.nome, escritorio: a.escritorio })),
      categoriasProntuarioCatalogo: categoriasProntuario.map((cp) => ({
        id: cp.id,
        nome: cp.nome,
        slug: cp.slug,
        cor: cp.cor,
        icone: cp.icone,
        ordem: cp.ordem,
      })),
    })
  }

  /**
   * Atualização cadastral do cliente
   */
  async update({ params, request, response, session }: HttpContext) {
    const cliente = await Cliente.find(params.id)
    if (!cliente) {
      session.flash('error', 'Cliente não encontrado')
      return response.redirect().toRoute('clientes.index')
    }

    const payload = await request.validateUsing(updateClienteValidator)

    if (payload.cpfCnpj && payload.cpfCnpj !== cliente.cpfCnpj) {
      const existente = await Cliente.query()
        .where('cpfCnpj', payload.cpfCnpj)
        .whereNot('id', cliente.id)
        .first()
      if (existente) {
        session.flash('errors', { cpfCnpj: 'CPF/CNPJ já cadastrado para outro cliente' })
        return response.redirect().back()
      }
    }

    cliente.merge(payload)
    await cliente.save()

    session.flash('success', 'Dados do cliente atualizados com sucesso!')
    return response.redirect().back()
  }

  /**
   * Aprovação financeira do cadastro (desbloqueia geração de projetos)
   */
  async aprovarCadastro({ params, auth, response, session }: HttpContext) {
    const user = auth.user!

    const perfisAutorizados: string[] = [
      PerfilUsuario.DIRETORIA,
      PerfilUsuario.GERENTE_COMERCIAL,
      PerfilUsuario.FINANCEIRO,
    ]

    if (!perfisAutorizados.includes(user.perfil)) {
      session.flash('error', 'Apenas a Diretoria, Gerência Comercial ou Financeiro podem aprovar o cadastro.')
      return response.redirect().back()
    }

    const cliente = await Cliente.find(params.id)
    if (!cliente) {
      session.flash('error', 'Cliente não encontrado')
      return response.redirect().back()
    }

    if (cliente.cadastroAprovado) {
      session.flash('info', 'O cadastro deste cliente já está aprovado.')
      return response.redirect().back()
    }

    cliente.cadastroAprovado = true
    cliente.cadastroAprovadoPor = user.id
    cliente.cadastroAprovadoEm = DateTime.now()
    await cliente.save()

    session.flash('success', `Cadastro do cliente ${cliente.nome} aprovado com sucesso!`)
    return response.redirect().back()
  }

  /**
   * Adiciona um novo endereço (entrega, montagem, cobrança) ao cliente
   */
  async adicionarEndereco({ params, request, response, session }: HttpContext) {
    const cliente = await Cliente.find(params.id)
    if (!cliente) {
      session.flash('error', 'Cliente não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(createEnderecoValidator)

    // Se for marcado como principal, desmarca os anteriores
    if (payload.isPrincipal) {
      await EnderecoCliente.query().where('clienteId', cliente.id).update({ isPrincipal: false })
    }

    await EnderecoCliente.create({
      clienteId: cliente.id,
      ...payload,
      isPrincipal: payload.isPrincipal ?? false,
    })

    session.flash('success', 'Novo endereço adicionado com sucesso!')
    return response.redirect().back()
  }

  /**
   * Exclui um endereço do cliente
   */
  async removerEndereco({ params, response, session }: HttpContext) {
    const endereco = await EnderecoCliente.find(params.enderecoId)
    if (!endereco) {
      session.flash('error', 'Endereço não encontrado')
      return response.redirect().back()
    }

    await endereco.delete()
    session.flash('success', 'Endereço removido com sucesso!')
    return response.redirect().back()
  }

  /**
   * Converte um lead qualificado do CRM em cliente
   */
  async converterLead({ params, request, auth, response, session }: HttpContext) {
    const lead = await Lead.find(params.leadId)
    if (!lead) {
      session.flash('error', 'Lead não encontrado')
      if (request.header('accept')?.includes('application/json')) {
        return response.notFound({ message: 'Lead não encontrado' })
      }
      return response.redirect().back()
    }

    // RN001 / R5: Rejeitar lead não qualificado com HTTP 400
    if (!lead.qualificado) {
      session.flash('error', 'RN001: Lead não pode ser convertido sem qualificação registrada')
      return response.badRequest({
        message: 'RN001: Lead não pode ser convertido sem qualificação registrada',
        code: 'RN001_LEAD_NAO_QUALIFICADO',
      })
    }

    const payload = await request.validateUsing(createClienteValidator)

    const { endereco, ...dadosCliente } = payload

    let cliente: Cliente
    await db.transaction(async (trx) => {
      const clienteExistente = lead.clienteId
        ? await Cliente.find(lead.clienteId, { client: trx })
        : null

      if (clienteExistente) {
        clienteExistente.useTransaction(trx)
        clienteExistente.merge({
          ...dadosCliente,
          arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId || clienteExistente.arquitetoId,
        })
        await clienteExistente.save()
        cliente = clienteExistente
      } else {
        cliente = await Cliente.create(
          {
            ...dadosCliente,
            arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId,
          },
          { client: trx }
        )
      }

      if (endereco && endereco.logradouro) {
        await EnderecoCliente.create(
          {
            clienteId: cliente.id,
            ...endereco,
            isPrincipal: true,
          },
          { client: trx }
        )
      }

      // R2: Atualiza todos os projetos associados àquele lead vinculando o novo clienteId
      await Projeto.query({ client: trx })
        .where('lead_id', lead.id)
        .update({ cliente_id: cliente.id })

      // Atualiza o Lead no funil
      lead.useTransaction(trx)
      lead.convertidoEmCliente = true
      lead.clienteId = cliente.id
      
      const statusAnterior = lead.statusFunil
      lead.statusFunil = 'fechado'

      const refDate = lead.statusAlteradoEm || lead.createdAt
      const tempoPermanencia = refDate ? Math.max(0, Math.floor(DateTime.now().diff(refDate, 'seconds').seconds)) : 0

      await HistoricoStatusLead.create(
        {
          leadId: lead.id,
          alteradoPorId: auth.user!.id,
          statusDe: statusAnterior,
          statusPara: lead.statusFunil,
          tempoPermanenciaSegundos: tempoPermanencia,
        },
        { client: trx }
      )

      lead.statusAlteradoEm = DateTime.now()
      await lead.save()
    })

    session.flash('success', `Lead ${lead.nome} convertido com sucesso em Cliente!`)
    if (request.header('accept')?.includes('application/json')) {
      return response.status(201).json({
        message: `Lead ${lead.nome} convertido com sucesso em Cliente!`,
        cliente: cliente!,
      })
    }
    return response.redirect().toRoute('clientes.show', { id: cliente!.id })
  }

  /**
   * Cria um novo Card no Kanban do CRM (nova oportunidade/projeto) para um Cliente já cadastrado,
   * permitindo que o mesmo cliente tenha múltiplos projetos independentes no CRM (1 card por projeto).
   */
  async criarNovoProjetoCrm({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const cliente = await Cliente.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('enderecos', (q) => q.orderBy('isPrincipal', 'desc').orderBy('id', 'asc'))
      .first()

    if (!cliente) {
      session.flash('error', 'Cliente não encontrado.')
      return response.redirect().back()
    }

    const enderecoPrincipal = cliente.enderecos?.[0] || null

    const novoLead = await Lead.create({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || null,
      cidade: enderecoPrincipal?.cidade || null,
      estado: enderecoPrincipal?.estado || null,
      origem: cliente.arquitetoId ? OrigemLead.ARQUITETO : OrigemLead.SHOWROOM,
      vendedorId: user.perfil === PerfilUsuario.VENDEDOR ? user.id : null,
      arquitetoId: cliente.arquitetoId || null,
      possuiArquiteto: Boolean(cliente.arquitetoId),
      clienteId: cliente.id,
      statusFunil: StatusFunil.NOVO_LEAD,
      statusAlteradoEm: DateTime.now(),
      qualificado: false,
      convertidoEmCliente: false,
    })

    await HistoricoStatusLead.create({
      leadId: novoLead.id,
      alteradoPorId: user.id,
      statusDe: null,
      statusPara: StatusFunil.NOVO_LEAD,
      observacao: `Novo projeto/oportunidade aberto a partir da Ficha do Cliente #${cliente.id}`,
    })

    session.flash(
      'success',
      `Novo card de projeto criado no CRM para "${cliente.nome}"! Qualifique os ambientes deste novo projeto para iniciar seu briefing.`
    )
    return response.redirect().toRoute('crm.index')
  }

  /**
   * Registra uma anotação no Prontuário de Relacionamento do Cliente
   */
  async salvarProntuario({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const cliente = await Cliente.findOrFail(params.id)
    const payload = await request.validateUsing(criarProntuarioValidator)

    await ProntuarioCliente.create({
      clienteId: cliente.id,
      autorId: user.id,
      categoria: payload.categoria || 'pessoal',
      titulo: payload.titulo || null,
      descricao: payload.descricao,
      importante: Boolean(payload.importante),
    })

    session.flash('success', 'Anotação adicionada ao Prontuário do Cliente com sucesso!')
    return response.redirect().back()
  }

  /**
   * Exclui uma anotação do Prontuário de Relacionamento do Cliente
   */
  async excluirProntuario({ params, response, session }: HttpContext) {
    const prontuario = await ProntuarioCliente.findOrFail(params.prontuarioId)
    await prontuario.delete()

    session.flash('success', 'Anotação removida do prontuário com sucesso!')
    return response.redirect().back()
  }
}