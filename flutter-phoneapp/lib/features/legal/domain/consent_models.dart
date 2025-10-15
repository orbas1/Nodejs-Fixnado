class ConsentPolicy {
  const ConsentPolicy({
    required this.key,
    required this.title,
    required this.description,
    required this.version,
    required this.url,
    required this.stale,
  });

  final String key;
  final String title;
  final String description;
  final String version;
  final String url;
  final bool stale;

  factory ConsentPolicy.fromJson(Map<String, dynamic> json) {
    final key = json['policy'] as String? ?? json['key'] as String? ?? 'terms_of_service';
    final description = json['description'] as String? ?? '';
    final url = json['url'] as String? ?? '/privacy';
    final version = json['version'] as String? ?? '1.0';
    final stale = json['stale'] == true;
    final title = json['title'] as String? ?? _titleFromKey(key);
    return ConsentPolicy(
      key: key,
      title: title,
      description: description,
      version: version,
      url: url,
      stale: stale,
    );
  }

  static String _titleFromKey(String value) {
    return value
        .split('_')
        .where((part) => part.isNotEmpty)
        .map((part) => part[0].toUpperCase() + part.substring(1))
        .join(' ');
  }
}

class ConsentSnapshot {
  const ConsentSnapshot({
    required this.subjectId,
    required this.refreshDays,
    required this.pendingPolicies,
  });

  final String? subjectId;
  final int refreshDays;
  final List<ConsentPolicy> pendingPolicies;

  factory ConsentSnapshot.fromJson(Map<String, dynamic> json) {
    final policiesRaw = json['policies'];
    final policies = <ConsentPolicy>[];
    if (policiesRaw is List) {
      for (final entry in policiesRaw) {
        if (entry is Map<String, dynamic>) {
          final policy = ConsentPolicy.fromJson(entry);
          final granted = entry['granted'] == true;
          if (!granted || policy.stale) {
            policies.add(policy);
          }
        }
      }
    }

    return ConsentSnapshot(
      subjectId: json['subjectId'] as String?,
      refreshDays: json['refreshDays'] is int ? json['refreshDays'] as int : 365,
      pendingPolicies: policies,
    );
  }

  bool get requiresAction => pendingPolicies.isNotEmpty;
}
