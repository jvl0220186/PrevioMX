import 'user_dto.dart';

class AuthResponse {
  const AuthResponse({
    required this.token,
    this.refreshToken,
    required this.user,
  });

  final String token;
  final String? refreshToken;
  final UserDto user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String? ?? '',
      refreshToken: json['refreshToken'] as String?,
      user: UserDto.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }
}
