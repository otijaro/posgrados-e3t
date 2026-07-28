"""
Router del Reglamento General de Posgrados.
- GET /reglamento/pdf      → devuelve el PDF como base64
- POST /reglamento/chat    → responde preguntas usando Claude + el reglamento
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import base64, os, httpx

from app.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/reglamento", tags=["Reglamento"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "Acuerdo075ReglamentoGeneralPosgrado.pdf")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Cache del PDF en base64 para no leerlo en cada request
_pdf_b64_cache: str | None = None


def _get_pdf_b64() -> str:
    global _pdf_b64_cache
    if _pdf_b64_cache is None:
        path = os.path.abspath(PDF_PATH)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Reglamento no encontrado: {path}")
        with open(path, "rb") as f:
            _pdf_b64_cache = base64.standard_b64encode(f.read()).decode("utf-8")
    return _pdf_b64_cache


class PreguntaBody(BaseModel):
    pregunta: str
    historial: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


# ── GET PDF ───────────────────────────────────────────────────────────────────

@router.get("/pdf")
def obtener_pdf(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    get_current_user(db, token)
    try:
        return {"pdf_base64": _get_pdf_b64()}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── POST chat ─────────────────────────────────────────────────────────────────

@router.post("/chat")
def chat_reglamento(
    body: PreguntaBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    get_current_user(db, token)

    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="API key de Anthropic no configurada")

    if not body.pregunta.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía")

    try:
        pdf_b64 = _get_pdf_b64()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Construir historial de mensajes
    messages = []

    # Primera pregunta incluye el PDF; las siguientes solo el texto
    if not body.historial:
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64,
                    },
                    "title": "Acuerdo 075 - Reglamento General de Posgrados UIS",
                },
                {
                    "type": "text",
                    "text": body.pregunta,
                }
            ]
        })
    else:
        # Reconstruir historial — primer mensaje del user incluye el PDF
        for i, msg in enumerate(body.historial):
            if i == 0 and msg["role"] == "user":
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_b64,
                            },
                            "title": "Acuerdo 075 - Reglamento General de Posgrados UIS",
                        },
                        {"type": "text", "text": msg["content"]}
                    ]
                })
            else:
                messages.append(msg)
        # Agregar pregunta actual
        messages.append({"role": "user", "content": body.pregunta})

    try:
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key":         ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json={
                "model":      "claude-opus-4-6",
                "max_tokens": 1024,
                "system": (
                    "Eres un asistente experto en el Reglamento General de Posgrados de la "
                    "Universidad Industrial de Santander (UIS), específicamente el Acuerdo 075. "
                    "Responde las preguntas basándote ÚNICAMENTE en el contenido del reglamento proporcionado. "
                    "Si la información no está en el reglamento, indícalo claramente. "
                    "Cita el artículo o sección relevante cuando sea posible. "
                    "Responde en español de forma clara y concisa."
                ),
                "messages": messages,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        respuesta = data["content"][0]["text"]
        return {"respuesta": respuesta}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Error de la API de Claude: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar Claude: {str(e)}")
