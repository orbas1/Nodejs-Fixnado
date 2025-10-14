import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../geo_matching_controller.dart';
import 'geo_zone_builder_card.dart';

class GeoMatchingPanel extends ConsumerStatefulWidget {
  const GeoMatchingPanel({super.key});

  @override
  ConsumerState<GeoMatchingPanel> createState() => _GeoMatchingPanelState();
}

class _GeoMatchingPanelState extends ConsumerState<GeoMatchingPanel> {
  late final TextEditingController _latitudeController;
  late final TextEditingController _longitudeController;
  late final TextEditingController _radiusController;
  late final TextEditingController _limitController;
  late final TextEditingController _categoriesController;

  @override
  void initState() {
    super.initState();
    final state = ref.read(geoMatchingControllerProvider);
    _latitudeController = TextEditingController(text: state.latitude);
    _longitudeController = TextEditingController(text: state.longitude);
    _radiusController = TextEditingController(text: state.radiusKm);
    _limitController = TextEditingController(text: state.limit);
    _categoriesController = TextEditingController(text: state.categories);
  }

  @override
  void dispose() {
    _latitudeController.dispose();
    _longitudeController.dispose();
    _radiusController.dispose();
    _limitController.dispose();
    _categoriesController.dispose();
    super.dispose();
  }

  void _syncControllers(GeoMatchingState state) {
    if (_latitudeController.text != state.latitude) {
      _latitudeController.text = state.latitude;
    }
    if (_longitudeController.text != state.longitude) {
      _longitudeController.text = state.longitude;
    }
    if (_radiusController.text != state.radiusKm) {
      _radiusController.text = state.radiusKm;
    }
    if (_limitController.text != state.limit) {
      _limitController.text = state.limit;
    }
    if (_categoriesController.text != state.categories) {
      _categoriesController.text = state.categories;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(geoMatchingControllerProvider);
    _syncControllers(state);
    final controller = ref.read(geoMatchingControllerProvider.notifier);

    final chips = [
      _DemandChip(
        label: 'High',
        selected: state.demandLevels.contains('high'),
        onSelected: () => controller.toggleDemand('high'),
      ),
      _DemandChip(
        label: 'Medium',
        selected: state.demandLevels.contains('medium'),
        onSelected: () => controller.toggleDemand('medium'),
      ),
      _DemandChip(
        label: 'Low',
        selected: state.demandLevels.contains('low'),
        onSelected: () => controller.toggleDemand('low'),
      ),
    ];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Geo matching pilot',
              style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(height: 8),
            Text(
              'Run the same geo-zonal scoring used on web. Results sync with analytics and booking orchestration.',
              style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _latitudeController,
                    keyboardType: TextInputType.numberWithOptions(decimal: true, signed: true),
                    decoration: const InputDecoration(labelText: 'Latitude'),
                    onChanged: controller.updateLatitude,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _longitudeController,
                    keyboardType: TextInputType.numberWithOptions(decimal: true, signed: true),
                    decoration: const InputDecoration(labelText: 'Longitude'),
                    onChanged: controller.updateLongitude,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _radiusController,
                    keyboardType: TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Radius (km)'),
                    onChanged: controller.updateRadius,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _limitController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Limit'),
                    onChanged: controller.updateLimit,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: chips),
            const SizedBox(height: 12),
            TextField(
              controller: _categoriesController,
              decoration: const InputDecoration(
                labelText: 'Categories (comma-separated)',
                hintText: 'eg. electrical, hvac',
              ),
              onChanged: controller.updateCategories,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: state.isLoading ? null : controller.runMatch,
                    child: state.isLoading
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Match services'),
                  ),
                ),
                const SizedBox(width: 12),
                if (state.errorMessage != null)
                  Expanded(
                    child: Text(
                      state.errorMessage!,
                      style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.error),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (state.result != null)
              _MatchResults(result: state.result!, coverage: state.coverage)
            else if (state.isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            else
              Text(
                'Results appear here once you run a match.',
                style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            const SizedBox(height: 24),
            const GeoZoneBuilderCard(),
          ],
        ),
      ),
    );
  }
}

class _DemandChip extends StatelessWidget {
  const _DemandChip({required this.label, required this.selected, required this.onSelected});

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label, style: GoogleFonts.inter(fontSize: 13)),
      selected: selected,
      onSelected: (_) => onSelected(),
      showCheckmark: false,
      selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.16),
    );
  }
}

class _MatchResults extends StatelessWidget {
  const _MatchResults({required this.result, this.coverage});

  final GeoMatchResult result;
  final Map<String, dynamic>? coverage;

  @override
  Widget build(BuildContext context) {
    final textStyle = GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Matches', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary)),
        const SizedBox(height: 12),
        ...result.matches.map(
          (match) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              color: Theme.of(context).colorScheme.surface,
              border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(match.zoneName, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary)),
                    Chip(
                      label: Text(match.demandLevel.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                      backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(match.reason, style: textStyle),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  children: [
                    Text('Score ${match.score.toStringAsFixed(2)}', style: textStyle),
                    if (match.distanceKm != null)
                      Text('Distance ${match.distanceKm!.toStringAsFixed(1)} km', style: textStyle),
                    Text('Services ${match.services.length}', style: textStyle),
                  ],
                ),
                const SizedBox(height: 12),
                ...match.services.map(
                  (service) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(service.title, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(service.description ?? 'Dispatch-ready programme', style: textStyle),
                    trailing: service.price != null
                        ? Text(
                            '${service.currency ?? 'GBP'} ${service.price!.toStringAsFixed(0)}',
                            style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                          )
                        : null,
                  ),
                ),
              ],
            ),
          ),
        ),
        Text(
          'Audit: ${result.totalServices} services surfaced${result.fallbackReason != null ? ' · ${result.fallbackReason}' : ''}',
          style: textStyle,
        ),
        if (coverage != null) ...[
          const SizedBox(height: 8),
          Text('Coverage preview', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
          const SizedBox(height: 4),
          Text(coverage.toString(), style: textStyle),
        ]
      ],
    );
  }
}
