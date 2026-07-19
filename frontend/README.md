# Vigia — Frontend

Panel web de **Vigia** (inteligencia climática satelital para el agro) en
**Next.js 16** (App Router) + React 19. Toda la interfaz vive en
`src/components/VigiaApp.jsx` y sigue el flujo **Landing → Login → Dashboard**
con la identidad visual de Vigia (tema verde oscuro, tipografía mono).

- **Landing**: captura de leads (lista de espera y boletín) contra la API, con
  el contador de campos inscritos leído de `/api/leads/stats`.
- **Login / Dashboard**: cuentas de productor reales (signup/login, campos
  guardados con PostGIS, preferencias, cambio de contraseña, exportar/eliminar
  cuenta) y las vistas del panel (clima, sequías, cultivos, plagas, alertas,
  reportes y configuración). Los datos satelitales/agronómicos del dashboard
  son **demo determinista**; el detalle de qué es real vs demo está en el
  [README raíz](../README.md).

## Variables de entorno

| Variable              | Por defecto             | Descripción                                              |
| --------------------- | ----------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL de la API. Es una variable **pública del cliente**, así que se fija en **tiempo de build** (`npm run build` / `--build-arg` en Docker). |

## Scripts

```bash
npm install
npm run dev     # servidor de desarrollo en http://localhost:3000
npm run build   # build de producción
npm run start   # sirve el build
npm run lint    # ESLint
```

## Notas

- Se compila con `output: "standalone"` (ver `next.config.ts`), por lo que el
  `Dockerfile` multi-stage copia `.next/standalone` y arranca con
  `node server.js`.
- Para levantar todo (base PostGIS + API + web) de una vez, usa el
  `docker-compose.yml` de la raíz del repositorio.
