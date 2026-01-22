"""
Script para crear el catálogo de roles del sistema.
Ejecutar: python seed_roles.py
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import CatalogoRol
import json


def create_catalog_roles():
    """Crea los roles base del sistema de posgrados."""
    
    db: Session = SessionLocal()
    
    try:
        print("🚀 Creando catálogo de roles...")
        
        roles = [
            {
                "codigo": "coordinador",
                "nombre": "Coordinador de Posgrados",
                "descripcion": "Coordina uno o más programas de posgrado. Tiene acceso completo a la gestión académica.",
                "permisos": json.dumps({
                    "ver_todos_proyectos": True,
                    "asignar_evaluadores": True,
                    "aprobar_propuestas": True,
                    "gestionar_solicitudes": True,
                    "ver_reportes": True
                }),
                "nivel_minimo": "ninguno",
                "requiere_titulo": 1
            },
            {
                "codigo": "director",
                "nombre": "Director de Trabajo de Grado",
                "descripcion": "Dirige proyectos de grado de estudiantes. Puede dirigir múltiples proyectos simultáneamente.",
                "permisos": json.dumps({
                    "ver_proyectos_dirigidos": True,
                    "aprobar_reportes": True,
                    "proponer_evaluadores": True,
                    "firmar_actas": True
                }),
                "nivel_minimo": "maestria",
                "requiere_titulo": 1
            },
            {
                "codigo": "codirector",
                "nombre": "Codirector de Trabajo de Grado",
                "descripcion": "Apoya la dirección de un proyecto de grado junto con el director principal.",
                "permisos": json.dumps({
                    "ver_proyecto": True,
                    "asesorar_estudiante": True,
                    "firmar_actas": True
                }),
                "nivel_minimo": "maestria",
                "requiere_titulo": 1
            },
            {
                "codigo": "estudiante",
                "nombre": "Estudiante de Posgrado",
                "descripcion": "Estudiante activo en un programa de posgrado.",
                "permisos": json.dumps({
                    "ver_mi_proyecto": True,
                    "subir_documentos": True,
                    "inscribir_materias": True,
                    "hacer_solicitudes": True
                }),
                "nivel_minimo": "ninguno",
                "requiere_titulo": 0
            },
            {
                "codigo": "evaluador",
                "nombre": "Evaluador/Jurado",
                "descripcion": "Evalúa propuestas y tesis de grado. Puede ser interno o externo a la universidad.",
                "permisos": json.dumps({
                    "ver_proyecto_asignado": True,
                    "subir_evaluacion": True,
                    "calificar": True
                }),
                "nivel_minimo": "maestria",
                "requiere_titulo": 1
            },
            {
                "codigo": "docente",
                "nombre": "Docente del Programa",
                "descripcion": "Imparte materias en el programa de posgrado.",
                "permisos": json.dumps({
                    "ver_estudiantes_materia": True,
                    "calificar_materia": True,
                    "subir_notas": True
                }),
                "nivel_minimo": "maestria",
                "requiere_titulo": 1
            },
            {
                "codigo": "representante_estudiantes",
                "nombre": "Representante de Estudiantes",
                "descripcion": "Representa a los estudiantes en el comité de posgrados.",
                "permisos": json.dumps({
                    "participar_comite": True,
                    "votar_comite": True
                }),
                "nivel_minimo": "ninguno",
                "requiere_titulo": 0
            },
            {
                "codigo": "representante_profesores",
                "nombre": "Representante de Profesores",
                "descripcion": "Representa a los profesores en el comité de posgrados.",
                "permisos": json.dumps({
                    "participar_comite": True,
                    "votar_comite": True
                }),
                "nivel_minimo": "ninguno",
                "requiere_titulo": 1
            },
            {
                "codigo": "coordinador_grupo",
                "nombre": "Coordinador de Grupo de Investigación",
                "descripcion": "Coordina un grupo de investigación.",
                "permisos": json.dumps({
                    "ver_proyectos_grupo": True,
                    "gestionar_grupo": True
                }),
                "nivel_minimo": "doctorado",
                "requiere_titulo": 1
            }
        ]
        
        for rol_data in roles:
            # Verificar si ya existe
            rol_existente = db.query(CatalogoRol).filter(
                CatalogoRol.codigo == rol_data["codigo"]
            ).first()
            
            if rol_existente:
                print(f"⚠️  Rol '{rol_data['codigo']}' ya existe, omitiendo...")
                continue
            
            rol = CatalogoRol(**rol_data)
            db.add(rol)
            print(f"✅ Rol creado: {rol.nombre}")
        
        db.commit()
        print(f"\n🎉 Catálogo de roles creado exitosamente!")
        print(f"   Total: {len(roles)} roles disponibles")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_catalog_roles()