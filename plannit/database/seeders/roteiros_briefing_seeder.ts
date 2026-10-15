import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import RoteiroBriefing from '#models/roteiro_briefing'
import RoteiroBriefingAmbiente from '#models/roteiro_briefing_ambiente'

// Mapeamento padrão dos ambientes para os 18 roteiros estruturados
const AMBIENTES_POR_SLUG: Record<string, string[]> = {
  living: ['Living', 'Sala de Estar'],
  home_theater: ['Home Theater', 'Sala de TV'],
  quarto_casal: ['Suíte Master', 'Quarto do Casal'],
  quarto_filhos: ['Quarto do Filho', 'Quarto da Filha', 'Quarto de Visita', 'Dormitório Infantil'],
  closet: ['Closet'],
  cozinha: ['Cozinha'],
  area_gourmet: ['Espaço Gourmet', 'Varanda', 'Varanda Gourmet'],
  banheiros: ['Banheiro', 'Banheiro Social'],
  banheiro_suite_master: ['Banheiro Suíte Master'],
  lavabo: ['Lavabo'],
  home_office: ['Home Office', 'Escritório'],
  lavanderia: ['Área de Serviço', 'Lavanderia'],
  adega: ['Adega'],
  despensa: ['Despensa'],
  hall_entrada: ['Hall de Entrada'],
  louceiro: ['Louceiro'],
  rouparia: ['Rouparia'],
  sala_jantar: ['Sala de Jantar'],
}

export default class extends BaseSeeder {
  async run() {
    const caminhoLib = '../../inertia/lib/roteiros_briefings.js'
    const { ROTEIROS_BRIEFINGS, LISTA_ROTEIROS } = await import(caminhoLib)

    await db.transaction(async (trx) => {
      let ordem = 10
      for (const item of LISTA_ROTEIROS) {
        const dadosRoteiro = ROTEIROS_BRIEFINGS[item.slug]
        if (!dadosRoteiro) continue

        const roteiro = await RoteiroBriefing.updateOrCreate(
          { slug: item.slug },
          {
            titulo: dadosRoteiro.titulo,
            subtitulo: dadosRoteiro.subtitulo,
            secoes: dadosRoteiro.secoes,
            isActive: true,
            ordem: ordem,
          },
          { client: trx }
        )

        // Ambientes associados ao roteiro
        const ambientesAssociados = AMBIENTES_POR_SLUG[item.slug] || [dadosRoteiro.titulo]

        for (const ambNome of ambientesAssociados) {
          await RoteiroBriefingAmbiente.firstOrCreate(
            {
              roteiroId: roteiro.id,
              ambienteNome: ambNome,
            },
            {
              roteiroId: roteiro.id,
              ambienteNome: ambNome,
            },
            { client: trx }
          )
        }

        ordem += 10
      }
    })
  }
}
