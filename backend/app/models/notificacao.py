from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class TipoNotificacao(str, enum.Enum):
    # Alertas internos (SRS 8.1)
    LEAD_SEM_INTERACAO = "lead_sem_interacao"
    BRIEFING_SCORE_BAIXO = "briefing_score_baixo"
    WIP_LIMIT_ATINGIDO = "wip_limit_atingido"
    VERSAO_BASE_AGUARDANDO = "versao_base_aguardando"
    EXCESSO_REAPRESENTACOES = "excesso_reapresentacoes"
    CONTRATO_SEM_ASSINATURA = "contrato_sem_assinatura"
    HANDOFF_BLOQUEADO = "handoff_bloqueado"
    SLA_CONTATO_CONFERENTE = "sla_contato_conferente"
    OBRA_REPROVADA = "obra_reprovada"
    SLA_ADEQUACAO_VENCENDO = "sla_adequacao_vencendo"
    AUDITORIA_PENDENTE = "auditoria_pendente"
    NOVA_VERSAO_DOCUMENTO = "nova_versao_documento"
    PEDIDO_PARCIAL_PENDENTE = "pedido_parcial_pendente"
    PRAZO_FABRICA_5_DIAS = "prazo_fabrica_5_dias"
    PRAZO_FABRICA_VENCIDO = "prazo_fabrica_vencido"
    PRE_MONTAGEM_PENDENTE = "pre_montagem_pendente"
    OCORRENCIA_MONTAGEM = "ocorrencia_montagem"
    SLA_AT_VENCENDO = "sla_at_vencendo"
    AT_CAUSA_REPETIDA = "at_causa_repetida"
    PROJETO_PARADO = "projeto_parado"


class CanalNotificacao(str, enum.Enum):
    PUSH = "push"
    EMAIL = "email"
    TELA = "tela"
    WHATSAPP = "whatsapp"


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(SAEnum(TipoNotificacao), nullable=False)
    titulo = Column(String(200), nullable=False)
    mensagem = Column(Text, nullable=False)

    destinatario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=True)

    canal = Column(SAEnum(CanalNotificacao), default=CanalNotificacao.TELA)
    lida = Column(Boolean, default=False)
    lida_em = Column(DateTime(timezone=True), nullable=True)

    data_disparo = Column(DateTime(timezone=True), server_default=func.now())
    dados_extras = Column(JSON, nullable=True)

    destinatario = relationship("User", foreign_keys=[destinatario_id])
    projeto = relationship("Projeto")
