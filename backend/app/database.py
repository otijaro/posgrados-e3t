from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import get_settings

settings = get_settings()

# Motor de base de datos (psycopg3)
engine = create_engine(
    settings.DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://'),
    pool_pre_ping=True,
    echo=False
)

# Sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()


def get_db():
    """
    Dependency para obtener sesión de DB.
    Se usa en los endpoints con Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()