using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PrevioMX_Api.Business;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Detrás de ngrok/proxy: la petición llega como HTTP local pero el cliente usó HTTPS.
// Sin esto, UseHttpsRedirection() redirige a https://localhost:... y el móvil/ngrok falla (p. ej. 503).
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Configurar CORS para permitir peticiones del frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",    // Vite dev server
                "http://localhost:3000",    // Alternativa común
                "http://localhost:5000"     // Otra alternativa
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add services to the container.
builder.Services.AddControllers();

// Configurar Entity Framework Core con SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' no encontrada en appsettings.json");

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(connectionString));

// Configurar JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] 
    ?? throw new InvalidOperationException("JWT SecretKey no configurada en appsettings.json");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero // Eliminar el tiempo de gracia por defecto
    };

    // Configurar eventos para mensajes de error más descriptivos
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Log para diagnóstico: ver qué está recibiendo
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var authHeader = context.Request.Headers["Authorization"].ToString();
            logger.LogInformation("Header Authorization recibido: {AuthHeader}", 
                string.IsNullOrEmpty(authHeader) ? "(vacío)" : authHeader.Substring(0, Math.Min(50, authHeader.Length)) + "...");
            
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            // Solo manejar si no se ha manejado ya la respuesta
            if (!context.Response.HasStarted)
            {
                // Log del error para diagnóstico
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var authHeader = context.Request.Headers["Authorization"].ToString();
                
                logger.LogWarning("Error de autenticación JWT: {ExceptionType} - {Message}. Header recibido: {AuthHeader}", 
                    context.Exception?.GetType().Name, 
                    context.Exception?.Message,
                    string.IsNullOrEmpty(authHeader) ? "(vacío)" : authHeader);

                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                
                var errorMessage = "Token de autenticación inválido o faltante";
                
                if (context.Exception is SecurityTokenExpiredException)
                {
                    errorMessage = "El token de autenticación ha expirado. Por favor, inicia sesión nuevamente.";
                }
                else if (context.Exception is SecurityTokenInvalidSignatureException)
                {
                    errorMessage = "El token de autenticación tiene una firma inválida. Verifica que el SecretKey sea el mismo usado para generar el token.";
                }
                else if (context.Exception is SecurityTokenMalformedException)
                {
                    errorMessage = "El token de autenticación tiene un formato inválido. Asegúrate de usar el formato: 'Bearer {token}'.";
                }
                else if (context.Exception != null)
                {
                    errorMessage = $"Error de autenticación: {context.Exception.Message}";
                }

                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    statusCode = 401,
                    message = errorMessage,
                    error = "No autorizado",
                    details = context.Exception?.GetType().Name
                });

                return context.Response.WriteAsync(result);
            }
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            // Solo manejar si no hay excepción (token faltante)
            if (context.AuthenticateFailure == null && !context.Response.HasStarted)
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var authHeader = context.Request.Headers["Authorization"].ToString();
                logger.LogWarning("Challenge: Token faltante o inválido. Header recibido: {AuthHeader}", 
                    string.IsNullOrEmpty(authHeader) ? "(vacío)" : authHeader);
                
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";

                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    statusCode = 401,
                    message = "Se requiere autenticación. Por favor, proporciona un token JWT válido en el header Authorization con el formato: 'Bearer {token}'.",
                    error = "No autorizado"
                });

                return context.Response.WriteAsync(result);
            }
            return Task.CompletedTask;
        }
    };
});

// Configurar autorización
builder.Services.AddAuthorization();

// Registrar servicios
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICatalogosService, CatalogosService>();
builder.Services.AddScoped<IVisualizationService, VisualizationService>();
builder.Services.AddScoped<IClasificacionService, ClasificacionService>();

// Configurar Swagger con soporte para JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PrevioMX API",
        Version = "v1",
        Description = "API para PrevioMX con autenticación JWT"
    });

    // Configurar JWT en Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Debe ir antes de UseHttpsRedirection y del resto del pipeline.
app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// No usar UseHttpsRedirection: detrás de ngrok/IIS el TLS lo termina el proxy. Kestrel recibe HTTP local;
// redirigir a https://localhost rompe móviles y suele manifestarse como 503 vía ngrok.

// IMPORTANTE: UseCors debe ir antes de Authentication
app.UseCors("AllowFrontend");

// IMPORTANTE: UseAuthentication debe ir antes de UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

// Diagnóstico túnel: GET https://TU_DOMINIO.ngrok-free.dev/health (con header ngrok-skip-browser-warning)
app.MapGet("/health", () => Results.Json(new { status = "ok", utc = DateTime.UtcNow }));

app.MapControllers();

app.Run();
