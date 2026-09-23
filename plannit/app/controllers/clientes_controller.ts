import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Cliente from '#models/cliente'
import EnderecoCliente from '#models/endereco_cliente'
import Arquiteto from '#models/arquiteto'
import Lead from '#models/lead'
import Projeto from '#models/projeto'
import { PerfilUsuario } from '#models/user'
import {
  createClienteValidator,
  updateClienteValidator,
  createEnderecoValidator,
} from '#validators/cliente'

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
      .withCount('projetos', (q) => q.as('totalProjetos'))
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
   * Exibição da ficha completa do cliente com histórico de projetos/compras e endereços
   */
  async show({ params, response, inertia }: HttpContext) {
    const cliente = await Cliente.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('enderecos', (q) => q.orderBy('isPrincipal', 'desc').orderBy('id', 'asc'))
      .preload('arquiteto')
      .preload('aprovadoPor')
      .preload('projetos', (q) => {
        q.preload('vendedor')
          .preload('projetista')
          .preload('briefing')
          .orderBy('createdAt', 'desc')
      })
      .first()

    if (!cliente) {
      return response.redirect().toRoute('clientes.index')
    }

    // Calcular resumo financeiro/compras
    const projetosSerializados = cliente.projetos.map((p) => {
      return {
        id: p.id,
        codigo: p.codigo,
        status: p.status,
        valorContrato: p.valorContrato ? Number(p.valorContrato) : 0,
        prazoEntregaEstimado: p.prazoEntregaEstimado?.toISODate() || null,
        vendedorNome: p.vendedor?.nome || 'Não atribuído',
        projetistaNome: p.projetista?.nome || 'Aguardando',
        createdAt: p.createdAt.toISO(),
        scoreBriefing: p.briefing ? Number(p.briefing.score) : null,
      }
    })

    const valorTotalComprado = projetosSerializados.reduce((acc, p) => acc + p.valorContrato, 0)

    const arquitetos = await Arquiteto.query().where('isActive', true).orderBy('nome', 'asc')

    return inertia.render('clientes/show', {
      cliente: {
        ...cliente.serialize(),
        projetos: projetosSerializados,
        resumoCompras: {
          totalProjetos: projetosSerializados.length,
          valorTotalComprado,
          projetosAtivos: projetosSerializados.filter((p) => p.status !== 'concluido' && p.status !== 'cancelado').length,
        },
      },
      arquitetos: arquitetos.map((a) => ({ id: a.id, nome: a.nome, escritorio: a.escritorio })),
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
  async converterLead({ params, request, response, session }: HttpContext) {
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
      cliente = await Cliente.create(
        {
          ...dadosCliente,
          arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId,
        },
        { client: trx }
      )

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
      lead.statusFunil = 'fechado'
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
}