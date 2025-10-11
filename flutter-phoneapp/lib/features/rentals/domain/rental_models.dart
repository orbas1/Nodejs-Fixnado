class RentalAgreementModel {
  RentalAgreementModel({
    required this.id,
    required this.rentalNumber,
    required this.itemId,
    required this.companyId,
    required this.renterId,
    required this.status,
    required this.depositStatus,
    required this.quantity,
    required this.meta,
    required this.conditionOut,
    required this.conditionIn,
    required this.timeline,
    this.marketplaceItemId,
    this.bookingId,
    this.rentalStartAt,
    this.rentalEndAt,
    this.pickupAt,
    this.returnDueAt,
    this.returnedAt,
    this.depositAmount,
    this.depositCurrency,
    this.dailyRate,
    this.rateCurrency,
    this.cancellationReason,
    this.lastStatusTransitionAt,
  });

  final String id;
  final String rentalNumber;
  final String itemId;
  final String? marketplaceItemId;
  final String companyId;
  final String renterId;
  final String? bookingId;
  final String status;
  final String depositStatus;
  final int quantity;
  final DateTime? rentalStartAt;
  final DateTime? rentalEndAt;
  final DateTime? pickupAt;
  final DateTime? returnDueAt;
  final DateTime? returnedAt;
  final double? depositAmount;
  final String? depositCurrency;
  final double? dailyRate;
  final String? rateCurrency;
  final Map<String, dynamic> conditionOut;
  final Map<String, dynamic> conditionIn;
  final Map<String, dynamic> meta;
  final String? cancellationReason;
  final DateTime? lastStatusTransitionAt;
  final List<RentalCheckpointModel> timeline;

  factory RentalAgreementModel.fromJson(Map<String, dynamic> json) {
    return RentalAgreementModel(
      id: json['id'] as String,
      rentalNumber: json['rentalNumber'] as String,
      itemId: json['itemId'] as String,
      marketplaceItemId: json['marketplaceItemId'] as String?,
      companyId: json['companyId'] as String,
      renterId: json['renterId'] as String,
      bookingId: json['bookingId'] as String?,
      status: json['status'] as String,
      depositStatus: json['depositStatus'] as String,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      rentalStartAt: json['rentalStartAt'] != null ? DateTime.parse(json['rentalStartAt'] as String) : null,
      rentalEndAt: json['rentalEndAt'] != null ? DateTime.parse(json['rentalEndAt'] as String) : null,
      pickupAt: json['pickupAt'] != null ? DateTime.parse(json['pickupAt'] as String) : null,
      returnDueAt: json['returnDueAt'] != null ? DateTime.parse(json['returnDueAt'] as String) : null,
      returnedAt: json['returnedAt'] != null ? DateTime.parse(json['returnedAt'] as String) : null,
      depositAmount: _toDouble(json['depositAmount']),
      depositCurrency: json['depositCurrency'] as String?,
      dailyRate: _toDouble(json['dailyRate']),
      rateCurrency: json['rateCurrency'] as String?,
      conditionOut: Map<String, dynamic>.from(json['conditionOut'] as Map? ?? {}),
      conditionIn: Map<String, dynamic>.from(json['conditionIn'] as Map? ?? {}),
      meta: Map<String, dynamic>.from(json['meta'] as Map? ?? {}),
      cancellationReason: json['cancellationReason'] as String?,
      lastStatusTransitionAt: json['lastStatusTransitionAt'] != null
          ? DateTime.parse(json['lastStatusTransitionAt'] as String)
          : null,
      timeline: (json['timeline'] as List<dynamic>? ?? [])
          .map((item) => RentalCheckpointModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'rentalNumber': rentalNumber,
        'itemId': itemId,
        'marketplaceItemId': marketplaceItemId,
        'companyId': companyId,
        'renterId': renterId,
        'bookingId': bookingId,
        'status': status,
        'depositStatus': depositStatus,
        'quantity': quantity,
        'rentalStartAt': rentalStartAt?.toIso8601String(),
        'rentalEndAt': rentalEndAt?.toIso8601String(),
        'pickupAt': pickupAt?.toIso8601String(),
        'returnDueAt': returnDueAt?.toIso8601String(),
        'returnedAt': returnedAt?.toIso8601String(),
        'depositAmount': depositAmount,
        'depositCurrency': depositCurrency,
        'dailyRate': dailyRate,
        'rateCurrency': rateCurrency,
        'conditionOut': conditionOut,
        'conditionIn': conditionIn,
        'meta': meta,
        'cancellationReason': cancellationReason,
        'lastStatusTransitionAt': lastStatusTransitionAt?.toIso8601String(),
        'timeline': timeline.map((checkpoint) => checkpoint.toJson()).toList(),
      };
}

class RentalCheckpointModel {
  RentalCheckpointModel({
    required this.id,
    required this.rentalAgreementId,
    required this.type,
    required this.description,
    required this.recordedBy,
    required this.recordedByRole,
    required this.occurredAt,
    required this.payload,
  });

  final String id;
  final String rentalAgreementId;
  final String type;
  final String description;
  final String recordedBy;
  final String recordedByRole;
  final DateTime occurredAt;
  final Map<String, dynamic> payload;

  factory RentalCheckpointModel.fromJson(Map<String, dynamic> json) {
    return RentalCheckpointModel(
      id: json['id'] as String,
      rentalAgreementId: json['rentalAgreementId'] as String? ?? json['rental_agreement_id'] as String,
      type: json['type'] as String,
      description: json['description'] as String,
      recordedBy: json['recordedBy'] as String? ?? json['recorded_by'] as String,
      recordedByRole: json['recordedByRole'] as String? ?? json['recorded_by_role'] as String,
      occurredAt: DateTime.parse(json['occurredAt'] as String? ?? json['occurred_at'] as String),
      payload: Map<String, dynamic>.from(json['payload'] as Map? ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'rentalAgreementId': rentalAgreementId,
        'type': type,
        'description': description,
        'recordedBy': recordedBy,
        'recordedByRole': recordedByRole,
        'occurredAt': occurredAt.toIso8601String(),
        'payload': payload,
      };
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
