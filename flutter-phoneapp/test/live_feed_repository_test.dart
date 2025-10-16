import 'dart:async';
import 'dart:convert';

import 'package:fixnado_mobile/core/exceptions/api_exception.dart';
import 'package:fixnado_mobile/core/network/api_client.dart';
import 'package:fixnado_mobile/core/storage/local_cache.dart';
import 'package:fixnado_mobile/features/feed/data/live_feed_repository.dart';
import 'package:fixnado_mobile/features/feed/domain/live_feed_models.dart';
import 'package:http/http.dart' as http;
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';

class MockApiClient extends Mock implements FixnadoApiClient {}

class MockLocalCache extends Mock implements LocalCache {}

void main() {
  setUpAll(() {
    registerFallbackValue(<String, dynamic>{});
  });

  group('LiveFeedRepository.watchLiveFeed', () {
    late MockApiClient apiClient;
    late MockLocalCache cache;
    late LiveFeedRepository repository;

    setUp(() {
      apiClient = MockApiClient();
      cache = MockLocalCache();
      repository = LiveFeedRepository(apiClient, cache);
    });

    test('parses SSE frames into LiveFeedServerEvent instances', () async {
      final controller = StreamController<List<int>>();
      final response = http.StreamedResponse(
        controller.stream,
        200,
        headers: {'content-type': 'text/event-stream'},
      );

      when(() => apiClient.stream(any(), query: any(named: 'query')))
          .thenAnswer((_) async => response);

      final received = <LiveFeedServerEvent>[];
      final subscription = repository
          .watchLiveFeed(zoneId: 'zone-1')
          .listen(received.add, onError: (Object? error) {
        fail('Unexpected stream error: $error');
      });

      controller.add(utf8.encode('event: connected\n\ndata: {}\n\n'));
      controller.add(utf8.encode('event: snapshot\n\ndata: {"posts": []}\n\n'));
      controller.add(utf8.encode(
        'event: post.created\n\n'
        'data: {"post":{"id":"p1","title":"Urgent repair","allowOutOfZone":false,'
        '"status":"open","createdAt":"2024-01-01T00:00:00Z","metadata":{},"images":[],"bids":[]}}\n\n',
      ));

      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(received.map((event) => event.type), containsAll(['connected', 'snapshot', 'post.created']));

      await subscription.cancel();
      await controller.close();
    });

    test('emits ApiException when the HTTP connection fails', () async {
      final response = http.StreamedResponse(
        Stream<List<int>>.fromIterable([
          utf8.encode('{"message":"Forbidden"}')
        ]),
        403,
        headers: {'content-type': 'application/json'},
      );

      when(() => apiClient.stream(any(), query: any(named: 'query')))
          .thenAnswer((_) async => response);

      final stream = repository.watchLiveFeed();

      await expectLater(
        stream,
        emitsError(
          isA<ApiException>().having((error) => error.statusCode, 'status', 403),
        ),
      );
    });
  });
}
