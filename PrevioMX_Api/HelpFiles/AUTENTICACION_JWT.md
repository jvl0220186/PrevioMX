# Autenticacion JWT en PrevioMX API

La API usa JWT Bearer para proteger los controladores de negocio. La unica
entrada publica soportada para usuarios finales es `POST /api/Auth/login`.

## Codigo relevante

- Configuracion de middleware: `Program.cs`
- Generacion de tokens: `Business/JwtService.cs`
- Login y respuesta: `Business/AuthService.cs`
- Stored procedure de login: `AuthDbContext.LoginAsync` -> `CSP_PMX_Login`

## Configuracion

`appsettings.json` contiene la seccion `JwtSettings`:

```json
{
  "JwtSettings": {
    "SecretKey": "TuClaveSecretaSuperSeguraParaJWT_Minimo32Caracteres_2024",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  }
}
```

Notas:

- `ExpirationMinutes` esta configurado en `1440` en el archivo versionado.
- `ClockSkew` esta en `TimeSpan.Zero`, por lo que no hay margen extra cuando el
  token expira.
- En produccion, `SecretKey` y la cadena de conexion deben venir de variables de
  entorno o un gestor de secretos.

## Login

**POST** `/api/Auth/login`

```json
{
  "usuario": "YROSALES.MTY",
  "password": "123"
}
```

Respuesta exitosa:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-generado",
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

Si `CSP_PMX_Login` no devuelve usuario, la API responde:

```json
{
  "message": "Credenciales invalidas"
}
```

## Claims incluidos

`JwtService.GenerateToken` crea los siguientes claims desde `LoginResultDto`:

| Claim | Valor |
| --- | --- |
| `ClaimTypes.NameIdentifier` | `idUsuario` |
| `ClaimTypes.Email` | `correoElectronico` |
| `ClaimTypes.Name` | `usuario` |
| `Equipo` | equipo asignado al usuario |
| `GrupoId` | identificador de grupo |
| `Lider` | usuario lider |
| `jti` | GUID generado para el token |

`VisualizationController.GetValidarCierrePrevio` usa
`ClaimTypes.NameIdentifier` como `idUsuario` para cerrar el previo.

## Uso del token

Incluye el JWT en cada endpoint protegido:

```http
Authorization: Bearer {token}
```

Ejemplo JavaScript:

```javascript
const response = await fetch('https://localhost:5001/api/Visualization/pendientes/MANCHESTER', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

La web guarda `token` y `user` en `localStorage`. `api.service.js`:

- agrega `Authorization` automaticamente;
- decodifica `exp` para detectar tokens vencidos antes de llamar al API;
- limpia `token`, `user` y `captureData` y redirige al login ante `401/403`
  generales.

## Rutas existentes pero no implementadas

`AuthController` expone:

- `POST /api/Auth/register`
- `POST /api/Auth/refresh`

Actualmente `AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync`
registran un warning y devuelven `null` porque faltan los stored procedures de
registro y refresh. No dependas de estas rutas para produccion; el cliente debe
pedir login nuevamente cuando el JWT expire.

## Proteger endpoints nuevos

Para endpoints de negocio, usa `[Authorize]` en el controlador o accion:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MiController : ControllerBase
{
    [HttpGet("estado")]
    public IActionResult GetEstado()
    {
        var idUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Ok(new { idUsuario });
    }
}
```

Si agregas endpoints publicos, documenta explicitamente por que no requieren
JWT y considera `[AllowAnonymous]` solo en acciones acotadas.

## Swagger

1. Ejecuta `POST /api/Auth/login`.
2. Copia el campo `token`.
3. En **Authorize**, ingresa `Bearer {token}`.
4. Ejecuta endpoints protegidos.

Ver tambien `SWAGGER_AUTENTICACION.md` para el flujo detallado.

## Troubleshooting

### `JWT SecretKey no configurada`

Falta `JwtSettings:SecretKey` en configuracion efectiva.

### `401 Unauthorized`

- Falta `Authorization: Bearer {token}`.
- El token expiro; hacer login nuevamente.
- La firma no coincide con `JwtSettings:SecretKey`.
- `Issuer` o `Audience` no coinciden con `JwtSettings`.

### `Token de autenticacion tiene un formato invalido`

El header debe tener un espacio despues de `Bearer` y no debe incluir comillas.

### Redirecciones inesperadas en la web

El interceptor de Axios redirige al login ante `401/403`, excepto para la
validacion de token de Team Leader. Revisa que `localStorage.token` exista y que
el payload tenga `exp` vigente.

