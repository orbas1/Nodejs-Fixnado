import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../domain/enterprise_dashboard_models.dart';
import 'enterprise_dashboard_controller.dart';

class EnterpriseDashboardScreen extends ConsumerWidget {
  const EnterpriseDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(currentRoleProvider);
    if (role != UserRole.enterprise) {
      return _AccessGate(role: role.displayName);
    }

    final state = ref.watch(enterpriseDashboardControllerProvider);
    final controller = ref.read(enterpriseDashboardControllerProvider.notifier);
    final snapshot = state.snapshot;

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: _Header(
                snapshot: snapshot,
                loading: state.isLoading,
                offline: state.offline,
                fallback: state.fallback,
                errorMessage: state.errorMessage,
              ),
            ),
          ),
          if (state.isLoading && snapshot == null)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: CircularProgressIndicator()),
            )
          else if (snapshot != null) ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(child: _MetricsSection(metrics: snapshot.delivery)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(child: _SpendSection(spend: snapshot.spend)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _OperationsSection(
                  coverage: snapshot.coverage,
                  automation: snapshot.automation,
                  sustainability: snapshot.sustainability,
                  actionItems: snapshot.actionCentre,
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _ProgrammesSection(
                  programmes: snapshot.programmes,
                  escalations: snapshot.escalations,
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _GovernanceSection(governance: snapshot.governance),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
              sliver: SliverToBoxAdapter(child: _RoadmapSection(roadmap: snapshot.roadmap)),
            ),
          ]
          else
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Text(
                  'No enterprise telemetry available yet.',
                  style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.snapshot,
    required this.loading,
    required this.offline,
    required this.fallback,
    required this.errorMessage,
  });

  final EnterpriseDashboardSnapshot? snapshot;
  final bool loading;
  final bool offline;
  final bool fallback;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final generatedAtLabel = snapshot?.generatedAt != null
        ? DateFormat('MMM d • HH:mm').format(snapshot!.generatedAt)
        : 'Awaiting sync';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          snapshot?.profile.name ?? 'Enterprise performance suite',
          style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Text(
          snapshot?.profile.sector ?? 'Operations and procurement',
          style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant),
        ),
        if (snapshot?.profile.accountManager != null) ...[
          const SizedBox(height: 8),
          Text(
            'Account manager • ${snapshot!.profile.accountManager}',
            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            Chip(
              label: Text(
                loading ? 'Refreshing metrics…' : 'Updated $generatedAtLabel',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
              labelStyle: GoogleFonts.inter(color: theme.colorScheme.primary),
            ),
            if (offline)
              Chip(
                avatar: const Icon(Icons.wifi_off_outlined, size: 16),
                label: Text('Offline snapshot', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                backgroundColor: const Color(0xFFFFF7ED),
              ),
            if (fallback)
              Chip(
                avatar: const Icon(Icons.cloud_download_outlined, size: 16),
                label: Text('Cached telemetry', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                backgroundColor: const Color(0xFFEFF6FF),
              ),
            if (errorMessage != null)
              Chip(
                avatar: const Icon(Icons.error_outline, size: 16),
                label: Text('Refresh issue detected', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                backgroundColor: const Color(0xFFFFEBEE),
              ),
          ],
        ),
      ],
    );
  }
}

class _MetricsSection extends StatelessWidget {
  const _MetricsSection({required this.metrics});

  final EnterpriseDeliveryMetrics metrics;

  @override
  Widget build(BuildContext context) {
    final cards = [
      _MetricCard(
        title: 'SLA compliance',
        value: NumberFormat.percentPattern().format(metrics.slaCompliance),
        subtitle: 'Across active facilities this week',
        icon: Icons.verified_user_outlined,
        tone: _metricTone(metrics.slaCompliance < 0.9 ? 'danger' : 'success'),
      ),
      _MetricCard(
        title: 'Open incidents',
        value: NumberFormat.decimalPattern().format(metrics.incidents),
        subtitle: 'Awaiting triage or closure',
        icon: Icons.report_problem_outlined,
        tone: _metricTone(metrics.incidents > 4 ? 'danger' : metrics.incidents > 2 ? 'warning' : 'info'),
      ),
      _MetricCard(
        title: 'Resolution time',
        value: '${metrics.avgResolutionHours.toStringAsFixed(1)} h',
        subtitle: 'Mean response to incident closure',
        icon: Icons.schedule_outlined,
        tone: _metricTone(metrics.avgResolutionHours > 8 ? 'warning' : 'success'),
      ),
      _MetricCard(
        title: 'Stakeholder NPS',
        value: metrics.nps.toString(),
        subtitle: 'Rolling 30-day view',
        icon: Icons.emoji_events_outlined,
        tone: _metricTone('success'),
      ),
    ];

    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: cards
          .map((card) => SizedBox(
                width: (MediaQuery.of(context).size.width - 72) / 2,
                child: card,
              ))
          .toList(),
    );
  }

  Color _metricTone(String tone) {
    switch (tone) {
      case 'danger':
        return const Color(0xFFFF4D4F);
      case 'warning':
        return const Color(0xFFFFB020);
      case 'success':
        return const Color(0xFF0F9D58);
      default:
        return const Color(0xFF2563EB);
    }
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.tone,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: tone, size: 20),
            const SizedBox(height: 12),
            Text(title, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: tone)),
            const SizedBox(height: 6),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }
}

class _SpendSection extends StatelessWidget {
  const _SpendSection({required this.spend});

  final EnterpriseSpend spend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currency = NumberFormat.simpleCurrency();
    final percent = NumberFormat.percentPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Spend & budget pacing', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Month-to-date spend', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Text(currency.format(spend.monthToDate),
                          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Budget pacing', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Text(percent.format(spend.budgetPacing),
                          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Savings identified', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Text(currency.format(spend.savingsIdentified),
                          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text('Invoices awaiting approval', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (spend.invoices.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('No invoices pending approval.', style: GoogleFonts.inter(fontSize: 13)),
            ),
          )
        else
          Column(
            children: spend.invoices
                .map(
                  (invoice) => Card(
                    child: ListTile(
                      title: Text(invoice.vendor, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        invoice.dueDate != null
                            ? 'Due ${DateFormat.yMMMd().format(invoice.dueDate!)}'
                            : 'Due soon',
                        style: GoogleFonts.inter(fontSize: 12),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(currency.format(invoice.amount),
                              style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
                          Text(invoice.status.toUpperCase(),
                              style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600])),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }
}

class _OperationsSection extends StatelessWidget {
  const _OperationsSection({
    required this.coverage,
    required this.automation,
    required this.sustainability,
    required this.actionItems,
  });

  final List<EnterpriseCoverageRegion> coverage;
  final EnterpriseAutomation automation;
  final EnterpriseSustainability sustainability;
  final List<EnterpriseActionItem> actionItems;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final percent = NumberFormat.percentPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Global operations pulse', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        if (coverage.isNotEmpty)
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: coverage
                .map(
                  (region) => SizedBox(
                    width: (MediaQuery.of(context).size.width - 72) / 2,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F172A), Color(0xFF1D4ED8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(region.region,
                              style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
                          if (region.primaryService != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                region.primaryService!,
                                style: GoogleFonts.inter(fontSize: 11, color: Colors.white70),
                              ),
                            ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Uptime', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                              Text(percent.format(region.uptime),
                                  style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Automation', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                              Text(percent.format(region.automationScore),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Active sites', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                              Text(region.activeSites.toString(),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Incidents', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                              Text(region.incidents.toString(),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        const SizedBox(height: 20),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Automation orchestration',
                          style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 16),
                      _ProgressRow(label: 'Success rate', value: automation.orchestrationRate),
                      const SizedBox(height: 12),
                      _ProgressRow(label: 'Runbook coverage', value: automation.runbookCoverage, color: const Color(0xFF0EA5E9)),
                      const SizedBox(height: 20),
                      Text('Mission-critical runbooks', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 12),
                      if (automation.runbooks.isEmpty)
                        Text('No automation runbooks are active.', style: GoogleFonts.inter(fontSize: 12))
                      else
                        Column(
                          children: automation.runbooks
                              .map(
                                (runbook) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(runbook.name,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  subtitle: Text(
                                    'Adoption ${(runbook.adoption * 100).round()}%',
                                    style: GoogleFonts.inter(fontSize: 12),
                                  ),
                                  trailing: runbook.owner != null
                                      ? Chip(label: Text(runbook.owner!, style: GoogleFonts.inter(fontSize: 11)))
                                      : null,
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Sustainability pulse',
                          style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 16),
                      Text('Carbon YTD', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      Text('${sustainability.carbonYtd.toStringAsFixed(0)} tCO₂e',
                          style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      Text('Target', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      Text('${sustainability.carbonTarget.toStringAsFixed(0)} tCO₂e',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 16),
                      _ProgressRow(
                        label: 'Renewable coverage',
                        value: sustainability.renewableCoverage,
                        color: const Color(0xFF22C55E),
                      ),
                      const SizedBox(height: 16),
                      Text('Emissions trend', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 6),
                      Text(
                        (sustainability.emissionTrend ?? 'steady').replaceAll('-', ' '),
                        style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text('Action centre', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (actionItems.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('No follow-up actions are outstanding.', style: GoogleFonts.inter(fontSize: 13)),
            ),
          )
        else
          Column(
            children: actionItems
                .map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(item.title, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
                      subtitle: item.detail != null
                          ? Text(item.detail!, style: GoogleFonts.inter(fontSize: 12))
                          : null,
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (item.due != null)
                            Text(DateFormat.yMMMd().format(item.due!), style: GoogleFonts.inter(fontSize: 12)),
                          if (item.owner != null)
                            Text(item.owner!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.label, required this.value, this.color});

  final String label;
  final double value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final percent = NumberFormat.percentPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
            Text(percent.format(value),
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color ?? Theme.of(context).colorScheme.primary)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: LinearProgressIndicator(
            value: value.clamp(0, 1),
            minHeight: 6,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(color ?? Theme.of(context).colorScheme.primary),
          ),
        ),
      ],
    );
  }
}

class _ProgrammesSection extends StatelessWidget {
  const _ProgrammesSection({required this.programmes, required this.escalations});

  final List<EnterpriseProgramme> programmes;
  final List<EnterpriseEscalation> escalations;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Programmes & escalations', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Programmes in delivery', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      if (programmes.isEmpty)
                        Text('No active programmes associated to this account.', style: GoogleFonts.inter(fontSize: 12))
                      else
                        Column(
                          children: programmes
                              .map(
                                (programme) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(programme.name,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  subtitle: Text(
                                    '${programme.phase} • ${programme.status}',
                                    style: GoogleFonts.inter(fontSize: 12),
                                  ),
                                  trailing: programme.lastUpdated != null
                                      ? Text(
                                          DateFormat.yMMMd().format(programme.lastUpdated!),
                                          style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
                                        )
                                      : null,
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Escalations', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      if (escalations.isEmpty)
                        Text('No escalations require action.', style: GoogleFonts.inter(fontSize: 12))
                      else
                        Column(
                          children: escalations
                              .map(
                                (escalation) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(escalation.title,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  subtitle: Text(escalation.owner, style: GoogleFonts.inter(fontSize: 12)),
                                  trailing: escalation.openedAt != null
                                      ? Text(DateFormat.yMMMd().format(escalation.openedAt!),
                                          style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]))
                                      : null,
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _GovernanceSection extends StatelessWidget {
  const _GovernanceSection({required this.governance});

  final EnterpriseGovernance governance;

  @override
  Widget build(BuildContext context) {
    final percent = NumberFormat.percentPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Risk & governance', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Compliance posture', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      Text(percent.format(governance.complianceScore),
                          style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Text(governance.posture ?? 'Steady', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 12),
                      Text(
                        governance.dataResidency ?? 'Data residency pending definition.',
                        style: GoogleFonts.inter(fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Risk register', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      if (governance.riskRegister.isEmpty)
                        Text('No risks require attention right now.', style: GoogleFonts.inter(fontSize: 12))
                      else
                        Column(
                          children: governance.riskRegister
                              .map(
                                (risk) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(risk.label,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  subtitle: risk.mitigation != null
                                      ? Text(risk.mitigation!, style: GoogleFonts.inter(fontSize: 12))
                                      : null,
                                  trailing: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (risk.owner != null)
                                        Text(risk.owner!, style: GoogleFonts.inter(fontSize: 11)),
                                      if (risk.due != null)
                                        Text(DateFormat.yMMMd().format(risk.due!),
                                            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Upcoming audits', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      if (governance.audits.isEmpty)
                        Text('No audits scheduled in this window.', style: GoogleFonts.inter(fontSize: 12))
                      else
                        Column(
                          children: governance.audits
                              .map(
                                (audit) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(audit.name,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  subtitle: audit.owner != null
                                      ? Text(audit.owner!, style: GoogleFonts.inter(fontSize: 12))
                                      : null,
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(audit.status, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                                      if (audit.due != null)
                                        Text(DateFormat.yMMMd().format(audit.due!),
                                            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RoadmapSection extends StatelessWidget {
  const _RoadmapSection({required this.roadmap});

  final List<EnterpriseRoadmapMilestone> roadmap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Enterprise roadmap', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        if (roadmap.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('No roadmap milestones captured yet.', style: GoogleFonts.inter(fontSize: 13)),
            ),
          )
        else
          Column(
            children: roadmap
                .map(
                  (milestone) => Card(
                    child: ListTile(
                      title: Text(milestone.milestone,
                          style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600)),
                      subtitle: milestone.detail != null
                          ? Text(milestone.detail!, style: GoogleFonts.inter(fontSize: 12))
                          : null,
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (milestone.status != null)
                            Text(milestone.status!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                          if (milestone.quarter != null)
                            Text(milestone.quarter!, style: GoogleFonts.inter(fontSize: 11)),
                          if (milestone.owner != null)
                            Text(milestone.owner!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
      ],
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
        child: Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.lock_outline, size: 40),
                const SizedBox(height: 16),
                Text('Enterprise workspace restricted',
                    style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text(
                  'You are signed in as $role. Switch to an enterprise role to view this command centre.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
