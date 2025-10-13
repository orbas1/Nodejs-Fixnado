import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../domain/models.dart';
import 'explorer_controller.dart';
import 'widgets/marketplace_item_card.dart';
import 'widgets/service_result_card.dart';
import 'widgets/tool_hire_sheet.dart';
import 'widgets/zone_analytics_card.dart';

class ExplorerScreen extends ConsumerStatefulWidget {
  const ExplorerScreen({super.key});

  @override
  ConsumerState<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends ConsumerState<ExplorerScreen> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final state = ref.read(explorerControllerProvider);
    _controller = TextEditingController(text: state.filters.term ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(explorerControllerProvider);
    final controller = ref.read(explorerControllerProvider.notifier);

    if (state.filters.term != _controller.text) {
      _controller.text = state.filters.term ?? '';
      _controller.selection = TextSelection.fromPosition(TextPosition(offset: _controller.text.length));
    }

    final showToolsOnly = state.filters.type == ExplorerResultType.tools;

    return RefreshIndicator(
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(child: _buildHeader(context, state, controller)),
          ),
          if (state.isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 80),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              sliver: SliverToBoxAdapter(child: _buildZoneAnalytics(state)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (state.errorMessage != null)
                      _ErrorBanner(message: state.errorMessage!, offline: state.offline),
                    if (state.services.isNotEmpty) ...[
                      Text('Services', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 16),
                      ...state.services.map((service) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: ServiceResultCard(service: service),
                          )),
                    ],
                    if (state.marketplaceItems.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        showToolsOnly ? 'Tools for hire' : 'Marketplace items',
                        style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 16),
                      ...state.marketplaceItems.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: MarketplaceItemCard(
                              item: item,
                              onTap: item.supportsRental ? () => _openHireSheet(context, item) : null,
                              onHire: item.supportsRental ? () => _openHireSheet(context, item) : null,
                            ),
                          )),
                    ],
                    if (state.services.isEmpty && state.marketplaceItems.isEmpty && state.errorMessage == null)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 80),
                        child: Column(
                          children: [
                            Icon(Icons.search_off_outlined, size: 48, color: Theme.of(context).colorScheme.outline),
                            const SizedBox(height: 12),
                            Text(
                              'No results yet. Refine filters or adjust demand tiers.',
                              style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.outline),
                            ),
                          ],
                        ),
                      ),
                    if (state.lastUpdated != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 24, bottom: 32),
                        child: Text(
                          'Last refreshed ${DateTimeFormatter.relative(state.lastUpdated!)}',
                          style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ExplorerViewState state, ExplorerController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _controller,
          textInputAction: TextInputAction.search,
          onSubmitted: (value) => controller.submitSearch(value.trim()),
          decoration: InputDecoration(
            filled: true,
            fillColor: Theme.of(context).colorScheme.surfaceVariant,
            prefixIcon: const Icon(Icons.search),
            suffixIcon: state.filters.term?.isNotEmpty == true
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _controller.clear();
                      controller.submitSearch(null);
                    },
                  )
                : null,
            labelText: 'Search by skill, equipment, or zone',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip(
                context,
                label: 'All',
                selected: state.filters.type == ExplorerResultType.all,
                onSelected: () => controller.updateResultType(ExplorerResultType.all),
              ),
              const SizedBox(width: 12),
              _buildFilterChip(
                context,
                label: 'Services',
                selected: state.filters.type == ExplorerResultType.services,
                onSelected: () => controller.updateResultType(ExplorerResultType.services),
              ),
              const SizedBox(width: 12),
              _buildFilterChip(
                context,
                label: 'Marketplace',
                selected: state.filters.type == ExplorerResultType.marketplace,
                onSelected: () => controller.updateResultType(ExplorerResultType.marketplace),
              ),
              const SizedBox(width: 12),
              _buildFilterChip(
                context,
                label: 'Tools',
                selected: state.filters.type == ExplorerResultType.tools,
                onSelected: () => controller.updateResultType(ExplorerResultType.tools),
              ),
              const SizedBox(width: 12),
              DropdownButtonHideUnderline(
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: DropdownButton<String?>(
                    value: state.filters.zoneId,
                    hint: Text('All zones', style: GoogleFonts.inter(fontSize: 14)),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('All zones')),
                      ...state.snapshot?.zones
                              .map(
                                (zone) => DropdownMenuItem<String?>(
                                  value: zone.id,
                                  child: Text(zone.name, style: GoogleFonts.inter(fontSize: 14)),
                                ),
                              )
                              .toList() ??
                          [],
                    ],
                    onChanged: (value) => controller.selectZone(value),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(BuildContext context, {required String label, required bool selected, required VoidCallback onSelected}) {
    return FilterChip(
      label: Text(label, style: GoogleFonts.inter(fontSize: 14)),
      selected: selected,
      onSelected: (_) => onSelected(),
      showCheckmark: false,
      backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
      selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.16),
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
        color: selected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurface,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    );
  }

  Widget _buildZoneAnalytics(ExplorerViewState state) {
    if (state.snapshot == null) {
      return const SizedBox.shrink();
    }

    final zones = state.zones;
    if (zones.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: Colors.red.shade50,
        ),
        child: Text(
          'No analytics captured for the selected zone yet. Monitor demand and re-run in a few minutes.',
          style: GoogleFonts.inter(fontSize: 14, color: Colors.red.shade900),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Zone insights',
          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        ...zones.map((zone) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: ZoneAnalyticsCard(zone: zone),
            )),
      ],
    );
  }
}

  void _openHireSheet(BuildContext context, ExplorerMarketplaceItem item) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => ToolHireSheet(item: item),
    );
  }

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.offline});

  final String message;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: offline ? Colors.orange.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(offline ? Icons.wifi_off : Icons.error_outline, color: offline ? Colors.orange.shade900 : Colors.red.shade900),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  offline ? 'Offline mode' : 'We hit a snag',
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: offline ? Colors.orange.shade900 : Colors.red.shade900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  offline
                      ? 'Showing the last successful explorer snapshot. Some analytics may be stale until connectivity is restored.'
                      : message,
                  style: GoogleFonts.inter(fontSize: 14),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
