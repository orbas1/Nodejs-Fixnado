import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../data/geo_matching_repository.dart';
import '../geo_matching_controller.dart';

class GeoZoneBuilderCard extends ConsumerStatefulWidget {
  const GeoZoneBuilderCard({super.key});

  @override
  ConsumerState<GeoZoneBuilderCard> createState() => _GeoZoneBuilderCardState();
}

class _GeoZoneBuilderCardState extends ConsumerState<GeoZoneBuilderCard> {
  late final TextEditingController _nameController;
  late final TextEditingController _companyController;
  late final TextEditingController _tagsController;
  late final TextEditingController _notesController;
  final List<List<double>> _points = <List<double>>[];
  bool _saving = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _companyController = TextEditingController();
    _tagsController = TextEditingController();
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _companyController.dispose();
    _tagsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  GeoMatchingState get _geoState => ref.read(geoMatchingControllerProvider);

  Future<void> _addPointDialog({double? latitude, double? longitude}) async {
    final latController = TextEditingController(text: latitude?.toStringAsFixed(6) ?? '');
    final lonController = TextEditingController(text: longitude?.toStringAsFixed(6) ?? '');
    final formKey = GlobalKey<FormState>();

    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add coordinate', style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: latController,
                  decoration: const InputDecoration(labelText: 'Latitude'),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                  validator: (value) {
                    final parsed = double.tryParse(value ?? '');
                    if (parsed == null || parsed.abs() > 90) {
                      return 'Enter a valid latitude';
                    }
                    return null;
                  },
                ),
                TextFormField(
                  controller: lonController,
                  decoration: const InputDecoration(labelText: 'Longitude'),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                  validator: (value) {
                    final parsed = double.tryParse(value ?? '');
                    if (parsed == null || parsed.abs() > 180) {
                      return 'Enter a valid longitude';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () {
                if (!formKey.currentState!.validate()) {
                  return;
                }
                final lat = double.parse(latController.text);
                final lon = double.parse(lonController.text);
                setState(() {
                  _points.add(<double>[lat, lon]);
                  _error = null;
                  _success = null;
                });
                Navigator.of(context).pop();
              },
              child: const Text('Add coordinate'),
            )
          ],
        );
      },
    );
  }

  void _addMatchCoordinate() {
    final lat = double.tryParse(_geoState.latitude);
    final lon = double.tryParse(_geoState.longitude);
    if (lat == null || lon == null) {
      setState(() => _error = 'Set valid latitude and longitude in the geo-matching form first.');
      return;
    }
    setState(() {
      _points.add(<double>[lat, lon]);
      _error = null;
      _success = null;
    });
  }

  List<String> _parseTags() {
    return _tagsController.text
        .split(',')
        .map((entry) => entry.trim())
        .where((entry) => entry.isNotEmpty)
        .toList();
  }

  String? _staticMapUrl() {
    if (_points.length < 3) {
      return null;
    }
    final averageLat = _points.fold<double>(0, (sum, pair) => sum + pair[0]) / _points.length;
    final averageLon = _points.fold<double>(0, (sum, pair) => sum + pair[1]) / _points.length;
    final markerParam = _points.map((pair) => '${pair[0]},${pair[1]}').join('|');
    final pathParam = _points.map((pair) => '${pair[0]},${pair[1]}').join('|');
    return 'https://staticmap.openstreetmap.de/staticmap.php?center=$averageLat,$averageLon&zoom=11&size=600x260&markers=$markerParam&path=color:0x1E3A8A|weight:3|$pathParam&scale=2';
  }

  Future<void> _submit() async {
    if (_points.length < 3) {
      setState(() => _error = 'Add at least three coordinates to form a polygon.');
      return;
    }
    if (_nameController.text.trim().isEmpty || _companyController.text.trim().isEmpty) {
      setState(() => _error = 'Provide both a zone name and a company ID.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });

    try {
      final repository = ref.read(geoMatchingRepositoryProvider);
      final draft = GeoZoneDraft(
        name: _nameController.text.trim(),
        companyId: _companyController.text.trim(),
        demandLevel: 'medium',
        coordinates: _points,
        tags: _parseTags(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );
      final response = await repository.createZone(draft);
      setState(() {
        _success = 'Zone ${response['name'] ?? draft.name} created with OpenStreetMap verification.';
      });
    } catch (error) {
      setState(() {
        _error = 'Unable to publish zone: ${error is Exception ? error.toString() : 'Unknown error'}';
      });
    } finally {
      setState(() {
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final staticMapUrl = _staticMapUrl();

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Author service zone',
              style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: theme.colorScheme.primary),
            ),
            const SizedBox(height: 6),
            Text(
              'Mobile parity for the admin console. Coordinates post to the same API for deterministic launch readiness.',
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Zone name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _companyController,
              decoration: const InputDecoration(labelText: 'Company ID'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _tagsController,
              decoration: const InputDecoration(labelText: 'Operational tags', hintText: 'hvac, solar, standby'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: 'Ops notes'),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                FilledButton.tonal(
                  onPressed: _addMatchCoordinate,
                  child: const Text('Add current match coordinate'),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () => _addPointDialog(),
                  child: const Text('Add coordinate manually'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _points
                  .asMap()
                  .entries
                  .map(
                    (entry) => InputChip(
                      label: Text('Lat ${entry.value[0].toStringAsFixed(4)}, Lon ${entry.value[1].toStringAsFixed(4)}'),
                      onDeleted: () {
                        setState(() {
                          _points.removeAt(entry.key);
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
            if (staticMapUrl != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.network(
                  staticMapUrl,
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) {
                      return child;
                    }
                    return SizedBox(
                      height: 160,
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / (loadingProgress.expectedTotalBytes ?? 1)
                              : null,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.error)),
              ),
            if (_success != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  _success!,
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.primary),
                ),
              ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Publish zone'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
