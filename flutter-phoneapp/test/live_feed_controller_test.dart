import 'dart:async';

import 'package:fixnado_mobile/features/feed/data/live_feed_repository.dart';
import 'package:fixnado_mobile/features/feed/domain/live_feed_models.dart';
import 'package:fixnado_mobile/features/feed/presentation/live_feed_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';

class MockLiveFeedRepository extends Mock implements LiveFeedRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(false);
    registerFallbackValue(0);
    registerFallbackValue(LiveFeedJobDraft(title: 'fallback', description: 'fallback'));
    registerFallbackValue(LiveFeedBidRequest(message: 'fallback'));
    registerFallbackValue(LiveFeedMessageRequest(body: 'fallback'));
  });

  group('LiveFeedController', () {
    late MockLiveFeedRepository repository;
    late StreamController<LiveFeedServerEvent> streamController;
    late ProviderContainer container;

    Future<void> pumpEventLoop() => Future<void>.delayed(const Duration(milliseconds: 20));

    setUp(() {
      repository = MockLiveFeedRepository();
      streamController = StreamController<LiveFeedServerEvent>.broadcast();

      when(
        () => repository.fetchLiveFeed(
          zoneId: any(named: 'zoneId'),
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer(
        (_) async => LiveFeedFetchResult(posts: const [], offline: false),
      );

      when(
        () => repository.watchLiveFeed(
          zoneId: any(named: 'zoneId'),
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer((_) => streamController.stream);

      container = ProviderContainer(
        overrides: [liveFeedRepositoryProvider.overrideWithValue(repository)],
      );
    });

    tearDown(() async {
      await streamController.close();
      container.dispose();
    });

    test('loads snapshot data and updates streaming status', () async {
      container.read(liveFeedControllerProvider.notifier);
      await pumpEventLoop();

      final snapshot = {
        'posts': [
          {
            'id': 'post-1',
            'title': 'Electrical maintenance',
            'allowOutOfZone': false,
            'status': 'open',
            'createdAt': DateTime.now().toIso8601String(),
            'metadata': <String, dynamic>{},
            'images': <String>[],
            'bids': <Map<String, dynamic>>[],
          }
        ],
        'generatedAt': DateTime.now().toIso8601String(),
      };

      streamController.add(LiveFeedServerEvent(type: 'snapshot', data: snapshot));
      await pumpEventLoop();

      final state = container.read(liveFeedControllerProvider);
      expect(state.posts, hasLength(1));
      expect(state.streamConnected, isTrue);
      expect(state.streamReconnecting, isFalse);
      expect(state.isLoading, isFalse);
      expect(state.offline, isFalse);
    });

    test('merges post, bid, and message events into existing state', () async {
      container.read(liveFeedControllerProvider.notifier);
      await pumpEventLoop();

      final now = DateTime.now().toIso8601String();
      streamController.add(
        LiveFeedServerEvent(
          type: 'snapshot',
          data: {
            'posts': [
              {
                'id': 'post-1',
                'title': 'Install lighting grid',
                'allowOutOfZone': false,
                'status': 'open',
                'createdAt': now,
                'metadata': <String, dynamic>{},
                'images': <String>[],
                'bids': <Map<String, dynamic>>[],
              }
            ],
            'generatedAt': now,
          },
        ),
      );
      await pumpEventLoop();

      streamController.add(
        LiveFeedServerEvent(
          type: 'post.created',
          data: {
            'post': {
              'id': 'post-2',
              'title': 'Emergency generator deployment',
              'allowOutOfZone': true,
              'status': 'open',
              'createdAt': now,
              'metadata': <String, dynamic>{},
              'images': <String>[],
              'bids': <Map<String, dynamic>>[],
            }
          },
        ),
      );
      await pumpEventLoop();

      streamController.add(
        LiveFeedServerEvent(
          type: 'bid.created',
          data: {
            'postId': 'post-1',
            'bid': {
              'id': 'bid-1',
              'amount': 550,
              'currency': 'USD',
              'status': 'pending',
              'createdAt': now,
              'provider': {
                'id': 'provider-1',
                'firstName': 'Amelia',
                'lastName': 'Rios',
                'type': 'servicemen',
              },
              'messages': <Map<String, dynamic>>[],
            }
          },
        ),
      );
      await pumpEventLoop();

      streamController.add(
        LiveFeedServerEvent(
          type: 'bid.message',
          data: {
            'postId': 'post-1',
            'bidId': 'bid-1',
            'message': {
              'id': 'msg-1',
              'body': 'Crew can be onsite within 60 minutes.',
              'createdAt': now,
              'author': {
                'id': 'provider-1',
                'firstName': 'Amelia',
                'lastName': 'Rios',
                'type': 'provider',
              },
              'attachments': <Map<String, dynamic>>[],
            }
          },
        ),
      );
      await pumpEventLoop();

      final state = container.read(liveFeedControllerProvider);
      expect(state.posts.map((post) => post.id), containsAll(['post-1', 'post-2']));
      final trackedPost = state.posts.firstWhere((post) => post.id == 'post-1');
      expect(trackedPost.bids, hasLength(1));
      expect(trackedPost.bids.first.messages, hasLength(1));
      expect(trackedPost.bids.first.messages.first.body, contains('onsite'));
    });

    test('refreshing filters restarts the stream with updated parameters', () async {
      final notifier = container.read(liveFeedControllerProvider.notifier);
      await pumpEventLoop();

      clearInteractions(repository);

      when(
        () => repository.fetchLiveFeed(
          zoneId: any(named: 'zoneId'),
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer(
        (_) async => LiveFeedFetchResult(posts: const [], offline: false),
      );

      when(
        () => repository.watchLiveFeed(
          zoneId: any(named: 'zoneId'),
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: any(named: 'limit'),
        ),
      ).thenAnswer((_) => streamController.stream);

      notifier.selectZone('zone-42');
      await pumpEventLoop();

      verify(
        () => repository.fetchLiveFeed(
          zoneId: 'zone-42',
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: 20,
        ),
      ).called(1);

      verify(
        () => repository.watchLiveFeed(
          zoneId: 'zone-42',
          includeOutOfZone: any(named: 'includeOutOfZone'),
          outOfZoneOnly: any(named: 'outOfZoneOnly'),
          limit: 20,
        ),
      ).called(1);
    });

    test('records stream errors without dropping state', () async {
      container.read(liveFeedControllerProvider.notifier);
      await pumpEventLoop();

      streamController.add(
        LiveFeedServerEvent(type: 'error', data: {'message': 'Snapshot failed'}),
      );
      await pumpEventLoop();

      final state = container.read(liveFeedControllerProvider);
      expect(state.streamError, 'Snapshot failed');
      expect(state.streamReconnecting, isTrue);
    });
  });
}
