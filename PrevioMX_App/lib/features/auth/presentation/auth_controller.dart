import 'package:flutter/foundation.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/storage/auth_session_storage.dart';
import '../data/auth_api.dart';
import '../data/models/login_request.dart';
import '../data/models/user_dto.dart';

class AuthController extends ChangeNotifier {
  AuthController({
    required AuthApi authApi,
    required AuthSessionStorage storage,
  })  : _authApi = authApi,
        _storage = storage;

  final AuthApi _authApi;
  final AuthSessionStorage _storage;

  UserDto? _user;
  bool _loading = false;
  String? _error;

  UserDto? get user => _user;
  bool get isLoading => _loading;
  String? get errorMessage => _error;
  bool get isAuthenticated => _user != null;

  Future<void> restoreSession() async {
    _loading = true;
    notifyListeners();
    try {
      final s = await _storage.readSession();
      if (s.token != null && s.token!.isNotEmpty && s.user != null) {
        _user = s.user;
        _error = null;
      } else {
        _user = null;
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String usuario, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _authApi.login(
        LoginRequest(usuario: usuario.trim(), password: password),
      );
      if (res.token.isEmpty) {
        _error = 'Token no recibido';
        return false;
      }
      await _storage.saveAuth(res);
      _user = res.user;
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _storage.clear();
    _user = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
