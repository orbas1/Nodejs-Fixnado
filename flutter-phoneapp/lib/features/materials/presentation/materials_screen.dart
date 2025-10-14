import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/domain/user_role.dart';
import 'materials_controller.dart';

class MaterialsScreen extends ConsumerWidget {
  const MaterialsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(materialsControllerProvider);
    final controller = ref.read(materialsControllerProvider.notifier);

    if (!state.allowed) {
      return _AccessDenied(onRefresh: controller.refresh, role: state.role);
    }

    final theme = Theme.of(context);
    final hero = state.hero;
    final stats = state.stats;
    final filteredInventory = state.filteredInventory();

    return RefreshIndicator(
      onRefresh: controller.refresh,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 220,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsetsDirectional.only(start: 16, bottom: 16, end: 16),
              centerTitle: false,
              title: Text('Materials', style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
              background: _HeroHeader(hero: hero, stats: stats, state: state, onRefresh: controller.refresh),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (state.offline)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.amber.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.offline_bolt, color: Colors.amber.shade700),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Most recent snapshot shown while telemetry reconnects.',
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.amber.shade900),
                            ),
                          )
                        ],
                      ),
                    ),
                  if (state.errorMessage != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.error_outline, color: Colors.red.shade600),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  state.errorMessage!,
                                  style: GoogleFonts.inter(fontSize: 13, color: Colors.red.shade800, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                TextButton.icon(
                                  onPressed: () => controller.refresh(),
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Retry'),
                                  style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),
                  _FilterRow(
                    state: state,
                    onSearch: controller.updateSearch,
                    onCategoryChanged: controller.updateCategory,
                    onSupplierChanged: controller.updateSupplier,
                    onToggleAlerts: controller.toggleAlertsOnly,
                  ),
                  const SizedBox(height: 24),
                  _StatsRow(stats: stats, theme: theme),
                  const SizedBox(height: 24),
                  Text('Live inventory', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 12),
                  if (state.isLoading && filteredInventory.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (filteredInventory.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceVariant,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Text(
                        'No materials match your filters right now.',
                        style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant),
                      ),
                    )
                  else
                    _InventoryGrid(items: filteredInventory, theme: theme),
                  const SizedBox(height: 32),
                  Text('Category mix', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 12),
                  _CategoryGrid(categories: state.categories, theme: theme),
                  const SizedBox(height: 32),
                  Text('Kitted collections', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 12),
                  _CollectionList(collections: state.collections, theme: theme),
                  const SizedBox(height: 32),
                  Text('Supplier network', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 12),
                  _SupplierTable(suppliers: state.suppliers, theme: theme),
                  const SizedBox(height: 32),
                  Text('Logistics timeline', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 12),
                  _LogisticsTimeline(steps: state.logistics, theme: theme),
                  const SizedBox(height: 32),
                  _InsightsRow(insights: state.insights, theme: theme),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AccessDenied extends StatelessWidget {
  const _AccessDenied({required this.onRefresh, required this.role});

  final Future<void> Function() onRefresh;
  final UserRole role;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.indigo.shade100),
            boxShadow: const [BoxShadow(color: Color(0x1A0D1B2A), blurRadius: 24, offset: Offset(0, 16))],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.verified_user_outlined, size: 32, color: Colors.indigo.shade600),
              const SizedBox(height: 16),
              Text('Operations workspace required', style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'The materials cockpit is limited to company operators and certified field crews. Switch to an authorised workspace role to inspect stock, compliance and vendor automations.',
                style: GoogleFonts.inter(fontSize: 14, color: Colors.blueGrey.shade600),
              ),
              const SizedBox(height: 16),
              Text('Current role: ${role.displayName}', style: GoogleFonts.inter(fontSize: 13, color: Colors.blueGrey.shade700)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => onRefresh(),
                icon: const Icon(Icons.refresh),
                label: const Text('Check access'),
              ),
              const SizedBox(height: 8),
              Text(
                'Need access? Contact operations enablement to activate the materials stream.',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.hero, required this.stats, required this.state, required this.onRefresh});

  final MaterialHeroModel? hero;
  final MaterialStats? stats;
  final MaterialsViewState state;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final gradient = LinearGradient(colors: [const Color(0xFF15306B), const Color(0xFF0E1C36)]);
    return Container(
      decoration: BoxDecoration(gradient: gradient),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(hero?.title ?? 'Materials control tower', style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 8),
              Text(
                hero?.subtitle ??
                    'Real-time view of consumables, replenishment cadences and supplier performance.',
                style: GoogleFonts.inter(fontSize: 13, color: Colors.white70),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _MetricChip(label: 'Fill rate', value: stats != null ? '${(stats.fillRate * 100).toStringAsFixed(1)}%' : '—'),
                  const SizedBox(width: 12),
                  _MetricChip(label: 'On-hand value', value: stats != null ? '£${stats.valueOnHand.toStringAsFixed(0)}' : '—'),
                  const Spacer(),
                  OutlinedButton.icon(
                    onPressed: () => onRefresh(),
                    icon: const Icon(Icons.refresh, size: 18, color: Colors.white),
                    label: Text('Refresh', style: GoogleFonts.inter(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white54),
                      foregroundColor: Colors.white,
                    ),
                  )
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
        ],
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.state,
    required this.onSearch,
    required this.onCategoryChanged,
    required this.onSupplierChanged,
    required this.onToggleAlerts,
  });

  final MaterialsViewState state;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onCategoryChanged;
  final ValueChanged<String> onSupplierChanged;
  final VoidCallback onToggleAlerts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                onChanged: onSearch,
                decoration: InputDecoration(
                  labelText: 'Search materials',
                  prefixIcon: const Icon(Icons.search),
                ),
              ),
            ),
            const SizedBox(width: 12),
            FilterChip(
              selected: state.alertsOnly,
              label: Text('Alerts', style: GoogleFonts.inter(fontSize: 13, color: state.alertsOnly ? theme.colorScheme.primary : theme.colorScheme.onSurface)),
              onSelected: (_) => onToggleAlerts(),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                value: state.selectedCategory,
                onChanged: (value) => onCategoryChanged(value ?? 'all'),
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  const DropdownMenuItem(value: 'all', child: Text('All categories')),
                  ...state.categories.map(
                    (category) => DropdownMenuItem(
                      value: category.name.toLowerCase(),
                      child: Text(category.name),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<String>(
                value: state.selectedSupplier,
                onChanged: (value) => onSupplierChanged(value ?? 'all'),
                decoration: const InputDecoration(labelText: 'Supplier'),
                items: [
                  const DropdownMenuItem(value: 'all', child: Text('All suppliers')),
                  ...state.suppliers.map(
                    (supplier) => DropdownMenuItem(
                      value: supplier.name.toLowerCase(),
                      child: Text(supplier.name),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats, required this.theme});

  final MaterialStats? stats;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatCard(
          label: 'Total SKUs',
          value: stats?.totalSkus.toString() ?? '—',
          theme: theme,
        ),
        const SizedBox(width: 12),
        _StatCard(
          label: 'On-hand units',
          value: stats?.totalOnHand.toString() ?? '—',
          theme: theme,
        ),
        const SizedBox(width: 12),
        _StatCard(
          label: 'Fill rate',
          value: stats != null ? '${(stats!.fillRate * 100).toStringAsFixed(1)}%' : '—',
          theme: theme,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.theme});

  final String label;
  final String value;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: theme.colorScheme.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
          ],
        ),
      ),
    );
  }
}

class _InventoryGrid extends StatelessWidget {
  const _InventoryGrid({required this.items, required this.theme});

  final List<MaterialInventoryItem> items;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      itemCount: items.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 1,
        childAspectRatio: 1.6,
        mainAxisSpacing: 12,
      ),
      itemBuilder: (context, index) {
        final item = items[index];
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.name, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                        const SizedBox(height: 4),
                        Text(item.category, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  if (item.alerts.isNotEmpty)
                    Chip(
                      label: Text(item.alerts.first.type.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 11)),
                      avatar: const Icon(Icons.warning_amber_outlined, size: 18, color: Colors.amber),
                      backgroundColor: Colors.amber.shade50,
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _InfoColumn(label: 'On hand', value: item.quantityOnHand.toString(), theme: theme),
                  _InfoColumn(label: 'Reserved', value: item.quantityReserved.toString(), theme: theme),
                  _InfoColumn(label: 'Available', value: item.available.toString(), theme: theme),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text('Supplier: ${item.supplier ?? '—'}', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                  ),
                  Expanded(
                    child: Text('Lead time: ${item.leadTimeDays != null ? '${item.leadTimeDays!.toStringAsFixed(1)} days' : '—'}',
                        style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InfoColumn extends StatelessWidget {
  const _InfoColumn({required this.label, required this.value, required this.theme});

  final String label;
  final String value;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
        ],
      ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.categories, required this.theme});

  final List<MaterialCategoryShare> categories;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return Text('No category data yet.', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant));
    }
    return Column(
      children: categories
          .map(
            (category) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(category.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: category.share, backgroundColor: theme.colorScheme.surfaceVariant, color: theme.colorScheme.primary),
                  const SizedBox(height: 8),
                  Text('${(category.share * 100).toStringAsFixed(1)}% of stock · Availability ${(category.availability * 100).toStringAsFixed(0)}%',
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _CollectionList extends StatelessWidget {
  const _CollectionList({required this.collections, required this.theme});

  final List<MaterialCollection> collections;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    if (collections.isEmpty) {
      return Text('No collections configured yet.', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant));
    }
    return Column(
      children: collections
          .map(
            (collection) => Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(collection.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                  const SizedBox(height: 6),
                  Text(collection.description, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  ...collection.composition.map((entry) => Text('• $entry', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant))),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _SupplierTable extends StatelessWidget {
  const _SupplierTable({required this.suppliers, required this.theme});

  final List<MaterialSupplier> suppliers;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    if (suppliers.isEmpty) {
      return Text('No supplier metrics yet.', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant));
    }
    return Column(
      children: suppliers
          .map(
            (supplier) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(supplier.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                        const SizedBox(height: 4),
                        Text(supplier.tier, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  Text('${supplier.leadTimeDays?.toStringAsFixed(1) ?? '—'} d', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                  const SizedBox(width: 16),
                  Text(supplier.reliability != null ? '${(supplier.reliability! * 100).toStringAsFixed(0)}%' : '—',
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _LogisticsTimeline extends StatelessWidget {
  const _LogisticsTimeline({required this.steps, required this.theme});

  final List<MaterialLogisticsStep> steps;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    if (steps.isEmpty) {
      return Text('Logistics timeline not yet available.', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant));
    }
    return Column(
      children: steps
          .map((step) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(backgroundColor: theme.colorScheme.primary.withOpacity(0.12), child: Icon(Icons.local_shipping_outlined, color: theme.colorScheme.primary)),
                title: Text(step.label, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                subtitle: Text(step.detail, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                trailing: Text(
                  step.eta != null ? DateTimeFormatter.relative(step.eta!) : 'Scheduled',
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                ),
              ))
          .toList(),
    );
  }
}

class _InsightsRow extends StatelessWidget {
  const _InsightsRow({required this.insights, required this.theme});

  final MaterialInsights? insights;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    if (insights == null) {
      return const SizedBox.shrink();
    }
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.green.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Compliance', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.green.shade800)),
                const SizedBox(height: 8),
                Text('Passing rate ${(insights!.compliance.passingRate * 100).toStringAsFixed(0)}%',
                    style: GoogleFonts.inter(fontSize: 13, color: Colors.green.shade800)),
                const SizedBox(height: 8),
                ...insights!.compliance.expiringCertifications.map(
                  (item) => Text('${item.name} · ${item.expiresAt != null ? DateTimeFormatter.relative(item.expiresAt!) : 'pending'}',
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.green.shade700)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sustainability', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade800)),
                const SizedBox(height: 8),
                Text('Recycled share ${(insights!.sustainability.recycledShare * 100).toStringAsFixed(0)}%',
                    style: GoogleFonts.inter(fontSize: 13, color: Colors.blue.shade800)),
                const SizedBox(height: 8),
                ...insights!.sustainability.initiatives.map(
                  (item) => Text(item, style: GoogleFonts.inter(fontSize: 12, color: Colors.blue.shade700)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
