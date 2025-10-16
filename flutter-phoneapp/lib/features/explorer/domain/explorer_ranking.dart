import 'dart:math' as math;

import 'models.dart';

String _normalise(String? value) => value?.toLowerCase().trim() ?? '';

double _textMatchScore(String? source, String term) {
  final normalised = _normalise(source);
  if (term.isEmpty || normalised.isEmpty) {
    return 0;
  }
  if (normalised.contains(term)) {
    return 1;
  }
  final tokens = normalised.split(RegExp(r'[^a-z0-9]+')).where((token) => token.isNotEmpty).toList();
  if (tokens.isEmpty) {
    return 0;
  }
  final matches = tokens.where((token) => token.startsWith(term)).length;
  return matches / tokens.length;
}

double _demandWeight(String? level) {
  switch (_normalise(level)) {
    case 'high':
      return 0.18;
    case 'medium':
      return 0.12;
    case 'low':
      return 0.06;
    default:
      return 0.1;
  }
}

double _safeLog10(double value) {
  return math.log(value) / math.log(10);
}

double _serviceScore(
  ExplorerService service, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) {
  var score = 0.4;
  final zoneCompanyId = selectedZone?.companyId;
  if (zoneCompanyId != null && zoneCompanyId.isNotEmpty && service.companyId == zoneCompanyId) {
    score += 0.32 + _demandWeight(selectedZone?.demandLevel);
  }

  final compliance = service.complianceScore;
  if (compliance != null && compliance.isFinite) {
    score += math.min(1, compliance / 100) * 0.22;
  }

  final price = service.price;
  if (price != null && price > 0) {
    final normalised = math.min(1, 1 / _safeLog10(price + 10));
    score += normalised * 0.1;
  } else {
    score -= 0.02;
  }

  if (service.tags.isNotEmpty) {
    score += math.min(0.08, service.tags.length * 0.02);
  }

  final term = _normalise(filters?.term);
  if (term.isNotEmpty) {
    final match = _textMatchScore('${service.title} ${service.description ?? ''}', term);
    score += match * 0.15;
  }

  return score;
}

double _marketplaceScore(
  ExplorerMarketplaceItem item, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) {
  var score = 0.35;
  final zoneCompanyId = selectedZone?.companyId;
  if (zoneCompanyId != null && zoneCompanyId.isNotEmpty && item.companyId == zoneCompanyId) {
    score += 0.28 + _demandWeight(selectedZone?.demandLevel);
  }

  final status = _normalise(item.status);
  if (status.contains('approved') || status.contains('live')) {
    score += 0.12;
  } else if (status.contains('hold') || status.contains('pending')) {
    score -= 0.06;
  }

  if (item.supportsRental) {
    score += 0.07;
  }

  final availabilityFilter = _normalise(filters?.availability);
  if (availabilityFilter.isNotEmpty && availabilityFilter != 'any') {
    final availability = _normalise(item.availability);
    if (availability.contains(availabilityFilter) || (availabilityFilter == 'rent' && item.supportsRental)) {
      score += 0.1;
    } else {
      score -= 0.08;
    }
  }

  final pricePerDay = item.pricePerDay;
  if (pricePerDay != null && pricePerDay > 0) {
    final normalised = math.min(1, 1 / _safeLog10(pricePerDay + 10));
    score += normalised * 0.08;
  }

  final purchasePrice = item.purchasePrice;
  if (purchasePrice != null && purchasePrice > 0) {
    final normalised = math.min(1, 1 / _safeLog10(purchasePrice + 25));
    score += normalised * 0.05;
  }

  if (item.insuredOnly) {
    score += 0.03;
  }

  final term = _normalise(filters?.term);
  if (term.isNotEmpty) {
    final match = _textMatchScore('${item.title} ${item.description ?? ''}', term);
    score += match * 0.12;
  }

  return score;
}

List<ExplorerService> rankExplorerServices(
  Iterable<ExplorerService> services, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) {
  final scored = services.toList()
    ..sort(
      (a, b) =>
          _serviceScore(b, selectedZone: selectedZone, filters: filters).compareTo(
            _serviceScore(a, selectedZone: selectedZone, filters: filters),
          ),
    );
  return scored;
}

List<ExplorerMarketplaceItem> rankExplorerMarketplaceItems(
  Iterable<ExplorerMarketplaceItem> items, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) {
  final scored = items.toList()
    ..sort(
      (a, b) =>
          _marketplaceScore(b, selectedZone: selectedZone, filters: filters).compareTo(
            _marketplaceScore(a, selectedZone: selectedZone, filters: filters),
          ),
    );
  return scored;
}

double scoreExplorerService(
  ExplorerService service, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) =>
    _serviceScore(service, selectedZone: selectedZone, filters: filters);

double scoreExplorerMarketplaceItem(
  ExplorerMarketplaceItem item, {
  ZoneSummary? selectedZone,
  ExplorerFilters? filters,
}) =>
    _marketplaceScore(item, selectedZone: selectedZone, filters: filters);
