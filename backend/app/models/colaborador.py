from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Float, Text, Enum as SAEnum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class RegimeContratacao(str, enum.Enum):
    CLT = "clt"
    PJ = "pj"


class ModalidadeTrabalho(str, enum.Enum):
    PRESENCIAL = "presencial"
    HIBRIDO = "hibrido"
    REMOTO = "remoto"


class TipoComissao(str, enum.Enum):
    FIXO = "fixo"
    PERCENTUAL = "percentual"
    POR_META = "por_meta"


class TipoLancamentoVariavel(str, enum.Enum):
    BONUS = "bonus"
    COMISSAO = "comissao"


class Departamento(Base):
    __tablename__ = "departamentos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Departamento {self.nome}>"


class Cargo(Base):
    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    ativo = Column(Boolean, default=True)

    departamento = relationship("Departamento")

    @property
    def departamento_nome(self):
        return self.departamento.nome if self.departamento else None

    def __repr__(self):
        return f"<Cargo {self.nome}>"


class Colaborador(Base):
    __tablename__ = "colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Identificação
    nome = Column(String(200), nullable=False)
    cpf = Column(String(14), nullable=False, unique=True, index=True)
    rg = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    sexo = Column(String(20), nullable=True)
    estado_civil = Column(String(30), nullable=True)
    foto_url = Column(String(500), nullable=True)
    # Perfil comportamental — DISC geralmente vem em par (traço primário + secundário)
    perfil_disc_primario = Column(String(20), nullable=True)  # dominante | influente | estavel | cauteloso
    perfil_disc_secundario = Column(String(20), nullable=True)
    observacoes_comportamentais = Column(Text, nullable=True)

    # Contato
    telefone_pessoal = Column(String(20), nullable=True)
    telefone_corporativo = Column(String(20), nullable=True)
    email_pessoal = Column(String(200), nullable=True)
    email_corporativo = Column(String(200), nullable=True)
    endereco_logradouro = Column(String(300), nullable=True)
    endereco_numero = Column(String(20), nullable=True)
    endereco_complemento = Column(String(100), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_cep = Column(String(10), nullable=True)

    # Contratação
    data_admissao = Column(Date, nullable=False)
    cargo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    regime = Column(SAEnum(RegimeContratacao), nullable=False)
    tipo_contrato = Column(String(100), nullable=True)

    # PJ (condicional a regime == PJ)
    pj_cnpj = Column(String(20), nullable=True)
    pj_contrato_url = Column(String(500), nullable=True)
    pj_valor_mensal = Column(Float, nullable=True)
    pj_vigencia_inicio = Column(Date, nullable=True)
    pj_vigencia_fim = Column(Date, nullable=True)

    # Remuneração atual (denormalizado — trilha em HistoricoSalarialColaborador)
    salario_clt = Column(Float, nullable=True)
    data_vigencia_salario = Column(Date, nullable=True)

    # Comissão — regra contratual (cláusula); lançamentos mensais ficam em LancamentoRemuneracaoVariavel
    tipo_comissao = Column(SAEnum(TipoComissao), nullable=True)
    valor_comissao = Column(Float, nullable=True)
    observacoes_comissao = Column(Text, nullable=True)

    # Regime de trabalho
    carga_horaria = Column(String(50), nullable=True)
    escala = Column(String(100), nullable=True)
    modalidade = Column(SAEnum(ModalidadeTrabalho), nullable=True)
    jornada_especial = Column(String(200), nullable=True)

    # Dados bancários
    banco = Column(String(100), nullable=True)
    agencia = Column(String(20), nullable=True)
    conta = Column(String(20), nullable=True)
    tipo_conta = Column(String(20), nullable=True)

    # Organograma
    gestor_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)

    # Desligamento
    is_active = Column(Boolean, default=True)
    data_desligamento = Column(Date, nullable=True)
    tipo_desligamento = Column(String(50), nullable=True)
    motivo_desligamento = Column(Text, nullable=True)
    entrevista_saida = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    cargo = relationship("Cargo", foreign_keys=[cargo_id])
    departamento = relationship("Departamento", foreign_keys=[departamento_id])
    subordinados_diretos = relationship(
        "Colaborador", backref=backref("gestor", remote_side=[id])
    )

    @property
    def cargo_nome(self):
        return self.cargo.nome if self.cargo else None

    @property
    def departamento_nome(self):
        return self.departamento.nome if self.departamento else None

    @property
    def gestor_nome(self):
        return self.gestor.nome if self.gestor else None

    def __repr__(self):
        return f"<Colaborador {self.nome}>"


class HistoricoSalarialColaborador(Base):
    __tablename__ = "historico_salarial_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    salario_clt = Column(Float, nullable=False)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None


class HistoricoCargoColaborador(Base):
    __tablename__ = "historico_cargo_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    cargo_anterior_id = Column(Integer, ForeignKey("cargos.id"), nullable=True)
    cargo_novo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    data = Column(Date, nullable=False)
    aprovado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    justificativa = Column(String(300), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    cargo_anterior = relationship("Cargo", foreign_keys=[cargo_anterior_id])
    cargo_novo = relationship("Cargo", foreign_keys=[cargo_novo_id])
    aprovado_por = relationship("User", foreign_keys=[aprovado_por_id])

    @property
    def cargo_anterior_nome(self):
        return self.cargo_anterior.nome if self.cargo_anterior else None

    @property
    def cargo_novo_nome(self):
        return self.cargo_novo.nome if self.cargo_novo else None

    @property
    def aprovado_por_nome(self):
        return self.aprovado_por.nome if self.aprovado_por else None


class BeneficioColaborador(Base):
    __tablename__ = "beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    valor = Column(Float, nullable=False)  # valor atual, denormalizado — trilha em HistoricoBeneficioColaborador
    data_vigencia_atual = Column(Date, nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())


class HistoricoBeneficioColaborador(Base):
    __tablename__ = "historico_beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    beneficio_id = Column(Integer, ForeignKey("beneficios_colaboradores.id"), nullable=False)
    valor = Column(Float, nullable=False)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None


class LancamentoRemuneracaoVariavel(Base):
    __tablename__ = "lancamentos_remuneracao_variavel"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(SAEnum(TipoLancamentoVariavel), nullable=False)
    valor = Column(Float, nullable=False)
    competencia = Column(Date, nullable=False)  # mês/ano de referência — sempre normalizado para o dia 1
    descricao = Column(String(300), nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None


class DocumentoColaborador(Base):
    __tablename__ = "documentos_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    # ctps | aso_admissional | contrato_assinado | exame_periodico | certidao | pis_pasep | outro
    url = Column(String(500), nullable=False)
    data_vencimento = Column(Date, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
