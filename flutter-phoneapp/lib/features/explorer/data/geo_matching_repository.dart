import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../domain/models.dart';

class GeoMatchingRepository {
  GeoMatchingRepository(this._client);

  final FixnadoApiClient _client;

  Future<GeoMatchResult> match(GeoMatchRequest request) async {
    try {
      final payload = await _client.postJson('/zones/match', body: request.toJson());
      return GeoMatchResult.fromJson(payload);
    } on ApiException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> previewCoverage(GeoMatchRequest request) async {
    final query = {
      'latitude': request.latitude,
      'longitude': request.longitude,
      if (request.radiusKm != null) 'radiusKm': request.radiusKm,
    };
    final payload = await _client.getJson('/zones/coverage/preview', query: query);
    return Map<String, dynamic>.from(payload['geometry'] as Map? ?? {});
  }

  Future<Map<String, dynamic>> createZone(GeoZoneDraft draft) async {
    final payload = await _client.postJson('/zones', body: draft.toJson());
    return Map<String, dynamic>.from(payload);
  }
}

class GeoMatchRequest {
  GeoMatchRequest({
    required this.latitude,
    required this.longitude,
    this.radiusKm,
    this.limit,
    this.demandLevels = const ['high', 'medium', 'low'],
    this.categories = const <String>[],
  });

  final double latitude;
  final double longitude;
  final double? radiusKm;
  final int? limit;
  final List<String> demandLevels;
  final List<String> categories;

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      if (radiusKm != null) 'radiusKm': radiusKm,
      if (limit != null) 'limit': limit,
      if (demandLevels.isNotEmpty) 'demandLevels': demandLevels,
      if (categories.isNotEmpty) 'categories': categories,
    };
  }
}

class GeoZoneDraft {
  GeoZoneDraft({
    required this.name,
    required this.companyId,
    required this.demandLevel,
    required this.coordinates,
    this.tags = const <String>[],
    this.notes,
  });

  final String name;
  final String companyId;
  final String demandLevel;
  final List<List<double>> coordinates;
  final List<String> tags;
  final String? notes;

  Map<String, dynamic> toJson() {
    final ring = [...coordinates];
    if (ring.length >= 3) {
      final first = ring.first;
      final last = ring.last;
      if (first[0] != last[0] || first[1] != last[1]) {
        ring.add([first[0], first[1]]);
      }
    }

    return {
      'name': name,
      'companyId': companyId,
      'demandLevel': demandLevel,
      'geometry': {
        'type': 'Polygon',
        'coordinates': [ring.map((pair) => [pair[1], pair[0]]).toList()],
      },
      'metadata': {
        if (tags.isNotEmpty) 'tags': tags,
        if (notes != null && notes!.isNotEmpty) 'notes': notes,
        'source': 'mobile-zone-builder',
      },
    };
  }
}

final geoMatchingRepositoryProvider = Provider<GeoMatchingRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return GeoMatchingRepository(client);
});
