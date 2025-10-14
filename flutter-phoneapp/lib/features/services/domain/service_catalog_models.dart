class ServiceCatalogueEntry {
  ServiceCatalogueEntry({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.categorySlug,
    required this.type,
    required this.price,
    required this.currency,
    required this.availability,
    required this.tags,
    required this.coverage,
    this.provider,
    this.providerId,
  });

  final String id;
  final String name;
  final String description;
  final String category;
  final String categorySlug;
  final String type;
  final double? price;
  final String currency;
  final ServiceAvailability availability;
  final List<String> tags;
  final List<String> coverage;
  final String? provider;
  final String? providerId;

  factory ServiceCatalogueEntry.fromJson(Map<String, dynamic> json) {
    final availability = json['availability'] as Map<String, dynamic>?;
    return ServiceCatalogueEntry(
      id: json['id']?.toString() ?? json['slug']?.toString() ?? 'service',
      name: json['name']?.toString() ?? json['title']?.toString() ?? 'Service',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Services',
      categorySlug: json['categorySlug']?.toString() ?? json['category']?.toString() ?? 'services',
      type: json['type']?.toString() ?? 'general-services',
      price: _toDouble(json['price']),
      currency: json['currency']?.toString() ?? 'GBP',
      availability: ServiceAvailability.fromJson(availability ?? const {}),
      tags: _ensureStringList(json['tags']),
      coverage: _ensureStringList(json['coverage']),
      provider: json['provider']?.toString(),
      providerId: json['providerId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'categorySlug': categorySlug,
      'type': type,
      'price': price,
      'currency': currency,
      'availability': availability.toJson(),
      'tags': tags,
      'coverage': coverage,
      'provider': provider,
      'providerId': providerId,
    };
  }
}

class ServiceAvailability {
  ServiceAvailability({
    required this.status,
    required this.label,
    required this.detail,
  });

  factory ServiceAvailability.fromJson(Map<String, dynamic> json) {
    return ServiceAvailability(
      status: json['status']?.toString() ?? 'open',
      label: json['label']?.toString() ?? 'Availability',
      detail: json['detail']?.toString(),
    );
  }

  final String status;
  final String label;
  final String? detail;

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'label': label,
      'detail': detail,
    };
  }
}

class ServiceHealthMetric {
  ServiceHealthMetric({
    required this.id,
    required this.label,
    required this.value,
    required this.format,
    this.caption,
    this.target,
  });

  final String id;
  final String label;
  final double value;
  final String format;
  final String? caption;
  final double? target;

  factory ServiceHealthMetric.fromJson(Map<String, dynamic> json) {
    return ServiceHealthMetric(
      id: json['id']?.toString() ?? json['key']?.toString() ?? 'metric',
      label: json['label']?.toString() ?? 'Metric',
      value: _toDouble(json['value']) ?? _toDouble(json['score']) ?? 0,
      format: json['format']?.toString() ?? json['type']?.toString() ?? 'number',
      caption: json['caption']?.toString(),
      target: _toDouble(json['target']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'value': value,
      'format': format,
      'caption': caption,
      'target': target,
    };
  }
}

class ServiceDeliveryItem {
  ServiceDeliveryItem({
    required this.id,
    required this.name,
    required this.client,
    this.zone,
    this.eta,
    this.owner,
    this.risk,
    this.services = const [],
    this.value,
    this.currency,
  });

  final String id;
  final String name;
  final String client;
  final String? zone;
  final DateTime? eta;
  final String? owner;
  final String? risk;
  final List<String> services;
  final double? value;
  final String? currency;

  factory ServiceDeliveryItem.fromJson(Map<String, dynamic> json) {
    return ServiceDeliveryItem(
      id: json['id']?.toString() ?? json['key']?.toString() ?? 'delivery-item',
      name: json['name']?.toString() ?? json['title']?.toString() ?? 'Engagement',
      client: json['client']?.toString() ?? json['account']?.toString() ?? 'Client',
      zone: json['zone']?.toString() ?? json['region']?.toString(),
      eta: _parseDateTime(json['eta'] ?? json['due'] ?? json['scheduledFor']),
      owner: json['owner']?.toString() ?? json['manager']?.toString(),
      risk: json['risk']?.toString() ?? json['status']?.toString(),
      services: _ensureStringList(json['services'] ?? json['serviceMix']),
      value: _toDouble(json['value'] ?? json['contractValue']),
      currency: json['currency']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'client': client,
      'zone': zone,
      'eta': eta?.toIso8601String(),
      'owner': owner,
      'risk': risk,
      'services': services,
      'value': value,
      'currency': currency,
    };
  }
}

class ServiceDeliveryColumn {
  ServiceDeliveryColumn({
    required this.id,
    required this.title,
    required this.items,
    this.description,
  });

  final String id;
  final String title;
  final String? description;
  final List<ServiceDeliveryItem> items;

  factory ServiceDeliveryColumn.fromJson(Map<String, dynamic> json) {
    return ServiceDeliveryColumn(
      id: json['id']?.toString() ?? json['key']?.toString() ?? 'column',
      title: json['title']?.toString() ?? json['name']?.toString() ?? 'Stage',
      description: json['description']?.toString(),
      items: (json['items'] as List<dynamic>? ?? const [])
          .map((item) => ServiceDeliveryItem.fromJson(_asMap(item)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

class ServicePackage {
  ServicePackage({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.currency,
    required this.highlights,
    this.serviceId,
    this.serviceName,
    this.serviceCategorySlug,
    this.serviceType,
  });

  final String id;
  final String name;
  final String description;
  final double? price;
  final String currency;
  final List<String> highlights;
  final String? serviceId;
  final String? serviceName;
  final String? serviceCategorySlug;
  final String? serviceType;

  factory ServicePackage.fromJson(Map<String, dynamic> json, {ServiceCatalogueEntry? serviceReference}) {
    return ServicePackage(
      id: json['id']?.toString() ?? json['name']?.toString() ?? 'package',
      name: json['name']?.toString() ?? 'Service package',
      description: json['description']?.toString() ?? '',
      price: _toDouble(json['price']),
      currency: json['currency']?.toString() ?? 'GBP',
      highlights: _ensureStringList(json['highlights']),
      serviceId: serviceReference?.id,
      serviceName: serviceReference?.name,
      serviceCategorySlug: serviceReference?.categorySlug,
      serviceType: serviceReference?.type,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'currency': currency,
      'highlights': highlights,
      'serviceId': serviceId,
      'serviceName': serviceName,
      'serviceCategorySlug': serviceCategorySlug,
      'serviceType': serviceType,
    };
  }
}

class ServiceCategory {
  ServiceCategory({
    required this.slug,
    required this.label,
    required this.type,
    required this.defaultTags,
  });

  final String slug;
  final String label;
  final String type;
  final List<String> defaultTags;

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      slug: json['slug']?.toString() ?? json['value']?.toString() ?? 'category',
      label: json['label']?.toString() ?? 'Service category',
      type: json['type']?.toString() ?? 'general-services',
      defaultTags: _ensureStringList(json['defaultTags']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slug': slug,
      'label': label,
      'type': type,
      'defaultTags': defaultTags,
    };
  }
}

class ServiceTypeDefinition {
  ServiceTypeDefinition({
    required this.type,
    required this.label,
    required this.description,
    required this.categories,
  });

  final String type;
  final String label;
  final String description;
  final List<String> categories;

  factory ServiceTypeDefinition.fromJson(Map<String, dynamic> json) {
    return ServiceTypeDefinition(
      type: json['type']?.toString() ?? json['id']?.toString() ?? 'general-services',
      label: json['label']?.toString() ?? 'Service type',
      description: json['description']?.toString() ?? '',
      categories: _ensureStringList(json['categories']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'label': label,
      'description': description,
      'categories': categories,
    };
  }
}

class ServiceCatalogSnapshot {
  ServiceCatalogSnapshot({
    required this.packages,
    required this.categories,
    required this.types,
    required this.catalogue,
    required this.healthMetrics,
    required this.deliveryBoard,
    required this.generatedAt,
    required this.offline,
  });

  final List<ServicePackage> packages;
  final List<ServiceCategory> categories;
  final List<ServiceTypeDefinition> types;
  final List<ServiceCatalogueEntry> catalogue;
  final List<ServiceHealthMetric> healthMetrics;
  final List<ServiceDeliveryColumn> deliveryBoard;
  final DateTime generatedAt;
  final bool offline;

  Map<String, dynamic> toCacheJson() {
    return {
      'packages': packages.map((value) => value.toJson()).toList(),
      'categories': categories.map((value) => value.toJson()).toList(),
      'types': types.map((value) => value.toJson()).toList(),
      'catalogue': catalogue.map((value) => value.toJson()).toList(),
      'healthMetrics': healthMetrics.map((value) => value.toJson()).toList(),
      'deliveryBoard': deliveryBoard.map((value) => value.toJson()).toList(),
      'generatedAt': generatedAt.toIso8601String(),
      'offline': offline,
    };
  }

  factory ServiceCatalogSnapshot.fromCacheJson(Map<String, dynamic> json) {
    return ServiceCatalogSnapshot(
      packages: (json['packages'] as List<dynamic>? ?? const [])
          .map((item) => ServicePackage.fromJson(_asMap(item)))
          .toList(),
      categories: (json['categories'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCategory.fromJson(_asMap(item)))
          .toList(),
      types: (json['types'] as List<dynamic>? ?? const [])
          .map((item) => ServiceTypeDefinition.fromJson(_asMap(item)))
          .toList(),
      catalogue: (json['catalogue'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCatalogueEntry.fromJson(_asMap(item)))
          .toList(),
      healthMetrics: (json['healthMetrics'] as List<dynamic>? ?? const [])
          .map((item) => ServiceHealthMetric.fromJson(_asMap(item)))
          .toList(),
      deliveryBoard: (json['deliveryBoard'] as List<dynamic>? ?? const [])
          .map((item) => ServiceDeliveryColumn.fromJson(_asMap(item)))
          .toList(),
      generatedAt: DateTime.tryParse(json['generatedAt']?.toString() ?? '') ?? DateTime.now(),
      offline: json['offline'] as bool? ?? false,
    );
  }

  ServiceCatalogSnapshot copyWith({
    List<ServicePackage>? packages,
    List<ServiceCategory>? categories,
    List<ServiceTypeDefinition>? types,
    List<ServiceCatalogueEntry>? catalogue,
    List<ServiceHealthMetric>? healthMetrics,
    List<ServiceDeliveryColumn>? deliveryBoard,
    DateTime? generatedAt,
    bool? offline,
  }) {
    return ServiceCatalogSnapshot(
      packages: packages ?? this.packages,
      categories: categories ?? this.categories,
      types: types ?? this.types,
      catalogue: catalogue ?? this.catalogue,
      healthMetrics: healthMetrics ?? this.healthMetrics,
      deliveryBoard: deliveryBoard ?? this.deliveryBoard,
      generatedAt: generatedAt ?? this.generatedAt,
      offline: offline ?? this.offline,
    );
  }
}

List<String> _ensureStringList(dynamic value) {
  if (value is List) {
    return value.map((entry) => entry?.toString() ?? '').where((entry) => entry.isNotEmpty).toList();
  }
  if (value is String && value.isNotEmpty) {
    return [value];
  }
  return const [];
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, dynamic v) => MapEntry(key?.toString() ?? '', v));
  }
  return <String, dynamic>{};
}

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

DateTime? _parseDateTime(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is DateTime) {
    return value;
  }
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}
