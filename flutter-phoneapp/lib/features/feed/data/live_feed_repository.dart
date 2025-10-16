import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/live_feed_models.dart';

class LiveFeedRepository {
  LiveFeedRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _cacheKey(String? zoneId, bool includeOutOfZone, bool outOfZoneOnly) {
    final zonePart = zoneId == null || zoneId.isEmpty ? 'all' : zoneId;
    final includePart = includeOutOfZone ? 'in' : 'out';
    final outOnlyPart = outOfZoneOnly ? 'only' : 'mixed';
    return 'live_feed:v1:$zonePart:$includePart:$outOnlyPart';
  }

  Future<LiveFeedFetchResult> fetchLiveFeed({
    String? zoneId,
    bool includeOutOfZone = false,
    bool outOfZoneOnly = false,
    int limit = 20,
  }) async {
    final cacheKey = _cacheKey(zoneId, includeOutOfZone, outOfZoneOnly);

    try {
      final query = <String, dynamic>{
        'limit': limit,
        if (zoneId != null && zoneId.isNotEmpty) 'zoneId': zoneId,
        if (includeOutOfZone) 'includeOutOfZone': 'true',
        if (outOfZoneOnly) 'outOfZoneOnly': 'true',
      };
      final payload = await _client.getJsonList('/feed/live', query: query);
      final posts = payload
          .map((item) => LiveFeedPost.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      await _cache.writeJson(cacheKey, posts.map((post) => post.toJson()).toList());
      return LiveFeedFetchResult(posts: posts, offline: false);
    } on ApiException catch (_) {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        return LiveFeedFetchResult(posts: _fromCache(cached['value']), offline: true);
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        return LiveFeedFetchResult(posts: _fromCache(cached['value']), offline: true);
      }
      rethrow;
    }
  }

  List<LiveFeedPost> _fromCache(Object? raw) {
    if (raw is List<dynamic>) {
      return raw
          .map((item) => LiveFeedPost.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    if (raw is Map<String, dynamic>) {
      final list = raw['posts'] as List<dynamic>? ?? [];
      return list
          .map((item) => LiveFeedPost.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return const [];
  }

  Future<LiveFeedPost> publishJob(LiveFeedJobDraft draft) async {
    final payload = await _client.postJson('/feed/live', body: draft.toJson());
    return LiveFeedPost.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<LiveFeedBid> submitBid(String postId, LiveFeedBidRequest request) async {
    final payload = await _client.postJson('/feed/live/$postId/bids', body: request.toJson());
    return LiveFeedBid.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<LiveFeedBidMessage> sendBidMessage(
    String postId,
    String bidId,
    LiveFeedMessageRequest request,
  ) async {
    final payload = await _client.postJson(
      '/feed/live/$postId/bids/$bidId/messages',
      body: request.toJson(),
    );
    return LiveFeedBidMessage.fromJson(Map<String, dynamic>.from(payload));
  }

  Stream<LiveFeedServerEvent> watchLiveFeed({
    String? zoneId,
    bool includeOutOfZone = false,
    bool outOfZoneOnly = false,
    int limit = 20,
  }) {
    StreamSubscription<List<int>>? subscription;
    http.StreamedResponse? response;

    late final StreamController<LiveFeedServerEvent> controller;
    controller = StreamController<LiveFeedServerEvent>(
      onListen: () {
        () async {
          try {
            final query = <String, dynamic>{
              'limit': limit,
              if (zoneId != null && zoneId.isNotEmpty) 'zoneId': zoneId,
              if (includeOutOfZone) 'includeOutOfZone': 'true',
              if (outOfZoneOnly) 'outOfZoneOnly': 'true',
            };

            response = await _client.stream('/feed/live/stream', query: query);

            if (response!.statusCode < 200 || response!.statusCode >= 300) {
              Object? details;
              try {
                final text = await response!.stream.bytesToString();
                if (text.isNotEmpty) {
                  try {
                    details = jsonDecode(text);
                  } catch (_) {
                    details = text;
                  }
                }
              } catch (_) {
                // Ignore body parsing issues, surface base error instead.
              }

              final error = ApiException(
                response!.statusCode,
                'Failed to open live feed stream',
                details: details,
              );

              if (!controller.isClosed) {
                controller.addError(error);
                await controller.close();
              }
              return;
            }

            final decoder = const Utf8Decoder();
            final buffer = StringBuffer();

            subscription = response!.stream.listen(
              (chunk) {
                buffer.write(decoder.convert(chunk));
                var snapshot = buffer.toString();
                while (true) {
                  final separatorIndex = snapshot.indexOf('\n\n');
                  if (separatorIndex == -1) {
                    break;
                  }
                  final frame = snapshot.substring(0, separatorIndex);
                  snapshot = snapshot.substring(separatorIndex + 2);
                  final event = _parseServerEvent(frame);
                  if (event != null && !controller.isClosed) {
                    controller.add(event);
                  }
                }
                buffer
                  ..clear()
                  ..write(snapshot);
              },
              onError: (error, stackTrace) {
                if (!controller.isClosed) {
                  controller.addError(error, stackTrace);
                }
              },
              onDone: () async {
                if (!controller.isClosed) {
                  await controller.close();
                }
              },
              cancelOnError: false,
            );
          } on ApiException catch (error) {
            if (!controller.isClosed) {
              controller.addError(error);
              await controller.close();
            }
          } catch (error, stackTrace) {
            if (!controller.isClosed) {
              controller.addError(error, stackTrace);
              await controller.close();
            }
          }
        }();
      },
      onPause: () => subscription?.pause(),
      onResume: () => subscription?.resume(),
      onCancel: () async {
        await subscription?.cancel();
        subscription = null;
        response = null;
      },
    );

    return controller.stream;
  }

  LiveFeedServerEvent? _parseServerEvent(String frame) {
    String? eventName;
    final dataBuffer = StringBuffer();

    for (final rawLine in frame.split('\n')) {
      final line = rawLine.trim();
      if (line.isEmpty) continue;
      if (line.startsWith('event:')) {
        eventName = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        dataBuffer.writeln(line.substring(5).trim());
      }
    }

    if (eventName == null || eventName.isEmpty) {
      return null;
    }

    Map<String, dynamic> payload = const {};
    final text = dataBuffer.toString().trim();
    if (text.isNotEmpty) {
      final decoded = jsonDecode(text);
      if (decoded is Map<String, dynamic>) {
        payload = decoded;
      }
    }

    return LiveFeedServerEvent(type: eventName, data: payload);
  }
}

final liveFeedRepositoryProvider = Provider<LiveFeedRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return LiveFeedRepository(client, cache);
});
