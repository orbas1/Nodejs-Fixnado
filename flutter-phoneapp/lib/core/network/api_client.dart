import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

import '../exceptions/api_exception.dart';

class FixnadoApiClient {
  FixnadoApiClient({
    required this.baseUrl,
    required this.client,
    required this.defaultHeaders,
    required this.requestTimeout,
    Logger? logger,
  }) : _logger = logger ?? Logger('FixnadoApiClient');

  final Uri baseUrl;
  final http.Client client;
  final Map<String, String> defaultHeaders;
  final Duration requestTimeout;
  final Logger _logger;

  Uri _buildUri(String path, [Map<String, dynamic>? query]) {
    final base = baseUrl.resolve(path.startsWith('/') ? path.substring(1) : path);
    if (query == null || query.isEmpty) {
      return base;
    }
    final filtered = query.entries.where((entry) => entry.value != null).map((entry) => MapEntry(entry.key, '${entry.value}'));
    return base.replace(queryParameters: {
      ...base.queryParameters,
      for (final entry in filtered) entry.key: entry.value,
    });
  }

  Map<String, String> _headers([Map<String, String>? headers]) => {
        ...defaultHeaders,
        if (headers != null) ...headers,
      };

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
    final uri = _buildUri(path, query);
    _logger.fine('GET $uri');
    final response = await client.get(uri, headers: _headers(headers)).timeout(requestTimeout);
    return _decodeResponse(response);
  }

  Future<String> getText(String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
    final uri = _buildUri(path, query);
    _logger.fine('GET $uri (text)');
    final response = await client.get(uri, headers: _headers(headers)).timeout(requestTimeout);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.body;
    }

    Object? parsed;
    try {
      parsed = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      parsed = response.body;
    }
    throw ApiException(response.statusCode, 'Request failed with status ${response.statusCode}', details: parsed);
  }

  Future<List<dynamic>> getJsonList(String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
    final payload = await getJson(path, query: query, headers: headers);
    if (payload['data'] is List) {
      return List<dynamic>.from(payload['data'] as List);
    }
    if (payload is List) {
      return List<dynamic>.from(payload);
    }
    throw ApiException(500, 'Unexpected list payload structure', details: payload);
  }

  Future<Map<String, dynamic>> postJson(String path, {Object? body, Map<String, String>? headers}) async {
    final uri = _buildUri(path);
    _logger.fine('POST $uri');
    final response = await client
        .post(
          uri,
          headers: _headers(headers),
          body: body == null ? null : jsonEncode(body),
        )
        .timeout(requestTimeout);
    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> patchJson(String path, {Object? body, Map<String, String>? headers}) async {
    final uri = _buildUri(path);
    _logger.fine('PATCH $uri');
    final response = await client
        .patch(
          uri,
          headers: _headers(headers),
          body: body == null ? null : jsonEncode(body),
        )
        .timeout(requestTimeout);
    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> _decodeResponse(http.Response response) async {
    final text = response.body;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (text.isEmpty) {
        return <String, dynamic>{};
      }
      final decoded = jsonDecode(text);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return {'data': decoded};
    }

    Object? parsed;
    try {
      parsed = text.isEmpty ? null : jsonDecode(text);
    } catch (_) {
      parsed = text;
    }
    throw ApiException(response.statusCode, 'Request failed with status ${response.statusCode}', details: parsed);
  }
}
