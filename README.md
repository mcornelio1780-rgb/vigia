# Vigia

Plataforma de **reportes ciudadanos georreferenciados**. Los vecinos marcan en un
mapa incidencias de su colonia (baches, alumbrado, fugas, basura, seguridad…) y
pueden seguir su estado hasta que se resuelven.

- **Backend** — API REST en Node/Express sobre **PostgreSQL + PostGIS** para
  consultas geoespaciales (cercanía, bounding box, GeoJSON), con **fotos** en los
  reportes y **autenticación de administrador** para gestionar su estado.
- **Frontend** — **Next.js 16** (App Router) + React 19 + Tailwind, con un mapa
  interactivo de Leaflet.

```
vigia/
├── docker-compose.yml     # PostGIS en localhost:5432
├── .github/workflows/     # CI (tests del backend + build del frontend)
├── backend/               # API Express (puerto 4000)
│   ├── migrations/        # esquema SQL (PostGIS, tablas, índices GIST)
│   ├── seeds/             # datos de ejemplo (CDMX)
│   ├── scripts/           # migrate.js / seed.js
│   ├── test/              # tests de la API (node --test)
│   ├── uploads/           # imágenes subidas (servidas en /uploads)
│   └── src/               # app.js, index.js, db.js, auth.js, uploads.js, routes/
└── frontend/              # Next.js (puerto 3000)
```

## Requisitos

- Node.js 20+ (probado con Node 22)
- PostgreSQL 16 con la extensión PostGIS 3.x — vía Docker (`docker-compose.yml`)
  o una instalación local de PostgreSQL + `postgresql-16-postgis-3`.

## Puesta en marcha

### 1. Base de datos con PostGIS

Con Docker (recomendado):

```bash
docker compose up -d          # levanta PostGIS en localhost:5432
```

La base queda disponible en `postgres://vigia:vigia@localhost:5432/vigia`.

> Sin Docker, crea el rol/base equivalentes en tu PostgreSQL local y asegúrate de
> tener instalada la extensión PostGIS; el resto de los pasos es idéntico.

### 2. Backend

```bash
cd backend
cp .env.example .env          # DATABASE_URL, PORT, ADMIN_PASSWORD, AUTH_SECRET
npm install
npm run migrate               # crea la extensión PostGIS, tablas e índices
npm run seed                  # carga categorías + reportes de ejemplo
npm run dev                   # API en http://localhost:4000  (o: npm start)
```

Variables de entorno relevantes (`.env`):

| Variable         | Por defecto                        | Descripción                                  |
| ---------------- | ---------------------------------- | -------------------------------------------- |
| `DATABASE_URL`   | `postgres://vigia:vigia@localhost:5432/vigia` | Conexión a PostGIS                |
| `PORT`           | `4000`                             | Puerto de la API                             |
| `ADMIN_PASSWORD` | `vigia-admin`                      | Contraseña de administrador (**cámbiala**)   |
| `AUTH_SECRET`    | `dev-secret-change-me`             | Secreto para firmar el token (**cámbialo**)  |
| `UPLOADS_DIR`    | `backend/uploads`                  | Carpeta donde se guardan las imágenes        |

Comprobación rápida:

```bash
curl localhost:4000/api/health
# {"status":"ok","postgis":"3.4.2"}
```

### 3. Frontend

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL apunta a la API (por defecto http://localhost:4000)
npm run dev                   # http://localhost:3000
```

Abre <http://localhost:3000>: verás el mapa con los reportes, filtros por
categoría/estado, la lista lateral y el formulario para crear nuevos reportes
(clic en el mapa para fijar la ubicación, con foto opcional). Para cambiar el
estado de un reporte, inicia sesión con **"Entrar como admin"** (contraseña
`ADMIN_PASSWORD`).

## API

Base: `http://localhost:4000`

| Método  | Ruta                        | Auth  | Descripción                                            |
| ------- | --------------------------- | ----- | ------------------------------------------------------ |
| `GET`   | `/api/health`               | —     | Estado de la API y versión de PostGIS                  |
| `GET`   | `/api/categories`           | —     | Catálogo de categorías                                 |
| `GET`   | `/api/stats`                | —     | Totales por estado y por categoría                     |
| `GET`   | `/api/reports`              | —     | Lista de reportes (con filtros)                        |
| `GET`   | `/api/reports/geojson`      | —     | Mismos reportes como `FeatureCollection` GeoJSON       |
| `GET`   | `/api/reports/:id`          | —     | Detalle de un reporte                                  |
| `POST`  | `/api/reports`              | —     | Crea un reporte (acepta `photo_url` de `/api/uploads`) |
| `POST`  | `/api/uploads`              | —     | Sube una imagen (`multipart`, campo `image`) → `{url}` |
| `POST`  | `/api/auth/login`           | —     | `{password}` → `{token}` de administrador              |
| `GET`   | `/api/auth/me`              | admin | Verifica el token de administrador                     |
| `PATCH` | `/api/reports/:id/status`   | admin | Cambia el estado (`abierto`/`en_proceso`/`resuelto`)   |

Las rutas marcadas **admin** requieren el header `Authorization: Bearer <token>`
obtenido en `/api/auth/login`.

### Filtros de `/api/reports` y `/api/reports/geojson`

| Parámetro  | Ejemplo                              | Efecto                                                     |
| ---------- | ------------------------------------ | --------------------------------------------------------- |
| `category` | `?category=baches`                   | Filtra por slug de categoría                              |
| `status`   | `?status=abierto`                    | Filtra por estado                                         |
| `bbox`     | `?bbox=minLng,minLat,maxLng,maxLat`  | Solo reportes dentro del rectángulo                      |
| `near`     | `?near=-99.1332,19.4326`             | Reportes cercanos a un punto (`lng,lat`)                  |
| `radius`   | `?near=…&radius=500`                 | Radio en metros para `near` (por defecto 1000)           |
| `limit` / `offset` | `?limit=50&offset=0`         | Paginación (`limit` máx. 500)                            |

Ejemplos:

```bash
# Reportes abiertos de la categoría "baches"
curl "localhost:4000/api/reports?category=baches&status=abierto"

# Reportes a menos de 500 m del Zócalo, como GeoJSON
curl "localhost:4000/api/reports/geojson?near=-99.1332,19.4326&radius=500"

# Crear un reporte
curl -X POST localhost:4000/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"title":"Fuga de agua","category":"agua","lat":19.44,"lng":-99.14}'

# Subir una foto y crear un reporte con ella
URL=$(curl -s -X POST localhost:4000/api/uploads -F image=@foto.jpg | jq -r .url)
curl -X POST localhost:4000/api/reports \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Bache\",\"category\":\"baches\",\"lat\":19.44,\"lng\":-99.14,\"photo_url\":\"$URL\"}"

# Cambiar el estado (requiere administrador)
TOKEN=$(curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"password":"vigia-admin"}' | jq -r .token)
curl -X PATCH localhost:4000/api/reports/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"resuelto"}'
```

## Autenticación

Un ciudadano puede consultar y crear reportes sin autenticarse. Cambiar el
estado de un reporte requiere ser administrador:

1. `POST /api/auth/login` con `{ "password": ADMIN_PASSWORD }` devuelve un token.
2. Envía ese token en `Authorization: Bearer <token>` en las rutas **admin**.

El token se firma con HMAC-SHA256 usando `AUTH_SECRET` y caduca a las 8 horas
(implementación en `backend/src/auth.js`, sin dependencias externas).

## Tests

El backend tiene una suite de tests de la API con el runner nativo de Node
(`node --test`), que ejercita los endpoints, los filtros geoespaciales, la
autenticación y la subida de imágenes. Necesita una base **de pruebas** aparte:

```bash
# Crea la base de pruebas una vez (PostGIS ya disponible en el servidor)
createdb -h localhost -U vigia vigia_test

cd backend
npm test        # usa vigia_test (o TEST_DATABASE_URL si la defines)
```

Los tests recrean el esquema y sus propios datos en cada corrida; nunca tocan
la base de desarrollo. En **CI** (`.github/workflows/ci.yml`) se ejecutan contra
un servicio `postgis/postgis:16-3.4`, junto con el lint y el build del frontend.

## Modelo de datos

- **`categories`** — catálogo (`slug`, `name`, `color`).
- **`reports`** — `id` (uuid), `title`, `description`, `category_id`, `status`,
  `reporter_name`, `photo_url`, `location` (`geography(Point,4326)`), timestamps.
  La columna `location` tiene un índice **GIST** para consultas espaciales
  eficientes (`ST_DWithin`, `&&`).

El esquema está en `backend/migrations/` (`001_init.sql` y `002_reports_photo.sql`).
