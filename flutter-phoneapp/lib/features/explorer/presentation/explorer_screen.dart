import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../bookings/presentation/widgets/booking_creation_sheet.dart';
import '../../services/domain/service_catalog_models.dart';
import '../../services/presentation/service_catalog_controller.dart';
import '../../services/presentation/widgets/service_package_card.dart';
import '../domain/models.dart';
import 'explorer_controller.dart';
import 'widgets/marketplace_item_card.dart';
import 'widgets/service_result_card.dart';
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
    final catalogState = ref.watch(serviceCatalogControllerProvider);
    final ServiceCatalogSnapshot? catalog = catalogState.snapshot;
    final packages = catalog?.packages ?? const <ServicePackage>[];
    final serviceTypes = catalog?.types ?? const <ServiceTypeDefinition>[];
    final categories = catalog?.categories ?? const <ServiceCategory>[];

    if (state.filters.term != _controller.text) {
      _controller.text = state.filters.term ?? '';
      _controller.selection = TextSelection.fromPosition(TextPosition(offset: _controller.text.length));
    }

    return RefreshIndicator(  
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: _buildHeader(
                context,
                state,
                controller,
                serviceTypes,
                categories,
              ),
            ),
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
                    if (catalogState.errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          'Unable to refresh service packages: ${catalogState.errorMessage}',
                          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                    if (catalogState.offline)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          'Showing cached service packages while offline.',
                          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ),
                    if (packages.isNotEmpty) ...[
                      Text('Service packages', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: packages
                              .map(
                                (package) => Padding(
                                  padding: const EdgeInsets.only(right: 16),
                                  child: ServicePackageCard(
                                    package: package,
                                    onBook: () => _openBookingSheet(context, catalog, package),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
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
                      Text('Marketplace items', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 16),
                      ...state.marketplaceItems.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: MarketplaceItemCard(item: item),
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

  Widget _buildHeader(
    BuildContext context,
    ExplorerViewState state,
    ExplorerController controller,
    List<ServiceTypeDefinition> serviceTypes,
    List<ServiceCategory> categories,
  ) {
    ServiceTypeDefinition? selectedTypeDefinition;
    if (state.filters.serviceType != null) {
      for (final entry in serviceTypes) {
        if (entry.type == state.filters.serviceType) {
          selectedTypeDefinition = entry;
          break;
        }
      }
    }

    final filteredCategories = selectedTypeDefinition == null
        ? categories
        : categories
            .where((category) => selectedTypeDefinition!.categories.isEmpty || selectedTypeDefinition!.categories.contains(category.slug))
            .toList();

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
        if (serviceTypes.isNotEmpty) ...[
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: _buildFilterChip(
                    context,
                    label: 'All service types',
                    selected: state.filters.serviceType == null,
                    onSelected: () {
                      controller.selectServiceType(null);
                      controller.refresh(bypassCache: true);
                    },
                  ),
                ),
                ...serviceTypes.map(
                  (type) => Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: _buildFilterChip(
                      context,
                      label: type.label,
                      selected: state.filters.serviceType == type.type,
                      onSelected: () {
                        final isSelected = state.filters.serviceType == type.type;
                        controller.selectServiceType(isSelected ? null : type.type);
                        controller.refresh(bypassCache: true);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (filteredCategories.isNotEmpty) ...[
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: _buildFilterChip(
                    context,
                    label: 'All categories',
                    selected: state.filters.category == null,
                    onSelected: () {
                      controller.selectCategory(null);
                      controller.refresh(bypassCache: true);
                    },
                  ),
                ),
                ...filteredCategories.map(
                  (category) => Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: _buildFilterChip(
                      context,
                      label: category.label,
                      selected: state.filters.category == category.slug,
                      onSelected: () {
                        final isSelected = state.filters.category == category.slug;
                        controller.selectCategory(isSelected ? null : category.slug);
                        controller.refresh(bypassCache: true);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
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

  Future<void> _openBookingSheet(BuildContext context, ServiceCatalogSnapshot? catalog, ServicePackage package) async {
    final zones = ref.read(explorerControllerProvider).snapshot?.zones ?? const <ZoneSummary>[];
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => BookingCreationSheet(
        zones: zones,
        categories: catalog?.categories ?? const [],
        serviceTypes: catalog?.types ?? const [],
        packages: catalog?.packages ?? const [],
        catalogue: catalog?.catalogue ?? const [],
        initialCategory: package.serviceCategorySlug,
        initialPackageId: package.id,
        initialServiceId: package.serviceId,
      ),
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
