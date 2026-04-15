import 'package:dio/dio.dart';

import '../../../core/network/api_exception.dart';
import 'models/ubicacion_dto.dart';

/// Cliente del módulo móvil (endpoints a implementar en `PrevioMX_Api`).
class UbicacionApi {
  UbicacionApi(this._dio);

  final Dio _dio;

  static const _ubicacionesPath = '/api/Mobile/ubicaciones';

  Future<List<UbicacionDto>> fetchUbicacionesAsignadas() async {
    try {
      final res = await _dio.get<List<dynamic>>(_ubicacionesPath);
      final list = res.data;
      if (list == null) return [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(UbicacionDto.fromJson)
          .toList();
    } on DioException catch (e) {
      final err = e.error;
      if (err is ApiException) rethrow;
      throw ApiException(
        e.message ?? 'No se pudieron cargar ubicaciones',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
