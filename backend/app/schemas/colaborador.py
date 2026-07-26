from pydantic import BaseModel
from typing import Optional


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
