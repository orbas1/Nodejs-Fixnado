import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/application/auth_controller.dart';
import '../../auth/domain/user_role.dart';
import '../../auth/domain/role_scope.dart';
import '../../../shared/widgets/metric_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final role = ref.watch(currentRoleProvider);
    final content = _roleContent[role] ?? _roleContent[UserRole.customer]!;
    final profile = authState.profile;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back, ${profile?.firstName ?? 'there'}',
                  style: GoogleFonts.inter(fontSize: 16, color: Colors.blueGrey.shade600),
                ),
                const SizedBox(height: 12),
                Text(
                  content.heroTitle,
                  style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  content.heroSubtitle,
                  style: GoogleFonts.inter(fontSize: 14, color: Colors.blueGrey.shade600, height: 1.5),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: content.highlights
                      .map(
                        (highlight) => Chip(
                          label: Text(highlight, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _RoleMetricsGrid(metrics: content.metrics),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          sliver: SliverToBoxAdapter(
            child: Column(
              children: [
                for (var i = 0; i < content.spotlights.length; i++) ...[
                  if (i > 0) const SizedBox(height: 16),
                  _SpotlightCard(spotlight: content.spotlights[i]),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RoleMetricsGrid extends StatelessWidget {
  const _RoleMetricsGrid({required this.metrics});

  final List<RoleMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 720
            ? 3
            : constraints.maxWidth > 520
                ? 2
                : 1;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.4,
          ),
          itemCount: metrics.length,
          itemBuilder: (context, index) {
            final metric = metrics[index];
            return MetricCard(
              label: metric.label,
              value: metric.value,
              change: metric.change,
              trend: metric.trend,
              icon: metric.icon,
              background: metric.background,
            );
          },
        );
      },
    );
  }
}

class _SpotlightCard extends StatelessWidget {
  const _SpotlightCard({required this.spotlight});

  final RoleSpotlight spotlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                  foregroundColor: theme.colorScheme.primary,
                  child: Icon(spotlight.icon),
                ),
                const SizedBox(width: 12),
                Chip(
                  label: Text(
                    spotlight.badge,
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: theme.colorScheme.onSecondaryContainer),
                  ),
                  backgroundColor: theme.colorScheme.secondaryContainer,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              spotlight.title,
              style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            Text(
              spotlight.description,
              style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: Colors.blueGrey.shade600),
            ),
            const SizedBox(height: 16),
            Text(
              spotlight.caption,
              style: GoogleFonts.ibmPlexMono(fontSize: 12, color: theme.colorScheme.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class RoleMetric {
  const RoleMetric({
    required this.label,
    required this.value,
    this.change,
    this.trend,
    this.icon,
    this.background,
  });

  final String label;
  final String value;
  final String? change;
  final String? trend;
  final IconData? icon;
  final Color? background;
}

class RoleSpotlight {
  const RoleSpotlight({
    required this.title,
    required this.description,
    required this.caption,
    required this.icon,
    required this.badge,
  });

  final String title;
  final String description;
  final String caption;
  final IconData icon;
  final String badge;
}

class RoleHomeContent {
  const RoleHomeContent({
    required this.heroTitle,
    required this.heroSubtitle,
    required this.highlights,
    required this.metrics,
    required this.spotlights,
  });

  final String heroTitle;
  final String heroSubtitle;
  final List<String> highlights;
  final List<RoleMetric> metrics;
  final List<RoleSpotlight> spotlights;
}

final Map<UserRole, RoleHomeContent> _roleContent = {
  UserRole.customer: RoleHomeContent(
    heroTitle: 'Plan your next project with vetted talent',
    heroSubtitle:
        'Secure crews, rentals, and escrow-backed service packages tailored to your household or office projects. Our concierge keeps every milestone on track.',
    highlights: [
      'Escrow protected',
      'Live service zones',
      'Marketplace rentals',
    ],
    metrics: [
      RoleMetric(
        label: 'Active work orders',
        value: '3',
        change: '+2 this week',
        trend: 'up',
        icon: Icons.assignment_turned_in_outlined,
      ),
      RoleMetric(
        label: 'Average response time',
        value: '12m',
        change: '-3m vs last week',
        trend: 'down',
        icon: Icons.timer_outlined,
      ),
      RoleMetric(
        label: 'Escrow balance',
        value: '£4,520',
        icon: Icons.account_balance_wallet_outlined,
      ),
    ],
    spotlights: [
      RoleSpotlight(
        title: 'Book a rapid response crew',
        description:
            'Deploy multi-trade specialists for urgent repairs. We pre-verify DBS, insurance, and compliance so you can focus on the outcome.',
        caption: 'SLA tier: Platinum • Avg arrival 9m',
        icon: Icons.bolt_outlined,
        badge: 'Household ops',
      ),
      RoleSpotlight(
        title: 'Bundle rentals with your booking',
        description:
            'Reserve tools, lifts, and materials directly from trusted providers. Logistics are synchronised with your service window for zero downtime.',
        caption: 'Inventory synced from Fixnado Marketplace',
        icon: Icons.construction_outlined,
        badge: 'Marketplace',
      ),
    ],
  ),
  UserRole.serviceman: RoleHomeContent(
    heroTitle: 'Stay mission ready for high-value jobs',
    heroSubtitle:
        'Track dispatch windows, compliance checks, and equipment reservations in one command view. Accept, prepare, and close out gigs without paperwork.',
    highlights: [
      'DBS verified',
      'Compliance locker',
      'Route optimisation',
    ],
    metrics: [
      RoleMetric(
        label: 'Accepted jobs',
        value: '7',
        change: '+1 today',
        trend: 'up',
        icon: Icons.task_alt,
      ),
      RoleMetric(
        label: 'On-time arrival rate',
        value: '96%',
        change: '+4% QoQ',
        trend: 'up',
        icon: Icons.route_outlined,
      ),
      RoleMetric(
        label: 'Equipment ready',
        value: '5 kits',
        icon: Icons.handyman_outlined,
      ),
    ],
    spotlights: [
      RoleSpotlight(
        title: 'Pre-flight your compliance pack',
        description:
            'Upload and verify credentials before dispatch. Fixnado automatically shares compliance artefacts with clients and regulators.',
        caption: 'Next audit refresh due in 12 days',
        icon: Icons.verified_outlined,
        badge: 'Field kit',
      ),
      RoleSpotlight(
        title: 'Optimise tomorrow’s route',
        description:
            'Preview cluster assignments, travel times, and rental pick-ups. Lock in handover plans with a single tap.',
        caption: '3 clusters • 18 mi total travel',
        icon: Icons.alt_route,
        badge: 'Logistics',
      ),
    ],
  ),
  UserRole.provider: RoleHomeContent(
    heroTitle: 'Coordinate crews and rentals across every zone',
    heroSubtitle:
        'Monitor bookings, inventory, and performance telemetry from a single workspace. Activate pods and allocate resources with confidence.',
    highlights: [
      'Escrow insights',
      'Crew availability',
      'Inventory sync',
    ],
    metrics: [
      RoleMetric(
        label: 'Utilisation',
        value: '82%',
        change: '+6% vs target',
        trend: 'up',
        icon: Icons.speed_outlined,
      ),
      RoleMetric(
        label: 'Open disputes',
        value: '0',
        change: 'Stable',
        trend: 'flat',
        icon: Icons.shield_moon_outlined,
      ),
      RoleMetric(
        label: 'Rental fulfilment',
        value: '28 orders',
        change: '+9 pending handover',
        trend: 'up',
        icon: Icons.local_shipping_outlined,
      ),
    ],
    spotlights: [
      RoleSpotlight(
        title: 'Launch a programmatic pod',
        description:
            'Spin up multi-trade pods with the right blend of specialists. Contracting, onboarding, and comms are automated for you.',
        caption: 'Recommended cluster: Tech Corridor',
        icon: Icons.groups_outlined,
        badge: 'Workforce',
      ),
      RoleSpotlight(
        title: 'Sync marketplace listings',
        description:
            'Keep rental stock updated across zones. Demand forecasting nudges you before shortages hit critical services.',
        caption: 'Auto-reorder threshold reached for 2 SKUs',
        icon: Icons.sync_alt_outlined,
        badge: 'Marketplace',
      ),
    ],
  ),
  UserRole.enterprise: RoleHomeContent(
    heroTitle: 'Govern field operations at enterprise scale',
    heroSubtitle:
        'Command centre dashboards surface compliance, spend, and supplier performance. Align procurement, operations, and finance in one rhythm.',
    highlights: [
      'SLA governance',
      'Audit trails',
      'Executive briefings',
    ],
    metrics: [
      RoleMetric(
        label: 'Portfolio uptime',
        value: '99.4%',
        change: '+0.6% vs last quarter',
        trend: 'up',
        icon: Icons.monitor_heart_outlined,
      ),
      RoleMetric(
        label: 'Escrow under management',
        value: '£1.2M',
        change: '+£80k month-on-month',
        trend: 'up',
        icon: Icons.account_balance_outlined,
      ),
      RoleMetric(
        label: 'Compliance exceptions',
        value: '2',
        change: '-5 vs last month',
        trend: 'down',
        icon: Icons.rule_folder_outlined,
      ),
    ],
    spotlights: [
      RoleSpotlight(
        title: 'Download the executive brief',
        description:
            'Curated telemetry for CFOs and COOs summarises spend, SLA adherence, and incident escalations. Ready for Monday stand-ups.',
        caption: 'Auto-generated every Friday 17:00',
        icon: Icons.insert_drive_file_outlined,
        badge: 'Insights',
      ),
      RoleSpotlight(
        title: 'Govern supplier performance',
        description:
            'Benchmark every provider against contract KPIs. Trigger coaching plans, bonus releases, or replacement workflows instantly.',
        caption: '4 suppliers flagged for quarterly review',
        icon: Icons.workspace_premium_outlined,
        badge: 'Procurement',
      ),
    ],
  ),
};
