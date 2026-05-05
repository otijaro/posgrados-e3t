"""
Servicio de autenticación.
Maneja hashing de contraseñas y creación/verificación de JWT.
"""
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Persona, VinculacionActiva, CatalogoRol

settings = get_settings()


# ── Contraseñas ──────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt de una contraseña en texto plano."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña en texto plano coincida con su hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT firmado con los datos indicados."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica un JWT y devuelve su payload.
    Devuelve None si el token es inválido o expiró.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# ── Autenticación de usuario ──────────────────────────────────────────────────

def authenticate_user(db: Session, email: str, password: str) -> Optional[Persona]:
    """
    Valida las credenciales de un usuario.
    Devuelve la Persona si son correctas, None si no.
    """
    persona = db.query(Persona).filter(
        Persona.email_institucional == email
    ).first()

    if not persona or not persona.hashed_password:
        return None
    if not verify_password(password, persona.hashed_password):
        return None

    return persona


def get_roles_usuario(db: Session, id_persona: int) -> list[str]:
    """
    Devuelve la lista de códigos de rol activos de una persona.
    """
    vinculaciones = (
        db.query(CatalogoRol.codigo)
        .join(VinculacionActiva, VinculacionActiva.id_rol == CatalogoRol.id)
        .filter(
            VinculacionActiva.id_persona == id_persona,
            VinculacionActiva.es_activo == 1,
        )
        .all()
    )
    return [v.codigo for v in vinculaciones]


def get_current_user(db: Session, token: str) -> Optional[Persona]:
    """
    Obtiene la Persona asociada a un token JWT.
    Devuelve None si el token es inválido.
    """
    payload = decode_access_token(token)
    if not payload:
        return None

    persona_id = payload.get("sub")
    if persona_id is None:
        return None

    return db.query(Persona).filter(Persona.id == int(persona_id)).first()
