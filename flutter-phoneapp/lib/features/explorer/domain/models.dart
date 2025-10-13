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

class ExplorerStorefront {
  ExplorerStorefront({
    required this.id,
    required this.name,
    required this.slug,
    this.summary,
    this.primaryCategory,
    this.heroImage,
    this.rating,
    this.badges = const [],
    this.coverageAreas = const [],
    this.tags = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String? summary;
  final String? primaryCategory;
  final String? heroImage;
  final double? rating;
  final List<String> badges;
  final List<String> coverageAreas;
  final List<String> tags;

  factory ExplorerStorefront.fromJson(Map<String, dynamic> json) {
    final hero = json['hero'];
    final media = json['media'];
    final metadata = json['metadata'];
    final id = json['id'] ?? json['slug'] ?? json['companyId'] ?? json['businessId'] ?? '';
    final slug = json['slug'] ?? json['id'] ?? id;

    final coverageSources = [
      json['coverage'],
      json['coverageAreas'],
      json['zones'],
      hero is Map<String, dynamic> ? hero['locations'] : null,
      metadata is Map<String, dynamic> ? metadata['coverage'] : null,
    ];
    final tagSources = [
      json['tags'],
      hero is Map<String, dynamic> ? hero['tags'] : null,
    ];
    final badgeSources = [
      json['badges'],
      metadata is Map<String, dynamic> ? metadata['badges'] : null,
    ];

    String? resolveSummary() {
      if (json['summary'] is String) return json['summary'] as String;
      if (json['description'] is String) return json['description'] as String;
      if (hero is Map<String, dynamic> && hero['strapline'] is String) {
        return hero['strapline'] as String;
      }
      if (hero is Map<String, dynamic> && hero['bio'] is String) {
        return hero['bio'] as String;
      }
      return null;
    }

    String? resolvePrimaryCategory() {
      if (json['primaryCategory'] is String) return json['primaryCategory'] as String;
      final categories = json['categories'];
      if (categories is List && categories.isNotEmpty) {
        return categories.first.toString();
      }
      if (hero is Map<String, dynamic>) {
        final heroCategories = hero['categories'];
        if (heroCategories is List && heroCategories.isNotEmpty) {
          return heroCategories.first.toString();
        }
      }
      return null;
    }

    String? resolveHeroImage() {
      if (json['heroImage'] is String) return json['heroImage'] as String;
      if (media is Map<String, dynamic> && media['heroImage'] is String) {
        return media['heroImage'] as String;
      }
      if (hero is Map<String, dynamic> && hero['heroImage'] is String) {
        return hero['heroImage'] as String;
      }
      return null;
    }

    return ExplorerStorefront(
      id: id.toString(),
      name: (json['name'] ?? (hero is Map<String, dynamic> ? hero['name'] : null) ?? json['title'] ?? 'Storefront')
          .toString(),
      slug: slug.toString(),
      summary: resolveSummary(),
      primaryCategory: resolvePrimaryCategory(),
      heroImage: resolveHeroImage(),
      rating: _toDouble(json['rating'] ?? json['score'] ?? (metadata is Map<String, dynamic> ? metadata['rating'] : null)),
      badges: _toStringList(badgeSources.firstWhere((value) => value != null, orElse: () => null)),
      coverageAreas: _toStringList(coverageSources.firstWhere((value) => value != null, orElse: () => null)),
      tags: _toStringList(tagSources.firstWhere((value) => value != null, orElse: () => null)),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'summary': summary,
      'primaryCategory': primaryCategory,
      'heroImage': heroImage,
      'rating': rating,
      'badges': badges,
      'coverageAreas': coverageAreas,
      'tags': tags,
    };
  }
}

class ExplorerBusinessFrontMetric {
  ExplorerBusinessFrontMetric({
    required this.id,
    required this.label,
    required this.value,
    this.caption,
    this.format,
  });

  final String id;
  final String label;
  final String value;
  final String? caption;
  final String? format;

  factory ExplorerBusinessFrontMetric.fromJson(Map<String, dynamic> json) {
    return ExplorerBusinessFrontMetric(
      id: (json['id'] ?? json['label'] ?? json['name'] ?? '').toString(),
      label: (json['label'] ?? json['name'] ?? 'Metric').toString(),
      value: json['value'] == null ? '' : json['value'].toString(),
      caption: json['caption'] as String?,
      format: json['format'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'value': value,
      'caption': caption,
      'format': format,
    };
  }
}

class ExplorerBusinessFront {
  ExplorerBusinessFront({
    required this.id,
    required this.name,
    required this.slug,
    this.tagline,
    this.summary,
    this.heroImage,
    this.categories = const [],
    this.coverageAreas = const [],
    this.metrics = const [],
    this.score,
  });

  final String id;
  final String name;
  final String slug;
  final String? tagline;
  final String? summary;
  final String? heroImage;
  final List<String> categories;
  final List<String> coverageAreas;
  final List<ExplorerBusinessFrontMetric> metrics;
  final double? score;

  factory ExplorerBusinessFront.fromJson(Map<String, dynamic> json) {
    final hero = json['hero'];
    final metadata = json['metadata'];
    final stats = json['stats'];
    final id = json['id'] ?? json['slug'] ?? json['businessId'] ?? '';
    final slug = json['slug'] ?? json['id'] ?? id;

    String? resolveSummary() {
      if (json['summary'] is String) return json['summary'] as String;
      if (json['description'] is String) return json['description'] as String;
      if (hero is Map<String, dynamic> && hero['bio'] is String) {
        return hero['bio'] as String;
      }
      return null;
    }

    final categorySources = [
      json['categories'],
      json['category'],
      hero is Map<String, dynamic> ? hero['categories'] : null,
      metadata is Map<String, dynamic> ? metadata['categories'] : null,
    ];

    final coverageSources = [
      json['coverage'],
      json['locations'],
      json['serviceZones'],
      hero is Map<String, dynamic> ? hero['locations'] : null,
      metadata is Map<String, dynamic> ? metadata['coverage'] : null,
    ];

    final metricEntries = <ExplorerBusinessFrontMetric>[];
    if (stats is List) {
      for (final entry in stats) {
        if (entry is Map<String, dynamic>) {
          metricEntries.add(ExplorerBusinessFrontMetric.fromJson(entry));
        } else if (entry is Map) {
          metricEntries.add(ExplorerBusinessFrontMetric.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    return ExplorerBusinessFront(
      id: id.toString(),
      name: (json['name'] ?? (hero is Map<String, dynamic> ? hero['name'] : null) ?? 'Business front').toString(),
      slug: slug.toString(),
      tagline: (json['tagline'] ?? (hero is Map<String, dynamic> ? hero['tagline'] : null)) as String?,
      summary: resolveSummary(),
      heroImage: (json['heroImage'] ?? (hero is Map<String, dynamic> ? hero['heroImage'] : null)) as String?,
      categories: _toStringList(categorySources.firstWhere((value) => value != null, orElse: () => null)),
      coverageAreas: _toStringList(coverageSources.firstWhere((value) => value != null, orElse: () => null)),
      metrics: List.unmodifiable(metricEntries),
      score: _toDouble(json['score'] ?? json['rating'] ?? (metadata is Map<String, dynamic> ? metadata['score'] : null)),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'tagline': tagline,
      'summary': summary,
      'heroImage': heroImage,
      'categories': categories,
      'coverageAreas': coverageAreas,
      'metrics': metrics.map((metric) => metric.toJson()).toList(),
      'score': score,
    };
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
    required this.storefronts,
    required this.businessFronts,
    required this.zones,
    required this.filters,
    required this.generatedAt,
    required this.offline,
  });

  final List<ExplorerService> services;
  final List<ExplorerMarketplaceItem> items;
  final List<ExplorerStorefront> storefronts;
  final List<ExplorerBusinessFront> businessFronts;
  final List<ZoneSummary> zones;
  final ExplorerFilters filters;
  final DateTime generatedAt;
  final bool offline;

  ExplorerSnapshot copyWith({
    List<ExplorerService>? services,
    List<ExplorerMarketplaceItem>? items,
    List<ExplorerStorefront>? storefronts,
    List<ExplorerBusinessFront>? businessFronts,
    List<ZoneSummary>? zones,
    ExplorerFilters? filters,
    DateTime? generatedAt,
    bool? offline,
  }) {
    return ExplorerSnapshot(
      services: services ?? this.services,
      items: items ?? this.items,
      storefronts: storefronts ?? this.storefronts,
      businessFronts: businessFronts ?? this.businessFronts,
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
      'storefronts': storefronts.map((storefront) => _encode(storefront)).toList(),
      'businessFronts': businessFronts.map((front) => _encode(front)).toList(),
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
      storefronts: (json['storefronts'] as List<dynamic>? ?? [])
          .map((item) => ExplorerStorefront.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      businessFronts: (json['businessFronts'] as List<dynamic>? ?? [])
          .map((item) => ExplorerBusinessFront.fromJson(Map<String, dynamic>.from(item as Map)))
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

enum ExplorerResultType { services, marketplace, storefronts, businessFronts, all }

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

List<String> _toStringList(dynamic source) {
  if (source == null) {
    return const [];
  }

  final result = <String>[];

  if (source is List) {
    for (final element in source) {
      if (element == null) {
        continue;
      }
      final text = element.toString().trim();
      if (text.isNotEmpty) {
        result.add(text);
      }
    }
  } else if (source is String) {
    for (final part in source.split(',')) {
      final text = part.trim();
      if (text.isNotEmpty) {
        result.add(text);
      }
    }
  } else {
    final text = source.toString().trim();
    if (text.isNotEmpty) {
      result.add(text);
    }
  }

  return List.unmodifiable(result);
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
  if (value is ExplorerStorefront) {
    return value.toJson();
  }
  if (value is ExplorerBusinessFront) {
    return value.toJson();
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
