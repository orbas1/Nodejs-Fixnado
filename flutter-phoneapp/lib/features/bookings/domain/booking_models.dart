class BookingModel {
  BookingModel({
    required this.id,
    required this.customerId,
    required this.companyId,
    required this.zoneId,
    required this.status,
    required this.type,
    required this.createdAt,
    required this.slaExpiresAt,
    required this.totalAmount,
    required this.currency,
    required this.meta,
    this.scheduledStart,
    this.scheduledEnd,
    this.assignments = const [],
    this.bids = const [],
  });

  final String id;
  final String customerId;
  final String companyId;
  final String zoneId;
  final String status;
  final String type;
  final DateTime createdAt;
  final DateTime slaExpiresAt;
  final DateTime? scheduledStart;
  final DateTime? scheduledEnd;
  final double totalAmount;
  final String currency;
  final Map<String, dynamic> meta;
  final List<BookingAssignment> assignments;
  final List<BookingBidModel> bids;

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      companyId: json['companyId'] as String,
      zoneId: json['zoneId'] as String,
      status: json['status'] as String,
      type: json['type'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      slaExpiresAt: DateTime.parse(json['slaExpiresAt'] as String),
      scheduledStart: json['scheduledStart'] != null ? DateTime.parse(json['scheduledStart'] as String) : null,
      scheduledEnd: json['scheduledEnd'] != null ? DateTime.parse(json['scheduledEnd'] as String) : null,
      totalAmount: _toDouble(json['totalAmount']) ?? 0,
      currency: (json['currency'] as String?) ?? 'USD',
      meta: Map<String, dynamic>.from(json['meta'] as Map? ?? {}),
      assignments: (json['BookingAssignments'] as List<dynamic>? ?? json['assignments'] as List<dynamic>? ?? [])
          .map((item) => BookingAssignment.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      bids: (json['BookingBids'] as List<dynamic>? ?? json['bids'] as List<dynamic>? ?? [])
          .map((item) => BookingBidModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'companyId': companyId,
      'zoneId': zoneId,
      'status': status,
      'type': type,
      'createdAt': createdAt.toIso8601String(),
      'slaExpiresAt': slaExpiresAt.toIso8601String(),
      'scheduledStart': scheduledStart?.toIso8601String(),
      'scheduledEnd': scheduledEnd?.toIso8601String(),
      'totalAmount': totalAmount,
      'currency': currency,
      'meta': meta,
      'assignments': assignments.map((assignment) => assignment.toJson()).toList(),
      'bids': bids.map((bid) => bid.toJson()).toList(),
    };
  }
}

class BookingAssignment {
  BookingAssignment({
    required this.id,
    required this.bookingId,
    required this.providerId,
    required this.role,
    required this.status,
    required this.assignedAt,
    this.acknowledgedAt,
  });

  final String id;
  final String bookingId;
  final String providerId;
  final String role;
  final String status;
  final DateTime assignedAt;
  final DateTime? acknowledgedAt;

  factory BookingAssignment.fromJson(Map<String, dynamic> json) {
    return BookingAssignment(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      providerId: json['providerId'] as String,
      role: json['role'] as String? ?? 'support',
      status: json['status'] as String? ?? 'pending',
      assignedAt: DateTime.parse(json['assignedAt'] as String),
      acknowledgedAt: json['acknowledgedAt'] != null ? DateTime.parse(json['acknowledgedAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'providerId': providerId,
      'role': role,
      'status': status,
      'assignedAt': assignedAt.toIso8601String(),
      'acknowledgedAt': acknowledgedAt?.toIso8601String(),
    };
  }
}

class BookingBidModel {
  BookingBidModel({
    required this.id,
    required this.bookingId,
    required this.providerId,
    required this.amount,
    required this.currency,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
  });

  final String id;
  final String bookingId;
  final String providerId;
  final double amount;
  final String currency;
  final String status;
  final DateTime submittedAt;
  final DateTime updatedAt;

  factory BookingBidModel.fromJson(Map<String, dynamic> json) {
    return BookingBidModel(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      providerId: json['providerId'] as String,
      amount: _toDouble(json['amount']) ?? 0,
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'pending',
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'providerId': providerId,
      'amount': amount,
      'currency': currency,
      'status': status,
      'submittedAt': submittedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class CreateBookingRequest {
  CreateBookingRequest({
    required this.customerId,
    required this.companyId,
    required this.zoneId,
    required this.type,
    required this.currency,
    required this.baseAmount,
    this.demandLevel,
    this.scheduledStart,
    this.scheduledEnd,
    this.metadata = const {},
  });

  final String customerId;
  final String companyId;
  final String zoneId;
  final String type;
  final String currency;
  final double baseAmount;
  final String? demandLevel;
  final DateTime? scheduledStart;
  final DateTime? scheduledEnd;
  final Map<String, dynamic> metadata;

  Map<String, dynamic> toJson() {
    return {
      'customerId': customerId,
      'companyId': companyId,
      'zoneId': zoneId,
      'type': type,
      'currency': currency,
      'baseAmount': baseAmount,
      if (demandLevel != null) 'demandLevel': demandLevel,
      if (scheduledStart != null) 'scheduledStart': scheduledStart!.toUtc().toIso8601String(),
      if (scheduledEnd != null) 'scheduledEnd': scheduledEnd!.toUtc().toIso8601String(),
      if (metadata.isNotEmpty) 'metadata': metadata,
    };
  }
}

double? _toDouble(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}
