import 'package:equatable/equatable.dart';

class WarehouseExportRun extends Equatable {
  const WarehouseExportRun({
    required this.id,
    required this.dataset,
    required this.status,
    required this.rowCount,
    this.regionCode,
    this.runStartedAt,
    this.runFinishedAt,
    this.filePath,
  });

  final String id;
  final String dataset;
  final String status;
  final int rowCount;
  final String? regionCode;
  final DateTime? runStartedAt;
  final DateTime? runFinishedAt;
  final String? filePath;

  factory WarehouseExportRun.fromJson(Map<String, dynamic> json) {
    return WarehouseExportRun(
      id: json['id'] as String,
      dataset: json['dataset'] as String,
      status: json['status'] as String,
      rowCount: (json['rowCount'] ?? json['row_count'] ?? 0) is int
          ? json['rowCount'] ?? json['row_count'] as int
          : int.tryParse('${json['rowCount'] ?? json['row_count'] ?? 0}') ?? 0,
      regionCode: json['region'] is Map ? (json['region']['code'] as String?) : json['regionCode'] as String?,
      runStartedAt: json['runStartedAt'] != null
          ? DateTime.tryParse(json['runStartedAt'] as String)
          : (json['run_started_at'] != null ? DateTime.tryParse(json['run_started_at'] as String) : null),
      runFinishedAt: json['runFinishedAt'] != null
          ? DateTime.tryParse(json['runFinishedAt'] as String)
          : (json['run_finished_at'] != null ? DateTime.tryParse(json['run_finished_at'] as String) : null),
      filePath: json['filePath'] as String? ?? json['file_path'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, dataset, status, rowCount, regionCode, runStartedAt, runFinishedAt, filePath];
}
