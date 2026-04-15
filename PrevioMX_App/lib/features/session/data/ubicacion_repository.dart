import '../../../core/config/app_config.dart';
import '../domain/work_session.dart';
import 'models/ubicacion_dto.dart';
import 'ubicacion_api.dart';

class UbicacionRepository {
  UbicacionRepository({
    required UbicacionApi api,
  }) : _api = api;

  final UbicacionApi _api;

  /// Ubicaciones disponibles para el usuario autenticado.
  Future<List<UbicacionDto>> getUbicaciones() async {
    if (AppConfig.useMockUbicaciones) {
      return _mockUbicaciones;
    }
    return _api.fetchUbicacionesAsignadas();
  }
}

/// Datos de ejemplo hasta existir el SP + endpoint reales.
const _mockUbicaciones = <UbicacionDto>[
  UbicacionDto(
    id: 'mock-rec-1',
    nombre: 'Recinto fiscal — Ejemplo Norte',
    perfil: TipoPerfilMovil.recinto,
    idNumericoRecinto: '1001',
    flujoTerrestre: true,
  ),
  UbicacionDto(
    id: 'mock-rec-2',
    nombre: 'Recinto fiscal — Ejemplo Aéreo',
    perfil: TipoPerfilMovil.recinto,
    idNumericoRecinto: '2002',
    flujoTerrestre: false,
  ),
  UbicacionDto(
    id: 'mock-bod-1',
    nombre: 'Bodega terrestre — Ejemplo',
    perfil: TipoPerfilMovil.bodega,
    flujoTerrestre: true,
  ),
];
