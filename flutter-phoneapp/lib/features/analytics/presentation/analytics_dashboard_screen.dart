import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../../shared/widgets/metric_card.dart';
import '../domain/analytics_models.dart';
import 'analytics_controller.dart';
import 'widgets/analytics_chart.dart';

class AnalyticsDashboardScreen extends ConsumerWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(analyticsControllerProvider);
    final controller = ref.read(analyticsControllerProvider.notifier);
    final dashboard = state.dashboard;

    return RefreshIndicator(
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: _Header(
                state: state,
                onExport: dashboard?.exports.csv != null
                    ? () async {
                        await _exportDashboard(context, controller);
                      }
                    : null,
              ),
            ),
          ),
          if (state.isLoading && dashboard == null)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 120),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (dashboard != null) ...[
            if (state.errorMessage != null)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
                sliver: SliverToBoxAdapter(
                  child: _ErrorBanner(message: state.errorMessage!, offline: state.offline),
                ),
              ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final section = dashboard.navigation[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: _SectionView(section: section),
                    );
                  },
                  childCount: dashboard.navigation.length,
                ),
              ),
            ),
          ]
          else if (state.errorMessage != null)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 80, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _ErrorBanner(message: state.errorMessage!, offline: state.offline),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  Future<void> _exportDashboard(BuildContext context, AnalyticsController controller) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final record = await controller.export();
      messenger.showSnackBar(
        SnackBar(
          content: Text('Export ready • ${_formatBytes(record.byteLength)} • ${DateTimeFormatter.relative(record.generatedAt)}'),
        ),
      );
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to export dashboard: $error')),
      );
    }
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.state, this.onExport});

  final AnalyticsViewState state;
  final VoidCallback? onExport;

  @override
  Widget build(BuildContext context) {
    final dashboard = state.dashboard;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    dashboard?.name ?? 'Operations pulse',
                    style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    dashboard?.headline ??
                        'Monitor bookings, rentals, campaigns, and compliance signals from anywhere.',
                    style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      if (dashboard?.window.label != null && dashboard!.window.label!.isNotEmpty)
                        _HeaderChip(icon: Icons.schedule, label: dashboard.window.label!),
                      if (dashboard?.window.timezone != null)
                        _HeaderChip(icon: Icons.public, label: dashboard!.window.timezone!),
                      if (state.offline)
                        const _HeaderChip(
                          icon: Icons.cloud_off,
                          label: 'Offline snapshot',
                          tone: _ChipTone.warning,
                        ),
                      if (state.lastUpdated != null)
                        _HeaderChip(
                          icon: Icons.refresh_outlined,
                          label: 'Updated ${DateTimeFormatter.relative(state.lastUpdated!)}',
                        ),
                      if (state.exportRecord != null)
                        _HeaderChip(
                          icon: Icons.insert_drive_file_outlined,
                          label:
                              'Last export ${DateTimeFormatter.relative(state.exportRecord!.generatedAt)}',
                        ),
                    ],
                  ),
                ],
              ),
            ),
            if (onExport != null)
              FilledButton.icon(
                icon: const Icon(Icons.file_download_outlined),
                onPressed: onExport,
                label: const Text('Export CSV'),
              ),
          ],
        ),
        const SizedBox(height: 24),
        if (state.isLoading && dashboard != null)
          Row(
            children: [
              const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.5)),
              const SizedBox(width: 12),
              Text(
                'Refreshing dashboard…',
                style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ],
          ),
      ],
    );
  }
}

class _HeaderChip extends StatelessWidget {
  const _HeaderChip({required this.icon, required this.label, this.tone = _ChipTone.neutral});

  final IconData icon;
  final String label;
  final _ChipTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final palette = switch (tone) {
      _ChipTone.warning => (background: const Color(0xFFFFF7ED), foreground: const Color(0xFFF97316)),
      _ChipTone.success => (background: const Color(0xFFECFDF5), foreground: const Color(0xFF047857)),
      _ChipTone.neutral => (background: colors.surfaceVariant, foreground: colors.onSurfaceVariant),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: palette.foreground),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: palette.foreground)),
        ],
      ),
    );
  }
}

enum _ChipTone { neutral, warning, success }

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.offline});

  final String message;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    final color = offline ? const Color(0xFF1BBF92) : Theme.of(context).colorScheme.error;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(offline ? Icons.cloud_off : Icons.error_outline, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  offline ? 'Working offline' : 'Unable to load analytics',
                  style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: color),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: GoogleFonts.inter(fontSize: 13, color: color.withOpacity(0.9)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionView extends StatelessWidget {
  const _SectionView({required this.section});

  final AnalyticsSection section;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(section.label, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                  if (section.description.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        section.description,
                        style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
                ],
              ),
            ),
            if (section.sidebar != null)
              _SidebarSummary(sidebar: section.sidebar!),
          ],
        ),
        const SizedBox(height: 16),
        switch (section) {
          AnalyticsOverviewSection overview => _OverviewSectionView(section: overview),
          AnalyticsTableSection table => _TableSectionView(section: table),
          AnalyticsBoardSection board => _BoardSectionView(section: board),
          AnalyticsListSection list => _ListSectionView(section: list),
          AnalyticsGridSection grid => _GridSectionView(section: grid),
          AnalyticsSettingsSection settings => _SettingsSectionView(section: settings),
          _ => const SizedBox.shrink(),
        },
      ],
    );
  }
}

class _OverviewSectionView extends StatelessWidget {
  const _OverviewSectionView({required this.section});

  final AnalyticsOverviewSection section;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (section.analytics.metrics.isNotEmpty)
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: section.analytics.metrics
                .map(
                  (metric) => SizedBox(
                    width: 200,
                    child: MetricCard(
                      label: metric.label,
                      value: metric.value,
                      change: metric.change,
                      trend: metric.trend,
                      background: Theme.of(context).colorScheme.surface,
                    ),
                  ),
                )
                .toList(),
          ),
        if (section.analytics.charts.isNotEmpty) ...[
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 640;
              final chartWidgets = section.analytics.charts
                  .map((chart) => SizedBox(
                        width: isWide ? (constraints.maxWidth - 16) / 2 : constraints.maxWidth,
                        child: AnalyticsChartCard(chart: chart),
                      ))
                  .toList();
              if (isWide) {
                return Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: chartWidgets,
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final widget in chartWidgets) ...[
                    widget,
                    const SizedBox(height: 16),
                  ],
                ],
              );
            },
          ),
        ],
        if (section.analytics.upcoming.isNotEmpty) ...[
          const SizedBox(height: 20),
          _UpcomingEvents(events: section.analytics.upcoming),
        ],
        if (section.analytics.insights.isNotEmpty) ...[
          const SizedBox(height: 16),
          _InsightsPanel(insights: section.analytics.insights),
        ],
      ],
    );
  }
}

class _TableSectionView extends StatelessWidget {
  const _TableSectionView({required this.section});

  final AnalyticsTableSection section;

  @override
  Widget build(BuildContext context) {
    final headers = section.data.headers;
    final rows = section.data.rows;
    if (headers.isEmpty && rows.isEmpty) {
      return _EmptyState(message: 'No records available yet.');
    }
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingTextStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600),
          dataTextStyle: GoogleFonts.inter(fontSize: 13),
          columns: headers.map((header) => DataColumn(label: Text(header))).toList(),
          rows: rows
              .map(
                (row) => DataRow(
                  cells: row.map((cell) => DataCell(Text(cell.isEmpty ? '—' : cell))).toList(),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _BoardSectionView extends StatelessWidget {
  const _BoardSectionView({required this.section});

  final AnalyticsBoardSection section;

  @override
  Widget build(BuildContext context) {
    if (section.data.columns.isEmpty) {
      return _EmptyState(message: 'No items in the workflow.');
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: section.data.columns
            .map(
              (column) => Container(
                width: 260,
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Theme.of(context).colorScheme.surfaceVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(column.title, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    if (column.items.isEmpty)
                      const Text('No items yet.', style: TextStyle(fontSize: 13))
                    else
                      ...column.items.map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _BoardCard(item: item),
                        ),
                      ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _ListSectionView extends StatelessWidget {
  const _ListSectionView({required this.section});

  final AnalyticsListSection section;

  @override
  Widget build(BuildContext context) {
    if (section.data.items.isEmpty) {
      return _EmptyState(message: 'All caught up.');
    }
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Column(
        children: section.data.items
            .map(
              (item) => ListTile(
                leading: const Icon(Icons.task_alt, size: 20),
                title: Text(item.title, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600)),
                subtitle: item.description != null
                    ? Text(item.description!, style: GoogleFonts.inter(fontSize: 13))
                    : null,
                trailing: item.status != null
                    ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(item.status!, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                      )
                    : null,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _GridSectionView extends StatelessWidget {
  const _GridSectionView({required this.section});

  final AnalyticsGridSection section;

  @override
  Widget build(BuildContext context) {
    if (section.data.cards.isEmpty) {
      return _EmptyState(message: 'No insights to highlight yet.');
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 640;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: section.data.cards
              .map(
                (card) => SizedBox(
                  width: isWide ? (constraints.maxWidth - 16) / 2 : constraints.maxWidth,
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(card.title, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 12),
                          ...card.details.map((detail) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Text(detail, style: GoogleFonts.inter(fontSize: 13)),
                              )),
                        ],
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _SettingsSectionView extends StatelessWidget {
  const _SettingsSectionView({required this.section});

  final AnalyticsSettingsSection section;

  @override
  Widget build(BuildContext context) {
    if (section.data.panels.isEmpty) {
      return _EmptyState(message: 'No settings available for this persona.');
    }
    return Column(
      children: section.data.panels
          .map(
            (panel) => Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(panel.title, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                    if (panel.description != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6, bottom: 12),
                        child: Text(panel.description!, style: GoogleFonts.inter(fontSize: 13)),
                      )
                    else
                      const SizedBox(height: 12),
                    ...panel.items.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                  if (item.helper != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(item.helper!, style: GoogleFonts.inter(fontSize: 12)),
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            Text(
                              item.type == 'toggle'
                                  ? (item.enabled == true ? 'Enabled' : 'Disabled')
                                  : (item.value ?? '—'),
                              style: GoogleFonts.ibmPlexMono(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _SidebarSummary extends StatelessWidget {
  const _SidebarSummary({required this.sidebar});

  final AnalyticsSidebar sidebar;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 200,
      margin: const EdgeInsets.only(left: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.surfaceVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (sidebar.badge != null)
            Text(
              sidebar.badge!,
              style: GoogleFonts.ibmPlexMono(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          if (sidebar.status != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  switch (sidebar.status!.tone) {
                    'danger' => Icons.warning_amber_rounded,
                    'warning' => Icons.report_problem_outlined,
                    'info' => Icons.info_outline,
                    _ => Icons.check_circle_outline,
                  },
                  size: 16,
                  color: _statusColour(theme, sidebar.status!.tone),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    sidebar.status!.label,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _statusColour(theme, sidebar.status!.tone),
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (sidebar.highlights.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...sidebar.highlights.map(
              (highlight) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(highlight.label, style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 2),
                    Text(highlight.value, style: GoogleFonts.ibmPlexMono(fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusColour(ThemeData theme, String? tone) {
    return switch (tone) {
      'danger' => const Color(0xFFF97316),
      'warning' => const Color(0xFFFACC15),
      'info' => const Color(0xFF0EA5E9),
      _ => const Color(0xFF1BBF92),
    };
  }
}

class _UpcomingEvents extends StatelessWidget {
  const _UpcomingEvents({required this.events});

  final List<AnalyticsUpcomingEvent> events;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Upcoming', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...events.map(
              (event) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.event_available_outlined, size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(event.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                          if (event.when != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(event.when!, style: GoogleFonts.inter(fontSize: 12)),
                            ),
                        ],
                      ),
                    ),
                    if (event.status != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceVariant,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(event.status!, style: GoogleFonts.inter(fontSize: 12)),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InsightsPanel extends StatelessWidget {
  const _InsightsPanel({required this.insights});

  final List<String> insights;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Insights', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...insights.map(
              (insight) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.bolt_outlined, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(insight, style: GoogleFonts.inter(fontSize: 13))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BoardCard extends StatelessWidget {
  const _BoardCard({required this.item});

  final AnalyticsBoardItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item.title, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
          if (item.owner != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Owner: ${item.owner}', style: GoogleFonts.inter(fontSize: 12)),
            ),
          if (item.value != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(item.value!, style: GoogleFonts.ibmPlexMono(fontSize: 12)),
            ),
          if (item.eta != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(item.eta!, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).colorScheme.surfaceVariant),
      ),
      child: Column(
        children: [
          Icon(Icons.bar_chart_rounded, size: 36, color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.6)),
          const SizedBox(height: 12),
          Text(
            message,
            style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

String _formatBytes(int bytes) {
  if (bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  var value = bytes.toDouble();
  var unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return '${value.toStringAsFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}';
}
