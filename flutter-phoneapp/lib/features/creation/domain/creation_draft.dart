import 'package:equatable/equatable.dart';

class CreationDraft extends Equatable {
  const CreationDraft({
    required this.blueprintId,
    required this.name,
    required this.slug,
    required this.summary,
    required this.persona,
    required this.region,
    required this.pricing,
    required this.fulfilmentChannels,
    required this.complianceChecklist,
    required this.automationHints,
    required this.availabilityLeadHours,
    required this.availabilityWindow,
    required this.aiAssistEnabled,
  });

  factory CreationDraft.fromJson(Map<String, dynamic> json) {
    final availability = json['availability'] as Map<String, dynamic>?;
    return CreationDraft(
      blueprintId: json['blueprintId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      summary: json['summary']?.toString() ?? '',
      persona: _list(json['persona']),
      region: json['region']?.toString() ?? 'national',
      pricing: CreationDraftPricing.fromJson(Map<String, dynamic>.from(json['pricing'] ?? const {})),
      fulfilmentChannels: _list(json['fulfilmentChannels']),
      complianceChecklist: _list(json['complianceChecklist']),
      automationHints: _list(json['automationHints']),
      availabilityLeadHours: availability?['leadHours'] is num
          ? (availability!['leadHours'] as num).toInt()
          : 48,
      availabilityWindow: availability?['window']?.toString() ?? '08:00-18:00',
      aiAssistEnabled: json['aiAssistEnabled'] is bool ? json['aiAssistEnabled'] as bool : true,
    );
  }

  final String blueprintId;
  final String name;
  final String slug;
  final String summary;
  final List<String> persona;
  final String region;
  final CreationDraftPricing pricing;
  final List<String> fulfilmentChannels;
  final List<String> complianceChecklist;
  final List<String> automationHints;
  final int availabilityLeadHours;
  final String availabilityWindow;
  final bool aiAssistEnabled;

  CreationDraft copyWith({
    String? blueprintId,
    String? name,
    String? slug,
    String? summary,
    List<String>? persona,
    String? region,
    CreationDraftPricing? pricing,
    List<String>? fulfilmentChannels,
    List<String>? complianceChecklist,
    List<String>? automationHints,
    int? availabilityLeadHours,
    String? availabilityWindow,
    bool? aiAssistEnabled,
  }) {
    return CreationDraft(
      blueprintId: blueprintId ?? this.blueprintId,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      summary: summary ?? this.summary,
      persona: persona ?? this.persona,
      region: region ?? this.region,
      pricing: pricing ?? this.pricing,
      fulfilmentChannels: fulfilmentChannels ?? this.fulfilmentChannels,
      complianceChecklist: complianceChecklist ?? this.complianceChecklist,
      automationHints: automationHints ?? this.automationHints,
      availabilityLeadHours: availabilityLeadHours ?? this.availabilityLeadHours,
      availabilityWindow: availabilityWindow ?? this.availabilityWindow,
      aiAssistEnabled: aiAssistEnabled ?? this.aiAssistEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'blueprintId': blueprintId,
      'name': name,
      'slug': slug,
      'summary': summary,
      'persona': persona,
      'region': region,
      'pricing': pricing.toJson(),
      'fulfilmentChannels': fulfilmentChannels,
      'complianceChecklist': complianceChecklist,
      'automationHints': automationHints,
      'availability': {
        'leadHours': availabilityLeadHours,
        'window': availabilityWindow,
      },
      'aiAssistEnabled': aiAssistEnabled,
    };
  }

  @override
  List<Object?> get props => [
        blueprintId,
        name,
        slug,
        summary,
        persona,
        region,
        pricing,
        fulfilmentChannels,
        complianceChecklist,
        automationHints,
        availabilityLeadHours,
        availabilityWindow,
        aiAssistEnabled,
      ];
}

class CreationDraftPricing extends Equatable {
  const CreationDraftPricing({
    required this.model,
    required this.amount,
    required this.currency,
    this.setupFee,
  });

  factory CreationDraftPricing.fromJson(Map<String, dynamic> json) {
    final amountValue = json['amount'];
    final setupValue = json['setupFee'];
    return CreationDraftPricing(
      model: json['model']?.toString() ?? 'fixed',
      amount: amountValue is num ? amountValue.toDouble() : double.tryParse(amountValue?.toString() ?? '0') ?? 0,
      currency: json['currency']?.toString() ?? 'GBP',
      setupFee: setupValue == null
          ? null
          : (setupValue is num ? setupValue.toDouble() : double.tryParse(setupValue.toString())),
    );
  }

  final String model;
  final double amount;
  final String currency;
  final double? setupFee;

  CreationDraftPricing copyWith({
    String? model,
    double? amount,
    String? currency,
    double? setupFee,
  }) {
    return CreationDraftPricing(
      model: model ?? this.model,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      setupFee: setupFee ?? this.setupFee,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'model': model,
      'amount': amount,
      'currency': currency,
      if (setupFee != null) 'setupFee': setupFee,
    };
  }

  @override
  List<Object?> get props => [model, amount, currency, setupFee];
}

List<String> _list(Object? value) {
  if (value is List) {
    return value.map((entry) => entry.toString()).toList(growable: false);
  }
  if (value is String && value.isNotEmpty) {
    return value
        .split(',')
        .map((entry) => entry.trim())
        .where((entry) => entry.isNotEmpty)
        .toList(growable: false);
  }
  return const [];
}
