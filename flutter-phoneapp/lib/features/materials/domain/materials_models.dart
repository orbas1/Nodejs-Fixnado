class MaterialHeroModel {
  const MaterialHeroModel({
    required this.title,
    required this.subtitle,
    required this.metrics,
    required this.actions,
  });

  final String title;
  final String subtitle;
  final List<MaterialHeroMetric> metrics;
  final List<MaterialHeroAction> actions;

  factory MaterialHeroModel.fromJson(Map<String, dynamic> json) {
    final metrics = (json['metrics'] as List<dynamic>? ?? const [])
        .map((metric) => MaterialHeroMetric.fromJson(Map<String, dynamic>.from(metric as Map)))
        .toList();
    final actions = (json['actions'] as List<dynamic>? ?? const [])
        .map((action) => MaterialHeroAction.fromJson(Map<String, dynamic>.from(action as Map)))
        .toList();
    return MaterialHeroModel(
      title: json['title']?.toString() ?? 'Materials control tower',
      subtitle: json['subtitle']?.toString() ??
          'Govern consumables, replenishment cadences, and supplier risk from one command surface.',
      metrics: metrics,
      actions: actions,
    );
  }
}

class MaterialHeroMetric {
  const MaterialHeroMetric({
    required this.id,
    required this.label,
    required this.value,
    this.unit,
  });

  final String id;
  final String label;
  final double? value;
  final String? unit;

  factory MaterialHeroMetric.fromJson(Map<String, dynamic> json) {
    final raw = json['value'] ?? json['percentage'];
    final parsed = raw is num ? raw.toDouble() : double.tryParse(raw?.toString() ?? '');
    return MaterialHeroMetric(
      id: json['id']?.toString() ?? json['label']?.toString() ?? 'metric-${json.hashCode}',
      label: json['label']?.toString() ?? 'Metric',
      value: parsed,
      unit: json['unit']?.toString(),
    );
  }
}

class MaterialHeroAction {
  const MaterialHeroAction({
    required this.id,
    required this.label,
    required this.href,
  });

  final String id;
  final String label;
  final String href;

  factory MaterialHeroAction.fromJson(Map<String, dynamic> json) {
    return MaterialHeroAction(
      id: json['id']?.toString() ?? json['label']?.toString() ?? 'action-${json.hashCode}',
      label: json['label']?.toString() ?? 'Action',
      href: json['href']?.toString() ?? '#',
    );
  }
}

class MaterialStats {
  const MaterialStats({
    required this.totalSkus,
    required this.totalOnHand,
    required this.valueOnHand,
    required this.alerts,
    required this.fillRate,
    this.replenishmentEta,
  });

  final int totalSkus;
  final int totalOnHand;
  final double valueOnHand;
  final int alerts;
  final double fillRate;
  final DateTime? replenishmentEta;

  factory MaterialStats.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      return DateTime.tryParse(value.toString());
    }

    double parseRate(dynamic value) {
      if (value is num) {
        if (value > 1 && value <= 100) {
          return (value / 100).clamp(0, 1).toDouble();
        }
        return value.toDouble().clamp(0, 1);
      }
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed == null) return 1;
      if (parsed > 1 && parsed <= 100) {
        return (parsed / 100).clamp(0, 1).toDouble();
      }
      return parsed.clamp(0, 1);
    }

    return MaterialStats(
      totalSkus: json['totalSkus'] is num ? (json['totalSkus'] as num).toInt() : int.tryParse(json['totalSkus']?.toString() ?? '') ?? 0,
      totalOnHand:
          json['totalOnHand'] is num ? (json['totalOnHand'] as num).toInt() : int.tryParse(json['totalOnHand']?.toString() ?? '') ?? 0,
      valueOnHand:
          json['valueOnHand'] is num ? (json['valueOnHand'] as num).toDouble() : double.tryParse(json['valueOnHand']?.toString() ?? '') ?? 0,
      alerts: json['alerts'] is num ? (json['alerts'] as num).toInt() : int.tryParse(json['alerts']?.toString() ?? '') ?? 0,
      fillRate: parseRate(json['fillRate'] ?? json['fill_rate']),
      replenishmentEta: parseDate(json['replenishmentEta'] ?? json['replenishment_eta']),
    );
  }
}

class MaterialCategoryShare {
  const MaterialCategoryShare({
    required this.id,
    required this.name,
    required this.share,
    required this.safetyStockBreaches,
    required this.availability,
  });

  final String id;
  final String name;
  final double share;
  final int safetyStockBreaches;
  final double availability;

  factory MaterialCategoryShare.fromJson(Map<String, dynamic> json) {
    double parseRatio(dynamic value) {
      if (value is num) {
        final ratio = value.toDouble();
        if (ratio > 1 && ratio <= 100) {
          return (ratio / 100).clamp(0, 1).toDouble();
        }
        return ratio.clamp(0, 1);
      }
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed == null) return 0;
      if (parsed > 1 && parsed <= 100) {
        return (parsed / 100).clamp(0, 1).toDouble();
      }
      return parsed.clamp(0, 1);
    }

    return MaterialCategoryShare(
      id: json['id']?.toString() ?? 'category-${json.hashCode}',
      name: json['name']?.toString() ?? 'Category',
      share: parseRatio(json['share'] ?? json['percentage']),
      safetyStockBreaches:
          json['safetyStockBreaches'] is num ? (json['safetyStockBreaches'] as num).toInt() : int.tryParse(json['safetyStockBreaches']?.toString() ?? '') ?? 0,
      availability: parseRatio(json['availability'] ?? json['fillRate']),
    );
  }
}

class MaterialAlert {
  const MaterialAlert({
    required this.id,
    required this.type,
    required this.severity,
    required this.status,
    this.triggeredAt,
  });

  final String id;
  final String type;
  final String severity;
  final String status;
  final DateTime? triggeredAt;

  factory MaterialAlert.fromJson(Map<String, dynamic> json) {
    return MaterialAlert(
      id: json['id']?.toString() ?? 'alert-${json.hashCode}',
      type: json['type']?.toString() ?? 'alert',
      severity: json['severity']?.toString() ?? 'info',
      status: json['status']?.toString() ?? 'active',
      triggeredAt: DateTime.tryParse(json['triggeredAt']?.toString() ?? json['createdAt']?.toString() ?? ''),
    );
  }
}

class MaterialInventoryItem {
  const MaterialInventoryItem({
    required this.id,
    required this.name,
    required this.category,
    required this.unitType,
    required this.quantityOnHand,
    required this.quantityReserved,
    required this.available,
    required this.unitCost,
    this.sku,
    this.supplier,
    this.leadTimeDays,
    this.compliance = const [],
    this.nextArrival,
    this.alerts = const [],
  });

  final String id;
  final String? sku;
  final String name;
  final String category;
  final String unitType;
  final int quantityOnHand;
  final int quantityReserved;
  final int available;
  final double unitCost;
  final String? supplier;
  final double? leadTimeDays;
  final List<String> compliance;
  final DateTime? nextArrival;
  final List<MaterialAlert> alerts;

  factory MaterialInventoryItem.fromJson(Map<String, dynamic> json) {
    final alerts = (json['alerts'] as List<dynamic>? ?? const [])
        .map((alert) => MaterialAlert.fromJson(Map<String, dynamic>.from(alert as Map)))
        .toList();

    int parseInt(dynamic value) {
      if (value is num) return value.toInt();
      return int.tryParse(value?.toString() ?? '') ?? 0;
    }

    return MaterialInventoryItem(
      id: json['id']?.toString() ?? 'material-${json.hashCode}',
      sku: json['sku']?.toString(),
      name: json['name']?.toString() ?? 'Material',
      category: json['category']?.toString() ?? 'Materials',
      unitType: json['unitType']?.toString() ?? json['unit']?.toString() ?? 'unit',
      quantityOnHand: parseInt(json['quantityOnHand'] ?? json['onHand']),
      quantityReserved: parseInt(json['quantityReserved'] ?? json['reserved']),
      available: parseInt(json['available'] ?? ((json['quantityOnHand'] ?? 0) - (json['quantityReserved'] ?? 0))),
      unitCost: json['unitCost'] is num
          ? (json['unitCost'] as num).toDouble()
          : double.tryParse(json['unitCost']?.toString() ?? '') ?? 0,
      supplier: json['supplier'] is Map
          ? (json['supplier'] as Map)['name']?.toString()
          : json['supplier']?.toString(),
      leadTimeDays: json['leadTimeDays'] is num
          ? (json['leadTimeDays'] as num).toDouble()
          : double.tryParse(json['leadTimeDays']?.toString() ?? json['lead_time_days']?.toString() ?? ''),
      compliance: (json['compliance'] as List<dynamic>? ?? const [])
          .map((entry) => entry.toString())
          .where((entry) => entry.isNotEmpty)
          .toList(),
      nextArrival: DateTime.tryParse(json['nextArrival']?.toString() ?? json['next_arrival']?.toString() ?? ''),
      alerts: alerts,
    );
  }
}

class MaterialCollection {
  const MaterialCollection({
    required this.id,
    required this.name,
    required this.description,
    required this.composition,
    this.slaHours,
    this.coverageZones = const [],
    this.automation = const [],
  });

  final String id;
  final String name;
  final String description;
  final List<String> composition;
  final double? slaHours;
  final List<String> coverageZones;
  final List<String> automation;

  factory MaterialCollection.fromJson(Map<String, dynamic> json) {
    final composition = (json['composition'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .where((item) => item.isNotEmpty)
        .toList();
    return MaterialCollection(
      id: json['id']?.toString() ?? 'collection-${json.hashCode}',
      name: json['name']?.toString() ?? 'Collection',
      description: json['description']?.toString() ?? '',
      composition: composition,
      slaHours: json['slaHours'] is num
          ? (json['slaHours'] as num).toDouble()
          : double.tryParse(json['slaHours']?.toString() ?? json['sla_hours']?.toString() ?? ''),
      coverageZones: (json['coverageZones'] as List<dynamic>? ?? json['zones'] as List<dynamic>? ?? const [])
          .map((zone) => zone.toString())
          .where((zone) => zone.isNotEmpty)
          .toList(),
      automation: (json['automation'] as List<dynamic>? ?? json['automations'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .where((item) => item.isNotEmpty)
          .toList(),
    );
  }
}

class MaterialSupplier {
  const MaterialSupplier({
    required this.id,
    required this.name,
    required this.tier,
    this.leadTimeDays,
    this.reliability,
    required this.annualSpend,
    this.carbonScore,
  });

  final String id;
  final String name;
  final String tier;
  final double? leadTimeDays;
  final double? reliability;
  final double annualSpend;
  final double? carbonScore;

  factory MaterialSupplier.fromJson(Map<String, dynamic> json) {
    double? parseRatio(dynamic value) {
      if (value == null) return null;
      if (value is num) {
        final double ratio = value.toDouble();
        if (ratio > 1 && ratio <= 100) {
          return (ratio / 100).clamp(0, 1).toDouble();
        }
        return ratio.clamp(0, 1);
      }
      final parsed = double.tryParse(value.toString());
      if (parsed == null) return null;
      if (parsed > 1 && parsed <= 100) {
        return (parsed / 100).clamp(0, 1).toDouble();
      }
      return parsed.clamp(0, 1);
    }

    return MaterialSupplier(
      id: json['id']?.toString() ?? 'supplier-${json.hashCode}',
      name: json['name']?.toString() ?? 'Supplier',
      tier: json['tier']?.toString() ?? 'Partner',
      leadTimeDays: json['leadTimeDays'] is num
          ? (json['leadTimeDays'] as num).toDouble()
          : double.tryParse(json['leadTimeDays']?.toString() ?? json['lead_time_days']?.toString() ?? ''),
      reliability: parseRatio(json['reliability']),
      annualSpend: json['annualSpend'] is num
          ? (json['annualSpend'] as num).toDouble()
          : double.tryParse(json['annualSpend']?.toString() ?? json['annual_spend']?.toString() ?? '') ?? 0,
      carbonScore: json['carbonScore'] is num
          ? (json['carbonScore'] as num).toDouble()
          : double.tryParse(json['carbonScore']?.toString() ?? json['carbon_score']?.toString() ?? ''),
    );
  }
}

class MaterialLogisticsStep {
  const MaterialLogisticsStep({
    required this.id,
    required this.label,
    required this.status,
    required this.detail,
    this.eta,
  });

  final String id;
  final String label;
  final String status;
  final String detail;
  final DateTime? eta;

  factory MaterialLogisticsStep.fromJson(Map<String, dynamic> json) {
    return MaterialLogisticsStep(
      id: json['id']?.toString() ?? 'step-${json.hashCode}',
      label: json['label']?.toString() ?? 'Milestone',
      status: json['status']?.toString() ?? 'scheduled',
      detail: json['detail']?.toString() ?? json['description']?.toString() ?? '',
      eta: DateTime.tryParse(json['eta']?.toString() ?? json['expectedAt']?.toString() ?? ''),
    );
  }
}

class MaterialComplianceInsights {
  const MaterialComplianceInsights({
    required this.passingRate,
    required this.upcomingAudits,
    required this.expiringCertifications,
  });

  final double passingRate;
  final int upcomingAudits;
  final List<MaterialCertificationExpiry> expiringCertifications;

  factory MaterialComplianceInsights.fromJson(Map<String, dynamic> json) {
    final certifications = (json['expiringCertifications'] as List<dynamic>? ?? const [])
        .map((item) => MaterialCertificationExpiry.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    double parseRatio(dynamic value) {
      if (value is num) {
        final ratio = value.toDouble();
        if (ratio > 1 && ratio <= 100) {
          return (ratio / 100).clamp(0, 1).toDouble();
        }
        return ratio.clamp(0, 1);
      }
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed == null) return 1;
      if (parsed > 1 && parsed <= 100) {
        return (parsed / 100).clamp(0, 1).toDouble();
      }
      return parsed.clamp(0, 1);
    }

    return MaterialComplianceInsights(
      passingRate: parseRatio(json['passingRate'] ?? json['passRate']),
      upcomingAudits:
          json['upcomingAudits'] is num ? (json['upcomingAudits'] as num).toInt() : int.tryParse(json['upcomingAudits']?.toString() ?? '') ?? 0,
      expiringCertifications: certifications,
    );
  }
}

class MaterialCertificationExpiry {
  const MaterialCertificationExpiry({
    required this.name,
    this.expiresAt,
  });

  final String name;
  final DateTime? expiresAt;

  factory MaterialCertificationExpiry.fromJson(Map<String, dynamic> json) {
    return MaterialCertificationExpiry(
      name: json['name']?.toString() ?? 'Certification',
      expiresAt: DateTime.tryParse(json['expiresAt']?.toString() ?? json['expiry']?.toString() ?? ''),
    );
  }
}

class MaterialSustainabilityInsights {
  const MaterialSustainabilityInsights({
    required this.recycledShare,
    required this.co2SavingsTons,
    required this.initiatives,
  });

  final double recycledShare;
  final double co2SavingsTons;
  final List<String> initiatives;

  factory MaterialSustainabilityInsights.fromJson(Map<String, dynamic> json) {
    double parseRatio(dynamic value) {
      if (value is num) {
        final ratio = value.toDouble();
        if (ratio > 1 && ratio <= 100) {
          return (ratio / 100).clamp(0, 1).toDouble();
        }
        return ratio.clamp(0, 1);
      }
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed == null) return 0;
      if (parsed > 1 && parsed <= 100) {
        return (parsed / 100).clamp(0, 1).toDouble();
      }
      return parsed.clamp(0, 1);
    }

    return MaterialSustainabilityInsights(
      recycledShare: parseRatio(json['recycledShare'] ?? json['recycled']),
      co2SavingsTons:
          json['co2SavingsTons'] is num ? (json['co2SavingsTons'] as num).toDouble() : double.tryParse(json['co2SavingsTons']?.toString() ?? json['co2']?.toString() ?? '') ?? 0,
      initiatives: (json['initiatives'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .where((item) => item.isNotEmpty)
          .toList(),
    );
  }
}

class MaterialInsights {
  const MaterialInsights({
    required this.compliance,
    required this.sustainability,
  });

  final MaterialComplianceInsights compliance;
  final MaterialSustainabilityInsights sustainability;

  factory MaterialInsights.fromJson(Map<String, dynamic> json) {
    return MaterialInsights(
      compliance: MaterialComplianceInsights.fromJson(Map<String, dynamic>.from(json['compliance'] as Map? ?? const {})),
      sustainability:
          MaterialSustainabilityInsights.fromJson(Map<String, dynamic>.from(json['sustainability'] as Map? ?? const {})),
    );
  }
}

class MaterialsShowcaseSnapshot {
  const MaterialsShowcaseSnapshot({
    required this.generatedAt,
    required this.hero,
    required this.stats,
    required this.categories,
    required this.inventory,
    required this.featured,
    required this.collections,
    required this.suppliers,
    required this.logistics,
    required this.insights,
    required this.offline,
  });

  final DateTime generatedAt;
  final MaterialHeroModel hero;
  final MaterialStats stats;
  final List<MaterialCategoryShare> categories;
  final List<MaterialInventoryItem> inventory;
  final List<MaterialInventoryItem> featured;
  final List<MaterialCollection> collections;
  final List<MaterialSupplier> suppliers;
  final List<MaterialLogisticsStep> logistics;
  final MaterialInsights insights;
  final bool offline;

  factory MaterialsShowcaseSnapshot.fromJson(Map<String, dynamic> json, {bool offline = false}) {
    final hero = MaterialHeroModel.fromJson(Map<String, dynamic>.from(json['hero'] as Map? ?? const {}));
    final stats = MaterialStats.fromJson(Map<String, dynamic>.from(json['stats'] as Map? ?? const {}));
    final categories = (json['categories'] as List<dynamic>? ?? const [])
        .map((item) => MaterialCategoryShare.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList()
      ..sort((a, b) => b.share.compareTo(a.share));
    final inventory = (json['inventory'] as List<dynamic>? ?? const [])
        .map((item) => MaterialInventoryItem.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final featured = (json['featured'] as List<dynamic>? ?? const [])
        .map((item) => MaterialInventoryItem.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final collections = (json['collections'] as List<dynamic>? ?? const [])
        .map((item) => MaterialCollection.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final suppliers = (json['suppliers'] as List<dynamic>? ?? const [])
        .map((item) => MaterialSupplier.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final logistics = (json['logistics'] as List<dynamic>? ?? const [])
        .map((item) => MaterialLogisticsStep.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final insights = MaterialInsights.fromJson(Map<String, dynamic>.from(json['insights'] as Map? ?? const {}));

    return MaterialsShowcaseSnapshot(
      generatedAt: DateTime.tryParse(json['generatedAt']?.toString() ?? '') ?? DateTime.now(),
      hero: hero,
      stats: stats,
      categories: categories,
      inventory: inventory,
      featured: featured.isNotEmpty ? featured : inventory.take(4).toList(),
      collections: collections,
      suppliers: suppliers,
      logistics: logistics,
      insights: insights,
      offline: offline,
    );
  }
}
