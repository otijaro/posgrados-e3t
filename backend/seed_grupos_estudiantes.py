"""
Actualiza el grupo de investigación de cada estudiante según el Excel.
Uso: python3 seed_grupos_estudiantes.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text
import openpyxl

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "Listado_Estudiantes_Posgrado_2026-I.xlsx")

# Mapa de nombres del Excel → nombres exactos en BD
MAPA_GRUPOS = {
    "gisel":                                                        "GISEL",
    "cps":                                                          "CPS",
    "cemos":                                                        "CEMOS",
    "hdsp":                                                         "HDSP",
    "onchip":                                                       "OnChip",
    "innotec":                                                      "INNOTEC",
    "radiogis":                                                     "RadioGis",
    "gots":                                                         "GOTS",
    "geomatica":                                                    "Geomática, gestión y optimización de sistemas",
    "cides":                                                        "CIDES",
    "grupo de investigación para el desarrollo sostenible en industria y energía - cides": "CIDES",
}

def normalizar(nombre: str) -> str:
    return nombre.strip().lower()

with engine.connect() as conn:
    # Cargar grupos de la BD
    grupos_bd = conn.execute(text(
        "SELECT id, nombre FROM grupo_investigacion WHERE activo = 1"
    )).fetchall()
    mapa_id = {g.nombre: g.id for g in grupos_bd}
    print(f"Grupos en BD: {list(mapa_id.keys())}")

    # Leer Excel
    if not os.path.exists(EXCEL_PATH):
        # Buscar en el directorio padre
        EXCEL_PATH2 = os.path.join(os.path.dirname(__file__), "Listado_Estudiantes_Posgrado_2026-I.xlsx")
        if os.path.exists(EXCEL_PATH2):
            excel = EXCEL_PATH2
        else:
            print(f"❌ Excel no encontrado en: {EXCEL_PATH}")
            print("   Copie el Excel a la carpeta backend/")
            exit(1)
    else:
        excel = EXCEL_PATH

    wb = openpyxl.load_workbook(excel)
    ws = wb.active

    actualizados = 0
    no_encontrados = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        nombre_est, programa, sem, nivel, correo, cel, director, grupo_excel = row
        if not correo or not grupo_excel:
            continue

        # Resolver grupo
        grupo_norm = normalizar(str(grupo_excel))
        nombre_grupo_bd = MAPA_GRUPOS.get(grupo_norm)

        if not nombre_grupo_bd:
            # Intentar match parcial
            for key, val in MAPA_GRUPOS.items():
                if key in grupo_norm or grupo_norm in key:
                    nombre_grupo_bd = val
                    break

        if not nombre_grupo_bd:
            no_encontrados.append(f"{nombre_est}: '{grupo_excel}'")
            continue

        id_grupo = mapa_id.get(nombre_grupo_bd)
        if not id_grupo:
            no_encontrados.append(f"{nombre_est}: grupo '{nombre_grupo_bd}' no está en BD")
            continue

        # Buscar persona por correo
        persona = conn.execute(text(
            "SELECT id FROM persona WHERE email_institucional = :correo"
        ), {"correo": correo.strip()}).fetchone()

        if not persona:
            no_encontrados.append(f"{nombre_est}: correo no encontrado")
            continue

        # Buscar proyecto del estudiante
        proyecto = conn.execute(text("""
            SELECT pg.id FROM proyecto_grado pg
            JOIN estudiante e ON e.id = pg.id_estudiante
            WHERE e.id_persona = :id_persona
            LIMIT 1
        """), {"id_persona": persona.id}).fetchone()

        if not proyecto:
            continue

        # Actualizar grupo en proyecto
        conn.execute(text("""
            UPDATE proyecto_grado
            SET id_grupo_inv = :id_grupo
            WHERE id = :id_proyecto
        """), {"id_grupo": id_grupo, "id_proyecto": proyecto.id})
        actualizados += 1

    conn.commit()

    print(f"\n✅ {actualizados} estudiantes actualizados con grupo de investigación")
    if no_encontrados:
        print(f"⚠️  {len(no_encontrados)} sin resolver:")
        for x in no_encontrados:
            print(f"   - {x}")
