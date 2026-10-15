import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { PerfilUsuario } from '#models/user'
import Arquiteto, {
  NivelParceria,
  TipoEspecificador,
  StatusCarteiraEspecificador,
} from '#models/arquiteto'
import DecisorArquiteto from '#models/decisor_arquiteto'
import ConcorrenteArquiteto from '#models/concorrente_arquiteto'
import HistoricoDonoArquiteto from '#models/historico_dono_arquiteto'
import InteracaoArquiteto, { TipoInteracaoArquiteto } from '#models/interacao_arquiteto'
import MetaVisitasConsultor from '#models/meta_visitas_consultor'
import Projeto, { StatusProjeto } from '#models/projeto'
import Lead, { StatusFunil, OrigemLead } from '#models/lead'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class ArquitetoSeeder extends BaseSeeder {
  async run() {
    console.log('[Seeder] Iniciando povoamento de Especificadores (Milestone M5)...')

    const agora = DateTime.now().toUTC()

    // 1. Garante a existência dos usuários/consultores padrão do sistema
    const admin = await User.updateOrCreate(
      { email: 'admin@plannit.com.br' },
      {
        nome: 'Administrador Diretoria',
        email: 'admin@plannit.com.br',
        password: 'Admin@123456',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: true,
      }
    )

    const gerente = await User.updateOrCreate(
      { email: 'gerente@lidermoveis.com.br' },
      {
        nome: 'Gerente Comercial',
        email: 'gerente@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.GERENTE_COMERCIAL,
        isActive: true,
        isSuperuser: false,
      }
    )

    const vendedor = await User.updateOrCreate(
      { email: 'vendedor@lidermoveis.com.br' },
      {
        nome: 'Vendedor Líder',
        email: 'vendedor@lidermoveis.com.br',
        password: 'Teste@123',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      }
    )

    // 2. Limpeza idempotente de dados de teste de arquitetos anteriores
    // Desvincula projetos e leads de teste
    await Projeto.query().whereILike('codigo', 'PRJ-ARQ-%').delete()
    await Lead.query().whereILike('email', '%@teste-arq.com.br').delete()

    // Limpa sub-tabelas dependentes de arquitetos
    await InteracaoArquiteto.query().delete()
    await ConcorrenteArquiteto.query().delete()
    await DecisorArquiteto.query().delete()
    await HistoricoDonoArquiteto.query().delete()
    await MetaVisitasConsultor.query().delete()

    // Limpa os arquitetos cadastrados previamente
    await Arquiteto.query().delete()

    // -------------------------------------------------------------------------
    // 3. Criação dos 8 Especificadores cobrindo rigorosamente todos os
    //    7 Segmentos Comportamentais e as 5 Flags de Risco / Oportunidade
    // -------------------------------------------------------------------------

    // 3.1. Segmento 1: INATIVO
    // Especificador sem projetos e sem leads vinculados (temHistorico = false).
    // Cadastrado há > 90 dias (150 dias).
    const arqInativo = await Arquiteto.create({
      nome: 'Studio Alpha Inativo',
      escritorio: 'Alpha Arquitetura & Design',
      enderecoEscritorio: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      telefone: '(11) 91111-0001',
      email: 'contato@alpha-inativo.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.ARQUITETO,
      especialidade: 'Residencial Alto Padrão',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.INATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 150 }),
    })
    // Força created_at preciso no banco
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 150 }).toSQL(),
      arqInativo.id,
    ])

    // 3.2. Segmento 2: NOVO PROMISSOR
    // Cadastrado há menos de 90 dias (35 dias) com projetos e leads recentes.
    const arqNovoPromissor = await Arquiteto.create({
      nome: 'Lucas Arquiteto Novo Promissor',
      escritorio: 'Lucas Studio Arquitetura',
      enderecoEscritorio: 'Rua Oscar Freire, 500 - Cerqueira César, São Paulo - SP',
      telefone: '(11) 91111-0002',
      email: 'lucas@novopromissor.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.ARQUITETO,
      especialidade: 'Cozinhas e Áreas Gourmet',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 35 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 35 }).toSQL(),
      arqNovoPromissor.id,
    ])

    // Projeto recente para o Novo Promissor
    await Projeto.create({
      codigo: 'PRJ-ARQ-NP01',
      clienteNome: 'Cliente Novo Promissor 1',
      vendedorId: vendedor.id,
      arquitetoId: arqNovoPromissor.id,
      status: StatusProjeto.EM_PROJETO,
      arquivado: false,
      valorContrato: '75000.00',
      createdAt: agora.minus({ days: 10 }),
    })

    // Lead recente para o Novo Promissor
    await Lead.create({
      nome: 'Lead Novo Promissor 1',
      telefone: '(11) 97777-0002',
      email: 'lead1@novopromissor.teste-arq.com.br',
      cidade: 'São Paulo',
      origem: OrigemLead.ARQUITETO,
      statusFunil: StatusFunil.QUALIFICANDO,
      vendedorId: vendedor.id,
      arquitetoId: arqNovoPromissor.id,
      qualificado: false,
      createdAt: agora.minus({ days: 15 }),
    })

    // 3.3. Segmento 3: EM RISCO (com Flag EM_RISCO_DE_PERDA)
    // Histórico prévio (frequenciaAllTime > 0), porém sem projetos e leads há mais de 180 dias (200 dias).
    // Possui interação recente aos 10 dias (portanto NÃO esfriando).
    const arqEmRisco = await Arquiteto.create({
      nome: 'Rafael Costa Arquitetura Em Risco',
      escritorio: 'Costa & Associados Arquitetura',
      enderecoEscritorio: 'Alameda Santos, 1200 - Jardins, São Paulo - SP',
      telefone: '(11) 91111-0003',
      email: 'rafael@emrisco.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.ARQUITETO,
      especialidade: 'Reformas Corporativas',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 300 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 300 }).toSQL(),
      arqEmRisco.id,
    ])

    await Projeto.create({
      codigo: 'PRJ-ARQ-RSK01',
      clienteNome: 'Cliente Em Risco 1',
      vendedorId: vendedor.id,
      arquitetoId: arqEmRisco.id,
      status: StatusProjeto.CONCLUIDO,
      arquivado: false,
      valorContrato: '60000.00',
      createdAt: agora.minus({ days: 200 }),
    })
    await db.rawQuery('UPDATE projetos SET created_at = ? WHERE codigo = ?', [
      agora.minus({ days: 200 }).toSQL(),
      'PRJ-ARQ-RSK01',
    ])

    // Interação recente aos 10 dias (afasta flag esfriando)
    await InteracaoArquiteto.create({
      arquitetoId: arqEmRisco.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.LIGACAO,
      resumo: 'Contato de reaproximação com Rafael Costa sobre novos lançamentos de laminados.',
      data: agora.minus({ days: 10 }),
    })

    // Concorrente com alta ameaça (>60%) para Rafael Costa
    await ConcorrenteArquiteto.create({
      arquitetoId: arqEmRisco.id,
      nomeConcorrente: 'Bontempo Planejados',
      percentualFechamentoEstimado: '70.00',
      observacoes: 'Cliente informou que tem especificado muito com a Bontempo devido a prazos.',
      registradoPorId: vendedor.id,
    })

    // Decisor principal de Rafael Costa
    await DecisorArquiteto.create({
      arquitetoId: arqEmRisco.id,
      nome: 'Rafael Costa',
      cargo: 'Arquiteto Titular',
      telefone: '(11) 91111-0003',
      email: 'rafael@emrisco.teste-arq.com.br',
      isPrincipal: true,
    })

    // 3.4. Segmento 4: CAMPEÃO (com Flags TOP_INDICADOR, INDICACAO_ALTO_VALOR e ALTO_POTENCIAL)
    // Score Geral >= 85 (calibrado para 100), múltiplos projetos de alto valor nos 12m (> R$ 700.000).
    // Cadastrada há mais de 24 meses (800 dias).
    const arqCampeao = await Arquiteto.create({
      nome: 'Sofia Valente Arquitetura Campeã',
      escritorio: 'Sofia Valente Studio Interiores',
      enderecoEscritorio: 'Rua Haddock Lobo, 800 - Cerqueira César, São Paulo - SP',
      telefone: '(11) 91111-0004',
      email: 'sofia@campea.teste-arq.com.br',
      nivelParceria: NivelParceria.VIP,
      tipo: TipoEspecificador.ARQUITETO,
      especialidade: 'Casas de Luxo em Condomínio',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 800 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 800 }).toSQL(),
      arqCampeao.id,
    ])

    // Inserção de 12 projetos nos últimos 12 meses distribuídos mês a mês (Consistência 12/12 = 100%)
    // e soma total de R$ 840.000 (Valor 100 pts), 4 projetos em andamento (Potencial)
    for (let i = 0; i < 12; i++) {
      const diasAtras = 15 + i * 30
      const isAtivo = i < 4
      const status = isAtivo
        ? i === 0
          ? StatusProjeto.EM_PROJETO
          : i === 1
            ? StatusProjeto.EM_RENDER
            : i === 2
              ? StatusProjeto.EM_FECHAMENTO
              : StatusProjeto.EM_MONTAGEM
        : StatusProjeto.CONCLUIDO

      const p = await Projeto.create({
        codigo: `PRJ-ARQ-CMP${String(i + 1).padStart(2, '0')}`,
        clienteNome: `Cliente Sofia Valente #${i + 1}`,
        vendedorId: vendedor.id,
        arquitetoId: arqCampeao.id,
        status,
        arquivado: false,
        valorContrato: '70000.00',
        createdAt: agora.minus({ days: diasAtras }),
      })
      await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
        agora.minus({ days: diasAtras }).toSQL(),
        p.id,
      ])
    }

    // 4 Leads ativos e 4 fechados para Sofia Valente
    for (let i = 1; i <= 4; i++) {
      await Lead.create({
        nome: `Lead Ativo Sofia Valente ${i}`,
        telefone: `(11) 98888-000${i}`,
        email: `lead.ativo${i}@campea.teste-arq.com.br`,
        cidade: 'São Paulo',
        origem: OrigemLead.ARQUITETO,
        statusFunil: i === 1 ? StatusFunil.NOVO_LEAD : i === 2 ? StatusFunil.EM_VISITA : StatusFunil.EM_BRIEFING,
        vendedorId: vendedor.id,
        arquitetoId: arqCampeao.id,
        qualificado: true,
        createdAt: agora.minus({ days: 10 + i * 5 }),
      })
    }

    for (let i = 1; i <= 4; i++) {
      await Lead.create({
        nome: `Lead Fechado Sofia Valente ${i}`,
        telefone: `(11) 97777-000${i}`,
        email: `lead.fechado${i}@campea.teste-arq.com.br`,
        cidade: 'São Paulo',
        origem: OrigemLead.ARQUITETO,
        statusFunil: StatusFunil.FECHADO,
        vendedorId: vendedor.id,
        arquitetoId: arqCampeao.id,
        qualificado: true,
        createdAt: agora.minus({ days: 40 + i * 15 }),
      })
    }

    // Decisores de Sofia Valente (principal e secundário)
    await DecisorArquiteto.create({
      arquitetoId: arqCampeao.id,
      nome: 'Sofia Valente',
      cargo: 'Diretora Criativa & Titular',
      telefone: '(11) 98888-1111',
      email: 'sofia@valente.arq.br',
      isPrincipal: true,
      observacoes: 'Decisora final de todas as especificações e contratos do escritório.',
    })

    await DecisorArquiteto.create({
      arquitetoId: arqCampeao.id,
      nome: 'Carlos Mendes',
      cargo: 'Coordenador de Detalhamento Técnico',
      telefone: '(11) 98888-2222',
      email: 'carlos@valente.arq.br',
      isPrincipal: false,
      observacoes: 'Responsável técnico pelo envio dos arquivos de CAD/SketchUp.',
    })

    // Concorrente de Sofia Valente com risco baixo (<30%)
    await ConcorrenteArquiteto.create({
      arquitetoId: arqCampeao.id,
      nomeConcorrente: 'Dell Anno Prime',
      percentualFechamentoEstimado: '15.00',
      observacoes: 'Ocasionalmente cota cozinhas compactas quando cliente tem restrição de prazo.',
      registradoPorId: vendedor.id,
    })

    // Histórico de Dono de Sofia Valente
    await HistoricoDonoArquiteto.create({
      arquitetoId: arqCampeao.id,
      consultorAnteriorId: null,
      consultorNovoId: vendedor.id,
      alteradoPorId: admin.id,
      motivo: 'Atribuição inicial de carteira comercial para Sofia Valente',
      createdAt: agora.minus({ days: 800 }),
    })

    // 3.5. Segmento 5: PARCEIRO FIEL
    // Lealdade >= 75 (76.7) e RFV >= 50 (70.0), com Score Geral < 85 (48.9).
    // Cadastrada há 760 dias (> 24 meses), 6 projetos em 6 meses distintos nos 12m,
    // todos concluídos (potencial = 0), taxa conversão alta (80%).
    const arqParceiroFiel = await Arquiteto.create({
      nome: 'Beatriz Mendes Design Parceira Fiel',
      escritorio: 'Mendes & Oliveira Design de Interiores',
      enderecoEscritorio: 'Rua Bela Cintra, 1400 - Consolação, São Paulo - SP',
      telefone: '(11) 91111-0005',
      email: 'beatriz@parceirofiel.teste-arq.com.br',
      nivelParceria: NivelParceria.PREMIUM,
      tipo: TipoEspecificador.DESIGNER_INTERIORES,
      especialidade: 'Apartamentos Residenciais',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 760 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 760 }).toSQL(),
      arqParceiroFiel.id,
    ])

    // 6 Projetos concluídos em meses distintos nos últimos 12m somando R$ 60.000
    // (40d, 70d, 100d, 130d, 160d, 190d atrás)
    const datasProjetosFiel = [40, 70, 100, 130, 160, 190]
    for (let i = 0; i < datasProjetosFiel.length; i++) {
      const p = await Projeto.create({
        codigo: `PRJ-ARQ-PF${String(i + 1).padStart(2, '0')}`,
        clienteNome: `Cliente Parceiro Fiel #${i + 1}`,
        vendedorId: vendedor.id,
        arquitetoId: arqParceiroFiel.id,
        status: StatusProjeto.CONCLUIDO,
        arquivado: false,
        valorContrato: '10000.00',
        createdAt: agora.minus({ days: datasProjetosFiel[i] }),
      })
      await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
        agora.minus({ days: datasProjetosFiel[i] }).toSQL(),
        p.id,
      ])
    }

    // Leads terminais: 4 fechados e 1 perdido (conversão = 80%)
    for (let i = 1; i <= 4; i++) {
      await Lead.create({
        nome: `Lead Fechado Parceiro Fiel ${i}`,
        telefone: `(11) 96666-000${i}`,
        email: `fechado${i}@parceirofiel.teste-arq.com.br`,
        cidade: 'São Paulo',
        origem: OrigemLead.ARQUITETO,
        statusFunil: StatusFunil.FECHADO,
        vendedorId: vendedor.id,
        arquitetoId: arqParceiroFiel.id,
        qualificado: true,
        createdAt: agora.minus({ days: 50 + i * 20 }),
      })
    }
    await Lead.create({
      nome: 'Lead Perdido Parceiro Fiel',
      telefone: '(11) 96666-0099',
      email: 'perdido@parceirofiel.teste-arq.com.br',
      cidade: 'São Paulo',
      origem: OrigemLead.ARQUITETO,
      statusFunil: StatusFunil.PERDIDO,
      vendedorId: vendedor.id,
      arquitetoId: arqParceiroFiel.id,
      qualificado: true,
      createdAt: agora.minus({ days: 120 }),
    })

    // Concorrente com risco médio (30-60%) para Beatriz Mendes
    await ConcorrenteArquiteto.create({
      arquitetoId: arqParceiroFiel.id,
      nomeConcorrente: 'Florense Alphaville',
      percentualFechamentoEstimado: '45.00',
      observacoes: 'Divide alguns clientes de médio padrão.',
      registradoPorId: vendedor.id,
    })

    // 3.6. Segmento 6: EM ASCENSÃO (com Flag ALTO_POTENCIAL)
    // Potencial >= 70 (85 pts com 5 ativos: 2 projetos em andamento + 3 leads ativos).
    // Cadastrado há 120 dias, lealdade moderada (38.9) e RFV 63.3, score geral 62.4 (< 85).
    const arqEmAscensao = await Arquiteto.create({
      nome: 'Thiago Rocha Engenharia Em Ascensao',
      escritorio: 'Rocha Engenharia & Projetos',
      enderecoEscritorio: 'Av. Brigadeiro Faria Lima, 2000 - Itaim Bibi, São Paulo - SP',
      telefone: '(11) 91111-0006',
      email: 'thiago@emascensao.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.ENGENHEIRO,
      especialidade: 'Gerenciamento de Obras e Interiores',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 120 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 120 }).toSQL(),
      arqEmAscensao.id,
    ])

    // 2 Projetos ativos (em_projeto) nos 12m (20d e 50d atrás), total R$ 40.000
    const pAsc1 = await Projeto.create({
      codigo: 'PRJ-ARQ-ASC01',
      clienteNome: 'Cliente Thiago Rocha 1',
      vendedorId: vendedor.id,
      arquitetoId: arqEmAscensao.id,
      status: StatusProjeto.EM_PROJETO,
      arquivado: false,
      valorContrato: '20000.00',
      createdAt: agora.minus({ days: 20 }),
    })
    await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 20 }).toSQL(),
      pAsc1.id,
    ])

    const pAsc2 = await Projeto.create({
      codigo: 'PRJ-ARQ-ASC02',
      clienteNome: 'Cliente Thiago Rocha 2',
      vendedorId: vendedor.id,
      arquitetoId: arqEmAscensao.id,
      status: StatusProjeto.EM_PROJETO,
      arquivado: false,
      valorContrato: '20000.00',
      createdAt: agora.minus({ days: 50 }),
    })
    await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 50 }).toSQL(),
      pAsc2.id,
    ])

    // 3 Leads ativos no funil para Thiago Rocha
    for (let i = 1; i <= 3; i++) {
      await Lead.create({
        nome: `Lead Ativo Thiago Rocha ${i}`,
        telefone: `(11) 95555-000${i}`,
        email: `lead${i}@emascensao.teste-arq.com.br`,
        cidade: 'São Paulo',
        origem: OrigemLead.ARQUITETO,
        statusFunil: i === 1 ? StatusFunil.NOVO_LEAD : i === 2 ? StatusFunil.QUALIFICANDO : StatusFunil.EM_VISITA,
        vendedorId: vendedor.id,
        arquitetoId: arqEmAscensao.id,
        qualificado: i > 1,
        createdAt: agora.minus({ days: 10 * i }),
      })
    }

    // Concorrente com risco baixo (<30%)
    await ConcorrenteArquiteto.create({
      arquitetoId: arqEmAscensao.id,
      nomeConcorrente: 'Ornare Closets',
      percentualFechamentoEstimado: '20.00',
      observacoes: 'Orçamentos esporádicos para closet master.',
      registradoPorId: vendedor.id,
    })

    // 3.7. Segmento 7: OCASIONAL
    // Fallback: não cai em inativo, novo promissor, em risco, campeão, parceiro fiel ou em ascensão.
    // Cadastrada há 180 dias, 1 projeto concluído há 60 dias de R$ 25.000, 0 ativos.
    // RFV: 43.3 (< 50), Potencial: 0 (< 70), Lealdade: 36.1 (< 75), Score Geral: 26.5 (< 85).
    const arqOcasional = await Arquiteto.create({
      nome: 'Camila Prado Decoradora Ocasional',
      escritorio: 'Camila Prado Decor',
      enderecoEscritorio: 'Rua Mourato Coelho, 700 - Pinheiros, São Paulo - SP',
      telefone: '(11) 91111-0007',
      email: 'camila@ocasional.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.DECORADOR,
      especialidade: 'Consultoria de Decoração e Ambientes Integrados',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 180 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 180 }).toSQL(),
      arqOcasional.id,
    ])

    const pOcasional = await Projeto.create({
      codigo: 'PRJ-ARQ-OCA01',
      clienteNome: 'Cliente Camila Prado Ocasional 1',
      vendedorId: vendedor.id,
      arquitetoId: arqOcasional.id,
      status: StatusProjeto.CONCLUIDO,
      arquivado: false,
      valorContrato: '25000.00',
      createdAt: agora.minus({ days: 60 }),
    })
    await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 60 }).toSQL(),
      pOcasional.id,
    ])

    // 3.8. Perfil 8: ESFRIANDO (Segmento EM_RISCO com Flags EM_RISCO_DE_PERDA e ESPECIFICADOR_ESFRIANDO)
    // Cadastrada há 360 dias, 1 projeto há 220 dias (>180d sem atividade), tem dono atribuído
    // e última interação registrada há 45 dias (> 30 dias sem interação).
    const arqEsfriando = await Arquiteto.create({
      nome: 'Marina Dias Arquitetura Esfriando',
      escritorio: 'Marina Dias Arquitetura',
      enderecoEscritorio: 'Rua Pamplona, 900 - Jardim Paulista, São Paulo - SP',
      telefone: '(11) 91111-0008',
      email: 'marina@esfriando.teste-arq.com.br',
      nivelParceria: NivelParceria.PARCEIRO,
      tipo: TipoEspecificador.ARQUITETO,
      especialidade: 'Residências e Coberturas',
      consultorId: vendedor.id,
      statusCarteira: StatusCarteiraEspecificador.ATIVO,
      isActive: true,
      createdAt: agora.minus({ days: 360 }),
    })
    await db.rawQuery('UPDATE arquitetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 360 }).toSQL(),
      arqEsfriando.id,
    ])

    const pEsfriando = await Projeto.create({
      codigo: 'PRJ-ARQ-ESF01',
      clienteNome: 'Cliente Marina Dias Esfriando 1',
      vendedorId: vendedor.id,
      arquitetoId: arqEsfriando.id,
      status: StatusProjeto.CONCLUIDO,
      arquivado: false,
      valorContrato: '45000.00',
      createdAt: agora.minus({ days: 220 }),
    })
    await db.rawQuery('UPDATE projetos SET created_at = ? WHERE id = ?', [
      agora.minus({ days: 220 }).toSQL(),
      pEsfriando.id,
    ])

    // Interação antiga (45 dias atrás) -> ativa flag especificador_esfriando
    await InteracaoArquiteto.create({
      arquitetoId: arqEsfriando.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.WHATSAPP,
      resumo: 'Tentativa de contato via WhatsApp sem resposta da especificadora.',
      data: agora.minus({ days: 45 }),
    })

    // Decisor de Marina Dias
    await DecisorArquiteto.create({
      arquitetoId: arqEsfriando.id,
      nome: 'Marina Dias',
      cargo: 'Arquiteta Titular',
      telefone: '(11) 91111-0008',
      email: 'marina@esfriando.teste-arq.com.br',
      isPrincipal: true,
    })

    // -------------------------------------------------------------------------
    // 4. Interações no Mês Atual para alimentar KPIs da Carteira e Metas
    // -------------------------------------------------------------------------
    // Visitas ao Escritório realizadas pelo Vendedor no mês atual:
    await InteracaoArquiteto.create({
      arquitetoId: arqCampeao.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.VISITA_ESCRITORIO,
      resumo: 'Apresentação do novo mostruário de puxadores e ferragens italianas.',
      data: agora.minus({ days: 3 }),
    })

    await InteracaoArquiteto.create({
      arquitetoId: arqEmAscensao.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.VISITA_ESCRITORIO,
      resumo: 'Alinhamento técnico de projeto residencial com Thiago Rocha.',
      data: agora.minus({ days: 6 }),
    })

    await InteracaoArquiteto.create({
      arquitetoId: arqParceiroFiel.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.VISITA_ESCRITORIO,
      resumo: 'Reunião de relacionamento e café comercial no escritório de Beatriz Mendes.',
      data: agora.minus({ days: 12 }),
    })

    // Outros Atendimentos no mês atual (tipo != visita_escritorio):
    await InteracaoArquiteto.create({
      arquitetoId: arqNovoPromissor.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.VISITA_LOJA,
      resumo: 'Visita de Lucas ao showroom da Líder para conhecer acabamento ripado.',
      data: agora.minus({ days: 2 }),
    })

    await InteracaoArquiteto.create({
      arquitetoId: arqCampeao.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.WHATSAPP,
      resumo: 'Envio de orçamento preliminar via WhatsApp para cliente da Sofia.',
      data: agora.minus({ days: 4 }),
    })

    await InteracaoArquiteto.create({
      arquitetoId: arqOcasional.id,
      responsavelId: vendedor.id,
      tipo: TipoInteracaoArquiteto.LIGACAO,
      resumo: 'Ligação de acompanhamento pós-entrega de projeto anterior.',
      data: agora.minus({ days: 8 }),
    })

    // -------------------------------------------------------------------------
    // 5. Metas Mensais de Visitas por Consultor
    // -------------------------------------------------------------------------
    // Vendedor: meta de 15 visitas mensais configurada pelo Gerente Comercial
    await MetaVisitasConsultor.create({
      consultorId: vendedor.id,
      metaVisitasMes: 15,
      configuradoPorId: gerente.id,
    })

    // Gerente: meta de 10 visitas mensais configurada pela Diretoria
    await MetaVisitasConsultor.create({
      consultorId: gerente.id,
      metaVisitasMes: 10,
      configuradoPorId: admin.id,
    })

    console.log('[Seeder] Especificadores, Decisores, Concorrentes, Interações e Metas criados com sucesso!')
  }
}
