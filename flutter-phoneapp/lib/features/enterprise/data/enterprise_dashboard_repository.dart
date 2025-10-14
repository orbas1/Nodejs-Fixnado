import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/enterprise_dashboard_models.dart';

class EnterpriseDashboardRepository {
  EnterpriseDashboardRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _cacheKey = 'enterprise-dashboard:v1';

  Future<EnterpriseDashboardSnapshot> load({bool bypassCache = false, String? timezone}) async {
    if (!bypassCache) {
      final cached = _cache.readJson(_cacheKey);
      if (cached != null) {
        try {
          final snapshot = EnterpriseDashboardSnapshot.fromCacheJson(_asMap(cached['value']));
          return snapshot.copyWith(offline: false);
        } catch (_) {
          // ignore corrupt cache
        }
      }
    }

    try {
      final payload = await _client.getJson('/panel/enterprise/overview', query: {
        if (timezone != null) 'timezone': timezone,
      });
      final data = _asMap(payload['data']);
      final meta = _asMap(payload['meta']);
      final snapshot = EnterpriseDashboardSnapshot.fromJson(data, meta);
      await _cache.writeJson(_cacheKey, snapshot.toCacheJson());
      return snapshot;
    } on ApiException catch (_) {
      final cached = _cache.readJson(_cacheKey);
      if (cached != null) {
        return EnterpriseDashboardSnapshot.fromCacheJson(_asMap(cached['value'])).copyWith(
          offline: true,
          fallback: true,
        );
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey);
      if (cached != null) {
        return EnterpriseDashboardSnapshot.fromCacheJson(_asMap(cached['value'])).copyWith(
          offline: true,
          fallback: true,
        );
      }
      rethrow;
    }
  }
}

final enterpriseDashboardRepositoryProvider = Provider<EnterpriseDashboardRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return EnterpriseDashboardRepository(client, cache);
});

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, dynamic v) => MapEntry(key?.toString() ?? '', v));
  }
  return <String, dynamic>{};
}
