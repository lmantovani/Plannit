from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
import re
import enum
from app.models.colaborador import RegimeContratacao, ModalidadeTrabalho


# === DEPARTAMENTO ===

class DepartamentoCreate(BaseModel):
    nome: str


class DepartamentoUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None


class DepartamentoResponse(BaseModel):
    id: int
    nome: str
    ativo: bool

    class Config:
        from_attributes = True


# === CARGO ===

class CargoCreate(BaseModel):
    nome: str
    departamento_id: int


class CargoUpdate(BaseModel):
    nome: Optional[str] = None
    departamento_id: Optional[int] = None
    ativo: Optional[bool] = None


class CargoResponse(BaseModel):
    id: int
    nome: str
    departamento_id: int
    departamento_nome: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True


# === CPF ===

def _cpf_valido(cpf: str) -> bool:
    cpf = re.sub(r"\D", "", cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(cpf[num]) * ((i + 1) - num) for num in range(i))
        digito = ((soma * 10) % 11) % 10
        if digito != int(cpf[i]):
            return False
    return True


# === COLABORADOR ===

class ColaboradorCreate(BaseModel):
    nome: str
    cpf: str
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    foto_url: Optional[str] = None

    telefone: Optional[str] = None
    email_pessoal: Optional[str] = None
    email_corporativo: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_cep: Optional[str] = None

    data_admissao: date
    cargo_id: int
    departamento_id: int
    regime: RegimeContratacao
    tipo_contrato: Optional[str] = None

    pj_cnpj: Optional[str] = None
    pj_contrato_url: Optional[str] = None
    pj_valor_mensal: Optional[float] = None
    pj_vigencia_inicio: Optional[date] = None
    pj_vigencia_fim: Optional[date] = None

    salario_clt: Optional[float] = None
    remuneracao_complementar: Optional[float] = None
    data_vigencia_salario: Optional[date] = None

    carga_horaria: Optional[str] = None
    escala: Optional[str] = None
    modalidade: Optional[ModalidadeTrabalho] = None
    jornada_especial: Optional[str] = None

    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[str] = None

    gestor_id: Optional[int] = None
    user_id: Optional[int] = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v):
        if not _cpf_valido(v):
            raise ValueError("CPF inválido")
        return re.sub(r"\D", "", v)


class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    foto_url: Optional[str] = None

    telefone: Optional[str] = None
    email_pessoal: Optional[str] = None
    email_corporativo: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_cep: Optional[str] = None

    departamento_id: Optional[int] = None
    tipo_contrato: Optional[str] = None

    pj_cnpj: Optional[str] = None
    pj_contrato_url: Optional[str] = None
    pj_valor_mensal: Optional[float] = None
    pj_vigencia_inicio: Optional[date] = None
    pj_vigencia_fim: Optional[date] = None

    carga_horaria: Optional[str] = None
    escala: Optional[str] = None
    modalidade: Optional[ModalidadeTrabalho] = None
    jornada_especial: Optional[str] = None

    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[str] = None

    gestor_id: Optional[int] = None
    user_id: Optional[int] = None


class ColaboradorResumo(BaseModel):
    id: int
    nome: str
    cargo_nome: Optional[str] = None

    class Config:
        from_attributes = True


class ColaboradorResponse(BaseModel):
    id: int
    user_id: Optional[int]
    nome: str
    cpf: str
    rg: Optional[str]
    data_nascimento: Optional[date]
    sexo: Optional[str]
    estado_civil: Optional[str]
    foto_url: Optional[str]

    telefone: Optional[str]
    email_pessoal: Optional[str]
    email_corporativo: Optional[str]
    endereco_logradouro: Optional[str]
    endereco_numero: Optional[str]
    endereco_complemento: Optional[str]
    endereco_bairro: Optional[str]
    endereco_cidade: Optional[str]
    endereco_estado: Optional[str]
    endereco_cep: Optional[str]

    data_admissao: date
    cargo_id: int
    cargo_nome: Optional[str] = None
    departamento_id: int
    departamento_nome: Optional[str] = None
    regime: RegimeContratacao
    tipo_contrato: Optional[str]

    pj_cnpj: Optional[str]
    pj_contrato_url: Optional[str]
    pj_valor_mensal: Optional[float]
    pj_vigencia_inicio: Optional[date]
    pj_vigencia_fim: Optional[date]

    salario_clt: Optional[float]
    remuneracao_complementar: Optional[float]
    data_vigencia_salario: Optional[date]

    carga_horaria: Optional[str]
    escala: Optional[str]
    modalidade: Optional[ModalidadeTrabalho]
    jornada_especial: Optional[str]

    banco: Optional[str]
    agencia: Optional[str]
    conta: Optional[str]
    tipo_conta: Optional[str]

    gestor_id: Optional[int]
    gestor_nome: Optional[str] = None
    subordinados_diretos: List[ColaboradorResumo] = []

    is_active: bool
    data_desligamento: Optional[date]
    tipo_desligamento: Optional[str]
    motivo_desligamento: Optional[str]
    entrevista_saida: Optional[str]

    criado_em: Optional[datetime]

    class Config:
        from_attributes = True


# === HISTÓRICO SALARIAL ===

class HistoricoSalarialCreate(BaseModel):
    salario_clt: float
    remuneracao_complementar: Optional[float] = None
    data_vigencia: date
    motivo: str


class HistoricoSalarialResponse(BaseModel):
    id: int
    colaborador_id: int
    salario_clt: float
    remuneracao_complementar: Optional[float]
    data_vigencia: date
    motivo: str
    registrado_por_id: int
    registrado_por_nome: Optional[str] = None
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True


# === HISTÓRICO DE CARGO ===

class HistoricoCargoCreate(BaseModel):
    cargo_novo_id: int
    data: date
    justificativa: Optional[str] = None


class HistoricoCargoResponse(BaseModel):
    id: int
    colaborador_id: int
    cargo_anterior_id: Optional[int]
    cargo_anterior_nome: Optional[str] = None
    cargo_novo_id: int
    cargo_novo_nome: Optional[str] = None
    data: date
    aprovado_por_id: int
    aprovado_por_nome: Optional[str] = None
    justificativa: Optional[str]
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True


# === DESLIGAMENTO ===

class TipoDesligamento(str, enum.Enum):
    PEDIDO_DEMISSAO = "pedido_demissao"
    DISPENSA_SEM_JUSTA_CAUSA = "dispensa_sem_justa_causa"
    DISPENSA_COM_JUSTA_CAUSA = "dispensa_com_justa_causa"


class DesligamentoRequest(BaseModel):
    data_desligamento: date
    tipo_desligamento: TipoDesligamento
    motivo_desligamento: str
    entrevista_saida: Optional[str] = None
