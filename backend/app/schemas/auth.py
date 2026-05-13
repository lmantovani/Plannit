from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import PerfilUsuario


# === AUTH ===

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    perfil: PerfilUsuario
    nome: str
    user_id: int


# === USUÁRIOS ===

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    password: str
    perfil: PerfilUsuario


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    perfil: Optional[PerfilUsuario] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    perfil: PerfilUsuario
    is_active: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
