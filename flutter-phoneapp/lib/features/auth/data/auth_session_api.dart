import '../../../core/network/api_client.dart';
import '../domain/auth_tokens.dart';

class AuthSessionApi {
  AuthSessionApi(this._client);

  final FixnadoApiClient _client;

  Future<AuthTokens> login({
    required String email,
    required String password,
    String? deviceLabel,
    bool rememberMe = false,
    String? clientVersion,
  }) async {
    final payload = await _client.postJson('/api/auth/login', body: {
      'email': email,
      'password': password,
      'rememberMe': rememberMe,
      'clientType': 'mobile',
      if (deviceLabel != null) 'deviceLabel': deviceLabel,
      if (clientVersion != null) 'clientVersion': clientVersion,
    });
    return _parseSession(payload);
  }

  Future<AuthTokens> refresh(String refreshToken) async {
    final payload = await _client.postJson('/api/auth/session/refresh', body: {
      'refreshToken': refreshToken,
    });
    return _parseSession(payload);
  }

  Future<void> logout() async {
    try {
      await _client.postJson('/api/auth/logout');
    } catch (_) {
      // Ignore network/logout errors. Clients clear local credentials regardless.
    }
  }

  AuthTokens _parseSession(Map<String, dynamic> payload) {
    final session = payload['session'];
    final tokens = payload['tokens'];
    if (session is! Map<String, dynamic> || tokens is! Map<String, dynamic>) {
      throw const FormatException('Malformed authentication payload');
    }

    final accessToken = tokens['accessToken'];
    final refreshToken = tokens['refreshToken'];
    final accessExpiryRaw = session['expiresAt'] ?? session['accessTokenExpiresAt'];
    final refreshExpiryRaw = session['refreshExpiresAt'] ?? session['refreshTokenExpiresAt'];
    if (accessToken is! String || refreshToken is! String) {
      throw const FormatException('Missing session tokens');
    }
    if (accessExpiryRaw is! String || refreshExpiryRaw is! String) {
      throw const FormatException('Missing session expiry metadata');
    }

    final issuedAtRaw = session['issuedAt'] ?? session['createdAt'];
    final metadata = <String, dynamic>{
      'sessionId': session['id'],
      'role': session['role'],
      'persona': session['persona'],
    };
    final user = payload['user'];
    if (user is Map<String, dynamic> && user['id'] is String) {
      metadata['userId'] = user['id'];
    }

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiresAt: DateTime.parse(accessExpiryRaw).toUtc(),
      refreshTokenExpiresAt: DateTime.parse(refreshExpiryRaw).toUtc(),
      issuedAt: issuedAtRaw is String ? DateTime.tryParse(issuedAtRaw)?.toUtc() : null,
      metadata: metadata,
    );
  }
}
