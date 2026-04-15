import 'package:flutter/foundation.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/storage/session_preferences_storage.dart';
import '../data/models/ubicacion_dto.dart';
import '../data/ubicacion_repository.dart';
import '../domain/work_session.dart';

class SessionController extends ChangeNotifier {
  SessionController({
    required UbicacionRepository ubicacionRepository,
    required SessionPreferencesStorage storage,
  })  : _repo = ubicacionRepository,
        _storage = storage;

  final UbicacionRepository _repo;
  final SessionPreferencesStorage _storage;

  WorkSession? _session;
  List<UbicacionDto> _opciones = [];
  bool _loading = false;
  String? _error;

  WorkSession? get session => _session;
  List<UbicacionDto> get opciones => _opciones;
  bool get isLoading => _loading;
  String? get errorMessage => _error;
  bool get hasUbicacion => _session != null;

  Future<void> restoreFromStorage() async {
    _session = await _storage.readWorkSession();
    notifyListeners();
  }

  Future<void> loadOpciones() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _opciones = await _repo.getUbicaciones();
      if (_opciones.isEmpty) {
        _error = 'No hay ubicaciones asignadas.';
      }
    } on ApiException catch (e) {
      _error = e.message;
      _opciones = [];
    } catch (e) {
      _error = e.toString();
      _opciones = [];
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// RN_03: no avanzar sin ubicación válida.
  Future<void> confirmarUbicacion(UbicacionDto dto) async {
    final work = dto.toWorkSession();
    if (work.perfil == TipoPerfilMovil.recinto &&
        (work.idNumericoRecinto == null || work.idNumericoRecinto!.isEmpty)) {
      _error = 'Esta ubicación de recinto no tiene identificador numérico (RN_02).';
      notifyListeners();
      return;
    }
    _session = work;
    _error = null;
    await _storage.saveWorkSession(work);
    notifyListeners();
  }

  Future<void> clear() async {
    await _storage.clearWorkSession();
    _session = null;
    _opciones = [];
    _error = null;
    notifyListeners();
  }
}
