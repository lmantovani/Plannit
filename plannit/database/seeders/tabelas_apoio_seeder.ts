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
  }
}
