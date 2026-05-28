# PrevioMX Web

Aplicacion React + Vite para consultar pendientes, capturar previos, validar partidas y
cerrar/reabrir previos contra la API .NET de PrevioMX.

## Caracteristicas

- Autenticacion JWT con token persistido en `localStorage`.
- Rutas protegidas para Dashboard y Captura.
- Cliente Axios con `baseURL`, timeout, headers e interceptores centralizados.
- Flujo de captura con partidas, OpenPO, Standard Pack, MMS y validaciones de marca/modelo.
- Visor PDF con OCR mediante `pdfjs-dist` y `tesseract.js`.

## Estructura del proyecto

```
PrevioMX_Web/
├── src/
│   ├── components/
│   │   ├── auth/              # Formulario de login
│   │   ├── capture/           # Formulario de partidas y visor PDF/OCR
│   │   ├── common/            # Dropdowns, loading, toast, proveedores
│   │   ├── dashboard/         # Tabla y tarjetas de dashboard
│   │   └── layout/            # Header
│   ├── config/                # API_CONFIG y URL base
│   ├── contexts/              # AuthProvider/AuthContext
│   ├── routes/                # Rutas publicas y protegidas
│   ├── services/              # auth.service, api.service, previo.service
│   ├── styles/                # Estilos globales y por vista
│   └── views/                 # LoginView, DashboardView, CaptureView
├── public/web.config          # Reglas IIS para SPA
├── vite.config.js             # Base /PrevioMX/ y worker PDF
└── package.json
```

## Instalacion

```bash
npm install
```

Configura la URL base de la API si no quieres usar los valores por defecto:

```bash
# .env.development o .env.production
VITE_API_BASE_URL=https://localhost:5001
```

Notas:

- `api.service.js` agrega rutas como `/api/Auth/login`; por eso `VITE_API_BASE_URL` debe
  apuntar al host/base de la API, no necesariamente terminar en `/api`.
- En desarrollo, si no hay variable de entorno, `api.config.js` usa
  `https://localhost:5001`.
- En produccion, si no hay variable de entorno, usa `http://192.168.6.185/PrevioMX/Api`.
- `vite.config.js` configura `base: '/PrevioMX/'`; las rutas generadas asumen despliegue
  bajo ese subdirectorio.

## Desarrollo

```bash
npm run dev
```

Vite levanta la aplicacion en `http://localhost:5173` por defecto. El servidor Vite
tambien proxya `/api` hacia `VITE_API_BASE_URL` o `http://localhost:5001`.

## Build

```bash
npm run build
```

Durante el build, el plugin `copyPdfWorker` copia
`node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `dist/pdf.worker.min.mjs`. Esto es
necesario para que el visor PDF funcione en IIS usando la base `/PrevioMX/`.

## Autenticacion

El login llama a:

```http
POST /api/Auth/login
```

Body:

```json
{
  "usuario": "YROSALES.MTY",
  "password": "..."
}
```

Respuesta usada por el frontend:

```json
{
  "token": "jwt",
  "refreshToken": "valor-generado",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "correoElectronico": "yrosales.mty@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "yrosales.mty"
  }
}
```

`api.service.js` agrega `Authorization: Bearer {token}` a cada request autenticado. Si el
JWT esta expirado o la API responde `401/403`, limpia `token`, `user` y `captureData` y
redirige al login. La validacion de token Team Leader es la excepcion: sus `401/403` se
devuelven al formulario para mostrar el error.

> Nota: `auth.service.js` conserva metodos `register` y `refreshToken`, pero la API actual
> no implementa registro ni refresh funcional en `AuthService`.

## Flujo Dashboard -> Captura

1. `DashboardView` lee `user.equipo` de `localStorage` y llama a
   `previoService.getPendientes(equipo)`.
2. Al seleccionar un pendiente, guarda `captureData` en `localStorage` y navega a
   `/capture/:reference`.
3. `CaptureView` combina `captureData` con `getDetalleEntrada(reference)`, catalogos de
   unidades (`getCatalogo(1)`) y paises (`getCatalogo(2)`).
4. Si el previo es OpenPO (`esOpenPO`/`esOpenpo`), carga `getDetallePOs(reference)`.
5. El cierre muestra un modal para `discrepancia` y `aplicaNom144`, y llama a
   `validarCierrePrevio(reference, discrepancia, aplicaNom144)`.

## Captura de partidas

`AddPartidasForm` concentra las reglas de alta/edicion/eliminacion:

- Valida clasificacion y Standard Pack con `POST /api/Clasificacion/validar-post`.
- Registra partidas con `POST /api/Visualization/registrar-partida`.
- Actualiza partidas con `PUT /api/Visualization/actualizar-partida`.
- Elimina partidas con `DELETE /api/Visualization/eliminar-partida`.
- Valida marca/modelo con `validar-marca` y `validar-modelo`.
- En OpenPO permite agregar PO/packing mediante `agregar-openpo`.

Cuando Standard Pack trae `isSpmms` se muestra el bloque MMS; cuando trae `isRrmms`, MMS
es obligatorio. Si OpenPO y Standard Pack difieren en unidad o pais, el usuario elige que
valor usar; elegir OpenPO puede requerir validacion por Team Leader.

## Reapertura de previos cerrados

Si una busqueda del Dashboard no aparece en pendientes, se consulta
`existePrevioCerrado(referencia)`. Si existe, el modal pide usuario/password y llama a
`puedeReabrirPrevio`. Cuando la API responde `puedeRegenerar: true`, el frontend llama a
`reabrePrevio`, guarda el resultado como `captureData` y abre `/capture/{referencia}`.

## PDF y OCR

`PdfOcrViewer`:

- Renderiza PDFs con `pdfjs-dist`.
- Usa `tesseract.js` con idioma `spa` para OCR sobre una seleccion del canvas.
- En produccion usa el worker `BASE_URL + 'pdf.worker.min.mjs'`.
- Si el PDF viene de otro origen, usa
  `/api/Visualization/pdf-proxy?url={urlCodificada}` desde la API configurada.

El proxy de PDF solo acepta HTTPS para hosts `grupoei.com.mx`, `aduax.com` y
`*.amazonaws.com`.

## Troubleshooting

- **Login redirige inmediatamente:** revisa expiracion del JWT, `JwtSettings` de API y que
  el reloj del equipo no este desfasado.
- **Requests duplican `/api`:** revisa `VITE_API_BASE_URL`; el servicio ya agrega rutas
  `/api/...`.
- **PDF no carga en produccion:** confirma que `dist/pdf.worker.min.mjs` fue copiado y que
  el host del PDF esta permitido por el proxy.
- **OpenPO no muestra productos:** valida que `detalle-pos/{idEntrada}` devuelva `items`
  con `po`, `idProducto`, `um` y `paisOrigen`.
