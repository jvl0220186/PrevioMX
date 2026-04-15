# Integración PrevioMX_App (Flutter) ↔ PrevioMX_Api

## Base URL y compilación

La app usa `API_BASE_URL` por `--dart-define` (ver `lib/core/config/app_config.dart`).

```text
flutter run --dart-define=API_BASE_URL=https://TU_HOST:PUERTO --dart-define=USE_MOCK_UBICACIONES=false
```

- **Android emulator → API en la PC:** suele usarse `https://10.0.2.2:7145` (o el puerto de `launchSettings.json`).
- **Dispositivo físico:** IP LAN de la máquina que hospeda la API; el certificado HTTPS de desarrollo debe ser confiable en el dispositivo o usar túnel/ngrok.
- **`USE_MOCK_UBICACIONES`:** `true` (defecto) usa ubicaciones de ejemplo; `false` llama al endpoint indicado abajo.

---

## Endpoints ya existentes (consumidos hoy)

| Método | Ruta | Body / params | Respuesta (resumen) | Uso en la app |
|--------|------|---------------|---------------------|---------------|
| POST | `/api/Auth/login` | `{ "usuario", "password" }` | `AuthResponse` | Login operador (ADUASIS vía SP actual) |

**DTO (JSON camelCase, alineado a ASP.NET Core):**

```json
// Request
{ "usuario": "tlopez.lrd", "password": "***" }

// Response 200
{
  "token": "eyJ...",
  "refreshToken": "...",
  "user": {
    "idUsuario": "...",
    "usuario": "...",
    "correoElectronico": "...",
    "equipo": "...",
    "grupoId": "...",
    "lider": "..."
  }
}
```

---

## Endpoints a implementar en `PrevioMX_Api` (módulo móvil)

### 1. Ubicaciones asignadas (ID_01)

| Método | Ruta propuesta | Auth | Respuesta |
|--------|----------------|------|-----------|
| GET | `/api/Mobile/ubicaciones` | Bearer | `UbicacionDto[]` |

**Elemento de lista sugerido:**

```json
{
  "id": "guid-o-código-interno",
  "nombre": "Recinto fiscal X",
  "perfil": "Recinto",
  "idNumericoRecinto": "1001",
  "flujoTerrestre": true
}
```

- `perfil`: `"Recinto"` | `"Bodega"` (la app parsea conteniendo la palabra).
- `idNumericoRecinto`: obligatorio en recintos (RN_02 del backlog).

### 2. Sesión móvil en servidor (opcional pero recomendable)

Registrar en BD la ubicación elegida para auditoría y reglas posteriores.

| Método | Ruta propuesta | Body |
|--------|----------------|------|
| POST | `/api/Mobile/sesion` | `{ "ubicacionId", "idNumericoRecinto", "flujoTerrestre" }` |

### 3. Flujo captura ID_02 (iteraciones siguientes)

Patrón sugerido: recursos por **sesión de captura** o por **referencia provisional**.

Ejemplos de rutas (a detallar con negocio):

- `POST /api/Mobile/guias` — validar guías en recinto / mismo cliente.
- `POST /api/Mobile/recepcion` — confirmar proveedor y banderas (documentos, tránsito, daños, tarima, etc.).
- `POST /api/Mobile/bultos/validar` — validar código 14/23, recinto/bodega, orden de bulto.
- `POST /api/Mobile/captura/fotos` — metadatos + URLs S3 (subida directa a bucket con presigned URLs).
- `POST /api/Mobile/packing-list/inicio` | `.../hoja` — conteo hojas, discrepancias sello/pie.
- `POST /api/Mobile/captura/cerrar` — disparar PDF + cola IA.

Cada una debe devolver códigos HTTP claros y mensajes alineados a las RN del documento.

---

## Subida de archivos (S3)

La app móvil no sube bytes al API síncronamente en esta primera versión. Patrón recomendado:

1. API devuelve **URL prefirmada** (PUT) + `key` S3.
2. Cliente sube la imagen a S3.
3. Cliente notifica al API con `{ key, tipo: etiqueta|producto|documento|evidencia, bultoId, ... }`.

Reutilizar el patrón **NuGet FileStorage** / SDK AWS mencionado en el backlog corporativo.

---

## Lista de stored procedures sugeridos (SQL Server)

Los nombres son propuestas; deben alinearse con convenciones Aduasis (`CSP_PMX_*`, etc.).

### Autenticación y perfil (ya / parcial)

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Login` | Ya usado por la API: valida usuario y devuelve datos para JWT. |
| `CSP_PMX_Mobile_PerfilUbicacion` (nuevo) | Tras login, devuelve tipo de perfil móvil: Recinto/Bodega, terrestre/aéreo, flags desde catálogo usuario–bodega–recinto. |

### ID_01 — Ubicaciones

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_UbicacionesPorUsuario` | Lista recintos/bodegas asignados al `@IdUsuario` filtrados por tipo de perfil (RN_01). Incluye `IdNumericoRecinto` para recintos (RN_02). |

### ID_02 — Recinto (guías y recepción)

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_ValidarGuiaRecinto` | Valida existencia de guía en recinto `@IdUbicacion` / `@IdNumericoRecinto`. |
| `CSP_PMX_Mobile_GuiasMismoCliente` | Valida que un conjunto de guías pertenezca al mismo cliente. |
| `CSP_PMX_Mobile_GuardarRecepcionMercancia` | Persiste proveedor confirmado y banderas (documentos, transportista, tránsito, daños, tarima, reconocimiento, maquinaria, datos tarima/sello, etc.). |
| `CSP_PMX_Mobile_ValidarBultoRecinto` | Bulto existe, pertenece al recinto, no usado, prefijos correctos. |
| `CSP_PMX_Mobile_AsignarGuiaCaptura` | Asocia guía activa para la sesión de captura. |

### ID_02 — Bodega

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_ValidarBultoBodega` | Bulto en bodega seleccionada, no capturado, es bulto 1 al iniciar referencia, orden incremental. |
| `CSP_PMX_Mobile_ConfirmarClienteProveedorReferencia` | Valida/contrasta cliente–proveedor con referencia; permite mismatch con alerta según regla. |
| `CSP_PMX_Mobile_NomEvidencia` | Registra cumplimiento NOM y rutas de evidencia. |

### Captura fotográfica y metadatos

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_RegistrarFotoEtiqueta` | Metadatos + S3 key, calidad aceptada/rechazada, vínculo bulto/partida. |
| `CSP_PMX_Mobile_RegistrarFotoProducto` | Mínimo 2 por producto; validaciones. |
| `CSP_PMX_Mobile_GuardarIdentificacionMMS` | Marca, modelo, serie + origen OCR/manual. |
| `CSP_PMX_Mobile_TextoObservacionProducto` | Texto auxiliar para clasificador (no identificación). |

### Packing list / factura

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_IniciarDocumento` | Tipo PL/factura, número de hojas declarado, estado previo incompleto / cuarentena documental. |
| `CSP_PMX_Mobile_RegistrarHojaDocumento` | Por hoja: índice, S3 key, validación conteo. |
| `CSP_PMX_Mobile_ValidarConsistenciaDocumento` | Recinto: sello portada, pie de página (si aplica), conteo hojas vs escaneadas → discrepancia. |
| `CSP_PMX_Mobile_AutorizarCierreAnticipado` | Valida clave supervisor (RN supervisor packing list). |

### Cierre captura y referencia

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_CerrarCapturaEtiquetas` | Valida ≥1 etiqueta por bulto; resumen. |
| `CSP_PMX_Mobile_GenerarPdfDocumento` | Ensamble PDF desde imágenes (o encola job). |
| `CSP_PMX_Mobile_AsignarReferenciaEntrada` | Misma lógica que “pre-aeropuerto” / folio Aduasis. |
| `CSP_PMX_Mobile_EncolarExtraccionIa` | Inserta trabajo para worker (estado “Procesando documentos”). |

### Cuarentena interna / TL (ID_05, transversal)

| SP | Propósito |
|----|-----------|
| `CSP_PMX_Mobile_CuarentenaInterna_Alta` | Marca referencia/bultos bloqueados. |
| `CSP_PMX_Mobile_CuarentenaInterna_Liberar` | Comentario obligatorio, foto opcional, usuario TL. |
| `CSP_PMX_Mobile_ValidarBloqueoDespacho` | Consultado desde procesos de carga/despacho/tráfico. |

### Catálogos y validaciones cruzadas (reutilizar cuando existan)

- SPs ya usados por **PrevioMX_Web** para partidas, cierre previo, cuarentenas, OpenPO, etc., deben seguir siendo la fuente de verdad donde aplique; la app móvil solo orquesta captura y delega cierre formal al portal cuando corresponda.

---

## Controladores C# sugeridos

- `MobileController` o carpeta `Controllers/Mobile/` con acciones alineadas a las rutas anteriores.
- DTOs en `DTO/Mobile/` con nombres espejo de los JSON usados por Flutter.

---

## Referencia de modelos en Flutter

- `lib/features/auth/data/models/*` — login y `AuthResponse`.
- `lib/features/session/data/models/ubicacion_dto.dart` — lista de ubicaciones.
- `lib/features/session/domain/work_session.dart` — sesión persistida en dispositivo.
