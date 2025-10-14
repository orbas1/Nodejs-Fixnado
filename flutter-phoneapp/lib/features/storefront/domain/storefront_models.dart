class StorefrontSnapshot {
  StorefrontSnapshot({
    required this.company,
    required this.metrics,
    required this.health,
    required this.listings,
    required this.playbooks,
    required this.timeline,
    required this.generatedAt,
  });

  final StorefrontCompany company;
  final StorefrontMetrics metrics;
  final StorefrontHealth health;
  final List<StorefrontListing> listings;
  final List<StorefrontPlaybook> playbooks;
  final List<StorefrontEvent> timeline;
  final DateTime generatedAt;

  StorefrontSnapshot copyWith({
    StorefrontCompany? company,
    StorefrontMetrics? metrics,
    StorefrontHealth? health,
    List<StorefrontListing>? listings,
    List<StorefrontPlaybook>? playbooks,
    List<StorefrontEvent>? timeline,
    DateTime? generatedAt,
  }) {
    return StorefrontSnapshot(
      company: company ?? this.company,
      metrics: metrics ?? this.metrics,
      health: health ?? this.health,
      listings: listings ?? this.listings,
      playbooks: playbooks ?? this.playbooks,
      timeline: timeline ?? this.timeline,
      generatedAt: generatedAt ?? this.generatedAt,
    );
  }

  factory StorefrontSnapshot.fromJson(Map<String, dynamic> json) {
    final listings = (json['listings'] as List<dynamic>? ?? const [])
        .map((item) => StorefrontListing.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final playbooks = (json['playbooks'] as List<dynamic>? ?? const [])
        .map((item) => StorefrontPlaybook.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final timeline = (json['timeline'] as List<dynamic>? ?? const [])
        .map((item) => StorefrontEvent.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();

    return StorefrontSnapshot(
      company: StorefrontCompany.fromJson(Map<String, dynamic>.from((json['storefront'] as Map?)?['company'] as Map? ?? {})),
      metrics: StorefrontMetrics.fromJson(Map<String, dynamic>.from((json['storefront'] as Map?)?['metrics'] as Map? ?? {})),
      health: StorefrontHealth.fromJson(Map<String, dynamic>.from((json['storefront'] as Map?)?['health'] as Map? ?? {})),
      listings: listings,
      playbooks: playbooks,
      timeline: timeline,
      generatedAt: DateTime.tryParse(json['generatedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'storefront': {
          'company': company.toJson(),
          'metrics': metrics.toJson(),
          'health': health.toJson(),
        },
        'listings': listings.map((listing) => listing.toJson()).toList(),
        'playbooks': playbooks.map((playbook) => playbook.toJson()).toList(),
        'timeline': timeline.map((event) => event.toJson()).toList(),
        'generatedAt': generatedAt.toIso8601String(),
      };
}

class StorefrontCompany {
  StorefrontCompany({
    required this.id,
    required this.name,
    required this.complianceScore,
    required this.insuredSellerStatus,
    required this.insuredSellerExpiresAt,
    required this.badgeVisible,
  });

  final String id;
  final String name;
  final double complianceScore;
  final String insuredSellerStatus;
  final DateTime? insuredSellerExpiresAt;
  final bool badgeVisible;

  factory StorefrontCompany.fromJson(Map<String, dynamic> json) {
    return StorefrontCompany(
      id: json['id']?.toString() ?? 'company',
      name: json['name']?.toString() ?? 'Proveedor',
      complianceScore: (json['complianceScore'] as num?)?.toDouble() ?? 0,
      insuredSellerStatus: json['insuredSellerStatus']?.toString() ?? 'approved',
      insuredSellerExpiresAt: json['insuredSellerExpiresAt'] != null
          ? DateTime.tryParse(json['insuredSellerExpiresAt'].toString())
          : null,
      badgeVisible: json['badgeVisible'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'complianceScore': complianceScore,
        'insuredSellerStatus': insuredSellerStatus,
        'insuredSellerExpiresAt': insuredSellerExpiresAt?.toIso8601String(),
        'badgeVisible': badgeVisible,
      };
}

class StorefrontMetrics {
  StorefrontMetrics({
    required this.activeListings,
    required this.pendingReview,
    required this.flagged,
    required this.insuredOnly,
    required this.holdExpiring,
    required this.avgDailyRate,
    required this.conversionRate,
    required this.totalRequests,
    required this.totalRevenue,
  });

  final int activeListings;
  final int pendingReview;
  final int flagged;
  final int insuredOnly;
  final int holdExpiring;
  final double avgDailyRate;
  final double conversionRate;
  final int totalRequests;
  final double totalRevenue;

  factory StorefrontMetrics.fromJson(Map<String, dynamic> json) {
    return StorefrontMetrics(
      activeListings: json['activeListings'] as int? ?? 0,
      pendingReview: json['pendingReview'] as int? ?? 0,
      flagged: json['flagged'] as int? ?? 0,
      insuredOnly: json['insuredOnly'] as int? ?? 0,
      holdExpiring: json['holdExpiring'] as int? ?? 0,
      avgDailyRate: (json['avgDailyRate'] as num?)?.toDouble() ?? 0,
      conversionRate: (json['conversionRate'] as num?)?.toDouble() ?? 0,
      totalRequests: json['totalRequests'] as int? ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'activeListings': activeListings,
        'pendingReview': pendingReview,
        'flagged': flagged,
        'insuredOnly': insuredOnly,
        'holdExpiring': holdExpiring,
        'avgDailyRate': avgDailyRate,
        'conversionRate': conversionRate,
        'totalRequests': totalRequests,
        'totalRevenue': totalRevenue,
      };
}

class StorefrontHealth {
  StorefrontHealth({
    required this.badgeVisible,
    required this.complianceScore,
    required this.expiresAt,
    required this.pendingReviewCount,
    required this.flaggedCount,
    required this.holdExpiringCount,
  });

  final bool badgeVisible;
  final double complianceScore;
  final DateTime? expiresAt;
  final int pendingReviewCount;
  final int flaggedCount;
  final int holdExpiringCount;

  factory StorefrontHealth.fromJson(Map<String, dynamic> json) {
    return StorefrontHealth(
      badgeVisible: json['badgeVisible'] as bool? ?? false,
      complianceScore: (json['complianceScore'] as num?)?.toDouble() ?? 0,
      expiresAt:
          json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt'].toString()) : null,
      pendingReviewCount: json['pendingReviewCount'] as int? ?? 0,
      flaggedCount: json['flaggedCount'] as int? ?? 0,
      holdExpiringCount: json['holdExpiringCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'badgeVisible': badgeVisible,
        'complianceScore': complianceScore,
        'expiresAt': expiresAt?.toIso8601String(),
        'pendingReviewCount': pendingReviewCount,
        'flaggedCount': flaggedCount,
        'holdExpiringCount': holdExpiringCount,
      };
}

class StorefrontListing {
  StorefrontListing({
    required this.id,
    required this.title,
    required this.status,
    required this.tone,
    required this.availability,
    required this.pricePerDay,
    required this.purchasePrice,
    required this.location,
    required this.insuredOnly,
    required this.complianceHoldUntil,
    required this.lastReviewedAt,
    required this.moderationNotes,
    required this.requestVolume,
    required this.activeAgreements,
    required this.successfulAgreements,
    required this.projectedRevenue,
    required this.averageDurationDays,
    required this.recommendedActions,
    required this.agreements,
  });

  final String id;
  final String title;
  final String status;
  final String tone;
  final String availability;
  final double? pricePerDay;
  final double? purchasePrice;
  final String? location;
  final bool insuredOnly;
  final DateTime? complianceHoldUntil;
  final DateTime? lastReviewedAt;
  final String? moderationNotes;
  final int requestVolume;
  final int activeAgreements;
  final int successfulAgreements;
  final double? projectedRevenue;
  final double averageDurationDays;
  final List<StorefrontAction> recommendedActions;
  final List<StorefrontAgreement> agreements;

  factory StorefrontListing.fromJson(Map<String, dynamic> json) {
    return StorefrontListing(
      id: json['id']?.toString() ?? 'listing',
      title: json['title']?.toString() ?? 'Listado',
      status: json['status']?.toString() ?? 'draft',
      tone: json['tone']?.toString() ?? 'info',
      availability: json['availability']?.toString() ?? 'rent',
      pricePerDay: (json['pricePerDay'] as num?)?.toDouble(),
      purchasePrice: (json['purchasePrice'] as num?)?.toDouble(),
      location: json['location']?.toString(),
      insuredOnly: json['insuredOnly'] as bool? ?? false,
      complianceHoldUntil: json['complianceHoldUntil'] != null
          ? DateTime.tryParse(json['complianceHoldUntil'].toString())
          : null,
      lastReviewedAt: json['lastReviewedAt'] != null
          ? DateTime.tryParse(json['lastReviewedAt'].toString())
          : null,
      moderationNotes: json['moderationNotes']?.toString(),
      requestVolume: json['requestVolume'] as int? ?? 0,
      activeAgreements: json['activeAgreements'] as int? ?? 0,
      successfulAgreements: json['successfulAgreements'] as int? ?? 0,
      projectedRevenue: (json['projectedRevenue'] as num?)?.toDouble(),
      averageDurationDays: (json['averageDurationDays'] as num?)?.toDouble() ?? 0,
      recommendedActions: (json['recommendedActions'] as List<dynamic>? ?? const [])
          .map((action) => StorefrontAction.fromJson(Map<String, dynamic>.from(action as Map)))
          .toList(),
      agreements: (json['agreements'] as List<dynamic>? ?? const [])
          .map((agreement) => StorefrontAgreement.fromJson(Map<String, dynamic>.from(agreement as Map)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'status': status,
        'tone': tone,
        'availability': availability,
        'pricePerDay': pricePerDay,
        'purchasePrice': purchasePrice,
        'location': location,
        'insuredOnly': insuredOnly,
        'complianceHoldUntil': complianceHoldUntil?.toIso8601String(),
        'lastReviewedAt': lastReviewedAt?.toIso8601String(),
        'moderationNotes': moderationNotes,
        'requestVolume': requestVolume,
        'activeAgreements': activeAgreements,
        'successfulAgreements': successfulAgreements,
        'projectedRevenue': projectedRevenue,
        'averageDurationDays': averageDurationDays,
        'recommendedActions': recommendedActions.map((action) => action.toJson()).toList(),
        'agreements': agreements.map((agreement) => agreement.toJson()).toList(),
      };
}

class StorefrontAction {
  StorefrontAction({
    required this.id,
    required this.label,
    required this.tone,
  });

  final String id;
  final String label;
  final String tone;

  factory StorefrontAction.fromJson(Map<String, dynamic> json) {
    return StorefrontAction(
      id: json['id']?.toString() ?? 'action',
      label: json['label']?.toString() ?? '',
      tone: json['tone']?.toString() ?? 'info',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'tone': tone,
      };
}

class StorefrontAgreement {
  StorefrontAgreement({
    required this.id,
    required this.status,
    required this.renter,
    required this.pickupAt,
    required this.returnDueAt,
    required this.lastStatusTransitionAt,
    required this.depositStatus,
    required this.dailyRate,
    required this.meta,
  });

  final String id;
  final String status;
  final String? renter;
  final DateTime? pickupAt;
  final DateTime? returnDueAt;
  final DateTime? lastStatusTransitionAt;
  final String? depositStatus;
  final double? dailyRate;
  final Map<String, dynamic> meta;

  factory StorefrontAgreement.fromJson(Map<String, dynamic> json) {
    return StorefrontAgreement(
      id: json['id']?.toString() ?? 'agreement',
      status: json['status']?.toString() ?? 'requested',
      renter: json['renter']?.toString(),
      pickupAt: json['pickupAt'] != null ? DateTime.tryParse(json['pickupAt'].toString()) : null,
      returnDueAt: json['returnDueAt'] != null ? DateTime.tryParse(json['returnDueAt'].toString()) : null,
      lastStatusTransitionAt: json['lastStatusTransitionAt'] != null
          ? DateTime.tryParse(json['lastStatusTransitionAt'].toString())
          : null,
      depositStatus: json['depositStatus']?.toString(),
      dailyRate: (json['dailyRate'] as num?)?.toDouble(),
      meta: Map<String, dynamic>.from(json['meta'] as Map? ?? const {}),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status,
        'renter': renter,
        'pickupAt': pickupAt?.toIso8601String(),
        'returnDueAt': returnDueAt?.toIso8601String(),
        'lastStatusTransitionAt': lastStatusTransitionAt?.toIso8601String(),
        'depositStatus': depositStatus,
        'dailyRate': dailyRate,
        'meta': meta,
      };
}

class StorefrontPlaybook {
  StorefrontPlaybook({
    required this.id,
    required this.title,
    required this.detail,
    required this.tone,
  });

  final String id;
  final String title;
  final String detail;
  final String tone;

  factory StorefrontPlaybook.fromJson(Map<String, dynamic> json) {
    return StorefrontPlaybook(
      id: json['id']?.toString() ?? 'playbook',
      title: json['title']?.toString() ?? '',
      detail: json['detail']?.toString() ?? '',
      tone: json['tone']?.toString() ?? 'info',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'detail': detail,
        'tone': tone,
      };
}

class StorefrontEvent {
  StorefrontEvent({
    required this.id,
    required this.timestamp,
    required this.type,
    required this.listingTitle,
    required this.actor,
    required this.tone,
    required this.detail,
  });

  final String id;
  final DateTime timestamp;
  final String type;
  final String listingTitle;
  final String? actor;
  final String tone;
  final String detail;

  factory StorefrontEvent.fromJson(Map<String, dynamic> json) {
    return StorefrontEvent(
      id: json['id']?.toString() ?? 'event',
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
      type: json['type']?.toString() ?? 'update',
      listingTitle: json['listingTitle']?.toString() ?? 'Listado',
      actor: json['actor']?.toString(),
      tone: json['tone']?.toString() ?? 'info',
      detail: json['detail']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'timestamp': timestamp.toIso8601String(),
        'type': type,
        'listingTitle': listingTitle,
        'actor': actor,
        'tone': tone,
        'detail': detail,
      };
}

class StorefrontFetchResult {
  StorefrontFetchResult({
    required this.snapshot,
    required this.offline,
  });

  final StorefrontSnapshot snapshot;
  final bool offline;
}
