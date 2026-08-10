from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Persona
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserInfoResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.services.auth import (
    authenticate_user, create_access_token, get_current_user, get_roles_usuario,
    create_password_reset_token, verify_password_reset_token, hash_password,
)
from app.services.email import enviar_correo_restablecimiento

router = APIRouter(prefix="/auth", tags=["Autenticación"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica al usuario y devuelve un JWT.
    """
    persona = authenticate_user(db, body.email, body.password)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    roles = get_roles_usuario(db, persona.id)

    token = create_access_token(data={
        "sub": str(persona.id),
        "email": persona.email_institucional,
        "roles": roles,
    })

    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserInfoResponse)
def me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Devuelve los datos del usuario autenticado a partir del JWT.
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    roles = get_roles_usuario(db, persona.id)

    return UserInfoResponse(
        id=persona.id,
        nombre_completo=persona.nombre_completo,
        email_institucional=persona.email_institucional,
        roles=roles,
    )


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Solicita el envío de un correo con enlace para restablecer la contraseña.

    Siempre responde con el mismo mensaje genérico exista o no la cuenta,
    para no revelar qué correos están registrados en el sistema.
    """
    persona = db.query(Persona).filter(
        Persona.email_institucional == body.email
    ).first()

    if persona:
        token = create_password_reset_token(persona)
        enviar_correo_restablecimiento(
            destinatario=persona.email_institucional,
            nombre=persona.nombre_completo,
            token=token,
        )

    return {"message": "Si el correo está registrado, se envió un enlace de restablecimiento."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Aplica la nueva contraseña, validando el token recibido por correo.
    """
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres",
        )

    persona = verify_password_reset_token(db, body.token)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace no es válido o ya expiró. Solicita uno nuevo.",
        )

    persona.hashed_password = hash_password(body.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}
