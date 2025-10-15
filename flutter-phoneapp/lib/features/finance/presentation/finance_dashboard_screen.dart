import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/finance_repository.dart';
import '../domain/finance_models.dart';

final financeOverviewProvider = FutureProvider<FinanceOverview>((ref) async {
  final repository = ref.watch(financeRepositoryProvider);
  return repository.fetchOverview();
});

final financeReportProvider = FutureProvider<FinanceReport>((ref) async {
  final repository = ref.watch(financeRepositoryProvider);
  return repository.fetchReport();
});

final financeAlertSummaryProvider = FutureProvider<FinanceAlertSummary>((ref) async {
  final repository = ref.watch(financeRepositoryProvider);
  return repository.fetchAlerts();
});

final selectedOrderIdProvider = StateProvider<String?>((ref) => null);

final financeTimelineProvider = FutureProvider.autoDispose<FinanceTimeline?>((ref) async {
  final orderId = ref.watch(selectedOrderIdProvider);
  if (orderId == null || orderId.isEmpty) {
    return null;
  }
  final repository = ref.watch(financeRepositoryProvider);
  return repository.fetchTimeline(orderId);
});

class FinanceDashboardScreen extends ConsumerWidget {
  const FinanceDashboardScreen({super.key});

  static const _allowedRoles = {
    UserRole.provider,
    UserRole.enterprise,
    UserRole.operations,
    UserRole.admin,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(currentRoleProvider);
    if (!_allowedRoles.contains(role)) {
      return _AccessGate(role: role.displayName);
    }

    final overviewAsync = ref.watch(financeOverviewProvider);
    final reportAsync = ref.watch(financeReportProvider);
    final alertsAsync = ref.watch(financeAlertSummaryProvider);
    final selectedOrderId = ref.watch(selectedOrderIdProvider);
    final timelineAsync = ref.watch(financeTimelineProvider);

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () async {
        ref.invalidate(financeOverviewProvider);
        ref.invalidate(financeReportProvider);
        ref.invalidate(financeAlertSummaryProvider);
        await Future.wait([
          ref.read(financeOverviewProvider.future),
          ref.read(financeReportProvider.future),
          ref.read(financeAlertSummaryProvider.future),
        ]);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Finance control centre', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                    'Monitor captured revenue, escrow readiness and payout approvals without leaving mobile.',
                    style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
          overviewAsync.when(
            data: (overview) => SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 24),
                _SummaryRow(totals: overview.totals),
                const SizedBox(height: 24),
                reportAsync.when(
                  data: (report) => _ReportAndAlertsSection(
                    report: report,
                    alertsAsync: alertsAsync,
                  ),
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (error, _) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: _ErrorBanner(message: error.toString()),
                  ),
                ),
                const SizedBox(height: 24),
                _SectionHeading(title: 'Recent payments'),
                _PaymentList(payments: overview.payments, selectedOrderId: selectedOrderId, onSelect: (orderId) {
                  ref.read(selectedOrderIdProvider.notifier).state = orderId;
                }),
                const SizedBox(height: 24),
                _SectionHeading(title: 'Payout pipeline'),
                _PayoutList(payouts: overview.payouts),
                const SizedBox(height: 24),
                _SectionHeading(title: 'Invoices'),
                _InvoiceList(invoices: overview.invoices),
                const SizedBox(height: 24),
                _SectionHeading(title: 'Disputes'),
                _DisputeList(disputes: overview.disputes),
                const SizedBox(height: 24),
                _SectionHeading(title: 'Timeline'),
                timelineAsync.when(
                  data: (timeline) => _TimelineCard(
                    orderId: selectedOrderId,
                    timeline: timeline,
                    onClear: () => ref.read(selectedOrderIdProvider.notifier).state = null,
                  ),
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (error, _) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: _ErrorBanner(message: error.toString()),
                  ),
                ),
                const SizedBox(height: 48),
              ]),
            ),
            loading: () => const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: _ErrorBanner(message: error.toString()),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportAndAlertsSection extends StatelessWidget {
  const _ReportAndAlertsSection({required this.report, required this.alertsAsync});

  final FinanceReport report;
  final AsyncValue<FinanceAlertSummary> alertsAsync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Daily performance & alerts',
            style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: theme.colorScheme.onBackground),
          ),
          const SizedBox(height: 12),
          _CurrencyGrid(buckets: report.currencyTotals),
          const SizedBox(height: 12),
          _TimelinePreview(points: report.timeline),
          const SizedBox(height: 12),
          alertsAsync.when(
            data: (summary) => _AlertsList(summary: summary),
            loading: () => const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (error, _) => _ErrorBanner(message: error.toString()),
          ),
          const SizedBox(height: 12),
          _PayoutBacklogCard(backlog: report.payoutBacklog),
          const SizedBox(height: 12),
          _TopServicesCard(services: report.topServices),
        ],
      ),
    );
  }
}

class _CurrencyGrid extends StatelessWidget {
  const _CurrencyGrid({required this.buckets});

  final List<FinanceReportCurrencyBucket> buckets;

  @override
  Widget build(BuildContext context) {
    if (buckets.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No captured transactions in the reporting window.'),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final mediaWidth = MediaQuery.of(context).size.width;
        final availableWidth = constraints.maxWidth.isFinite ? constraints.maxWidth : mediaWidth;
        final int perRow = availableWidth >= 720
            ? 3
            : availableWidth >= 480
                ? 2
                : 1;
        final double spacing = 12;
        final double candidateWidth =
            (availableWidth - (spacing * (perRow - 1))).clamp(180, availableWidth).toDouble();
        final double cardWidth = perRow == 1 ? availableWidth : candidateWidth;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: buckets.map((bucket) {
            final currencyFormat = NumberFormat.simpleCurrency(name: bucket.currency);
            return ConstrainedBox(
              constraints: BoxConstraints(
                minWidth: perRow == 1 ? availableWidth : 180,
                maxWidth: cardWidth,
              ),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Theme.of(context).colorScheme.surface,
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(bucket.currency, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      'Captured ${currencyFormat.format(bucket.captured)}',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                    Text(
                      'Disputed ${currencyFormat.format(bucket.disputedVolume)}',
                      style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.error),
                    ),
                    Text(
                      'Pending ${currencyFormat.format(bucket.pending)}',
                      style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.primary),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _TimelinePreview extends StatelessWidget {
  const _TimelinePreview({required this.points});

  final List<FinanceReportTimelinePoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No daily performance history yet.'),
        ),
      );
    }

    final recent = points.reversed.take(5).toList();
    return Card(
      child: Column(
        children: recent
            .map(
              (point) => ListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                title: Text('${point.date} · ${point.currency}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                subtitle: Text(
                  'Captured ${NumberFormat.simpleCurrency(name: point.currency).format(point.captured)} · Payouts ${NumberFormat.simpleCurrency(name: point.currency).format(point.payouts)}',
                  style: GoogleFonts.inter(fontSize: 12),
                ),
                trailing: Text(
                  'Disputes ${NumberFormat.simpleCurrency(name: point.currency).format(point.disputes)}',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.redAccent),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _AlertsList extends StatelessWidget {
  const _AlertsList({required this.summary});

  final FinanceAlertSummary summary;

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical':
        return Colors.redAccent;
      case 'high':
        return Colors.orangeAccent;
      case 'medium':
        return Colors.amber;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (summary.alerts.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No regulatory alerts triggered.'),
        ),
      );
    }

    final generatedAt = summary.generatedAt.isEmpty ? null : DateTime.tryParse(summary.generatedAt);
    final generatedLabel = generatedAt != null
        ? DateFormat.yMMMd().add_jm().format(generatedAt)
        : 'recently';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Alerts generated $generatedLabel',
          style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey),
        ),
        const SizedBox(height: 8),
        ...summary.alerts.map(
          (alert) => Card(
            color: _severityColor(alert.severity).withOpacity(0.1),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(alert.message, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
                  if (alert.recommendedAction != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(alert.recommendedAction!, style: GoogleFonts.inter(fontSize: 12)),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PayoutBacklogCard extends StatelessWidget {
  const _PayoutBacklogCard({required this.backlog});

  final FinancePayoutBacklog backlog;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payout backlog', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Pending requests: ${backlog.totalRequests}', style: GoogleFonts.inter(fontSize: 12)),
            Text('Providers impacted: ${backlog.providersImpacted}', style: GoogleFonts.inter(fontSize: 12)),
            Text('Oldest pending: ${backlog.oldestPendingDays} days', style: GoogleFonts.inter(fontSize: 12)),
            Text(
              'Pending amount: ${NumberFormat.simpleCurrency().format(backlog.totalAmount)}',
              style: GoogleFonts.inter(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopServicesCard extends StatelessWidget {
  const _TopServicesCard({required this.services});

  final List<FinanceReportService> services;

  @override
  Widget build(BuildContext context) {
    if (services.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No services captured revenue in this window.'),
        ),
      );
    }

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: services.take(3).map((service) {
          final currencyFormat = NumberFormat.simpleCurrency(name: service.currency);
          return ListTile(
            title: Text(service.serviceTitle, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
            subtitle: Text(
              'Captured ${currencyFormat.format(service.capturedAmount)} · Dispute rate ${(service.disputeRate * 100).toStringAsFixed(1)}%',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            trailing: Text('Orders ${service.successfulOrders}', style: GoogleFonts.inter(fontSize: 12)),
          );
        }).toList(),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.totals});

  final FinanceTotals totals;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: [
        _SummaryCard(
          title: 'Captured',
          value: NumberFormat.simpleCurrency(name: 'GBP').format(totals.captured),
          color: theme.colorScheme.primary,
        ),
        _SummaryCard(
          title: 'Refunded',
          value: NumberFormat.simpleCurrency(name: 'GBP').format(totals.refunded),
          color: Colors.pinkAccent,
        ),
        _SummaryCard(
          title: 'Outstanding invoices',
          value: NumberFormat.decimalPattern().format(totals.outstandingInvoices),
          color: Colors.amber,
        ),
        _SummaryCard(
          title: 'Pending payouts',
          value: NumberFormat.decimalPattern().format(totals.pendingPayouts),
          color: Colors.blueGrey,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.title, required this.value, required this.color});

  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, color: color.withOpacity(0.7))),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Text(title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
    );
  }
}

class _PaymentList extends StatelessWidget {
  const _PaymentList({required this.payments, required this.selectedOrderId, required this.onSelect});

  final List<FinancePayment> payments;
  final String? selectedOrderId;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (payments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _EmptyPlaceholder(message: 'No payments captured yet.'),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: payments.take(10).map((payment) {
          final isSelected = payment.orderId == selectedOrderId;
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 8),
            elevation: isSelected ? 4 : 0,
            child: ListTile(
              onTap: () => onSelect(payment.orderId),
              title: Text(payment.orderId, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              subtitle: Text(
                'Status • ${payment.status} • ${payment.capturedAt != null ? DateFormat('MMM d, HH:mm').format(payment.capturedAt!) : 'Pending'}',
                style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              trailing: Text(
                NumberFormat.simpleCurrency(name: payment.currency).format(payment.amount),
                style: GoogleFonts.manrope(fontWeight: FontWeight.w700),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _PayoutList extends StatelessWidget {
  const _PayoutList({required this.payouts});

  final List<FinancePayout> payouts;

  @override
  Widget build(BuildContext context) {
    if (payouts.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _EmptyPlaceholder(message: 'No payouts queued.'),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: payouts.take(6).map((payout) {
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            child: ListTile(
              title: Text(
                NumberFormat.simpleCurrency(name: payout.currency).format(payout.amount),
                style: GoogleFonts.manrope(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(
                payout.scheduledFor != null
                    ? 'Scheduled ${DateFormat('MMM d').format(payout.scheduledFor!)}'
                    : 'Awaiting schedule',
                style: GoogleFonts.inter(fontSize: 12),
              ),
              trailing: Text(payout.status, style: GoogleFonts.inter(fontSize: 12)),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _InvoiceList extends StatelessWidget {
  const _InvoiceList({required this.invoices});

  final List<FinanceInvoice> invoices;

  @override
  Widget build(BuildContext context) {
    if (invoices.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _EmptyPlaceholder(message: 'No invoices issued yet.'),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: invoices.take(6).map((invoice) {
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            child: ListTile(
              title: Text(invoice.invoiceNumber, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
              subtitle: Text('Status • ${invoice.status}', style: GoogleFonts.inter(fontSize: 12)),
              trailing: Text(
                NumberFormat.simpleCurrency(name: invoice.currency).format(invoice.amountDue),
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _DisputeList extends StatelessWidget {
  const _DisputeList({required this.disputes});

  final List<FinanceDispute> disputes;

  @override
  Widget build(BuildContext context) {
    if (disputes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _EmptyPlaceholder(message: 'No active disputes.'),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: disputes.map((dispute) {
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            color: Colors.red.shade50,
            child: ListTile(
              title: Text(dispute.status, style: GoogleFonts.manrope(fontWeight: FontWeight.w600, color: Colors.red.shade700)),
              subtitle: Text(
                dispute.openedAt != null
                    ? 'Opened ${DateFormat('MMM d').format(dispute.openedAt!)}'
                    : 'Open',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade600),
              ),
              trailing: Text(dispute.reason ?? 'Awaiting notes', style: GoogleFonts.inter(fontSize: 12)),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.orderId, required this.timeline, required this.onClear});

  final String? orderId;
  final FinanceTimeline? timeline;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    if (orderId == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _EmptyPlaceholder(message: 'Select a payment to view its timeline.'),
      );
    }

    if (timeline == null) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: _ErrorBanner(message: 'Timeline unavailable. Try refreshing.'),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Order $orderId', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                  TextButton(onPressed: onClear, child: const Text('Clear')),
                ],
              ),
              const SizedBox(height: 12),
              Text('Escrow status • ${timeline.escrowStatus ?? 'pending'}', style: GoogleFonts.inter(fontSize: 13)),
              Text('Invoice status • ${timeline.invoiceStatus ?? 'draft'}', style: GoogleFonts.inter(fontSize: 13)),
              const SizedBox(height: 12),
              ...timeline.history.map((event) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(event.eventType, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      event.occurredAt != null
                          ? DateFormat('MMM d, HH:mm').format(event.occurredAt!)
                          : 'Unscheduled',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyPlaceholder extends StatelessWidget {
  const _EmptyPlaceholder({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.2)),
      ),
      child: Text(message, style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Text(message, style: GoogleFonts.inter(color: Colors.red.shade700, fontSize: 13)),
    );
  }
}

class _AccessGate extends StatelessWidget {
  const _AccessGate({required this.role});

  final String role;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: _ErrorBanner(message: 'Finance dashboards are not enabled for $role accounts yet.'),
      ),
    );
  }
}
