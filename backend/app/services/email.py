"""
Servicio de envío de correos (recuperación de contraseña).
Usa SMTP simple — pensado para Gmail con contraseña de aplicación,
pero funciona con cualquier proveedor SMTP estándar.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import get_settings

settings = get_settings()


def _enviar_correo(destinatario: str, asunto: str, cuerpo_html: str, cuerpo_texto: str) -> bool:
    """
    Envía un correo por SMTP. Devuelve True si se envió, False si falló
    (y deja el detalle en logs — no lanza excepción para no romper el
    flujo del endpoint que lo llama).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("⚠️  SMTP no configurado (SMTP_USER/SMTP_PASSWORD vacíos) — correo no enviado.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = destinatario

    msg.attach(MIMEText(cuerpo_texto, "plain"))
    msg.attach(MIMEText(cuerpo_html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [destinatario], msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Error enviando correo a {destinatario}: {e}")
        return False


def enviar_correo_restablecimiento(destinatario: str, nombre: str, token: str) -> bool:
    """Envía el correo con el enlace para restablecer la contraseña."""
    enlace = f"{settings.FRONTEND_URL}/restablecer-contrasena?token={token}"

    cuerpo_texto = (
        f"Hola {nombre},\n\n"
        f"Recibimos una solicitud para restablecer tu contraseña en Posgrados E3T.\n"
        f"Ingresa al siguiente enlace para crear una nueva contraseña (válido por 1 hora):\n\n"
        f"{enlace}\n\n"
        f"Si no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue siendo válida.\n"
    )

    cuerpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #15803d;">Posgrados E3T</h2>
        <p>Hola <strong>{nombre}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="{enlace}"
               style="background:#15803d; color:#fff; padding:12px 24px;
                      border-radius:6px; text-decoration:none; font-weight:bold;">
                Restablecer contraseña
            </a>
        </p>
        <p style="color:#666; font-size: 13px;">
            Este enlace es válido por 1 hora. Si no solicitaste este cambio,
            puedes ignorar este correo — tu contraseña actual seguirá siendo válida.
        </p>
        <p style="color:#999; font-size: 12px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            {enlace}
        </p>
    </div>
    """

    return _enviar_correo(destinatario, "Restablecer contraseña — Posgrados E3T", cuerpo_html, cuerpo_texto)
