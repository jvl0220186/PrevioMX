/// Validaciones alineadas al backlog (RN bulto / referencia).
abstract final class CaptureValidators {
  /// RN: código de bulto 14 u 23 caracteres.
  static bool isValidBultoCodigo(String raw) {
    final s = raw.trim();
    return s.length == 14 || s.length == 23;
  }

  /// RN: referencia = últimos 8 dígitos del código (caracteres finales alfanuméricos de longitud 8).
  static String? referenciaDesdeBulto(String raw) {
    final s = raw.trim();
    if (s.length < 8) return null;
    return s.substring(s.length - 8);
  }

  static String mensajeLongitudBulto() =>
      'El código de bulto debe tener 14 o 23 caracteres (RN).';

  /// Misma referencia en todos los bultos de la sesión (Recinto / Bodega).
  static bool mismaReferencia(String? sesionRef, String nuevoCodigo) {
    final r = referenciaDesdeBulto(nuevoCodigo);
    if (sesionRef == null || sesionRef.isEmpty) return true;
    return sesionRef == r;
  }
}
