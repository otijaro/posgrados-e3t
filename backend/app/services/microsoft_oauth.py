"""
Login con Microsoft (OAuth2 / OpenID Connect) para correos institucionales
@uis.edu.co administrados en Microsoft Entra ID.

El `redirect_uri` NO es fijo: el frontend lo calcula según su propio origen
(`window.location.origin`) y lo viaja de ida y vuelta en el parámetro `state`
del flujo OAuth, para que el backend use exactamente el mismo valor al
intercambiar el código — así funciona igual en localhost:3000 (Mac de Juliam),
localhost:3001 (PC de John), o cualquier otro puerto/host, sin reconfigurar
nada por entorno.
"""
import httpx

from app.config import get_settings

settings = get_settings()

AUTHORITY = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}"
SCOPE = "openid profile email User.Read"


def exchange_code(code: str, redirect_uri: str) -> str | None:
    """Intercambia el código de autorización por un access_token. None si falla."""
    data = {
        "client_id": settings.MICROSOFT_CLIENT_ID,
        "client_secret": settings.MICROSOFT_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
        "scope": SCOPE,
    }
    try:
        resp = httpx.post(f"{AUTHORITY}/oauth2/v2.0/token", data=data, timeout=10)
        resp.raise_for_status()
        return resp.json().get("access_token")
    except httpx.HTTPError:
        return None


def obtener_email_usuario(access_token: str) -> str | None:
    """Consulta Microsoft Graph y devuelve el correo del usuario autenticado."""
    try:
        resp = httpx.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("mail") or data.get("userPrincipalName")
    except httpx.HTTPError:
        return None
