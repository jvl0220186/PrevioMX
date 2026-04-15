/// Perfil operativo tras el login (ID_01).
enum TipoPerfilMovil {
  recinto,
  bodega,
}

extension TipoPerfilMovilX on TipoPerfilMovil {
  String get displayName => switch (this) {
        TipoPerfilMovil.recinto => 'Recinto',
        TipoPerfilMovil.bodega => 'Bodega',
      };
}

TipoPerfilMovil parseTipoPerfilMovil(String? value) {
  final v = (value ?? '').toLowerCase();
  if (v.contains('bodega')) return TipoPerfilMovil.bodega;
  return TipoPerfilMovil.recinto;
}

/// Ubicación seleccionada y contexto de trabajo persistido en el dispositivo.
class WorkSession {
  const WorkSession({
    required this.ubicacionId,
    required this.ubicacionNombre,
    required this.perfil,
    this.idNumericoRecinto,
    this.flujoTerrestre = true,
  });

  final String ubicacionId;
  final String ubicacionNombre;
  final TipoPerfilMovil perfil;

  /// RN_02: obligatorio para Recinto en validaciones de bulto (formato/prefijo).
  final String? idNumericoRecinto;

  /// Terrestre vs aéreo (afecta flujos en ID_02).
  final bool flujoTerrestre;

  Map<String, dynamic> toJson() => {
        'ubicacionId': ubicacionId,
        'ubicacionNombre': ubicacionNombre,
        'perfil': perfil.name,
        'idNumericoRecinto': idNumericoRecinto,
        'flujoTerrestre': flujoTerrestre,
      };

  static WorkSession fromJson(Map<String, dynamic> json) {
    return WorkSession(
      ubicacionId: json['ubicacionId'] as String? ?? '',
      ubicacionNombre: json['ubicacionNombre'] as String? ?? '',
      perfil: TipoPerfilMovil.values.firstWhere(
        (e) => e.name == json['perfil'],
        orElse: () => TipoPerfilMovil.recinto,
      ),
      idNumericoRecinto: json['idNumericoRecinto'] as String?,
      flujoTerrestre: json['flujoTerrestre'] as bool? ?? true,
    );
  }
}
