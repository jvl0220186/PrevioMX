import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kUseCamera = 'previo_mx_use_camera_for_codes';

/// Preferencia: pistola escáner (Enter) vs cámara (QR / barras).
class CaptureInputModeStorage {
  CaptureInputModeStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _storage;

  /// `true` = leer con cámara; `false` = scanner con Enter (por defecto).
  Future<bool> readUseCamera() async {
    final v = await _storage.read(key: _kUseCamera);
    if (v == null || v.isEmpty) return false;
    return v == '1' || v.toLowerCase() == 'true';
  }

  Future<void> saveUseCamera(bool value) async {
    await _storage.write(key: _kUseCamera, value: value ? '1' : '0');
  }
}
