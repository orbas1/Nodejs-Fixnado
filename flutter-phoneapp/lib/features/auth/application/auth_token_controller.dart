import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_token_store.dart';

final authTokenStoreProvider = Provider<AuthTokenStore>((ref) {
  throw UnimplementedError('AuthTokenStore not initialised');
});

class AuthTokenController extends StateNotifier<String?> {
  AuthTokenController(this._store) : super(_store.read());

  final AuthTokenStore _store;

  Future<void> setToken(String? token) async {
    if (token == null || token.isEmpty) {
      await _store.clear();
      state = null;
      return;
    }
    await _store.write(token);
    state = token;
  }
}

final authTokenProvider = StateNotifierProvider<AuthTokenController, String?>((ref) {
  final store = ref.watch(authTokenStoreProvider);
  return AuthTokenController(store);
});
