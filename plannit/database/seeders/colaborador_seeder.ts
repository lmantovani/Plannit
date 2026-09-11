import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Departamento from '#models/departamento'
import Cargo from '#models/cargo'
import Colaborador, { RegimeContratacao, ModalidadeTrabalho, PerfilDISC } from '#models/colaborador'
import HistoricoSalarialColaborador from '#models/historico_salarial_colaborador'
import HistoricoCargoColaborador from '#models/historico_cargo_colaborador'
import User from '#models/user'

export default class ColaboradorSeeder extends BaseSeeder {
  async run() {
    console.log('[Seeder] Povoando Departamentos e Cargos...')

    // 1. Departamentos
    const deptosData = [
      { nome: 'Diretoria & Gestão Executiva' },
      { nome: 'Recursos Humanos & D.P.' },
      { nome: 'Comercial & Vendas' },
      { nome: 'Projetos & Design de Interiores' },
      { nome: 'Engenharia & PCP' },
      { nome: 'Produção & Fábrica' },
      { nome: 'Montagem & Logística' },
    ]

    const deptosMap: Record<string, Departamento> = {}
    for (const d of deptosData) {
      deptosMap[d.nome] = await Departamento.firstOrCreate({ nome: d.nome }, { ativo: true })
    }

    // 2. Cargos
    const cargosData = [
      { nome: 'Diretor Geral', depto: 'Diretoria & Gestão Executiva' },
      { nome: 'Gerente de RH', depto: 'Recursos Humanos & D.P.' },
      { nome: 'Analista de RH Pleno', depto: 'Recursos Humanos & D.P.' },
      { nome: 'Gerente Comercial', depto: 'Comercial & Vendas' },
      { nome: 'Consultor de Vendas Sênior', depto: 'Comercial & Vendas' },
      { nome: 'Consultor Comercial Externo (PJ)', depto: 'Comercial & Vendas' },
      { nome: 'Projetista Líder', depto: 'Projetos & Design de Interiores' },
      { nome: 'Projetista Sênior', depto: 'Projetos & Design de Interiores' },
      { nome: 'Projetista Júnior', depto: 'Projetos & Design de Interiores' },
      { nome: 'Engenheiro de Produto', depto: 'Engenharia & PCP' },
      { nome: 'Marceneiro Mestre', depto: 'Produção & Fábrica' },
      { nome: 'Operador de CNC', depto: 'Produção & Fábrica' },
      { nome: 'Montador Especialista', depto: 'Montagem & Logística' },
    ]

    const cargosMap: Record<string, Cargo> = {}
    for (const c of cargosData) {
      cargosMap[c.nome] = await Cargo.firstOrCreate(
        { nome: c.nome },
        { departamentoId: deptosMap[c.depto].id, ativo: true }
      )
    }

    // Usuário admin para assinar aprovações
    const adminUser = await User.query().first()
    const adminId = adminUser ? adminUser.id : 1

    console.log('[Seeder] Povoando Colaboradores e Históricos Iniciais...')

    // 3. Colaboradores
    // Gestora de RH
    const gestorRh = await Colaborador.firstOrCreate(
      { cpf: '111.222.333-44' },
      {
        nome: 'Carlos Eduardo Siqueira',
        cpf: '111.222.333-44',
        rg: '22.334.455-6',
        emailCorporativo: 'carlos.rh@lidermoveis.com.br',
        telefoneCorporativo: '(11) 98888-1111',
        cargoId: cargosMap['Gerente de RH'].id,
        departamentoId: deptosMap['Recursos Humanos & D.P.'].id,
        regime: RegimeContratacao.CLT,
        modalidade: ModalidadeTrabalho.PRESENCIAL,
        dataAdmissao: DateTime.fromISO('2023-01-15'),
        salarioClt: '12500.00',
        remuneracaoComplementar: '2000.00',
        dataVigenciaSalario: DateTime.fromISO('2024-01-15'),
        perfilDiscPrimario: PerfilDISC.ESTAVEL,
        perfilDiscSecundario: PerfilDISC.INFLUENTE,
        observacoesComportamentais: 'Excelente gestão de pessoas, liderança acolhedora e foco em desenvolvimento da equipe.',
        isActive: true,
      }
    )

    // Analista de RH (Subordinada de Carlos)
    await Colaborador.firstOrCreate(
      { cpf: '222.333.444-55' },
      {
        nome: 'Juliana Bastos',
        cpf: '222.333.444-55',
        rg: '33.445.566-7',
        emailCorporativo: 'juliana.bastos@lidermoveis.com.br',
        telefoneCorporativo: '(11) 98888-2222',
        cargoId: cargosMap['Analista de RH Pleno'].id,
        departamentoId: deptosMap['Recursos Humanos & D.P.'].id,
        gestorId: gestorRh.id,
        regime: RegimeContratacao.CLT,
        modalidade: ModalidadeTrabalho.HIBRIDO,
        dataAdmissao: DateTime.fromISO('2023-06-01'),
        salarioClt: '5800.00',
        dataVigenciaSalario: DateTime.fromISO('2023-06-01'),
        perfilDiscPrimario: PerfilDISC.CAUTELOSO,
        perfilDiscSecundario: PerfilDISC.ESTAVEL,
        isActive: true,
      }
    )

    // Projetista Líder
    const projetistaUser = await User.findBy('email', 'projetista@lidermoveis.com.br')
    const projetistaLider = await Colaborador.firstOrCreate(
      { cpf: '333.444.555-66' },
      {
        userId: projetistaUser ? projetistaUser.id : null,
        nome: 'Lucas Silveira',
        cpf: '333.444.555-66',
        rg: '44.556.677-8',
        emailCorporativo: 'projetista@lidermoveis.com.br',
        telefoneCorporativo: '(11) 97777-3333',
        cargoId: cargosMap['Projetista Líder'].id,
        departamentoId: deptosMap['Projetos & Design de Interiores'].id,
        regime: RegimeContratacao.CLT,
        modalidade: ModalidadeTrabalho.PRESENCIAL,
        dataAdmissao: DateTime.fromISO('2022-03-10'),
        salarioClt: '8200.00',
        remuneracaoComplementar: '1500.00',
        dataVigenciaSalario: DateTime.fromISO('2024-03-10'),
        perfilDiscPrimario: PerfilDISC.DOMINANTE,
        perfilDiscSecundario: PerfilDISC.CAUTELOSO,
        observacoesComportamentais: 'Alto rigor técnico na conferência e modelagem de móveis de alto padrão.',
        isActive: true,
      }
    )

    // Projetista Sênior (Subordinado de Lucas)
    await Colaborador.firstOrCreate(
      { cpf: '444.555.666-77' },
      {
        nome: 'André Valente',
        cpf: '444.555.666-77',
        rg: '55.667.788-9',
        emailCorporativo: 'andre.valente@lidermoveis.com.br',
        telefoneCorporativo: '(11) 97777-4444',
        cargoId: cargosMap['Projetista Sênior'].id,
        departamentoId: deptosMap['Projetos & Design de Interiores'].id,
        gestorId: projetistaLider.id,
        regime: RegimeContratacao.CLT,
        modalidade: ModalidadeTrabalho.HIBRIDO,
        dataAdmissao: DateTime.fromISO('2023-02-01'),
        salarioClt: '6500.00',
        dataVigenciaSalario: DateTime.fromISO('2023-02-01'),
        perfilDiscPrimario: PerfilDISC.CAUTELOSO,
        isActive: true,
      }
    )

    // Consultor Externo PJ
    await Colaborador.firstOrCreate(
      { cpf: '555.666.777-88' },
      {
        nome: 'Ricardo Meireles Representações',
        cpf: '555.666.777-88',
        emailCorporativo: 'ricardo.vendas@lidermoveis.com.br',
        telefoneCorporativo: '(11) 96666-5555',
        cargoId: cargosMap['Consultor Comercial Externo (PJ)'].id,
        departamentoId: deptosMap['Comercial & Vendas'].id,
        regime: RegimeContratacao.PJ,
        modalidade: ModalidadeTrabalho.REMOTO,
        pjCnpj: '12.345.678/0001-90',
        pjValorMensal: '9500.00',
        pjVigenciaInicio: DateTime.fromISO('2024-01-01'),
        dataAdmissao: DateTime.fromISO('2024-01-01'),
        perfilDiscPrimario: PerfilDISC.INFLUENTE,
        perfilDiscSecundario: PerfilDISC.DOMINANTE,
        isActive: true,
      }
    )

    // Colaboradora Desligada (ideal para testar RH-RN009 e RH-RN011)
    await Colaborador.firstOrCreate(
      { cpf: '999.888.777-66' },
      {
        nome: 'Fernanda Lima da Silva',
        cpf: '999.888.777-66',
        rg: '99.888.777-0',
        emailCorporativo: 'fernanda.ex@lidermoveis.com.br',
        cargoId: cargosMap['Operador de CNC'].id,
        departamentoId: deptosMap['Produção & Fábrica'].id,
        regime: RegimeContratacao.CLT,
        modalidade: ModalidadeTrabalho.PRESENCIAL,
        dataAdmissao: DateTime.fromISO('2023-04-10'),
        salarioClt: '3800.00',
        dataVigenciaSalario: DateTime.fromISO('2023-04-10'),
        isActive: false,
        dataDesligamento: DateTime.fromISO('2024-02-15'),
        tipoDesligamento: 'pedido_demissao',
        motivoDesligamento: 'Mudança de estado e projeto pessoal.',
        entrevistaSaida: 'Colaboradora elogiou a infraestrutura da fábrica e a pontualidade nos pagamentos.',
      }
    )

    // Cria históricos salariais e de cargos para os colaboradores
    const todos = await Colaborador.all()
    for (const c of todos) {
      const hsExiste = await HistoricoSalarialColaborador.findBy('colaborador_id', c.id)
      if (!hsExiste && c.salarioClt) {
        await HistoricoSalarialColaborador.create({
          colaboradorId: c.id,
          salarioClt: c.salarioClt,
          remuneracaoComplementar: c.remuneracaoComplementar || null,
          dataVigencia: c.dataVigenciaSalario || c.dataAdmissao,
          motivo: 'Admissão Inicial',
          registradoPorId: adminId,
        })
      }

      const hcExiste = await HistoricoCargoColaborador.findBy('colaborador_id', c.id)
      if (!hcExiste) {
        await HistoricoCargoColaborador.create({
          colaboradorId: c.id,
          cargoAnteriorId: null,
          cargoNovoId: c.cargoId,
          data: c.dataAdmissao,
          aprovadoPorId: adminId,
          justificativa: 'Admissão',
        })
      }
    }

    console.log('[Seeder] Colaboradores e Históricos criados com sucesso!')
  }
}
