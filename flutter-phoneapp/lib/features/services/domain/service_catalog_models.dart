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
    required this.generatedAt,
    required this.offline,
  });

  final List<ServicePackage> packages;
  final List<ServiceCategory> categories;
  final List<ServiceTypeDefinition> types;
  final List<ServiceCatalogueEntry> catalogue;
  final DateTime generatedAt;
  final bool offline;

  Map<String, dynamic> toCacheJson() {
    return {
      'packages': packages.map((value) => value.toJson()).toList(),
      'categories': categories.map((value) => value.toJson()).toList(),
      'types': types.map((value) => value.toJson()).toList(),
      'catalogue': catalogue.map((value) => value.toJson()).toList(),
      'generatedAt': generatedAt.toIso8601String(),
      'offline': offline,
    };
  }

  factory ServiceCatalogSnapshot.fromCacheJson(Map<String, dynamic> json) {
    return ServiceCatalogSnapshot(
      packages: (json['packages'] as List<dynamic>? ?? const [])
          .map((item) => ServicePackage.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      categories: (json['categories'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCategory.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      types: (json['types'] as List<dynamic>? ?? const [])
          .map((item) => ServiceTypeDefinition.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      catalogue: (json['catalogue'] as List<dynamic>? ?? const [])
          .map((item) => ServiceCatalogueEntry.fromJson(Map<String, dynamic>.from(item as Map)))
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
    DateTime? generatedAt,
    bool? offline,
  }) {
    return ServiceCatalogSnapshot(
      packages: packages ?? this.packages,
      categories: categories ?? this.categories,
      types: types ?? this.types,
      catalogue: catalogue ?? this.catalogue,
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
