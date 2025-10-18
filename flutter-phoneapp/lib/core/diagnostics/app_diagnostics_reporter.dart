import 'dart:convert';
import 'dart:io' show Platform;

import 'package:crypto/crypto.dart';
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
    final now = DateTime.now().toUtc();

    final payload = <String, dynamic>{
      'reference': reference,
      'correlationId': _resolveCorrelationId(reference, extra),
      'occurredAt': now.toIso8601String(),
      'severity': _resolveSeverity(extra),
      'environment': _config.environment,
      'releaseChannel': _config.releaseChannel,
      'appVersion': _config.appVersion,
      'buildNumber': _config.buildNumber,
      'platform': Platform.operatingSystem,
      'platformVersion': Platform.operatingSystemVersion,
      'deviceModel': _stringFrom(extra, 'deviceModel') ?? _stringFrom(extra?['device'], 'model') ?? 'unknown',
      'deviceManufacturer':
          _stringFrom(extra, 'deviceManufacturer') ?? _stringFrom(extra?['device'], 'manufacturer') ?? 'unknown',
      'deviceIdentifier': _hashIdentifier(
        _stringFrom(extra, 'deviceIdentifier') ?? _stringFrom(extra?['device'], 'identifier'),
      ),
      'locale': _stringFrom(extra, 'locale') ?? Platform.localeName,
      'isEmulator': extra?['isEmulator'] == true,
      'isReleaseBuild': extra?['isReleaseBuild'] == true,
      'error': {
        'type': error.runtimeType.toString(),
        'message': error.toString(),
        'stackTrace': stackTrace.toString(),
      },
      'metadata': _buildMetadata(context, extra),
      'breadcrumbs': _sanitiseBreadcrumbs(extra?['breadcrumbs']),
      'tags': _sanitiseTags(extra?['tags']),
      'threads': _sanitiseThreads(extra?['threads']),
      'sessionId': _stringFrom(extra, 'sessionId'),
      'tenantId': _stringFrom(extra, 'tenantId'),
      'userId': _stringFrom(extra, 'userId'),
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
          'Failed to report mobile crash (status: ${response.statusCode})',
          reference,
        );
      }
    } catch (err, stack) {
      _logger.severe('Failed to deliver mobile crash diagnostics', err, stack);
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

  String? _stringFrom(Map<String, dynamic>? source, String key) {
    if (source == null) {
      return null;
    }

    final value = source[key];
    if (value is String && value.trim().isNotEmpty) {
      return value.trim();
    }

    return null;
  }

  String _resolveSeverity(Map<String, dynamic>? extra) {
    final raw = _stringFrom(extra, 'severity');
    if (raw != null) {
      final token = raw.toLowerCase();
      if (token == 'debug' || token == 'info' || token == 'warning' || token == 'error' || token == 'fatal') {
        return token;
      }
    }

    if (extra?['isFatal'] == true) {
      return 'fatal';
    }

    return 'fatal';
  }

  String _resolveCorrelationId(String reference, Map<String, dynamic>? extra) {
    final override = _stringFrom(extra, 'correlationId') ?? _stringFrom(extra, 'traceId');
    if (override != null) {
      return override.length > 64 ? override.substring(0, 64) : override;
    }

    return reference;
  }

  Map<String, dynamic> _buildMetadata(String context, Map<String, dynamic>? extra) {
    final metadata = <String, dynamic>{'context': context};
    final raw = extra?['metadata'];
    if (raw is Map<String, dynamic>) {
      for (final entry in raw.entries) {
        final value = entry.value;
        if (value == null || value is Function || value is Symbol) {
          continue;
        }
        metadata[entry.key] = value is Error
            ? {
                'name': value.runtimeType.toString(),
                'message': value.toString(),
                'stackTrace': value.stackTrace?.toString(),
              }
            : value;
      }
    }

    metadata.remove('breadcrumbs');
    metadata.remove('tags');
    metadata.remove('correlationId');
    metadata.remove('traceId');
    metadata.remove('sessionId');
    metadata.remove('tenantId');
    metadata.remove('userId');

    return metadata;
  }

  List<Map<String, dynamic>>? _sanitiseBreadcrumbs(dynamic source) {
    if (source is! List) {
      return null;
    }

    final result = <Map<String, dynamic>>[];
    final limit = source.length < 120 ? source.length : 120;
    for (var i = 0; i < limit; i += 1) {
      final entry = source[i];
      if (entry is! Map) {
        continue;
      }

      final timestampValue = entry['timestamp'];
      DateTime? timestamp;
      if (timestampValue is String) {
        try {
          timestamp = DateTime.tryParse(timestampValue);
        } catch (_) {
          timestamp = null;
        }
      }

      result.add({
        'timestamp': timestamp?.toUtc().toIso8601String(),
        'category': _stringFrom(entry.cast<String, dynamic>(), 'category'),
        'level': _stringFrom(entry.cast<String, dynamic>(), 'level'),
        'message': _stringFrom(entry.cast<String, dynamic>(), 'message'),
        'data': entry['data'] is Map<String, dynamic> ? entry['data'] : null,
      });
    }

    return result.isEmpty ? null : result;
  }

  List<String>? _sanitiseTags(dynamic source) {
    if (source is! List) {
      return null;
    }

    final result = <String>[];
    for (final tag in source) {
      if (tag is! String) {
        continue;
      }
      final trimmed = tag.trim();
      if (trimmed.isEmpty) {
        continue;
      }
      result.add(trimmed.length > 64 ? trimmed.substring(0, 64) : trimmed);
      if (result.length >= 32) {
        break;
      }
    }

    return result.isEmpty ? null : result;
  }

  List<Map<String, dynamic>>? _sanitiseThreads(dynamic source) {
    if (source is! List) {
      return null;
    }

    final threads = <Map<String, dynamic>>[];
    final limit = source.length < 10 ? source.length : 10;
    for (var i = 0; i < limit; i += 1) {
      final entry = source[i];
      if (entry is Map<String, dynamic>) {
        threads.add(Map<String, dynamic>.from(entry));
      }
    }

    return threads.isEmpty ? null : threads;
  }

  String? _hashIdentifier(String? identifier) {
    if (identifier == null || identifier.trim().isEmpty) {
      return null;
    }

    final digest = sha256.convert(utf8.encode(identifier.trim()));
    return digest.toString();
  }

  void dispose() {
    _client.close();
  }
}
