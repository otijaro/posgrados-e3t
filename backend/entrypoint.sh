#!/bin/sh
# Script de inicio del backend — crea tablas, corre seeds y arranca el servidor
set -e

echo "🗄️  Creando tablas..."
python3 -c "
from app.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print('Tablas creadas')
"

echo "🌱 Creando facultad y escuela..."
python3 -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    fac = conn.execute(text('SELECT COUNT(*) FROM facultad')).scalar()
    if fac == 0:
        conn.execute(text(\"INSERT INTO facultad (id, nombre, codigo) VALUES (1, 'Ingenierias Fisicomecánicas', 'FISI') ON CONFLICT (id) DO NOTHING\"))
        conn.execute(text(\"INSERT INTO escuela (id, nombre, codigo, id_facultad) VALUES (1, 'Ingenieria Electrica, Electronica y de Telecomunicaciones', 'E3T', 1) ON CONFLICT (id) DO NOTHING\"))
        conn.commit()
        print('Facultad y Escuela creadas')
    else:
        print('Ya existen')
"

echo "📚 Cargando seeds..."
python3 seed_profesores_2026.py    2>&1 | tail -3
python3 seed_estudiantes_2026.py   2>&1 | tail -3
python3 seed_coordinador.py        2>&1 | tail -3
python3 seed_secretaria.py         2>&1 | tail -3
python3 migracion_firmas.py        2>&1 | tail -3
python3 migracion_dir_grupo.py     2>&1 | tail -3
python3 seed_documentos.py         2>&1 | tail -3
python3 seed_grupos.py             2>&1 | tail -3
python3 seed_roles_completos.py    2>&1 | tail -3

echo "🚀 Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
