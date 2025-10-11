import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/domain/user_role.dart';
import '../../explorer/domain/models.dart';
import '../../explorer/presentation/explorer_controller.dart';
import '../domain/booking_models.dart';
import 'booking_controller.dart';
import 'widgets/booking_card.dart';

class BookingScreen extends ConsumerWidget {
  const BookingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);
    final List<ZoneSummary> zones = ref.watch(explorerControllerProvider).snapshot?.zones ?? const [];

    return Scaffold(
      floatingActionButton: state.role == UserRole.customer || state.role == UserRole.enterprise
          ? FloatingActionButton.extended(
              onPressed: () => _openCreationSheet(context, ref, zones),
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

  Future<void> _openCreationSheet(BuildContext context, WidgetRef ref, List<dynamic> zones) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => BookingCreationSheet(zones: zones),
    );
  }
}

class BookingCreationSheet extends ConsumerStatefulWidget {
  const BookingCreationSheet({super.key, required this.zones});

  final List<dynamic> zones;

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

  @override
  void dispose() {
    _customerController.dispose();
    _companyController.dispose();
    _baseAmountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                        child: Text(zone.name ?? zone.id),
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
        metadata: {
          'source': 'mobile_app',
          'createdVia': 'booking_sheet',
        },
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
