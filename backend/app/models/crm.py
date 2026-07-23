from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Date, Float
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
    WHATSAPP = "whatsapp"
    TELEFONE = "telefone"
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


class TipoArquiteto(str, enum.Enum):
    ARQUITETO = "arquiteto"
    ENGENHEIRO = "engenheiro"
    DESIGNER = "designer"
    CORRETOR = "corretor"
    OUTRO = "outro"


class TipoInteracaoArquiteto(str, enum.Enum):
    VISITA_ESCRITORIO = "visita_escritorio"
    LIGACAO = "ligacao"
    VISITA_LOJA = "visita_loja"
    EVENTO = "evento"
    VIAGEM = "viagem"
    ENVIO_BRINDE = "envio_brinde"
    INDICACAO_LEAD = "indicacao_lead"


class MotivoIndisponibilidade(str, enum.Enum):
    ATENDIMENTO_MARCADO = "atendimento_marcado"
    ORCAMENTO_PEDIDO = "orcamento_pedido"
    ALMOCO = "almoco"
    OUTRO = "outro"


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
    criado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

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
    criado_por = relationship("User", foreign_keys=[criado_por_id])
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

    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projetos = relationship("Projeto", back_populates="cliente")
    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])

    def __repr__(self):
        return f"<Cliente {self.nome}>"


class Arquiteto(Base):
    __tablename__ = "arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    tipo = Column(SAEnum(TipoArquiteto), nullable=True)
    escritorio = Column(String(200), nullable=True)
    endereco_escritorio = Column(String(300), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True, unique=True)
    nivel_parceria = Column(String(50), default="parceiro")  # parceiro, premium, vip
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    vendedor = relationship("User", foreign_keys=[vendedor_id])
    interacoes = relationship(
        "InteracaoArquiteto", back_populates="arquiteto", cascade="all",
        order_by="(InteracaoArquiteto.criado_em.desc(), InteracaoArquiteto.id.desc())",
    )
    funcionarios = relationship(
        "FuncionarioArquiteto", back_populates="arquiteto", cascade="all, delete-orphan",
    )

    @property
    def vendedor_nome(self):
        return self.vendedor.nome if self.vendedor else None

    def __repr__(self):
        return f"<Arquiteto {self.nome}>"


class InteracaoArquiteto(Base):
    """Histórico estruturado de interações com o arquiteto/especificador. Append-only."""
    __tablename__ = "interacoes_arquiteto"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo = Column(SAEnum(TipoInteracaoArquiteto), nullable=False)
    observacao = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", back_populates="interacoes")
    autor = relationship("User", foreign_keys=[autor_id])

    @property
    def autor_nome(self):
        return self.autor.nome if self.autor else None


class FuncionarioArquiteto(Base):
    """Funcionários do escritório do arquiteto/especificador — aba Decisores."""
    __tablename__ = "funcionarios_arquiteto"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    funcao = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    decisor = Column(Boolean, default=False)

    arquiteto = relationship("Arquiteto", back_populates="funcionarios")


class DecisorArquiteto(Base):
    """Contato dentro de um escritório de arquitetura (RN — decisores multi-contato)."""
    __tablename__ = "decisores_arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)

    nome = Column(String(200), nullable=False)
    cargo = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    is_principal = Column(Boolean, default=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])

    def __repr__(self):
        return f"<DecisorArquiteto {self.nome} [arquiteto={self.arquiteto_id}]>"


class ConcorrenteArquiteto(Base):
    """Percepção manual de onde o arquiteto costuma fechar com a concorrência.
    Dado subjetivo — nunca entra no cálculo automático de score."""
    __tablename__ = "concorrentes_arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)

    nome_concorrente = Column(String(200), nullable=False)
    percentual_fechamento_estimado = Column(Float, nullable=False)  # 0-100
    observacoes = Column(Text, nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    def __repr__(self):
        return f"<ConcorrenteArquiteto {self.nome_concorrente} [arquiteto={self.arquiteto_id}]>"


class FilaAtendimento(Base):
    """Fila de vendedores para atendimento presencial — um registro "vivo" por
    vendedor. "Ativo hoje" é recalculado na leitura comparando data_referencia
    com a data atual (ver fila_atendimento_service.listar_fila_vendedores) —
    não existe job de reset à meia-noite."""
    __tablename__ = "fila_atendimento"

    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    posicao = Column(Integer, nullable=False)
    disponivel = Column(Boolean, default=True, nullable=False)
    motivo_indisponivel_categoria = Column(SAEnum(MotivoIndisponibilidade), nullable=True)
    motivo_indisponivel_obs = Column(Text, nullable=True)
    checkin_em = Column(DateTime(timezone=True), nullable=True)
    ativo_hoje = Column(Boolean, default=False, nullable=False)
    data_referencia = Column(Date, nullable=True)

    vendedor = relationship("User", foreign_keys=[vendedor_id])

    @property
    def vendedor_nome(self):
        return self.vendedor.nome if self.vendedor else None

    def __repr__(self):
        return f"<FilaAtendimento vendedor={self.vendedor_id} pos={self.posicao}>"


class ConfigFilaAtendimento(Base):
    """Configuração (singleton) dos limiares de alerta/escalonamento da fila de
    aguardando — mesmo padrão de ConfigWIPProjetista em app/models/projeto.py."""
    __tablename__ = "config_fila_atendimento"

    id = Column(Integer, primary_key=True, index=True)
    minutos_alerta = Column(Integer, default=15, nullable=False)
    minutos_escalonamento = Column(Integer, default=30, nullable=False)
