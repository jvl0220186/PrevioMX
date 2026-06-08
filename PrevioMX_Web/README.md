# PrevioMX Web

SPA React + Vite para el flujo de captura de previos. Consume la API .NET de
PrevioMX con JWT, muestra pendientes por equipo, permite capturar partidas y
renderiza documentos PDF con soporte de OCR.

## Stack

- React 18
- React Router 6
- Vite 5
- Axios
- `pdfjs-dist` para visor PDF
- `tesseract.js` para OCR de areas seleccionadas

## Estructura

```text
PrevioMX_Web/
├── public/web.config          # IIS: MIME .mjs y rewrite de SPA
├── src/
│   ├── components/
│   │   ├── auth/              # Formulario de login
│   │   ├── capture/           # Captura de partidas y visor PDF/OCR
│   │   ├── common/            # Controles reutilizables
│   │   ├── dashboard/         # Tabla y tarjetas de pendientes
│   │   └── layout/            # Header
│   ├── config/api.config.js   # Resolucion de URL base de API
│   ├── contexts/              # AuthProvider/AuthContext
│   ├── routes/AppRoutes.jsx   # Rutas publicas/protegidas
│   ├── services/              # Axios, auth y previoService
│   └── views/                 # Login, dashboard y captura
├── package.json
└── vite.config.js             # base /PrevioMX/ y copia de PDF worker
```

## Instalacion y desarrollo

```bash
npm install
npm run dev
```

Vite publica la app en `http://localhost:5173`.

### Configuracion de API

`src/config/api.config.js` resuelve la base URL asi:

1. `VITE_API_BASE_URL`, si existe.
2. `https://localhost:5001` en desarrollo.
3. `http://192.168.6.185/PrevioMX/Api` en produccion.

Ejemplo `.env.development`:

```bash
VITE_API_BASE_URL=https://localhost:5001
```

No agregues archivos `.env*` con secretos al repositorio.

## Scripts

```bash
npm run dev      # servidor Vite
npm run build    # build de produccion en dist/
npm run preview  # preview local del build
npm run lint     # ESLint
```

## Rutas de la aplicacion

| Ruta | Acceso | Vista | Uso |
| --- | --- | --- | --- |
| `/` | Publica | `LoginView` | Login con usuario/password. |
| `/login` | Redirect | - | Redirige a `/`. |
| `/dashboard` | Protegida | `DashboardView` | Lista pendientes por equipo del usuario. |
| `/capture/:reference` | Protegida | `CaptureView` | Captura y validacion de una referencia. |
| `*` | Redirect | - | Redirige a `/dashboard`. |

`ProtectedRoute` valida `isAuthenticated` desde `AuthProvider`; si no hay sesion,
redirige al login.

## Autenticacion y cliente HTTP

- `auth.service.js` llama `POST /api/Auth/login`.
- `AuthProvider` guarda `token` y `user` en `localStorage`.
- `api.service.js` agrega `Authorization: Bearer <token>` a cada request.
- El interceptor decodifica `exp`; si el token expiro, limpia la sesion y vuelve
  al login.
- Un `401` de `/api/Protected/valida-token-teamleader` no redirige al login
  porque representa una aprobacion fallida, no necesariamente una sesion
  invalida.

## Servicios de dominio

`src/services/previo.service.js` centraliza las llamadas a:

- `CatalogosController`: catalogos simples y proveedores paginados.
- `VisualizationController`: pendientes, detalle, POs, partidas, OpenPO,
  validaciones de cierre, reapertura y proxy PDF.
- `ClasificacionController`: validacion de clasificacion.
- `ProtectedController`: validacion de token Team Leader.

Consulta `../PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md` para contratos HTTP.

## PDF y OCR

`PdfOcrViewer` usa `pdfjs-dist` para renderizar documentos y `tesseract.js` para
extraer texto de un area seleccionada por el usuario.

Consideraciones:

- En desarrollo, el worker de PDF.js se resuelve desde `node_modules`.
- En produccion, `vite.config.js` copia
  `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `dist/pdf.worker.min.mjs`.
- `public/web.config` permite que IIS sirva archivos `.mjs`; sin esto puede
  fallar la carga del worker.
- Si la URL del PDF esta en otro origen, el visor usa
  `/api/Visualization/pdf-proxy?url=...` y adjunta el JWT.
- El proxy de la API solo permite URLs HTTPS de dominios aprobados.

## Build y despliegue IIS

```bash
npm run build
```

El build usa `base: '/PrevioMX/'`, por lo que los assets se publican pensando en
un sitio o aplicacion IIS bajo `/PrevioMX/`.

Checklist:

1. Configurar `VITE_API_BASE_URL` para el ambiente si la URL por defecto no
   aplica.
2. Ejecutar `npm run build`.
3. Publicar el contenido de `dist/`.
4. Conservar `web.config` en el sitio para:
   - servir `pdf.worker.min.mjs` como `application/javascript`;
   - reescribir rutas SPA a `index.html`.
5. Verificar que la API permita el origen donde se hospeda la SPA o que ambos
   queden bajo el mismo host/proxy.

## Troubleshooting

| Sintoma | Causa probable | Accion |
| --- | --- | --- |
| La app no conecta con API | `VITE_API_BASE_URL` apunta a host incorrecto o API apagada | Revisar `src/config/api.config.js`, consola y network tab. |
| Redireccion inmediata a login | Token faltante, expirado o invalido | Hacer login; revisar `localStorage.token`. |
| `Failed to fetch dynamically imported module` para PDF worker | IIS no sirve `.mjs` | Confirmar que `web.config` fue publicado. |
| PDF externo no carga | CORS o host no permitido por proxy | Verificar URL HTTPS y dominios permitidos en `VisualizationController`. |
| OCR no detecta texto | Seleccion muy pequena o baja calidad del documento | Aumentar zoom y seleccionar solo el area relevante. |
