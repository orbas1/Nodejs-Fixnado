import 'dart:async';

import '../../../core/storage/secure_credential_store.dart';
import '../domain/auth_tokens.dart';

class StoredAuthTokenRecord {
  const StoredAuthTokenRecord({
    required this.tokens,
    required this.requiresBiometricUnlock,
  });

  final AuthTokens tokens;
  final bool requiresBiometricUnlock;
}

/// Persists session credentials using the hardened [SecureCredentialStore].
class AuthTokenStore {
  AuthTokenStore(this._secureStore, {this.fallbackToken});

  final SecureCredentialStore _secureStore;
  final String? fallbackToken;

  static const _storageKey = 'auth-session/v1';

  Future<void> write(AuthTokens tokens, {bool requireBiometricUnlock = false}) async {
    final payload = tokens.toJson()
      ..['biometricLock'] = requireBiometricUnlock;
    await _secureStore.writeJson(_storageKey, payload);
  }

  Future<StoredAuthTokenRecord?> read() async {
    final stored = await _secureStore.readJson(_storageKey);
    if (stored != null) {
      try {
        final tokens = AuthTokens.fromJson(stored);
        final locked = stored['biometricLock'] == true;
        return StoredAuthTokenRecord(tokens: tokens, requiresBiometricUnlock: locked);
      } catch (_) {
        await _secureStore.delete(_storageKey);
      }
    }

    if (fallbackToken == null || fallbackToken!.isEmpty) {
      return null;
    }

    final issuedAt = DateTime.now().toUtc();
    final tokens = AuthTokens(
      accessToken: fallbackToken!,
      refreshToken: fallbackToken!,
      accessTokenExpiresAt: issuedAt.add(const Duration(days: 7)),
      refreshTokenExpiresAt: issuedAt.add(const Duration(days: 7)),
      issuedAt: issuedAt,
      metadata: const {'source': 'demo-access'},
    );
    return StoredAuthTokenRecord(tokens: tokens, requiresBiometricUnlock: false);
  }

  Future<void> clear() => _secureStore.delete(_storageKey);
}
