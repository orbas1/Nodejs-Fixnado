import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/storefront_models.dart';

class StorefrontRepository {
  StorefrontRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _cacheKey = 'storefront:v1';

  Future<StorefrontFetchResult> fetchStorefront({bool bypassCache = false}) async {
    StorefrontSnapshot? cachedSnapshot;
    if (!bypassCache) {
      final cached = _cache.readJson(_cacheKey);
      if (cached != null) {
        final value = Map<String, dynamic>.from(cached['value'] as Map);
        cachedSnapshot = StorefrontSnapshot.fromJson(value);
        final cachedAt = cached['updatedAt'] != null ? DateTime.tryParse(cached['updatedAt'] as String) : null;
        if (cachedAt != null) {
          cachedSnapshot = cachedSnapshot.copyWith(generatedAt: cachedAt);
        }
      }
    }

    try {
      final snapshot = await _loadRemote();
      await _cache.writeJson(_cacheKey, snapshot.toJson());
      return StorefrontFetchResult(snapshot: snapshot, offline: false);
    } on TimeoutException catch (_) {
      if (cachedSnapshot != null) {
        return StorefrontFetchResult(snapshot: cachedSnapshot, offline: true);
      }
      rethrow;
    } on ApiException catch (_) {
      if (cachedSnapshot != null) {
        return StorefrontFetchResult(snapshot: cachedSnapshot, offline: true);
      }
      rethrow;
    }
  }

  Future<StorefrontSnapshot> _loadRemote() async {
    final payload = await _client.getJson(
      '/panel/provider/storefront',
      headers: const {'X-Fixnado-Role': 'company'},
    );
    final data = Map<String, dynamic>.from(payload['data'] as Map? ?? payload as Map? ?? {});
    final meta = Map<String, dynamic>.from(payload['meta'] as Map? ?? {});
    final snapshot = StorefrontSnapshot.fromJson({
      ...data,
      'generatedAt': meta['generatedAt']?.toString() ?? DateTime.now().toIso8601String(),
    });
    return snapshot.copyWith(
      generatedAt: DateTime.tryParse(meta['generatedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

final storefrontRepositoryProvider = Provider<StorefrontRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return StorefrontRepository(client, cache);
});
