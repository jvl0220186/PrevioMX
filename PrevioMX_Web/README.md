# PrevioMX Web

SPA React + Vite para visualizar pendientes de previo, capturar partidas de packing list, trabajar entradas OpenPO y cerrar previos contra la API .NET de PrevioMX.

## Funcionalidad principal

- Login JWT contra `POST /api/Auth/login`.
- Rutas protegidas con React Router y `AuthProvider`.
- Dashboard de pendientes por equipo.
- Captura de partidas, Standard Pack, MMS, multibulto y OpenPO.
- Visualizacion de PDF con OCR por region usando PDF.js y Tesseract.
- Interceptor Axios para agregar JWT y redirigir al login cuando el token expira.

## Estructura

```text
PrevioMX_Web/
├── docs/
│   └── FLUJO_CAPTURA.md
├── public/
│   └── web.config
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── capture/
│   │   ├── common/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── config/
│   ├── contexts/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   └── views/
├── package.json
└── vite.config.js
```

## Instalacion

```bash
npm install
```

Configura `VITE_API_BASE_URL` solo si necesitas sobreescribir la URL por defecto:

```bash
VITE_API_BASE_URL=https://localhost:5001
```

Importante: la variable debe apuntar a la raiz de la API. No agregues `/api`, porque los servicios ya usan rutas como `/api/Visualization/...`.

Si no se define la variable, `src/config/api.config.js` usa:

- Desarrollo: `https://localhost:5001`
- Produccion: `http://192.168.6.185/PrevioMX/Api`

## Scripts

```bash
npm run dev      # servidor Vite, normalmente http://localhost:5173
npm run build    # build de produccion
npm run preview  # preview local del build
npm run lint     # ESLint
```

## Configuracion de Vite e IIS

- `vite.config.js` define `base: '/PrevioMX/'`; el build espera publicarse bajo ese subdirectorio.
- El plugin local copia `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `dist/pdf.worker.min.mjs`.
- `public/web.config` permite servir `.mjs` en IIS y reescribe rutas SPA hacia `index.html`.
- El proxy dev de Vite enruta `/api` hacia `VITE_API_BASE_URL` o `http://localhost:5001`.

## Autenticacion y sesion

La respuesta de login esperada contiene:

```json
{
  "token": "jwt",
  "refreshToken": "refresh_token",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "correoElectronico": "usuario@dominio",
    "equipo": "MANCHESTER",
    "grupoId": "guid",
    "lider": "usuario"
  }
}
```

El frontend guarda `token` y `user` en `localStorage`. `api.service.js`:

- agrega `Authorization: Bearer {token}`;
- decodifica el JWT para detectar expiracion;
- elimina `token`, `user` y `captureData` al redirigir al login;
- no redirige automaticamente cuando falla la validacion de token Team Leader.

`POST /api/Auth/register` y `POST /api/Auth/refresh` estan expuestos por la API, pero no estan implementados en `AuthService`; no deben usarse como flujos productivos.

## Flujo operativo

Consulta `docs/FLUJO_CAPTURA.md` para la secuencia completa:

```text
/dashboard
  -> getPendientes(equipo)
  -> localStorage.captureData
  -> /capture/:reference
  -> getDetalleEntrada + catalogos + proveedor
  -> registrar/actualizar/eliminar partidas
  -> validar-cierre-previo
```

## Endpoints consumidos

La capa `src/services/previo.service.js` consume principalmente:

- `GET /api/Visualization/pendientes/{equipo}`
- `GET /api/Visualization/detalle-entrada/{idEntrada}`
- `GET /api/Catalogos/1` y `GET /api/Catalogos/2`
- `POST /api/Clasificacion/validar-post`
- `POST /api/Protected/valida-token-teamleader`
- `POST /api/Visualization/registrar-partida`
- `PUT /api/Visualization/actualizar-partida`
- `DELETE /api/Visualization/eliminar-partida`
- `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}`

La referencia completa de API esta en `../PrevioMX_Api/HelpFiles/ENDPOINTS_DOMINIO.md`.

