import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/service_catalog_models.dart';

class ServiceCatalogRepository {
  ServiceCatalogRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _cacheKey(String slug) => 'serviceCatalog:v1:$slug';

  Future<ServiceCatalogSnapshot> loadBusinessFront({String slug = 'featured', bool bypassCache = false}) async {
    if (!bypassCache) {
      final cached = _cache.readJson(_cacheKey(slug));
      if (cached != null) {
        try {
          return ServiceCatalogSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map));
        } catch (_) {
          // ignore corrupt cache
        }
      }
    }

    try {
      final payload = await _client.getJson('/business-fronts/$slug');
      final data = Map<String, dynamic>.from(payload['data'] as Map? ?? {});
      final meta = Map<String, dynamic>.from(payload['meta'] as Map? ?? {});

      final catalogue = (data['serviceCatalogue'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCatalogueEntry.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final serviceById = {for (final service in catalogue) service.id: service};

      final packages = (data['packages'] as List<dynamic>? ?? const [])
          .map((item) {
            final json = Map<String, dynamic>.from(item as Map);
            final reference = serviceById[json['id']?.toString() ?? json['serviceId']?.toString() ?? ''];
            return ServicePackage.fromJson(json, serviceReference: reference);
          })
          .toList();

      final taxonomy = Map<String, dynamic>.from(data['taxonomy'] as Map? ?? {});
      final categories = (taxonomy['categories'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCategory.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      final types = (taxonomy['types'] as List<dynamic>? ?? const [])
          .map((item) => ServiceTypeDefinition.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final snapshot = ServiceCatalogSnapshot(
        packages: packages,
        categories: categories,
        types: types,
        catalogue: catalogue,
        generatedAt: DateTime.tryParse(meta['generatedAt']?.toString() ?? '') ?? DateTime.now(),
        offline: false,
      );

      await _cache.writeJson(_cacheKey(slug), snapshot.toCacheJson());
      return snapshot;
    } on ApiException {
      final cached = _cache.readJson(_cacheKey(slug));
      if (cached != null) {
        return ServiceCatalogSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map)).copyWith(offline: true);
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey(slug));
      if (cached != null) {
        return ServiceCatalogSnapshot.fromCacheJson(Map<String, dynamic>.from(cached['value'] as Map)).copyWith(offline: true);
      }
      rethrow;
    }
  }
}

final serviceCatalogRepositoryProvider = Provider<ServiceCatalogRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return ServiceCatalogRepository(client, cache);
});
