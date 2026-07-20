# Portal de Gestión de Posgrados E3T — UIS

Sistema web para la gestión de programas de posgrado de la Escuela de Ingenierías Eléctrica, Electrónica y de Telecomunicaciones (E3T) de la Universidad Industrial de Santander.

---

## ⚡ Instalación en un solo paso

### Windows

1. Clonar el repositorio:
```cmd
git clone https://github.com/otijaro/posgrados-e3t.git
cd posgrados-e3t\posgrados-e3t
git checkout Juliam
```

2. Abrir **PowerShell como Administrador** y ejecutar:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

> El script detecta automáticamente qué falta instalar (Python, Node.js, Docker), lo instala, levanta la base de datos y carga todos los datos. Al finalizar el proyecto está listo para usarse.

### Mac/Linux

```bash
git clone https://github.com/otijaro/posgrados-e3t.git
cd posgrados-e3t/posgrados-e3t
git checkout Juliam
bash setup.sh
```

---

## 🚀 Arrancar el proyecto (después del setup)

### Windows
```powershell
.\start.ps1
```

### Mac/Linux
```bash
bash start.sh
```

Abrir en el navegador: **http://localhost:3000**

---

## 🔑 Credenciales de acceso

| Rol | Email | Contraseña |
|---|---|---|
| Coordinador | `omar.tijaro@uis.edu.co` | `coordinador123` |
| Secretaria | `secre3t1@uis.edu.co` | `uis2026` |
| Director | `juanmrey@uis.edu.co` | `uis2026` |
| Estudiantes | `nombre2238321@correo.uis.edu.co` | `uis2026` |
| Juliam | `juliam2238321@correo.uis.edu.co` | `uis2026` |

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.11 |
| Base de datos | PostgreSQL 15 (Docker) |
| Autenticación | JWT |

---

## 📁 Estructura del proyecto

```
posgrados-e3t/
├── backend/
│   ├── app/
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── routers/       # Endpoints API
│   │   └── services/      # Lógica de negocio
│   ├── assets/            # Templates de formularios
│   ├── seed_*.py          # Scripts de datos iniciales
│   └── requirements.txt
├── frontend/
│   └── src/app/dashboard/
│       ├── estudiante/    # Panel del estudiante
│       ├── director/      # Panel del director
│       ├── coordinador/   # Panel del coordinador
│       └── secretaria/    # Panel de secretaría
├── docker-compose.yml
├── setup.ps1              # Instalación automática Windows
├── start.ps1              # Arranque rápido Windows
├── setup.sh               # Instalación automática Mac/Linux
└── start.sh               # Arranque rápido Mac/Linux
```
