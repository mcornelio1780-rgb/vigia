# Vigia

[![CI](https://github.com/mcornelio1780-rgb/vigia/actions/workflows/ci.yml/badge.svg)](https://github.com/mcornelio1780-rgb/vigia/actions/workflows/ci.yml)

**Inteligencia climática satelital para el campo.** Vigia vigila una parcela
desde el satélite y avisa por WhatsApp/SMS/correo cuando el riesgo de **incendio,
sequía, inundación, plaga, helada o viento** cruza el umbral que define el
productor — zona por zona, en cualquier país.

- **Frontend** — **Next.js 16** (App Router) + React 19: **Landing → Login →
  Dashboard**, con la identidad visual de Vigia (tema oscuro, mapa de parcela por
  zonas NDVI, riesgos, clima, cultivos, plagas, alertas y configuración), más un
  **panel de administrador** para consultar y exportar los leads. Interfaz en
  **español, inglés y portugués** (ES/EN/PT) con un selector de idioma.
- **Backend** — API REST en Node/Express sobre **PostgreSQL + PostGIS**: captura
  de interés (**lista de espera** y **boletín**) con la ubicación del campo como
  geografía, **pronóstico real** (Open-Meteo), **PDF de evidencia** para el seguro
  y autenticación de administrador.

```
vigia/
├── docker-compose.yml     # PostGIS en localhost:5432
├── .github/workflows/     # CI (tests del backend + lint/build del frontend)
├── backend/               # API Express (puerto 4000)
│   ├── migrations/        # esquema SQL (PostGIS, tabla leads, índices GIST)
│   ├── seeds/             # interés de ejemplo repartido por países
│   ├── scripts/           # migrate.js / seed.js
│   ├── test/              # tests de la API (node --test)
│   └── src/               # app.js, index.js, db.js, auth.js, routes/
└── frontend/              # Next.js (puerto 3000)
    └── src/components/VigiaApp.jsx   # Landing + Login + Dashboard
```

> **Qué es real y qué es demo.** Son **reales** (contra la API + PostGIS): la
> captura de leads del landing y su contador, el **panel de administrador**
> (login + listado + CSV), el **pronóstico del clima** (Open-Meteo, con fallback
> a demo si no hay red) y el **PDF de evidencia** que genera el dashboard. Siguen
> siendo **demo determinista** los datos satelitales/agronómicos del dashboard
> (parcelas, NDVI, precios). Conectar el resto de fuentes en vivo (NASA FIRMS,
> Sentinel-2, ERA5, SoilGrids) es el siguiente paso.

## Requisitos

- Node.js 20+ (probado con Node 22)
- PostgreSQL 16 con la extensión PostGIS 3.x — vía Docker (`docker-compose.yml`)
  o una instalación local de PostgreSQL + `postgresql-16-postgis-3`.

## Puesta en marcha

### Opción A — todo con Docker (recomendado)

Levanta la base, la API y el frontend con un solo comando:

```bash
docker compose up --build
```

- Web: <http://localhost:3000> · API: <http://localhost:4000> · PostGIS: `localhost:5432`
- La API aplica migraciones y la semilla automáticamente al arrancar.
- Variables opcionales (`ADMIN_PASSWORD`, `AUTH_SECRET`, `FIRMS_MAP_KEY`,
  `NEXT_PUBLIC_API_URL`) se pueden definir en un archivo `.env` junto al compose.

### Opción B — desarrollo local (solo la base en Docker)

### 1. Base de datos con PostGIS

```bash
docker compose up -d db       # levanta solo PostGIS en localhost:5432
```

Queda disponible en `postgres://vigia:vigia@localhost:5432/vigia`.

### 2. Backend

```bash
cd backend
cp .env.example .env          # DATABASE_URL, PORT, ADMIN_PASSWORD, AUTH_SECRET
npm install
npm run migrate               # crea PostGIS, la tabla leads y sus índices
npm run seed                  # interés de ejemplo (opcional, idempotente)
npm run dev                   # API en http://localhost:4000  (o: npm start)
```

`npm run migrate` y `npm run seed` son **idempotentes**: las migraciones usan
`IF NOT EXISTS` y el seed solo carga los datos de ejemplo si la tabla `leads`
está vacía, así que puedes ejecutarlos varias veces sin duplicar nada.

Comprobación rápida:

```bash
curl localhost:4000/api/health          # {"status":"ok","postgis":"3.4.2","uptime":...}
curl localhost:4000/api/version         # {"name":"vigia-backend","version":"0.1.0","uptime":...}
curl localhost:4000/api/leads/stats     # {"waitlist":6,"newsletter":2,...}
```

Variables de entorno (`.env`):

| Variable         | Por defecto                                   | Descripción                                 |
| ---------------- | --------------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`   | `postgres://vigia:vigia@localhost:5432/vigia` | Conexión a PostGIS                          |
| `PORT`           | `4000`                                        | Puerto de la API                            |
| `ADMIN_PASSWORD` | `vigia-admin`                                 | Contraseña de administrador (**cámbiala**)  |
| `AUTH_SECRET`    | `dev-secret-change-me`                        | Secreto para firmar el token (**cámbialo**) |
| `DATABASE_SSL`   | _(desactivado)_                               | `true` para TLS con Postgres gestionado     |

### 3. Frontend

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL apunta a la API (por defecto http://localhost:4000)
npm run dev                   # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` es una variable **pública del cliente**, así que su valor
se **fija en tiempo de build** (`npm run build`; en Docker se pasa con
`--build-arg NEXT_PUBLIC_API_URL=...`). Para producción, apúntala a la URL
pública de la API antes de construir el frontend.

Abre <http://localhost:3000>: verás el landing de Vigia. Al enviar tu correo en
**"Pedir acceso"** o en el boletín, el registro se guarda de verdad en PostGIS
(pruébalo con `GET /api/leads`). Desde **"Ver demo"** entras al dashboard.

## Despliegue en producción

El repo incluye un **blueprint de Render** (`render.yaml`) que levanta los tres
componentes desde los mismos Dockerfiles del desarrollo local:

- **`vigia-db`** — Postgres 16 gestionado (PostGIS se habilita solo en la
  primera migración).
- **`vigia-api`** — la API; `DATABASE_URL` se enlaza a la base, las migraciones
  se aplican en `preDeployCommand` y `/api/health` es el _health check_.
- **`vigia-web`** — el frontend Next.js standalone.

**Pasos en Render:**

1. En [Render](https://render.com): **New → Blueprint**.
2. Conecta este repositorio.
3. Render lee `render.yaml` y crea los servicios `vigia-db` (PostGIS),
   `vigia-api` y `vigia-web`.
4. Define en el panel los valores que **no se versionan** (tabla siguiente).
5. El primer despliegue aplica las migraciones (`preDeployCommand` de
   `vigia-api`) y la app queda en vivo.

Valores a definir en el panel:

| Servicio    | Variable              | Valor                                                            |
| ----------- | --------------------- | ---------------------------------------------------------------- |
| `vigia-api` | `ADMIN_PASSWORD`      | contraseña del panel de administración                           |
| `vigia-api` | `FIRMS_MAP_KEY`       | _(opcional)_ MAP_KEY de la NASA para focos de incendio en vivo   |
| `vigia-web` | `NEXT_PUBLIC_API_URL` | la URL pública de `vigia-api`, p. ej. `https://vigia-api.onrender.com` |

`AUTH_SECRET` se genera automáticamente y `DATABASE_URL`/`DATABASE_SSL` quedan
configuradas por el blueprint. Cualquier otro proveedor con Docker + Postgres
sirve igual: construye ambas imágenes, activa `DATABASE_SSL=true` si el Postgres
exige TLS y fija `NEXT_PUBLIC_API_URL` en el build del frontend.

## API

Base: `http://localhost:4000`

| Método   | Ruta                   | Auth    | Descripción                                                        |
| -------- | ---------------------- | ------- | ------------------------------------------------------------------ |
| `GET`    | `/api/health`          | —       | Estado de la API, versión de PostGIS y uptime                      |
| `GET`    | `/api/version`         | —       | Nombre, versión (de `package.json`) y uptime                       |
| `GET`    | `/api/weather`         | —       | Pronóstico real del campo (`?lat=&lng=`, Open-Meteo); 502 sin red  |
| `GET`    | `/api/fires`           | —       | Focos de calor cercanos (`?lat=&lng=`, NASA FIRMS); 503 sin `FIRMS_MAP_KEY` |
| `POST`   | `/api/report`          | —       | Genera un PDF de evidencia satelital del campo                     |
| `POST`   | `/api/leads`           | —       | Alta en lista de espera o boletín (idempotente por email+kind)     |
| `GET`    | `/api/leads/stats`     | —       | Conteos públicos (lista de espera, boletín, países)                |
| `GET`    | `/api/leads`           | admin   | Listado de registros (filtros `?kind=`, `?country=`; paginación `?limit=&offset=`) |
| `POST`   | `/api/auth/login`      | —       | `{password}` → `{token}` de administrador                          |
| `GET`    | `/api/auth/me`         | admin   | Verifica el token de administrador                                 |
| `POST`   | `/api/users/signup`    | —       | Alta de productor (`{email, password, name}`) → `{user, token}`    |
| `POST`   | `/api/users/login`     | —       | Inicio de sesión del productor → `{user, token}`                   |
| `GET`    | `/api/users/me`        | usuario | Perfil del productor y sus campos                                  |
| `PUT`    | `/api/users/me`        | usuario | Actualiza el nombre del perfil                                     |
| `DELETE` | `/api/users/me`        | usuario | Elimina la cuenta y sus campos (en cascada)                        |
| `GET`    | `/api/users/stats`     | usuario | Resumen del productor (nº de campos, hectáreas, ubicaciones, alta) |
| `GET`    | `/api/users/export`    | usuario | Descarga en JSON el perfil, los campos y las preferencias          |
| `PUT`    | `/api/users/password`  | usuario | Cambia la contraseña (verifica la actual)                          |
| `GET`    | `/api/users/farms`     | usuario | Lista los campos del productor                                     |
| `POST`   | `/api/users/farms`     | usuario | Crea un campo (`{name, lat?, lng?, hectares?}`)                    |
| `GET`    | `/api/users/farms/:id` | usuario | Obtiene un campo propio por id                                     |
| `PUT`    | `/api/users/farms/:id` | usuario | Edita un campo propio (actualización parcial)                     |
| `DELETE` | `/api/users/farms/:id` | usuario | Borra un campo propio                                              |
| `GET`    | `/api/users/settings`  | usuario | Preferencias (umbrales y canales de alerta)                        |
| `PUT`    | `/api/users/settings`  | usuario | Guarda (fusiona) las preferencias                                  |

Las rutas **admin** usan el token de `POST /api/auth/login`; las rutas
**usuario** usan el token que devuelven `POST /api/users/signup` y
`POST /api/users/login`. En ambos casos se envía como
`Authorization: Bearer <token>`.

`GET /api/health` y `GET /api/version` sirven para monitoreo. `uptime` son los
segundos que lleva viva la API:

```jsonc
// GET /api/health
{ "status": "ok", "postgis": "3.4.2", "uptime": 123 }

// GET /api/version
{ "name": "vigia-backend", "version": "0.1.0", "uptime": 123 }
```

`POST /api/leads` acepta: `email` (obligatorio), `kind` (`waitlist` | `newsletter`,
por defecto `waitlist`), y opcionalmente `name`, `country`, `hectares`, `lat`, `lng`
(ubicación del campo, guardada como `geography(Point,4326)`).

Ejemplos:

```bash
# Alta en la lista de espera con la ubicación del campo
curl -X POST localhost:4000/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"email":"maria@campo.ar","kind":"waitlist","country":"Argentina","hectares":480,"lat":-33.13,"lng":-64.35}'

# Suscripción al boletín
curl -X POST localhost:4000/api/leads \
  -H 'Content-Type: application/json' -d '{"email":"lector@correo.com","kind":"newsletter"}'

# Listar registros (administrador), filtrando y paginando
TOKEN=$(curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"password":"vigia-admin"}' | jq -r .token)
curl -H "Authorization: Bearer $TOKEN" "localhost:4000/api/leads?kind=waitlist&country=Argentina"
# Paginación: limit (por defecto 100, máx 500) y offset (por defecto 0)
curl -H "Authorization: Bearer $TOKEN" "localhost:4000/api/leads?limit=50&offset=100"
```

`GET /api/leads` admite los filtros `?kind=` y `?country=` (sin distinguir
mayúsculas, combinables) y la paginación `?limit=` (por defecto 100, máximo 500)
y `?offset=` (por defecto 0); los registros se devuelven del más reciente al más
antiguo.

**`POST /api/report`** genera el PDF de evidencia a partir de un JSON
`{ farm, risks, zones, lang }`:

- `farm` (**obligatorio**): datos del campo — `label`, `country`, `coord`,
  `hectares`, `elev`… Sin `farm` responde `400`.
- `risks`: objeto de riesgos (`fire`, `drought`, `flood`, `pest`, `frost`, `wind`).
- `zones`: array de zonas (`{ id, crop, ndvi, ha, fire, soil }`).
- `lang`: idioma del documento (`"es"` | `"en"`).

Responde el archivo con `Content-Type: application/pdf`.

**`GET /api/fires`** devuelve los focos de calor cercanos usando **NASA FIRMS**
(VIIRS, casi en tiempo real). Requiere una `FIRMS_MAP_KEY` gratuita
([solicítala aquí](https://firms.modaps.eosdis.nasa.gov/api/map_key/)); sin ella,
responde `503` y el dashboard usa el riesgo de incendio de demostración. La
fuente por defecto es `FIRMS_SOURCE=VIIRS_SNPP_NRT`.

**Formato de errores.** Toda respuesta de error devuelve JSON con la forma
`{ "error": "mensaje" }` y el código HTTP correspondiente: `400` (validación),
`401` (autenticación), `404` (no encontrado), `409` (conflicto), `413` (cuerpo
demasiado grande), `429` (demasiadas solicitudes) y `500`/`502`/`503`
(error del servidor o de una fuente externa).

## Autenticación

Cualquiera puede darse de alta (lista de espera / boletín). Consultar los
registros requiere ser administrador: `POST /api/auth/login` con la
`ADMIN_PASSWORD` devuelve un token firmado con HMAC-SHA256 (`AUTH_SECRET`) que
caduca a las 8 horas — implementación sin dependencias en `backend/src/auth.js`.

## Límites de uso (rate limiting)

Los endpoints públicos de escritura tienen un límite por IP con ventana de
1 minuto:

| Endpoint(s)                                                        | Límite   |
| ------------------------------------------------------------------ | -------- |
| `POST /api/leads`                                                  | ~30/min  |
| `POST /api/report`                                                 | ~20/min  |
| `POST /api/auth/login`, `/api/users/signup`, `/api/users/login`, `/api/users/password` | ~15/min  |

Las respuestas incluyen `X-RateLimit-Limit` y `X-RateLimit-Remaining`; al superar
el cupo devuelven `429` con `Retry-After`. Es en memoria **por proceso**; para
varias instancias conviene un store compartido (p. ej. Redis).

## Tests

~75 pruebas con el runner nativo de Node (`node --test`). Cubren, contra
PostGIS: salud, alta/validación/idempotencia y estadísticas de leads, listado
protegido y autenticación de administrador; cuentas de productor
(registro/login/perfil), campos PostGIS (alta, detalle, edición, borrado),
preferencias, cambio de contraseña, exportación y borrado de cuenta. Y sin base
de datos: contraseñas (scrypt), tokens y middlewares de autenticación,
validación de email/nombre, saneo de preferencias, distancias FIRMS, mapeo del
clima (Open-Meteo) y generación del PDF. Usa una base **de pruebas** aparte y
nunca toca la de desarrollo.

```bash
createdb -h localhost -U vigia vigia_test   # una sola vez
cd backend && npm test
```

En **CI** (`.github/workflows/ci.yml`) corren contra un servicio
`postgis/postgis:16-3.4`, junto con el lint y el build del frontend.

## Modelo de datos

- **`leads`** — `id` (uuid), `email`, `kind` (`waitlist` | `newsletter`), `name`,
  `country`, `hectares`, `location` (`geography(Point,4326)`), `created_at`.
  Restricción `UNIQUE(email, kind)` (altas idempotentes) e índice **GIST** sobre
  `location` para consultas geoespaciales de cobertura.

El esquema está en `backend/migrations/001_init.sql`.
