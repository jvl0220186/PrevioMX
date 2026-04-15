import 'package:dio/dio.dart';

import '../../../core/network/api_exception.dart';
import 'models/auth_response.dart';
import 'models/login_request.dart';

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  static const _loginPath = '/api/Auth/login';

  Future<AuthResponse> login(LoginRequest body) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        _loginPath,
        data: body.toJson(),
      );
      final data = res.data;
      if (data == null) {
        throw ApiException('Respuesta vacía del servidor');
      }
      return AuthResponse.fromJson(data);
    } on DioException catch (e) {
      final err = e.error;
      if (err is ApiException) rethrow;
      throw ApiException(e.message ?? 'Error de login', statusCode: e.response?.statusCode);
    }
  }
}
