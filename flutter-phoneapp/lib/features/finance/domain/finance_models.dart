import 'package:equatable/equatable.dart';

class FinanceTotals extends Equatable {
  const FinanceTotals({
    required this.captured,
    required this.refunded,
    required this.outstandingInvoices,
    required this.pendingPayouts,
  });

  factory FinanceTotals.fromJson(Map<String, dynamic> json) {
    return FinanceTotals(
      captured: (json['captured'] as num?)?.toDouble() ?? 0,
      refunded: (json['refunded'] as num?)?.toDouble() ?? 0,
      outstandingInvoices: json['outstandingInvoices'] as int? ?? 0,
      pendingPayouts: json['pendingPayouts'] as int? ?? 0,
    );
  }

  final double captured;
  final double refunded;
  final int outstandingInvoices;
  final int pendingPayouts;

  @override
  List<Object?> get props => [captured, refunded, outstandingInvoices, pendingPayouts];
}

class FinancePayment extends Equatable {
  const FinancePayment({
    required this.id,
    required this.orderId,
    required this.status,
    required this.amount,
    required this.currency,
    this.capturedAt,
  });

  factory FinancePayment.fromJson(Map<String, dynamic> json) {
    return FinancePayment(
      id: json['id'] as String? ?? '',
      orderId: json['orderId'] as String? ?? json['order_id'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'GBP',
      capturedAt: json['capturedAt'] != null
          ? DateTime.tryParse(json['capturedAt'] as String)
          : json['captured_at'] != null
              ? DateTime.tryParse(json['captured_at'] as String)
              : null,
    );
  }

  final String id;
  final String orderId;
  final String status;
  final double amount;
  final String currency;
  final DateTime? capturedAt;

  @override
  List<Object?> get props => [id, orderId, status, amount, currency, capturedAt];
}

class FinancePayout extends Equatable {
  const FinancePayout({
    required this.id,
    required this.amount,
    required this.currency,
    required this.status,
    this.scheduledFor,
  });

  factory FinancePayout.fromJson(Map<String, dynamic> json) {
    return FinancePayout(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'GBP',
      status: json['status'] as String? ?? 'pending',
      scheduledFor: json['scheduledFor'] != null
          ? DateTime.tryParse(json['scheduledFor'] as String)
          : json['scheduled_for'] != null
              ? DateTime.tryParse(json['scheduled_for'] as String)
              : null,
    );
  }

  final String id;
  final double amount;
  final String currency;
  final String status;
  final DateTime? scheduledFor;

  @override
  List<Object?> get props => [id, amount, currency, status, scheduledFor];
}

class FinanceInvoice extends Equatable {
  const FinanceInvoice({
    required this.id,
    required this.invoiceNumber,
    required this.status,
    required this.amountDue,
    required this.currency,
  });

  factory FinanceInvoice.fromJson(Map<String, dynamic> json) {
    return FinanceInvoice(
      id: json['id'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? json['invoice_number'] as String? ?? '',
      status: json['status'] as String? ?? 'draft',
      amountDue: (json['amountDue'] as num?)?.toDouble() ??
          (json['amount_due'] as num?)?.toDouble() ??
          0,
      currency: json['currency'] as String? ?? 'GBP',
    );
  }

  final String id;
  final String invoiceNumber;
  final String status;
  final double amountDue;
  final String currency;

  @override
  List<Object?> get props => [id, invoiceNumber, status, amountDue, currency];
}

class FinanceDispute extends Equatable {
  const FinanceDispute({
    required this.id,
    required this.status,
    this.reason,
    this.openedAt,
  });

  factory FinanceDispute.fromJson(Map<String, dynamic> json) {
    return FinanceDispute(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'open',
      reason: json['reason'] as String?,
      openedAt: json['openedAt'] != null
          ? DateTime.tryParse(json['openedAt'] as String)
          : json['opened_at'] != null
              ? DateTime.tryParse(json['opened_at'] as String)
              : null,
    );
  }

  final String id;
  final String status;
  final String? reason;
  final DateTime? openedAt;

  @override
  List<Object?> get props => [id, status, reason, openedAt];
}

class FinanceOverview extends Equatable {
  const FinanceOverview({
    required this.totals,
    required this.payments,
    required this.payouts,
    required this.invoices,
    required this.disputes,
  });

  factory FinanceOverview.fromJson(Map<String, dynamic> json) {
    final totals = FinanceTotals.fromJson(Map<String, dynamic>.from(json['totals'] as Map? ?? {}));
    final payments = (json['payments'] as List<dynamic>? ?? [])
        .map((item) => FinancePayment.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final payouts = (json['payouts'] as List<dynamic>? ?? [])
        .map((item) => FinancePayout.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final invoices = (json['invoices'] as List<dynamic>? ?? [])
        .map((item) => FinanceInvoice.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final disputes = (json['disputes'] as List<dynamic>? ?? [])
        .map((item) => FinanceDispute.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();

    return FinanceOverview(
      totals: totals,
      payments: payments,
      payouts: payouts,
      invoices: invoices,
      disputes: disputes,
    );
  }

  final FinanceTotals totals;
  final List<FinancePayment> payments;
  final List<FinancePayout> payouts;
  final List<FinanceInvoice> invoices;
  final List<FinanceDispute> disputes;

  @override
  List<Object?> get props => [totals, payments, payouts, invoices, disputes];
}

class FinanceHistoryEvent extends Equatable {
  const FinanceHistoryEvent({
    required this.eventType,
    this.occurredAt,
    this.snapshot,
  });

  factory FinanceHistoryEvent.fromJson(Map<String, dynamic> json) {
    return FinanceHistoryEvent(
      eventType: json['eventType'] as String? ?? json['event_type'] as String? ?? 'unknown',
      occurredAt: json['occurredAt'] != null
          ? DateTime.tryParse(json['occurredAt'] as String)
          : json['occurred_at'] != null
              ? DateTime.tryParse(json['occurred_at'] as String)
              : null,
      snapshot: json['snapshot'] is Map ? Map<String, dynamic>.from(json['snapshot'] as Map) : null,
    );
  }

  final String eventType;
  final DateTime? occurredAt;
  final Map<String, dynamic>? snapshot;

  @override
  List<Object?> get props => [eventType, occurredAt, snapshot];
}

class FinanceTimeline extends Equatable {
  const FinanceTimeline({
    required this.orderId,
    required this.history,
    this.escrowStatus,
    this.invoiceStatus,
    this.invoiceAmount,
    this.currency,
    this.disputes,
  });

  factory FinanceTimeline.fromJson(Map<String, dynamic> json) {
    final order = json['order'] as Map? ?? {};
    final invoice = json['invoice'] as Map? ?? {};
    return FinanceTimeline(
      orderId: order['id'] as String? ?? '',
      history: (json['history'] as List<dynamic>? ?? [])
          .map((item) => FinanceHistoryEvent.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      escrowStatus: (json['escrow'] as Map?)?['status'] as String?,
      invoiceStatus: invoice['status'] as String?,
      invoiceAmount: (invoice['amountDue'] as num?)?.toDouble() ??
          (invoice['amount_due'] as num?)?.toDouble(),
      currency: invoice['currency'] as String? ?? 'GBP',
      disputes: (json['disputes'] as List<dynamic>? ?? [])
          .map((item) => FinanceDispute.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  final String orderId;
  final List<FinanceHistoryEvent> history;
  final String? escrowStatus;
  final String? invoiceStatus;
  final double? invoiceAmount;
  final String? currency;
  final List<FinanceDispute> disputes;

  @override
  List<Object?> get props => [orderId, history, escrowStatus, invoiceStatus, invoiceAmount, currency, disputes];
}
