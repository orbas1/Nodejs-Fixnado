import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/blog_models.dart';

class BlogRepository {
  BlogRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  String _cacheKey({required int page, String? category, String? tag}) {
    final categoryKey = category?.isEmpty ?? true ? 'all' : category;
    final tagKey = tag?.isEmpty ?? true ? 'all' : tag;
    return 'blogFeed:v1:page$page:$categoryKey:$tagKey';
  }

  Future<BlogFeedSnapshot> fetchFeed({
    int page = 1,
    String? category,
    String? tag,
    bool bypassCache = false,
  }) async {
    final key = _cacheKey(page: page, category: category, tag: tag);
    BlogFeedSnapshot? cachedSnapshot;
    if (!bypassCache) {
      final cached = _cache.readJson(key);
      if (cached != null) {
        try {
          cachedSnapshot = BlogFeedSnapshot.fromJson(
            Map<String, dynamic>.from(cached['value'] as Map? ?? {}),
            offline: true,
          );
        } catch (_) {
          cachedSnapshot = null;
        }
      }
    }

    final query = {
      'page': page,
      if (category != null && category.isNotEmpty) 'category': category,
      if (tag != null && tag.isNotEmpty) 'tag': tag,
    };

    try {
      final payload = await _client.getJson('/blog', query: query);
      final posts = (payload['data'] as List<dynamic>? ?? const [])
          .map((entry) => BlogPostModel.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList();
      final facets = Map<String, dynamic>.from(payload['facets'] as Map? ?? {});
      final categories = (facets['categories'] as List<dynamic>? ?? const [])
          .map((entry) => BlogCategoryModel.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList();
      final tags = (facets['tags'] as List<dynamic>? ?? const [])
          .map((entry) => BlogTagModel.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList();
      final pagination = BlogPaginationInfo.fromJson(Map<String, dynamic>.from(payload['pagination'] as Map? ?? {}));
      final snapshot = BlogFeedSnapshot(
        generatedAt: DateTime.now(),
        posts: posts,
        categories: categories,
        tags: tags,
        pagination: pagination,
        offline: false,
      );
      await _cache.writeJson(key, snapshot.toCacheJson());
      return snapshot;
    } on TimeoutException catch (_) {
      if (cachedSnapshot != null) {
        return cachedSnapshot;
      }
      rethrow;
    } on ApiException catch (_) {
      if (cachedSnapshot != null) {
        return cachedSnapshot;
      }
      rethrow;
    }
  }
}

final blogRepositoryProvider = Provider<BlogRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return BlogRepository(client, cache);
});
