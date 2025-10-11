class ExplorerService {
  ExplorerService({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.price,
    required this.currency,
    required this.companyName,
    required this.providerName,
  });

  final String id;
  final String title;
  final String? description;
  final String? category;
  final double? price;
  final String currency;
  final String? companyName;
  final String? providerName;

  factory ExplorerService.fromJson(Map<String, dynamic> json) {
    final provider = json['provider'] ?? json['Provider'];
    final company = json['Company'];
    return ExplorerService(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String?,
      price: _toDouble(json['price']),
      currency: (json['currency'] as String?) ?? 'USD',
      companyName: company is Map<String, dynamic> ? company['contactName'] as String? : null,
      providerName: provider is Map<String, dynamic>
          ? [provider['firstName'], provider['lastName']].whereType<String>().where((value) => value.isNotEmpty).join(' ')
          : null,
    );
  }
}

class ExplorerMarketplaceItem {
  ExplorerMarketplaceItem({
    required this.id,
    required this.title,
    required this.description,
    required this.availability,
    required this.location,
    required this.pricePerDay,
    required this.purchasePrice,
    required this.status,
    required this.insuredOnly,
  });

  final String id;
  final String title;
  final String? description;
  final String availability;
  final String? location;
  final double? pricePerDay;
  final double? purchasePrice;
  final String status;
  final bool insuredOnly;

  factory ExplorerMarketplaceItem.fromJson(Map<String, dynamic> json) {
    return ExplorerMarketplaceItem(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      availability: json['availability'] as String? ?? 'rent',
      location: json['location'] as String?,
      pricePerDay: _toDouble(json['pricePerDay']),
      purchasePrice: _toDouble(json['purchasePrice']),
      status: json['status'] as String? ?? 'pending_review',
      insuredOnly: (json['insuredOnly'] as bool?) ?? false,
    );
  }
}

class ZoneAnalyticsSummary {
  ZoneAnalyticsSummary({
    required this.zoneId,
    required this.capturedAt,
    required this.bookingTotals,
    required this.slaBreaches,
    required this.averageAcceptanceMinutes,
    required this.metadata,
  });

  final String zoneId;
  final DateTime capturedAt;
  final Map<String, dynamic> bookingTotals;
  final int slaBreaches;
  final double? averageAcceptanceMinutes;
  final Map<String, dynamic> metadata;

  factory ZoneAnalyticsSummary.fromJson(Map<String, dynamic> json) {
    return ZoneAnalyticsSummary(
      zoneId: json['zoneId'] as String,
      capturedAt: DateTime.parse(json['capturedAt'] as String),
      bookingTotals: Map<String, dynamic>.from(json['bookingTotals'] as Map),
      slaBreaches: json['slaBreaches'] as int? ?? 0,
      averageAcceptanceMinutes: _toDouble(json['averageAcceptanceMinutes']),
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
    );
  }
}

class ZoneSummary {
  ZoneSummary({
    required this.id,
    required this.name,
    required this.demandLevel,
    required this.metadata,
    required this.centroid,
    required this.boundingBox,
    required this.analytics,
  });

  final String id;
  final String name;
  final String demandLevel;
  final Map<String, dynamic> metadata;
  final Map<String, dynamic> centroid;
  final Map<String, dynamic> boundingBox;
  final ZoneAnalyticsSummary? analytics;

  factory ZoneSummary.fromJson(Map<String, dynamic> json) {
    if (json.containsKey('zone')) {
      final zone = json['zone'] as Map<String, dynamic>;
      return ZoneSummary(
        id: zone['id'] as String,
        name: zone['name'] as String,
        demandLevel: zone['demandLevel'] as String? ?? 'medium',
        metadata: Map<String, dynamic>.from(zone['metadata'] as Map? ?? {}),
        centroid: Map<String, dynamic>.from(zone['centroid'] as Map? ?? {}),
        boundingBox: Map<String, dynamic>.from(zone['boundingBox'] as Map? ?? {}),
        analytics: json['analytics'] == null
            ? null
            : ZoneAnalyticsSummary.fromJson(Map<String, dynamic>.from(json['analytics'] as Map)),
      );
    }

    return ZoneSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      demandLevel: json['demandLevel'] as String? ?? 'medium',
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
      centroid: Map<String, dynamic>.from(json['centroid'] as Map? ?? {}),
      boundingBox: Map<String, dynamic>.from(json['boundingBox'] as Map? ?? {}),
      analytics: json['analytics'] == null
          ? null
          : ZoneAnalyticsSummary.fromJson(Map<String, dynamic>.from(json['analytics'] as Map)),
    );
  }
}

class ExplorerSnapshot {
  ExplorerSnapshot({
    required this.services,
    required this.items,
    required this.zones,
    required this.filters,
    required this.generatedAt,
    required this.offline,
  });

  final List<ExplorerService> services;
  final List<ExplorerMarketplaceItem> items;
  final List<ZoneSummary> zones;
  final ExplorerFilters filters;
  final DateTime generatedAt;
  final bool offline;

  ExplorerSnapshot copyWith({
    List<ExplorerService>? services,
    List<ExplorerMarketplaceItem>? items,
    List<ZoneSummary>? zones,
    ExplorerFilters? filters,
    DateTime? generatedAt,
    bool? offline,
  }) {
    return ExplorerSnapshot(
      services: services ?? this.services,
      items: items ?? this.items,
      zones: zones ?? this.zones,
      filters: filters ?? this.filters,
      generatedAt: generatedAt ?? this.generatedAt,
      offline: offline ?? this.offline,
    );
  }

  Map<String, dynamic> toCacheJson() {
    return {
      'services': services.map((service) => _encode(service)).toList(),
      'items': items.map((item) => _encode(item)).toList(),
      'zones': zones.map((zone) => _encode(zone)).toList(),
      'filters': filters.toJson(),
      'generatedAt': generatedAt.toIso8601String(),
      'offline': offline,
    };
  }

  static ExplorerSnapshot fromCacheJson(Map<String, dynamic> json) {
    return ExplorerSnapshot(
      services: (json['services'] as List<dynamic>? ?? [])
          .map((item) => ExplorerService.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) => ExplorerMarketplaceItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      zones: (json['zones'] as List<dynamic>? ?? [])
          .map((item) => ZoneSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      filters: ExplorerFilters.fromJson(Map<String, dynamic>.from(json['filters'] as Map? ?? {})),
      generatedAt: DateTime.tryParse(json['generatedAt'] as String? ?? '') ?? DateTime.now(),
      offline: json['offline'] as bool? ?? false,
    );
  }
}

class ExplorerFilters {
  ExplorerFilters({
    this.term,
    this.zoneId,
    this.type = ExplorerResultType.all,
  });

  final String? term;
  final String? zoneId;
  final ExplorerResultType type;

  ExplorerFilters copyWith({
    String? term,
    String? zoneId,
    ExplorerResultType? type,
  }) {
    return ExplorerFilters(
      term: term ?? this.term,
      zoneId: zoneId ?? this.zoneId,
      type: type ?? this.type,
    );
  }

  Map<String, dynamic> toJson() => {
        'term': term,
        'zoneId': zoneId,
        'type': type.name,
      };

  static ExplorerFilters fromJson(Map<String, dynamic> json) {
    final typeName = json['type'] as String?;
    final type = ExplorerResultType.values.firstWhere(
      (value) => value.name == typeName,
      orElse: () => ExplorerResultType.all,
    );
    return ExplorerFilters(
      term: json['term'] as String?,
      zoneId: json['zoneId'] as String?,
      type: type,
    );
  }
}

enum ExplorerResultType { services, marketplace, all }

double? _toDouble(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}

Map<String, dynamic> _encode(Object value) {
  if (value is ExplorerService) {
    return {
      'id': value.id,
      'title': value.title,
      'description': value.description,
      'category': value.category,
      'price': value.price,
      'currency': value.currency,
      'companyName': value.companyName,
      'providerName': value.providerName,
    };
  }
  if (value is ExplorerMarketplaceItem) {
    return {
      'id': value.id,
      'title': value.title,
      'description': value.description,
      'availability': value.availability,
      'location': value.location,
      'pricePerDay': value.pricePerDay,
      'purchasePrice': value.purchasePrice,
      'status': value.status,
      'insuredOnly': value.insuredOnly,
    };
  }
  if (value is ZoneSummary) {
    return {
      'id': value.id,
      'name': value.name,
      'demandLevel': value.demandLevel,
      'metadata': value.metadata,
      'centroid': value.centroid,
      'boundingBox': value.boundingBox,
      'analytics': value.analytics == null
          ? null
          : {
              'zoneId': value.analytics!.zoneId,
              'capturedAt': value.analytics!.capturedAt.toIso8601String(),
              'bookingTotals': value.analytics!.bookingTotals,
              'slaBreaches': value.analytics!.slaBreaches,
              'averageAcceptanceMinutes': value.analytics!.averageAcceptanceMinutes,
              'metadata': value.analytics!.metadata,
            },
    };
  }
  throw UnsupportedError('Unsupported value for encoding: ${value.runtimeType}');
}
