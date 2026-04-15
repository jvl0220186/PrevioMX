import 'package:flutter/foundation.dart';

import '../../../core/storage/capture_input_mode_storage.dart';

class CaptureInputModeController extends ChangeNotifier {
  CaptureInputModeController({required CaptureInputModeStorage storage}) : _storage = storage;

  final CaptureInputModeStorage _storage;

  bool _useCamera = false;

  /// Si es `true`, se ofrece botón de cámara (QR / código de barras).
  /// Si es `false`, se usa campo de texto + Enter como pistola escáner.
  bool get useCameraForCodes => _useCamera;

  Future<void> load() async {
    _useCamera = await _storage.readUseCamera();
    notifyListeners();
  }

  Future<void> setUseCamera(bool value) async {
    if (_useCamera == value) return;
    _useCamera = value;
    await _storage.saveUseCamera(value);
    notifyListeners();
  }
}
