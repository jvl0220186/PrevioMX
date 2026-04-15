class UserDto {
  const UserDto({
    required this.idUsuario,
    required this.usuario,
    required this.correoElectronico,
    required this.equipo,
    required this.grupoId,
    required this.lider,
  });

  final String idUsuario;
  final String usuario;
  final String correoElectronico;
  final String equipo;
  final String grupoId;
  final String lider;

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      idUsuario: json['idUsuario'] as String? ?? '',
      usuario: json['usuario'] as String? ?? '',
      correoElectronico: json['correoElectronico'] as String? ?? '',
      equipo: json['equipo'] as String? ?? '',
      grupoId: json['grupoId'] as String? ?? '',
      lider: json['lider'] as String? ?? '',
    );
  }
}
