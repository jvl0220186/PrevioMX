# Stored Procedures para Autenticación

## Descripción

La API de PrevioMX utiliza stored procedures para todas las operaciones de base de datos relacionadas con autenticación. A continuación se listan los stored procedures que deben crearse en la base de datos SQL Server.

## Stored Procedures Requeridos

### 1. sp_GetUserByEmail

Obtiene un usuario por su email.

**Parámetros:**
- `@Email` NVARCHAR(255) - Email del usuario

**Retorna:**
- ResultSet con los campos: Id, Email, Name, PasswordHash, RefreshToken, RefreshTokenExpiryTime, CreatedAt, UpdatedAt

**Script SQL:**
```sql
CREATE PROCEDURE [dbo].[sp_GetUserByEmail]
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE Email = @Email;
END
GO
```

---

### 2. sp_RegisterUser

Registra un nuevo usuario en el sistema.

**Parámetros:**
- `@Email` NVARCHAR(255) - Email del usuario
- `@Name` NVARCHAR(255) - Nombre del usuario
- `@PasswordHash` NVARCHAR(500) - Hash de la contraseña
- `@RefreshToken` NVARCHAR(500) - Token de refresco
- `@RefreshTokenExpiryTime` DATETIME2 - Fecha de expiración del refresh token
- `@CreatedAt` DATETIME2 - Fecha de creación

**Retorna:**
- ResultSet con el usuario creado (Id, Email, Name, PasswordHash, RefreshToken, RefreshTokenExpiryTime, CreatedAt, UpdatedAt)

**Script SQL:**
```sql
CREATE PROCEDURE [dbo].[sp_RegisterUser]
    @Email NVARCHAR(255),
    @Name NVARCHAR(255),
    @PasswordHash NVARCHAR(500),
    @RefreshToken NVARCHAR(500),
    @RefreshTokenExpiryTime DATETIME2,
    @CreatedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar si el email ya existe
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        RETURN;
    END
    
    -- Insertar nuevo usuario
    INSERT INTO Users (Email, Name, PasswordHash, RefreshToken, RefreshTokenExpiryTime, CreatedAt)
    VALUES (@Email, @Name, @PasswordHash, @RefreshToken, @RefreshTokenExpiryTime, @CreatedAt);
    
    -- Retornar el usuario creado
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE Id = SCOPE_IDENTITY();
END
GO
```

---

### 3. sp_UpdateRefreshToken

Actualiza el refresh token de un usuario.

**Parámetros:**
- `@UserId` INT - ID del usuario
- `@RefreshToken` NVARCHAR(500) - Nuevo refresh token
- `@RefreshTokenExpiryTime` DATETIME2 - Nueva fecha de expiración
- `@UpdatedAt` DATETIME2 - Fecha de actualización

**Retorna:**
- Número de filas afectadas

**Script SQL:**
```sql
CREATE PROCEDURE [dbo].[sp_UpdateRefreshToken]
    @UserId INT,
    @RefreshToken NVARCHAR(500),
    @RefreshTokenExpiryTime DATETIME2,
    @UpdatedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users
    SET 
        RefreshToken = @RefreshToken,
        RefreshTokenExpiryTime = @RefreshTokenExpiryTime,
        UpdatedAt = @UpdatedAt
    WHERE Id = @UserId;
END
GO
```

---

### 4. sp_GetUserByRefreshToken

Obtiene un usuario por su refresh token.

**Parámetros:**
- `@RefreshToken` NVARCHAR(500) - Refresh token

**Retorna:**
- ResultSet con los campos: Id, Email, Name, PasswordHash, RefreshToken, RefreshTokenExpiryTime, CreatedAt, UpdatedAt

**Script SQL:**
```sql
CREATE PROCEDURE [dbo].[sp_GetUserByRefreshToken]
    @RefreshToken NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE RefreshToken = @RefreshToken;
END
GO
```

---

### 5. sp_EmailExists

Verifica si un email ya existe en la base de datos.

**Parámetros:**
- `@Email` NVARCHAR(255) - Email a verificar
- `@Result` BIT OUTPUT - Resultado (1 si existe, 0 si no existe)

**Retorna:**
- Parámetro de salida @Result

**Script SQL:**
```sql
CREATE PROCEDURE [dbo].[sp_EmailExists]
    @Email NVARCHAR(255),
    @Result BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        SET @Result = 1;
    ELSE
        SET @Result = 0;
END
GO
```

---

## Script Completo de Creación

Ejecuta este script completo para crear todos los stored procedures:

```sql
-- =============================================
-- Stored Procedures para Autenticación PrevioMX
-- =============================================

-- 1. sp_GetUserByEmail
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserByEmail]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetUserByEmail]
GO

CREATE PROCEDURE [dbo].[sp_GetUserByEmail]
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE Email = @Email;
END
GO

-- 2. sp_RegisterUser
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_RegisterUser]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_RegisterUser]
GO

CREATE PROCEDURE [dbo].[sp_RegisterUser]
    @Email NVARCHAR(255),
    @Name NVARCHAR(255),
    @PasswordHash NVARCHAR(500),
    @RefreshToken NVARCHAR(500),
    @RefreshTokenExpiryTime DATETIME2,
    @CreatedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar si el email ya existe
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        RETURN;
    END
    
    -- Insertar nuevo usuario
    INSERT INTO Users (Email, Name, PasswordHash, RefreshToken, RefreshTokenExpiryTime, CreatedAt)
    VALUES (@Email, @Name, @PasswordHash, @RefreshToken, @RefreshTokenExpiryTime, @CreatedAt);
    
    -- Retornar el usuario creado
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE Id = SCOPE_IDENTITY();
END
GO

-- 3. sp_UpdateRefreshToken
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateRefreshToken]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_UpdateRefreshToken]
GO

CREATE PROCEDURE [dbo].[sp_UpdateRefreshToken]
    @UserId INT,
    @RefreshToken NVARCHAR(500),
    @RefreshTokenExpiryTime DATETIME2,
    @UpdatedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users
    SET 
        RefreshToken = @RefreshToken,
        RefreshTokenExpiryTime = @RefreshTokenExpiryTime,
        UpdatedAt = @UpdatedAt
    WHERE Id = @UserId;
END
GO

-- 4. sp_GetUserByRefreshToken
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserByRefreshToken]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetUserByRefreshToken]
GO

CREATE PROCEDURE [dbo].[sp_GetUserByRefreshToken]
    @RefreshToken NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        Email,
        Name,
        PasswordHash,
        RefreshToken,
        RefreshTokenExpiryTime,
        CreatedAt,
        UpdatedAt
    FROM Users
    WHERE RefreshToken = @RefreshToken;
END
GO

-- 5. sp_EmailExists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EmailExists]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_EmailExists]
GO

CREATE PROCEDURE [dbo].[sp_EmailExists]
    @Email NVARCHAR(255),
    @Result BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        SET @Result = 1;
    ELSE
        SET @Result = 0;
END
GO
```

## Estructura de la Tabla Users

Asegúrate de que la tabla Users tenga la siguiente estructura:

```sql
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

CREATE UNIQUE INDEX IX_Users_Email ON [Users]([Email]);
GO
```

## Permisos Requeridos

El usuario de la base de datos debe tener permisos para:
- `EXECUTE` en los stored procedures
- `SELECT`, `INSERT`, `UPDATE` en la tabla `Users`

```sql
-- Ejemplo de asignación de permisos
GRANT EXECUTE ON [dbo].[sp_GetUserByEmail] TO [tu_usuario];
GRANT EXECUTE ON [dbo].[sp_RegisterUser] TO [tu_usuario];
GRANT EXECUTE ON [dbo].[sp_UpdateRefreshToken] TO [tu_usuario];
GRANT EXECUTE ON [dbo].[sp_GetUserByRefreshToken] TO [tu_usuario];
GRANT EXECUTE ON [dbo].[sp_EmailExists] TO [tu_usuario];
```

## Verificación

Para verificar que los stored procedures están creados correctamente:

```sql
-- Listar todos los stored procedures de autenticación
SELECT 
    name AS ProcedureName,
    create_date AS CreatedDate,
    modify_date AS ModifiedDate
FROM sys.procedures
WHERE name LIKE 'sp_%'
ORDER BY name;
```

## Notas Importantes

1. **Orden de Columnas**: Los stored procedures deben retornar las columnas en el mismo orden que se definen en el modelo `User` de C#.

2. **Tipos de Datos**: Asegúrate de que los tipos de datos en SQL Server coincidan con los del modelo C#:
   - `INT` para `Id`
   - `NVARCHAR(255)` para `Email` y `Name`
   - `NVARCHAR(500)` para `PasswordHash` y `RefreshToken`
   - `DATETIME2` para fechas

3. **Case Sensitivity**: Los stored procedures usan comparaciones exactas. Si necesitas case-insensitive, ajusta las comparaciones en los stored procedures.

4. **Transacciones**: Los stored procedures no usan transacciones explícitas. Si necesitas transacciones, puedes agregarlas según tus requisitos.

5. **Validaciones**: Los stored procedures asumen que las validaciones de negocio se hacen en la capa de aplicación. Puedes agregar validaciones adicionales en los stored procedures si es necesario.

