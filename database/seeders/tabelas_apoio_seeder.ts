import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class TabelasApoioSeeder extends BaseSeeder {
  async run() {
    const now = new Date()

    // 1. Ambientes Padrão
    const countAmbientes = await db.from('ambientes_catalogo').count('* as total')
    if (Number(countAmbientes[0]?.total || 0) === 0) {
      const ambientesPadrao = [
        { nome: 'Living', categoria: 'Área Social', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Home Theater', categoria: 'Área Social', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Suíte Master', categoria: 'Área Íntima', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto do Filho', categoria: 'Área Íntima', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto da Filha', categoria: 'Área Íntima', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Quarto de Visita', categoria: 'Área Íntima', ordem: 60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Closet', categoria: 'Área Íntima', ordem: 70, is_active: true, created_at: now, updated_at: now },
        { nome: 'Cozinha', categoria: 'Área Social', ordem: 80, is_active: true, created_at: now, updated_at: now },
        { nome: 'Espaço Gourmet', categoria: 'Área Social', ordem: 90, is_active: true, created_at: now, updated_at: now },
        { nome: 'Varanda', categoria: 'Área Social', ordem: 100, is_active: true, created_at: now, updated_at: now },
        { nome: 'Banheiro', categoria: 'Área Íntima', ordem: 110, is_active: true, created_at: now, updated_at: now },
        { nome: 'Lavabo', categoria: 'Área Social', ordem: 120, is_active: true, created_at: now, updated_at: now },
        { nome: 'Home Office', categoria: 'Área Social', ordem: 130, is_active: true, created_at: now, updated_at: now },
        { nome: 'Área de Serviço', categoria: 'Serviço', ordem: 140, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('ambientes_catalogo').multiInsert(ambientesPadrao)
    }

    // 2. Origens Padrão
    const countOrigens = await db.from('origens_lead_catalogo').count('* as total')
    if (Number(countOrigens[0]?.total || 0) === 0) {
      const origensPadrao = [
        { nome: 'Instagram', slug: 'instagram', is_active: true, created_at: now, updated_at: now },
        { nome: 'Indicação', slug: 'indicacao', is_active: true, created_at: now, updated_at: now },
        { nome: 'Site / Google', slug: 'site_google', is_active: true, created_at: now, updated_at: now },
        { nome: 'Construtora', slug: 'construtora', is_active: true, created_at: now, updated_at: now },
        { nome: 'Showroom', slug: 'showroom', is_active: true, created_at: now, updated_at: now },
        { nome: 'Especificador', slug: 'arquiteto', is_active: true, created_at: now, updated_at: now },
        { nome: 'Outro', slug: 'outro', is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('origens_lead_catalogo').multiInsert(origensPadrao)
    }

    // 3. Campanhas Padrão
    const countCampanhas = await db.from('campanhas_lead').count('* as total')
    if (Number(countCampanhas[0]?.total || 0) === 0) {
      const dataFim30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const dataFim60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      const dataFim90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

      const campanhasPadrao = [
        { nome: 'Campanha Cozinhas & Gourmet', data_inicio: now, data_fim: dataFim60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Parceria Mostra Casa Decor', data_inicio: now, data_fim: dataFim90, is_active: true, created_at: now, updated_at: now },
        { nome: 'Ação Venda Futura / Na Planta', data_inicio: now, data_fim: dataFim30, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('campanhas_lead').multiInsert(campanhasPadrao)
    }

    // 4. Tipos de Compromisso Padrão (Agenda)
    const countTipos = await db.from('tipos_compromisso_catalogo').count('* as total')
    if (Number(countTipos[0]?.total || 0) === 0) {
      const tiposPadrao = [
        { nome: 'Briefing Técnico', slug: 'briefing_tecnico', cor: '#3B82F6', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita e Medição no Local', slug: 'visita_medicao', cor: '#10B981', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Apresentação de Projeto 3D', slug: 'apresentacao_3d', cor: '#8B5CF6', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Visita à Obra', slug: 'visita_obra', cor: '#F59E0B', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Reunião de Alinhamento na Loja', slug: 'reuniao_loja', cor: '#EC4899', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Alinhamento com Especificador / Arquiteto', slug: 'alinhamento_especificador', cor: '#6366F1', ordem: 60, is_active: true, created_at: now, updated_at: now },
        { nome: 'Outro', slug: 'outro', cor: '#6B7280', ordem: 70, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('tipos_compromisso_catalogo').multiInsert(tiposPadrao)
    }

    // 5. Categorias Padrão do Prontuário do Cliente
    const countProntuario = await db.from('categorias_prontuario_catalogo').count('* as total')
    if (Number(countProntuario[0]?.total || 0) === 0) {
      const categoriasProntuarioPadrao = [
        { nome: 'Pessoal & Hábitos', slug: 'pessoal', cor: '#3B82F6', icone: 'User', ordem: 10, is_active: true, created_at: now, updated_at: now },
        { nome: 'Família & Filhos', slug: 'familia', cor: '#8B5CF6', icone: 'Users', ordem: 20, is_active: true, created_at: now, updated_at: now },
        { nome: 'Pets & Animais', slug: 'pet', cor: '#F59E0B', icone: 'Dog', ordem: 30, is_active: true, created_at: now, updated_at: now },
        { nome: 'Hobbies & Lazer', slug: 'hobby', cor: '#10B981', icone: 'Smile', ordem: 40, is_active: true, created_at: now, updated_at: now },
        { nome: 'Preferências & Estilo', slug: 'preferencia', cor: '#EC4899', icone: 'Heart', ordem: 50, is_active: true, created_at: now, updated_at: now },
        { nome: 'Atendimento & CRM', slug: 'atendimento', cor: '#6B7280', icone: 'MessageSquare', ordem: 60, is_active: true, created_at: now, updated_at: now },
      ]
      await db.table('categorias_prontuario_catalogo').multiInsert(categoriasProntuarioPadrao)
    }

    // 6. Quadros & Etapas Padrão do Kanban (Funil Comercial + Pós-venda)
    const countQuadros = await db.from('kanban_quadros_catalogo').count('* as total')
    if (Number(countQuadros[0]?.total || 0) === 0) {
      const quadrosPadrao = [
        {
          nome: 'Kanban Comercial',
          slug: 'comercial',
          descricao: 'Funil comercial de qualificação, briefing, projeto 3D, apresentação e fechamento',
          cor: '#b45309',
          ordem: 1,
          is_active: true,
          is_sistema: true,
          etapas: [
            { nome: 'Novo Lead', slug: 'novo_lead', cor: '#3b82f6', ordem: 1, exige_qualificacao: false, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Qualificação', slug: 'qualificando', cor: '#8b5cf6', ordem: 2, exige_qualificacao: false, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Briefing', slug: 'em_briefing', cor: '#a66a12', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Fila de Projeto', slug: 'fila_projeto', cor: '#f59e0b', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Em Projeto', slug: 'em_projeto', cor: '#6366f1', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Pronto para Renderizar', slug: 'pronto_para_renderizar', cor: '#06b6d4', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalização / Renderizado', slug: 'finalizacao_renderizado', cor: '#0ea5e9', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Confirmar Apresentação', slug: 'confirmar_apresentacao', cor: '#ec4899', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Apresentação Agendada', slug: 'apresentacao_agendada', cor: '#d946ef', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Aberto / Em Negociação / Apresentado', slug: 'em_fechamento', cor: '#eab308', ordem: 10, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: true },
            { nome: 'Stand-by', slug: 'stand_by', cor: '#64748b', ordem: 11, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Alteração / Modificação / Ajuste', slug: 'alteracao_ajuste', cor: '#f97316', ordem: 12, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fechado / Vendido', slug: 'fechado', cor: '#16a34a', ordem: 13, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'ganho', is_sistema: true },
            { nome: 'Perdido', slug: 'perdido', cor: '#dc2626', ordem: 14, exige_qualificacao: false, exige_motivo_perda: true, tipo_estagio: 'perdido', is_sistema: true },
          ],
        },
        {
          nome: 'Pós-venda (Conferência)',
          slug: 'pos_venda_conferencia',
          descricao: 'Acompanhamento de caderno comercial, obra, medição técnica, pré-executivo e codificação',
          cor: '#0284c7',
          ordem: 2,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Caderno Comercial', slug: 'caderno_comercial', cor: '#0284c7', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Aguardando Obra', slug: 'aguardando_obra', cor: '#64748b', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Medição Técnica', slug: 'fila_medicao_tecnica', cor: '#f59e0b', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Pasta Técnica', slug: 'fila_pasta_tecnica', cor: '#eab308', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Adequação de Obra', slug: 'em_adequacao_obra', cor: '#f97316', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Medição Técnica', slug: 'medicao_tecnica', cor: '#06b6d4', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Medição Final', slug: 'fila_medicao_final', cor: '#3b82f6', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Medição Final', slug: 'medicao_final', cor: '#6366f1', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pré-executivo', slug: 'pre_executivo', cor: '#8b5cf6', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Fila Projeto Executivo', slug: 'fila_projeto_executivo', cor: '#a855f7', ordem: 10, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Adequação', slug: 'adequacao', cor: '#ec4899', ordem: 11, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Auditoria Projeto', slug: 'auditoria_projeto', cor: '#14b8a6', ordem: 12, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Assinatura Executiva', slug: 'assinatura_executiva', cor: '#10b981', ordem: 13, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Codificação', slug: 'em_codificacao', cor: '#0ea5e9', ordem: 14, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Postagem', slug: 'postagem', cor: '#16a34a', ordem: 15, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
          ],
        },
        {
          nome: 'Pós-venda - Entrega e Montagem',
          slug: 'pos_venda_entrega_montagem',
          descricao: 'Produção industrial, vistoria, entrega, montagem e relatório final de obra',
          cor: '#059669',
          ordem: 3,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Aguardando Produção', slug: 'aguardando_producao', cor: '#f59e0b', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pronto pra Indústria', slug: 'pronto_industria', cor: '#0284c7', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Vistoria para Montagem', slug: 'vistoria_montagem', cor: '#6366f1', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Entrega Agendada', slug: 'entrega_agendada', cor: '#8b5cf6', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Em Montagem', slug: 'em_montagem', cor: '#06b6d4', ordem: 5, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Checklist Final', slug: 'checklist_final', cor: '#14b8a6', ordem: 6, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Montagem Finalizada', slug: 'montagem_finalizada', cor: '#10b981', ordem: 7, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalizada com Pendência', slug: 'finalizada_com_pendencia', cor: '#f97316', ordem: 8, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Relatório de Obra', slug: 'relatorio_obra', cor: '#16a34a', ordem: 9, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
          ],
        },
        {
          nome: 'Pós-venda - Assistência Técnica',
          slug: 'pos_venda_assistencia_tecnica',
          descricao: 'Acompanhamento de solicitações de Assistência Técnica (AT) e pós-venda concluído',
          cor: '#7c3aed',
          ordem: 4,
          is_active: true,
          is_sistema: false,
          etapas: [
            { nome: 'Aguardando Abertura de AT', slug: 'aguardando_abertura_at', cor: '#f59e0b', ordem: 1, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'AT Aberta', slug: 'at_aberta', cor: '#ef4444', ordem: 2, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Finalizada', slug: 'at_finalizada', cor: '#10b981', ordem: 3, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'aberta', is_sistema: false },
            { nome: 'Pós-venda', slug: 'pos_venda_concluido', cor: '#16a34a', ordem: 4, exige_qualificacao: true, exige_motivo_perda: false, tipo_estagio: 'ganho', is_sistema: false },
          ],
        },
      ]

      for (const q of quadrosPadrao) {
        const [insertedQuadro] = await db
          .table('kanban_quadros_catalogo')
          .insert({
            nome: q.nome,
            slug: q.slug,
            descricao: q.descricao,
            cor: q.cor,
            ordem: q.ordem,
            is_active: q.is_active,
            is_sistema: q.is_sistema,
            created_at: now,
            updated_at: now,
          })
          .returning('id')

        const quadroId = typeof insertedQuadro === 'object' ? insertedQuadro.id : insertedQuadro

        for (const e of q.etapas) {
          await db.table('kanban_etapas_catalogo').insert({
            quadro_id: quadroId,
            nome: e.nome,
            slug: e.slug,
            cor: e.cor,
            ordem: e.ordem,
            exige_qualificacao: e.exige_qualificacao,
            exige_motivo_perda: e.exige_motivo_perda,
            tipo_estagio: e.tipo_estagio,
            is_active: true,
            is_sistema: e.is_sistema,
            created_at: now,
            updated_at: now,
          })
        }
      }
    }
  }
}
