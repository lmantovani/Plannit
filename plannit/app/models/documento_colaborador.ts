import { DocumentosColaboradoreSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Colaborador from '#models/colaborador'

export enum TipoDocumentoColaborador {
  CTPS = 'ctps',
  ASO_ADMISSIONAL = 'aso_admissional',
  CONTRATO_ASSINADO = 'contrato_assinado',
  EXAME_PERIODICO = 'exame_periodico',
  CERTIDAO = 'certidao',
  PIS_PASEP = 'pis_pasep',
  OUTRO = 'outro',
}

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoColaborador, string> = {
  [TipoDocumentoColaborador.CTPS]: 'Carteira de Trabalho (CTPS)',
  [TipoDocumentoColaborador.ASO_ADMISSIONAL]: 'ASO Admissional',
  [TipoDocumentoColaborador.CONTRATO_ASSINADO]: 'Contrato Assinado',
  [TipoDocumentoColaborador.EXAME_PERIODICO]: 'Exame Periódico',
  [TipoDocumentoColaborador.CERTIDAO]: 'Certidão',
  [TipoDocumentoColaborador.PIS_PASEP]: 'PIS / PASEP',
  [TipoDocumentoColaborador.OUTRO]: 'Outro Documento',
}

export default class DocumentoColaborador extends DocumentosColaboradoreSchema {
  static table = 'documentos_colaboradores'

  @belongsTo(() => Colaborador, { foreignKey: 'colaboradorId' })
  declare colaborador: BelongsTo<typeof Colaborador>
}
