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
# crear backend/.env con las variables de la sección siguiente
npm install
npm run migration:run
npm run start:dev         # API: http://localhost:3000/api
                          # Swagger: http://localhost:3000/api/docs

# 3. Frontend
cd ../frontend
npm install
npm start                 # http://localhost:4200
```

## Variables de entorno

Los archivos `.env` no se versionan. En local se definen en `backend/.env`;
en producción, en la configuración de variables de entorno de la plataforma.

### Backend

| Variable              | Requerida | Ejemplo / valor por defecto          | Descripción                                             |
| --------------------- | :-------: | ------------------------------------ | ------------------------------------------------------- |
| `PORT`                |           | `3000`                               | Puerto HTTP de la API                                   |
| `CORS_ORIGIN`         |           | `http://localhost:4200`              | Origen permitido del frontend                           |
| `DB_HOST`             |    ✅     | `ep-xxx.us-east-2.aws.neon.tech`     | Host de PostgreSQL                                      |
| `DB_PORT`             |           | `5432`                               | Puerto de PostgreSQL                                    |
| `DB_NAME`             |    ✅     | `neondb`                             | Nombre de la base de datos                              |
| `DB_USER`             |    ✅     | `neondb_owner`                       | Usuario de PostgreSQL                                   |
| `DB_PASSWORD`         |    ✅     | —                                    | Contraseña de PostgreSQL                                |
| `DB_SSL`              |           | `true`                               | `true` para bases en la nube (Neon, Supabase…)          |
| `JWT_SECRET`          |    ✅     | —                                    | Secreto para firmar los tokens (largo y aleatorio)      |
| `JWT_EXPIRES_IN`      |           | `1h`                                 | Vigencia del token                                      |
| `MAX_UPLOAD_MB`       |           | `20`                                 | Tamaño máximo por archivo                               |
| `STORAGE_DRIVER`      |           | `s3`                                 | `s3` o `local` (disco)                                  |
| `STORAGE_LOCAL_DIR`   |           | `./storage`                          | Directorio para el driver `local`                       |
| `S3_ENDPOINT`         |           | `http://localhost:8333`              | Endpoint S3 (vacío para AWS S3)                         |
| `S3_REGION`           |           | `us-east-1`                          | Región del bucket                                       |
| `S3_BUCKET`           |           | `gestion-archivos`                   | Nombre del bucket (privado)                             |
| `S3_ACCESS_KEY`       | ✅ (s3)   | —                                    | Access key del bucket                                   |
| `S3_SECRET_KEY`       | ✅ (s3)   | —                                    | Secret key del bucket                                   |
| `S3_FORCE_PATH_STYLE` |           | `true`                               | `true` para SeaweedFS/MinIO/R2; `false` para AWS S3     |

### docker-compose (opcional)

| Variable  | Por defecto | Descripción                            |
| --------- | ----------- | -------------------------------------- |
| `S3_PORT` | `8333`      | Puerto local del almacenamiento S3     |
