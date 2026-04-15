class LoginRequest {
  const LoginRequest({required this.usuario, required this.password});

  final String usuario;
  final String password;

  Map<String, dynamic> toJson() => {
        'usuario': usuario,
        'password': password,
      };
}
