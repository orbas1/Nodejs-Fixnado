import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/security/biometric_authenticator.dart';
import '../data/auth_token_store.dart';
import '../domain/auth_tokens.dart';

enum AuthTokenStatus { initialising, unlocked, locked, empty, error }

class AuthTokenState {
  const AuthTokenState._({
    required this.status,
    this.tokens,
    this.requiresBiometricUnlock = false,
    this.hasEncryptedCredentials = false,
    this.error,
  });

  final AuthTokenStatus status;
  final AuthTokens? tokens;
  final bool requiresBiometricUnlock;
  final bool hasEncryptedCredentials;
  final Object? error;

  static AuthTokenState initial() => const AuthTokenState._(status: AuthTokenStatus.initialising);

  static AuthTokenState empty() => const AuthTokenState._(status: AuthTokenStatus.empty);

  static AuthTokenState locked({required bool hasEncryptedCredentials}) => AuthTokenState._(
        status: AuthTokenStatus.locked,
        requiresBiometricUnlock: true,
        hasEncryptedCredentials: hasEncryptedCredentials,
      );

  static AuthTokenState unlocked(AuthTokens tokens, {bool requiresBiometricUnlock = false}) => AuthTokenState._(
        status: AuthTokenStatus.unlocked,
        tokens: tokens,
        requiresBiometricUnlock: requiresBiometricUnlock,
        hasEncryptedCredentials: true,
      );

  static AuthTokenState failure(Object error) => AuthTokenState._(
        status: AuthTokenStatus.error,
        error: error,
      );

  bool get locked => status == AuthTokenStatus.locked;

  bool get hasCredentials => hasEncryptedCredentials || tokens != null;

  String? get accessToken => locked ? null : tokens?.accessToken;

  AuthTokens? get unlockedTokens => locked ? null : tokens;

  bool get needsRefresh => !locked && tokens?.shouldRefresh == true;

  bool get refreshExpired => !locked && tokens?.isRefreshExpired == true;
}

final authTokenStoreProvider = Provider<AuthTokenStore>((ref) {
  throw UnimplementedError('AuthTokenStore not initialised');
});

final biometricAuthenticatorProvider = Provider<BiometricAuthenticator>((ref) {
  throw UnimplementedError('BiometricAuthenticator not initialised');
});

class AuthTokenController extends StateNotifier<AuthTokenState> {
  AuthTokenController(this._store, this._biometrics) : super(AuthTokenState.initial()) {
    _hydrate();
  }

  final AuthTokenStore _store;
  final BiometricAuthenticator _biometrics;
  bool _hydrated = false;

  Future<void> _hydrate() async {
    if (_hydrated) {
      return;
    }
    _hydrated = true;
    try {
      final stored = await _store.read();
      if (stored == null) {
        state = AuthTokenState.empty();
        return;
      }
      if (stored.requiresBiometricUnlock) {
        state = AuthTokenState.locked(hasEncryptedCredentials: true);
        return;
      }
      state = AuthTokenState.unlocked(
        stored.tokens,
        requiresBiometricUnlock: stored.requiresBiometricUnlock,
      );
    } catch (error) {
      state = AuthTokenState.failure(error);
    }
  }

  String? resolveAccessToken() => state.accessToken;

  Future<void> persist(AuthTokens tokens, {bool requireBiometricUnlock = false}) async {
    final shouldLock = requireBiometricUnlock || state.requiresBiometricUnlock;
    await _store.write(tokens, requireBiometricUnlock: shouldLock);
    state = AuthTokenState.unlocked(tokens, requiresBiometricUnlock: shouldLock);
  }

  Future<bool> unlockWithBiometrics({String prompt = 'Unlock your Fixnado session'}) async {
    if (!state.locked) {
      return state.tokens != null;
    }
    final canUnlock = await _biometrics.authenticate(reason: prompt);
    if (!canUnlock) {
      return false;
    }
    final stored = await _store.read();
    if (stored == null) {
      state = AuthTokenState.empty();
      return false;
    }
    state = AuthTokenState.unlocked(
      stored.tokens,
      requiresBiometricUnlock: stored.requiresBiometricUnlock,
    );
    return true;
  }

  Future<void> lock() async {
    if (!state.hasCredentials) {
      state = AuthTokenState.empty();
      return;
    }
    state = AuthTokenState.locked(hasEncryptedCredentials: true);
  }

  Future<void> clear() async {
    await _store.clear();
    state = AuthTokenState.empty();
  }

  Future<bool> ensureFreshness(Future<AuthTokens> Function(String refreshToken) refreshFn) async {
    final current = state;
    final tokens = current.unlockedTokens;
    if (tokens == null) {
      return false;
    }
    if (!tokens.shouldRefresh) {
      return true;
    }
    if (tokens.isRefreshExpired) {
      await clear();
      return false;
    }
    try {
      final refreshed = await refreshFn(tokens.refreshToken);
      await persist(refreshed, requireBiometricUnlock: current.requiresBiometricUnlock);
      return true;
    } catch (_) {
      return false;
    }
  }
}

final authTokenProvider = StateNotifierProvider<AuthTokenController, AuthTokenState>((ref) {
  final store = ref.watch(authTokenStoreProvider);
  final biometrics = ref.watch(biometricAuthenticatorProvider);
  return AuthTokenController(store, biometrics);
});
