from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Float, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ProjetoComercial(Base):
    """RF018-RF023 — Desenvolvimento com versionamento e validação."""
    __tablename__ = "projetos_comerciais"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)

    versao = Column(Integer, default=1)
    arquivo_url = Column(String(500), nullable=True)
    descricao_alteracao = Column(Text, nullable=True)

    # Controle de validação — RF018, RN004
    status = Column(String(50), default="em_desenvolvimento")
    # em_desenvolvimento | aguard_validacao_vendedor | aprovado | devolvido | em_render | finalizado

    # Aprovação/devolução pelo vendedor (antes do render)
    submetido_para_validacao_em = Column(DateTime(timezone=True), nullable=True)
    validado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    validado_em = Column(DateTime(timezone=True), nullable=True)
    motivo_devolucao = Column(Text, nullable=True)

    # Contagem de apresentações/reapresentações — RF022, RF023
    numero_apresentacao = Column(Integer, default=0)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    criado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    projeto = relationship("Projeto")
    validado_por = relationship("User", foreign_keys=[validado_por_id])
    criado_por = relationship("User", foreign_keys=[criado_por_id])


class Fechamento(Base):
    """RF024-RF028 — Checklist de fechamento e geração de contrato."""
    __tablename__ = "fechamentos"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), unique=True, nullable=False)

    # Checklist de fechamento — RF024, RN006
    checklist_json = Column(JSON, nullable=True)
    checklist_completo = Column(Boolean, default=False)

    # Aprovação financeira — RF025
    cadastro_aprovado = Column(Boolean, default=False)
    cadastro_aprovado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Datas
    data_fechamento = Column(DateTime(timezone=True), nullable=True)
    data_limite_assinatura = Column(Date, nullable=True)
    contrato_assinado_em = Column(DateTime(timezone=True), nullable=True)

    # Documentos
    contrato_url = Column(String(500), nullable=True)
    caderno_comercial_url = Column(String(500), nullable=True)

    # Onboarding — RF028
    onboarding_disparado = Column(Boolean, default=False)
    onboarding_disparado_em = Column(DateTime(timezone=True), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    projeto = relationship("Projeto")
    parcelas = relationship("Parcela", back_populates="fechamento", cascade="all, delete-orphan")


class Parcela(Base):
    __tablename__ = "parcelas"

    id = Column(Integer, primary_key=True, index=True)
    fechamento_id = Column(Integer, ForeignKey("fechamentos.id"), nullable=False)

    numero = Column(Integer, nullable=False)
    valor = Column(Float, nullable=False)
    vencimento = Column(Date, nullable=False)
    status = Column(String(30), default="pendente")  # pendente | pago | vencido | cancelado
    data_pagamento = Column(Date, nullable=True)
    forma_pagamento = Column(String(50), nullable=True)
    comprovante_url = Column(String(500), nullable=True)

    fechamento = relationship("Fechamento", back_populates="parcelas")


class Handoff(Base):
    """RF029-RF031 — Passagem formal comercial → técnico."""
    __tablename__ = "handoffs"

    ITENS_OBRIGATORIOS = [
        "contrato_assinado",
        "caderno_comercial",
        "plantas_arquitetonicas",
        "fotos_ambiente",
        "briefing_completo",
        "aprovacao_financeira",
        "pedido_gerado",
        "dados_obra",
    ]

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), unique=True, nullable=False)

    # Checklist com 8 itens obrigatórios — RF029, RF030
    checklist_json = Column(JSON, nullable=True)  # {item: bool}
    checklist_completo = Column(Boolean, default=False)

    # Registro de quem liberou — RF031
    liberado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    liberado_em = Column(DateTime(timezone=True), nullable=True)
    observacoes = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    projeto = relationship("Projeto")
    liberado_por = relationship("User", foreign_keys=[liberado_por_id])
