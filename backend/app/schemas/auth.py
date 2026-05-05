from pydantic import BaseModel, EmailStr
from typing import List


class LoginRequest(BaseModel):
    """Datos que envía el cliente para iniciar sesión."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Respuesta del endpoint de login."""
    access_token: str
    token_type: str = "bearer"


class UserInfoResponse(BaseModel):
    """Información del usuario autenticado (/auth/me)."""
    id: int
    nombre_completo: str
    email_institucional: str
    roles: List[str]

    class Config:
        from_attributes = True
