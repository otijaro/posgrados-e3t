# Portal de Gestión de Posgrados E3T — UIS

---

## 🐳 Instalación con Docker (recomendado)

Con Docker todo corre en contenedores — no necesita instalar Python, Node.js ni PostgreSQL manualmente.

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### Pasos

```bash
git clone https://github.com/otijaro/posgrados-e3t.git
cd posgrados-e3t/posgrados-e3t
git checkout Juliam

docker-compose up --build
```

La primera vez tarda ~5 minutos (descarga imágenes y compila). Las siguientes veces es más rápido:

```bash
docker-compose up
```

Abrir en el navegador: **http://localhost:3000**

Para detener:
```bash
docker-compose down
```

---

## ⚡ Instalación manual (sin Docker)

### Windows

```powershell
git clone https://github.com/otijaro/posgrados-e3t.git
cd posgrados-e3t\posgrados-e3t
git checkout Juliam

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
.\start.ps1
```

### Mac/Linux

```bash
git clone https://github.com/otijaro/posgrados-e3t.git
cd posgrados-e3t/posgrados-e3t
git checkout Juliam

bash setup.sh
bash start.sh
```

---

## 🔑 Credenciales

| Rol | Email | Contraseña |
|---|---|---|
| Coordinador | `omar.tijaro@uis.edu.co` | `coordinador123` |
| Secretaria | `secre3t1@uis.edu.co` | `uis2026` |
| Director | `juanmrey@uis.edu.co` | `uis2026` |
| Juliam | `juliam2238321@correo.uis.edu.co` | `uis2026` |

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.12 |
| Base de datos | PostgreSQL 15 |
| Contenedores | Docker + Docker Compose |

---

## 📁 Estructura

```
posgrados-e3t/
├── backend/
│   ├── app/           # FastAPI — modelos, routers, servicios
│   ├── assets/        # Templates y reglamento PDF
│   ├── seed_*.py      # Scripts de datos iniciales
│   └── Dockerfile
├── frontend/
│   ├── src/app/       # Páginas Next.js
│   └── Dockerfile
├── docker-compose.yml # Todo en uno con Docker
├── setup.ps1          # Setup automático Windows
├── setup.sh           # Setup automático Mac/Linux
├── start.ps1          # Arranque Windows
└── start.sh           # Arranque Mac/Linux
```
