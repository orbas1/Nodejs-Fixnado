class BusinessReview {
  BusinessReview({
    required this.id,
    required this.reviewer,
    required this.comment,
    this.rating,
    this.job,
    this.submittedAt,
    this.verified = false,
    this.response,
    this.responseTimeMinutes,
  });

  factory BusinessReview.fromJson(Map<String, dynamic> json) {
    return BusinessReview(
      id: json['id']?.toString() ?? 'review',
      reviewer: json['reviewer']?.toString() ?? 'Client stakeholder',
      rating: _toDouble(json['rating']),
      comment: json['comment']?.toString() ?? '',
      job: json['job']?.toString(),
      submittedAt: DateTime.tryParse(json['submittedAt']?.toString() ?? ''),
      verified: json['verified'] as bool? ?? false,
      response: json['response']?.toString(),
      responseTimeMinutes: _toDouble(json['responseTimeMinutes'])?.round(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reviewer': reviewer,
      'rating': rating,
      'comment': comment,
      'job': job,
      'submittedAt': submittedAt?.toIso8601String(),
      'verified': verified,
      'response': response,
      'responseTimeMinutes': responseTimeMinutes,
    };
  }

  final String id;
  final String reviewer;
  final double? rating;
  final String comment;
  final String? job;
  final DateTime? submittedAt;
  final bool verified;
  final String? response;
  final int? responseTimeMinutes;
}

class ReviewRatingBucket {
  ReviewRatingBucket({
    required this.score,
    required this.count,
  });

  factory ReviewRatingBucket.fromJson(Map<String, dynamic> json) {
    return ReviewRatingBucket(
      score: json['score'] is num ? (json['score'] as num).round() : int.tryParse(json['score']?.toString() ?? '') ?? 0,
      count: json['count'] is num ? (json['count'] as num).round() : int.tryParse(json['count']?.toString() ?? '') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'count': count,
    };
  }

  final int score;
  final int count;
}

class BusinessReviewSummary {
  BusinessReviewSummary({
    required this.averageRating,
    required this.totalReviews,
    required this.verifiedShare,
    required this.responseRate,
    required this.ratingBuckets,
    this.lastReviewAt,
    this.highlightedReviewId,
    this.excerpt,
  });

  factory BusinessReviewSummary.fromJson(Map<String, dynamic> json) {
    return BusinessReviewSummary(
      averageRating: _toDouble(json['averageRating']),
      totalReviews: json['totalReviews'] is num ? (json['totalReviews'] as num).round() : int.tryParse(json['totalReviews']?.toString() ?? '') ?? 0,
      verifiedShare: _toDouble(json['verifiedShare']) ?? 0,
      responseRate: _toDouble(json['responseRate']) ?? 0,
      ratingBuckets: (json['ratingBuckets'] as List<dynamic>? ?? const [])
          .map((item) => ReviewRatingBucket.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      lastReviewAt: DateTime.tryParse(json['lastReviewAt']?.toString() ?? ''),
      highlightedReviewId: json['highlightedReviewId']?.toString(),
      excerpt: json['excerpt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'averageRating': averageRating,
      'totalReviews': totalReviews,
      'verifiedShare': verifiedShare,
      'responseRate': responseRate,
      'ratingBuckets': ratingBuckets.map((bucket) => bucket.toJson()).toList(),
      'lastReviewAt': lastReviewAt?.toIso8601String(),
      'highlightedReviewId': highlightedReviewId,
      'excerpt': excerpt,
    };
  }

  final double? averageRating;
  final int totalReviews;
  final double verifiedShare;
  final double responseRate;
  final List<ReviewRatingBucket> ratingBuckets;
  final DateTime? lastReviewAt;
  final String? highlightedReviewId;
  final String? excerpt;
}

class ReviewAccessControl {
  ReviewAccessControl({
    required this.granted,
    required this.allowedRoles,
    required this.visibility,
    this.reason,
  });

  factory ReviewAccessControl.fromJson(Map<String, dynamic> json) {
    return ReviewAccessControl(
      granted: json['granted'] as bool? ?? false,
      allowedRoles: _ensureStringList(json['allowedRoles']),
      visibility: json['visibility']?.toString() ?? 'restricted',
      reason: json['reason']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'granted': granted,
      'allowedRoles': allowedRoles,
      'visibility': visibility,
      'reason': reason,
    };
  }

  final bool granted;
  final List<String> allowedRoles;
  final String visibility;
  final String? reason;
}

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
    required this.reviews,
    this.reviewSummary,
    this.reviewAccess,
    required this.generatedAt,
    required this.offline,
  });

  final List<ServicePackage> packages;
  final List<ServiceCategory> categories;
  final List<ServiceTypeDefinition> types;
  final List<ServiceCatalogueEntry> catalogue;
  final List<ServiceHealthMetric> healthMetrics;
  final List<ServiceDeliveryColumn> deliveryBoard;
  final List<BusinessReview> reviews;
  final BusinessReviewSummary? reviewSummary;
  final ReviewAccessControl? reviewAccess;
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
      'reviews': reviews.map((value) => value.toJson()).toList(),
      'reviewSummary': reviewSummary?.toJson(),
      'reviewAccess': reviewAccess?.toJson(),
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
      reviews: (json['reviews'] as List<dynamic>? ?? const [])
          .map((item) => BusinessReview.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      reviewSummary: json['reviewSummary'] is Map<String, dynamic>
          ? BusinessReviewSummary.fromJson(Map<String, dynamic>.from(json['reviewSummary'] as Map))
          : null,
      reviewAccess: json['reviewAccess'] is Map<String, dynamic>
          ? ReviewAccessControl.fromJson(Map<String, dynamic>.from(json['reviewAccess'] as Map))
          : null,
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
    List<BusinessReview>? reviews,
    BusinessReviewSummary? reviewSummary,
    ReviewAccessControl? reviewAccess,
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
      reviews: reviews ?? this.reviews,
      reviewSummary: reviewSummary ?? this.reviewSummary,
      reviewAccess: reviewAccess ?? this.reviewAccess,
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
