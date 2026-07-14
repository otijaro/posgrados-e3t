from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.routers.auth import router as auth_router
from app.routers.solicitudes import router as solicitudes_router
from app.routers.programas import router as programas_router
from app.routers.estudiante import router as estudiante_router
from app.routers.director import router as director_router
from app.routers.coordinador import router as coordinador_router
from app.routers.firmas import router as firmas_router

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para gestión de posgrados E3T - UIS",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router,        prefix=settings.API_V1_STR)
app.include_router(solicitudes_router, prefix=settings.API_V1_STR)
app.include_router(programas_router,   prefix=settings.API_V1_STR)
app.include_router(estudiante_router,  prefix=settings.API_V1_STR)
app.include_router(director_router,    prefix=settings.API_V1_STR)
app.include_router(coordinador_router, prefix=settings.API_V1_STR)
app.include_router(firmas_router,      prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "API de Posgrados E3T", "version": settings.VERSION, "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
