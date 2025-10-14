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
          return ServiceCatalogSnapshot.fromCacheJson(_asMap(cached['value']));
        } catch (_) {
          // ignore corrupt cache
        }
      }
    }

    try {
      final payload = await _client.getJson('/business-fronts/$slug');
      final data = _asMap(payload['data']);
      final meta = _asMap(payload['meta']);

      final catalogue = (data['serviceCatalogue'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCatalogueEntry.fromJson(_asMap(item)))
          .toList();

      final serviceById = {for (final service in catalogue) service.id: service};

      final bannerStyles = (data['bannerStyles'] as List<dynamic>? ?? const [])
          .map((item) => BannerStyleOption.fromJson(_asMap(item)))
          .toList();

      final packages = (data['packages'] as List<dynamic>? ?? const [])
          .map((item) {
            final json = _asMap(item);
            final reference = serviceById[json['id']?.toString() ?? json['serviceId']?.toString() ?? ''];
            return ServicePackage.fromJson(json, serviceReference: reference);
          })
          .toList();

      final taxonomy = _asMap(data['taxonomy']);
      final reviews = (data['reviews'] as List<dynamic>? ?? const [])
          .map((item) => BusinessReview.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final reviewSummary = data['reviewSummary'] is Map
          ? BusinessReviewSummary.fromJson(Map<String, dynamic>.from(data['reviewSummary'] as Map))
          : null;

      final reviewAccess = meta['reviewAccess'] is Map
          ? ReviewAccessControl.fromJson(Map<String, dynamic>.from(meta['reviewAccess'] as Map))
          : null;

      final taxonomy = Map<String, dynamic>.from(data['taxonomy'] as Map? ?? {});
      final categories = (taxonomy['categories'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCategory.fromJson(_asMap(item)))
          .toList();
      final types = (taxonomy['types'] as List<dynamic>? ?? const [])
          .map((item) => ServiceTypeDefinition.fromJson(_asMap(item)))
          .toList();

      final delivery = _asMap(data['serviceDelivery']);
      final healthMetrics = (delivery['health'] as List<dynamic>? ?? data['serviceHealth'] as List<dynamic>? ?? const [])
          .map((item) => ServiceHealthMetric.fromJson(_asMap(item)))
          .toList();
      final deliveryBoard = (delivery['board'] as List<dynamic>? ?? data['serviceDeliveryBoard'] as List<dynamic>? ?? const [])
          .map((item) => ServiceDeliveryColumn.fromJson(_asMap(item)))
          .toList();

      final snapshot = ServiceCatalogSnapshot(
        packages: packages,
        categories: categories,
        types: types,
        catalogue: catalogue,
        healthMetrics: healthMetrics,
        deliveryBoard: deliveryBoard,
        reviews: reviews,
        bannerStyles: bannerStyles,
        reviewSummary: reviewSummary,
        reviewAccess: reviewAccess,
        generatedAt: DateTime.tryParse(meta['generatedAt']?.toString() ?? '') ?? DateTime.now(),
        offline: false,
      );

      await _cache.writeJson(_cacheKey(slug), snapshot.toCacheJson());
      return snapshot;
    } on ApiException {
      final cached = _cache.readJson(_cacheKey(slug));
      if (cached != null) {
        return ServiceCatalogSnapshot.fromCacheJson(_asMap(cached['value'])).copyWith(offline: true);
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey(slug));
      if (cached != null) {
        return ServiceCatalogSnapshot.fromCacheJson(_asMap(cached['value'])).copyWith(offline: true);
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

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, dynamic v) => MapEntry(key?.toString() ?? '', v));
  }
  return <String, dynamic>{};
}
