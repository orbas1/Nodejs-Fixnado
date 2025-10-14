import 'package:collection/collection.dart';

class ProviderIdentity {
  ProviderIdentity({
    required this.displayName,
    required this.headline,
    required this.tagline,
    required this.bio,
    required this.serviceRegions,
    required this.badges,
    required this.serviceTags,
    required this.supportEmail,
    required this.supportPhone,
  });

  final String displayName;
  final String headline;
  final String tagline;
  final String bio;
  final List<String> serviceRegions;
  final List<String> badges;
  final List<String> serviceTags;
  final String supportEmail;
  final String? supportPhone;

  ProviderIdentity copyWith({
    String? displayName,
    String? headline,
    String? tagline,
    String? bio,
    List<String>? serviceRegions,
    List<String>? badges,
    List<String>? serviceTags,
    String? supportEmail,
    String? supportPhone,
  }) {
    return ProviderIdentity(
      displayName: displayName ?? this.displayName,
      headline: headline ?? this.headline,
      tagline: tagline ?? this.tagline,
      bio: bio ?? this.bio,
      serviceRegions: serviceRegions ?? List<String>.from(this.serviceRegions),
      badges: badges ?? List<String>.from(this.badges),
      serviceTags: serviceTags ?? List<String>.from(this.serviceTags),
      supportEmail: supportEmail ?? this.supportEmail,
      supportPhone: supportPhone ?? this.supportPhone,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'displayName': displayName,
      'headline': headline,
      'tagline': tagline,
      'bio': bio,
      'serviceRegions': serviceRegions,
      'badges': badges,
      'serviceTags': serviceTags,
      'supportEmail': supportEmail,
      'supportPhone': supportPhone,
    };
  }

  factory ProviderIdentity.fromJson(Map<String, dynamic> json) {
    return ProviderIdentity(
      displayName: json['displayName'] as String? ?? 'Provider',
      headline: json['headline'] as String? ?? 'Field services specialist',
      tagline: json['tagline'] as String? ?? 'Escrow-backed delivery across your service zones.',
      bio: json['bio'] as String? ?? '',
      serviceRegions: (json['serviceRegions'] as List<dynamic>? ?? const [])
          .map((region) => region.toString())
          .toList(),
      badges:
          (json['badges'] as List<dynamic>? ?? const []).map((badge) => badge.toString()).toList(),
      serviceTags: (json['serviceTags'] as List<dynamic>? ?? const [])
          .map((tag) => tag.toString())
          .toList(),
      supportEmail: json['supportEmail'] as String? ?? 'support@fixnado.com',
      supportPhone: json['supportPhone'] as String?,
    );
  }
}

class ServiceOffering {
  ServiceOffering({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.currency,
    required this.availabilityLabel,
    required this.availabilityDetail,
    required this.coverage,
    required this.tags,
  });

  final String id;
  final String name;
  final String description;
  final double? price;
  final String? currency;
  final String availabilityLabel;
  final String availabilityDetail;
  final List<String> coverage;
  final List<String> tags;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'currency': currency,
      'availabilityLabel': availabilityLabel,
      'availabilityDetail': availabilityDetail,
      'coverage': coverage,
      'tags': tags,
    };
  }

  factory ServiceOffering.fromJson(Map<String, dynamic> json) {
    return ServiceOffering(
      id: json['id'] as String? ?? 'service',
      name: json['name'] as String? ?? 'Service',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      availabilityLabel: json['availabilityLabel'] as String? ?? 'Availability',
      availabilityDetail: json['availabilityDetail'] as String? ?? '',
      coverage: (json['coverage'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      tags:
          (json['tags'] as List<dynamic>? ?? const []).map((tag) => tag.toString()).toList(),
    );
  }
}

class LanguageCapability {
  const LanguageCapability({
    required this.locale,
    required this.proficiency,
    required this.coverage,
  });

  final String locale;
  final String proficiency;
  final String coverage;

  LanguageCapability copyWith({String? proficiency, String? coverage}) {
    return LanguageCapability(
      locale: locale,
      proficiency: proficiency ?? this.proficiency,
      coverage: coverage ?? this.coverage,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'locale': locale,
      'proficiency': proficiency,
      'coverage': coverage,
    };
  }

  factory LanguageCapability.fromJson(Map<String, dynamic> json) {
    return LanguageCapability(
      locale: json['locale'] as String? ?? 'English (US)',
      proficiency: json['proficiency'] as String? ?? 'Native',
      coverage: json['coverage'] as String? ?? 'All copy + field documentation',
    );
  }

  @override
  bool operator ==(Object other) {
    return other is LanguageCapability &&
        other.locale == locale &&
        other.proficiency == proficiency &&
        other.coverage == coverage;
  }

  @override
  int get hashCode => Object.hash(locale, proficiency, coverage);
}

class ComplianceDocument {
  const ComplianceDocument({
    required this.name,
    required this.status,
    required this.expiry,
  });

  final String name;
  final String status;
  final DateTime? expiry;

  ComplianceDocument copyWith({String? status, DateTime? expiry}) {
    return ComplianceDocument(
      name: name,
      status: status ?? this.status,
      expiry: expiry ?? this.expiry,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'status': status,
      'expiry': expiry?.toIso8601String(),
    };
  }

  factory ComplianceDocument.fromJson(Map<String, dynamic> json) {
    return ComplianceDocument(
      name: json['name'] as String? ?? 'Compliance artefact',
      status: json['status'] as String? ?? 'Valid',
      expiry: json['expiry'] != null ? DateTime.tryParse(json['expiry'].toString()) : null,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is ComplianceDocument &&
        other.name == name &&
        other.status == status &&
        other.expiry == expiry;
  }

  @override
  int get hashCode => Object.hash(name, status, expiry);
}

class AvailabilityWindow {
  const AvailabilityWindow({
    required this.window,
    required this.time,
    required this.notes,
  });

  final String window;
  final String time;
  final String notes;

  Map<String, dynamic> toJson() {
    return {
      'window': window,
      'time': time,
      'notes': notes,
    };
  }

  factory AvailabilityWindow.fromJson(Map<String, dynamic> json) {
    return AvailabilityWindow(
      window: json['window'] as String? ?? 'Mon – Fri',
      time: json['time'] as String? ?? '09:00 – 18:00',
      notes: json['notes'] as String? ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    return other is AvailabilityWindow &&
        other.window == window &&
        other.time == time &&
        other.notes == notes;
  }

  @override
  int get hashCode => Object.hash(window, time, notes);
}

class EngagementStep {
  const EngagementStep({
    required this.stage,
    required this.detail,
  });

  final String stage;
  final String detail;

  Map<String, dynamic> toJson() {
    return {
      'stage': stage,
      'detail': detail,
    };
  }

  factory EngagementStep.fromJson(Map<String, dynamic> json) {
    return EngagementStep(
      stage: json['stage'] as String? ?? 'Stage',
      detail: json['detail'] as String? ?? '',
    );
  }
}

class ToolingItem {
  const ToolingItem({
    required this.name,
    required this.description,
    this.category,
    this.sku,
    this.status,
    this.available,
    this.reserved,
    this.onHand,
    this.safetyStock,
    this.unitType,
    this.location,
    this.nextMaintenanceDue,
    this.activeAlerts,
    this.activeRentals,
    this.rentalRate,
    this.rentalRateCurrency,
    this.depositAmount,
    this.depositCurrency,
    this.notes,
  });

  final String name;
  final String description;
  final String? category;
  final String? sku;
  final String? status;
  final int? available;
  final int? reserved;
  final int? onHand;
  final int? safetyStock;
  final String? unitType;
  final String? location;
  final DateTime? nextMaintenanceDue;
  final int? activeAlerts;
  final int? activeRentals;
  final double? rentalRate;
  final String? rentalRateCurrency;
  final double? depositAmount;
  final String? depositCurrency;
  final String? notes;

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'category': category,
      'sku': sku,
      'status': status,
      'available': available,
      'reserved': reserved,
      'onHand': onHand,
      'safetyStock': safetyStock,
      'unitType': unitType,
      'location': location,
      'nextMaintenanceDue': nextMaintenanceDue?.toIso8601String(),
      'activeAlerts': activeAlerts,
      'activeRentals': activeRentals,
      'rentalRate': rentalRate,
      'rentalRateCurrency': rentalRateCurrency,
      'depositAmount': depositAmount,
      'depositCurrency': depositCurrency,
      'notes': notes,
    };
  }

  factory ToolingItem.fromJson(Map<String, dynamic> json) {
    return ToolingItem(
      name: json['name'] as String? ?? 'Tooling capability',
      description: json['description'] as String? ?? '',
      category: json['category'] as String?,
      sku: json['sku'] as String?,
      status: json['status'] as String?,
      available: (json['available'] as num?)?.toInt(),
      reserved: (json['reserved'] as num?)?.toInt(),
      onHand: (json['onHand'] as num?)?.toInt(),
      safetyStock: (json['safetyStock'] as num?)?.toInt(),
      unitType: json['unitType'] as String?,
      location: json['location'] as String?,
      nextMaintenanceDue: json['nextMaintenanceDue'] != null
          ? DateTime.tryParse(json['nextMaintenanceDue'].toString())
          : null,
      activeAlerts: (json['activeAlerts'] as num?)?.toInt(),
      activeRentals: (json['activeRentals'] as num?)?.toInt(),
      rentalRate: (json['rentalRate'] as num?)?.toDouble(),
      rentalRateCurrency: json['rentalRateCurrency'] as String?,
      depositAmount: (json['depositAmount'] as num?)?.toDouble(),
      depositCurrency: json['depositCurrency'] as String?,
      notes: json['notes'] as String?,
    );
  }

  ToolingItem copyWith({
    String? name,
    String? description,
    String? category,
    String? sku,
    String? status,
    int? available,
    int? reserved,
    int? onHand,
    int? safetyStock,
    String? unitType,
    String? location,
    DateTime? nextMaintenanceDue,
    int? activeAlerts,
    int? activeRentals,
    double? rentalRate,
    String? rentalRateCurrency,
    double? depositAmount,
    String? depositCurrency,
    String? notes,
  }) {
    return ToolingItem(
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      sku: sku ?? this.sku,
      status: status ?? this.status,
      available: available ?? this.available,
      reserved: reserved ?? this.reserved,
      onHand: onHand ?? this.onHand,
      safetyStock: safetyStock ?? this.safetyStock,
      unitType: unitType ?? this.unitType,
      location: location ?? this.location,
      nextMaintenanceDue: nextMaintenanceDue ?? this.nextMaintenanceDue,
      activeAlerts: activeAlerts ?? this.activeAlerts,
      activeRentals: activeRentals ?? this.activeRentals,
      rentalRate: rentalRate ?? this.rentalRate,
      rentalRateCurrency: rentalRateCurrency ?? this.rentalRateCurrency,
      depositAmount: depositAmount ?? this.depositAmount,
      depositCurrency: depositCurrency ?? this.depositCurrency,
      notes: notes ?? this.notes,
    );
  }
}

class AffiliateCommissionTier {
  AffiliateCommissionTier({
    required this.id,
    required this.name,
    required this.tierLabel,
    required this.commissionRate,
    required this.minValue,
    required this.maxValue,
    required this.recurrence,
    this.recurrenceLimit,
  });

  final String id;
  final String name;
  final String tierLabel;
  final double commissionRate;
  final double minValue;
  final double? maxValue;
  final String recurrence;
  final int? recurrenceLimit;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'tierLabel': tierLabel,
      'commissionRate': commissionRate,
      'minValue': minValue,
      'maxValue': maxValue,
      'recurrence': recurrence,
      'recurrenceLimit': recurrenceLimit,
    };
  }

  factory AffiliateCommissionTier.fromJson(Map<String, dynamic> json) {
    return AffiliateCommissionTier(
      id: json['id'] as String? ?? 'tier',
      name: json['name'] as String? ?? 'Commission tier',
      tierLabel: json['tierLabel'] as String? ?? 'Tier',
      commissionRate: (json['commissionRate'] as num?)?.toDouble() ?? 0,
      minValue: (json['minTransactionValue'] as num?)?.toDouble() ?? (json['minValue'] as num?)?.toDouble() ?? 0,
      maxValue: (json['maxTransactionValue'] as num?)?.toDouble() ?? (json['maxValue'] as num?)?.toDouble(),
      recurrence: json['recurrenceType'] as String? ?? json['recurrence'] as String? ?? 'one_time',
      recurrenceLimit: (json['recurrenceLimit'] as num?)?.toInt(),
    );
  }
}

class AffiliateReferralSummary {
  AffiliateReferralSummary({
    required this.code,
    required this.status,
    required this.conversions,
    required this.revenue,
    required this.commission,
  });

  final String code;
  final String status;
  final int conversions;
  final double revenue;
  final double commission;

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'status': status,
      'conversions': conversions,
      'revenue': revenue,
      'commission': commission,
    };
  }

  factory AffiliateReferralSummary.fromJson(Map<String, dynamic> json) {
    return AffiliateReferralSummary(
      code: json['referralCodeUsed'] as String? ?? json['code'] as String? ?? 'REF',
      status: json['status'] as String? ?? 'pending',
      conversions: (json['conversionsCount'] as num?)?.toInt() ?? (json['conversions'] as num?)?.toInt() ?? 0,
      revenue: (json['totalRevenue'] as num?)?.toDouble() ?? (json['revenue'] as num?)?.toDouble() ?? 0,
      commission: (json['totalCommissionEarned'] as num?)?.toDouble() ?? (json['commission'] as num?)?.toDouble() ?? 0,
    );
  }
}

class AffiliateSettingsSummary {
  AffiliateSettingsSummary({
    required this.autoApprove,
    required this.payoutCadenceDays,
    required this.minimumPayout,
    required this.attributionWindowDays,
    this.disclosureUrl,
  });

  final bool autoApprove;
  final int payoutCadenceDays;
  final double minimumPayout;
  final int attributionWindowDays;
  final String? disclosureUrl;

  Map<String, dynamic> toJson() {
    return {
      'autoApproveReferrals': autoApprove,
      'payoutCadenceDays': payoutCadenceDays,
      'minimumPayoutAmount': minimumPayout,
      'referralAttributionWindowDays': attributionWindowDays,
      'disclosureUrl': disclosureUrl,
    };
  }

  factory AffiliateSettingsSummary.fromJson(Map<String, dynamic> json) {
    return AffiliateSettingsSummary(
      autoApprove: json['autoApproveReferrals'] as bool? ?? json['autoApprove'] as bool? ?? false,
      payoutCadenceDays: (json['payoutCadenceDays'] as num?)?.toInt() ?? 30,
      minimumPayout: (json['minimumPayoutAmount'] as num?)?.toDouble() ?? (json['minimumPayout'] as num?)?.toDouble() ?? 0,
      attributionWindowDays:
          (json['referralAttributionWindowDays'] as num?)?.toInt() ?? (json['attributionWindowDays'] as num?)?.toInt() ?? 0,
      disclosureUrl: json['disclosureUrl'] as String?,
    );
  }
}

class AffiliateProgrammeSnapshot {
  AffiliateProgrammeSnapshot({
    required this.referralCode,
    required this.status,
    required this.tierLabel,
    required this.totalCommission,
    required this.totalRevenue,
    required this.pendingCommission,
    required this.transactionCount,
    required this.settings,
    required this.tiers,
    required this.referrals,
  });

  final String referralCode;
  final String status;
  final String? tierLabel;
  final double totalCommission;
  final double totalRevenue;
  final double pendingCommission;
  final int transactionCount;
  final AffiliateSettingsSummary settings;
  final List<AffiliateCommissionTier> tiers;
  final List<AffiliateReferralSummary> referrals;

  Map<String, dynamic> toJson() {
    return {
      'referralCode': referralCode,
      'status': status,
      'tierLabel': tierLabel,
      'totalCommission': totalCommission,
      'totalRevenue': totalRevenue,
      'pendingCommission': pendingCommission,
      'transactionCount': transactionCount,
      'settings': settings.toJson(),
      'tiers': tiers.map((tier) => tier.toJson()).toList(),
      'referrals': referrals.map((referral) => referral.toJson()).toList(),
    };
  }

  factory AffiliateProgrammeSnapshot.fromJson(Map<String, dynamic> json) {
    return AffiliateProgrammeSnapshot(
      referralCode: json['referralCode'] as String? ?? 'AFFILIATE',
      status: json['status'] as String? ?? 'active',
      tierLabel: json['tierLabel'] as String?,
      totalCommission: (json['earnings']?['totalCommission'] as num?)?.toDouble() ??
          (json['totalCommission'] as num?)?.toDouble() ??
          0,
      totalRevenue: (json['earnings']?['totalRevenue'] as num?)?.toDouble() ??
          (json['totalRevenue'] as num?)?.toDouble() ??
          0,
      pendingCommission: (json['profile']?['pendingCommission'] as num?)?.toDouble() ??
          (json['pendingCommission'] as num?)?.toDouble() ??
          0,
      transactionCount: (json['earnings']?['transactionCount'] as num?)?.toInt() ??
          (json['transactionCount'] as num?)?.toInt() ??
          0,
      settings: AffiliateSettingsSummary.fromJson(Map<String, dynamic>.from(json['settings'] as Map? ?? {})),
      tiers: (json['commissionRules'] as List<dynamic>? ?? json['tiers'] as List<dynamic>? ?? const [])
          .map((item) => AffiliateCommissionTier.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      referrals: (json['referrals'] as List<dynamic>? ?? const [])
          .map((item) => AffiliateReferralSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }
}

class ProfileSnapshot {
  ProfileSnapshot({
    required this.identity,
    required this.services,
    required this.languages,
    required this.compliance,
    required this.availability,
    required this.workflow,
    required this.tooling,
    required this.badgeLibrary,
    required this.languageLibrary,
    required this.complianceLibrary,
    required this.availabilityLibrary,
    required this.serviceTagLibrary,
    required this.shareProfile,
    required this.requestQuote,
    required this.generatedAt,
    this.affiliate,
  });

  final ProviderIdentity identity;
  final List<ServiceOffering> services;
  final List<LanguageCapability> languages;
  final List<ComplianceDocument> compliance;
  final List<AvailabilityWindow> availability;
  final List<EngagementStep> workflow;
  final List<ToolingItem> tooling;
  final List<String> badgeLibrary;
  final List<LanguageCapability> languageLibrary;
  final List<ComplianceDocument> complianceLibrary;
  final List<AvailabilityWindow> availabilityLibrary;
  final List<String> serviceTagLibrary;
  final bool shareProfile;
  final bool requestQuote;
  final DateTime generatedAt;
  final AffiliateProgrammeSnapshot? affiliate;

  ProfileSnapshot copyWith({
    ProviderIdentity? identity,
    List<ServiceOffering>? services,
    List<LanguageCapability>? languages,
    List<ComplianceDocument>? compliance,
    List<AvailabilityWindow>? availability,
    List<EngagementStep>? workflow,
    List<ToolingItem>? tooling,
    List<String>? badgeLibrary,
    List<LanguageCapability>? languageLibrary,
    List<ComplianceDocument>? complianceLibrary,
    List<AvailabilityWindow>? availabilityLibrary,
    List<String>? serviceTagLibrary,
    bool? shareProfile,
    bool? requestQuote,
    DateTime? generatedAt,
    AffiliateProgrammeSnapshot? affiliate,
  }) {
    return ProfileSnapshot(
      identity: identity ?? this.identity,
      services: services ?? List<ServiceOffering>.from(this.services),
      languages: languages ?? List<LanguageCapability>.from(this.languages),
      compliance: compliance ?? List<ComplianceDocument>.from(this.compliance),
      availability: availability ?? List<AvailabilityWindow>.from(this.availability),
      workflow: workflow ?? List<EngagementStep>.from(this.workflow),
      tooling: tooling ?? List<ToolingItem>.from(this.tooling),
      badgeLibrary: badgeLibrary ?? List<String>.from(this.badgeLibrary),
      languageLibrary: languageLibrary ?? List<LanguageCapability>.from(this.languageLibrary),
      complianceLibrary:
          complianceLibrary ?? List<ComplianceDocument>.from(this.complianceLibrary),
      availabilityLibrary:
          availabilityLibrary ?? List<AvailabilityWindow>.from(this.availabilityLibrary),
      serviceTagLibrary: serviceTagLibrary ?? List<String>.from(this.serviceTagLibrary),
      shareProfile: shareProfile ?? this.shareProfile,
      requestQuote: requestQuote ?? this.requestQuote,
      generatedAt: generatedAt ?? this.generatedAt,
      affiliate: affiliate ?? this.affiliate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'identity': identity.toJson(),
      'services': services.map((service) => service.toJson()).toList(),
      'languages': languages.map((language) => language.toJson()).toList(),
      'compliance': compliance.map((doc) => doc.toJson()).toList(),
      'availability': availability.map((slot) => slot.toJson()).toList(),
      'workflow': workflow.map((step) => step.toJson()).toList(),
      'tooling': tooling.map((item) => item.toJson()).toList(),
      'badgeLibrary': badgeLibrary,
      'languageLibrary': languageLibrary.map((language) => language.toJson()).toList(),
      'complianceLibrary': complianceLibrary.map((doc) => doc.toJson()).toList(),
      'availabilityLibrary': availabilityLibrary.map((slot) => slot.toJson()).toList(),
      'serviceTagLibrary': serviceTagLibrary,
      'shareProfile': shareProfile,
      'requestQuote': requestQuote,
      'generatedAt': generatedAt.toIso8601String(),
      'affiliate': affiliate?.toJson(),
    };
  }

  factory ProfileSnapshot.fromJson(Map<String, dynamic> json) {
    return ProfileSnapshot(
      identity:
          ProviderIdentity.fromJson(Map<String, dynamic>.from(json['identity'] as Map? ?? {})),
      services: (json['services'] as List<dynamic>? ?? const [])
          .map((item) => ServiceOffering.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      languages: (json['languages'] as List<dynamic>? ?? const [])
          .map((item) => LanguageCapability.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      compliance: (json['compliance'] as List<dynamic>? ?? const [])
          .map((item) => ComplianceDocument.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      availability: (json['availability'] as List<dynamic>? ?? const [])
          .map((item) => AvailabilityWindow.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      workflow: (json['workflow'] as List<dynamic>? ?? const [])
          .map((item) => EngagementStep.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      tooling: (json['tooling'] as List<dynamic>? ?? const [])
          .map((item) => ToolingItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      badgeLibrary: (json['badgeLibrary'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      languageLibrary: (json['languageLibrary'] as List<dynamic>? ?? const [])
          .map((item) => LanguageCapability.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      complianceLibrary: (json['complianceLibrary'] as List<dynamic>? ?? const [])
          .map((item) => ComplianceDocument.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      availabilityLibrary: (json['availabilityLibrary'] as List<dynamic>? ?? const [])
          .map((item) => AvailabilityWindow.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      serviceTagLibrary: (json['serviceTagLibrary'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      shareProfile: json['shareProfile'] as bool? ?? true,
      requestQuote: json['requestQuote'] as bool? ?? true,
      generatedAt: json['generatedAt'] != null
          ? DateTime.tryParse(json['generatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      affiliate: json['affiliate'] != null
          ? AffiliateProgrammeSnapshot.fromJson(Map<String, dynamic>.from(json['affiliate'] as Map))
          : null,
    );
  }
}

class ProfileDraft {
  ProfileDraft({
    required this.displayName,
    required this.headline,
    required this.tagline,
    required this.bio,
    required this.serviceRegions,
    required this.badges,
    required this.serviceTags,
    required this.supportEmail,
    required this.supportPhone,
    required this.languages,
    required this.compliance,
    required this.availability,
    required this.shareProfile,
    required this.requestQuote,
  });

  final String displayName;
  final String headline;
  final String tagline;
  final String bio;
  final List<String> serviceRegions;
  final List<String> badges;
  final List<String> serviceTags;
  final String supportEmail;
  final String? supportPhone;
  final List<LanguageCapability> languages;
  final List<ComplianceDocument> compliance;
  final List<AvailabilityWindow> availability;
  final bool shareProfile;
  final bool requestQuote;

  factory ProfileDraft.fromSnapshot(ProfileSnapshot snapshot) {
    return ProfileDraft(
      displayName: snapshot.identity.displayName,
      headline: snapshot.identity.headline,
      tagline: snapshot.identity.tagline,
      bio: snapshot.identity.bio,
      serviceRegions: List<String>.from(snapshot.identity.serviceRegions),
      badges: List<String>.from(snapshot.identity.badges),
      serviceTags: List<String>.from(snapshot.identity.serviceTags),
      supportEmail: snapshot.identity.supportEmail,
      supportPhone: snapshot.identity.supportPhone,
      languages: List<LanguageCapability>.from(snapshot.languages),
      compliance: List<ComplianceDocument>.from(snapshot.compliance),
      availability: List<AvailabilityWindow>.from(snapshot.availability),
      shareProfile: snapshot.shareProfile,
      requestQuote: snapshot.requestQuote,
    );
  }

  ProfileDraft copyWith({
    String? displayName,
    String? headline,
    String? tagline,
    String? bio,
    List<String>? serviceRegions,
    List<String>? badges,
    List<String>? serviceTags,
    String? supportEmail,
    String? supportPhone,
    List<LanguageCapability>? languages,
    List<ComplianceDocument>? compliance,
    List<AvailabilityWindow>? availability,
    bool? shareProfile,
    bool? requestQuote,
  }) {
    return ProfileDraft(
      displayName: displayName ?? this.displayName,
      headline: headline ?? this.headline,
      tagline: tagline ?? this.tagline,
      bio: bio ?? this.bio,
      serviceRegions: serviceRegions ?? List<String>.from(this.serviceRegions),
      badges: badges ?? List<String>.from(this.badges),
      serviceTags: serviceTags ?? List<String>.from(this.serviceTags),
      supportEmail: supportEmail ?? this.supportEmail,
      supportPhone: supportPhone ?? this.supportPhone,
      languages: languages ?? List<LanguageCapability>.from(this.languages),
      compliance: compliance ?? List<ComplianceDocument>.from(this.compliance),
      availability: availability ?? List<AvailabilityWindow>.from(this.availability),
      shareProfile: shareProfile ?? this.shareProfile,
      requestQuote: requestQuote ?? this.requestQuote,
    );
  }

  bool matchesSnapshot(ProfileSnapshot snapshot) {
    final listEquals = const DeepCollectionEquality().equals;
    return snapshot.identity.displayName == displayName &&
        snapshot.identity.headline == headline &&
        snapshot.identity.tagline == tagline &&
        snapshot.identity.bio == bio &&
        listEquals(snapshot.identity.serviceRegions, serviceRegions) &&
        listEquals(snapshot.identity.badges, badges) &&
        listEquals(snapshot.identity.serviceTags, serviceTags) &&
        snapshot.identity.supportEmail == supportEmail &&
        snapshot.identity.supportPhone == supportPhone &&
        listEquals(snapshot.languages, languages) &&
        listEquals(snapshot.compliance, compliance) &&
        listEquals(snapshot.availability, availability) &&
        snapshot.shareProfile == shareProfile &&
        snapshot.requestQuote == requestQuote;
  }

  ProfileUpdateRequest toUpdateRequest() {
    return ProfileUpdateRequest(
      identity: ProviderIdentity(
        displayName: displayName,
        headline: headline,
        tagline: tagline,
        bio: bio,
        serviceRegions: List<String>.from(serviceRegions),
        badges: List<String>.from(badges),
        serviceTags: List<String>.from(serviceTags),
        supportEmail: supportEmail,
        supportPhone: supportPhone,
      ),
      languages: List<LanguageCapability>.from(languages),
      compliance: List<ComplianceDocument>.from(compliance),
      availability: List<AvailabilityWindow>.from(availability),
      shareProfile: shareProfile,
      requestQuote: requestQuote,
    );
  }
}

class ProfileUpdateRequest {
  ProfileUpdateRequest({
    required this.identity,
    required this.languages,
    required this.compliance,
    required this.availability,
    required this.shareProfile,
    required this.requestQuote,
  });

  final ProviderIdentity identity;
  final List<LanguageCapability> languages;
  final List<ComplianceDocument> compliance;
  final List<AvailabilityWindow> availability;
  final bool shareProfile;
  final bool requestQuote;

  Map<String, dynamic> toJson() {
    return {
      'identity': identity.toJson(),
      'languages': languages.map((language) => language.toJson()).toList(),
      'compliance': compliance.map((doc) => doc.toJson()).toList(),
      'availability': availability.map((slot) => slot.toJson()).toList(),
      'shareProfile': shareProfile,
      'requestQuote': requestQuote,
    };
  }
}

class ProfileFetchResult {
  ProfileFetchResult({
    required this.profile,
    required this.offline,
  });

  final ProfileSnapshot profile;
  final bool offline;
}
