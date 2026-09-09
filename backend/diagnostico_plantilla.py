"""
Diagnostico: revisa cuantas veces aparece el marcador "XX" en la plantilla
del formulario de tema, y en que forma exacta (para saber por que el
reemplazo de datos puede estar fallando silenciosamente).

  python diagnostico_plantilla.py
"""
import zipfile, re, os

TEMPLATE = os.path.join(os.path.dirname(__file__), "assets", "formulario_tema_template.docx")

if not os.path.exists(TEMPLATE):
    print(f"❌ No se encontró la plantilla en: {TEMPLATE}")
    exit(1)

with zipfile.ZipFile(TEMPLATE) as z:
    xml = z.read("word/document.xml").decode("utf-8")

# 1. Buscar el patrón EXACTO que usa el generador: <w:t>XX</w:t>
patron_exacto = xml.count("<w:t>XX</w:t>")
print(f"Ocurrencias EXACTAS de '<w:t>XX</w:t>': {patron_exacto}")

# 2. Buscar variantes más flexibles (con espacios, atributos, etc.)
variantes = re.findall(r'<w:t[^>]*>\s*XX\s*</w:t>', xml)
print(f"Ocurrencias de 'XX' en CUALQUIER <w:t ...>: {len(variantes)}")
for i, v in enumerate(variantes[:20]):
    print(f"   [{i+1}] {v}")

# 3. Buscar todas las ocurrencias sueltas de 'XX' en el texto (aunque no estén en un tag limpio)
todas = xml.count("XX")
print(f"\nTotal de veces que aparece la subcadena 'XX' en todo el XML: {todas}")

# 4. Se necesitan exactamente 15 campos, en este orden:
CAMPOS = [
    "titulo", "anio", "mes", "dia", "programa", "linea_estrategica",
    "grupo_investigacion", "autor", "codigo", "area_formacion",
    "director", "codirector", "codirector_cargo", "codirector_entidad",
    "objetivo_general", "descripcion_alcances",
]
print(f"\nEl generador espera exactamente {len(CAMPOS)} marcadores, en este orden:")
print("  " + ", ".join(CAMPOS))
