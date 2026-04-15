import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/session/domain/work_session.dart';

const _kWorkSession = 'previo_mx_work_session';

/// Persistencia de sesión de trabajo (ubicación, tipo de flujo).
class SessionPreferencesStorage {
  SessionPreferencesStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _storage;

  Future<void> saveWorkSession(WorkSession session) async {
    await _storage.write(key: _kWorkSession, value: jsonEncode(session.toJson()));
  }

  Future<WorkSession?> readWorkSession() async {
    final raw = await _storage.read(key: _kWorkSession);
    if (raw == null || raw.isEmpty) return null;
    try {
      return WorkSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearWorkSession() async {
    await _storage.delete(key: _kWorkSession);
  }
}
