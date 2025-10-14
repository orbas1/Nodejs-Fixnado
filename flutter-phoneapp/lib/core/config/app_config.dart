class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.requestTimeout,
    required this.enableNetworkLogging,
    required this.enableProviderLogging,
    required this.defaultHeaders,
    this.demoAccessToken,
  });

  final Uri apiBaseUrl;
  final Duration requestTimeout;
  final bool enableNetworkLogging;
  final bool enableProviderLogging;
  final Map<String, String> defaultHeaders;
  final String? demoAccessToken;

  factory AppConfig.fromEnvironment() {
    final baseUrl = const String.fromEnvironment(
      'FIXNADO_API_BASE_URL',
      defaultValue: 'http://localhost:3000/api',
    );

    final timeout = const String.fromEnvironment('FIXNADO_API_TIMEOUT_MS', defaultValue: '15000');
    final timeoutMs = int.tryParse(timeout) ?? 15000;

    final networkLogging = const bool.fromEnvironment('FIXNADO_ENABLE_NETWORK_LOGGING', defaultValue: false);
    final providerLogging = const bool.fromEnvironment('FIXNADO_ENABLE_PROVIDER_LOGGING', defaultValue: false);
    final demoAccessToken = const String.fromEnvironment('FIXNADO_DEMO_ACCESS_TOKEN', defaultValue: '');

    final defaultHeaders = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    return AppConfig(
      apiBaseUrl: Uri.parse(baseUrl),
      requestTimeout: Duration(milliseconds: timeoutMs),
      enableNetworkLogging: networkLogging,
      enableProviderLogging: providerLogging,
      defaultHeaders: defaultHeaders,
      demoAccessToken: demoAccessToken.isEmpty ? null : demoAccessToken,
    );
  }

  AppConfig copyWith({
    Uri? apiBaseUrl,
    Duration? requestTimeout,
    bool? enableNetworkLogging,
    bool? enableProviderLogging,
    Map<String, String>? defaultHeaders,
    String? demoAccessToken,
  }) {
    return AppConfig(
      apiBaseUrl: apiBaseUrl ?? this.apiBaseUrl,
      requestTimeout: requestTimeout ?? this.requestTimeout,
      enableNetworkLogging: enableNetworkLogging ?? this.enableNetworkLogging,
      enableProviderLogging: enableProviderLogging ?? this.enableProviderLogging,
      defaultHeaders: defaultHeaders ?? this.defaultHeaders,
      demoAccessToken: demoAccessToken ?? this.demoAccessToken,
    );
  }
}
