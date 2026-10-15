import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Projeto, { StatusProjeto } from '#models/projeto'
import ProjetoComercial, { StatusProjetoComercial } from '#models/projeto_comercial'
import HistoricoStatusProjeto from '#models/historico_status_projeto'
import Cliente from '#models/cliente'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const cliente = await Cliente.first()
    const vendedor = await User.query().where('perfil', 'vendedor').first()
    const projetista = await User.query().where('perfil', 'projetista').first()

    if (!vendedor || !projetista) {
      return
    }

    // 1. Projeto com Maquete 3D aguardando validação do vendedor
    const p1 = await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-VALIDACAO' },
      {
        codigo: 'PROJ-2026-VALIDACAO',
        clienteId: cliente?.id || null,
        clienteNome: cliente?.nome || 'Residência Alphaville - Bloco B',
        vendedorId: vendedor.id,
        projetistaId: projetista.id,
        status: StatusProjeto.AGUARD_VALIDACAO,
        valorContrato: '145000.00',
        alertaParado: false,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: 1 }),
      }
    )

    await ProjetoComercial.updateOrCreate(
      { projetoId: p1.id, versao: 1 },
      {
        projetoId: p1.id,
        versao: 1,
        arquivoUrl: 'https://cloud.lidermoveis.com.br/projetos/v1_alphaville.skp',
        descricaoAlteracao: 'Maquete inicial com ilha gourmet em mármore calacata e armários em laca fosca cinza.',
        status: StatusProjetoComercial.AGUARD_VALIDACAO_VENDEDOR,
        submetidoParaValidacaoEm: DateTime.now().minus({ hours: 12 }),
        criadoPorId: projetista.id,
      }
    )

    await HistoricoStatusProjeto.updateOrCreate(
      { projetoId: p1.id, statusPara: StatusProjeto.AGUARD_VALIDACAO },
      {
        projetoId: p1.id,
        statusDe: StatusProjeto.EM_PROJETO,
        statusPara: StatusProjeto.AGUARD_VALIDACAO,
        alteradoPorId: projetista.id,
        observacao: 'Maquete 3D (v1) submetida para aprovação do vendedor.',
      }
    )

    // 2. Projeto com Maquete Devolvida (RN004 - Motivo Obrigatório)
    const p2 = await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-DEVOLVIDO' },
      {
        codigo: 'PROJ-2026-DEVOLVIDO',
        clienteId: cliente?.id || null,
        clienteNome: 'Cobertura Jardins (Ajustes)',
        vendedorId: vendedor.id,
        projetistaId: projetista.id,
        status: StatusProjeto.EM_AJUSTE,
        valorContrato: '230000.00',
        alertaParado: false,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: 2 }),
      }
    )

    await ProjetoComercial.updateOrCreate(
      { projetoId: p2.id, versao: 1 },
      {
        projetoId: p2.id,
        versao: 1,
        arquivoUrl: 'https://cloud.lidermoveis.com.br/projetos/v1_jardins.skp',
        descricaoAlteracao: 'Primeira versão do closet master.',
        status: StatusProjetoComercial.DEVOLVIDO,
        submetidoParaValidacaoEm: DateTime.now().minus({ days: 3 }),
        validadoPorId: vendedor.id,
        validadoEm: DateTime.now().minus({ days: 2 }),
        motivoDevolucao: 'RN004: Cliente solicitou gavetões com iluminação em LED embutido e portas com perfil alumínio bronze ao invés de preto.',
        criadoPorId: projetista.id,
      }
    )

    await HistoricoStatusProjeto.updateOrCreate(
      { projetoId: p2.id, statusPara: StatusProjeto.EM_AJUSTE },
      {
        projetoId: p2.id,
        statusDe: StatusProjeto.AGUARD_VALIDACAO,
        statusPara: StatusProjeto.EM_AJUSTE,
        alteradoPorId: vendedor.id,
        observacao: 'Versão 3D devolvida pelo vendedor com apontamentos de iluminação e perfil bronze.',
      }
    )

    // 3. Projeto com Render Aprovado e Concluído (Pronto para Apresentação - RN005)
    const p3 = await Projeto.updateOrCreate(
      { codigo: 'PROJ-2026-RENDER-OK' },
      {
        codigo: 'PROJ-2026-RENDER-OK',
        clienteId: cliente?.id || null,
        clienteNome: 'Casa de Campo Fazenda Boa Vista',
        vendedorId: vendedor.id,
        projetistaId: projetista.id,
        status: StatusProjeto.EM_RENDER,
        valorContrato: '310000.00',
        alertaParado: false,
        arquivado: false,
        statusAlteradoEm: DateTime.now().minus({ days: 1 }),
      }
    )

    await ProjetoComercial.updateOrCreate(
      { projetoId: p3.id, versao: 1 },
      {
        projetoId: p3.id,
        versao: 1,
        arquivoUrl: 'https://cloud.lidermoveis.com.br/projetos/v1_boavista.skp',
        descricaoAlteracao: 'Living e espaço gourmet integrados.',
        renderUrls: 'https://cloud.lidermoveis.com.br/renders/boavista_render_01.jpg\nhttps://cloud.lidermoveis.com.br/renders/boavista_render_02.jpg',
        status: StatusProjetoComercial.FINALIZADO,
        submetidoParaValidacaoEm: DateTime.now().minus({ days: 2 }),
        validadoPorId: vendedor.id,
        validadoEm: DateTime.now().minus({ days: 1 }),
        motivoDevolucao: null,
        criadoPorId: projetista.id,
      }
    )

    await HistoricoStatusProjeto.updateOrCreate(
      { projetoId: p3.id, statusPara: StatusProjeto.EM_RENDER },
      {
        projetoId: p3.id,
        statusDe: StatusProjeto.AGUARD_VALIDACAO,
        statusPara: StatusProjeto.EM_RENDER,
        alteradoPorId: vendedor.id,
        observacao: 'Maquete aprovada com louvor. Renders fotorrealistas concluídos e vinculados.',
      }
    )
  }
}
