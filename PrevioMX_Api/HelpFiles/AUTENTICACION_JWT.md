# Autenticación JWT en PrevioMX API

## Descripción

La API de PrevioMX está configurada para usar autenticación JWT (JSON Web Tokens) para proteger los endpoints y autenticar usuarios.

## Configuración

### appsettings.json

La configuración de JWT se encuentra en `appsettings.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "TuClaveSecretaSuperSeguraParaJWT_Minimo32Caracteres_2024",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  }
}
```

**⚠️ IMPORTANTE**: En producción, cambia la `SecretKey` por una clave segura y guárdala en variables de entorno o un gestor de secretos.

## Endpoints de Autenticación

### 1. Registrar Usuario

**POST** `/api/auth/register`

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123",
  "name": "Nombre Usuario"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nombre Usuario"
  }
}
```

### 2. Iniciar Sesión

**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nombre Usuario"
  }
}
```

**Respuesta de error (401):**
```json
{
  "message": "Credenciales inválidas"
}
```

### 3. Refrescar Token

**POST** `/api/auth/refresh`

**Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "nuevo_token_jwt",
  "refreshToken": "nuevo_refresh_token",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nombre Usuario"
  }
}
```

## Uso del Token JWT

### En Peticiones HTTP

Una vez obtenido el token, inclúyelo en el header `Authorization` de todas las peticiones protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### En Swagger

1. Ejecuta el endpoint `/api/auth/login` o `/api/auth/register`
2. Copia el `token` de la respuesta
3. Haz clic en el botón **"Authorize"** (🔒) en la parte superior de Swagger
4. Ingresa: `Bearer {tu_token}` (reemplaza `{tu_token}` con el token real)
5. Haz clic en **"Authorize"** y luego en **"Close"**
6. Ahora puedes probar los endpoints protegidos

## Proteger Endpoints

Para proteger un controlador o endpoint, usa el atributo `[Authorize]`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class MiController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        // Obtener información del usuario autenticado
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        
        return Ok(new { userId, userEmail });
    }
}
```

### Proteger un Endpoint Específico

```csharp
[HttpGet("public")]
public IActionResult GetPublic()
{
    // Este endpoint es público
    return Ok("Público");
}

[HttpGet("private")]
[Authorize] // Este endpoint requiere autenticación
public IActionResult GetPrivate()
{
    return Ok("Privado");
}
```

## Estructura del Proyecto

```
PrevioMX_Api/
├── Controllers/
│   ├── AuthController.cs          # Endpoints de autenticación
│   └── ProtectedController.cs     # Ejemplo de controlador protegido
├── Models/
│   ├── DTOs/
│   │   ├── LoginRequest.cs
│   │   ├── RegisterRequest.cs
│   │   ├── AuthResponse.cs
│   │   └── RefreshTokenRequest.cs
│   └── User.cs
├── Services/
│   ├── IJwtService.cs
│   ├── JwtService.cs
│   ├── IAuthService.cs
│   └── AuthService.cs
├── Program.cs                      # Configuración de JWT
└── appsettings.json                # Configuración de JWT
```

## Servicios

### JwtService

Servicio responsable de:
- Generar tokens JWT
- Generar refresh tokens
- Validar tokens expirados

### AuthService

Servicio responsable de:
- Autenticar usuarios (login)
- Registrar nuevos usuarios
- Refrescar tokens

**Nota**: Actualmente usa almacenamiento en memoria. En producción, reemplaza con Entity Framework o tu base de datos preferida.

## Seguridad

### Recomendaciones para Producción

1. **Clave Secreta**: Usa una clave secreta fuerte (mínimo 32 caracteres) y guárdala en variables de entorno
2. **HTTPS**: Siempre usa HTTPS en producción
3. **Almacenamiento de Contraseñas**: Reemplaza el hash SHA256 simple con BCrypt o PasswordHasher de ASP.NET Identity
4. **Base de Datos**: Reemplaza el almacenamiento en memoria con una base de datos real
5. **Refresh Tokens**: Implementa revocación de refresh tokens
6. **Rate Limiting**: Implementa límites de tasa para prevenir ataques de fuerza bruta
7. **Validación**: Agrega validación más robusta de emails y contraseñas

### Variables de Entorno

Para producción, configura la clave secreta en variables de entorno:

```bash
# En appsettings.Production.json o variables de entorno
JwtSettings__SecretKey=tu_clave_secreta_super_segura_aqui
```

## Ejemplo de Uso con HttpClient (C#)

```csharp
var client = new HttpClient();
client.BaseAddress = new Uri("https://api.tudominio.com");

// Login
var loginRequest = new { email = "usuario@example.com", password = "contraseña123" };
var loginResponse = await client.PostAsJsonAsync("/api/auth/login", loginRequest);
var authData = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

// Usar el token en peticiones protegidas
client.DefaultRequestHeaders.Authorization = 
    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authData.Token);

// Hacer petición protegida
var protectedResponse = await client.GetAsync("/api/protected/test");
```

## Ejemplo de Uso con JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'contraseña123'
  })
});

const authData = await loginResponse.json();

// Usar el token en peticiones protegidas
const protectedResponse = await fetch('http://localhost:5000/api/protected/test', {
  headers: {
    'Authorization': `Bearer ${authData.token}`
  }
});
```

## Troubleshooting

### Error: "JWT SecretKey no configurada"

Asegúrate de que `appsettings.json` tenga la sección `JwtSettings` con `SecretKey`.

### Error: 401 Unauthorized

- Verifica que el token esté incluido en el header `Authorization`
- Verifica que el formato sea: `Bearer {token}`
- Verifica que el token no haya expirado
- Verifica que la clave secreta sea la misma en la generación y validación

### Error: "Token inválido"

- El token puede estar malformado
- El token puede haber sido firmado con una clave diferente
- El token puede haber expirado

