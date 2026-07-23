from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from app.models.crm import (
    OrigemLead, StatusFunil, TipoCliente, TipoArquiteto, TipoInteracaoArquiteto,
    MotivoIndisponibilidade,
)


def _nao_permitir_nulo_explicito(cls, v):
    """Validador reutilizável para campos Optional em schemas *Update que mapeiam
    para colunas NOT NULL. Optional aqui só deve permitir OMITIR o campo (update
    parcial) — enviar null explicitamente colidiria com a constraint do banco."""
    if v is None:
        raise ValueError("não pode ser definido como nulo")
    return v


# === LEAD ===

class LeadCreate(BaseModel):
    nome: str
    telefone: str
    email: Optional[EmailStr] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: OrigemLead = OrigemLead.OUTRO
    campanha: Optional[str] = None
    vendedor_id: Optional[int] = None
    arquiteto_id: Optional[int] = None


class LeadUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    cidade: Optional[str] = None
    origem: Optional[OrigemLead] = None
    status_funil: Optional[StatusFunil] = None
    vendedor_id: Optional[int] = None
    arquiteto_id: Optional[int] = None

    _valida_nome_telefone = field_validator("nome", "telefone")(_nao_permitir_nulo_explicito)


class LeadPerderRequest(BaseModel):
    """RF004 — motivo obrigatório ao marcar como Perdido."""
    motivo_perda: str
    concorrente: Optional[str] = None


class LeadResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    email: Optional[str]
    cidade: Optional[str]
    origem: OrigemLead
    status_funil: StatusFunil
    vendedor_id: Optional[int]
    arquiteto_id: Optional[int]
    qualificado: bool
    convertido_em_cliente: bool
    criado_em: datetime
    ultima_interacao_em: Optional[datetime]

    class Config:
        from_attributes = True


# === INTERAÇÃO ===

class InteracaoCreate(BaseModel):
    tipo: str  # ligacao | whatsapp | email | visita | reuniao
    resumo: str


class InteracaoResponse(BaseModel):
    id: int
    tipo: str
    resumo: str
    data: datetime
    responsavel_id: int

    class Config:
        from_attributes = True


# === CLIENTE ===

class ClienteCreate(BaseModel):
    nome: str
    telefone: str
    email: Optional[EmailStr] = None
    cpf_cnpj: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    endereco: Optional[str] = None
    tipo: TipoCliente = TipoCliente.PESSOA_FISICA
    arquiteto_id: Optional[int] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    email: Optional[str]
    cpf_cnpj: Optional[str]
    cidade: Optional[str]
    tipo: TipoCliente
    cadastro_aprovado: bool
    arquiteto_id: Optional[int]
    criado_em: datetime

    class Config:
        from_attributes = True


# === ARQUITETO ===

class ArquitetoCreate(BaseModel):
    nome: str
    tipo: TipoArquiteto
    escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: str = "parceiro"


class ArquitetoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[TipoArquiteto] = None
    escritorio: Optional[str] = None
    endereco_escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: Optional[str] = None
    vendedor_id: Optional[int] = None

    _valida_nome_nivel = field_validator("nome", "nivel_parceria")(_nao_permitir_nulo_explicito)


class ArquitetoResponse(BaseModel):
    id: int
    nome: str
    tipo: Optional[TipoArquiteto]
    escritorio: Optional[str]
    endereco_escritorio: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    nivel_parceria: str
    vendedor_id: Optional[int]
    vendedor_nome: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# === INTERAÇÃO COM ARQUITETO ===

class InteracaoArquitetoCreate(BaseModel):
    tipo: TipoInteracaoArquiteto
    observacao: str


class InteracaoArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    autor_id: int
    autor_nome: Optional[str]
    tipo: TipoInteracaoArquiteto
    observacao: str
    criado_em: datetime

    class Config:
        from_attributes = True


# === FUNCIONÁRIO DO ESCRITÓRIO (DECISORES) ===

class FuncionarioArquitetoCreate(BaseModel):
    nome: str
    funcao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    decisor: bool = False


class FuncionarioArquitetoUpdate(BaseModel):
    nome: Optional[str] = None
    funcao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    decisor: Optional[bool] = None

    _valida_nome = field_validator("nome")(_nao_permitir_nulo_explicito)


class FuncionarioArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome: str
    funcao: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    observacoes: Optional[str]
    decisor: bool

    class Config:
        from_attributes = True


# === DECISOR ARQUITETO ===

class DecisorArquitetoCreate(BaseModel):
    nome: str
    cargo: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    is_principal: bool = False


class DecisorArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome: str
    cargo: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    observacoes: Optional[str]
    is_principal: bool
    criado_em: datetime

    class Config:
        from_attributes = True


# === CONCORRENTE ARQUITETO ===

class ConcorrenteArquitetoCreate(BaseModel):
    nome_concorrente: str
    percentual_fechamento_estimado: float = Field(..., ge=0, le=100)
    observacoes: Optional[str] = None


class ConcorrenteArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome_concorrente: str
    percentual_fechamento_estimado: float
    observacoes: Optional[str]
    registrado_por_id: Optional[int]
    criado_em: datetime

    class Config:
        from_attributes = True


# === SCORE DO ARQUITETO ===

class ArquitetoScoreResponse(BaseModel):
    rfv: float
    potencial: float
    lealdade: float
    score_geral: float
    segmento: str
    flags: List[str]
    detalhes: dict
    concorrencia: dict


# === FILA DE ATENDIMENTO ===

class FilaAtendimentoResponse(BaseModel):
    id: int
    vendedor_id: int
    vendedor_nome: Optional[str] = None
    posicao: int
    disponivel: bool
    motivo_indisponivel_categoria: Optional[MotivoIndisponibilidade]
    motivo_indisponivel_obs: Optional[str]
    checkin_em: Optional[datetime]
    ativo_hoje: bool

    class Config:
        from_attributes = True


class MarcarIndisponivelRequest(BaseModel):
    categoria: MotivoIndisponibilidade
    observacao: Optional[str] = None

    @model_validator(mode="after")
    def _valida_observacao_outro(self):
        if self.categoria == MotivoIndisponibilidade.OUTRO and not self.observacao:
            raise ValueError("observação é obrigatória quando a categoria é 'outro'")
        return self


class ReordenarFilaRequest(BaseModel):
    ordem: List[int]


# === ATRIBUIÇÃO DE LEAD ===

class DevolverLeadRequest(BaseModel):
    motivo: str


class ReatribuirLeadRequest(BaseModel):
    vendedor_id: int
