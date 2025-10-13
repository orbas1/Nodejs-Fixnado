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
          AnalyticsAdsSection ads => _AdsSectionView(section: ads),
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


class _AdsSectionView extends StatelessWidget {
  const _AdsSectionView({required this.section});

  final AnalyticsAdsSection section;

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final content = <Widget>[];

    void addSection(Widget widget) {
      if (content.isNotEmpty) {
        content.add(const SizedBox(height: 20));
      }
      content.add(widget);
    }

    if (data.summaryCards.isNotEmpty) {
      addSection(_AdsSummaryCards(cards: data.summaryCards));
    }
    if (data.campaigns.isNotEmpty || data.timeline.isNotEmpty) {
      addSection(_AdsCampaignsAndTimeline(campaigns: data.campaigns, timeline: data.timeline));
    }
    if (data.funnel.isNotEmpty || data.recommendations.isNotEmpty) {
      addSection(_AdsFunnelAndRecommendations(funnel: data.funnel, recommendations: data.recommendations));
    }
    if (data.invoices.isNotEmpty || data.alerts.isNotEmpty) {
      addSection(_AdsInvoicesAndAlerts(invoices: data.invoices, alerts: data.alerts));
    }

    if (content.isEmpty) {
      return const _EmptyState(message: 'No Fixnado Ads data available yet.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: content,
    );
  }
}

class _AdsSummaryCards extends StatelessWidget {
  const _AdsSummaryCards({required this.cards});

  final List<AnalyticsAdsSummaryCard> cards;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        double cardWidth = width;
        if (width >= 1120) {
          cardWidth = (width - 48) / 4;
        } else if (width >= 840) {
          cardWidth = (width - 32) / 3;
        } else if (width >= 560) {
          cardWidth = (width - 16) / 2;
        }
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: cards
              .map(
                (card) => SizedBox(
                  width: cardWidth,
                  child: _AdsSummaryCard(card: card, colors: colors),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _AdsSummaryCard extends StatelessWidget {
  const _AdsSummaryCard({required this.card, required this.colors});

  final AnalyticsAdsSummaryCard card;
  final ColorScheme colors;

  Color _backgroundForTrend(String? trend) {
    switch (trend) {
      case 'up':
        return const Color(0xFFECFDF5);
      case 'down':
        return const Color(0xFFFFF1F2);
      default:
        return colors.surfaceVariant.withOpacity(0.6);
    }
  }

  Color _foregroundForTrend(String? trend) {
    switch (trend) {
      case 'up':
        return const Color(0xFF047857);
      case 'down':
        return const Color(0xFFB91C1C);
      default:
        return colors.primary;
    }
  }

  IconData _iconForTrend(String? trend) {
    switch (trend) {
      case 'up':
        return Icons.trending_up;
      case 'down':
        return Icons.trending_down;
      default:
        return Icons.horizontal_rule;
    }
  }

  @override
  Widget build(BuildContext context) {
    final change = card.change;
    final helper = card.helper;
    final trendColor = _foregroundForTrend(card.trend);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      color: colors.surface,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.surfaceVariant.withOpacity(0.45),
              colors.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colors.surfaceVariant),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              card.title,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.4,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    card.value,
                    style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                  ),
                ),
                if (change != null && change.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _backgroundForTrend(card.trend),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_iconForTrend(card.trend), size: 16, color: trendColor),
                        const SizedBox(width: 4),
                        Text(
                          change,
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: trendColor),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            if (helper != null && helper.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                helper,
                style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AdsCampaignsAndTimeline extends StatelessWidget {
  const _AdsCampaignsAndTimeline({required this.campaigns, required this.timeline});

  final List<AnalyticsAdsCampaign> campaigns;
  final List<AnalyticsAdsTimelineEntry> timeline;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 880;
        final campaignCard = _AdsCampaignsCard(campaigns: campaigns);
        final timelineCard = _AdsTimelineCard(timeline: timeline);
        if (isWide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 3, child: campaignCard),
              const SizedBox(width: 16),
              Expanded(flex: 2, child: timelineCard),
            ],
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            campaignCard,
            const SizedBox(height: 16),
            timelineCard,
          ],
        );
      },
    );
  }
}

class _AdsCampaignsCard extends StatelessWidget {
  const _AdsCampaignsCard({required this.campaigns});

  final List<AnalyticsAdsCampaign> campaigns;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Active campaigns', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.secondaryContainer,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${campaigns.length} in view',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: colors.onSecondaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (campaigns.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'No Fixnado Ads campaigns in this window.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columnSpacing: 24,
                  headingTextStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600),
                  dataTextStyle: GoogleFonts.inter(fontSize: 13, color: colors.onSurface),
                  columns: [
                    DataColumn(label: Text('Campaign', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Spend', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Conversions', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('ROAS', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Pacing', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Window', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                  ],
                  rows: campaigns
                      .map(
                        (campaign) => DataRow(
                          cells: [
                            DataCell(
                              ConstrainedBox(
                                constraints: const BoxConstraints(minWidth: 180),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      campaign.name,
                                      style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
                                    ),
                                    if (campaign.objective != null && campaign.objective!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          campaign.objective!,
                                          style: GoogleFonts.inter(fontSize: 12, color: colors.onSurfaceVariant),
                                        ),
                                      ),
                                    if (campaign.lastMetricDate != null && campaign.lastMetricDate!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          'Last metric ${campaign.lastMetricDate}',
                                          style: GoogleFonts.inter(fontSize: 11, color: colors.onSurfaceVariant),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            DataCell(_AdsMetricCell(primary: campaign.spend, secondary: campaign.spendChange)),
                            DataCell(_AdsMetricCell(primary: campaign.conversions, secondary: campaign.conversionsChange)),
                            DataCell(_AdsMetricCell(primary: campaign.roas, secondary: campaign.roasChange)),
                            DataCell(Text(campaign.pacing ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                            DataCell(Text(campaign.window ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                          ],
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdsMetricCell extends StatelessWidget {
  const _AdsMetricCell({required this.primary, this.secondary});

  final String? primary;
  final String? secondary;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          (primary != null && primary!.isNotEmpty) ? primary! : '—',
          style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        if (secondary != null && secondary!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              secondary!,
              style: GoogleFonts.inter(fontSize: 12, color: colors.onSurfaceVariant),
            ),
          ),
      ],
    );
  }
}

class _AdsTimelineCard extends StatelessWidget {
  const _AdsTimelineCard({required this.timeline});

  final List<AnalyticsAdsTimelineEntry> timeline;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Upcoming flights', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.surfaceVariant,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${timeline.length} scheduled',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: colors.onSurfaceVariant),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (timeline.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'No upcoming flights scheduled.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              Column(
                children: timeline
                    .map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: colors.secondaryContainer,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(entry.title, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600)),
                              if (entry.status != null && entry.status!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    entry.status!,
                                    style: GoogleFonts.inter(fontSize: 12, color: colors.onSecondaryContainer),
                                  ),
                                ),
                              if ((entry.start != null && entry.start!.isNotEmpty) || (entry.end != null && entry.end!.isNotEmpty))
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    '${entry.start ?? '—'} → ${entry.end ?? '—'}',
                                    style: GoogleFonts.inter(fontSize: 12, color: colors.onSurfaceVariant),
                                  ),
                                ),
                              if (entry.budget != null && entry.budget!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Budget ${entry.budget}',
                                    style: GoogleFonts.inter(fontSize: 12, color: colors.primary),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdsFunnelAndRecommendations extends StatelessWidget {
  const _AdsFunnelAndRecommendations({required this.funnel, required this.recommendations});

  final List<AnalyticsAdsFunnelStage> funnel;
  final List<AnalyticsAdsRecommendation> recommendations;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 720;
        final funnelCard = _AdsFunnelCard(funnel: funnel);
        final recCard = _AdsRecommendationsCard(recommendations: recommendations);
        if (isWide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: funnelCard),
              const SizedBox(width: 16),
              Expanded(child: recCard),
            ],
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            funnelCard,
            const SizedBox(height: 16),
            recCard,
          ],
        );
      },
    );
  }
}

class _AdsFunnelCard extends StatelessWidget {
  const _AdsFunnelCard({required this.funnel});

  final List<AnalyticsAdsFunnelStage> funnel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Acquisition funnel', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (funnel.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'No delivery data yet.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              Column(
                children: funnel
                    .map(
                      (stage) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: colors.surfaceVariant.withOpacity(0.6),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(stage.title, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                  if (stage.helper != null && stage.helper!.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        stage.helper!,
                                        style: GoogleFonts.inter(fontSize: 12, color: colors.onSurfaceVariant),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Text(stage.value, style: GoogleFonts.ibmPlexMono(fontSize: 14, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdsRecommendationsCard extends StatelessWidget {
  const _AdsRecommendationsCard({required this.recommendations});

  final List<AnalyticsAdsRecommendation> recommendations;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Recommendations', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (recommendations.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'No recommendations at the moment.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              Column(
                children: recommendations
                    .map(
                      (recommendation) => ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                        leading: Icon(Icons.check_circle_rounded, color: colors.primary),
                        title: Text(
                          recommendation.title,
                          style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(recommendation.description, style: GoogleFonts.inter(fontSize: 13)),
                            if (recommendation.action != null && recommendation.action!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: colors.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    recommendation.action!,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      letterSpacing: 0.6,
                                      fontWeight: FontWeight.w600,
                                      color: colors.primary,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdsInvoicesAndAlerts extends StatelessWidget {
  const _AdsInvoicesAndAlerts({required this.invoices, required this.alerts});

  final List<AnalyticsAdsInvoice> invoices;
  final List<AnalyticsAdsAlert> alerts;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 720;
        final invoicesCard = _AdsInvoicesCard(invoices: invoices);
        final alertsCard = _AdsAlertsCard(alerts: alerts);
        if (isWide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: invoicesCard),
              const SizedBox(width: 16),
              Expanded(child: alertsCard),
            ],
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            invoicesCard,
            const SizedBox(height: 16),
            alertsCard,
          ],
        );
      },
    );
  }
}

class _AdsInvoicesCard extends StatelessWidget {
  const _AdsInvoicesCard({required this.invoices});

  final List<AnalyticsAdsInvoice> invoices;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Billing cadence', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.secondaryContainer,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${invoices.length} invoices',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: colors.onSecondaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (invoices.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'No invoices issued this window.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columnSpacing: 24,
                  headingTextStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600),
                  dataTextStyle: GoogleFonts.inter(fontSize: 13, color: colors.onSurface),
                  columns: [
                    DataColumn(label: Text('Invoice', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Campaign', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Amount', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Status', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                    DataColumn(label: Text('Due', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600))),
                  ],
                  rows: invoices
                      .map(
                        (invoice) => DataRow(
                          cells: [
                            DataCell(Text(
                              invoice.invoiceNumber ?? '—',
                              style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
                            )),
                            DataCell(Text(invoice.campaign ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                            DataCell(Text(invoice.amountDue ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                            DataCell(Text(invoice.status ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                            DataCell(Text(invoice.dueDate ?? '—', style: GoogleFonts.inter(fontSize: 13))),
                          ],
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdsAlertsCard extends StatelessWidget {
  const _AdsAlertsCard({required this.alerts});

  final List<AnalyticsAdsAlert> alerts;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Guardrails & alerts', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.surfaceVariant,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${alerts.length} alerts',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: colors.onSurfaceVariant),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (alerts.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'No alerts raised. Guardrails are steady.',
                  style: GoogleFonts.inter(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              )
            else
              Column(
                children: alerts
                    .map(
                      (alert) {
                        final palette = _AlertPalette.forSeverity(alert.severity, colors);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: palette.background,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: palette.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.warning_amber_rounded, size: 20, color: palette.foreground),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(alert.title ?? 'Alert', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                                        if (alert.description != null && alert.description!.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 4),
                                            child: Text(alert.description!, style: GoogleFonts.inter(fontSize: 12, color: colors.onSurface)),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: palette.foreground.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      alert.severity ?? 'Info',
                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: palette.foreground),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 12,
                                runSpacing: 8,
                                children: [
                                  if (alert.flight != null && alert.flight!.isNotEmpty)
                                    Chip(
                                      label: Text(alert.flight!, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                      visualDensity: VisualDensity.compact,
                                      backgroundColor: colors.surface.withOpacity(0.6),
                                    ),
                                  if (alert.detectedAt != null && alert.detectedAt!.isNotEmpty)
                                    Chip(
                                      label: Text(alert.detectedAt!, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                      visualDensity: VisualDensity.compact,
                                      backgroundColor: colors.surface.withOpacity(0.6),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _AlertPalette {
  const _AlertPalette({required this.background, required this.foreground, required this.border});

  final Color background;
  final Color foreground;
  final Color border;

  factory _AlertPalette.forSeverity(String? severity, ColorScheme colors) {
    switch (severity) {
      case 'Critical':
        return const _AlertPalette(
          background: Color(0xFFFFF1F2),
          foreground: Color(0xFFB91C1C),
          border: Color(0xFFFECACA),
        );
      case 'Warning':
        return const _AlertPalette(
          background: Color(0xFFFFF7ED),
          foreground: Color(0xFFB45309),
          border: Color(0xFFFDE68A),
        );
      case 'Info':
        return const _AlertPalette(
          background: Color(0xFFECFEFF),
          foreground: Color(0xFF0369A1),
          border: Color(0xFFBAE6FD),
        );
      default:
        return _AlertPalette(
          background: colors.surfaceVariant.withOpacity(0.5),
          foreground: colors.onSurfaceVariant,
          border: colors.surfaceVariant,
        );
    }
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
