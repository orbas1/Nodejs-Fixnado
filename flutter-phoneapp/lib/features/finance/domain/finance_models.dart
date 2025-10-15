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

class FinanceReportTimelinePoint extends Equatable {
  const FinanceReportTimelinePoint({
    required this.date,
    required this.currency,
    required this.captured,
    required this.payouts,
    required this.refunded,
    required this.disputes,
  });

  factory FinanceReportTimelinePoint.fromJson(Map<String, dynamic> json) {
    return FinanceReportTimelinePoint(
      date: json['date'] as String? ?? '',
      currency: json['currency'] as String? ?? 'GBP',
      captured: (json['captured'] as num?)?.toDouble() ?? 0,
      payouts: (json['payouts'] as num?)?.toDouble() ?? 0,
      refunded: (json['refunded'] as num?)?.toDouble() ?? 0,
      disputes: (json['disputes'] as num?)?.toDouble() ?? 0,
    );
  }

  final String date;
  final String currency;
  final double captured;
  final double payouts;
  final double refunded;
  final double disputes;

  @override
  List<Object?> get props => [date, currency, captured, payouts, refunded, disputes];
}

class FinanceReportCurrencyBucket extends Equatable {
  const FinanceReportCurrencyBucket({
    required this.currency,
    required this.captured,
    required this.refunded,
    required this.disputedVolume,
    required this.payoutsSettled,
    required this.pending,
  });

  factory FinanceReportCurrencyBucket.fromJson(String currency, Map<String, dynamic> json) {
    return FinanceReportCurrencyBucket(
      currency: currency,
      captured: (json['captured'] as num?)?.toDouble() ?? 0,
      refunded: (json['refunded'] as num?)?.toDouble() ?? 0,
      disputedVolume: (json['disputedVolume'] as num?)?.toDouble() ?? 0,
      payoutsSettled: (json['payoutsSettled'] as num?)?.toDouble() ?? 0,
      pending: (json['pending'] as num?)?.toDouble() ?? 0,
    );
  }

  final String currency;
  final double captured;
  final double refunded;
  final double disputedVolume;
  final double payoutsSettled;
  final double pending;

  @override
  List<Object?> get props => [currency, captured, refunded, disputedVolume, payoutsSettled, pending];
}

class FinanceReportService extends Equatable {
  const FinanceReportService({
    required this.serviceId,
    required this.serviceTitle,
    required this.capturedAmount,
    required this.disputeRate,
    required this.successfulOrders,
    required this.currency,
  });

  factory FinanceReportService.fromJson(Map<String, dynamic> json) {
    return FinanceReportService(
      serviceId: json['serviceId'] as String? ?? '',
      serviceTitle: json['serviceTitle'] as String? ?? 'Untitled service',
      capturedAmount: (json['capturedAmount'] as num?)?.toDouble() ?? 0,
      disputeRate: (json['disputeRate'] as num?)?.toDouble() ?? 0,
      successfulOrders: json['successfulOrders'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'GBP',
    );
  }

  final String serviceId;
  final String serviceTitle;
  final double capturedAmount;
  final double disputeRate;
  final int successfulOrders;
  final String currency;

  @override
  List<Object?> get props => [serviceId, serviceTitle, capturedAmount, disputeRate, successfulOrders, currency];
}

class FinanceReportInvoice extends Equatable {
  const FinanceReportInvoice({
    required this.invoiceNumber,
    required this.amountDue,
    required this.currency,
    required this.daysOverdue,
    required this.orderId,
  });

  factory FinanceReportInvoice.fromJson(Map<String, dynamic> json) {
    return FinanceReportInvoice(
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      amountDue: (json['amountDue'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'GBP',
      daysOverdue: json['daysOverdue'] as int? ?? 0,
      orderId: json['orderId'] as String? ?? '',
    );
  }

  final String invoiceNumber;
  final double amountDue;
  final String currency;
  final int daysOverdue;
  final String orderId;

  @override
  List<Object?> get props => [invoiceNumber, amountDue, currency, daysOverdue, orderId];
}

class FinancePayoutBacklog extends Equatable {
  const FinancePayoutBacklog({
    required this.totalRequests,
    required this.totalAmount,
    required this.providersImpacted,
    required this.oldestPendingDays,
  });

  factory FinancePayoutBacklog.fromJson(Map<String, dynamic> json) {
    return FinancePayoutBacklog(
      totalRequests: json['totalRequests'] as int? ?? 0,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      providersImpacted: json['providersImpacted'] as int? ?? 0,
      oldestPendingDays: json['oldestPendingDays'] as int? ?? 0,
    );
  }

  final int totalRequests;
  final double totalAmount;
  final int providersImpacted;
  final int oldestPendingDays;

  @override
  List<Object?> get props => [totalRequests, totalAmount, providersImpacted, oldestPendingDays];
}

class FinanceDisputeStats extends Equatable {
  const FinanceDisputeStats({
    required this.openDisputes,
    required this.underReview,
    required this.resolved,
    required this.totalDisputedAmount,
  });

  factory FinanceDisputeStats.fromJson(Map<String, dynamic> json) {
    return FinanceDisputeStats(
      openDisputes: json['openDisputes'] as int? ?? 0,
      underReview: json['underReview'] as int? ?? 0,
      resolved: json['resolved'] as int? ?? 0,
      totalDisputedAmount: (json['totalDisputedAmount'] as num?)?.toDouble() ?? 0,
    );
  }

  final int openDisputes;
  final int underReview;
  final int resolved;
  final double totalDisputedAmount;

  @override
  List<Object?> get props => [openDisputes, underReview, resolved, totalDisputedAmount];
}

class FinanceReport extends Equatable {
  const FinanceReport({
    required this.rangeStart,
    required this.rangeEnd,
    required this.timeline,
    required this.currencyTotals,
    required this.topServices,
    required this.outstandingInvoices,
    required this.payoutBacklog,
    required this.disputeStats,
  });

  factory FinanceReport.fromJson(Map<String, dynamic> json) {
    final timeline = (json['timeline'] as List<dynamic>? ?? [])
        .map((item) => FinanceReportTimelinePoint.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final currencyTotalsJson = Map<String, dynamic>.from(json['currencyTotals'] as Map? ?? {});
    final currencyTotals = currencyTotalsJson.entries
        .map((entry) => FinanceReportCurrencyBucket.fromJson(entry.key, Map<String, dynamic>.from(entry.value as Map)))
        .toList();
    final topServices = (json['topServices'] as List<dynamic>? ?? [])
        .map((item) => FinanceReportService.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final outstandingInvoices = (json['outstandingInvoices'] as List<dynamic>? ?? [])
        .map((item) => FinanceReportInvoice.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final payoutBacklog = json['payoutBacklog'] is Map
        ? FinancePayoutBacklog.fromJson(Map<String, dynamic>.from(json['payoutBacklog'] as Map))
        : const FinancePayoutBacklog(totalRequests: 0, totalAmount: 0, providersImpacted: 0, oldestPendingDays: 0);
    final disputeStats = json['disputeStats'] is Map
        ? FinanceDisputeStats.fromJson(Map<String, dynamic>.from(json['disputeStats'] as Map))
        : const FinanceDisputeStats(openDisputes: 0, underReview: 0, resolved: 0, totalDisputedAmount: 0);

    final range = json['range'] as Map? ?? {};

    return FinanceReport(
      rangeStart: range['start'] as String? ?? '',
      rangeEnd: range['end'] as String? ?? '',
      timeline: timeline,
      currencyTotals: currencyTotals,
      topServices: topServices,
      outstandingInvoices: outstandingInvoices,
      payoutBacklog: payoutBacklog,
      disputeStats: disputeStats,
    );
  }

  final String rangeStart;
  final String rangeEnd;
  final List<FinanceReportTimelinePoint> timeline;
  final List<FinanceReportCurrencyBucket> currencyTotals;
  final List<FinanceReportService> topServices;
  final List<FinanceReportInvoice> outstandingInvoices;
  final FinancePayoutBacklog payoutBacklog;
  final FinanceDisputeStats disputeStats;

  @override
  List<Object?> get props => [rangeStart, rangeEnd, timeline, currencyTotals, topServices, outstandingInvoices, payoutBacklog, disputeStats];
}

class FinanceAlert extends Equatable {
  const FinanceAlert({
    required this.id,
    required this.severity,
    required this.category,
    required this.message,
    this.recommendedAction,
    this.metric,
    this.lastUpdated,
  });

  factory FinanceAlert.fromJson(Map<String, dynamic> json) {
    return FinanceAlert(
      id: json['id'] as String? ?? '',
      severity: json['severity'] as String? ?? 'medium',
      category: json['category'] as String? ?? 'finance',
      message: json['message'] as String? ?? '',
      recommendedAction: json['recommendedAction'] as String?,
      metric: json['metric'] is Map ? Map<String, dynamic>.from(json['metric'] as Map) : const {},
      lastUpdated: json['lastUpdated'] as String?,
    );
  }

  final String id;
  final String severity;
  final String category;
  final String message;
  final String? recommendedAction;
  final Map<String, dynamic>? metric;
  final String? lastUpdated;

  @override
  List<Object?> get props => [id, severity, category, message, recommendedAction, metric, lastUpdated];
}

class FinanceAlertSummary extends Equatable {
  const FinanceAlertSummary({
    required this.generatedAt,
    required this.alerts,
    required this.totalCaptured,
    required this.totalDisputed,
    required this.disputeRatio,
  });

  factory FinanceAlertSummary.fromJson(Map<String, dynamic> json) {
    final alerts = (json['alerts'] as List<dynamic>? ?? [])
        .map((item) => FinanceAlert.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final metrics = json['metrics'] as Map? ?? {};
    return FinanceAlertSummary(
      generatedAt: json['generatedAt'] as String? ?? '',
      alerts: alerts,
      totalCaptured: (metrics['totalCaptured'] as num?)?.toDouble() ?? 0,
      totalDisputed: (metrics['totalDisputed'] as num?)?.toDouble() ?? 0,
      disputeRatio: (metrics['disputeRatio'] as num?)?.toDouble() ?? 0,
    );
  }

  final String generatedAt;
  final List<FinanceAlert> alerts;
  final double totalCaptured;
  final double totalDisputed;
  final double disputeRatio;

  @override
  List<Object?> get props => [generatedAt, alerts, totalCaptured, totalDisputed, disputeRatio];
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
