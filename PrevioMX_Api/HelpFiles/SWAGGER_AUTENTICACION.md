# Autenticacion JWT en Swagger UI

Swagger esta configurado en `Program.cs` con un esquema `Bearer`. En desarrollo se expone
cuando `app.Environment.IsDevelopment()` es verdadero.

## 1. Obtener token

1. Abre Swagger UI, por ejemplo `https://localhost:5001/swagger`.
2. Ejecuta `POST /api/Auth/login`.
3. Usa el body:

   ```json
   {
     "usuario": "YROSALES.MTY",
     "password": "..."
   }
   ```

4. Copia solo el valor del campo `token`.

Respuesta de referencia:

```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "valor-generado",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "equipo": "MANCHESTER"
  }
}
```

## 2. Autorizar Swagger

1. Presiona **Authorize**.
2. Ingresa:

   ```text
   Bearer eyJhbGciOi...
   ```

3. Presiona **Authorize** y luego **Close**.

No escribas solo `Bearer Token`, no omitas `Bearer` y no agregues comillas.

## 3. Probar endpoints protegidos

Prueba un endpoint de negocio real, por ejemplo:

- `GET /api/Visualization/pendientes/{equipo}`
- `GET /api/Visualization/detalle-entrada/{idEntrada}`
- `POST /api/Clasificacion/validar-post`
- `POST /api/Protected/valida-token-teamleader`

Si el token fue aceptado, Swagger mostrara respuesta `200` o el error propio del endpoint.
Si falta o es invalido, la API respondera `401`.

## Errores comunes

### "Se requiere autenticacion"

- El token no fue pegado en **Authorize**.
- No se incluyo `Bearer ` antes del token.
- El token expiro.

### "Token de autenticacion tiene una firma invalida"

- El token fue generado con otra `SecretKey`.
- El token se copio incompleto.
- Hay comillas, espacios extra o saltos de linea.

### Register/refresh no funcionan

`POST /api/Auth/register` y `POST /api/Auth/refresh` aparecen en Swagger porque existen en
`AuthController`, pero el servicio actual no los implementa. Para renovar sesion, ejecuta
login de nuevo.

## Notas

- El tiempo de expiracion viene de `JwtSettings:ExpirationMinutes`.
- El claim `NameIdentifier` se usa como `idUsuario` en cierre de previo.
- Si cambias `JwtSettings`, genera un token nuevo antes de probar en Swagger.
