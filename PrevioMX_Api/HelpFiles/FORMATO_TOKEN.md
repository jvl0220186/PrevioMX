# Formato correcto del token JWT

Los endpoints protegidos de PrevioMX requieren un JWT en el header `Authorization`. El token lo emite `POST /api/Auth/login` y se valida con la configuración `JwtSettings` de la API.

## Header correcto

```http
Authorization: Bearer eyJ...
```

Características:

- Sin comillas alrededor del token.
- Un solo espacio después de `Bearer`.
- Token completo, sin saltos de línea.
- Solo el JWT del campo `token`; no incluir `refreshToken`.

## Headers incorrectos

```http
Authorization: Bearer "eyJ..."
```

```http
Authorization: "Bearer eyJ..."
```

```http
Authorization: Bearer eyJ...", "refreshToken": "abc..."
```

```http
Authorization: Bearer  eyJ...
```

## Ejemplos por herramienta

### cURL

```bash
TOKEN="eyJ..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript Fetch

```javascript
const token = 'eyJ...'

const response = await fetch('https://localhost:5001/api/Visualization/detalle-entrada/REF123', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const data = await response.json()
```

### Axios

```javascript
const token = 'eyJ...'

const response = await axios.get(
  'https://localhost:5001/api/Visualization/pendientes/MANCHESTER',
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
)
```

El frontend ya configura esto en `src/services/api.service.js`: lee `localStorage.token`, valida el `exp` del JWT y agrega `Authorization` antes de cada request.

## Claims esperados

`JwtService` genera el token con los datos de `LoginResultDto`. Los claims usados por la API incluyen:

- `ClaimTypes.NameIdentifier`: `idUsuario`; se usa, por ejemplo, al cerrar previo.
- `ClaimTypes.Email`: correo electrónico.
- `ClaimTypes.Name`: usuario.
- `Equipo`, `GrupoId`, `Lider`.
- `jti`.
- `iss` y `aud`, que deben coincidir con `JwtSettings:Issuer` y `JwtSettings:Audience`.

## Validación en backend

`Program.cs` configura:

- `ValidateIssuer = true`.
- `ValidateAudience = true`.
- `ValidateLifetime = true`.
- `ValidateIssuerSigningKey = true`.
- `ClockSkew = TimeSpan.Zero`.

Esto significa que un token expirado falla inmediatamente; no hay margen adicional de tiempo.

## Solución de problemas

### Firma inválida

Causas comunes:

1. `SecretKey` distinto entre quien emitió y quien valida el token.
2. Token truncado o copiado con caracteres extra.
3. Comillas o fragmentos JSON pegados en el header.

Solución:

1. Haz login nuevamente contra la misma API.
2. Copia solo el campo `token`.
3. Confirma que `appsettings.json` / variables de entorno tengan los mismos valores de `JwtSettings`.

### Token expirado

El frontend no usa `POST /api/Auth/refresh` como flujo funcional; cuando detecta expiración, limpia sesión y redirige al login. Haz login nuevamente.

### 401 al validar token de Team Leader

`/api/Protected/valida-token-teamleader` está exceptuado de la redirección automática del interceptor para que la pantalla pueda mostrar el error. Revisa usuario/token capturados y el stored procedure `SP_FEA_ValidarTokenTeamleader_Result`.
