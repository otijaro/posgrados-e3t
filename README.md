# Sistema de Gestión de Posgrados E3T - UIS

Plataforma web para la gestión integral de programas de posgrado de la Escuela de Estudios Industriales y Empresariales (E3T) de la Universidad Industrial de Santander.

## 🎯 Características Principales

- Gestión de proyectos de grado (tesis/monografías)
- Sistema de solicitudes académicas y administrativas
- Seguimiento de estudiantes por cohorte
- Asignación y seguimiento de evaluadores
- Portal público informativo + dashboards privados por rol
- Multi-rol: Estudiante, Director, Coordinador, Evaluador

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** Next.js 14 (React + TypeScript)
- **Base de Datos:** PostgreSQL 15
- **ORM:** SQLAlchemy
- **Autenticación:** JWT
- **Estilos:** Tailwind CSS
- **Containerización:** Docker

## 📋 Requisitos Previos

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (o Docker)
- Git

## 🚀 Inicio Rápido

### Opción 1: Con Docker (Recomendado)
```bash
# Clonar el repositorio
git clone https://github.com/TU-USUARIO/posgrados-e3t.git
cd posgrados-e3t

# Copiar variables de entorno
cp .env.example .env

# Levantar todos los servicios
docker-compose up
```

Accede a:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Opción 2: Desarrollo Local

Ver [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para instrucciones detalladas.

## 📁 Estructura del Proyecto
```
posgrados-e3t/
├── backend/          # API FastAPI
├── frontend/         # Aplicación Next.js
├── docs/            # Documentación técnica
└── docker-compose.yml
```

## 🤝 Contribución

Este proyecto está en desarrollo activo. Para contribuir:

1. Crea un branch desde `develop`
2. Haz tus cambios
3. Crea un Pull Request

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Proyecto académico - Universidad Industrial de Santander (UIS)

## 👤 Autor

Coordinación de Posgrados - Escuela E3T