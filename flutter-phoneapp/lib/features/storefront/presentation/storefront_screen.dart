import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../domain/storefront_models.dart';
import 'storefront_controller.dart';

class StorefrontScreen extends ConsumerWidget {
  const StorefrontScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storefrontControllerProvider);
    final controller = ref.read(storefrontControllerProvider.notifier);
    final snapshot = state.snapshot;
    final metrics = snapshot?.metrics;
    final company = snapshot?.company;
    final numberFormat = NumberFormat.decimalPattern();
    final currencyFormat = NumberFormat.simpleCurrency(name: 'GBP');

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Escaparate y listados',
          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ),
      body: snapshot == null && state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => controller.refresh(),
              child: CustomScrollView(
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            snapshot == null
                                ? 'Escaparate del marketplace'
                                : '${company?.name ?? 'Proveedor'} · Escaparate del marketplace',
                            style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Controla el estado de tus listados, la salud de cumplimiento y la demanda del marketplace.',
                            style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                          if (snapshot != null) ...[
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: [
                                _metricCard(
                                  context,
                                  icon: Icons.check_circle_outline,
                                  label: 'Listados activos',
                                  value: numberFormat.format(metrics?.activeListings ?? 0),
                                ),
                                _metricCard(
                                  context,
                                  icon: Icons.pending_actions_outlined,
                                  label: 'En revisión',
                                  value: numberFormat.format(metrics?.pendingReview ?? 0),
                                  tone: (metrics?.pendingReview ?? 0) > 0 ? Colors.orange : null,
                                ),
                                _metricCard(
                                  context,
                                  icon: Icons.report_gmailerrorred_outlined,
                                  label: 'Con incidencias',
                                  value: numberFormat.format(metrics?.flagged ?? 0),
                                  tone: (metrics?.flagged ?? 0) > 0 ? Colors.red : null,
                                ),
                                _metricCard(
                                  context,
                                  icon: Icons.trending_up_outlined,
                                  label: 'Conversión',
                                  value: NumberFormat.percentPattern().format(metrics?.conversionRate ?? 0),
                                  caption: 'Solicitudes ${numberFormat.format(metrics?.totalRequests ?? 0)}',
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Icon(
                                  company?.badgeVisible == true
                                      ? Icons.verified_outlined
                                      : Icons.verified_user_outlined,
                                  color: company?.badgeVisible == true
                                      ? Theme.of(context).colorScheme.primary
                                      : Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    company?.badgeVisible == true
                                        ? 'La insignia de vendedor asegurado está visible para los compradores.'
                                        : 'La insignia de vendedor asegurado está oculta para los compradores.',
                                    style: GoogleFonts.inter(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                            if (snapshot.generatedAt != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  'Instantánea generada ${DateTimeFormatter.relative(snapshot.generatedAt)}',
                                  style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                ),
                              ),
                          ],
                          if (state.offline)
                            Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(Icons.offline_pin, color: Colors.orange.shade700),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Mostrando datos en caché del escaparate hasta recuperar la conexión.',
                                        style: GoogleFonts.inter(fontSize: 14, color: Colors.orange.shade700),
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
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  if (snapshot != null)
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Acciones recomendadas',
                              style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 12),
                            if (snapshot.playbooks.isEmpty)
                              Text(
                                'Todos los planes operativos están al día. Continúa impulsando la demanda.',
                                style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                              )
                            else
                              Column(
                                children: snapshot.playbooks
                                    .map((playbook) => _playbookCard(context, playbook))
                                    .toList(),
                              ),
                          ],
                        ),
                      ),
                    ),
                  if (snapshot != null)
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Listados',
                              style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 12),
                            if (snapshot.listings.isEmpty)
                              Text(
                                'No hay listados disponibles en este escaparate.',
                                style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                              )
                            else
                              Column(
                                children: snapshot.listings
                                    .map((listing) => _listingCard(
                                          context,
                                          listing,
                                          numberFormat,
                                          currencyFormat,
                                        ))
                                    .toList(),
                              ),
                          ],
                        ),
                      ),
                    ),
                  if (snapshot != null)
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Registro de actividad',
                              style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 12),
                            if (snapshot.timeline.isEmpty)
                              Text(
                                'No se registraron eventos recientes.',
                                style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                              )
                            else
                              Column(
                                children: snapshot.timeline
                                    .map((event) => _timelineTile(context, event))
                                    .toList(),
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

  Widget _metricCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    String? caption,
    Color? tone,
  }) {
    final color = tone ?? Theme.of(context).colorScheme.primary;
    return Container(
      width: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: color)),
          if (caption != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                caption,
                style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
        ],
      ),
    );
  }

  Widget _playbookCard(BuildContext context, StorefrontPlaybook playbook) {
    final palette = _tonePalette(playbook.tone, context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.bolt_outlined, color: palette.foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(playbook.title, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: palette.foreground)),
                const SizedBox(height: 4),
                Text(playbook.detail, style: GoogleFonts.inter(fontSize: 14, color: palette.foreground)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _listingCard(
    BuildContext context,
    StorefrontListing listing,
    NumberFormat numberFormat,
    NumberFormat currencyFormat,
  ) {
    final palette = _tonePalette(listing.tone, context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(listing.title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface)),
                  if (listing.location != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(listing.location!, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: palette.background,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: palette.border),
                ),
                child: Text(
                  _statusLabel(listing.status),
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: palette.foreground),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 24,
            runSpacing: 12,
            children: [
              _statChip(context, 'Solicitudes', numberFormat.format(listing.requestVolume)),
              _statChip(context, 'Conversión', numberFormat.format(listing.successfulAgreements)),
              _statChip(context, 'Duración media', '${numberFormat.format(listing.averageDurationDays)} días'),
              _statChip(
                context,
                'Ingresos proyectados',
                listing.projectedRevenue != null ? currencyFormat.format(listing.projectedRevenue) : 'Sin datos',
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (listing.insuredOnly)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_outlined, color: Colors.green.shade700, size: 16),
                  const SizedBox(width: 8),
                  Text('Solo vendedores asegurados', style: GoogleFonts.inter(fontSize: 12, color: Colors.green.shade700)),
                ],
              ),
            ),
          if (listing.complianceHoldUntil != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Retención de cumplimiento hasta ${DateTimeFormatter.dayMonth(listing.complianceHoldUntil!)}',
                style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          if (listing.recommendedActions.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Acciones recomendadas', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ...listing.recommendedActions.map(
                    (action) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.bolt_outlined, size: 16, color: _tonePalette(action.tone, context).foreground),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(action.label, style: GoogleFonts.inter(fontSize: 13)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (listing.agreements.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Actividad reciente de alquiler', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ...listing.agreements.map(
                    (agreement) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(agreement.renter ?? 'Cliente del marketplace', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text(
                                '${agreement.pickupAt != null ? DateTimeFormatter.dayMonth(agreement.pickupAt!) : 'Sin fecha'} → '
                                '${agreement.returnDueAt != null ? DateTimeFormatter.dayMonth(agreement.returnDueAt!) : 'Sin fecha'}',
                                style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                          Text(
                            _statusLabel(agreement.status),
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: _tonePalette(agreement.status, context).foreground),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _timelineTile(BuildContext context, StorefrontEvent event) {
    final palette = _tonePalette(event.tone, context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${_statusLabel(event.type)} • ${event.listingTitle}', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: palette.foreground)),
          if (event.actor != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text('por ${event.actor}', style: GoogleFonts.inter(fontSize: 12, color: palette.foreground)),
            ),
          const SizedBox(height: 8),
          Text(event.detail, style: GoogleFonts.inter(fontSize: 13, color: palette.foreground)),
          const SizedBox(height: 8),
          Text(DateTimeFormatter.long(event.timestamp), style: GoogleFonts.inter(fontSize: 11, color: palette.foreground.withOpacity(0.7))),
        ],
      ),
    );
  }

  Widget _statChip(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
      ],
    );
  }

  _TonePalette _tonePalette(String tone, BuildContext context) {
    switch (tone) {
      case 'success':
        return _TonePalette(
          background: Colors.green.shade50,
          border: Colors.green.shade200,
          foreground: Colors.green.shade700,
        );
      case 'warning':
        return _TonePalette(
          background: Colors.orange.shade50,
          border: Colors.orange.shade200,
          foreground: Colors.orange.shade800,
        );
      case 'danger':
        return _TonePalette(
          background: Colors.red.shade50,
          border: Colors.red.shade200,
          foreground: Colors.red.shade700,
        );
      default:
        return _TonePalette(
          background: Theme.of(context).colorScheme.surface,
          border: Theme.of(context).colorScheme.outlineVariant,
          foreground: Theme.of(context).colorScheme.onSurface,
        );
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending_review':
      case 'submitted_for_review':
        return 'En revisión';
      case 'suspended':
        return 'Suspendido';
      case 'rejected':
        return 'Rechazado';
      case 'in_use':
        return 'En uso';
      case 'settled':
        return 'Cerrado';
      case 'pickup_scheduled':
        return 'Recogida programada';
      default:
        return status.replace('_', ' ');
    }
  }
}

class _TonePalette {
  _TonePalette({required this.background, required this.border, required this.foreground});

  final Color background;
  final Color border;
  final Color foreground;
}
