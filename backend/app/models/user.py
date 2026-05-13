from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class PerfilUsuario(str, enum.Enum):
    """14 perfis definidos no SRS v3.0 — Seção 2."""
    DIRETORIA = "diretoria"
    GERENTE_COMERCIAL = "gerente_comercial"
    VENDEDOR = "vendedor"
    RECEPCAO = "recepcao"
    PROJETISTA = "projetista"
    CONFERENTE = "conferente"
    SUPERVISOR_MONTAGEM = "supervisor_montagem"
    GESTOR_LOGISTICA = "gestor_logistica"
    SAC = "sac"
    FINANCEIRO = "financeiro"
    MONTADOR_PROPRIO = "montador_proprio"
    MONTADOR_TERCEIRO = "montador_terceiro"
    ARQUITETO = "arquiteto"
    CLIENTE = "cliente"


# Perfis com acesso total ao sistema
PERFIS_GESTAO = [
    PerfilUsuario.DIRETORIA,
    PerfilUsuario.GERENTE_COMERCIAL,
]

# Perfis internos (equipe)
PERFIS_INTERNOS = [
    PerfilUsuario.DIRETORIA,
    PerfilUsuario.GERENTE_COMERCIAL,
    PerfilUsuario.VENDEDOR,
    PerfilUsuario.RECEPCAO,
    PerfilUsuario.PROJETISTA,
    PerfilUsuario.CONFERENTE,
    PerfilUsuario.SUPERVISOR_MONTAGEM,
    PerfilUsuario.GESTOR_LOGISTICA,
    PerfilUsuario.SAC,
    PerfilUsuario.FINANCEIRO,
    PerfilUsuario.MONTADOR_PROPRIO,
    PerfilUsuario.MONTADOR_TERCEIRO,
]

# Perfis externos (portais)
PERFIS_EXTERNOS = [
    PerfilUsuario.ARQUITETO,
    PerfilUsuario.CLIENTE,
]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    telefone = Column(String(20), nullable=True)
    hashed_password = Column(String(500), nullable=False)
    perfil = Column(SAEnum(PerfilUsuario), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Audit
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    ultimo_login = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User {self.email} [{self.perfil}]>"
