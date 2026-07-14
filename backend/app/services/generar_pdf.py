"""
Genera el PDF del formulario de inscripción de tema pre-llenado.
Usa docx2pdf (requiere Microsoft Word instalado en Windows).
"""
import os, shutil, tempfile, zipfile
from datetime import date

DOCX_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "formulario_tema_template.docx")

TAG = "<w:t>XX</w:t>"

# Orden exacto de aparición de los 16 XX en el XML del Word
# [6] es la línea estratégica — recién agregada entre grupo_inv y autor
CAMPOS_EN_ORDEN = [
    "titulo",               # [1]
    "anio",                 # [2]
    "mes",                  # [3]
    "dia",                  # [4]
    "programa",             # [5]
    "linea_estrategica",    # [6] ← nuevo
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

        # Reemplazar cada XX en orden de aparición (uno a la vez)
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

        # Convertir a PDF con docx2pdf
        output_pdf = os.path.join(tmpdir, "formulario_prellenado.pdf")
        try:
            from docx2pdf import convert
            convert(output_docx, output_pdf)
        except Exception as e:
            raise RuntimeError(f"Error al convertir a PDF: {e}")

        if not os.path.exists(output_pdf):
            raise FileNotFoundError("docx2pdf no generó el PDF")

        with open(output_pdf, "rb") as f:
            return f.read()

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
