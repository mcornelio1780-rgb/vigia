# Vigia

Plataforma de **reportes ciudadanos georreferenciados**. Los vecinos marcan en un
mapa incidencias de su colonia (baches, alumbrado, fugas, basura, seguridad…) y
pueden seguir su estado hasta que se resuelven.

- **Backend** — API REST en Node/Express sobre **PostgreSQL + PostGIS** para
  consultas geoespaciales (cercanía, bounding box, GeoJSON).
- **Frontend** — **Next.js 16** (App Router) + React 19 + Tailwind, con un mapa
  interactivo de Leaflet.

```
vigia/
├── docker-compose.yml     # PostGIS en localhost:5432
├── backend/               # API Express (puerto 4000)
│   ├── migrations/        # esquema SQL (PostGIS, tablas, índices GIST)
│   ├── seeds/             # datos de ejemplo (CDMX)
│   ├── scripts/           # migrate.js / seed.js
│   └── src/               # index.js, db.js, routes/
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
cp .env.example .env          # DATABASE_URL, PORT
npm install
npm run migrate               # crea la extensión PostGIS, tablas e índices
npm run seed                  # carga categorías + reportes de ejemplo
npm run dev                   # API en http://localhost:4000  (o: npm start)
```

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
(clic en el mapa para fijar la ubicación).

## API

Base: `http://localhost:4000`

| Método  | Ruta                        | Descripción                                            |
| ------- | --------------------------- | ------------------------------------------------------ |
| `GET`   | `/api/health`               | Estado de la API y versión de PostGIS                  |
| `GET`   | `/api/categories`           | Catálogo de categorías                                 |
| `GET`   | `/api/stats`                | Totales por estado y por categoría                     |
| `GET`   | `/api/reports`              | Lista de reportes (con filtros)                        |
| `GET`   | `/api/reports/geojson`      | Mismos reportes como `FeatureCollection` GeoJSON       |
| `GET`   | `/api/reports/:id`          | Detalle de un reporte                                  |
| `POST`  | `/api/reports`              | Crea un reporte                                        |
| `PATCH` | `/api/reports/:id/status`   | Cambia el estado (`abierto`/`en_proceso`/`resuelto`)   |

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
```

## Modelo de datos

- **`categories`** — catálogo (`slug`, `name`, `color`).
- **`reports`** — `id` (uuid), `title`, `description`, `category_id`, `status`,
  `reporter_name`, `location` (`geography(Point,4326)`), timestamps.
  La columna `location` tiene un índice **GIST** para consultas espaciales
  eficientes (`ST_DWithin`, `&&`).

El esquema completo está en `backend/migrations/001_init.sql`.
