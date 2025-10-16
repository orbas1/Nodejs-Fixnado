import 'package:equatable/equatable.dart';

class CreationBlueprint extends Equatable {
  const CreationBlueprint({
    required this.id,
    required this.title,
    required this.description,
    required this.persona,
    required this.defaultPricingModel,
    required this.supportedChannels,
    required this.complianceChecklist,
    required this.recommendedRegions,
  });

  factory CreationBlueprint.fromJson(Map<String, dynamic> json) {
    return CreationBlueprint(
      id: json['id']?.toString() ?? json['slug']?.toString() ?? 'unknown',
      title: json['title']?.toString() ?? 'Untitled',
      description: json['description']?.toString() ?? '',
      persona: _stringList(json['persona']),
      defaultPricingModel: json['defaultPricingModel']?.toString() ?? 'fixed',
      supportedChannels: _stringList(json['supportedChannels']),
      complianceChecklist: _stringList(json['complianceChecklist']),
      recommendedRegions: _stringList(json['recommendedRegions']),
    );
  }

  final String id;
  final String title;
  final String description;
  final List<String> persona;
  final String defaultPricingModel;
  final List<String> supportedChannels;
  final List<String> complianceChecklist;
  final List<String> recommendedRegions;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        persona,
        defaultPricingModel,
        supportedChannels,
        complianceChecklist,
        recommendedRegions,
      ];
}

List<String> _stringList(Object? value) {
  if (value is List) {
    return value.map((item) => item.toString()).toList(growable: false);
  }
  if (value is String && value.isNotEmpty) {
    return value.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(growable: false);
  }
  return const [];
}
