import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Cliente from '#models/cliente'
import EnderecoCliente from '#models/endereco_cliente'
import Arquiteto from '#models/arquiteto'
import Projeto from '#models/projeto'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Buscar arquiteto e usuário diretoria para aprovação
    const arquiteto = await Arquiteto.first()
    const diretor = await User.query().where('perfil', 'diretoria').first()

    // 1. Cliente PF: Roberto Albuquerque (Aprovado, 2 endereços, com projetos)
    const c1 = await Cliente.updateOrCreate(
      { cpfCnpj: '123.456.789-01' },
      {
        nome: 'Roberto Albuquerque',
        cpfCnpj: '123.456.789-01',
        telefone: '(11) 98765-4321',
        email: 'roberto.albuquerque@gmail.com',
        tipo: 'pessoa_fisica',
        rgIe: '12.345.678-9',
        profissaoRamo: 'Empresário',
        observacoes: 'Cliente prioritário, prefere acabamentos amadeirados e iluminação embutida.',
        arquitetoId: arquiteto?.id || null,
        cadastroAprovado: true,
        cadastroAprovadoPor: diretor?.id || null,
        cadastroAprovadoEm: DateTime.now().minus({ days: 20 }),
        isActive: true,
      }
    )

    await EnderecoCliente.updateOrCreate(
      { clienteId: c1.id, identificacao: 'Residência Principal' },
      {
        clienteId: c1.id,
        tipo: 'montagem',
        identificacao: 'Residência Principal',
        cep: '01415-000',
        logradouro: 'Alameda Lorena',
        numero: '1250',
        complemento: 'Apto 142',
        bairro: 'Jardins',
        cidade: 'São Paulo',
        estado: 'SP',
        pontoReferencia: 'Próximo à Rua Augusta',
        isPrincipal: true,
      }
    )

    await EnderecoCliente.updateOrCreate(
      { clienteId: c1.id, identificacao: 'Casa de Veraneio' },
      {
        clienteId: c1.id,
        tipo: 'montagem',
        identificacao: 'Casa de Veraneio',
        cep: '11600-000',
        logradouro: 'Avenida Beira Mar',
        numero: '450',
        complemento: 'Condomínio Villas do Sol, Casa 8',
        bairro: 'Maresias',
        cidade: 'São Sebastião',
        estado: 'SP',
        pontoReferencia: 'Entrada 15',
        isPrincipal: false,
      }
    )

    // 2. Cliente PJ: Consultoria Alfa Investimentos (Aprovado, Comercial)
    const c2 = await Cliente.updateOrCreate(
      { cpfCnpj: '12.345.678/0001-90' },
      {
        nome: 'Alfa Investimentos Ltda',
        cpfCnpj: '12.345.678/0001-90',
        telefone: '(11) 3214-8800',
        email: 'financeiro@alfainvest.com.br',
        tipo: 'pessoa_juridica',
        rgIe: '112.334.556.778',
        profissaoRamo: 'Mercado Financeiro / Gestão de Recursos',
        observacoes: 'Mobiliário corporativo executivo, salas de reunião de alta confidencialidade.',
        arquitetoId: arquiteto?.id || null,
        cadastroAprovado: true,
        cadastroAprovadoPor: diretor?.id || null,
        cadastroAprovadoEm: DateTime.now().minus({ days: 10 }),
        isActive: true,
      }
    )

    await EnderecoCliente.updateOrCreate(
      { clienteId: c2.id, identificacao: 'Sede Corporativa' },
      {
        clienteId: c2.id,
        tipo: 'montagem',
        identificacao: 'Sede Corporativa',
        cep: '04543-000',
        logradouro: 'Avenida Brigadeiro Faria Lima',
        numero: '3477',
        complemento: '12º Andar, Torre Sul',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        estado: 'SP',
        pontoReferencia: 'Próximo ao Shopping JK Iguatemi',
        isPrincipal: true,
      }
    )

    await EnderecoCliente.updateOrCreate(
      { clienteId: c2.id, identificacao: 'Faturamento / Cobrança' },
      {
        clienteId: c2.id,
        tipo: 'cobranca',
        identificacao: 'Faturamento / Cobrança',
        cep: '04543-000',
        logradouro: 'Avenida Brigadeiro Faria Lima',
        numero: '3477',
        complemento: 'Sala 1205',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        estado: 'SP',
        isPrincipal: false,
      }
    )

    // 3. Cliente PF: Dra. Camila Siqueira (Pendente de Aprovação Financeira)
    const c3 = await Cliente.updateOrCreate(
      { cpfCnpj: '987.654.321-99' },
      {
        nome: 'Dra. Camila Siqueira',
        cpfCnpj: '987.654.321-99',
        telefone: '(11) 97123-5544',
        email: 'camila.siqueira.med@uol.com.br',
        tipo: 'pessoa_fisica',
        profissaoRamo: 'Médica Cirurgiã',
        observacoes: 'Aguardando documentação comprobatória de renda para aprovação de contrato.',
        cadastroAprovado: false,
        isActive: true,
      }
    )

    await EnderecoCliente.updateOrCreate(
      { clienteId: c3.id, identificacao: 'Consultório Particular' },
      {
        clienteId: c3.id,
        tipo: 'montagem',
        identificacao: 'Consultório Particular',
        cep: '04037-003',
        logradouro: 'Rua Domingos de Morais',
        numero: '2187',
        complemento: 'Conjunto 81',
        bairro: 'Vila Mariana',
        cidade: 'São Paulo',
        estado: 'SP',
        isPrincipal: true,
      }
    )

    // 4. Vincular projetos existentes aos clientes criados para histórico de compras
    const projetosExistentes = await Projeto.query().orderBy('id', 'asc')
    if (projetosExistentes.length > 0) {
      // Primeiro projeto vinculado ao Roberto
      projetosExistentes[0].clienteId = c1.id
      projetosExistentes[0].clienteNome = c1.nome
      await projetosExistentes[0].save()

      if (projetosExistentes.length > 1) {
        // Segundo projeto vinculado à Alfa Investimentos
        projetosExistentes[1].clienteId = c2.id
        projetosExistentes[1].clienteNome = c2.nome
        await projetosExistentes[1].save()
      }

      if (projetosExistentes.length > 2) {
        // Terceiro projeto também vinculado ao Roberto (reincidência de compra)
        projetosExistentes[2].clienteId = c1.id
        projetosExistentes[2].clienteNome = c1.nome
        await projetosExistentes[2].save()
      }
    }
  }
}