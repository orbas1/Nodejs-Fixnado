import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/domain/user_role.dart';
import '../../explorer/domain/models.dart';
import '../../explorer/presentation/explorer_controller.dart';
import '../../services/domain/service_catalog_models.dart';
import '../../services/presentation/service_catalog_controller.dart';
import '../domain/booking_models.dart';
import 'booking_controller.dart';
import 'widgets/booking_card.dart';
import 'widgets/booking_creation_sheet.dart';
import 'widgets/review_insights_card.dart';

class BookingScreen extends ConsumerWidget {
  const BookingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);
    final List<ZoneSummary> zones = ref.watch(explorerControllerProvider).snapshot?.zones ?? const [];

    final catalogState = ref.watch(serviceCatalogControllerProvider);
    final ServiceCatalogSnapshot? catalog = catalogState.snapshot;
    final hasReviewInsights =
        catalog?.reviewSummary != null && (catalog?.reviews.isNotEmpty ?? false);
    final reviewAccess = catalog?.reviewAccess;
    final showRestrictedNotice =
        (reviewAccess != null && reviewAccess.granted == false && (catalog?.reviewSummary != null));

    return Scaffold(
      floatingActionButton: state.role == UserRole.customer || state.role == UserRole.enterprise
          ? FloatingActionButton.extended(
              onPressed: () => _openCreationSheet(context, ref, zones, catalog: catalog),
              icon: const Icon(Icons.add),
              label: const Text('New booking'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () async => controller.refresh(),
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Bookings', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                        if (state.lastUpdated != null)
                          Text(
                            'Updated ${DateTimeFormatter.relative(state.lastUpdated!)}',
                            style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _statusChip(context, label: 'All', value: 'all', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _statusChip(context, label: 'Awaiting assignment', value: 'awaiting_assignment', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _statusChip(context, label: 'Scheduled', value: 'scheduled', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _statusChip(context, label: 'In progress', value: 'in_progress', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _statusChip(context, label: 'Completed', value: 'completed', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _statusChip(context, label: 'Disputed', value: 'disputed', state: state, onSelected: controller.updateStatusFilter),
                          const SizedBox(width: 12),
                          _zoneDropdown(context, zones, state.zoneId, controller.updateZoneFilter),
                        ],
                      ),
                    ),
                    if (state.offline)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.wifi_off, color: Colors.orange.shade900),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Working from cached booking data. Some actions are disabled until connectivity resumes.',
                                  style: GoogleFonts.inter(fontSize: 14, color: Colors.orange.shade900),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (state.errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Text(
                          state.errorMessage!,
                          style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                    if (catalogState.errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          'Service catalogue unavailable: ${catalogState.errorMessage}',
                          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                    if (catalogState.offline)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          'Showing cached service catalogue. Some package details may be outdated.',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    if (hasReviewInsights)
                      Padding(
                        padding: const EdgeInsets.only(top: 20),
                        child: ReviewInsightsCard(
                          summary: catalog!.reviewSummary!,
                          reviews: catalog.reviews,
                        ),
                      ),
                    if (!hasReviewInsights && showRestrictedNotice)
                      Padding(
                        padding: const EdgeInsets.only(top: 20),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.2)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.primary),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      reviewAccess?.reason ??
                                          'Sign in with a buyer or enterprise role to view governed reviews.',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: Theme.of(context).colorScheme.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (reviewAccess!.allowedRoles.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(
                                    'Permitted roles: ${reviewAccess.allowedRoles.join(', ')}',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              if (catalog?.reviewSummary != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(
                                    '${catalog!.reviewSummary!.totalReviews} verified reviews available for authorised viewers.',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                  ],
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
            else if (state.filteredBookings.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 80),
                  child: Column(
                    children: [
                      Icon(Icons.assignment_outlined, size: 48, color: Theme.of(context).colorScheme.outline),
                      const SizedBox(height: 12),
                      Text(
                        'No bookings match your filters.',
                        style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
                sliver: SliverList.separated(
                  itemBuilder: (context, index) {
                    final booking = state.filteredBookings[index];
                    return BookingCard(
                      booking: booking,
                      onAdvanceStatus: state.offline
                          ? null
                          : (status) => controller.advanceStatus(booking.id, status, actorId: booking.companyId),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: state.filteredBookings.length,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(BuildContext context, {required String label, required String value, required BookingViewState state, required void Function(String?) onSelected}) {
    final selected = state.statusFilter == value;
    return FilterChip(
      label: Text(label, style: GoogleFonts.inter(fontSize: 14)),
      selected: selected,
      onSelected: (_) => onSelected(value),
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

  Widget _zoneDropdown(BuildContext context, List<ZoneSummary> zones, String? selectedZone, void Function(String?) onSelected) {
    return DropdownButtonHideUnderline(
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: DropdownButton<String?>(
          value: selectedZone,
          hint: Text('All zones', style: GoogleFonts.inter(fontSize: 14)),
          items: [
            const DropdownMenuItem<String?>(value: null, child: Text('All zones')),
            ...zones.map((zone) {
              return DropdownMenuItem<String?>(
                value: zone.id,
                child: Text(zone.name, style: GoogleFonts.inter(fontSize: 14)),
              );
            })
          ],
          onChanged: onSelected,
        ),
      ),
    );
  }

  Future<void> _openCreationSheet(
    BuildContext context,
    WidgetRef ref,
    List<ZoneSummary> zones, {
    ServiceCatalogSnapshot? catalog,
    ServicePackage? initialPackage,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => BookingCreationSheet(
        zones: zones,
        categories: catalog?.categories ?? const [],
        serviceTypes: catalog?.types ?? const [],
        packages: catalog?.packages ?? const [],
        catalogue: catalog?.catalogue ?? const [],
        initialCategory: initialPackage?.serviceCategorySlug,
        initialPackageId: initialPackage?.id,
        initialServiceId: initialPackage?.serviceId,
      ),
    );
  }
}
