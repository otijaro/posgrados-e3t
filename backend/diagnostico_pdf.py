"""Cuenta los XX en el template actual."""
import os, zipfile
template_path = os.path.join(os.path.dirname(__file__), "assets", "formulario_tema_template.docx")
with zipfile.ZipFile(template_path, 'r') as z:
    with z.open("word/document.xml") as f:
        xml = f.read().decode("utf-8")
print(f"Total <w:t>XX</w:t>: {xml.count('<w:t>XX</w:t>')}")
