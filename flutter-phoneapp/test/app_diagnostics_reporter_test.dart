import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:fixnado_mobile/core/config/app_config.dart';
import 'package:fixnado_mobile/core/diagnostics/app_diagnostics_reporter.dart';

void main() {
  test('reports fatal error payload to telemetry endpoint', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return http.Response('', 202);
    });

    final reporter = AppDiagnosticsReporter(client, AppConfig.fromEnvironment());

    await reporter.report(
      reference: 'ref-test',
      error: Exception('boom'),
      stackTrace: StackTrace.fromString('stack trace'),
      context: 'unit',
      extra: {'foo': 'bar'},
    );

    expect(captured.url.pathSegments.last, equals('mobile-crashes'));
    final body = jsonDecode(captured.body) as Map<String, dynamic>;
    expect(body['reference'], equals('ref-test'));
    expect(body['context'], equals('unit'));
    expect(body['error']['message'], equals('Exception: boom'));
    expect(body['metadata']['foo'], equals('bar'));
  });
}
