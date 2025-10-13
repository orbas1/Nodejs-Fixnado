import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../../explorer/domain/models.dart';
import '../../../services/domain/service_catalog_models.dart';
import '../../domain/booking_models.dart';
import '../booking_controller.dart';

class BookingCreationSheet extends ConsumerStatefulWidget {
  const BookingCreationSheet({
    super.key,
    required this.zones,
    required this.categories,
    required this.serviceTypes,
    required this.packages,
    required this.catalogue,
    this.initialCategory,
    this.initialPackageId,
    this.initialServiceId,
  });

  final List<ZoneSummary> zones;
  final List<ServiceCategory> categories;
  final List<ServiceTypeDefinition> serviceTypes;
  final List<ServicePackage> packages;
  final List<ServiceCatalogueEntry> catalogue;
  final String? initialCategory;
  final String? initialPackageId;
  final String? initialServiceId;

  @override
  ConsumerState<BookingCreationSheet> createState() => _BookingCreationSheetState();
}

class _BookingCreationSheetState extends ConsumerState<BookingCreationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _customerController = TextEditingController();
  final _companyController = TextEditingController();
  final _baseAmountController = TextEditingController(text: '120.00');
  String? _zoneId;
  String _type = 'on_demand';
  DateTime? _start;
  DateTime? _end;
  String? _demandLevel;
  bool _submitting = false;

  String? _serviceType;
  String? _serviceCategory;
  String? _serviceId;
  String? _packageId;

  @override
  void initState() {
    super.initState();
    _serviceCategory = widget.initialCategory;
    _serviceId = widget.initialServiceId;
    _packageId = widget.initialPackageId;

    final package = _findPackage(_packageId);
    final service = _findService(_serviceId) ?? (package?.serviceId != null ? _findService(package!.serviceId) : null);

    _serviceType = package?.serviceType ?? service?.type;
    _serviceCategory = package?.serviceCategorySlug ?? _serviceCategory ?? service?.categorySlug;
    _serviceId = service?.id;

    if ((package?.price ?? service?.price) != null) {
      _baseAmountController.text = (package?.price ?? service?.price)!.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _customerController.dispose();
    _companyController.dispose();
    _baseAmountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final availableCategories = _filteredCategories();
    final availableServices = _filteredServices();
    final availablePackages = _filteredPackages();

    final selectedPackage = _findPackage(_packageId);

    return Padding(
      padding: MediaQuery.of(context).viewInsets,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Create booking', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                  IconButton(onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Zone'),
                value: _zoneId,
                items: widget.zones
                    .map(
                      (zone) => DropdownMenuItem<String>(
                        value: zone.id,
                        child: Text(zone.name),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _zoneId = value),
                validator: (value) => value == null ? 'Select a zone' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _customerController,
                decoration: const InputDecoration(labelText: 'Customer ID'),
                validator: (value) => value == null || value.isEmpty ? 'Enter a customer ID' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyController,
                decoration: const InputDecoration(labelText: 'Company ID'),
                validator: (value) => value == null || value.isEmpty ? 'Enter a company ID' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                decoration: const InputDecoration(labelText: 'Service type'),
                value: _serviceType,
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('All service types')),
                  ...widget.serviceTypes.map(
                    (entry) => DropdownMenuItem<String?>(
                      value: entry.type,
                      child: Text(entry.label),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() {
                  _serviceType = value;
                  if (value == null) {
                    return;
                  }
                  final type = widget.serviceTypes.firstWhere(
                    (entry) => entry.type == value,
                    orElse: () => ServiceTypeDefinition(type: value, label: value, description: '', categories: const []),
                  );
                  if (!type.categories.contains(_serviceCategory)) {
                    _serviceCategory = null;
                  }
                  if (_serviceId != null) {
                    final service = _findService(_serviceId);
                    if (service == null || service.type != value) {
                      _serviceId = null;
                    }
                  }
                  if (_packageId != null) {
                    final package = _findPackage(_packageId);
                    if (package == null || package.serviceType != value) {
                      _packageId = null;
                    }
                  }
                }),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                decoration: const InputDecoration(labelText: 'Service category'),
                value: _serviceCategory,
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('All categories')),
                  ...availableCategories.map(
                    (category) => DropdownMenuItem<String?>(
                      value: category.slug,
                      child: Text(category.label),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() {
                  _serviceCategory = value;
                  if (_serviceId != null) {
                    final service = _findService(_serviceId);
                    if (service == null || (value != null && service.categorySlug != value)) {
                      _serviceId = null;
                    }
                  }
                  if (_packageId != null) {
                    final package = _findPackage(_packageId);
                    if (package == null || (value != null && package.serviceCategorySlug != value)) {
                      _packageId = null;
                    }
                  }
                }),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                decoration: const InputDecoration(labelText: 'Service (optional)'),
                value: _serviceId,
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('Select service')),
                  ...availableServices.map(
                    (service) => DropdownMenuItem<String?>(
                      value: service.id,
                      child: Text(service.name),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() {
                  _serviceId = value;
                  final service = _findService(value);
                  if (service != null) {
                    _serviceType = service.type;
                    _serviceCategory = service.categorySlug;
                    if (service.price != null) {
                      _baseAmountController.text = service.price!.toStringAsFixed(2);
                    }
                  }
                }),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                decoration: const InputDecoration(labelText: 'Service package (optional)'),
                value: _packageId,
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('No package selected')),
                  ...availablePackages.map(
                    (pkg) => DropdownMenuItem<String?>(
                      value: pkg.id,
                      child: Text(pkg.name),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() {
                  _packageId = value;
                  final package = _findPackage(value);
                  if (package != null) {
                    _serviceType = package.serviceType ?? _serviceType;
                    _serviceCategory = package.serviceCategorySlug ?? _serviceCategory;
                    _serviceId = package.serviceId ?? _serviceId;
                    if (package.price != null) {
                      _baseAmountController.text = package.price!.toStringAsFixed(2);
                    }
                  }
                }),
              ),
              if (selectedPackage?.highlights.isNotEmpty == true) ...[
                const SizedBox(height: 12),
                Text('Package highlights', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...selectedPackage!.highlights.map(
                  (highlight) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.star_outline, size: 18),
                        const SizedBox(width: 8),
                        Expanded(child: Text(highlight, style: GoogleFonts.inter(fontSize: 13))),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextFormField(
                controller: _baseAmountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Quoted amount (GBP)'),
                validator: (value) => value == null || value.isEmpty ? 'Enter base amount' : null,
              ),
              const SizedBox(height: 16),
              Text('Booking type', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
              Row(
                children: [
                  Radio<String>(
                    value: 'on_demand',
                    groupValue: _type,
                    onChanged: (value) => setState(() => _type = value!),
                  ),
                  const Text('On-demand'),
                  const SizedBox(width: 12),
                  Radio<String>(
                    value: 'scheduled',
                    groupValue: _type,
                    onChanged: (value) => setState(() => _type = value!),
                  ),
                  const Text('Scheduled'),
                ],
              ),
              if (_type == 'scheduled') ...[
                const SizedBox(height: 12),
                _DateField(
                  label: 'Start window',
                  value: _start,
                  onChanged: (value) => setState(() => _start = value),
                ),
                const SizedBox(height: 12),
                _DateField(
                  label: 'End window',
                  value: _end,
                  onChanged: (value) => setState(() => _end = value),
                ),
              ],
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Demand level'),
                value: _demandLevel,
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('Low')),
                  DropdownMenuItem(value: 'medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'high', child: Text('High')),
                ],
                onChanged: (value) => setState(() => _demandLevel = value),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : () => _submit(ref),
                  child: _submitting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Create booking'),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(WidgetRef ref) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_type == 'scheduled' && (_start == null || _end == null || _end!.isBefore(_start!))) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Provide a valid schedule window.')));
      return;
    }

    setState(() => _submitting = true);
    try {
      final service = _findService(_serviceId);
      final package = _findPackage(_packageId);
      final category = _findCategory(_serviceCategory);
      final serviceType = _findServiceType(_serviceType);

      final metadata = <String, dynamic>{
        'source': 'mobile_app',
        'createdVia': 'booking_sheet',
        if (_serviceType != null && _serviceType!.isNotEmpty) 'serviceType': _serviceType,
        if (serviceType != null) 'serviceTypeLabel': serviceType.label,
        if (_serviceCategory != null && _serviceCategory!.isNotEmpty) 'serviceCategory': _serviceCategory,
        if (category != null) 'serviceCategoryLabel': category.label,
        if (service != null) ...{
          'serviceId': service.id,
          'serviceName': service.name,
          'serviceCategoryLabel': service.category,
          'serviceTags': service.tags,
          'serviceCoverage': service.coverage,
          'serviceCurrency': service.currency,
        },
        if (package != null) ...{
          'servicePackageId': package.id,
          'servicePackageName': package.name,
          'servicePackageHighlights': package.highlights,
          'servicePackagePrice': package.price,
          'servicePackageCurrency': package.currency,
          if (package.serviceName != null) 'servicePackageServiceName': package.serviceName,
        },
      };

      final request = CreateBookingRequest(
        customerId: _customerController.text.trim(),
        companyId: _companyController.text.trim(),
        zoneId: _zoneId!,
        type: _type,
        currency: 'GBP',
        baseAmount: double.parse(_baseAmountController.text.trim()),
        demandLevel: _demandLevel,
        scheduledStart: _type == 'scheduled' ? _start : null,
        scheduledEnd: _type == 'scheduled' ? _end : null,
        metadata: metadata,
      );
      final booking = await ref.read(bookingControllerProvider.notifier).createBooking(request);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking ${booking.id.substring(0, 6)} created.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create booking: $error')),
      );
      setState(() => _submitting = false);
    }
  }

  ServiceCatalogueEntry? _findService(String? id) {
    if (id == null) return null;
    for (final service in widget.catalogue) {
      if (service.id == id) {
        return service;
      }
    }
    return null;
  }

  ServicePackage? _findPackage(String? id) {
    if (id == null) return null;
    for (final package in widget.packages) {
      if (package.id == id) {
        return package;
      }
    }
    return null;
  }

  ServiceCategory? _findCategory(String? slug) {
    if (slug == null) return null;
    for (final category in widget.categories) {
      if (category.slug == slug) {
        return category;
      }
    }
    return null;
  }

  ServiceTypeDefinition? _findServiceType(String? type) {
    if (type == null) return null;
    for (final entry in widget.serviceTypes) {
      if (entry.type == type) {
        return entry;
      }
    }
    return null;
  }

  List<ServiceCategory> _filteredCategories() {
    if (_serviceType == null || _serviceType!.isEmpty) {
      return widget.categories;
    }
    final type = _findServiceType(_serviceType);
    if (type == null || type.categories.isEmpty) {
      return widget.categories;
    }
    final allowed = type.categories.toSet();
    return widget.categories.where((category) => allowed.contains(category.slug)).toList();
  }

  List<ServiceCatalogueEntry> _filteredServices() {
    return widget.catalogue.where((service) {
      final matchesType = _serviceType == null || _serviceType!.isEmpty || service.type == _serviceType;
      final matchesCategory = _serviceCategory == null || _serviceCategory!.isEmpty || service.categorySlug == _serviceCategory;
      return matchesType && matchesCategory;
    }).toList();
  }

  List<ServicePackage> _filteredPackages() {
    return widget.packages.where((package) {
      final matchesType = _serviceType == null || _serviceType!.isEmpty || package.serviceType == null || package.serviceType == _serviceType;
      final matchesCategory =
          _serviceCategory == null || _serviceCategory!.isEmpty || package.serviceCategorySlug == null || package.serviceCategorySlug == _serviceCategory;
      return matchesType && matchesCategory;
    }).toList();
  }
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value, required this.onChanged});

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  @override
  Widget build(BuildContext context) {
    final display = value == null ? 'Select date' : DateTimeFormatter.full(value!);
    return OutlinedButton(
      onPressed: () async {
        final now = DateTime.now();
        final selected = await showDatePicker(
          context: context,
          initialDate: value ?? now,
          firstDate: now.subtract(const Duration(days: 1)),
          lastDate: now.add(const Duration(days: 365)),
        );
        if (selected == null) {
          return;
        }
        final time = await showTimePicker(
          context: context,
          initialTime: const TimeOfDay(hour: 9, minute: 0),
        );
        if (time == null) {
          return;
        }
        final dateTime = DateTime(selected.year, selected.month, selected.day, time.hour, time.minute);
        onChanged(dateTime.toUtc());
      },
      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), alignment: Alignment.centerLeft),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$label: $display', style: GoogleFonts.inter(fontSize: 14)),
          const Icon(Icons.calendar_today_outlined),
        ],
      ),
    );
  }
}
