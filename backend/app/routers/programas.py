from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ProgramaPosgrado
from app.schemas import ProgramaResponse

router = APIRouter(prefix="/programas", tags=["Programas"])


@router.get("/", response_model=List[ProgramaResponse])
def listar_programas(db: Session = Depends(get_db)):
    """Lista todos los programas de posgrado activos."""
    programas = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.activo == 1
    ).order_by(ProgramaPosgrado.nivel, ProgramaPosgrado.nombre).all()
    return programas
