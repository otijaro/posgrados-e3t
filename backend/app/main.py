from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para gestión de posgrados E3T - UIS",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoint de prueba
@app.get("/")
async def root():
    """Endpoint raíz para verificar que la API está funcionando."""
    return {
        "message": "API de Posgrados E3T",
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check para monitoreo."""
    return {"status": "healthy"}


# Aquí irán los routers cuando los creemos
# app.include_router(auth.router, prefix=settings.API_V1_STR)
# app.include_router(proyectos.router, prefix=settings.API_V1_STR)