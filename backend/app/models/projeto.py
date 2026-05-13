from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Float, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class StatusProjeto(str, enum.Enum):
    # Etapas do fluxo completo (SRS Seção 4)
    NOVO_LEAD = "novo_lead"
    QUALIFICANDO = "qualificando"
    EM_VISITA = "em_visita"
    EM_BRIEFING = "em_briefing"
    NA_FILA = "na_fila"
    EM_PROJETO = "em_projeto"
    AGUARD_VALIDACAO = "aguard_validacao"
    EM_RENDER = "em_render"
    AGUARD_APRESENTACAO = "aguard_apresentacao"
    EM_AJUSTE = "em_ajuste"
    EM_FECHAMENTO = "em_fechamento"
    AGUARD_ASSINATURA = "aguard_assinatura"
    EM_HANDOFF = "em_handoff"
    CONTATO_CONF = "contato_conf"
    VALIDANDO_OBRA = "validando_obra"
    EM_MEDICAO = "em_medicao"
    EM_ADEQUACAO = "em_adequacao"
    ALINHANDO_CLIENTE = "alinhando_cliente"
    EM_AUDITORIA = "em_auditoria"
    AGUARD_ASSINATURA_TEC = "aguard_assinatura_tec"
    EM_PRODUCAO = "em_producao"
    PRE_MONTAGEM = "pre_montagem"
    AGUARD_MERCADORIA = "aguard_mercadoria"
    ENTREGA_AGENDADA = "entrega_agendada"
    EM_ENTREGA = "em_entrega"
    EM_MONTAGEM = "em_montagem"
    COM_OCORRENCIA = "com_ocorrencia"
    CHECKLIST_FINAL = "checklist_final"
    POS_VENDA = "pos_venda"
    EM_AT = "em_at"
    RELACIONAMENTO = "relacionamento"
    CONCLUIDO = "concluido"
    CANCELADO = "cancelado"


# Labels amigáveis para exibir ao cliente (SRS Seção 4)
STATUS_LABEL_CLIENTE = {
    StatusProjeto.EM_BRIEFING: "Estamos coletando suas informações",
    StatusProjeto.NA_FILA: "Seu projeto está aguardando início",
    StatusProjeto.EM_PROJETO: "Seu projeto está sendo desenvolvido",
    StatusProjeto.EM_RENDER: "Finalizando a apresentação do seu projeto",
    StatusProjeto.AGUARD_APRESENTACAO: "Apresentação agendada",
    StatusProjeto.EM_AJUSTE: "Realizando ajustes no projeto",
    StatusProjeto.EM_FECHAMENTO: "Finalizando contrato",
    StatusProjeto.EM_MEDICAO: "Conferente técnico visitando a obra",
    StatusProjeto.EM_ADEQUACAO: "Seu projeto está em adequação técnica",
    StatusProjeto.EM_PRODUCAO: "Seus móveis estão sendo produzidos",
    StatusProjeto.ENTREGA_AGENDADA: "Entrega agendada",
    StatusProjeto.EM_MONTAGEM: "Equipe de montagem na sua obra",
    StatusProjeto.POS_VENDA: "Projeto concluído",
}


class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, index=True)  # ex: PROJ-2024-001

    # Relações principais
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    projetista_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    conferente_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)

    # Status e fluxo
    status = Column(SAEnum(StatusProjeto), default=StatusProjeto.EM_BRIEFING)
    status_anterior = Column(SAEnum(StatusProjeto), nullable=True)
    status_alterado_em = Column(DateTime(timezone=True), nullable=True)
    status_alterado_por = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Informações comerciais
    valor_contrato = Column(Float, nullable=True)
    prazo_entrega_estimado = Column(Date, nullable=True)

    # Controle de SLA — RN016: alerta se parado > 5 dias
    ultima_movimentacao = Column(DateTime(timezone=True), server_default=func.now())
    alerta_parado = Column(Boolean, default=False)

    # Auditoria
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # RN017: projetos nunca são deletados, apenas arquivados
    arquivado = Column(Boolean, default=False)
    arquivado_em = Column(DateTime(timezone=True), nullable=True)
    arquivado_motivo = Column(Text, nullable=True)

    # Relationships
    cliente = relationship("Cliente", back_populates="projetos")
    vendedor = relationship("User", foreign_keys=[vendedor_id])
    projetista = relationship("User", foreign_keys=[projetista_id])
    conferente = relationship("User", foreign_keys=[conferente_id])
    arquiteto = relationship("Arquiteto")
    briefing = relationship("Briefing", back_populates="projeto", uselist=False)
    historico_status = relationship("HistoricoStatusProjeto", back_populates="projeto")

    def __repr__(self):
        return f"<Projeto {self.codigo} [{self.status}]>"


class HistoricoStatusProjeto(Base):
    """Log imutável de todas as mudanças de status do projeto."""
    __tablename__ = "historico_status_projeto"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    status_de = Column(SAEnum(StatusProjeto), nullable=True)
    status_para = Column(SAEnum(StatusProjeto), nullable=False)
    alterado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    observacao = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    projeto = relationship("Projeto", back_populates="historico_status")
    alterado_por = relationship("User", foreign_keys=[alterado_por_id])


class TipoAmbiente(str, enum.Enum):
    COZINHA = "cozinha"
    CLOSET = "closet"
    DORMITORIO = "dormitorio"
    SALA = "sala"
    BANHEIRO = "banheiro"
    LAVABO = "lavabo"
    HOME_OFFICE = "home_office"
    GOURMET = "gourmet"
    AREA_SERVICO = "area_servico"
    OUTRO = "outro"


class Briefing(Base):
    """RF007-RF012 — Formulário inteligente com score e travas."""
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), unique=True, nullable=False)

    # Dados básicos do cliente/obra
    cidade_obra = Column(String(100), nullable=True)
    estado_obra = Column(String(2), nullable=True)
    endereco_obra = Column(String(300), nullable=True)

    # Escopo
    ambientes = Column(JSON, nullable=True)  # lista de TipoAmbiente
    prazo_desejado = Column(Date, nullable=True)
    faixa_investimento_min = Column(Float, nullable=True)
    faixa_investimento_max = Column(Float, nullable=True)

    # Referências e estilo
    estilo_preferido = Column(String(100), nullable=True)
    observacoes = Column(Text, nullable=True)
    referencias_url = Column(JSON, nullable=True)  # lista de URLs de arquivos

    # Score de qualidade — RF009
    score = Column(Float, default=0.0)
    score_minimo = Column(Float, default=70.0)
    score_detalhes = Column(JSON, nullable=True)  # breakdown por critério

    # Arquiteto vinculado — RF011
    arquiteto_nome = Column(String(200), nullable=True)
    arquiteto_email = Column(String(200), nullable=True)
    arquiteto_telefone = Column(String(20), nullable=True)

    # Status
    status = Column(String(50), default="rascunho")  # rascunho, enviado, aprovado, devolvido
    enviado_em = Column(DateTime(timezone=True), nullable=True)
    aprovado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    aprovado_em = Column(DateTime(timezone=True), nullable=True)
    motivo_devolucao = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projeto = relationship("Projeto", back_populates="briefing")
    ambientes_detalhados = relationship("AmbienteBriefing", back_populates="briefing", cascade="all, delete-orphan")


class AmbienteBriefing(Base):
    """Detalhamento por ambiente dentro do briefing."""
    __tablename__ = "ambientes_briefing"

    id = Column(Integer, primary_key=True, index=True)
    briefing_id = Column(Integer, ForeignKey("briefings.id"), nullable=False)

    tipo = Column(SAEnum(TipoAmbiente), nullable=False)
    descricao = Column(Text, nullable=True)
    medidas_preliminares = Column(String(200), nullable=True)
    observacoes_especificas = Column(Text, nullable=True)

    briefing = relationship("Briefing", back_populates="ambientes_detalhados")


class FilaProjeto(Base):
    """RF013-RF017 — Fila com WIP limit e controle de capacidade."""
    __tablename__ = "fila_projetos"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), unique=True, nullable=False)
    projetista_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Prioridade e SLA
    prioridade = Column(Integer, default=5)  # 1=urgente, 10=baixa
    categoria = Column(String(50), nullable=True)  # residencial, comercial, corporativo
    sla_dias = Column(Integer, default=7)
    sla_vence_em = Column(Date, nullable=True)
    sla_alerta_disparado = Column(Boolean, default=False)

    # Controle de alocação
    data_entrada_fila = Column(DateTime(timezone=True), server_default=func.now())
    data_alocacao = Column(DateTime(timezone=True), nullable=True)
    data_conclusao = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(String(30), default="aguardando")  # aguardando, alocado, em_andamento, concluido

    projeto = relationship("Projeto")
    projetista = relationship("User", foreign_keys=[projetista_id])


class ConfigWIPProjetista(Base):
    """Configuração do WIP limit por projetista — RF014, RN003."""
    __tablename__ = "config_wip_projetistas"

    id = Column(Integer, primary_key=True, index=True)
    projetista_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    wip_limit = Column(Integer, default=3)  # máximo de projetos simultâneos
    ativo = Column(Boolean, default=True)

    projetista = relationship("User", foreign_keys=[projetista_id])
