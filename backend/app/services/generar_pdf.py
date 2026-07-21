"""
Genera el PDF del formulario de inscripción de tema pre-llenado.
Funciona en Windows (docx2pdf/Word), Mac (LibreOffice) y Linux (LibreOffice).
"""
import os, shutil, tempfile, zipfile, subprocess, sys
from datetime import date

DOCX_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "formulario_tema_template.docx")

TAG = "<w:t>XX</w:t>"

CAMPOS_EN_ORDEN = [
    "titulo",               # [1]
    "anio",                 # [2]
    "mes",                  # [3]
    "dia",                  # [4]
    "programa",             # [5]
    "linea_estrategica",    # [6]
    "grupo_investigacion",  # [7]
    "autor",                # [8]
    "codigo",               # [9]
    "area_formacion",       # [10]
    "director",             # [11]
    "codirector",           # [12]
    "codirector_cargo",     # [13]
    "codirector_entidad",   # [14]
    "objetivo_general",     # [15]
    "descripcion_alcances", # [16]
]


def escapar(v: str) -> str:
    return (str(v or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def _convertir_con_libreoffice(docx_path: str, output_dir: str) -> str:
    """Convierte docx a PDF usando LibreOffice."""
    # Rutas posibles de LibreOffice en Mac y Linux
    candidatos = [
        "libreoffice",
        "soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "/usr/bin/libreoffice",
        "/usr/bin/soffice",
    ]
    cmd = None
    for c in candidatos:
        try:
            subprocess.run([c, "--version"], capture_output=True, timeout=5)
            cmd = c
            break
        except Exception:
            continue

    if not cmd:
        raise RuntimeError("LibreOffice no encontrado. Instálelo desde https://www.libreoffice.org")

    result = subprocess.run(
        [cmd, "--headless", "--convert-to", "pdf", "--outdir", output_dir, docx_path],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice error: {result.stderr}")

    pdf_name = os.path.splitext(os.path.basename(docx_path))[0] + ".pdf"
    return os.path.join(output_dir, pdf_name)


def _convertir_con_docx2pdf(docx_path: str, output_path: str) -> str:
    """Convierte docx a PDF usando docx2pdf (requiere Word en Windows/Mac)."""
    from docx2pdf import convert
    convert(docx_path, output_path)
    return output_path


def _convertir_docx_a_pdf(docx_path: str, output_dir: str) -> str:
    """
    Intenta convertir el docx a PDF usando el método disponible en el sistema.
    Orden de preferencia: LibreOffice → docx2pdf
    """
    # En Mac/Linux intentar LibreOffice primero
    if sys.platform in ("darwin", "linux"):
        try:
            return _convertir_con_libreoffice(docx_path, output_dir)
        except Exception as e_libre:
            # Fallback a docx2pdf si LibreOffice no está
            try:
                output_pdf = os.path.join(output_dir, "formulario_prellenado.pdf")
                return _convertir_con_docx2pdf(docx_path, output_pdf)
            except Exception as e_docx:
                raise RuntimeError(
                    f"No se pudo convertir el PDF.\n"
                    f"LibreOffice: {e_libre}\n"
                    f"docx2pdf: {e_docx}\n"
                    f"Instale LibreOffice desde https://www.libreoffice.org"
                )
    else:
        # En Windows usar docx2pdf (Word)
        try:
            output_pdf = os.path.join(output_dir, "formulario_prellenado.pdf")
            return _convertir_con_docx2pdf(docx_path, output_pdf)
        except Exception as e:
            # Fallback a LibreOffice en Windows si no hay Word
            try:
                return _convertir_con_libreoffice(docx_path, output_dir)
            except Exception as e_libre:
                raise RuntimeError(
                    f"No se pudo convertir el PDF.\n"
                    f"docx2pdf: {e}\n"
                    f"LibreOffice: {e_libre}"
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

        # Reempacar como docx
        output_docx = os.path.join(tmpdir, "formulario_prellenado.docx")
        with zipfile.ZipFile(output_docx, 'w', zipfile.ZIP_DEFLATED) as zout:
            for root, dirs, files in os.walk(tmpdir):
                for file in files:
                    if file == "formulario_prellenado.docx":
                        continue
                    filepath = os.path.join(root, file)
                    arcname  = os.path.relpath(filepath, tmpdir)
                    zout.write(filepath, arcname)

        # Convertir a PDF
        output_pdf = _convertir_docx_a_pdf(output_docx, tmpdir)

        if not os.path.exists(output_pdf):
            raise FileNotFoundError("No se generó el PDF")

        with open(output_pdf, "rb") as f:
            return f.read()

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
