import 'package:flutter/material.dart';

import '../../session/domain/work_session.dart';
import '../domain/capture_validators.dart';
import '../domain/rrna_resultado.dart';

class BultoCapturaItem {
  BultoCapturaItem({
    required this.codigo,
    required this.referencia,
    required this.numeroOrden,
    this.fotosEtiqueta = 0,
    this.guiaAsociada,
  });

  final String codigo;
  final String referencia;
  final int numeroOrden;
  int fotosEtiqueta;
  final String? guiaAsociada;
}

/// Bulto en curso: escaneado pero aún no agregado a [bultos] hasta [cerrarBultoRecinto].
class RecintoBultoPendienteFotos {
  RecintoBultoPendienteFotos({
    required this.codigo,
    required this.referencia,
    required this.guiaAsociada,
  });

  final String codigo;
  final String referencia;
  final String guiaAsociada;
  int fotosSimuladas = 0;
}

class CaptureController extends ChangeNotifier {
  CaptureController({required WorkSession workSession}) : _session = workSession;

  final WorkSession _session;

  WorkSession get workSession => _session;

  int _step = 0;
  int get step => _step;

  /// Recinto: guías → recepción → ciclo bultos/fotos → documentos. Bodega: 5 pasos.
  int get stepCount => esRecinto ? 4 : 5;

  String get stepLabel => '${_step + 1}/$stepCount';

  final TextEditingController guiaController = TextEditingController();
  final TextEditingController bultoController = TextEditingController();
  final TextEditingController clienteController = TextEditingController();

  final List<String> guias = [];

  bool tieneDocumentos = false;
  bool requiereTransportista = false;
  bool llegoTransito = false;
  bool tieneDanos = false;
  bool requiereTarima = false;
  bool tarimaVerificada = false;
  bool rojoReconocimiento = false;
  bool esMaquinaria = false;

  bool revisionRrna = false;
  ResultadoRrnaRevision? resultadoRrna;

  bool cumpleNom = false;

  String? proveedorRecintoCodigo;
  String? proveedorBodegaCodigo;

  String? guiaActiva;
  String? referenciaSesion;
  final List<BultoCapturaItem> bultos = [];

  int _bodegaEsperado = 1;
  int get bodegaBultoEsperado => _bodegaEsperado;

  bool _recintoVistaFotosBulto = false;
  RecintoBultoPendienteFotos? _pendienteRecinto;

  bool get esRecinto => _session.perfil == TipoPerfilMovil.recinto;

  /// Recinto paso bultos: subpantalla de fotos del bulto actual.
  bool get recintoVistaFotosBulto => esRecinto && _recintoVistaFotosBulto;

  RecintoBultoPendienteFotos? get recintoPendienteFotos => _pendienteRecinto;

  /// Al menos un bulto cerrado con fotos (solo se agregan con ≥1 foto simulada).
  bool get puedeCerrarPrevioRecinto => esRecinto && bultos.isNotEmpty;

  void setTieneDocumentos(bool v) {
    tieneDocumentos = v;
    notifyListeners();
  }

  void setRequiereTransportista(bool v) {
    requiereTransportista = v;
    notifyListeners();
  }

  void setLlegoTransito(bool v) {
    llegoTransito = v;
    notifyListeners();
  }

  void setTieneDanos(bool v) {
    tieneDanos = v;
    notifyListeners();
  }

  void setRequiereTarima(bool v) {
    requiereTarima = v;
    if (!v) {
      tarimaVerificada = false;
    }
    notifyListeners();
  }

  void setTarimaVerificada(bool v) {
    tarimaVerificada = v;
    notifyListeners();
  }

  void setRojoReconocimiento(bool v) {
    rojoReconocimiento = v;
    notifyListeners();
  }

  void setEsMaquinaria(bool v) {
    esMaquinaria = v;
    notifyListeners();
  }

  void setRevisionRrna(bool v) {
    revisionRrna = v;
    if (!v) {
      resultadoRrna = null;
    }
    notifyListeners();
  }

  void setResultadoRrna(ResultadoRrnaRevision? v) {
    resultadoRrna = v;
    notifyListeners();
  }

  void setCumpleNom(bool v) {
    cumpleNom = v;
    notifyListeners();
  }

  void setProveedorRecinto(String? codigo) {
    proveedorRecintoCodigo = codigo;
    notifyListeners();
  }

  void setProveedorBodega(String? codigo) {
    proveedorBodegaCodigo = codigo;
    notifyListeners();
  }

  void agregarGuia() {
    final g = guiaController.text.trim();
    if (g.isEmpty) return;
    if (guias.contains(g)) return;
    guias.add(g);
    guiaController.clear();
    notifyListeners();
  }

  void agregarGuiaCodigo(String raw) {
    guiaController.text = raw.trim();
    agregarGuia();
  }

  void quitarGuia(String g) {
    guias.remove(g);
    notifyListeners();
  }

  String? validarRecepcionRecintoMensaje() {
    if (proveedorRecintoCodigo == null || proveedorRecintoCodigo!.isEmpty) {
      return 'Selecciona un proveedor de la lista.';
    }
    if (requiereTarima && !tarimaVerificada) {
      return 'Marcaste que requiere tarima: confirma la verificación de tarima.';
    }
    if (revisionRrna && resultadoRrna == null) {
      return 'Marcaste revisión RRNA: indica si cumple o no cumple.';
    }
    return null;
  }

  void setGuiaActiva(String? g) {
    guiaActiva = g;
    notifyListeners();
  }

  /// Valida código de bulto (recinto, con guía) sin registrar aún.
  String? validarBultoRecintoParaFotos(String codigo) {
    final t = codigo.trim();
    if (!CaptureValidators.isValidBultoCodigo(t)) {
      return CaptureValidators.mensajeLongitudBulto();
    }
    final ref = CaptureValidators.referenciaDesdeBulto(t);
    if (ref == null) {
      return 'No se pudo obtener la referencia (8 caracteres finales).';
    }
    if (guiaActiva == null || guiaActiva!.isEmpty) {
      return 'Selecciona la guía en la que capturas este bulto.';
    }
    if (!CaptureValidators.mismaReferencia(referenciaSesion, t)) {
      return 'Todos los bultos deben pertenecer a la misma referencia (últimos 8 del código).';
    }
    return null;
  }

  /// Pasa a la pantalla de fotos del bulto escaneado (no lo agrega a la lista hasta [cerrarBultoRecinto]).
  String? iniciarFotosDelBultoRecinto() {
    final codigo = bultoController.text.trim();
    final err = validarBultoRecintoParaFotos(codigo);
    if (err != null) return err;
    final ref = CaptureValidators.referenciaDesdeBulto(codigo)!;
    referenciaSesion ??= ref;
    _pendienteRecinto = RecintoBultoPendienteFotos(
      codigo: codigo,
      referencia: ref,
      guiaAsociada: guiaActiva!,
    );
    bultoController.clear();
    _recintoVistaFotosBulto = true;
    notifyListeners();
    return null;
  }

  String? iniciarFotosDelBultoRecintoDesdeTexto(String raw) {
    bultoController.text = raw.trim();
    return iniciarFotosDelBultoRecinto();
  }

  void simularFotoPendienteRecinto() {
    final p = _pendienteRecinto;
    if (p == null) return;
    p.fotosSimuladas++;
    notifyListeners();
  }

  String? cerrarBultoRecinto() {
    final p = _pendienteRecinto;
    if (p == null) return 'No hay bulto en proceso.';
    if (p.fotosSimuladas < 1) {
      return 'Simula al menos una foto de etiqueta antes de cerrar el bulto.';
    }
    bultos.add(BultoCapturaItem(
      codigo: p.codigo,
      referencia: p.referencia,
      numeroOrden: bultos.length + 1,
      fotosEtiqueta: p.fotosSimuladas,
      guiaAsociada: p.guiaAsociada,
    ));
    _pendienteRecinto = null;
    _recintoVistaFotosBulto = false;
    notifyListeners();
    return null;
  }

  void volverAEscaneoRecintoDescartar() {
    _pendienteRecinto = null;
    _recintoVistaFotosBulto = false;
    notifyListeners();
  }

  void irADocumentosDesdeRecinto() {
    if (!puedeCerrarPrevioRecinto) return;
    _recintoVistaFotosBulto = false;
    _pendienteRecinto = null;
    _step = 3;
    notifyListeners();
  }

  String? registrarBultoEscaneado({required bool exigeGuia}) {
    final codigo = bultoController.text.trim();
    return _registrarBultoCodigo(codigo, exigeGuia: exigeGuia);
  }

  String? registrarBultoDesdeTexto(String raw, {required bool exigeGuia}) {
    return _registrarBultoCodigo(raw.trim(), exigeGuia: exigeGuia);
  }

  String? _registrarBultoCodigo(String codigo, {required bool exigeGuia}) {
    if (!CaptureValidators.isValidBultoCodigo(codigo)) {
      return CaptureValidators.mensajeLongitudBulto();
    }
    final ref = CaptureValidators.referenciaDesdeBulto(codigo);
    if (ref == null) {
      return 'No se pudo obtener la referencia (8 caracteres finales).';
    }

    if (!CaptureValidators.mismaReferencia(referenciaSesion, codigo)) {
      return 'Todos los bultos deben pertenecer a la misma referencia (últimos 8 del código).';
    }

    if (exigeGuia) {
      if (guiaActiva == null || guiaActiva!.isEmpty) {
        return 'Selecciona la guía en la que capturas este bulto.';
      }
    }

    referenciaSesion ??= ref;

    final orden = esRecinto ? bultos.length + 1 : _bodegaEsperado;
    bultos.add(BultoCapturaItem(
      codigo: codigo,
      referencia: ref,
      numeroOrden: orden,
      guiaAsociada: guiaActiva,
    ));

    if (!esRecinto) {
      _bodegaEsperado++;
    }

    bultoController.clear();
    notifyListeners();
    return null;
  }

  void simularFotoEtiquetaParaBulto(int index) {
    if (index < 0 || index >= bultos.length) return;
    bultos[index].fotosEtiqueta++;
    notifyListeners();
  }

  bool get puedeCerrarEtiquetas {
    if (bultos.isEmpty) return false;
    return bultos.every((b) => b.fotosEtiqueta >= 1);
  }

  String? validarBodegaClienteProveedorMensaje() {
    if (clienteController.text.trim().isEmpty) {
      return 'El cliente es obligatorio.';
    }
    if (proveedorBodegaCodigo == null || proveedorBodegaCodigo!.isEmpty) {
      return 'Selecciona un proveedor de la lista.';
    }
    if (requiereTarima && !tarimaVerificada) {
      return 'Marcaste que requiere tarima: confirma la verificación de tarima.';
    }
    if (revisionRrna && resultadoRrna == null) {
      return 'Marcaste revisión RRNA: indica si cumple o no cumple.';
    }
    return null;
  }

  void siguiente() {
    if (_step < stepCount - 1) {
      _step++;
      notifyListeners();
    }
  }

  void anterior() {
    if (esRecinto && _step == 2 && _recintoVistaFotosBulto) {
      volverAEscaneoRecintoDescartar();
      return;
    }
    if (_step > 0) {
      _step--;
      notifyListeners();
    }
  }

  void reiniciarCaptura() {
    _step = 0;
    guias.clear();
    guiaController.clear();
    bultoController.clear();
    clienteController.clear();
    guiaActiva = null;
    referenciaSesion = null;
    bultos.clear();
    _bodegaEsperado = 1;
    tieneDocumentos = false;
    requiereTransportista = false;
    llegoTransito = false;
    tieneDanos = false;
    requiereTarima = false;
    tarimaVerificada = false;
    rojoReconocimiento = false;
    esMaquinaria = false;
    cumpleNom = false;
    revisionRrna = false;
    resultadoRrna = null;
    proveedorRecintoCodigo = null;
    proveedorBodegaCodigo = null;
    _recintoVistaFotosBulto = false;
    _pendienteRecinto = null;
    notifyListeners();
  }

  @override
  void dispose() {
    guiaController.dispose();
    bultoController.dispose();
    clienteController.dispose();
    super.dispose();
  }
}
