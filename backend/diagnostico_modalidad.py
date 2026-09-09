"""
Diagnostico: muestra el fragmento de XML de la plantilla alrededor de la
palabra "Modalidad", para saber exactamente como esta armada esa casilla
(checkbox, guion bajo, tabla, etc.) y poder automatizar el marcado con X.

  python diagnostico_modalidad.py
"""
import zipfile, re, os

TEMPLATE = os.path.join(os.path.dirname(__file__), "assets", "formulario_tema_template.docx")

if not os.path.exists(TEMPLATE):
    print(f"❌ No se encontró la plantilla en: {TEMPLATE}")
    exit(1)

with zipfile.ZipFile(TEMPLATE) as z:
    xml = z.read("word/document.xml").decode("utf-8")

# Quitamos todas las etiquetas XML para poder buscar el texto "plano"
texto_plano = re.sub(r"<[^>]+>", "", xml)

idx = texto_plano.lower().find("modalidad")
if idx == -1:
    print("❌ No se encontró la palabra 'Modalidad' en el texto de la plantilla.")
    print("   Puede que esté escrita distinto (ej. 'MODALIDAD DE TRABAJO').")
else:
    inicio = max(0, idx - 30)
    fin = min(len(texto_plano), idx + 250)
    print("📄 Texto plano alrededor de 'Modalidad':\n")
    print(texto_plano[inicio:fin])
    print("\n" + "="*60)

# También mostramos el XML crudo alrededor de la primera ocurrencia de "Modalidad"
idx_xml = xml.lower().find("modalidad")
if idx_xml != -1:
    inicio_xml = max(0, idx_xml - 200)
    fin_xml = min(len(xml), idx_xml + 6000)
    print("\n🔎 XML crudo alrededor de 'Modalidad' (rango ampliado):\n")
    print(xml[inicio_xml:fin_xml])
