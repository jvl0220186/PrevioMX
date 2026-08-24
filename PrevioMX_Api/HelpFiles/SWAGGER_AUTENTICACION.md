# Autenticación JWT en Swagger UI

Swagger se habilita solo en ambiente `Development` según `Program.cs`.

URLs locales verificadas en `Properties/launchSettings.json`:

- HTTPS: `https://localhost:5001/swagger`
- HTTP: `http://localhost:5000/swagger`

Si usas el perfil `http`, `UseHttpsRedirection()` puede redirigir a HTTPS.

## Paso 1: obtener token

1. Abre Swagger UI.
2. Ejecuta `POST /api/Auth/login`.
3. Usa credenciales válidas del entorno:

   ```json
   {
     "usuario": "USUARIO.MTY",
     "password": "password"
   }
   ```

4. Copia solo el valor de `token`, sin comillas.

Respuesta abreviada:

```json
{
  "token": "eyJ...",
  "refreshToken": "token_de_refresh",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "equipo": "MANCHESTER"
  }
}
```

## Paso 2: autorizar Swagger

1. Haz clic en **Authorize**.
2. Escribe el valor con este formato:

   ```text
   Bearer eyJ...
   ```

3. Haz clic en **Authorize** y luego **Close**.

Reglas:

- No escribas las palabras literales `Bearer Token`.
- No pegues el `refreshToken`.
- No agregues comillas alrededor del JWT.
- Debe existir un espacio entre `Bearer` y el token.

## Paso 3: probar endpoints protegidos

Prueba con un endpoint real de negocio, por ejemplo:

- `GET /api/Visualization/pendientes/{equipo}`
- `GET /api/Visualization/detalle-entrada/{idEntrada}`
- `GET /api/Catalogos/{catalogo}`

Ejemplo para pendientes:

```text
GET /api/Visualization/pendientes/MANCHESTER
```

Si el token es válido, Swagger debe responder `200 OK` y el JSON de `PendientesResponse`.

Para captura/MMS, prueba también `POST /api/Clasificacion/validar-post` (no existe GET `/api/Clasificacion/{idEntrada}/{idProducto}`).

## Rutas declaradas pero no operativas

`POST /api/Auth/register` y `POST /api/Auth/refresh` aparecen en Swagger porque existen en `AuthController`, pero `AuthService` aún no implementa la lógica:

- `register` devuelve `409 Conflict`.
- `refresh` devuelve `401 Unauthorized`.

Usa `POST /api/Auth/login` para obtener un token nuevo cuando expire.

## Errores comunes

### 401: token faltante o formato incorrecto

Soluciones:

- Vuelve a pegar `Bearer {token}` en **Authorize**.
- Copia el token completo desde la respuesta de login.
- Genera un nuevo token si ya expiró.

### 401: firma inválida

El token fue emitido con un `SecretKey` distinto al configurado en la API que lo está validando. Revisa `JwtSettings` y vuelve a hacer login.

### 403: acceso prohibido en `pdf-proxy`

El JWT puede ser válido, pero la URL remota puede tener un host no permitido. `VisualizationController` solo permite HTTPS de dominios `grupoei.com.mx`, `aduax.com` o `.amazonaws.com`.

## Notas operativas

- El backend configura `ClockSkew = TimeSpan.Zero`; cuando el token expira, no hay periodo de gracia.
- El frontend limpia `token`, `user` y `captureData` cuando detecta JWT expirado o un 401/403 no exceptuado.
