"""
Genera el PDF del formulario de inscripción de tema pre-llenado.
Funciona en Windows (LibreOffice o Word), Mac (LibreOffice) y Linux (LibreOffice).
"""
import os, shutil, tempfile, zipfile, subprocess, sys
from datetime import date

DOCX_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "formulario_tema_template.docx")

TAG = "<w:t>XX</w:t>"

CAMPOS_EN_ORDEN = [
    "titulo", "anio", "mes", "dia", "programa", "linea_estrategica",
    "grupo_investigacion", "autor", "codigo", "area_formacion",
    "director", "codirector", "codirector_cargo", "codirector_entidad",
    "objetivo_general", "descripcion_alcances",
]


def escapar(v: str) -> str:
    return (str(v or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


# Rutas de LibreOffice según SO
LIBREOFFICE_CANDIDATOS = [
    # Mac
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    # Linux
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
    # Windows — rutas comunes
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    # En PATH
    "soffice",
    "libreoffice",
]


def _buscar_libreoffice() -> str | None:
    for c in LIBREOFFICE_CANDIDATOS:
        try:
            subprocess.run([c, "--version"], capture_output=True, timeout=5)
            return c
        except Exception:
            continue
    return None


def _convertir_con_libreoffice(docx_path: str, output_dir: str) -> str:
    cmd = _buscar_libreoffice()
    if not cmd:
        raise RuntimeError("LibreOffice no encontrado.")

    result = subprocess.run(
        [cmd, "--headless", "--convert-to", "pdf", "--outdir", output_dir, docx_path],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice error: {result.stderr}")

    pdf_name = os.path.splitext(os.path.basename(docx_path))[0] + ".pdf"
    pdf_path = os.path.join(output_dir, pdf_name)
    if not os.path.exists(pdf_path):
        raise RuntimeError("LibreOffice no generó el PDF")
    return pdf_path


def _convertir_con_docx2pdf(docx_path: str, output_path: str) -> str:
    from docx2pdf import convert
    convert(docx_path, output_path)
    if not os.path.exists(output_path):
        raise RuntimeError("docx2pdf no generó el PDF")
    return output_path


def _convertir_docx_a_pdf(docx_path: str, output_dir: str) -> str:
    """
    Intenta convertir con LibreOffice primero (disponible en todos los SO),
    luego fallback a docx2pdf (Word) en Windows/Mac.
    """
    errores = []

    # 1. Intentar LibreOffice (funciona en Mac, Linux y Windows si está instalado)
    try:
        return _convertir_con_libreoffice(docx_path, output_dir)
    except Exception as e:
        errores.append(f"LibreOffice: {e}")

    # 2. Fallback: docx2pdf con Word (solo Windows/Mac con Word instalado)
    try:
        output_pdf = os.path.join(output_dir, "formulario_prellenado.pdf")
        return _convertir_con_docx2pdf(docx_path, output_pdf)
    except Exception as e:
        errores.append(f"docx2pdf/Word: {e}")

    raise RuntimeError(
        "No se pudo convertir el DOCX a PDF.\n"
        + "\n".join(errores)
        + "\n\nInstale LibreOffice desde https://www.libreoffice.org"
    )


def generar_pdf_tema(datos: dict) -> bytes:
    hoy = date.today()
    datos.setdefault("anio",                 str(hoy.year))
    datos.setdefault("mes",                  f"{hoy.month:02d}")
    datos.setdefault("dia",                  f"{hoy.day:02d}")
    datos.setdefault("linea_estrategica",    "")
    datos.setdefault("codirector",           "")
    datos.setdefault("codirector_cargo",     "")
    datos.setdefault("codirector_entidad",   "")
    datos.setdefault("grupo_investigacion",  "")
    datos.setdefault("area_formacion",       "")
    datos.setdefault("descripcion_alcances", "")

    template_path = os.path.abspath(DOCX_TEMPLATE)
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template no encontrado: {template_path}")

    tmpdir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(template_path, 'r') as z:
            z.extractall(tmpdir)

        doc_path = os.path.join(tmpdir, "word", "document.xml")
        with open(doc_path, encoding="utf-8") as f:
            xml = f.read()

        for campo in CAMPOS_EN_ORDEN:
            valor = escapar(datos.get(campo, ""))
            new_tag = f'<w:t xml:space="preserve">{valor}</w:t>'
            xml = xml.replace(TAG, new_tag, 1)

        with open(doc_path, "w", encoding="utf-8") as f:
            f.write(xml)

        output_docx = os.path.join(tmpdir, "formulario_prellenado.docx")
        with zipfile.ZipFile(output_docx, 'w', zipfile.ZIP_DEFLATED) as zout:
            for root, dirs, files in os.walk(tmpdir):
                for file in files:
                    if file == "formulario_prellenado.docx":
                        continue
                    filepath = os.path.join(root, file)
                    arcname  = os.path.relpath(filepath, tmpdir)
                    zout.write(filepath, arcname)

        output_pdf = _convertir_docx_a_pdf(output_docx, tmpdir)

        with open(output_pdf, "rb") as f:
            return f.read()

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
