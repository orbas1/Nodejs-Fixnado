import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../core/security/biometric_authenticator.dart';
import '../core/storage/local_cache.dart';
import '../core/storage/secure_credential_store.dart';
import '../features/auth/application/auth_token_controller.dart';
import '../features/auth/data/auth_token_store.dart';

final appConfigProvider = Provider<AppConfig>((ref) => throw UnimplementedError('AppConfig not loaded'));
final httpClientProvider = Provider<http.Client>((ref) => http.Client());
final localCacheProvider = Provider<LocalCache>((ref) => throw UnimplementedError('Local cache not initialised'));
final secureCredentialStoreProvider = Provider<SecureCredentialStore>((ref) {
  throw UnimplementedError('Secure credential store not initialised');
});

final apiClientProvider = Provider<FixnadoApiClient>((ref) {
  final client = ref.watch(httpClientProvider);
  final config = ref.watch(appConfigProvider);
  ref.watch(authTokenProvider);
  final logger = Logger('FixnadoApiClient');
  return FixnadoApiClient(
    baseUrl: config.apiBaseUrl,
    client: client,
    defaultHeaders: config.defaultHeaders,
    requestTimeout: config.requestTimeout,
    logger: logger,
    authTokenResolver: () => ref.read(authTokenProvider).accessToken,
  );
});

class Bootstrap {
  Bootstrap({
    required this.config,
    required this.cache,
    required this.httpClient,
    required this.secureStore,
    required this.biometrics,
  });

  final AppConfig config;
  final LocalCache cache;
  final http.Client httpClient;
  final SecureCredentialStore secureStore;
  final BiometricAuthenticator biometrics;

  static Future<Bootstrap> load() async {
    final config = AppConfig.fromEnvironment();
    final prefs = await SharedPreferences.getInstance();
    final cache = LocalCache(prefs);
    final httpClient = http.Client();
    final secureStore = SecureCredentialStore();
    final biometrics = BiometricAuthenticator();

    _configureLogging(config.enableNetworkLogging);

    return Bootstrap(
      config: config,
      cache: cache,
      httpClient: httpClient,
      secureStore: secureStore,
      biometrics: biometrics,
    );
  }

  List<Override> get overrides => [
        appConfigProvider.overrideWithValue(config),
        httpClientProvider.overrideWithValue(httpClient),
        localCacheProvider.overrideWithValue(cache),
        secureCredentialStoreProvider.overrideWithValue(secureStore),
        authTokenStoreProvider.overrideWithValue(
          AuthTokenStore(secureStore, fallbackToken: config.demoAccessToken),
        ),
        biometricAuthenticatorProvider.overrideWithValue(biometrics),
      ];

  List<ProviderObserver> get observers => [
        if (config.enableProviderLogging) const ProviderLogger(),
      ];

  static void _configureLogging(bool enableNetworkLogging) {
    if (!enableNetworkLogging) {
      return;
    }

    Logger.root.level = Level.INFO;
    if (Logger.root.onRecord.isBroadcast) {
      return;
    }
    Logger.root.onRecord.listen((record) {
      // ignore: avoid_print
      print('[${record.loggerName}] ${record.level.name}: ${record.message}');
    });
  }

  void dispose() {
    httpClient.close();
  }
}

class ProviderLogger extends ProviderObserver {
  const ProviderLogger();

  @override
  void didUpdateProvider(ProviderBase<dynamic> provider, Object? previousValue, Object? newValue, ProviderContainer container) {
    if (provider.name == null) {
      return;
    }
    // ignore: avoid_print
    print('provider ${provider.name} changed');
  }
}
