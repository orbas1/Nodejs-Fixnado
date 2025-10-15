import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Provides a hardened wrapper around [FlutterSecureStorage] with
/// platform-specific defaults that enforce encrypted, namespace-scoped
/// credential storage for session data.
class SecureCredentialStore {
  SecureCredentialStore({
    FlutterSecureStorage? secureStorage,
    this.namespace = 'fixnado',
  }) : _storage = secureStorage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  final String namespace;

  AndroidOptions get _androidOptions => const AndroidOptions(
        encryptedSharedPreferences: true,
        resetOnError: true,
        storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
      );

  IOSOptions get _iosOptions => const IOSOptions(
        accessibility: KeychainAccessibility.unlocked_this_device,
      );

  MacOsOptions get _macOptions => const MacOsOptions(
        accessibility: KeychainAccessibility.unlocked_this_device,
        useDataProtectionKeyChain: true,
      );

  LinuxOptions get _linuxOptions => const LinuxOptions();

  WindowsOptions get _windowsOptions => const WindowsOptions(
        useBackwardCompatibility: false,
      );

  WebOptions get _webOptions => const WebOptions(
        dbName: 'fixnado_secure_store',
        publicKey: 'FixnadoSecureStore',
      );

  String _key(String key) => '$namespace:$key';

  Future<void> writeJson(String key, Map<String, dynamic> value) async {
    final payload = jsonEncode(value);
    await _storage.write(
      key: _key(key),
      value: payload,
      aOptions: _androidOptions,
      iOptions: _iosOptions,
      mOptions: _macOptions,
      lOptions: _linuxOptions,
      wOptions: _windowsOptions,
      webOptions: _webOptions,
    );
  }

  Future<Map<String, dynamic>?> readJson(String key) async {
    final raw = await _storage.read(
      key: _key(key),
      aOptions: _androidOptions,
      iOptions: _iosOptions,
      mOptions: _macOptions,
      lOptions: _linuxOptions,
      wOptions: _windowsOptions,
      webOptions: _webOptions,
    );
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> delete(String key) async {
    await _storage.delete(
      key: _key(key),
      aOptions: _androidOptions,
      iOptions: _iosOptions,
      mOptions: _macOptions,
      lOptions: _linuxOptions,
      wOptions: _windowsOptions,
      webOptions: _webOptions,
    );
  }
}
