import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/domain/user_role.dart';
import '../../auth/presentation/role_selector.dart';
import '../domain/tool_models.dart';
import 'tools_controller.dart';
import 'widgets/tool_card.dart';

class ToolsScreen extends ConsumerWidget {
  const ToolsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(toolsControllerProvider);
    final controller = ref.read(toolsControllerProvider.notifier);
    final scheme = Theme.of(context).colorScheme;

    if (!state.accessGranted) {
      return Scaffold(
        body: SafeArea(child: _AccessGate(state: state)),
      );
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => controller.refresh(force: true),
        child: CustomScrollView(
          slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tools workbench',
                      style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.primary)),
                  const SizedBox(height: 12),
                  Text('Operations & logistics',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        letterSpacing: 2.8,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurfaceVariant,
                      )),
                  const SizedBox(height: 12),
                  Text(
                    'Synchronise depot availability, compliance guardrails, and telemetry-backed tooling in one command surface.',
                    style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 20),
                  _MetricsRow(state: state),
                  if (state.offline)
                    Container(
                      margin: const EdgeInsets.only(top: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.offline_bolt, color: Colors.orange.shade800),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Showing cached inventory. Telemetry will resume when connectivity stabilises.',
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.orange.shade900),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        FilterChip(
                          label: const Text('All categories'),
                          selected: state.activeCategory == null,
                          onSelected: (_) => controller.setCategory(null),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        ),
                        const SizedBox(width: 12),
                        ...state.items
                            .map((item) => item.category)
                            .toSet()
                            .map(
                              (category) => Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: FilterChip(
                                  label: Text(category),
                                  selected: state.activeCategory == category,
                                  onSelected: (_) => controller.toggleCategory(category),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                ),
                              ),
                            )
                      ],
                    ),
                  ),
                  if (state.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 20),
                      child: Text(
                        state.errorMessage!,
                        style: GoogleFonts.inter(fontSize: 13, color: scheme.error),
                      ),
                    ),
                ],
              ),
            ),
          ),
            if (state.isLoading && state.items.isEmpty)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(child: CircularProgressIndicator()),
                ),
              )
            else if (state.filteredItems.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 24),
                  child: Column(
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 48, color: scheme.outline),
                      const SizedBox(height: 12),
                      Text(
                        'No tools match your filters. Connect a depot or adjust the filters to continue.',
                        style: GoogleFonts.inter(fontSize: 14, color: scheme.onSurfaceVariant),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
                sliver: SliverList.separated(
                  itemBuilder: (context, index) {
                    final tool = state.filteredItems[index];
                    return ToolCard(
                      tool: tool,
                      onReserve: () => _showReserveSheet(context, tool, state.role),
                      onTelemetry: () => _showTelemetrySheet(context, tool),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: state.filteredItems.length,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showReserveSheet(BuildContext context, ToolInventoryItem tool, UserRole role) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Reserve ${tool.name}',
                      style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Escrow milestones and insurance riders are linked to this reservation. Confirm dispatch windows for the ${role.name} cohort.',
                style: GoogleFonts.inter(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Confirm reservation'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showTelemetrySheet(BuildContext context, ToolInventoryItem tool) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Telemetry stream',
                      style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Live feed includes vibration, torque, geofence compliance, and battery telemetry for ${tool.name}. Alerts will open incidents if thresholds breach.',
                style: GoogleFonts.inter(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Subscribe to alerts'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MetricsRow extends StatelessWidget {
  const _MetricsRow({required this.state});

  final ToolsViewState state;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tiles = [
      _MetricCard(
        title: 'Tools ready',
        value: state.totalCount == 0 ? '0' : '${state.readyCount}/${state.totalCount}',
        caption: 'Dispatchable this hour',
      ),
      _MetricCard(
        title: 'Fleet uptime',
        value: '${state.uptime.toStringAsFixed(1)}%',
        caption: 'Telemetry heartbeat',
      ),
      _MetricCard(
        title: 'Average utilisation',
        value: '${(state.utilisationAverage * 100).round()}%',
        caption: 'Last 30 days',
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final tile in tiles) ...[
                _MetricCardWidget(tile: tile, scheme: scheme),
                const SizedBox(height: 12),
              ]
            ],
          );
        }
        return Row(
          children: [
            for (final tile in tiles) ...[
              Expanded(child: _MetricCardWidget(tile: tile, scheme: scheme)),
              const SizedBox(width: 16),
            ]
          ]..removeLast(),
        );
      },
    );
  }
}

class _MetricCard {
  const _MetricCard({required this.title, required this.value, required this.caption});

  final String title;
  final String value;
  final String caption;
}

class _MetricCardWidget extends StatelessWidget {
  const _MetricCardWidget({required this.tile, required this.scheme});

  final _MetricCard tile;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tile.title, style: GoogleFonts.inter(fontSize: 12, color: scheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(tile.value, style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: scheme.primary)),
          const SizedBox(height: 6),
          Text(tile.caption, style: GoogleFonts.inter(fontSize: 12, color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _AccessGate extends ConsumerWidget {
  const _AccessGate({required this.state});

  final ToolsViewState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: scheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: scheme.primary.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Switch persona to continue',
                    style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.primary)),
                const SizedBox(height: 12),
                Text(
                  'Tooling orchestration is reserved for provider and serviceman personas. Use the persona selector to gain access.',
                  style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: scheme.onSurfaceVariant),
                ),
                const SizedBox(height: 20),
                const RoleSelector(),
                if (state.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(state.errorMessage!, style: GoogleFonts.inter(fontSize: 13, color: scheme.error)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
