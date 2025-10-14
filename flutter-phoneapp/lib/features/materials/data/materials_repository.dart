import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/materials_models.dart';

class MaterialsRepository {
  MaterialsRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _cacheKey = 'materialsShowcase:v1';

  Future<MaterialsShowcaseSnapshot> fetchShowcase({bool bypassCache = false}) async {
    MaterialsShowcaseSnapshot? cachedSnapshot;
    if (!bypassCache) {
      final cached = _cache.readJson(_cacheKey);
      if (cached != null) {
        try {
          final stored = Map<String, dynamic>.from(cached['value'] as Map);
          cachedSnapshot = MaterialsShowcaseSnapshot.fromJson(stored, offline: true);
        } catch (_) {
          cachedSnapshot = null;
        }
      }
    }

    try {
      final payload = await _client.getJson('/materials/showcase');
      final data = Map<String, dynamic>.from(payload['data'] as Map? ?? {});
      final meta = Map<String, dynamic>.from(payload['meta'] as Map? ?? {});
      final snapshot = MaterialsShowcaseSnapshot.fromJson(
        data,
        offline: meta['fallback'] == true || meta['source'] == 'fallback',
      );
      await _cache.writeJson(_cacheKey, snapshotToCacheJson(snapshot));
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

  Map<String, dynamic> snapshotToCacheJson(MaterialsShowcaseSnapshot snapshot) {
    return {
      'generatedAt': snapshot.generatedAt.toIso8601String(),
      'hero': {
        'title': snapshot.hero.title,
        'subtitle': snapshot.hero.subtitle,
        'metrics': snapshot.hero.metrics
            .map((metric) => {'id': metric.id, 'label': metric.label, 'value': metric.value, 'unit': metric.unit})
            .toList(),
        'actions': snapshot.hero.actions
            .map((action) => {'id': action.id, 'label': action.label, 'href': action.href})
            .toList(),
      },
      'stats': {
        'totalSkus': snapshot.stats.totalSkus,
        'totalOnHand': snapshot.stats.totalOnHand,
        'valueOnHand': snapshot.stats.valueOnHand,
        'alerts': snapshot.stats.alerts,
        'fillRate': snapshot.stats.fillRate,
        'replenishmentEta': snapshot.stats.replenishmentEta?.toIso8601String(),
      },
      'categories': snapshot.categories
          .map((category) => {
                'id': category.id,
                'name': category.name,
                'share': category.share,
                'safetyStockBreaches': category.safetyStockBreaches,
                'availability': category.availability,
              })
          .toList(),
      'inventory': snapshot.inventory
          .map((item) => {
                'id': item.id,
                'sku': item.sku,
                'name': item.name,
                'category': item.category,
                'unitType': item.unitType,
                'quantityOnHand': item.quantityOnHand,
                'quantityReserved': item.quantityReserved,
                'available': item.available,
                'unitCost': item.unitCost,
                'supplier': item.supplier,
                'leadTimeDays': item.leadTimeDays,
                'compliance': item.compliance,
                'nextArrival': item.nextArrival?.toIso8601String(),
                'alerts': item.alerts
                    .map((alert) => {
                          'id': alert.id,
                          'type': alert.type,
                          'severity': alert.severity,
                          'status': alert.status,
                          'triggeredAt': alert.triggeredAt?.toIso8601String(),
                        })
                    .toList(),
              })
          .toList(),
      'featured': snapshot.featured
          .map((item) => {
                'id': item.id,
                'sku': item.sku,
                'name': item.name,
                'category': item.category,
                'unitType': item.unitType,
                'quantityOnHand': item.quantityOnHand,
                'quantityReserved': item.quantityReserved,
                'available': item.available,
                'unitCost': item.unitCost,
                'supplier': item.supplier,
                'leadTimeDays': item.leadTimeDays,
                'compliance': item.compliance,
                'nextArrival': item.nextArrival?.toIso8601String(),
                'alerts': item.alerts
                    .map((alert) => {
                          'id': alert.id,
                          'type': alert.type,
                          'severity': alert.severity,
                          'status': alert.status,
                          'triggeredAt': alert.triggeredAt?.toIso8601String(),
                        })
                    .toList(),
              })
          .toList(),
      'collections': snapshot.collections
          .map((collection) => {
                'id': collection.id,
                'name': collection.name,
                'description': collection.description,
                'composition': collection.composition,
                'slaHours': collection.slaHours,
                'coverageZones': collection.coverageZones,
                'automation': collection.automation,
              })
          .toList(),
      'suppliers': snapshot.suppliers
          .map((supplier) => {
                'id': supplier.id,
                'name': supplier.name,
                'tier': supplier.tier,
                'leadTimeDays': supplier.leadTimeDays,
                'reliability': supplier.reliability,
                'annualSpend': supplier.annualSpend,
                'carbonScore': supplier.carbonScore,
              })
          .toList(),
      'logistics': snapshot.logistics
          .map((step) => {
                'id': step.id,
                'label': step.label,
                'status': step.status,
                'detail': step.detail,
                'eta': step.eta?.toIso8601String(),
              })
          .toList(),
      'insights': {
        'compliance': {
          'passingRate': snapshot.insights.compliance.passingRate,
          'upcomingAudits': snapshot.insights.compliance.upcomingAudits,
          'expiringCertifications': snapshot.insights.compliance.expiringCertifications
              .map((item) => {
                    'name': item.name,
                    'expiresAt': item.expiresAt?.toIso8601String(),
                  })
              .toList(),
        },
        'sustainability': {
          'recycledShare': snapshot.insights.sustainability.recycledShare,
          'co2SavingsTons': snapshot.insights.sustainability.co2SavingsTons,
          'initiatives': snapshot.insights.sustainability.initiatives,
        },
      },
    };
  }
}

final materialsRepositoryProvider = Provider<MaterialsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return MaterialsRepository(client, cache);
});
