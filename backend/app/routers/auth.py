from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserInfoResponse
from app.services.auth import authenticate_user, create_access_token, get_current_user, get_roles_usuario

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
