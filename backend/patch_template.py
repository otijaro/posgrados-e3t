"""
Inserta XX en la celda de LÍNEA ESTRATÉGICA del formulario Word.
  python patch_template.py
"""
import os, zipfile, shutil, tempfile

template_path = os.path.join(os.path.dirname(__file__), "assets", "formulario_tema_template.docx")
backup_path   = template_path.replace(".docx", "_backup2.docx")
shutil.copy2(template_path, backup_path)
print(f"✅ Backup: {backup_path}")

with zipfile.ZipFile(template_path, 'r') as z:
    with z.open("word/document.xml") as f:
        xml = f.read().decode("utf-8")

# El patrón exacto: la celda termina con ") </w:t></w:r></w:p></w:tc>
# justo después del hyperlink del link de consulta
# Insertamos un párrafo nuevo con XX antes del </w:tc>

ANCLA = '<w:t xml:space="preserve">) </w:t></w:r></w:p></w:tc>'

if ANCLA not in xml:
    print("❌ Ancla no encontrada")
    exit(1)

# Nuevo párrafo con XX que se inserta después del párrafo del link
NUEVO_PARRAFO = (
    '<w:p><w:pPr><w:contextualSpacing/><w:rPr>'
    '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
    '<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:pPr>'
    '<w:r><w:rPr>'
    '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
    '<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>'
    '<w:t>XX</w:t></w:r></w:p>'
)

# Insertar después del </w:p> que cierra el párrafo del link, antes del </w:tc>
REEMPLAZO = '<w:t xml:space="preserve">) </w:t></w:r></w:p>' + NUEVO_PARRAFO + '</w:tc>'
xml = xml.replace(ANCLA, REEMPLAZO, 1)

print(f"✅ Total XX ahora: {xml.count('<w:t>XX</w:t>')}")

# Reempacar
tmpdir = tempfile.mkdtemp()
try:
    with zipfile.ZipFile(template_path, 'r') as z:
        z.extractall(tmpdir)
    with open(os.path.join(tmpdir, "word", "document.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    os.remove(template_path)
    with zipfile.ZipFile(template_path, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(tmpdir):
            for file in files:
                filepath = os.path.join(root, file)
                arcname  = os.path.relpath(filepath, tmpdir)
                zout.write(filepath, arcname)
    print(f"✅ Template actualizado correctamente")
finally:
    shutil.rmtree(tmpdir, ignore_errors=True)
