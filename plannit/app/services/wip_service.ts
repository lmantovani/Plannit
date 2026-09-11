/**
 * Serviço de controle de WIP limit — RF014, RN003
 * Impede alocação de projeto acima da capacidade configurada por projetista.
 */

import FilaProjeto, { StatusFila } from '#models/fila_projeto'
import ConfigWipProjetista from '#models/config_wip_projetista'
import User, { PerfilUsuario } from '#models/user'

export interface PodeAlocarResult {
  pode: boolean
  wipAtual: number
  wipLimit: number
  vagasDisponiveis: number
  porcentagemOcupacao: number
  mensagem: string
}

export interface ProjetistaCapacidade extends PodeAlocarResult {
  id: number
  nome: string
  email: string
  telefone: string | null
  initials: string
}

/**
 * Conta quantos projetos o projetista tem em andamento agora (alocado ou em_andamento).
 */
export async function getWipAtual(projetistaId: number): Promise<number> {
  const result = await FilaProjeto.query()
    .where('projetista_id', projetistaId)
    .whereIn('status', [StatusFila.ALOCADO, StatusFila.EM_ANDAMENTO])
    .count('* as total')

  return Number(result[0]?.$extras?.total || 0)
}

/**
 * Retorna o WIP limit configurado para o projetista (padrão: 3).
 */
export async function getWipLimit(projetistaId: number): Promise<number> {
  const config = await ConfigWipProjetista.query()
    .where('projetista_id', projetistaId)
    .where('ativo', true)
    .first()

  return config ? Number(config.wipLimit) : 3
}

/**
 * Verifica se projetista pode receber novo projeto (RN003).
 */
export async function podeAlocar(projetistaId: number): Promise<PodeAlocarResult> {
  const wipAtual = await getWipAtual(projetistaId)
  const wipLimit = await getWipLimit(projetistaId)
  const pode = wipAtual < wipLimit
  const vagasDisponiveis = Math.max(0, wipLimit - wipAtual)
  const porcentagemOcupacao = wipLimit > 0 ? Math.round((wipAtual / wipLimit) * 100) : 100

  const mensagem = pode
    ? `Projetista disponível (${wipAtual}/${wipLimit} projetos ativos, ${vagasDisponiveis} vaga${vagasDisponiveis > 1 ? 's' : ''} livre${vagasDisponiveis > 1 ? 's' : ''})`
    : `Limite WIP atingido (RN003): projetista já possui ${wipAtual} de ${wipLimit} projetos ativos`

  return {
    pode,
    wipAtual,
    wipLimit,
    vagasDisponiveis,
    porcentagemOcupacao,
    mensagem,
  }
}

/**
 * Lista todos os projetistas ativos com seus status de WIP e capacidade.
 */
export async function listarProjetistasComCapacidade(): Promise<ProjetistaCapacidade[]> {
  const projetistas = await User.query()
    .where('perfil', PerfilUsuario.PROJETISTA)
    .where('is_active', true)
    .orderBy('nome', 'asc')

  const resultados: ProjetistaCapacidade[] = []

  for (const p of projetistas) {
    const status = await podeAlocar(p.id)
    resultados.push({
      id: p.id,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      initials: p.initials,
      ...status,
    })
  }

  // Ordena: disponíveis primeiro (maior número de vagas), depois por menor taxa de ocupação
  return resultados.sort((a, b) => {
    if (a.pode !== b.pode) {
      return a.pode ? -1 : 1
    }
    return a.porcentagemOcupacao - b.porcentagemOcupacao
  })
}

/**
 * Atualiza ou define o limite WIP de um projetista (Apenas Gestão).
 */
export async function configurarWipLimit(
  projetistaId: number,
  wipLimit: number
): Promise<ConfigWipProjetista> {
  const config = await ConfigWipProjetista.updateOrCreate(
    { projetistaId },
    {
      projetistaId,
      wipLimit: Math.max(1, wipLimit),
      ativo: true,
    }
  )

  return config
}
