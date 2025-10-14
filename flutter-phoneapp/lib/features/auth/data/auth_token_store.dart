import '../../../core/storage/local_cache.dart';

class AuthTokenStore {
  AuthTokenStore(this._cache, {this.fallbackToken});

  final LocalCache _cache;
  final String? fallbackToken;

  static const _storageKey = 'auth:access-token';

  String? read() {
    final stored = _cache.readJson(_storageKey);
    if (stored != null) {
      final value = stored['value'];
      if (value is Map<String, dynamic>) {
        final token = value['token'];
        if (token is String && token.isNotEmpty) {
          return token;
        }
      } else if (value is String && value.isNotEmpty) {
        return value;
      }
    }
    if (fallbackToken != null && fallbackToken!.isNotEmpty) {
      return fallbackToken;
    }
    return null;
  }

  Future<void> write(String token) {
    return _cache.writeJson(_storageKey, {'token': token});
  }

  Future<void> clear() {
    return _cache.remove(_storageKey);
  }
}
