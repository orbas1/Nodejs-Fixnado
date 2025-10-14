import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../domain/service_catalog_models.dart';
import '../presentation/service_catalog_controller.dart';

class ServiceManagementScreen extends ConsumerWidget {
  const ServiceManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(currentRoleProvider);
    if (role != UserRole.provider) {
      return _AccessGate(role: role.displayName);
    }

    final state = ref.watch(serviceCatalogControllerProvider);
    final controller = ref.read(serviceCatalogControllerProvider.notifier);
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
            if (snapshot.healthMetrics.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                sliver: SliverToBoxAdapter(
                  child: _HealthSection(metrics: snapshot.healthMetrics),
                ),
              ),
            if (snapshot.deliveryBoard.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                sliver: SliverToBoxAdapter(
                  child: _DeliverySection(columns: snapshot.deliveryBoard),
                ),
              ),
            if (snapshot.packages.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                sliver: SliverToBoxAdapter(
                  child: _PackageSection(packages: snapshot.packages),
                ),
              ),
            if (snapshot.categories.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                sliver: SliverToBoxAdapter(
                  child: _CategorySection(categories: snapshot.categories),
                ),
              ),
            if (snapshot.catalogue.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                sliver: SliverToBoxAdapter(
                  child: _CatalogueSection(catalogue: snapshot.catalogue),
                ),
              ),
          ]
          else if (state.errorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _ErrorBanner(message: state.errorMessage!, offline: state.offline),
            )
          else
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: Text('No service data available.')),
            ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.snapshot, required this.loading, required this.offline, required this.errorMessage});

  final ServiceCatalogSnapshot? snapshot;
  final bool loading;
  final bool offline;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final generatedAtLabel = snapshot?.generatedAt != null
        ? DateTimeFormatter.relative(snapshot!.generatedAt)
        : 'Awaiting sync';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Service delivery studio', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Text(
          'Orchestrate packages, catalogue inventory, and live delivery coverage with confidence.',
          style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            Chip(
              backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
              label: Text(
                loading ? 'Refreshing metrics…' : 'Updated $generatedAtLabel',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
              ),
            ),
            if (offline)
              Chip(
                avatar: const Icon(Icons.wifi_off_outlined, size: 16),
                backgroundColor: const Color(0xFFFFF7ED),
                label: Text('Offline snapshot', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            if (errorMessage != null)
              Chip(
                avatar: const Icon(Icons.error_outline, size: 16),
                backgroundColor: const Color(0xFFFFEBEE),
                label: Text('Sync issue detected', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        if (errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: _ErrorBanner(message: errorMessage!, offline: offline),
          ),
      ],
    );
  }
}

class _HealthSection extends StatelessWidget {
  const _HealthSection({required this.metrics});

  final List<ServiceHealthMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Operational health', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: metrics.map((metric) => _HealthCard(metric: metric)).toList(),
        ),
      ],
    );
  }
}

class _HealthCard extends StatelessWidget {
  const _HealthCard({required this.metric});

  final ServiceHealthMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final format = metric.format.toLowerCase();
    final valueLabel = _formatMetricValue(metric);
    final targetLabel = metric.target != null ? _formatMetricTarget(metric) : null;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 320),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(metric.label, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 8),
              Text(valueLabel, style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
              if (metric.caption != null) ...[
                const SizedBox(height: 12),
                Text(metric.caption!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              ],
              if (targetLabel != null) ...[
                const SizedBox(height: 12),
                Text('Target $targetLabel', style: GoogleFonts.ibmPlexMono(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatMetricValue(ServiceHealthMetric metric) {
    switch (metric.format.toLowerCase()) {
      case 'percent':
      case 'percentage':
        return NumberFormat.decimalPercentPattern(decimalDigits: 0).format(metric.value);
      case 'currency':
        return NumberFormat.compactCurrency(symbol: '£').format(metric.value);
      default:
        return NumberFormat.compact().format(metric.value);
    }
  }

  String? _formatMetricTarget(ServiceHealthMetric metric) {
    final target = metric.target;
    if (target == null) {
      return null;
    }

    switch (metric.format.toLowerCase()) {
      case 'percent':
      case 'percentage':
        return NumberFormat.decimalPercentPattern(decimalDigits: 0).format(target);
      case 'currency':
        return NumberFormat.compactCurrency(symbol: '£').format(target);
      default:
        return NumberFormat.compact().format(target);
    }
  }
}

class _DeliverySection extends StatelessWidget {
  const _DeliverySection({required this.columns});

  final List<ServiceDeliveryColumn> columns;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Delivery board', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: columns
                .map(
                  (column) => Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: _DeliveryColumnCard(column: column),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _DeliveryColumnCard extends StatelessWidget {
  const _DeliveryColumnCard({required this.column});

  final ServiceDeliveryColumn column;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 280,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(column.title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                  Chip(
                    label: Text('${column.items.length}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                  ),
                ],
              ),
              if (column.description != null) ...[
                const SizedBox(height: 8),
                Text(column.description!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              ],
              const SizedBox(height: 12),
              if (column.items.isEmpty)
                Text('No engagements in this stage.', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant))
              else
                ...column.items.map((item) => _DeliveryItemCard(item: item)),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeliveryItemCard extends StatelessWidget {
  const _DeliveryItemCard({required this.item});

  final ServiceDeliveryItem item;

  Color _toneColor(BuildContext context) {
    final base = Theme.of(context).colorScheme;
    final risk = item.risk?.toLowerCase() ?? '';
    if (risk.contains('critical') || risk.contains('risk') || risk.contains('breach')) return base.error;
    if (risk.contains('warning') || risk.contains('caution') || risk.contains('watch')) return const Color(0xFFF59E0B);
    return base.primary;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final etaLabel = item.eta != null ? DateTimeFormatter.relative(item.eta!) : 'To be scheduled';
    final tone = _toneColor(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(item.name, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  color: tone.withOpacity(0.12),
                ),
                child: Text(item.risk ?? 'In progress', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: tone)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(item.client, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.access_time, size: 14),
                  const SizedBox(width: 4),
                  Text(etaLabel, style: GoogleFonts.inter(fontSize: 12)),
                ],
              ),
              if (item.zone != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14),
                    const SizedBox(width: 4),
                    Text(item.zone!, style: GoogleFonts.inter(fontSize: 12)),
                  ],
                ),
              if (item.owner != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.person_outline, size: 14),
                    const SizedBox(width: 4),
                    Text(item.owner!, style: GoogleFonts.inter(fontSize: 12)),
                  ],
                ),
              if (item.value != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.attach_money, size: 14),
                    const SizedBox(width: 4),
                    Text(_formatCurrency(item.value, item.currency ?? 'GBP'), style: GoogleFonts.inter(fontSize: 12)),
                  ],
                ),
            ],
          ),
          if (item.services.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: item.services
                  .map(
                    (service) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        color: theme.colorScheme.primary.withOpacity(0.08),
                      ),
                      child: Text(service, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _PackageSection extends StatelessWidget {
  const _PackageSection({required this.packages});

  final List<ServicePackage> packages;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Published packages', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: packages.map((pkg) => _PackageCard(pkg: pkg)).toList(),
        ),
      ],
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.pkg});

  final ServicePackage pkg;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 360),
      child: Card(
        color: theme.colorScheme.primary.withOpacity(0.05),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(pkg.name, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
              const SizedBox(height: 8),
              Text(pkg.description, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              if (pkg.highlights.isNotEmpty)
                ...pkg.highlights.map(
                  (highlight) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text(highlight, style: GoogleFonts.inter(fontSize: 12))),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              if (pkg.price != null)
                Text(_formatCurrency(pkg.price, pkg.currency), style: GoogleFonts.ibmPlexMono(fontSize: 13, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
              if (pkg.serviceName != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('Linked service: ${pkg.serviceName}', style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  const _CategorySection({required this.categories});

  final List<ServiceCategory> categories;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Category coverage', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: categories.map((category) => _CategoryCard(category: category)).toList(),
        ),
      ],
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category});

  final ServiceCategory category;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final performance = category.type.isNotEmpty && category.type.toLowerCase().contains('trade')
        ? Icons.handyman_outlined
        : Icons.auto_graph_outlined;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 340),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(performance, size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(child: Text(category.label, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700))),
                ],
              ),
              const SizedBox(height: 8),
              if (category.description.isNotEmpty)
                Text(category.description, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              Text('${category.activeServices} active services', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
              if (category.defaultTags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: category.defaultTags
                      .take(4)
                      .map(
                        (tag) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(999),
                            color: theme.colorScheme.surfaceVariant,
                          ),
                          child: Text(tag, style: GoogleFonts.inter(fontSize: 11)),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogueSection extends StatelessWidget {
  const _CatalogueSection({required this.catalogue});

  final List<ServiceCatalogueEntry> catalogue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Published services', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: catalogue.map((service) => _CatalogueCard(service: service, theme: theme)).toList(),
        ),
      ],
    );
  }
}

class _CatalogueCard extends StatelessWidget {
  const _CatalogueCard({required this.service, required this.theme});

  final ServiceCatalogueEntry service;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final availabilityDetail = service.availability.detail != null
        ? DateTime.tryParse(service.availability.detail!)
        : null;
    final availabilityLabel = availabilityDetail != null
        ? 'Next availability ${DateTimeFormatter.relative(availabilityDetail)}'
        : service.availability.label;
    final price = _formatCurrency(service.price, service.currency);

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 360),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(service.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
              const SizedBox(height: 8),
              Text(service.description, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              Text(price, style: GoogleFonts.ibmPlexMono(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
              const SizedBox(height: 8),
              Text('${service.category} • ${service.type}', style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 8),
              Text(availabilityLabel, style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
              if (service.tags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: service.tags
                      .take(4)
                      .map(
                        (tag) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(999),
                            color: theme.colorScheme.primary.withOpacity(0.08),
                          ),
                          child: Text(tag, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.offline});

  final String message;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: offline ? const Color(0xFFFFF7ED) : const Color(0xFFFFEBEE),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: offline ? const Color(0xFFFB923C) : theme.colorScheme.error.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Icon(offline ? Icons.wifi_off_outlined : Icons.error_outline, color: theme.colorScheme.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurface),
            ),
          ),
        ],
      ),
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 48),
            const SizedBox(height: 16),
            Text('Restricted workspace', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'This service workspace is only available to provider roles. You are authenticated as $role.',
              style: GoogleFonts.inter(fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

String _formatCurrency(double? value, String currency) {
  if (value == null) {
    return 'Not available';
  }

  try {
    return NumberFormat.simpleCurrency(name: currency).format(value);
  } catch (_) {
    return '${currency.toUpperCase()} ${value.toStringAsFixed(0)}';
  }
}
