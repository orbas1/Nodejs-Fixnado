import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/profile_models.dart';

class ProfileRepository {
  ProfileRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _cacheKey = 'profile:v1';

  Future<ProfileFetchResult> fetchProfile({bool bypassCache = false}) async {
    ProfileSnapshot? cachedSnapshot;
    final cached = _cache.readJson(_cacheKey);
    if (cached != null) {
      cachedSnapshot = ProfileSnapshot.fromJson(Map<String, dynamic>.from(cached['value'] as Map));
      final cachedAt = cached['updatedAt'] != null ? DateTime.tryParse(cached['updatedAt'] as String) : null;
      if (cachedAt != null) {
        cachedSnapshot = cachedSnapshot.copyWith(generatedAt: cachedAt);
      }
    }

    try {
      final snapshot = await _loadRemote();
      await _cache.writeJson(_cacheKey, snapshot.toJson());
      return ProfileFetchResult(profile: snapshot, offline: false);
    } on TimeoutException catch (_) {
      if (cachedSnapshot != null) {
        return ProfileFetchResult(profile: cachedSnapshot, offline: true);
      }
      rethrow;
    } on ApiException catch (_) {
      if (cachedSnapshot != null) {
        return ProfileFetchResult(profile: cachedSnapshot, offline: true);
      }
      rethrow;
    }
  }

  Future<ProfileSnapshot> updateProfile(ProfileSnapshot current, ProfileUpdateRequest request) async {
    final updated = current.copyWith(
      identity: current.identity.copyWith(
        displayName: request.identity.displayName,
        headline: request.identity.headline,
        tagline: request.identity.tagline,
        bio: request.identity.bio,
        serviceRegions: request.identity.serviceRegions,
        badges: request.identity.badges,
        serviceTags: request.identity.serviceTags,
        supportEmail: request.identity.supportEmail,
        supportPhone: request.identity.supportPhone,
      ),
      languages: request.languages,
      compliance: request.compliance,
      availability: request.availability,
      shareProfile: request.shareProfile,
      requestQuote: request.requestQuote,
      generatedAt: DateTime.now(),
    );
    await _cache.writeJson(_cacheKey, updated.toJson());
    return updated;
  }

  Future<ProfileSnapshot> _loadRemote() async {
    final dashboardPayload = await _client.getJson('/panel/provider/dashboard');
    final dashboardData = Map<String, dynamic>.from(dashboardPayload['data'] as Map? ?? dashboardPayload as Map? ?? {});
    final provider = Map<String, dynamic>.from(dashboardData['provider'] as Map? ?? {});

    final slug = provider['slug'] as String? ?? 'featured';
    final frontPayload = await _client.getJson('/business-fronts/$slug');
    final frontData = Map<String, dynamic>.from(frontPayload['data'] as Map? ?? frontPayload as Map? ?? {});

    final hero = Map<String, dynamic>.from(frontData['hero'] as Map? ?? {});
    final serviceCatalogue = (frontData['serviceCatalogue'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    final tools = (frontData['tools'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    final materials = (frontData['materials'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    final certifications = (frontData['certifications'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();

    final serviceTags = <String>{
      ...((hero['tags'] as List<dynamic>? ?? const []).map((item) => item.toString())),
      ...serviceCatalogue.expand((item) => (item['tags'] as List<dynamic>? ?? const []).map((tag) => tag.toString())),
      ...serviceCatalogue.map((item) => item['category']?.toString() ?? '').where((value) => value.isNotEmpty),
    }..removeWhere((element) => element.isEmpty);
    if (serviceTags.isEmpty) {
      serviceTags.addAll(_defaultBadges);
    }

    final serviceRegions = _resolveRegions(hero, provider);
    final badgeLibrary = _defaultBadges;

    final languageLibrary = _defaultLanguages;
    final complianceLibrary = _mergeCompliance(certifications, _defaultCompliance);
    final availabilityLibrary = _defaultAvailability;
    final selectedLanguages = languageLibrary.take(2).toList();
    final selectedCompliance = complianceLibrary.take(3).toList();
    final selectedAvailability = availabilityLibrary.take(2).toList();

    final services = serviceCatalogue.take(6).map(_mapServiceOffering).toList();
    final tooling = _mapTooling(tools, materials);

    AffiliateProgrammeSnapshot? affiliate;
    try {
      final affiliatePayload = await _client.getJson('/affiliate/dashboard');
      final affiliateData = Map<String, dynamic>.from(affiliatePayload['data'] as Map? ?? affiliatePayload as Map? ?? {});
      affiliate = AffiliateProgrammeSnapshot.fromJson(affiliateData);
    } catch (error) {
      // Silent fallback — affiliate programme may not be configured for all tenants yet.
    }

    final identity = ProviderIdentity(
      displayName: provider['tradingName'] as String? ?? provider['name'] as String? ?? hero['name'] as String? ?? 'Provider',
      headline: _resolveHeadline(hero, serviceTags.toList()),
      tagline: hero['strapline'] as String? ?? hero['tagline'] as String? ??
          'Escrow-backed delivery coverage for enterprise facilities.',
      bio: hero['bio'] as String? ??
          'Fixnado-certified SME with telemetry-backed service governance, marketplace concierge and escrow compliance.',
      serviceRegions: serviceRegions,
      badges: badgeLibrary.take(3).toList(),
      serviceTags: serviceTags.take(6).toList(),
      supportEmail: provider['supportEmail'] as String? ?? provider['contactEmail'] as String? ?? 'support@fixnado.com',
      supportPhone: provider['supportPhone'] as String?,
    );

    final workflow = _defaultWorkflow;

    return ProfileSnapshot(
      identity: identity,
      services: services,
      languages: selectedLanguages,
      compliance: selectedCompliance,
      availability: selectedAvailability,
      workflow: workflow,
      tooling: tooling,
      badgeLibrary: badgeLibrary,
      languageLibrary: languageLibrary,
      complianceLibrary: complianceLibrary,
      availabilityLibrary: availabilityLibrary,
      serviceTagLibrary: serviceTags.take(12).toList(),
      shareProfile: true,
      requestQuote: true,
      generatedAt: DateTime.now(),
      affiliate: affiliate,
    );
  }

  List<String> _resolveRegions(Map<String, dynamic> hero, Map<String, dynamic> provider) {
    final heroLocations = (hero['locations'] as List<dynamic>? ?? const [])
        .map((location) => location.toString())
        .where((element) => element.isNotEmpty)
        .toList();
    if (heroLocations.isNotEmpty) {
      return heroLocations;
    }
    final region = provider['region'] as String? ?? provider['serviceRegions'] as String?;
    if (region != null && region.isNotEmpty) {
      return region.split(',').map((part) => part.trim()).where((part) => part.isNotEmpty).toList();
    }
    return const ['United Kingdom'];
  }

  String _resolveHeadline(Map<String, dynamic> hero, List<String> tags) {
    final categories = (hero['categories'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .where((value) => value.isNotEmpty)
        .toList();
    if (categories.isNotEmpty) {
      return categories.first;
    }
    if (tags.isNotEmpty) {
      return tags.first;
    }
    return 'Field services specialist';
  }

  ServiceOffering _mapServiceOffering(Map<String, dynamic> item) {
    final availability = Map<String, dynamic>.from(item['availability'] as Map? ?? {});
    final coverage = (item['coverage'] as List<dynamic>? ?? const [])
        .map((entry) => entry.toString())
        .where((entry) => entry.isNotEmpty)
        .toList();
    final tags = (item['tags'] as List<dynamic>? ?? const [])
        .map((entry) => entry.toString())
        .where((entry) => entry.isNotEmpty)
        .toList();

    return ServiceOffering(
      id: item['id']?.toString() ?? 'service-${item.hashCode}',
      name: item['name']?.toString() ?? 'Service',
      description: item['description']?.toString() ?? '',
      price: (item['price'] as num?)?.toDouble(),
      currency: item['currency']?.toString(),
      availabilityLabel: availability['label']?.toString() ?? 'Availability',
      availabilityDetail: availability['detail']?.toString() ?? '',
      coverage: coverage,
      tags: tags,
    );
  }

  List<ToolingItem> _mapTooling(List<Map<String, dynamic>> tools, List<Map<String, dynamic>> materials) {
    final combined = [...tools, ...materials].take(6).toList();
    if (combined.isEmpty) {
      return _defaultTooling;
    }
    return combined
        .map(
          (item) => ToolingItem(
            name: item['name']?.toString() ?? 'Tooling capability',
            description: item['description']?.toString() ??
                item['category']?.toString() ??
                'Operational tooling surfaced from Fixnado inventory.',
            category: item['category']?.toString(),
            sku: item['sku']?.toString(),
            status: item['status']?.toString(),
            available: (item['availability'] as num?)?.toInt(),
            reserved: (item['quantityReserved'] as num?)?.toInt(),
            onHand: (item['quantityOnHand'] as num?)?.toInt(),
            safetyStock: (item['safetyStock'] as num?)?.toInt(),
            unitType: item['unitType']?.toString(),
            location: item['location']?.toString(),
            nextMaintenanceDue: item['nextMaintenanceDue'] != null
                ? DateTime.tryParse(item['nextMaintenanceDue'].toString())
                : null,
            activeAlerts: (item['activeAlerts'] as num?)?.toInt(),
            activeRentals: (item['activeRentals'] as num?)?.toInt(),
            rentalRate: (item['rentalRate'] as num?)?.toDouble(),
            rentalRateCurrency: item['rentalRateCurrency']?.toString(),
            depositAmount: (item['depositAmount'] as num?)?.toDouble(),
            depositCurrency: item['depositCurrency']?.toString(),
            notes: item['notes']?.toString(),
          ),
        )
        .toList();
  }

  List<ComplianceDocument> _mergeCompliance(
    List<Map<String, dynamic>> fromApi,
    List<ComplianceDocument> defaults,
  ) {
    final parsed = fromApi
        .map(
          (doc) => ComplianceDocument(
            name: doc['name']?.toString() ?? doc['id']?.toString() ?? 'Compliance artefact',
            status: 'Valid',
            expiry: doc['expiresOn'] != null ? DateTime.tryParse(doc['expiresOn'].toString()) : null,
          ),
        )
        .toList();
    if (parsed.isEmpty) {
      return defaults;
    }
    final merged = <String, ComplianceDocument>{
      for (final doc in defaults) doc.name: doc,
      for (final doc in parsed) doc.name: doc,
    };
    return merged.values.toList();
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return ProfileRepository(client, cache);
});

final List<String> _defaultBadges = const [
  'Top rated',
  'Escrow trusted',
  'Rapid responder',
  'Compliance verified',
  'AI augmented operations',
];

final List<LanguageCapability> _defaultLanguages = const [
  LanguageCapability(
    locale: 'English (US)',
    proficiency: 'Native',
    coverage: 'All copy and job notes',
  ),
  LanguageCapability(
    locale: 'Spanish (MX)',
    proficiency: 'Professional working',
    coverage: 'Safety briefings and SMS updates',
  ),
  LanguageCapability(
    locale: 'French (FR)',
    proficiency: 'Conversational',
    coverage: 'Client success follow-up',
  ),
  LanguageCapability(
    locale: 'German (DE)',
    proficiency: 'Professional working',
    coverage: 'Compliance artefacts and technical diagrams',
  ),
];

final List<ComplianceDocument> _defaultCompliance = const [
  ComplianceDocument(
    name: 'DBS Enhanced',
    status: 'Cleared',
    expiry: null,
  ),
  ComplianceDocument(
    name: 'NIC EIC Certification',
    status: 'Valid',
    expiry: null,
  ),
  ComplianceDocument(
    name: 'Public liability insurance (£5m)',
    status: 'Active',
    expiry: null,
  ),
  ComplianceDocument(
    name: 'Safety management system',
    status: 'Valid',
    expiry: null,
  ),
];

final List<AvailabilityWindow> _defaultAvailability = const [
  AvailabilityWindow(
    window: 'Mon – Fri',
    time: '07:00 – 19:00',
    notes: 'Emergency response across core zones.',
  ),
  AvailabilityWindow(
    window: 'Sat',
    time: '08:00 – 14:00',
    notes: 'Premium callout applies; remote diagnostics offered.',
  ),
  AvailabilityWindow(
    window: 'Sun',
    time: 'On-call',
    notes: 'Escalation only; concierge triages inbound requests.',
  ),
];

final List<EngagementStep> _defaultWorkflow = const [
  EngagementStep(
    stage: 'Discovery',
    detail: 'Survey the site within 24 hours and capture permits or access notes.',
  ),
  EngagementStep(
    stage: 'Execution',
    detail: 'Track milestones with geo-tagged proof before escrow releases.',
  ),
  EngagementStep(
    stage: 'Post-job',
    detail: 'Send documentation and schedule follow-up reviews automatically.',
  ),
];

final List<ToolingItem> _defaultTooling = const [
  ToolingItem(
    name: 'Marketplace storefront',
    description: 'Thermal cameras, torque tools, and surge analyzers with insured delivery.',
    status: 'healthy',
    available: 12,
    onHand: 18,
    reserved: 6,
    safetyStock: 4,
    unitType: 'kits',
    rentalRate: 180,
    rentalRateCurrency: 'GBP',
    notes: 'Calibrated weekly; RFID tracked logistics.'
  ),
  ToolingItem(
    name: 'Service zone coverage',
    description: 'Downtown core, campuses, and logistics hubs with live ETAs.',
    status: 'low_stock',
    available: 5,
    onHand: 12,
    reserved: 7,
    safetyStock: 5,
    unitType: 'zones',
    location: 'Metro & suburban depots',
    notes: 'Geo-fenced pods maintained with IoT sensors.'
  ),
  ToolingItem(
    name: 'Knowledge base references',
    description: 'Permit checklist, lockout/tagout, and escalation scripts ready.',
    status: 'healthy',
    notes: 'Digital SOP repository linked to crew tablets.'
  ),
];
