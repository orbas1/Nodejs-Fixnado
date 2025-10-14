import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_cache.dart';
import '../features/auth/application/auth_token_controller.dart';
import '../features/auth/data/auth_token_store.dart';
import '../features/auth/domain/auth_token_store.dart';

final appConfigProvider = Provider<AppConfig>((ref) => throw UnimplementedError('AppConfig not loaded'));
final httpClientProvider = Provider<http.Client>((ref) => http.Client());
final localCacheProvider = Provider<LocalCache>((ref) => throw UnimplementedError('Local cache not initialised'));
final authTokenStoreProvider = Provider<AuthTokenStore>((ref) {
  final cache = ref.watch(localCacheProvider);
  return AuthTokenStore(cache);
});

final apiClientProvider = Provider<FixnadoApiClient>((ref) {
  final client = ref.watch(httpClientProvider);
  final config = ref.watch(appConfigProvider);
  final token = ref.watch(authTokenProvider);
  final tokenStore = ref.watch(authTokenStoreProvider);
  final logger = Logger('FixnadoApiClient');
  return FixnadoApiClient(
    baseUrl: config.apiBaseUrl,
    client: client,
    defaultHeaders: config.defaultHeaders,
    requestTimeout: config.requestTimeout,
    accessTokenProvider: () => token,
    logger: logger,
    authTokenResolver: tokenStore.read,
  );
});

class Bootstrap {
  Bootstrap({
    required this.config,
    required this.cache,
    required this.httpClient,
  });

  final AppConfig config;
  final LocalCache cache;
  final http.Client httpClient;

  static Future<Bootstrap> load() async {
    final config = AppConfig.fromEnvironment();
    final prefs = await SharedPreferences.getInstance();
    final cache = LocalCache(prefs);
    final httpClient = http.Client();

    _configureLogging(config.enableNetworkLogging);

    return Bootstrap(
      config: config,
      cache: cache,
      httpClient: httpClient,
    );
  }

  List<Override> get overrides => [
        appConfigProvider.overrideWithValue(config),
        httpClientProvider.overrideWithValue(httpClient),
        localCacheProvider.overrideWithValue(cache),
        authTokenStoreProvider.overrideWithValue(
          AuthTokenStore(cache, fallbackToken: config.demoAccessToken),
        ),
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
