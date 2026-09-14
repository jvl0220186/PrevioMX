# Runbook operativo

Síntomas verificados contra `Program.cs`, interceptores Axios y vistas. Complementa [USO_ENDPOINTS.md](USO_ENDPOINTS.md) y [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md).

## Arranque local

| Paso | Qué debe pasar | Si falla |
|---|---|---|
| `dotnet run --launch-profile https` | API en `https://localhost:5001` | Faltan DLLs `onecore.security.*` fuera del repo; o SQL no responde |
| Confiar certificado dev | El navegador acepta HTTPS local | Axios falla en silencio / `ERR_NETWORK` |
| `npm run dev` | App en `http://localhost:5173/PrevioMX/` | Entrar a `/` sin basename deja rutas rotas |
| Login | `POST /api/Auth/login` → JWT | Ver tabla de auth abajo |

CORS solo lista localhost `:5173`, `:3000`, `:5000`. Front en otro host + API local = error de navegador, no de JWT.

## Auth y sesión

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Login 401 | `CSP_PMX_Login` sin fila | Probar usuario de oficina (no email). La vista activa acepta texto libre |
| “Email inválido” en un form | Estás en `LoginForm.jsx` (`type="email"`), **no cableado** | Usar `LoginView.jsx` |
| Tras login, 401 en dashboard | `VITE_DEV_MODE=true` (mock sin JWT) o `VITE_API_BASE_URL` apunta a otro host | Apagar mock; alinear URL |
| Sesión cae al abrir un PDF | `pdf-proxy` respondió **403** (host fuera de allowlist) y el interceptor hace logout | URL debe ser HTTPS de grupoei / aduax / `*.amazonaws.com` |
| Sesión cae en un corte de red | `ECONNABORTED` / `ERR_NETWORK` + JWT vencido | Reloguear; timeout Axios = 30 s |
| Token “recién” emitido ya expiró | Reloj desfasado; `ClockSkew = 0` | Sincronizar hora del cliente |
| Refresh no renueva | `POST /api/Auth/refresh` siempre 401 | Reloguear; no hay persistencia del refresh |
| `register` dice email duplicado | Siempre 409 | No usar esa ruta |

`API_CONFIG.RETRY_ATTEMPTS` / `RETRY_DELAY` **no se usan** en Axios.

## Captura

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Combo de proveedores no termina de cargar | `More` con `pageNumber=0` queda `true` | Scroll extra dispara otra página vacía; no es un 401 |
| OpenPO 400 “Paking es requerido” | UI solo valida `po` | Enviar `packing` en el body |
| MMS no deja guardar | `isRrmms` exige `#series === cantidad`; series case-insensitive únicas | Completar lista; series se fuerzan a mayúsculas |
| Marca/modelo en rojo | `validar-marca` / `validar-modelo` → `valido: false` | Corregir o no se puede agregar serie |
| Token TL “cierra sesión” | No debería: 401 de `valida-token-teamleader` está exceptuado | Si cierra, el 401 vino de otra URL |
| Multibulto parcial | Un `registrar-partida` por bulto; algunos `estatus: false` | Toast lista el bulto que falló |
| Cerrar Previo deshabilitado | Falta checkbox “He verificado los desgloses…” | Marcar; `idUsuario` sale del JWT, no del form |
| No aparece “Reabrir” | Hace falta búsqueda **sin filas** + `existe-previo-cerrado.estatus === true` (debounce 400 ms) | El KPI/filtro de cliente también vacía la tabla; el check usa el término de búsqueda |
| `getClasificacion` 404 | GET inexistente | Usar `POST /api/Clasificacion/validar-post` |
| Cuarentenas no corren al cerrar | No hay cliente UI | Endpoint existe; no está en el flujo |

## PDF / IIS

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `Failed to fetch dynamically imported module` (worker) | IIS no sirve `.mjs` | `public/web.config` ya mapea `application/javascript` |
| Rutas internas 404 en IIS | Falta rewrite SPA | Misma `web.config`: no-archivo → `index.html` |
| Worker 404 en prod | No se copió `pdf.worker.min.mjs` | El plugin Vite lo pone en `dist/` al build |
| PDF 502 | Timeout 30 s o host remoto caído | `HttpClient` se crea **por request** (sin pool) |

## Build / deploy

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `dotnet build` no encuentra metadata | HintPaths de `onecore.security.*` fuera del repo | Colocar las DLLs o ajustar HintPath |
| Cambio de connection string no aplica | `appsettings.json` es `EmbeddedResource` | Reconstruir; override `ConnectionStrings__DefaultConnection` |
| Swagger 404 en preprod | `UseSwagger` solo en Development | Esperado |
| Front llama `192.168.6.185` | Build sin `VITE_API_BASE_URL` | Definir `.env.production` o variable de CI |

## Qué no está implementado (no reportar como regresión)

- Refresh de JWT / registro de usuarios.
- Cliente de `validar-cuarentenas`.
- `GET /api/Clasificacion/{entrada}/{producto}`.
- Uso de `VITE_AB3_URL` y de `RETRY_ATTEMPTS`.
- Persistencia del `refreshToken`.
