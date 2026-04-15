import '../../domain/work_session.dart';

/// DTO alineado al futuro endpoint `GET /api/Mobile/ubicaciones`.
class UbicacionDto {
  const UbicacionDto({
    required this.id,
    required this.nombre,
    required this.perfil,
    this.idNumericoRecinto,
    this.flujoTerrestre = true,
  });

  final String id;
  final String nombre;
  final TipoPerfilMovil perfil;

  /// Presente cuando [perfil] es recinto (RN_02).
  final String? idNumericoRecinto;
  final bool flujoTerrestre;

  factory UbicacionDto.fromJson(Map<String, dynamic> json) {
    return UbicacionDto(
      id: json['id'] as String? ?? json['ubicacionId'] as String? ?? '',
      nombre: json['nombre'] as String? ?? json['descripcion'] as String? ?? '',
      perfil: parseTipoPerfilMovil(json['perfil'] as String? ?? json['tipo'] as String?),
      idNumericoRecinto: json['idNumericoRecinto'] as String? ?? json['idRecinto'] as String?,
      flujoTerrestre: json['flujoTerrestre'] as bool? ?? true,
    );
  }

  WorkSession toWorkSession() => WorkSession(
        ubicacionId: id,
        ubicacionNombre: nombre,
        perfil: perfil,
        idNumericoRecinto: idNumericoRecinto,
        flujoTerrestre: flujoTerrestre,
      );
}
