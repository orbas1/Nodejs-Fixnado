import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/profile_models.dart';

class ProfileRepository {
  ProfileRepository(this._cache);

  final LocalCache _cache;

  static const _cacheKey = 'profile:v1';
  static const _seedAssetPath = 'assets/data/profile_seed.json';

  Future<ProfileFetchResult> fetchProfile({bool bypassCache = false}) async {
    final cachedSnapshot = _readCachedSnapshot();
    if (!bypassCache && cachedSnapshot != null) {
      return ProfileFetchResult(profile: cachedSnapshot, offline: false);
    }

    try {
      final snapshot = await _loadSeedProfile();
      await _cache.writeJson(_cacheKey, snapshot.toJson());
      return ProfileFetchResult(profile: snapshot, offline: false);
    } catch (_) {
      final fallback = cachedSnapshot ?? _fallbackSnapshot();
      if (cachedSnapshot == null) {
        await _cache.writeJson(_cacheKey, fallback.toJson());
      }
      return ProfileFetchResult(profile: fallback, offline: true);
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

  ProfileSnapshot? _readCachedSnapshot() {
    final cached = _cache.readJson(_cacheKey);
    if (cached == null) {
      return null;
    }
    try {
      final payload = Map<String, dynamic>.from(cached['value'] as Map? ?? cached);
      final snapshot = ProfileSnapshot.fromJson(payload);
      final updatedAt = cached['updatedAt'] as String?;
      if (updatedAt == null) {
        return snapshot;
      }
      final generatedAt = DateTime.tryParse(updatedAt);
      return generatedAt != null ? snapshot.copyWith(generatedAt: generatedAt) : snapshot;
    } catch (_) {
      return null;
    }
  }

  Future<ProfileSnapshot> _loadSeedProfile() async {
    final raw = await rootBundle.loadString(_seedAssetPath);
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Invalid profile seed payload');
    }
    final snapshot = ProfileSnapshot.fromJson(decoded);
    return snapshot.copyWith(generatedAt: DateTime.now());
  }

  ProfileSnapshot _fallbackSnapshot() {
    final identity = ProviderIdentity(
      displayName: 'Atlas Facilities',
      headline: 'Critical environment specialists',
      tagline: 'Rapid response coverage across London & the South East.',
      bio:
          'We keep mission critical campuses online with 24/7 electrical, HVAC and fabric support backed by escrow-compliant workflows.',
      serviceRegions: const ['London', 'South East', 'Midlands'],
      badges: const ['Escrow trusted', 'Rapid responder', 'Compliance verified'],
      serviceTags: const ['Electrical', 'HVAC', 'Emergency callouts', 'Preventative maintenance'],
      supportEmail: 'support@atlasfix.co',
      supportPhone: '+44 20 1234 5678',
    );

    final services = [
      ServiceOffering(
        id: 'svc-electrical',
        name: '24/7 Electrical callout',
        description: 'Certified electricians to stabilise critical infrastructure within two hours.',
        price: 195,
        currency: 'GBP',
        availabilityLabel: '2-hour SLA',
        availabilityDetail: 'Crew dispatched within 120 minutes across priority zones.',
        coverage: const ['Data centres', 'Corporate HQs'],
        tags: const ['Electrical', 'Emergency'],
      ),
      ServiceOffering(
        id: 'svc-hvac',
        name: 'HVAC optimisation visit',
        description: 'Thermal performance audit with tune-up and telemetry report.',
        price: 320,
        currency: 'GBP',
        availabilityLabel: 'Next-day',
        availabilityDetail: 'Scheduled within 24 hours with remote insights beforehand.',
        coverage: const ['Hospitals', 'Logistics hubs'],
        tags: const ['HVAC', 'Energy'],
      ),
      ServiceOffering(
        id: 'svc-maintenance',
        name: 'Preventative maintenance programme',
        description: 'Quarterly compliance visit aligned to SFG20 tasks and Fixnado telemetry.',
        price: 860,
        currency: 'GBP',
        availabilityLabel: 'Quarterly cadence',
        availabilityDetail: 'Rolling plan with digital sign-off and document vault.',
        coverage: const ['Retail estates', 'Industrial campuses'],
        tags: const ['Maintenance', 'Compliance'],
      ),
    ];

    final affiliate = AffiliateProgrammeSnapshot(
      referralCode: 'ATLAS-PRO',
      status: 'active',
      tierLabel: 'Gold Partner',
      totalCommission: 2480,
      totalRevenue: 31200,
      pendingCommission: 320,
      transactionCount: 42,
      settings: AffiliateSettingsSummary(
        autoApprove: true,
        payoutCadenceDays: 30,
        minimumPayout: 100,
        attributionWindowDays: 45,
        disclosureUrl: 'https://atlasfix.co/legal/affiliate',
      ),
      tiers: [
        AffiliateCommissionTier(
          id: 'starter',
          name: 'Starter',
          tierLabel: 'Starter',
          commissionRate: 8,
          minValue: 0,
          maxValue: 5000,
          recurrence: 'one_time',
          recurrenceLimit: null,
        ),
        AffiliateCommissionTier(
          id: 'growth',
          name: 'Growth',
          tierLabel: 'Growth',
          commissionRate: 12,
          minValue: 5000,
          maxValue: 15000,
          recurrence: 'one_time',
          recurrenceLimit: null,
        ),
        AffiliateCommissionTier(
          id: 'enterprise',
          name: 'Enterprise',
          tierLabel: 'Enterprise',
          commissionRate: 15,
          minValue: 15000,
          maxValue: null,
          recurrence: 'one_time',
          recurrenceLimit: null,
        ),
      ],
      referrals: [
        AffiliateReferralSummary(
          code: 'DALSTON-HQ',
          status: 'converted',
          conversions: 3,
          revenue: 8700,
          commission: 696,
        ),
        AffiliateReferralSummary(
          code: 'CANARY-WHARF',
          status: 'converted',
          conversions: 5,
          revenue: 12600,
          commission: 1008,
        ),
        AffiliateReferralSummary(
          code: 'WEST-END',
          status: 'pending',
          conversions: 1,
          revenue: 1800,
          commission: 144,
        ),
      ],
    );

    return ProfileSnapshot(
      identity: identity,
      services: services,
      languages: _defaultLanguages.take(3).toList(),
      compliance: _defaultCompliance.take(3).toList(),
      availability: _defaultAvailability.take(2).toList(),
      workflow: _defaultWorkflow,
      tooling: _defaultTooling,
      badgeLibrary: _defaultBadges,
      languageLibrary: _defaultLanguages,
      complianceLibrary: _defaultCompliance,
      availabilityLibrary: _defaultAvailability,
      serviceTagLibrary: {
        ...identity.serviceTags,
        'SFG20',
        'Escrow compliant',
      }.toList(),
      shareProfile: true,
      requestQuote: true,
      generatedAt: DateTime.now(),
      affiliate: affiliate,
    );
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final cache = ref.watch(localCacheProvider);
  return ProfileRepository(cache);
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
    locale: 'English (UK)',
    proficiency: 'Native',
    coverage: 'All documentation and coordination',
  ),
  LanguageCapability(
    locale: 'Spanish (ES)',
    proficiency: 'Professional working',
    coverage: 'On-site safety briefings and reports',
  ),
  LanguageCapability(
    locale: 'Polish (PL)',
    proficiency: 'Conversational',
    coverage: 'Crew coordination and job notes',
  ),
  LanguageCapability(
    locale: 'French (FR)',
    proficiency: 'Conversational',
    coverage: 'Client success follow-up',
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
    name: 'CHAS Premium Plus',
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
