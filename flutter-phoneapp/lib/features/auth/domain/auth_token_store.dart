import '../../core/storage/local_cache.dart';

const _tokenKey = 'auth:accessToken';

class AuthTokenStore {
  AuthTokenStore(this._cache);

  final LocalCache _cache;

  Future<void> save(String token) async {
    await _cache.writeJson(_tokenKey, token);
  }

  String? read() {
    final stored = _cache.readJson(_tokenKey);
    final value = stored?['value'];
    if (value is String && value.isNotEmpty) {
      return value;
    }
    if (value is Map && value['token'] is String) {
      final token = value['token'] as String;
      return token.isEmpty ? null : token;
    }
    return null;
  }

  Future<void> clear() => _cache.remove(_tokenKey);
}
