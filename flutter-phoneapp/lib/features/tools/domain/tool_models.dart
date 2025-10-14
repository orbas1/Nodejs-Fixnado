import 'package:equatable/equatable.dart';

class ToolInventoryItem extends Equatable {
  const ToolInventoryItem({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.utilisation,
    required this.availability,
    required this.status,
    required this.rentalRate,
    required this.currency,
    required this.nextService,
    required this.compliance,
    required this.depot,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final double utilisation;
  final double availability;
  final ToolStatus status;
  final double? rentalRate;
  final String currency;
  final DateTime nextService;
  final List<String> compliance;
  final String depot;

  String get rentalLabel {
    if (rentalRate == null) {
      return 'Included in contract';
    }
    return '${currency.toUpperCase()} ${rentalRate!.toStringAsFixed(0)} / day';
  }

  String get nextServiceLabel => '${nextService.day.toString().padLeft(2, '0')}/${nextService.month.toString().padLeft(2, '0')}/${nextService.year}';

  @override
  List<Object?> get props => [
        id,
        name,
        category,
        description,
        utilisation,
        availability,
        status,
        rentalRate,
        currency,
        nextService,
        compliance,
        depot,
      ];
}

class ToolInventorySnapshot extends Equatable {
  const ToolInventorySnapshot({
    required this.items,
    required this.generatedAt,
    required this.offline,
    required this.uptime,
    required this.readyCount,
    required this.totalCount,
  });

  final List<ToolInventoryItem> items;
  final DateTime generatedAt;
  final bool offline;
  final double uptime;
  final int readyCount;
  final int totalCount;

  @override
  List<Object?> get props => [items, generatedAt, offline, uptime, readyCount, totalCount];
}

enum ToolStatus { calibrated, maintenanceDue, retired, inService }

extension ToolStatusLabel on ToolStatus {
  String get label {
    switch (this) {
      case ToolStatus.calibrated:
        return 'Calibrated';
      case ToolStatus.maintenanceDue:
        return 'Maintenance due';
      case ToolStatus.retired:
        return 'Retired';
      case ToolStatus.inService:
        return 'In service';
    }
  }

  String get tone {
    switch (this) {
      case ToolStatus.calibrated:
        return 'success';
      case ToolStatus.maintenanceDue:
        return 'warning';
      case ToolStatus.retired:
        return 'danger';
      case ToolStatus.inService:
        return 'neutral';
    }
  }
}

class ToolAccessDenied implements Exception {
  ToolAccessDenied(this.message);

  final String message;

  @override
  String toString() => message;
}
