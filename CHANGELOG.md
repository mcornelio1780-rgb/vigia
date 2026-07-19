# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí. El formato
sigue, de forma sencilla, [Keep a Changelog](https://keepachangelog.com/es/).

> **Qué es real y qué es demo.** Son **reales** (contra la API + PostGIS): la
> captura de leads del landing y su contador, las **cuentas de productor** y sus
> **campos** (geografía en PostGIS), las **preferencias**, el **cambio de
> contraseña**, la **exportación/borrado de cuenta**, el **PDF de evidencia** y
> el **clima** (Open-Meteo) / **focos FIRMS** cuando hay red y clave. Siguen
> siendo **demo determinista** los datos satelitales/agronómicos del dashboard
> (parcelas, NDVI, precios).

## [No publicado]

### Backend / API

- Captura de **leads** públicos (lista de espera y boletín), idempotente por
  `(email, kind)` y con la ubicación del campo como `geography(Point,4326)`.
- **Panel de administrador** (token HMAC-SHA256 sin dependencias) para listar
  leads, con filtros `?kind=` y `?country=` y paginación `?limit=&offset=`.
- **Cuentas de productor**: registro e inicio de sesión, perfil, cambio de
  nombre, **cambio de contraseña**, **exportar mis datos** y **borrar cuenta**.
- **Campos** del productor en PostGIS: alta, listado, detalle individual,
  edición (parcial, conservando la ubicación) y borrado.
- **Preferencias** del usuario (umbrales y canales de alerta) con saneo.
- `GET /api/users/stats` (resumen del productor) y `GET /api/version`; `uptime`
  añadido a `/api/health`.
- **Cabeceras de seguridad** (incl. `Permissions-Policy` y
  `Cross-Origin-Resource-Policy`), **rate limiting** en memoria por IP y
  **validación compartida** de email y de longitud de nombre.
- Respuestas de error homogéneas en JSON `{ "error": "mensaje" }`.
- **Clima real** (Open-Meteo), **focos de calor** (NASA FIRMS) y **PDF de
  evidencia** (pdfkit), con degradación elegante cuando no hay red o clave.

### Frontend

- **Landing** con la identidad visual de Vigia (tema verde oscuro): captura
  real de leads y contador de campos inscritos leído de `/api/leads/stats`.
- **Login** + **Dashboard**: vista general, geomapa, clima, sequías, cultivos,
  plagas, alertas, reportes y configuración.
- Tarjeta **"Tu cuenta"** con datos reales, alta/edición/borrado de campos y
  contador de "Mis campos".
- **i18n ES/EN/PT completa**: selector de idioma en todo el producto (landing,
  login, dashboard, panel admin) y **todos los datos agronómicos demo**
  traducidos, con términos correctos del mercado brasileño (p. ej.
  *Lagarta-do-cartucho*, *Milho safrinha*). El **PDF de evidencia** también en PT.
- **Vista móvil**: las métricas del panel se muestran en 2 columnas en pantallas
  chicas para acercar el mapa satelital; iniciales de mes del calendario según
  idioma; formato de hectáreas con separador de miles.
- **Accesibilidad**: aria-labels en controles, foco visible (`:focus-visible`),
  `aria-hidden` en los logotipos decorativos y `<html lang>` reflejado.
- **Robustez**: los formularios del landing y el login muestran un mensaje amable
  y localizado cuando la API no responde (en vez de un error técnico).
- **SEO / metadata**: `robots.txt`, `sitemap.xml`, datos estructurados JSON-LD
  (Organization + SoftwareApplication, solo datos reales) y OpenGraph/Twitter.
- **Seguridad del frontend**: cabeceras (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
- **Página 404** con la identidad de Vigia (mensaje trilingüe, noindex).

### Infraestructura y calidad

- **Docker** y **docker-compose** (base PostGIS + API + web) con
  *healthchecks*; Dockerfiles multi-stage (Next.js `standalone`).
- **Blueprint de Render** (`render.yaml`) con TLS opcional para Postgres
  gestionado.
- **CI** (GitHub Actions) con servicio Postgres/PostGIS: pruebas del backend y
  lint/build del frontend.
- ~70 pruebas de backend (`node --test`), con una batería de **pruebas
  unitarias sin base de datos**: contraseñas (scrypt), tokens (HMAC),
  validación de email/nombre, saneo de preferencias, distancias FIRMS
  (haversine), generación de PDF y mapeo del clima con datos parciales.
- **Documentación**: formato de errores, respuestas de `/api/health` y
  `/api/version`, idiomas ES/EN/PT, `DATABASE_SSL` en `.env.example`, README
  del frontend y este CHANGELOG.
