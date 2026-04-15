import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccessToken = 'previo_mx_access_token';
const _kRefreshToken = 'previo_mx_refresh_token';

class SecureTokenStorage {
  SecureTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _storage;

  Future<void> saveTokens({required String access, String? refresh}) async {
    await _storage.write(key: _kAccessToken, value: access);
    if (refresh != null && refresh.isNotEmpty) {
      await _storage.write(key: _kRefreshToken, value: refresh);
    }
  }

  Future<String?> readAccessToken() => _storage.read(key: _kAccessToken);

  Future<String?> readRefreshToken() => _storage.read(key: _kRefreshToken);

  Future<void> clear() async {
    await _storage.delete(key: _kAccessToken);
    await _storage.delete(key: _kRefreshToken);
  }
}
