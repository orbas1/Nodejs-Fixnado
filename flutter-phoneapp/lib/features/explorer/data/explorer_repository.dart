import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../../auth/domain/user_role.dart';
import '../domain/models.dart';

class ExplorerRepository {
  ExplorerRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _cacheKey(UserRole role) => 'explorer:v1:${role.name}';

  Future<ExplorerSnapshot> loadExplorer(UserRole role, ExplorerFilters filters, {bool bypassCache = false}) async {
    if (!bypassCache) {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        try {
          return ExplorerSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map));
        } catch (_) {
          // ignore corrupt cache and refetch.
        }
      }
    }

    try {
      final searchPayload = await _client.getJson('/search', query: {
        if ((filters.term ?? '').isNotEmpty) 'q': filters.term,
        if ((filters.serviceType ?? '').isNotEmpty) 'serviceType': filters.serviceType,
        if ((filters.category ?? '').isNotEmpty) 'category': filters.category,
        'limit': 20,
      });

      final zonePayload = await _client.getJson('/zones', query: {
        'includeAnalytics': 'true',
      });

      final services = (searchPayload['services'] as List<dynamic>? ?? [])
          .map((item) => ExplorerService.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      final items = (searchPayload['items'] as List<dynamic>? ?? [])
          .map((item) => ExplorerMarketplaceItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      final storefronts = (searchPayload['storefronts'] as List<dynamic>? ?? [])
          .map((item) => ExplorerStorefront.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      final businessFronts = (searchPayload['businessFronts'] as List<dynamic>? ?? [])
          .map((item) => ExplorerBusinessFront.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final zones = (zonePayload['data'] as List<dynamic>? ?? [])
          .map((item) => ZoneSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final snapshot = ExplorerSnapshot(
        services: services,
        items: items,
        storefronts: storefronts,
        businessFronts: businessFronts,
        zones: zones,
        filters: filters,
        generatedAt: DateTime.now(),
        offline: false,
      );

      await _cache.writeJson(_cacheKey(role), snapshot.toCacheJson());
      return snapshot;
    } on ApiException {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return ExplorerSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map)).copyWithOffline();
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return ExplorerSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map)).copyWithOffline();
      }
      rethrow;
    }
  }
}

extension on ExplorerSnapshot {
  ExplorerSnapshot copyWithOffline() {
    return ExplorerSnapshot(
      services: services,
      items: items,
      storefronts: storefronts,
      businessFronts: businessFronts,
      zones: zones,
      filters: filters,
      generatedAt: generatedAt,
      offline: true,
    );
  }
}

final explorerRepositoryProvider = Provider<ExplorerRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return ExplorerRepository(client, cache);
});
