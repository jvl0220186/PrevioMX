# Configuración de Base de Datos SQL Server

## Descripción

La API de PrevioMX está configurada para usar Entity Framework Core con SQL Server para el almacenamiento de datos de autenticación.

## Configuración de la Cadena de Conexión

### appsettings.json

La cadena de conexión se configura en `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PrevioMX_DB;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;"
  }
}
```

### Parámetros de la Cadena de Conexión

- **Server**: Nombre del servidor SQL Server (ej: `localhost`, `localhost\\SQLEXPRESS`, `servidor.dominio.com`)
- **Database**: Nombre de la base de datos (ej: `PrevioMX_DB`)
- **User Id**: Usuario de SQL Server (ej: `sa`)
- **Password**: Contraseña del usuario
- **TrustServerCertificate**: `True` para desarrollo local (permite certificados no confiables)

### Ejemplos de Cadenas de Conexión

#### SQL Server Local (instancia por defecto)
```
Server=localhost;Database=PrevioMX_DB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;
```

#### SQL Server Local (instancia nombrada)
```
Server=localhost\\SQLEXPRESS;Database=PrevioMX_DB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;
```

#### SQL Server con Autenticación de Windows
```
Server=localhost;Database=PrevioMX_DB;Integrated Security=True;TrustServerCertificate=True;
```

#### SQL Server en Red
```
Server=192.168.1.100,1433;Database=PrevioMX_DB;User Id=usuario;Password=password;TrustServerCertificate=True;
```

#### Azure SQL Database
```
Server=tcp:servidor.database.windows.net,1433;Database=PrevioMX_DB;User Id=usuario@servidor;Password=password;Encrypt=True;TrustServerCertificate=False;
```

## Crear la Base de Datos

### Opción 1: Usando Migraciones de Entity Framework (Recomendado)

1. **Instalar herramientas de EF Core** (si no están instaladas):
   ```bash
   dotnet tool install --global dotnet-ef
   ```

2. **Crear la migración inicial**:
   ```bash
   dotnet ef migrations add InitialCreate --project PrevioMX_Api
   ```

3. **Aplicar la migración a la base de datos**:
   ```bash
   dotnet ef database update --project PrevioMX_Api
   ```

### Opción 2: Crear Manualmente en SQL Server

Ejecuta el siguiente script SQL en SQL Server Management Studio:

```sql
-- Crear la base de datos
CREATE DATABASE PrevioMX_DB;
GO

USE PrevioMX_DB;
GO

-- Crear la tabla Users
CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [Name] NVARCHAR(255) NOT NULL,
    [PasswordHash] NVARCHAR(500) NOT NULL,
    [RefreshToken] NVARCHAR(500) NULL,
    [RefreshTokenExpiryTime] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL
);
GO

-- Crear índice único en Email
CREATE UNIQUE INDEX IX_Users_Email ON [Users]([Email]);
GO
```

## Estructura de la Tabla Users

| Columna | Tipo | Descripción |
|---------|------|-------------|
| Id | INT | Identificador único (Primary Key, Identity) |
| Email | NVARCHAR(255) | Email del usuario (único, requerido) |
| Name | NVARCHAR(255) | Nombre del usuario (requerido) |
| PasswordHash | NVARCHAR(500) | Hash de la contraseña (requerido) |
| RefreshToken | NVARCHAR(500) | Token de refresco (opcional) |
| RefreshTokenExpiryTime | DATETIME2 | Fecha de expiración del refresh token (opcional) |
| CreatedAt | DATETIME2 | Fecha de creación (requerido) |
| UpdatedAt | DATETIME2 | Fecha de última actualización (opcional) |

## Configuración por Ambiente

### Desarrollo (appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PrevioMX_DB_Dev;User Id=sa;Password=DevPassword123;TrustServerCertificate=True;"
  }
}
```

### Producción

Para producción, usa variables de entorno o Azure Key Vault:

**Variables de Entorno:**
```bash
ConnectionStrings__DefaultConnection=Server=prod-server;Database=PrevioMX_DB;User Id=prod-user;Password=SecurePassword;TrustServerCertificate=False;
```

**O en appsettings.Production.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-server;Database=PrevioMX_DB;User Id=prod-user;Password=SecurePassword;TrustServerCertificate=False;"
  }
}
```

## Verificación

Para verificar que la conexión funciona:

1. Ejecuta la aplicación:
   ```bash
   dotnet run
   ```

2. Intenta registrar un usuario usando el endpoint `/api/auth/register`

3. Si hay errores de conexión, verifica:
   - Que SQL Server esté ejecutándose
   - Que la cadena de conexión sea correcta
   - Que el usuario tenga permisos para crear/leer/escribir en la base de datos
   - Que el firewall permita la conexión

## Troubleshooting

### Error: "Cannot open database"

- Verifica que la base de datos exista
- Verifica que el usuario tenga permisos
- Verifica que el nombre de la base de datos sea correcto

### Error: "Login failed for user"

- Verifica el usuario y contraseña
- Verifica que el usuario tenga permisos en SQL Server

### Error: "A network-related or instance-specific error"

- Verifica que SQL Server esté ejecutándose
- Verifica que el puerto 1433 esté abierto
- Verifica la configuración del firewall

### Error: "The server was not found or was not accessible"

- Verifica el nombre del servidor
- Verifica la conectividad de red
- Para instancias nombradas, usa: `Server=localhost\\SQLEXPRESS`

## Seguridad

### Recomendaciones para Producción

1. **No commitees contraseñas**: Usa variables de entorno o Azure Key Vault
2. **Usa usuarios con permisos mínimos**: No uses `sa` en producción
3. **Habilita encriptación**: Para conexiones remotas, usa `Encrypt=True`
4. **Desactiva TrustServerCertificate**: En producción, usa certificados válidos
5. **Usa connection pooling**: Entity Framework Core lo maneja automáticamente
6. **Implementa retry logic**: Para manejar errores temporales de conexión

## Migraciones Adicionales

Si necesitas modificar el esquema de la base de datos:

1. Modifica el modelo `User` o agrega nuevas entidades
2. Crea una nueva migración:
   ```bash
   dotnet ef migrations add NombreDeLaMigracion --project PrevioMX_Api
   ```
3. Aplica la migración:
   ```bash
   dotnet ef database update --project PrevioMX_Api
   ```

## Rollback de Migraciones

Para revertir una migración:

```bash
dotnet ef database update NombreMigracionAnterior --project PrevioMX_Api
```

Para eliminar la última migración (sin aplicarla):

```bash
dotnet ef migrations remove --project PrevioMX_Api
```

