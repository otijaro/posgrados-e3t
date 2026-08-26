from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración centralizada de la aplicación."""
    
    # Información del proyecto
    PROJECT_NAME: str = "Posgrados E3T API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base de datos
    DATABASE_URL: str
    
    # Seguridad
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # Correo (recuperación de contraseña)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Posgrados E3T"

    # URL pública del frontend, usada para construir el enlace del correo
    FRONTEND_URL: str = "http://localhost:3000"

    # OAuth con Microsoft (login institucional @uis.edu.co)
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_TENANT_ID: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings():
    """Instancia única de configuración (singleton)."""
    return Settings()
