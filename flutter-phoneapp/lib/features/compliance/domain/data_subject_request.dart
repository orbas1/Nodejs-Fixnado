import 'package:equatable/equatable.dart';

class DataSubjectRequest extends Equatable {
  const DataSubjectRequest({
    required this.id,
    required this.subjectEmail,
    required this.requestType,
    required this.status,
    required this.requestedAt,
    this.processedAt,
    this.payloadLocation,
    this.regionCode,
    this.auditTrail,
  });

  factory DataSubjectRequest.fromJson(Map<String, dynamic> json) {
    return DataSubjectRequest(
      id: json['id'] as String,
      subjectEmail: json['subject_email'] as String? ?? json['subjectEmail'] as String? ?? '',
      requestType: json['request_type'] as String? ?? json['requestType'] as String? ?? 'access',
      status: json['status'] as String? ?? 'received',
      requestedAt: _parseRequiredDate(json['requested_at'] ?? json['requestedAt']),
      processedAt: _parseOptionalDate(json['processed_at'] ?? json['processedAt']),
      payloadLocation: json['payload_location'] as String? ?? json['payloadLocation'] as String?,
      regionCode: (json['region'] is Map)
          ? (json['region']['code'] as String?)
          : json['region_id'] as String? ?? json['regionCode'] as String?,
      auditTrail: (json['audit_log'] as List?)?.map((entry) => Map<String, dynamic>.from(entry as Map)).toList() ??
          (json['auditLog'] as List?)?.map((entry) => Map<String, dynamic>.from(entry as Map)).toList(),
    );
  }

  final String id;
  final String subjectEmail;
  final String requestType;
  final String status;
  final DateTime requestedAt;
  final DateTime? processedAt;
  final String? payloadLocation;
  final String? regionCode;
  final List<Map<String, dynamic>>? auditTrail;

  DataSubjectRequest copyWith({
    String? status,
    DateTime? processedAt,
    String? payloadLocation,
    List<Map<String, dynamic>>? auditTrail,
  }) {
    return DataSubjectRequest(
      id: id,
      subjectEmail: subjectEmail,
      requestType: requestType,
      status: status ?? this.status,
      requestedAt: requestedAt,
      processedAt: processedAt ?? this.processedAt,
      payloadLocation: payloadLocation ?? this.payloadLocation,
      regionCode: regionCode,
      auditTrail: auditTrail ?? this.auditTrail,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'subjectEmail': subjectEmail,
      'requestType': requestType,
      'status': status,
      'requestedAt': requestedAt.toIso8601String(),
      if (processedAt != null) 'processedAt': processedAt!.toIso8601String(),
      if (payloadLocation != null) 'payloadLocation': payloadLocation,
      if (regionCode != null) 'regionCode': regionCode,
      if (auditTrail != null) 'auditLog': auditTrail,
    };
  }

  @override
  List<Object?> get props => [id, subjectEmail, requestType, status, requestedAt, processedAt, payloadLocation, regionCode];
}

DateTime _parseRequiredDate(Object? value) {
  if (value is DateTime) {
    return value.toUtc();
  }
  final parsed = DateTime.tryParse(value?.toString() ?? '');
  return (parsed ?? DateTime.now()).toUtc();
}

DateTime? _parseOptionalDate(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is DateTime) {
    return value.toUtc();
  }
  return DateTime.tryParse(value.toString())?.toUtc();
}
