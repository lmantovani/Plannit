from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OrigemLead(str, enum.Enum):
    INSTAGRAM = "instagram"
    INDICACAO = "indicacao"
    SITE_GOOGLE = "site_google"
    CONSTRUTORA = "construtora"
    SHOWROOM = "showroom"
    ARQUITETO = "arquiteto"
    OUTRO = "outro"


class StatusFunil(str, enum.Enum):
    NOVO_LEAD = "novo_lead"
    QUALIFICANDO = "qualificando"
    EM_VISITA = "em_visita"
    EM_BRIEFING = "em_briefing"
    EM_PROJETO = "em_projeto"
    EM_NEGOCIACAO = "em_negociacao"
    FECHADO = "fechado"
    PERDIDO = "perdido"
    DESQUALIFICADO = "desqualificado"


class TipoCliente(str, enum.Enum):
    PESSOA_FISICA = "pessoa_fisica"
    PESSOA_JURIDICA = "pessoa_juridica"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    telefone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)

    origem = Column(SAEnum(OrigemLead), nullable=False, default=OrigemLead.OUTRO)
    campanha = Column(String(200), nullable=True)  # ex: "Google Ads - Cozinha Nov24"
    status_funil = Column(SAEnum(StatusFunil), nullable=False, default=StatusFunil.NOVO_LEAD)

    # Relações
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)

    # Qualificação
    qualificado = Column(Boolean, default=False)
    motivo_perda = Column(Text, nullable=True)  # Obrigatório ao marcar Perdido (RN001)
    concorrente_perdido = Column(String(200), nullable=True)

    # Conversão
    convertido_em_cliente = Column(Boolean, default=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

    # Audit
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    ultima_interacao_em = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    vendedor = relationship("User", foreign_keys=[vendedor_id])
    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    interacoes = relationship("InteracaoLead", back_populates="lead", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lead {self.nome} [{self.status_funil}]>"


class InteracaoLead(Base):
    """RF003 — Histórico completo de interações com o lead."""
    __tablename__ = "interacoes_lead"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    responsavel_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    tipo = Column(String(50), nullable=False)  # ligacao, whatsapp, email, visita, reuniao
    resumo = Column(Text, nullable=False)
    data = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="interacoes")
    responsavel = relationship("User", foreign_keys=[responsavel_id])


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    cpf_cnpj = Column(String(20), unique=True, nullable=True, index=True)
    telefone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    endereco = Column(String(300), nullable=True)
    tipo = Column(SAEnum(TipoCliente), default=TipoCliente.PESSOA_FISICA)

    # Aprovação financeira
    cadastro_aprovado = Column(Boolean, default=False)
    cadastro_aprovado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    cadastro_aprovado_em = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projetos = relationship("Projeto", back_populates="cliente")

    def __repr__(self):
        return f"<Cliente {self.nome}>"


class Arquiteto(Base):
    __tablename__ = "arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    escritorio = Column(String(200), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True, unique=True)
    nivel_parceria = Column(String(50), default="parceiro")  # parceiro, premium, vip

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Arquiteto {self.nome}>"
