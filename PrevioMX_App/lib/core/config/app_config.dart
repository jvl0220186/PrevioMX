/// Configuración compilada con `--dart-define`.
///
/// **Emulador Android → API en tu PC:** `http://10.0.2.2:5000` (perfil `http-lan` en la API).
///
/// **Teléfono físico:** `http://IP_LAN_DE_TU_PC:5000` (no uses `localhost`: en el móvil es el propio teléfono).
///
/// Ejecutar API para red local: `dotnet run --launch-profile http-lan` desde `PrevioMX_Api`.
///
/// **Ngrok:** usa la URL sin barra final. El cliente envía `ngrok-skip-browser-warning` (igual que PrevioMX_Web).
class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://unchopped-condescending-ishaan.ngrok-free.dev',
  );

  /// Si es `true`, las ubicaciones se cargan en memoria (desarrollo).
  /// Con `false`, se llama al endpoint documentado en `docs/integracion_backend.md`.
  static const bool useMockUbicaciones = bool.fromEnvironment(
    'USE_MOCK_UBICACIONES',
    defaultValue: true,
  );
}
