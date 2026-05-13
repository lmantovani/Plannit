"""
Serviço de controle de WIP limit — RF014, RN003
Impede alocação de projeto acima da capacidade configurada por projetista.
"""
from sqlalchemy.orm import Session
from app.models.projeto import FilaProjeto, ConfigWIPProjetista


def get_wip_atual(db: Session, projetista_id: int) -> int:
    """Conta quantos projetos o projetista tem em andamento agora."""
    return (
        db.query(FilaProjeto)
        .filter(
            FilaProjeto.projetista_id == projetista_id,
            FilaProjeto.status.in_(["alocado", "em_andamento"]),
        )
        .count()
    )


def get_wip_limit(db: Session, projetista_id: int) -> int:
    """Retorna o WIP limit configurado para o projetista (padrão: 3)."""
    config = (
        db.query(ConfigWIPProjetista)
        .filter(ConfigWIPProjetista.projetista_id == projetista_id)
        .first()
    )
    return config.wip_limit if config else 3


def pode_alocar(db: Session, projetista_id: int) -> dict:
    """
    Verifica se projetista pode receber novo projeto.
    Retorna: {pode: bool, wip_atual: int, wip_limit: int, mensagem: str}
    """
    wip_atual = get_wip_atual(db, projetista_id)
    wip_limit = get_wip_limit(db, projetista_id)
    pode = wip_atual < wip_limit

    return {
        "pode": pode,
        "wip_atual": wip_atual,
        "wip_limit": wip_limit,
        "mensagem": (
            f"Projetista disponível ({wip_atual}/{wip_limit} projetos ativos)"
            if pode
            else f"WIP limit atingido: projetista já tem {wip_atual} de {wip_limit} projetos ativos"
        ),
    }


def listar_projetistas_disponiveis(db: Session, projetistas_ids: list) -> list:
    """Retorna lista de projetistas com capacidade disponível."""
    disponiveis = []
    for pid in projetistas_ids:
        status = pode_alocar(db, pid)
        if status["pode"]:
            disponiveis.append({"projetista_id": pid, **status})
    return disponiveis
