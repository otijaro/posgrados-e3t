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
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings():
    """Instancia única de configuración (singleton)."""
    return Settings()
