import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/data/models/auth_response.dart';
import '../../features/auth/data/models/user_dto.dart';
import 'secure_token_storage.dart';

const _kUserJson = 'previo_mx_user_json';

/// Tokens + perfil mínimo para restaurar sesión al abrir la app.
class AuthSessionStorage {
  AuthSessionStorage({
    SecureTokenStorage? tokenStorage,
    FlutterSecureStorage? storage,
  })  : tokenStorage = tokenStorage ?? SecureTokenStorage(storage: storage),
        _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final SecureTokenStorage tokenStorage;
  final FlutterSecureStorage _storage;

  Future<void> saveAuth(AuthResponse response) async {
    await tokenStorage.saveTokens(
      access: response.token,
      refresh: response.refreshToken,
    );
    await _storage.write(
      key: _kUserJson,
      value: jsonEncode(_userToMap(response.user)),
    );
  }

  Future<({String? token, UserDto? user})> readSession() async {
    final token = await tokenStorage.readAccessToken();
    final raw = await _storage.read(key: _kUserJson);
    if (raw == null || raw.isEmpty) return (token: token, user: null);
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return (token: token, user: UserDto.fromJson(map));
    } catch (_) {
      return (token: token, user: null);
    }
  }

  Future<void> clear() async {
    await tokenStorage.clear();
    await _storage.delete(key: _kUserJson);
  }

  Map<String, dynamic> _userToMap(UserDto u) => {
        'idUsuario': u.idUsuario,
        'usuario': u.usuario,
        'correoElectronico': u.correoElectronico,
        'equipo': u.equipo,
        'grupoId': u.grupoId,
        'lider': u.lider,
      };
}
