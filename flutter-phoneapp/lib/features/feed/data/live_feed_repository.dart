import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

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
}

final liveFeedRepositoryProvider = Provider<LiveFeedRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return LiveFeedRepository(client, cache);
});
