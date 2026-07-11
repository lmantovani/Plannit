from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.crm import OrigemLead, StatusFunil, TipoCliente


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


class ClienteResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    email: Optional[str]
    cpf_cnpj: Optional[str]
    cidade: Optional[str]
    tipo: TipoCliente
    cadastro_aprovado: bool
    criado_em: datetime

    class Config:
        from_attributes = True


# === ARQUITETO ===

class ArquitetoCreate(BaseModel):
    nome: str
    escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: str = "parceiro"


class ArquitetoResponse(BaseModel):
    id: int
    nome: str
    escritorio: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    nivel_parceria: str
    is_active: bool

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
