DateTime? _parseDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}

double _toDouble(dynamic value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  if (value is String) {
    final parsed = double.tryParse(value);
    if (parsed != null) return parsed;
  }
  return fallback;
}

int _toInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) {
    final parsed = int.tryParse(value);
    if (parsed != null) return parsed;
  }
  return fallback;
}

class EnterpriseProfile {
  const EnterpriseProfile({
    required this.name,
    required this.sector,
    required this.accountManager,
    required this.activeSites,
    required this.serviceMix,
  });

  final String name;
  final String sector;
  final String? accountManager;
  final int activeSites;
  final List<String> serviceMix;

  factory EnterpriseProfile.fromJson(Map<String, dynamic> json) {
    return EnterpriseProfile(
      name: json['name'] as String? ?? 'Enterprise account',
      sector: json['sector'] as String? ?? 'Multi-site operations',
      accountManager: json['accountManager'] as String?,
      activeSites: _toInt(json['activeSites'], 0),
      serviceMix: (json['serviceMix'] as List<dynamic>? ?? const [])
          .map((value) => value.toString())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'sector': sector,
        'accountManager': accountManager,
        'activeSites': activeSites,
        'serviceMix': serviceMix,
      };
}

class EnterpriseDeliveryMetrics {
  const EnterpriseDeliveryMetrics({
    required this.slaCompliance,
    required this.incidents,
    required this.avgResolutionHours,
    required this.nps,
  });

  final double slaCompliance;
  final int incidents;
  final double avgResolutionHours;
  final int nps;

  factory EnterpriseDeliveryMetrics.fromJson(Map<String, dynamic> json) {
    return EnterpriseDeliveryMetrics(
      slaCompliance: _toDouble(json['slaCompliance'], 0),
      incidents: _toInt(json['incidents'], 0),
      avgResolutionHours: _toDouble(json['avgResolutionHours'], 0),
      nps: _toInt(json['nps'], 0),
    );
  }

  Map<String, dynamic> toJson() => {
        'slaCompliance': slaCompliance,
        'incidents': incidents,
        'avgResolutionHours': avgResolutionHours,
        'nps': nps,
      };
}

class EnterpriseInvoice {
  const EnterpriseInvoice({
    required this.vendor,
    required this.amount,
    required this.dueDate,
    required this.status,
  });

  final String vendor;
  final double amount;
  final DateTime? dueDate;
  final String status;

  factory EnterpriseInvoice.fromJson(Map<String, dynamic> json) {
    return EnterpriseInvoice(
      vendor: json['vendor'] as String? ?? 'Vendor',
      amount: _toDouble(json['amount'], 0),
      dueDate: _parseDate(json['dueDate']),
      status: json['status'] as String? ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() => {
        'vendor': vendor,
        'amount': amount,
        'dueDate': dueDate?.toIso8601String(),
        'status': status,
      };
}

class EnterpriseSpend {
  const EnterpriseSpend({
    required this.monthToDate,
    required this.budgetPacing,
    required this.savingsIdentified,
    required this.invoices,
  });

  final double monthToDate;
  final double budgetPacing;
  final double savingsIdentified;
  final List<EnterpriseInvoice> invoices;

  factory EnterpriseSpend.fromJson(Map<String, dynamic> json) {
    return EnterpriseSpend(
      monthToDate: _toDouble(json['monthToDate'], 0),
      budgetPacing: _toDouble(json['budgetPacing'], 0),
      savingsIdentified: _toDouble(json['savingsIdentified'], 0),
      invoices: (json['invoicesAwaitingApproval'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseInvoice.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'monthToDate': monthToDate,
        'budgetPacing': budgetPacing,
        'savingsIdentified': savingsIdentified,
        'invoicesAwaitingApproval': invoices.map((invoice) => invoice.toJson()).toList(),
      };
}

class EnterpriseProgramme {
  const EnterpriseProgramme({
    required this.id,
    required this.name,
    required this.status,
    required this.phase,
    required this.lastUpdated,
  });

  final String id;
  final String name;
  final String status;
  final String phase;
  final DateTime? lastUpdated;

  factory EnterpriseProgramme.fromJson(Map<String, dynamic> json) {
    return EnterpriseProgramme(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? 'Programme',
      status: json['status'] as String? ?? 'on-track',
      phase: json['phase'] as String? ?? 'Execution',
      lastUpdated: _parseDate(json['lastUpdated']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'status': status,
        'phase': phase,
        'lastUpdated': lastUpdated?.toIso8601String(),
      };
}

class EnterpriseEscalation {
  const EnterpriseEscalation({
    required this.id,
    required this.title,
    required this.owner,
    required this.openedAt,
    required this.severity,
  });

  final String id;
  final String title;
  final String owner;
  final DateTime? openedAt;
  final String severity;

  factory EnterpriseEscalation.fromJson(Map<String, dynamic> json) {
    return EnterpriseEscalation(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String? ?? 'Escalation',
      owner: json['owner'] as String? ?? 'Operations',
      openedAt: _parseDate(json['openedAt']),
      severity: json['severity'] as String? ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'owner': owner,
        'openedAt': openedAt?.toIso8601String(),
        'severity': severity,
      };
}

class EnterpriseCoverageRegion {
  const EnterpriseCoverageRegion({
    required this.id,
    required this.region,
    required this.uptime,
    required this.activeSites,
    required this.automationScore,
    required this.incidents,
    required this.primaryService,
  });

  final String id;
  final String region;
  final double uptime;
  final int activeSites;
  final double automationScore;
  final int incidents;
  final String? primaryService;

  factory EnterpriseCoverageRegion.fromJson(Map<String, dynamic> json) {
    return EnterpriseCoverageRegion(
      id: json['id']?.toString() ?? '',
      region: json['region'] as String? ?? 'Region',
      uptime: _toDouble(json['uptime'], 0),
      activeSites: _toInt(json['activeSites'], 0),
      automationScore: _toDouble(json['automationScore'], 0),
      incidents: _toInt(json['incidents'], 0),
      primaryService: json['primaryService'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'region': region,
        'uptime': uptime,
        'activeSites': activeSites,
        'automationScore': automationScore,
        'incidents': incidents,
        'primaryService': primaryService,
      };
}

class EnterpriseRunbook {
  const EnterpriseRunbook({
    required this.id,
    required this.name,
    required this.adoption,
    required this.owner,
  });

  final String id;
  final String name;
  final double adoption;
  final String? owner;

  factory EnterpriseRunbook.fromJson(Map<String, dynamic> json) {
    return EnterpriseRunbook(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? 'Runbook',
      adoption: _toDouble(json['adoption'], 0),
      owner: json['owner'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'adoption': adoption,
        'owner': owner,
      };
}

class EnterpriseAutomation {
  const EnterpriseAutomation({
    required this.orchestrationRate,
    required this.runbookCoverage,
    required this.automationsLive,
    required this.nextReview,
    required this.runbooks,
  });

  final double orchestrationRate;
  final double runbookCoverage;
  final int automationsLive;
  final DateTime? nextReview;
  final List<EnterpriseRunbook> runbooks;

  factory EnterpriseAutomation.fromJson(Map<String, dynamic> json) {
    return EnterpriseAutomation(
      orchestrationRate: _toDouble(json['orchestrationRate'], 0),
      runbookCoverage: _toDouble(json['runbookCoverage'], 0),
      automationsLive: _toInt(json['automationsLive'], 0),
      nextReview: _parseDate(json['nextReview']),
      runbooks: (json['runbooks'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseRunbook.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'orchestrationRate': orchestrationRate,
        'runbookCoverage': runbookCoverage,
        'automationsLive': automationsLive,
        'nextReview': nextReview?.toIso8601String(),
        'runbooks': runbooks.map((runbook) => runbook.toJson()).toList(),
      };
}

class EnterpriseSustainability {
  const EnterpriseSustainability({
    required this.carbonYtd,
    required this.carbonTarget,
    required this.renewableCoverage,
    required this.emissionTrend,
  });

  final double carbonYtd;
  final double carbonTarget;
  final double renewableCoverage;
  final String? emissionTrend;

  factory EnterpriseSustainability.fromJson(Map<String, dynamic> json) {
    return EnterpriseSustainability(
      carbonYtd: _toDouble(json['carbonYtd'], 0),
      carbonTarget: _toDouble(json['carbonTarget'], 0),
      renewableCoverage: _toDouble(json['renewableCoverage'], 0),
      emissionTrend: json['emissionTrend'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'carbonYtd': carbonYtd,
        'carbonTarget': carbonTarget,
        'renewableCoverage': renewableCoverage,
        'emissionTrend': emissionTrend,
      };
}

class EnterpriseActionItem {
  const EnterpriseActionItem({
    required this.id,
    required this.title,
    required this.detail,
    required this.due,
    required this.owner,
    required this.severity,
  });

  final String id;
  final String title;
  final String? detail;
  final DateTime? due;
  final String? owner;
  final String severity;

  factory EnterpriseActionItem.fromJson(Map<String, dynamic> json) {
    return EnterpriseActionItem(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String? ?? 'Action',
      detail: json['detail'] as String?,
      due: _parseDate(json['due']),
      owner: json['owner'] as String?,
      severity: json['severity'] as String? ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'detail': detail,
        'due': due?.toIso8601String(),
        'owner': owner,
        'severity': severity,
      };
}

class EnterpriseAudit {
  const EnterpriseAudit({
    required this.id,
    required this.name,
    required this.due,
    required this.status,
    required this.owner,
  });

  final String id;
  final String name;
  final DateTime? due;
  final String status;
  final String? owner;

  factory EnterpriseAudit.fromJson(Map<String, dynamic> json) {
    return EnterpriseAudit(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? 'Audit',
      due: _parseDate(json['due']),
      status: json['status'] as String? ?? 'scheduled',
      owner: json['owner'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'due': due?.toIso8601String(),
        'status': status,
        'owner': owner,
      };
}

class EnterpriseRisk {
  const EnterpriseRisk({
    required this.id,
    required this.label,
    required this.severity,
    required this.owner,
    required this.due,
    required this.mitigation,
  });

  final String id;
  final String label;
  final String severity;
  final String? owner;
  final DateTime? due;
  final String? mitigation;

  factory EnterpriseRisk.fromJson(Map<String, dynamic> json) {
    return EnterpriseRisk(
      id: json['id']?.toString() ?? '',
      label: json['label'] as String? ?? 'Risk',
      severity: json['severity'] as String? ?? 'medium',
      owner: json['owner'] as String?,
      due: _parseDate(json['due']),
      mitigation: json['mitigation'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'severity': severity,
        'owner': owner,
        'due': due?.toIso8601String(),
        'mitigation': mitigation,
      };
}

class EnterpriseGovernance {
  const EnterpriseGovernance({
    required this.complianceScore,
    required this.posture,
    required this.dataResidency,
    required this.riskRegister,
    required this.audits,
  });

  final double complianceScore;
  final String? posture;
  final String? dataResidency;
  final List<EnterpriseRisk> riskRegister;
  final List<EnterpriseAudit> audits;

  factory EnterpriseGovernance.fromJson(Map<String, dynamic> json) {
    return EnterpriseGovernance(
      complianceScore: _toDouble(json['complianceScore'], 0),
      posture: json['posture'] as String?,
      dataResidency: json['dataResidency'] as String?,
      riskRegister: (json['riskRegister'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseRisk.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      audits: (json['audits'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseAudit.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'complianceScore': complianceScore,
        'posture': posture,
        'dataResidency': dataResidency,
        'riskRegister': riskRegister.map((risk) => risk.toJson()).toList(),
        'audits': audits.map((audit) => audit.toJson()).toList(),
      };
}

class EnterpriseRoadmapMilestone {
  const EnterpriseRoadmapMilestone({
    required this.id,
    required this.milestone,
    required this.quarter,
    required this.status,
    required this.owner,
    required this.detail,
  });

  final String id;
  final String milestone;
  final String? quarter;
  final String? status;
  final String? owner;
  final String? detail;

  factory EnterpriseRoadmapMilestone.fromJson(Map<String, dynamic> json) {
    return EnterpriseRoadmapMilestone(
      id: json['id']?.toString() ?? '',
      milestone: json['milestone'] as String? ?? 'Milestone',
      quarter: json['quarter'] as String?,
      status: json['status'] as String?,
      owner: json['owner'] as String?,
      detail: json['detail'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'milestone': milestone,
        'quarter': quarter,
        'status': status,
        'owner': owner,
        'detail': detail,
      };
}

class EnterpriseDashboardSnapshot {
  const EnterpriseDashboardSnapshot({
    required this.profile,
    required this.delivery,
    required this.spend,
    required this.programmes,
    required this.escalations,
    required this.coverage,
    required this.automation,
    required this.sustainability,
    required this.actionCentre,
    required this.governance,
    required this.roadmap,
    required this.generatedAt,
    required this.offline,
    required this.fallback,
  });

  final EnterpriseProfile profile;
  final EnterpriseDeliveryMetrics delivery;
  final EnterpriseSpend spend;
  final List<EnterpriseProgramme> programmes;
  final List<EnterpriseEscalation> escalations;
  final List<EnterpriseCoverageRegion> coverage;
  final EnterpriseAutomation automation;
  final EnterpriseSustainability sustainability;
  final List<EnterpriseActionItem> actionCentre;
  final EnterpriseGovernance governance;
  final List<EnterpriseRoadmapMilestone> roadmap;
  final DateTime generatedAt;
  final bool offline;
  final bool fallback;

  factory EnterpriseDashboardSnapshot.fromJson(
    Map<String, dynamic> data,
    Map<String, dynamic> meta,
  ) {
    final generatedAt = _parseDate(meta['generatedAt']) ?? DateTime.now();
    final operations = Map<String, dynamic>.from(data['operations'] as Map? ?? const {});
    final governanceJson = Map<String, dynamic>.from(data['governance'] as Map? ?? const {});

    return EnterpriseDashboardSnapshot(
      profile: EnterpriseProfile.fromJson(Map<String, dynamic>.from(data['enterprise'] as Map? ?? const {})),
      delivery: EnterpriseDeliveryMetrics.fromJson(Map<String, dynamic>.from(data['delivery'] as Map? ?? const {})),
      spend: EnterpriseSpend.fromJson(Map<String, dynamic>.from(data['spend'] as Map? ?? const {})),
      programmes: (data['programmes'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseProgramme.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      escalations: (data['escalations'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseEscalation.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      coverage: (operations['coverage'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseCoverageRegion.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      automation: EnterpriseAutomation.fromJson(Map<String, dynamic>.from(operations['automation'] as Map? ?? const {})),
      sustainability: EnterpriseSustainability.fromJson(
        Map<String, dynamic>.from(operations['sustainability'] as Map? ?? const {}),
      ),
      actionCentre: (operations['actionCentre'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseActionItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      governance: EnterpriseGovernance.fromJson(governanceJson),
      roadmap: (data['roadmap'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseRoadmapMilestone.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      generatedAt: generatedAt,
      offline: false,
      fallback: meta['fallback'] == true,
    );
  }

  factory EnterpriseDashboardSnapshot.fromCacheJson(Map<String, dynamic> json) {
    return EnterpriseDashboardSnapshot(
      profile: EnterpriseProfile.fromJson(Map<String, dynamic>.from(json['profile'] as Map? ?? const {})),
      delivery: EnterpriseDeliveryMetrics.fromJson(Map<String, dynamic>.from(json['delivery'] as Map? ?? const {})),
      spend: EnterpriseSpend.fromJson(Map<String, dynamic>.from(json['spend'] as Map? ?? const {})),
      programmes: (json['programmes'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseProgramme.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      escalations: (json['escalations'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseEscalation.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      coverage: (json['coverage'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseCoverageRegion.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      automation: EnterpriseAutomation.fromJson(Map<String, dynamic>.from(json['automation'] as Map? ?? const {})),
      sustainability: EnterpriseSustainability.fromJson(
        Map<String, dynamic>.from(json['sustainability'] as Map? ?? const {}),
      ),
      actionCentre: (json['actionCentre'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseActionItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      governance: EnterpriseGovernance.fromJson(Map<String, dynamic>.from(json['governance'] as Map? ?? const {})),
      roadmap: (json['roadmap'] as List<dynamic>? ?? const [])
          .map((item) => EnterpriseRoadmapMilestone.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false),
      generatedAt: _parseDate(json['generatedAt']) ?? DateTime.now(),
      offline: json['offline'] == true,
      fallback: json['fallback'] == true,
    );
  }

  Map<String, dynamic> toCacheJson() => {
        'profile': profile.toJson(),
        'delivery': delivery.toJson(),
        'spend': spend.toJson(),
        'programmes': programmes.map((programme) => programme.toJson()).toList(),
        'escalations': escalations.map((escalation) => escalation.toJson()).toList(),
        'coverage': coverage.map((region) => region.toJson()).toList(),
        'automation': automation.toJson(),
        'sustainability': sustainability.toJson(),
        'actionCentre': actionCentre.map((item) => item.toJson()).toList(),
        'governance': governance.toJson(),
        'roadmap': roadmap.map((milestone) => milestone.toJson()).toList(),
        'generatedAt': generatedAt.toIso8601String(),
        'offline': offline,
        'fallback': fallback,
      };

  EnterpriseDashboardSnapshot copyWith({bool? offline, bool? fallback}) {
    return EnterpriseDashboardSnapshot(
      profile: profile,
      delivery: delivery,
      spend: spend,
      programmes: programmes,
      escalations: escalations,
      coverage: coverage,
      automation: automation,
      sustainability: sustainability,
      actionCentre: actionCentre,
      governance: governance,
      roadmap: roadmap,
      generatedAt: generatedAt,
      offline: offline ?? this.offline,
      fallback: fallback ?? this.fallback,
    );
  }
}
