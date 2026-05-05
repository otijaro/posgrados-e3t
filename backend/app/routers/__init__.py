from app.routers.solicitudes import router as solicitudes_router
from app.routers.programas import router as programas_router
from app.routers.auth import router as auth_router

__all__ = ["solicitudes_router", "programas_router", "auth_router"]
