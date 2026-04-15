/// Catálogo de proveedores (mock hasta integrar API).
class ProveedorOpcion {
  const ProveedorOpcion({required this.codigo, required this.nombre});

  final String codigo;
  final String nombre;
}

/// Lista demo; sustituir por carga desde PrevioMX_Api.
const List<ProveedorOpcion> kCatalogoProveedores = [
  ProveedorOpcion(codigo: 'PRV-ADU-001', nombre: 'Importadora del Norte S.A. de C.V.'),
  ProveedorOpcion(codigo: 'PRV-ADU-002', nombre: 'Logística Integral México'),
  ProveedorOpcion(codigo: 'PRV-ADU-003', nombre: 'Comercializadora Asia Pacífico'),
  ProveedorOpcion(codigo: 'PRV-ADU-004', nombre: 'Proveedor genérico (pruebas)'),
];
