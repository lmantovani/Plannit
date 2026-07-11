# Importar todos os models para garantir registro no SQLAlchemy
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, InteracaoLead, Cliente, Arquiteto, DecisorArquiteto
from app.models.projeto import (
    Projeto, HistoricoStatusProjeto, StatusProjeto,
    Briefing, AmbienteBriefing, TipoAmbiente,
    FilaProjeto, ConfigWIPProjetista,
)
from app.models.fechamento import ProjetoComercial, Fechamento, Parcela, Handoff
from app.models.notificacao import Notificacao, TipoNotificacao

__all__ = [
    "User", "PerfilUsuario",
    "Lead", "InteracaoLead", "Cliente", "Arquiteto", "DecisorArquiteto",
    "Projeto", "HistoricoStatusProjeto", "StatusProjeto",
    "Briefing", "AmbienteBriefing", "TipoAmbiente",
    "FilaProjeto", "ConfigWIPProjetista",
    "ProjetoComercial", "Fechamento", "Parcela", "Handoff",
    "Notificacao", "TipoNotificacao",
]
