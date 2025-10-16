import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

import '../config/app_config.dart';

class AppDiagnosticsReporter {
  AppDiagnosticsReporter(this._client, AppConfig config)
      : _config = config,
        _logger = Logger('AppDiagnosticsReporter');

  final http.Client _client;
  final Logger _logger;
  AppConfig _config;

  void updateConfig(AppConfig config) {
    _config = config;
  }

  Future<void> report({
    required String reference,
    required Object error,
    required StackTrace stackTrace,
    required String context,
    Map<String, dynamic>? extra,
  }) async {
    final uri = _buildEndpoint();
    final payload = <String, dynamic>{
      'reference': reference,
      'context': context,
      'occurredAt': DateTime.now().toUtc().toIso8601String(),
      'appVersion': '1.50',
      'error': {
        'type': error.runtimeType.toString(),
        'message': error.toString(),
        'stackTrace': stackTrace.toString(),
      },
      'metadata': {
        'platform': 'flutter-mobile',
        if (extra != null) ...extra,
      }
    };

    try {
      final response = await _client.post(
        uri,
        headers: <String, String>{
          'Content-Type': 'application/json',
          ..._config.defaultHeaders,
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode >= 400) {
        _logger.warning(
          'Failed to report fatal error (status: ${response.statusCode})',
          reference,
        );
      }
    } catch (err, stack) {
      _logger.severe('Failed to deliver fatal error diagnostics', err, stack);
    }
  }

  Uri _buildEndpoint() {
    final base = _config.apiBaseUrl;
    final segments = <String>[
      ...base.pathSegments.where((segment) => segment.isNotEmpty),
      'telemetry',
      'mobile-crashes',
    ];

    return base.replace(pathSegments: segments);
  }

  void dispose() {
    _client.close();
  }
}
