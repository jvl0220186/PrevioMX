# Formato Correcto del Token JWT

## Problema Común: Token con Firma Inválida

Si recibes el error "El token de autenticación tiene una firma inválida", verifica el formato del header `Authorization`.

## Formato Correcto

### ✅ CORRECTO

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Características:**
- Sin comillas alrededor del token
- Un espacio después de "Bearer"
- El token completo sin espacios ni saltos de línea

### ❌ INCORRECTO

```
Authorization: Bearer "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```
Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```
Authorization: Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Múltiples espacios)

## Ejemplos por Herramienta

### cURL

```bash
curl -X GET "https://localhost:5001/WeatherForecast" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/Fetch

```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Sin "Bearer " aquí

fetch('https://localhost:5001/WeatherForecast', {
  headers: {
    'Authorization': `Bearer ${token}` // "Bearer " se agrega aquí
  }
});
```

### Postman

1. Ve a la pestaña **Headers**
2. Agrega:
   - **Key**: `Authorization`
   - **Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - (Sin comillas en el valor)

O usa la pestaña **Authorization**:
1. Selecciona **Bearer Token**
2. Pega el token (sin "Bearer", Postman lo agrega automáticamente)

### Axios

```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

axios.get('https://localhost:5001/WeatherForecast', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Verificación del Token

Para verificar que tu token es válido, puedes decodificarlo en [jwt.io](https://jwt.io):

1. Pega tu token completo
2. Verifica que:
   - El algoritmo sea `HS256`
   - El `iss` (issuer) sea `PrevioMX_API`
   - El `aud` (audience) sea `PrevioMX_Web`
   - El `exp` (expiration) no haya pasado

## Solución de Problemas

### Error: "Firma inválida"

**Causas posibles:**
1. El `SecretKey` usado para generar el token es diferente al usado para validarlo
2. El token tiene caracteres extra (espacios, comillas, saltos de línea)
3. El token está truncado o corrupto

**Solución:**
1. Verifica que `appsettings.json` tenga el mismo `SecretKey` que se usó para generar el token
2. Asegúrate de copiar el token completo sin espacios adicionales
3. Genera un nuevo token haciendo login nuevamente

### Error: "Token expirado"

**Solución:**
- El token tiene una expiración de 60 minutos por defecto
- Haz login nuevamente para obtener un nuevo token

### Error: "Issuer o Audience inválido"

**Solución:**
- Verifica que el token haya sido generado con:
  - `Issuer`: `PrevioMX_API`
  - `Audience`: `PrevioMX_Web`
- Estos valores deben coincidir con los configurados en `appsettings.json`

