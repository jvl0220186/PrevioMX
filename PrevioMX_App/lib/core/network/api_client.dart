import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/secure_token_storage.dart';
import 'api_exception.dart';

typedef TokenReader = Future<String?> Function();

/// Cliente HTTP compartido: base URL, JSON, Bearer, manejo básico de errores.
class ApiClient {
  ApiClient({
    required SecureTokenStorage tokenStorage,
    String? baseUrl,
  })  : _tokenStorage = tokenStorage,
        _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ?? AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 60),
            headers: {
              Headers.acceptHeader: Headers.jsonContentType,
              Headers.contentTypeHeader: Headers.jsonContentType,
              // Ngrok free: sin esto la API puede no recibir la petición (página intersticial HTML).
              'ngrok-skip-browser-warning': 'true',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (err, handler) {
          final msg = _messageFromDio(err);
          final code = err.response?.statusCode;
          handler.reject(
            DioException(
              requestOptions: err.requestOptions,
              response: err.response,
              type: err.type,
              error: ApiException(msg, statusCode: code),
            ),
          );
        },
      ),
    );
  }

  final Dio _dio;
  final SecureTokenStorage _tokenStorage;

  Dio get dio => _dio;

  SecureTokenStorage get tokenStorage => _tokenStorage;

  static String _messageFromDio(DioException err) {
    final data = err.response?.data;
    if (data is Map) {
      final m = data['message'];
      if (m is String && m.isNotEmpty) return m;
      final errField = data['error'];
      if (errField is String && errField.isNotEmpty) return errField;
    }
    return err.message ?? 'Error de red';
  }
}
