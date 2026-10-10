# gestion-archivos

Plataforma web de gestión segura de archivos con control de acceso por **rol** y **área**.

> 🚧 En desarrollo. Este README se completará con el manual técnico y de usuario en `docs/`.

## Stack

| Capa            | Tecnología                                          |
| --------------- | --------------------------------------------------- |
| Frontend        | Angular 21                                          |
| Backend         | NestJS 11 (TypeScript), TypeORM                     |
| Base de datos   | PostgreSQL (instancia externa)                      |
| Almacenamiento  | Bucket privado compatible con S3 (SeaweedFS en dev) |

## Estructura

```
gestion-archivos/
├── backend/            # API REST (NestJS)
├── frontend/           # SPA (Angular)
├── infra/              # Configuración de servicios de infraestructura
├── docs/               # Manuales y diagrama entidad-relación
└── docker-compose.yml  # Almacenamiento S3 para desarrollo
```

## Puesta en marcha (desarrollo)

Requisitos: Node.js 20.19+, Docker y una base de datos PostgreSQL accesible.

```bash
# 1. Almacenamiento S3 local
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env      # completar datos de PostgreSQL y JWT_SECRET
npm install
npm run migration:run
npm run start:dev         # http://localhost:3000/api

# 3. Frontend
cd ../frontend
npm install
npm start                 # http://localhost:4200
```
